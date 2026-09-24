const express = require('express');
const path = require('path');
const fs = require('fs');
const pool = require('../db/connection');
const { generatePDF } = require('../services/pdfService');
const { generatePITemplate } = require('../templates/piTemplate');
const { generateCITemplate } = require('../templates/ciTemplate');
const { generatePLTemplate } = require('../templates/plTemplate');
const { generateCOATemplate } = require('../templates/coaTemplate');
const { generateCCVOTemplate } = require('../templates/ccvoTemplate');
const { generateBCTemplate } = require('../templates/bcTemplate');
const { generateMFGTemplate } = require('../templates/mfgTemplate');
const { generateSCOMETTemplate } = require('../templates/scometTemplate');
const { generateFormSDFTemplate } = require('../templates/formSdfTemplate');
const { generateEUCTemplate } = require('../templates/eucTemplate');
const { generateAnnexureATemplate } = require('../templates/annexureATemplate');
const { generateAnnexureCTemplate } = require('../templates/annexureCTemplate');
const { generateDGDTemplate } = require('../templates/dgdTemplate');
const { generateVGMTemplate } = require('../templates/vgmTemplate');
const { generateBLDraftTemplate } = require('../templates/blDraftTemplate');

const UNSUPPORTED_DOCUMENT_TYPES = new Set(['CL_COURIER', 'BANK_STICKER']);
const router = express.Router();

/**
 * Ensure directory exists, create recursively if not
 */
function ensureDir(dirPath) {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }
}

/**
 * Get client folder path for saving PDFs
 */
async function getClientFolder(clientId, companyId) {
    const [clients] = await pool.query('SELECT folder_path FROM clients WHERE id = ?', [clientId]);
    if (clients.length > 0 && clients[0].folder_path) {
        return clients[0].folder_path;
    }
    // Fallback: create from company/client names
    const [companies] = await pool.query('SELECT name FROM companies WHERE id = ?', [companyId]);
    const [clientData] = await pool.query('SELECT name FROM clients WHERE id = ?', [clientId]);
    const storagePath = process.env.STORAGE_PATH || 'D:/Export software/storage';
    const companyFolder = (companies[0]?.name || 'Company').replace(/[^a-zA-Z0-9\s]/g, '').trim();
    const clientFolder = (clientData[0]?.name || 'Client').replace(/[^a-zA-Z0-9\s]/g, '').trim();
    return path.join(storagePath, companyFolder, clientFolder);
}

/**
 * Save PDF to client folder and return the file path
 */
