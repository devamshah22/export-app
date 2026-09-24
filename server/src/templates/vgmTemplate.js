const { getImageBase64, formatDate, cleanNum } = require('../services/pdfService');

function escapeHtml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;').replace(/'/g, '&#039;').replace(/\n/g, '<br/>');
}

function dateValue(value) {
    if (!value) return '';
    const text = String(value);
    return /^\d{2}\/\d{2}\/\d{4}$/.test(text) ? text : formatDate(value);
}

function numberValue(value) {
    if (value === '' || value === null || value === undefined) return '';
    const number = Number(value);
    return Number.isFinite(number) ? cleanNum(number) : value;
}

function generateVGMTemplate(data) {
    const headerImg = getImageBase64('chirag_organics_header.png');
    const signatureImg = getImageBase64('signature_stamp.png');
    const container = data.vgm_container || {};

    const shipperName = data.company_name || data.consignor_name || '';
    // IEC linked from Annexure C (annexc_iec_no override), same fallback chain
    const iecNo = data.annexc_iec_no || data.iec_no || '0302034218';
    const authorizedOfficial = data.vgm_authorized_official || 'JIGER SHETH (DIRECTOR)';
    const contactDetails = data.vgm_contact_details || '+91 9820355066';
    const containerNoSize = [container.container_no, container.container_size]
        .filter(Boolean).join(' / ');
    const maxPermissible = container.max_permissible_weight
        ? `${numberValue(container.max_permissible_weight)} KGS` : '32500.00 KGS';
    const weighbridge = container.weighbridge_name || 'NEW CHAUDARY CONATINER WEIGH BRIDGE';
    const method = container.weighing_method
        ? `(${String(container.weighing_method).replace(/[()]/g, '')})` : '(METHOD-1)';
    const verifiedMass = numberValue(container.verified_gross_mass);
    const unit = container.verified_gross_mass_unit || 'KGS';
    // Date of weighing is always the CI invoice date
    const weighingDate = dateValue(data.ci_invoice_date);
    const slipNo = container.weighing_slip_no || '';
    const cargoType = container.cargo_type || 'HAZARDOUS';
    // Hazardous details stay linked to DGD dangerous-goods fields.
    const hazardousDetails = `UN NO: ${data.un_number || '3077'} CLASS: ${data.imdg_class || '9'}`;

    const rows = [
        ['1', 'Name of the shipper', `${escapeHtml(shipperName)}<br/>${escapeHtml(data.company_address || '')}`],
        ['2', 'IEC No.', escapeHtml(iecNo)],
        ['3', 'Name and designation of official of the shipper authorized to sign the document', escapeHtml(authorizedOfficial)],
        ['4', '24 x 7 contact details of authorised official', escapeHtml(contactDetails)],
        ['5', 'Container No. / Size', escapeHtml(containerNoSize)],
        ['6', 'Maximum permissible weight of container as per the CSC plate', escapeHtml(maxPermissible)],
        ['7', 'Weighbridge registration no. &amp; Address of Weighbridge', escapeHtml(weighbridge)],
        ['8', 'Verified gross mass of container (method-1 / method-2)', escapeHtml(method)],
        ['9', 'Verified gross mass', escapeHtml(verifiedMass)],
        ['10', 'Unit of measure (KG / MT / LBS)', escapeHtml(unit)],
        ['11', 'Date of weighing', escapeHtml(weighingDate)],
        ['12', 'Weighing slip no.', escapeHtml(slipNo)],
        ['13', 'Type (Normal / Reefer / Hazardous / Others)', escapeHtml(cargoType)],
        ['14', 'If Hazardous — UN No. / IMDG Class', escapeHtml(hazardousDetails)]
    ].map(([sr, details, particulars]) => `
        <tr><td class="sr">${sr}</td><td class="details">${details}</td><td class="particulars">${particulars}</td></tr>`).join('');

    return `<!DOCTYPE html>
<html><head><meta charset="UTF-8"/><style>
* { box-sizing: border-box; }
@page { size: A4 portrait; margin: 10mm; }
body { margin: 0; font-family: Arial, Helvetica, sans-serif; color: #000; font-size: 11px; }
.page { width: 100%; }
.header { text-align: center; margin-bottom: 6px; }.header img { width: 100%; max-height: 58px; object-fit: contain; }
.title { text-align: center; font-size: 14px; font-weight: bold; margin: 10px 0 12px; text-decoration: underline; }
table { width: 100%; border-collapse: collapse; }
td, th { border: 1px solid #000; padding: 6px 8px; vertical-align: middle; line-height: 1.4; }
th { font-weight: bold; text-align: center; background: #f0f0f0; }
.sr { width: 8%; text-align: center; font-weight: bold; }
.details { width: 52%; font-weight: bold; }
.particulars { width: 40%; }
.signature-row td { height: 90px; vertical-align: top; }
.signature-row img { height: 55px; display: block; margin: 6px 0; }
</style></head><body><div class="page">
<div class="header">${headerImg ? `<img src="${headerImg}" alt="Company Header"/>` : `<strong>${escapeHtml(data.company_name)}</strong>`}</div>
<div class="title">INFORMATION ABOUT VERIFIED GROSS MASS OF CONTAINER</div>
<table>
<thead><tr><th>Sr. No.</th><th>Details</th><th>Particulars</th></tr></thead>
<tbody>${rows}
<tr class="signature-row"><td class="sr">15</td><td class="details">Signature of authorised person of the shipper</td>
<td class="particulars"><strong>For ${escapeHtml(shipperName)}</strong>
${signatureImg ? `<img src="${signatureImg}" alt="Signature and stamp"/>` : '<br/><br/><br/>'}
${escapeHtml(authorizedOfficial)}<br/>DATE: ${escapeHtml(weighingDate)}</td></tr>
</tbody></table>
</div></body></html>`;
}

module.exports = { generateVGMTemplate };
