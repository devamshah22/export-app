const express = require('express');
const path = require('path');
const fs = require('fs');
const pool = require('../db/connection');
const { amountToWords } = require('../utils/numberToWords');
const { getCurrentFinancialYear } = require('../utils/financialYear');
const {
    withTransaction,
    claimMasterVersion
} = require('../utils/masterConcurrency');

const router = express.Router();

const MASTER_FIELDS = [
    'client_id', 'consignor_name', 'consignor_address', 'buyer_name', 'buyer_address',
    'invoice_no', 'invoice_date', 'po_no', 'po_date', 'other_ref', 'lut_arn_no',
    'ci_invoice_no', 'ci_invoice_date', 'port_of_loading', 'port_of_discharge',
    'country_of_origin', 'country_of_discharge', 'country_of_supply', 'shipment_date',
    'vessel_no', 'bill_of_lading_no', 'shipping_bill_no', 'shipping_bill_date',
    'consignee_name', 'consignee_address', 'currency', 'incoterms', 'payment_terms',
    'issuing_bank', 'lc_no_and_date', 'freight_terms', 'account_name', 'bank_name',
    'account_no', 'swift_code', 'branch', 'fob_amount', 'freight_amount', 'total_amount',
    'product_name', 'hs_code', 'description', 'packing_type', 'bag_weight', 'tare_weight',
    'total_quantity', 'total_packages', 'per_fcl_packages', 'unit_1', 'unit_2', 'uom',
    'unit_rate', 'lot_no', 'bag_no_from', 'bag_no_to', 'total_gross_weight', 'net_weight',
    'nett_weight', 'company_bank_id', 'booking_no', 'un_number', 'imdg_class',
    'packing_group', 'marine_pollutant', 'flash_point', 'ems_code', 'proper_shipping_name',
    'un_packaging_code', 'mfg_date', 'expiry_date', 'application', 'terms_conditions',
    'container_goods_description', 'bc_declaration_1', 'bc_declaration_2',
    'bc_declaration_3', 'bc_issued_by', 'status'
];

const CONTAINER_FIELDS = [
    'container_no', 'truck_no', 'liner_seal_no', 'rfid_seal_no', 'container_size',
    'tare_weight', 'gross_weight', 'max_permissible_weight', 'weighbridge_name',
    'weighing_method', 'verified_gross_mass', 'verified_gross_mass_unit', 'weighing_date',
    'weighing_time', 'weighing_slip_no', 'cargo_type'
];

const DOCUMENT_TYPES = new Set([
    'BL_DRAFT', 'CI', 'PL', 'COA', 'CCVO', 'BC', 'MFG_CERTI', 'SCOMET',
    'FORM_SDF', 'EUC', 'ANNEXURE_A', 'ANNEXURE_C', 'DGD', 'VGM', 'PI'
]);

const ORDER_DOCUMENT_TYPES = new Set([
    'BL_DRAFT', 'CI', 'PL', 'COA', 'CCVO', 'BC', 'MFG_CERTI', 'SCOMET',
    'FORM_SDF', 'EUC', 'ANNEXURE_A', 'ANNEXURE_C', 'DGD', 'VGM'
]);