function savePDFToFolder(folderPath, filename, pdfBuffer) {
    ensureDir(folderPath);
    // Sanitize filename - remove characters that are invalid in file names
    const safeFilename = filename.replace(/[\/\\:*?"<>|]/g, '-');
    const filePath = path.join(folderPath, safeFilename);
    fs.writeFileSync(filePath, Buffer.from(pdfBuffer));
    return filePath;
}

/**
 * GET /api/pdf/pi/:piId - Generate PI PDF, save to folder, and return to browser
 */
router.get('/pi/:piId', async (req, res) => {
    try {
        const [pis] = await pool.query(
            `SELECT pi.*, c.name as client_name, c.address as client_address,
                    comp.name as company_name, comp.address as company_address,
                    comp.director_name,
                    ba.bank_name, ba.account_name, ba.account_no, ba.swift_code, ba.branch_address
             FROM proforma_invoices pi
             JOIN clients c ON pi.client_id = c.id
             JOIN companies comp ON pi.company_id = comp.id
             LEFT JOIN company_bank_accounts ba ON pi.company_bank_id = ba.id
             WHERE pi.id = ?`,
            [req.params.piId]
        );

        if (pis.length === 0) {
            return res.status(404).json({ error: 'PI not found.' });
        }

        const piData = pis[0];
        const html = generatePITemplate(piData);
        const pdfBuffer = await generatePDF(html, {
            marginTop: '5mm',
            marginBottom: '5mm',
            marginLeft: '8mm',
            marginRight: '8mm'
        });

        const filename = `PI_${String(piData.pi_number).padStart(3, '0')}_${piData.financial_year}.pdf`;

        // Save to client folder
        const clientFolder = await getClientFolder(piData.client_id, piData.company_id);
        const savedPath = savePDFToFolder(clientFolder, filename, pdfBuffer);
        console.log(`PDF saved: ${savedPath}`);

        // Also return to browser
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
        res.setHeader('Content-Length', pdfBuffer.length);
        res.setHeader('X-PDF-Path', savedPath);
        res.end(Buffer.from(pdfBuffer));
    } catch (error) {
        console.error('Generate PI PDF error:', error);
        res.status(500).json({ error: 'Failed to generate PDF.' });
    }
});

/**
 * GET /api/pdf/master/:masterId/:docType - Generate document PDF from Master data
 */
router.get('/master/:masterId/:docType', async (req, res) => {
    try {
        const { masterId, docType } = req.params;
        if (UNSUPPORTED_DOCUMENT_TYPES.has(docType)) {
            return res.status(400).json({ error: 'Unsupported document type.' });
        }

        // Get full master data
        const [masters] = await pool.query(
            `SELECT m.*, c.name as client_name, c.address as client_address,
                    c.registration_no, c.contact_person, c.contact_email, c.contact_mobile,
                    comp.name as company_name, comp.address as company_address, comp.city as company_city,
                    comp.iec_no, comp.gst_no, comp.cin_no, comp.lut_arn_no as company_lut_arn,
                    comp.director_name, comp.director_contact, comp.ssp_no,
                    comp.range_name, comp.division, comp.commissionerate,
                    m.invoice_no AS pi_number,
                    m.master_financial_year AS financial_year,
                    m.invoice_date AS pi_date,
                    NULL AS pi_delivery_date,
                    m.net_weight AS pi_net_weight,
                    m.tare_weight AS pi_tare_weight,
                    m.bag_no_from AS pi_bag_no,
                    ba.bank_name as ba_bank_name, ba.account_name as ba_account_name,
                    ba.account_no as ba_account_no, ba.swift_code as ba_swift_code, ba.branch_address as ba_branch_address
             FROM masters m
             LEFT JOIN clients c ON m.client_id = c.id
             JOIN companies comp ON m.company_id = comp.id
             LEFT JOIN company_bank_accounts ba ON m.company_bank_id = ba.id
             WHERE m.id = ?`,
            [masterId]
        );

        if (masters.length === 0) {
            return res.status(404).json({ error: 'Master not found.' });
        }

        const masterData = masters[0];

        // Get containers
        const [containers] = await pool.query(
            'SELECT * FROM containers WHERE master_id = ? ORDER BY sequence_no',
            [masterId]
        );
        for (let container of containers) {
            const [products] = await pool.query(
                'SELECT * FROM container_products WHERE container_id = ?',
                [container.id]
            );
            container.products = products;
        }
        masterData.containers = containers;

        // Get COA tests
        const [coaTests] = await pool.query(
            'SELECT * FROM coa_tests WHERE master_id = ? ORDER BY sort_order',
            [masterId]
        );
        masterData.coa_tests = coaTests;

        // Generate based on document type
        let html, filename;

        switch (docType) {
            case 'PI': {
                const [piOverrides] = await pool.query(
                    'SELECT field_key, field_value FROM document_overrides WHERE master_id = ? AND document_type = ?',
                    [masterId, 'PI']
                );
                piOverrides.forEach(r => { masterData['pi_' + r.field_key] = r.field_value; });
                html = generatePITemplate({
                    ...masterData,
                    bank_name: masterData.ba_bank_name || masterData.bank_name,
                    account_no: masterData.ba_account_no || masterData.account_no,
                    swift_code: masterData.ba_swift_code || masterData.swift_code,
                    branch_address: masterData.ba_branch_address || masterData.branch
                });
                filename = `PI_${masterData.pi_number || masterData.invoice_no || masterData.id}_${masterData.financial_year || masterData.master_financial_year || 'draft'}.pdf`;
                break;
            }
            case 'MASTER_FORM':
                const { generateMasterFormTemplate } = require('../templates/masterFormTemplate');
                html = generateMasterFormTemplate(masterData);
                filename = `MASTER_${masterData.invoice_no || masterData.id}.pdf`;
                break;
            case 'CI':
                html = generateCITemplate(masterData);
                filename = `CI_${masterData.ci_invoice_no || masterData.invoice_no || masterData.id}_${masterData.master_financial_year || ''}.pdf`;
                break;
            case 'PL':
                html = generatePLTemplate(masterData);
                filename = `PL_${masterData.ci_invoice_no || masterData.invoice_no || masterData.id}_${masterData.master_financial_year || ''}.pdf`;
                break;
            case 'COA':
                html = generateCOATemplate(masterData);
                filename = `COA_${masterData.ci_invoice_no || masterData.invoice_no || masterData.id}_${masterData.master_financial_year || ''}.pdf`;
                break;
            case 'CCVO':
                const [ccvoOverrides] = await pool.query(
                    'SELECT field_key, field_value FROM document_overrides WHERE master_id = ? AND document_type = ?',
                    [masterId, 'CCVO']
                );
                ccvoOverrides.forEach(r => { masterData['ccvo_' + r.field_key] = r.field_value; });
                html = generateCCVOTemplate(masterData);
                filename = `CCVO_${masterData.ci_invoice_no || masterData.invoice_no || masterData.id}_${masterData.master_financial_year || ''}.pdf`;
                break;
            case 'BC':
                // Fetch overrides for BC
                const [bcOverrides] = await pool.query(
                    'SELECT field_key, field_value FROM document_overrides WHERE master_id = ? AND document_type = ?',
                    [masterId, 'BC']
                );
                bcOverrides.forEach(r => { masterData['bc_' + r.field_key] = r.field_value; });
                html = generateBCTemplate(masterData);
                filename = `BC_${masterData.ci_invoice_no || masterData.invoice_no || masterData.id}_${masterData.master_financial_year || ''}.pdf`;
                break;
            case 'MFG_CERTI':
                const [mfgOverrides] = await pool.query(
                    'SELECT field_key, field_value FROM document_overrides WHERE master_id = ? AND document_type = ?',
                    [masterId, 'MFG_CERTI']
                );
                mfgOverrides.forEach(r => { masterData['mfg_' + r.field_key] = r.field_value; });
                html = generateMFGTemplate(masterData);
                filename = `MFG_CERTI_${masterData.ci_invoice_no || masterData.invoice_no || masterData.id}_${masterData.master_financial_year || ''}.pdf`;
                break;
            case 'SCOMET':
                const [scometOverrides] = await pool.query(
                    'SELECT field_key, field_value FROM document_overrides WHERE master_id = ? AND document_type = ?',
                    [masterId, 'SCOMET']
                );
                scometOverrides.forEach(r => { masterData['scomet_' + r.field_key] = r.field_value; });
                html = generateSCOMETTemplate(masterData);
                filename = `SCOMET_${masterData.ci_invoice_no || masterData.invoice_no || masterData.id}_${masterData.master_financial_year || ''}.pdf`;
                break;
            case 'FORM_SDF':
                const [sdfOverrides] = await pool.query(
                    'SELECT field_key, field_value FROM document_overrides WHERE master_id = ? AND document_type = ?',
                    [masterId, 'FORM_SDF']
                );
                sdfOverrides.forEach(r => { masterData['sdf_' + r.field_key] = r.field_value; });
                html = generateFormSDFTemplate(masterData);
                filename = `FORM_SDF_${masterData.shipping_bill_no || masterData.id}.pdf`;
                break;
            case 'EUC':
                const [eucOverrides] = await pool.query(
                    'SELECT field_key, field_value FROM document_overrides WHERE master_id = ? AND document_type = ?',
                    [masterId, 'EUC']
                );
                eucOverrides.forEach(r => { masterData['euc_' + r.field_key] = r.field_value; });
                html = generateEUCTemplate(masterData);
                filename = `EUC_${masterData.ci_invoice_no || masterData.invoice_no || masterData.id}.pdf`;
                break;
            case 'ANNEXURE_A':
                const [annexaOverrides] = await pool.query(
                    'SELECT field_key, field_value FROM document_overrides WHERE master_id = ? AND document_type = ?',
                    [masterId, 'ANNEXURE_A']
                );
                annexaOverrides.forEach(r => { masterData['annexa_' + r.field_key] = r.field_value; });
                html = generateAnnexureATemplate(masterData);
                filename = `ANNEXURE_A_${masterData.shipping_bill_no || masterData.id}.pdf`;
                break;
            case 'ANNEXURE_C':
                const [annexcOverrides] = await pool.query(
                    'SELECT field_key, field_value FROM document_overrides WHERE master_id = ? AND document_type = ?',
                    [masterId, 'ANNEXURE_C']
                );
                annexcOverrides.forEach(r => { masterData['annexc_' + r.field_key] = r.field_value; });
                html = generateAnnexureCTemplate(masterData);
                filename = `ANNEXURE_C_${masterData.shipping_bill_no || masterData.id}.pdf`;
                break;
            case 'DGD':
                const [dgdOverrides] = await pool.query(
                    'SELECT field_key, field_value FROM document_overrides WHERE master_id = ? AND document_type = ?',
                    [masterId, 'DGD']
                );
                dgdOverrides.forEach(r => { masterData['dgd_' + r.field_key] = r.field_value; });
                html = generateDGDTemplate(masterData);
                filename = `DGD_${masterData.booking_no || masterData.ci_invoice_no || masterData.invoice_no || masterData.id}.pdf`;
                break;
            case 'BL_DRAFT': {
                const [blOverrides] = await pool.query(
                    'SELECT field_key, field_value FROM document_overrides WHERE master_id = ? AND document_type = ?',
                    [masterId, 'BL_DRAFT']
                );
                blOverrides.forEach(r => { masterData['bl_' + r.field_key] = r.field_value; });
                html = generateBLDraftTemplate(masterData);
                filename = `BL_DRAFT_${masterData.bill_of_lading_no || masterData.ci_invoice_no || masterData.invoice_no || masterData.id}.pdf`;
                break;
            }
            case 'VGM': {
                const containerId = req.query.container_id;
                if (!containerId) {
                    return res.status(400).json({ error: 'container_id query parameter is required for VGM.' });
                }
                const vgmContainer = containers.find(c => String(c.id) === String(containerId));
                if (!vgmContainer) {
                    return res.status(404).json({ error: 'Container not found for this master.' });
                }
                const [vgmOverrides] = await pool.query(
                    'SELECT field_key, field_value FROM document_overrides WHERE master_id = ? AND document_type = ?',
                    [masterId, 'VGM']
                );
                vgmOverrides.forEach(r => { masterData['vgm_' + r.field_key] = r.field_value; });
                // IEC is linked from Annexure C
                const [annexcIec] = await pool.query(
                    'SELECT field_value FROM document_overrides WHERE master_id = ? AND document_type = ? AND field_key = ?',
                    [masterId, 'ANNEXURE_C', 'iec_no']
                );
                if (annexcIec.length > 0) masterData.annexc_iec_no = annexcIec[0].field_value;
                masterData.vgm_container = vgmContainer;
                html = generateVGMTemplate(masterData);
                filename = `VGM_${vgmContainer.container_no || vgmContainer.id}.pdf`;
                break;
            }
            // TODO: Add other document types (CI, PL, COA, CCVO, BC, etc.)
            default:
                return res.status(400).json({ error: `Document type '${docType}' is not yet implemented.` });
        }

        const pdfBuffer = await generatePDF(html, {
            marginTop: '5mm',
            marginBottom: '5mm',
            marginLeft: '8mm',
            marginRight: '8mm'
        });

        // Save to master folder
        let savedPath = '';
        if (masterData.master_folder_path) {
            savedPath = savePDFToFolder(masterData.master_folder_path, filename, pdfBuffer);
            console.log(`PDF saved: ${savedPath}`);
        }

        // Also return to browser
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
        res.end(pdfBuffer);
    } catch (error) {
        console.error('Generate PDF error:', error);
        res.status(500).json({ error: 'Failed to generate PDF.' });
    }
});

module.exports = router;