// Override names are part of each document contract. Keeping this allowlist on
// the server prevents arbitrary columns/metadata from entering generated PDFs.
const OVERRIDE_FIELDS = Object.freeze({
    PI: new Set(['delivery_date', 'bag_no', 'ref']),
    CCVO: new Set(['declaration_origin', 'declaration_value']),
    BC: new Set(['declaration_1', 'declaration_2', 'declaration_3', 'issued_by']),
    MFG_CERTI: new Set(['certify_text', 'goods_description']),
    SCOMET: new Set(['subject', 'description', 'sr_no', 'request']),
    FORM_SDF: new Set(['decl_1_main', 'decl_1a', 'decl_1b', 'decl_2', 'decl_3', 'caution']),
    EUC: new Set(['application', 'declaration_1']),
    ANNEXURE_A: new Set(['nature', 'method', 'related', 'price', 'prev_exports', 'other_info', 'decl_1', 'decl_2', 'place']),
    ANNEXURE_C: new Set(['range', 'division', 'commissionerate', 'iec_no', 'description_value_match', 'sample_drawn', 'self_sealing_permission', 'certification']),
    DGD: new Set([
        'transport_document_no', 'shipper_reference', 'freight_forwarder_reference', 'carrier',
        'additional_handling', 'limitation', 'vessel_voyage', 'declaration', 'technical_name',
        'sub_risk', 'outer_packaging', 'ems_code', 'imo_label', 'mfag_number', 'reefer_details',
        'boiling_point', 'limited_quantity', 'emergency_contact', 'poisonous_inhalation_hazard',
        'packing_certificate', 'receiving_receipt', 'company_declarant', 'company_place',
        'haulier_declarant', 'haulier_place', 'haulier_date'
    ]),
    BL_DRAFT: new Set([
        'consignee_source', 'notify_party_source', 'notify_telephone', 'notify_email', 'notify_fax',
        'forwarding_details', 'place_of_delivery', 'form_m_no', 'lc_no_and_date', 'freight',
        'movement', 'total_containers', 'marks_and_numbers', 'container_gross_weight',
        'container_net_weight', 'packages_per_container', 'remarks'
    ]),
    VGM: new Set(['authorized_official', 'contact_details']),
    COA: new Set(),
    CI: new Set(['vessel_no']),
    PL: new Set()
});

function httpError(status, message) {
    const error = new Error(message);
    error.status = status;
    return error;
}

async function sendError(res, error, label) {
    if (error.status) {
        const body = { error: error.message };
        if (error.status === 409 && error.masterId) {
            try {
                body.master = await loadMaster(pool, error.masterId);
                body.version = body.master.version;
            } catch (loadError) {
                // Keep conflict classification and known token even if canonical reload fails.
                body.version = error.currentVersion;
                console.error(`${label} failed to load conflict state:`, loadError);
            }
        }
        return res.status(error.status).json(body);
    }
    console.error(label, error);
    return res.status(500).json({ error: 'Internal server error.' });
}

function isPlainObject(value) {
    return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function validateOverridePayload(docType, overrides) {
    if (!isPlainObject(overrides)) throw httpError(400, 'Override data must be an object.');
    const allowedFields = OVERRIDE_FIELDS[docType];
    if (!allowedFields) throw httpError(400, 'Unsupported document type.');

    for (const [key, value] of Object.entries(overrides)) {
        if (!allowedFields.has(key)) {
            throw httpError(400, `Override field '${key}' is not supported for ${docType}.`);
        }
        if (value !== null && value !== undefined && typeof value === 'object') {
            throw httpError(400, `Override field '${key}' must be a scalar value.`);
        }
    }
}

function shouldDeleteOverride(docType, value) {
    return value === null || value === undefined || (value === '' && docType !== 'CI');
}

async function assertMasterVersion(connection, masterId, expectedVersion) {
    const claim = await claimMasterVersion(connection, masterId, expectedVersion);
    if (claim.status) {
        const error = httpError(claim.status, claim.error);
        error.masterId = masterId;
        error.currentVersion = claim.currentVersion;
        throw error;
    }
    return claim.nextVersion;
}

async function loadMaster(connection, masterId) {
    const [masters] = await connection.query(
        `SELECT m.*, c.name AS client_name, c.address AS client_address,
                c.registration_no, c.contact_person, c.contact_email, c.contact_mobile,
                comp.name AS company_name, comp.address AS company_address,
                comp.iec_no, comp.gst_no, comp.cin_no, comp.lut_arn_no AS company_lut_arn,
                comp.director_name, comp.director_contact, comp.ssp_no,
                comp.range_name, comp.division, comp.commissionerate,
                m.invoice_no AS pi_number,
                m.master_financial_year AS financial_year,
                m.invoice_date AS pi_date
         FROM masters m
         LEFT JOIN clients c ON m.client_id = c.id
         JOIN companies comp ON m.company_id = comp.id
         WHERE m.id = ?`,
        [masterId]
    );
    if (masters.length === 0) throw httpError(404, 'Master not found.');

    const master = masters[0];
    const [containers] = await connection.query(
        'SELECT * FROM containers WHERE master_id = ? ORDER BY sequence_no', [masterId]
    );
    for (const container of containers) {
        const [products] = await connection.query(
            'SELECT * FROM container_products WHERE container_id = ? ORDER BY id', [container.id]
        );
        container.products = products;
    }
    master.containers = containers;

    const [coaTests] = await connection.query(
        'SELECT * FROM coa_tests WHERE master_id = ? ORDER BY sort_order', [masterId]
    );
    master.coa_tests = coaTests;

    if (master.company_bank_id) {
        const [banks] = await connection.query(
            'SELECT * FROM company_bank_accounts WHERE id = ?', [master.company_bank_id]
        );
        master.bank_details = banks[0] || null;
    } else {
        master.bank_details = null;
    }

    const [documents] = await connection.query(
        'SELECT * FROM order_documents WHERE master_id = ?', [masterId]
    );
    master.documents = documents.filter(document => ORDER_DOCUMENT_TYPES.has(document.document_type));

    const [overrideRows] = await connection.query(
        'SELECT document_type, field_key, field_value FROM document_overrides WHERE master_id = ?',
        [masterId]
    );
    master.overrides = {};
    overrideRows.filter(row => DOCUMENT_TYPES.has(row.document_type)).forEach(row => {
        if (!master.overrides[row.document_type]) master.overrides[row.document_type] = {};
        master.overrides[row.document_type][row.field_key] = row.field_value;
    });
    return master;
}

async function getNextMasterNumber(connection, companyId, financialYear) {
    await connection.query(
        `INSERT INTO master_sequences (company_id, financial_year, last_number)
         VALUES (?, ?, 0)
         ON DUPLICATE KEY UPDATE last_number = last_number`,
        [companyId, financialYear]
    );
    const [rows] = await connection.query(
        'SELECT last_number FROM master_sequences WHERE company_id = ? AND financial_year = ? FOR UPDATE',
        [companyId, financialYear]
    );
    const nextNumber = Number(rows[0].last_number) + 1;
    await connection.query(
        'UPDATE master_sequences SET last_number = ? WHERE company_id = ? AND financial_year = ?',
        [nextNumber, companyId, financialYear]
    );
    return nextNumber;
}

async function insertProducts(connection, masterId, containerId, products = []) {
    if (!Array.isArray(products)) throw httpError(400, 'products must be an array.');
    for (const product of products) {
        if (!isPlainObject(product)) throw httpError(400, 'Each product must be an object.');
        await connection.query(
            `INSERT INTO container_products
             (container_id, master_id, product_name, hs_code, description, packing_type,
              bag_weight, tare_weight_per_bag, num_packages, net_weight, gross_weight,
              lot_no, bag_no_from, bag_no_to, unit_rate, uom, application)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [containerId, masterId, product.product_name, product.hs_code, product.description,
                product.packing_type, product.bag_weight, product.tare_weight_per_bag,
                product.num_packages, product.net_weight, product.gross_weight, product.lot_no,
                product.bag_no_from, product.bag_no_to, product.unit_rate, product.uom,
                product.application]
        );
    }
}

async function getFolderPath(connection, masterId) {
    const [rows] = await connection.query(
        'SELECT master_number, master_financial_year, master_folder_path, client_id FROM masters WHERE id = ?',
        [masterId]
    );
    if (!rows.length || rows[0].master_folder_path || !rows[0].client_id) return null;
    const [clients] = await connection.query('SELECT folder_path FROM clients WHERE id = ?', [rows[0].client_id]);
    if (!clients.length || !clients[0].folder_path) return null;

    return path.join(clients[0].folder_path, `Master ${rows[0].master_number}`);
}

async function updateAmountInWords(connection, masterId) {
    const [rows] = await connection.query(
        'SELECT currency, total_amount FROM masters WHERE id = ?', [masterId]
    );
    if (!rows.length) throw httpError(404, 'Master not found.');
    const amount = rows[0].total_amount;
    const amountInWords = amount === null || amount === undefined || amount === ''
        ? null
        : amountToWords(parseFloat(amount), rows[0].currency);
    await connection.query('UPDATE masters SET amount_in_words = ? WHERE id = ?', [amountInWords, masterId]);
}

async function runMutation(res, label, callback, statusCode = 200) {
    try {
        const outcome = await withTransaction(pool, callback);
        if (outcome && outcome.response !== undefined) {
            if (outcome.postCommit) {
                try {
                    await outcome.postCommit();
                } catch (error) {
                    // Database commit already succeeded. Keep response truthful and log filesystem failure.
                    console.error(`${label} post-commit side effect failed:`, error);
                }
            }
            return res.status(statusCode).json(outcome.response);
        }
        return res.status(statusCode).json(outcome);
    } catch (error) {
        return sendError(res, error, label);
    }
}

// GET /api/masters?company_id=1
router.get('/', async (req, res) => {
    try {
        const { company_id, client_id, status } = req.query;
        if (!company_id) return res.status(400).json({ error: 'company_id is required.' });
        let query = `
            SELECT m.*, c.name AS client_name,
                   m.invoice_no AS pi_number,
                   m.master_financial_year AS pi_financial_year,
                   (SELECT COUNT(*) FROM containers WHERE master_id = m.id) AS container_count
            FROM masters m
            LEFT JOIN clients c ON m.client_id = c.id
            WHERE m.company_id = ?`;
        const params = [company_id];
        if (client_id) { query += ' AND m.client_id = ?'; params.push(client_id); }
        if (status) { query += ' AND m.status = ?'; params.push(status); }
        query += ' ORDER BY m.created_at DESC';
        const [masters] = await pool.query(query, params);
        return res.json(masters);
    } catch (error) { return sendError(res, error, 'Get masters error:'); }
});

router.get('/:id', async (req, res) => {
    try { return res.json(await loadMaster(pool, req.params.id)); }
    catch (error) { return sendError(res, error, 'Get master error:'); }
});

// POST /api/masters/blank
router.post('/blank', async (req, res) => {
    try {
        const { company_id, client_id, ...fields } = req.body;
        if (!company_id) return res.status(400).json({ error: 'company_id is required.' });
        const master = await withTransaction(pool, async connection => {
            const financialYear = getCurrentFinancialYear();
            const masterNumber = await getNextMasterNumber(connection, company_id, financialYear);
            const [result] = await connection.query(
                `INSERT INTO masters
                 (company_id, client_id, master_number, master_financial_year, created_by, status)
                 VALUES (?, ?, ?, ?, ?, 'draft')`,
                [company_id, client_id || null, masterNumber, financialYear, req.user.id]
            );
            const updates = [];
            const values = [];
            for (const field of MASTER_FIELDS) {
                if (fields[field] !== undefined && fields[field] !== null) {
                    updates.push(`${field} = ?`); values.push(fields[field]);
                }
            }
            if (updates.length) {
                values.push(result.insertId);
                await connection.query(`UPDATE masters SET ${updates.join(', ')} WHERE id = ?`, values);
                if (fields.total_amount !== undefined || fields.currency !== undefined) {
                    await updateAmountInWords(connection, result.insertId);
                }
            }
            return loadMaster(connection, result.insertId);
        });
        return res.status(201).json(master);
    } catch (error) { return sendError(res, error, 'Create blank master error:'); }
});

// POST /api/masters/:id/import
router.post('/:id/import', async (req, res) => {
    try {
        const master = await withTransaction(pool, async connection => {
            const [sources] = await connection.query('SELECT * FROM masters WHERE id = ? FOR UPDATE', [req.params.id]);
            if (!sources.length) throw httpError(404, 'Source master not found.');
            const source = sources[0];
            const companyId = req.body.company_id || source.company_id;
            const financialYear = getCurrentFinancialYear();
            const masterNumber = await getNextMasterNumber(connection, companyId, financialYear);
            const fields = MASTER_FIELDS.filter(field => field !== 'client_id' && field !== 'status');
            const columns = ['company_id', 'client_id', 'master_number', 'master_financial_year', 'created_by', 'status', ...fields];
            const values = [companyId, source.client_id, masterNumber, financialYear, req.user.id, 'draft', ...fields.map(field => source[field])];
            const placeholders = columns.map(() => '?').join(', ');
            const [result] = await connection.query(
                `INSERT INTO masters (${columns.join(', ')}) VALUES (${placeholders})`, values
            );
            return loadMaster(connection, result.insertId);
        });
        return res.status(201).json(master);
    } catch (error) { return sendError(res, error, 'Import master error:'); }
});

// PUT /api/masters/:id
router.put('/:id', async (req, res) => runMutation(res, 'Update master error:', async connection => {
    if (!isPlainObject(req.body)) throw httpError(400, 'Master data must be an object.');
    const fields = req.body;
    const updates = [];
    const values = [];
    for (const field of MASTER_FIELDS) {
        if (fields[field] !== undefined) { updates.push(`${field} = ?`); values.push(fields[field]); }
    }
    if (!updates.length) throw httpError(400, 'No valid fields to update.');
    await assertMasterVersion(connection, req.params.id, fields.version);
    // Version was claimed above; root update must not increment it a second time.
    await connection.query(`UPDATE masters SET ${updates.join(', ')} WHERE id = ?`, [...values, req.params.id]);
    if (fields.total_amount !== undefined || fields.currency !== undefined) {
        await updateAmountInWords(connection, req.params.id);
    }
    const folderPath = await getFolderPath(connection, req.params.id);
    if (folderPath) {
        await connection.query('UPDATE masters SET master_folder_path = ? WHERE id = ?', [folderPath, req.params.id]);
    }
    const master = await loadMaster(connection, req.params.id);
    return {
        response: master,
        postCommit: folderPath
            ? async () => fs.mkdirSync(folderPath, { recursive: true })
            : null
    };
}));

async function writeContainer(connection, masterId, containerId, body, replaceProducts) {
    if (!isPlainObject(body)) throw httpError(400, 'Container data must be an object.');
    const updates = [];
    const values = [];
    for (const field of CONTAINER_FIELDS) {
        if (body[field] !== undefined) {
            updates.push(`${field} = ?`);
            values.push(body[field]);
        }
    }
    if (updates.length) {
        await connection.query(
            `UPDATE containers SET ${updates.join(', ')} WHERE id = ? AND master_id = ?`,
            [...values, containerId, masterId]
        );
    }
    if (replaceProducts && body.products !== undefined) {
        if (!Array.isArray(body.products)) throw httpError(400, 'products must be an array.');
        await connection.query('DELETE FROM container_products WHERE container_id = ?', [containerId]);
        await insertProducts(connection, masterId, containerId, body.products);
    }
}

router.post('/:id/containers', async (req, res) => runMutation(res, 'Add container error:', async connection => {
    if (!isPlainObject(req.body)) throw httpError(400, 'Container data must be an object.');
    const masterId = req.params.id;
    await assertMasterVersion(connection, masterId, req.body.version);
    const [masterRows] = await connection.query('SELECT id FROM masters WHERE id = ? FOR UPDATE', [masterId]);
    if (!masterRows.length) throw httpError(404, 'Master not found.');
    const [maxSeq] = await connection.query(
        'SELECT COALESCE(MAX(sequence_no), 0) AS max_seq FROM containers WHERE master_id = ? FOR UPDATE', [masterId]
    );
    const sequenceNo = Number(maxSeq[0].max_seq) + 1;
    const fields = CONTAINER_FIELDS;
    const values = fields.map(field => req.body[field] ?? (field === 'verified_gross_mass_unit' ? 'KGS' : null));
    const [result] = await connection.query(
        `INSERT INTO containers (master_id, sequence_no, ${fields.join(', ')})
         VALUES (?, ?, ${fields.map(() => '?').join(', ')})`,
        [masterId, sequenceNo, ...values]
    );
    await insertProducts(connection, masterId, result.insertId, req.body.products || []);
    return loadMaster(connection, masterId);
}, 201));

router.put('/:masterId/containers/:containerId', async (req, res) => runMutation(res, 'Update container error:', async connection => {
    if (!isPlainObject(req.body)) throw httpError(400, 'Container data must be an object.');
    const { masterId, containerId } = req.params;
    await assertMasterVersion(connection, masterId, req.body.version);
    const [containers] = await connection.query(
        'SELECT id FROM containers WHERE id = ? AND master_id = ? FOR UPDATE', [containerId, masterId]
    );
    if (!containers.length) throw httpError(404, 'Container not found.');
    await writeContainer(connection, masterId, containerId, req.body, true);
    return loadMaster(connection, masterId);
}));

router.delete('/:masterId/containers/:containerId', async (req, res) => runMutation(res, 'Delete container error:', async connection => {
    if (req.body !== undefined && !isPlainObject(req.body)) throw httpError(400, 'Delete data must be an object.');
    const { masterId, containerId } = req.params;
    await assertMasterVersion(connection, masterId, req.body?.version);
    const [containers] = await connection.query(
        'SELECT id FROM containers WHERE id = ? AND master_id = ? FOR UPDATE', [containerId, masterId]
    );
    if (!containers.length) throw httpError(404, 'Container not found.');
    await connection.query('DELETE FROM containers WHERE id = ? AND master_id = ?', [containerId, masterId]);
    return loadMaster(connection, masterId);
}));

async function replaceCoa(connection, masterId, tests) {
    if (!Array.isArray(tests)) throw httpError(400, 'tests must be an array.');
    if (tests.some(test => !isPlainObject(test))) {
        throw httpError(400, 'Each COA test must be an object.');
    }
    await connection.query('DELETE FROM coa_tests WHERE master_id = ?', [masterId]);
    for (let index = 0; index < tests.length; index += 1) {
        const test = tests[index];
        await connection.query(
            `INSERT INTO coa_tests (master_id, test_name, specification, result, method, sort_order)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [masterId, test.test_name, test.specification, test.result, test.method, index + 1]
        );
    }
}

router.post('/:id/coa-tests', async (req, res) => runMutation(res, 'Set COA tests error:', async connection => {
    if (!isPlainObject(req.body)) throw httpError(400, 'COA data must be an object.');
    const masterId = req.params.id;
    await assertMasterVersion(connection, masterId, req.body.version);
    if (req.body.mfg_date !== undefined || req.body.expiry_date !== undefined) {
        const [current] = await connection.query('SELECT mfg_date, expiry_date FROM masters WHERE id = ?', [masterId]);
        if (!current.length) throw httpError(404, 'Master not found.');
        await connection.query(
            'UPDATE masters SET mfg_date = ?, expiry_date = ? WHERE id = ?',
            [req.body.mfg_date !== undefined ? req.body.mfg_date : current[0].mfg_date,
                req.body.expiry_date !== undefined ? req.body.expiry_date : current[0].expiry_date, masterId]
        );
    }
    await replaceCoa(connection, masterId, req.body.tests);
    return loadMaster(connection, masterId);
}));

router.post('/:id/documents', async (req, res) => runMutation(res, 'Set documents error:', async connection => {
    if (!isPlainObject(req.body)) throw httpError(400, 'Document selection must be an object.');
    const masterId = req.params.id;
    const documentTypes = req.body.document_types;
    if (!Array.isArray(documentTypes) || documentTypes.some(type => !ORDER_DOCUMENT_TYPES.has(type))) {
        throw httpError(400, 'document_types contains an unsupported document type.');
    }
    if (new Set(documentTypes).size !== documentTypes.length) {
        throw httpError(400, 'document_types must not contain duplicates.');
    }
    await assertMasterVersion(connection, masterId, req.body.version);
    const [containers] = await connection.query('SELECT id FROM containers WHERE master_id = ?', [masterId]);
    await connection.query('DELETE FROM order_documents WHERE master_id = ?', [masterId]);
    for (const docType of documentTypes) {
        if (docType === 'VGM') {
            for (const container of containers) {
                await connection.query(
                    `INSERT INTO order_documents (master_id, document_type, container_id, is_selected)
                     VALUES (?, ?, ?, TRUE)`, [masterId, docType, container.id]
                );
            }
        } else {
            await connection.query(
                `INSERT INTO order_documents (master_id, document_type, is_selected)
                 VALUES (?, ?, TRUE)`, [masterId, docType]
            );
        }
    }
    return loadMaster(connection, masterId);
}));

router.delete('/:id', async (req, res) => runMutation(res, 'Delete master error:', async connection => {
    const masterId = req.params.id;
    await assertMasterVersion(connection, masterId, req.body?.version);
    const [masters] = await connection.query('SELECT id FROM masters WHERE id = ? FOR UPDATE', [masterId]);
    if (!masters.length) throw httpError(404, 'Master not found.');
    await connection.query('DELETE FROM masters WHERE id = ?', [masterId]);
    return { deleted: true, message: 'Master deleted successfully.' };
}));

router.get('/:id/overrides/:docType', async (req, res) => {
    try {
        const { id, docType } = req.params;
        if (!DOCUMENT_TYPES.has(docType)) throw httpError(400, 'Unsupported document type.');
        const [masters] = await pool.query('SELECT id, version FROM masters WHERE id = ?', [id]);
        if (!masters.length) throw httpError(404, 'Master not found.');
        const [rows] = await pool.query(
            'SELECT field_key, field_value FROM document_overrides WHERE master_id = ? AND document_type = ?',
            [id, docType]
        );
        const overrides = {};
        rows.forEach(row => { overrides[row.field_key] = row.field_value; });
        res.set('X-Master-Version', String(masters[0].version));
        return res.json(overrides);
    } catch (error) { return sendError(res, error, 'Get overrides error:'); }
});

router.post('/:id/overrides/:docType', async (req, res) => runMutation(res, 'Save overrides error:', async connection => {
    const masterId = req.params.id;
    const docType = req.params.docType;
    if (!DOCUMENT_TYPES.has(docType)) throw httpError(400, 'Unsupported document type.');
    if (!isPlainObject(req.body)) {
        throw httpError(400, 'Override data must be an object.');
    }
    const overrides = { ...req.body };
    delete overrides.version;
    validateOverridePayload(docType, overrides);
    await assertMasterVersion(connection, masterId, req.body.version);
    for (const [key, value] of Object.entries(overrides)) {
        if (shouldDeleteOverride(docType, value)) {
            await connection.query(
                'DELETE FROM document_overrides WHERE master_id = ? AND document_type = ? AND field_key = ?',
                [masterId, docType, key]
            );
        } else {
            await connection.query(
                `INSERT INTO document_overrides (master_id, document_type, field_key, field_value)
                 VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE field_value = VALUES(field_value)`,
                [masterId, docType, key, value]
            );
        }
    }
    return loadMaster(connection, masterId);
}));

// Combined command for document forms that need root fields and overrides in one save.
router.post('/:id/document-save', async (req, res) => runMutation(res, 'Save document error:', async connection => {
    if (!isPlainObject(req.body)) throw httpError(400, 'Document data must be an object.');
    const masterId = req.params.id;
    const { version, document_type: documentType, fields = {}, overrides, coa_tests: coaTests, container } = req.body;
    if (!DOCUMENT_TYPES.has(documentType)) throw httpError(400, 'Unsupported document type.');
    if (!isPlainObject(fields)) throw httpError(400, 'fields must be an object.');
    if (overrides !== undefined && !isPlainObject(overrides)) throw httpError(400, 'Override data must be an object.');
    if (container !== undefined && !isPlainObject(container)) throw httpError(400, 'Container data must be an object.');
    if (documentType === 'CI' && fields.vessel_no !== undefined) {
        throw httpError(400, 'CI vessel_no must be saved as a document override.');
    }
    await assertMasterVersion(connection, masterId, version);

    const updates = [];
    const values = [];
    for (const field of MASTER_FIELDS) {
        if (fields[field] !== undefined) { updates.push(`${field} = ?`); values.push(fields[field]); }
    }
    if (updates.length) await connection.query(`UPDATE masters SET ${updates.join(', ')} WHERE id = ?`, [...values, masterId]);
    if (fields.total_amount !== undefined || fields.currency !== undefined) {
        await updateAmountInWords(connection, masterId);
    }
    if (coaTests !== undefined) await replaceCoa(connection, masterId, coaTests);
    if (container) {
        if (!container.id) throw httpError(400, 'container.id is required.');
        const [rows] = await connection.query(
            'SELECT id FROM containers WHERE id = ? AND master_id = ? FOR UPDATE', [container.id, masterId]
        );
        if (!rows.length) throw httpError(404, 'Container not found.');
        await writeContainer(connection, masterId, container.id, container, true);
    }
    if (overrides !== undefined) {
        validateOverridePayload(documentType, overrides);
        for (const [key, value] of Object.entries(overrides)) {
            if (shouldDeleteOverride(documentType, value)) {
                await connection.query(
                    'DELETE FROM document_overrides WHERE master_id = ? AND document_type = ? AND field_key = ?',
                    [masterId, documentType, key]
                );
            } else {
                await connection.query(
                    `INSERT INTO document_overrides (master_id, document_type, field_key, field_value)
                     VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE field_value = VALUES(field_value)`,
                    [masterId, documentType, key, value]
                );
            }
        }
    }
    return loadMaster(connection, masterId);
}));

module.exports = router;
