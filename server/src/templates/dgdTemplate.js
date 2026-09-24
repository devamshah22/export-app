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

function generateDGDTemplate(data) {
    const headerImg = getImageBase64('chirag_organics_header.png');
    const signatureImg = getImageBase64('signature_stamp.png');
    const containers = data.containers || [];
    const perFclPackages = Number(data.per_fcl_packages || 0);
    const outerPackaging = data.dgd_outer_packaging || `${perFclPackages || ''} NEW ${data.net_weight || ''} KG NET ${data.packing_type || 'PAPER FABRIC BAGS'} (PER CONTAINER)`;
    const date = data.dgd_date || data.ci_invoice_date || data.invoice_date || data.shipping_bill_date;
    const containerRows = containers.length ? containers.map((container, index) => `
        <tr><td>${index + 1}</td><td>${escapeHtml(container.container_no)}</td>
        <td>${escapeHtml([container.liner_seal_no, container.rfid_seal_no].filter(Boolean).join(' / '))}</td>
        <td>${escapeHtml(container.container_size)}</td><td>${escapeHtml(numberValue(container.tare_weight))}</td>
        <td>${escapeHtml(numberValue(container.gross_weight))}</td></tr>`).join('') :
        '<tr><td colspan="6" class="empty">No containers recorded</td></tr>';

    return `<!DOCTYPE html>
<html><head><meta charset="UTF-8"/><style>
* { box-sizing: border-box; }
@page { size: A4 portrait; margin: 7mm; }
body { margin: 0; font-family: Arial, Helvetica, sans-serif; color: #000; font-size: 8px; }
.page { width: 100%; }
.header { text-align: center; margin-bottom: 3px; }.header img { width: 100%; max-height: 45px; object-fit: contain; }
.title { text-align: center; font-size: 14px; font-weight: bold; margin: 4px 0 6px; }
table { width: 100%; border-collapse: collapse; }.main td, .main th, .containers td, .containers th, .signatures td { border: 1px solid #000; padding: 3px 4px; vertical-align: top; line-height: 1.25; }
.label { font-weight: bold; }.section { background: #eaeaea; font-weight: bold; text-align: center; padding: 3px; border: 1px solid #000; border-bottom: 0; margin-top: 5px; }
.main .key { width: 25%; font-weight: bold; }.main .value { width: 25%; }.main .wide { width: 50%; }
.declaration { min-height: 48px; }.details { min-height: 24px; }.containers { font-size: 7.5px; }.containers th { text-align: center; vertical-align: middle; }.containers td { text-align: center; }.empty { padding: 10px; }
.signatures { margin-top: 6px; }.signatures td { height: 38px; }.signature-image { height: 38px; max-width: 100px; }.right { text-align: right; }
</style></head><body><div class="page">
<div class="header">${headerImg ? `<img src="${headerImg}" alt="Company Header"/>` : `<strong>${escapeHtml(data.company_name)}</strong>`}</div>
<div class="title">Multimodal Dangerous Goods Form</div>

<div class="section">Parties and Transport</div>
<table class="main"><tr>
<td class="key">1 Shipper / Consignor / Sender<br/>(full style address is mandatory)</td><td class="wide">${escapeHtml(data.consignor_name)}<br/>${escapeHtml(data.consignor_address)}</td>
<td class="key">2 Transport Document Number</td><td class="value">${escapeHtml(data.dgd_transport_document_no)}</td></tr>
<tr><td class="key">4 Shipper's Reference</td><td>${escapeHtml(data.dgd_shipper_reference)}</td><td class="key">5 Freight Forwarder's Reference</td><td>${escapeHtml(data.dgd_freight_forwarder_reference)}</td></tr>
<tr><td class="key">6 Consignee</td><td>${escapeHtml(data.buyer_name)}<br/>${escapeHtml(data.buyer_address)}</td><td class="key">Carrier</td><td>${escapeHtml(data.dgd_carrier || 'MSC')}</td></tr></table>

<div class="section">Shipper's Declaration</div>
<table class="main"><tr><td class="declaration">${escapeHtml(data.dgd_declaration || 'I hereby declare that the contents of this consignment are fully and accurately described below by the proper shipping name, and are classified, packaged, marked and labelled/placarded and are in all respects in proper condition for transport according to the applicable international and national government regulations.')}</td></tr></table>

<div class="section">Shipment and Routing</div>
<table class="main"><tr><td class="key">Shipment Limitation</td><td>${escapeHtml(data.dgd_limitation || 'CARGO ONLY')}</td><td class="key">Vessel / Voyage</td><td>${escapeHtml(data.dgd_vessel_voyage || data.vessel_no || '')}</td></tr>
<tr><td class="key">Port of Loading</td><td>${escapeHtml(data.port_of_loading)}</td><td class="key">Additional Handling</td><td>${escapeHtml(data.dgd_additional_handling)}</td></tr>
<tr><td class="key">Port of Discharge</td><td>${escapeHtml(data.port_of_discharge)}</td><td class="key">Destination</td><td>${escapeHtml(data.port_of_discharge)}</td></tr></table>

<div class="section">Dangerous Goods Details</div>
<table class="main"><tr><td class="key">UN Number</td><td>${escapeHtml(data.un_number)}</td><td class="key">Proper Shipping Name</td><td>${escapeHtml(data.proper_shipping_name)}</td></tr>
<tr><td class="key">Technical / Chemical Name</td><td colspan="3">${escapeHtml(data.dgd_technical_name || 'Para Dichloro benzene (PDCB)')}</td></tr>
<tr><td class="key">Class</td><td>${escapeHtml(data.imdg_class)}</td><td class="key">Sub Risk</td><td>${escapeHtml(data.dgd_sub_risk || 'NA')}</td></tr>
<tr><td class="key">Packing Group</td><td>${escapeHtml(data.packing_group)}</td><td class="key">Marine Pollutant</td><td>${escapeHtml(data.marine_pollutant)}</td></tr>
<tr><td class="key">Outer Packaging / Quantity</td><td colspan="3">${escapeHtml(outerPackaging)}</td></tr>
<tr><td class="key">Flashpoint</td><td>${escapeHtml(data.flash_point)}</td><td class="key">EMS Code</td><td>${escapeHtml(data.dgd_ems_code || data.ems_code || 'F-A, S-F')}</td></tr>
<tr><td class="key">IMO Label</td><td>${escapeHtml(data.dgd_imo_label)}</td><td class="key">MFAG Number</td><td>${escapeHtml(data.dgd_mfag_number)}</td></tr>
<tr><td class="key">Reefer Temperature / Humidity / Ventilation</td><td>${escapeHtml(data.dgd_reefer_details || 'NA')}</td><td class="key">Boiling Point</td><td>${escapeHtml(data.dgd_boiling_point || '174°C')}</td></tr>
<tr><td class="key">Emergency Contact Details</td><td>${escapeHtml(data.dgd_emergency_contact || 'Mr. Jigar - +919820355066')}</td><td class="key">Limited Quantity</td><td>${escapeHtml(data.dgd_limited_quantity)}</td></tr>
<tr><td class="key">Poisonous Inhalation Hazard</td><td colspan="3">${escapeHtml(data.dgd_poisonous_inhalation_hazard || 'NA')}</td></tr>
<tr><td class="key">UN Packaging Code</td><td colspan="3">${escapeHtml(data.un_packaging_code)}</td></tr></table>

<div class="section">Container Details</div>
<table class="containers"><thead><tr><th>S. No.</th><th>Container Identification No.</th><th>Seal Number(s)</th><th>Container Size &amp; Type</th><th>Tare Mass (kg)</th><th>Total Gross Mass Including Tare (kg)</th></tr></thead><tbody>${containerRows}</tbody></table>

<div class="section">Container Packing Certificate</div>
<table class="main"><tr><td colspan="4">${escapeHtml(data.dgd_packing_certificate || 'I hereby declare that the goods described above have been placed/loaded into the container/vehicle identified above in accordance with the applicable provisions.')}</td></tr></table>
<div class="section">21 RECEIVING ORGANIZATION RECEIPT</div>
<table class="main"><tr><td colspan="4">${escapeHtml(data.dgd_receiving_receipt || 'Received the above number of packages/containers/trailers in apparent good order and condition, unless stated hereon: RECEIVING ORGANIZATION RE-MARKS:')}</td></tr></table>
<div class="section">Company</div>
<table class="signatures"><tr><td><span class="label">Name of Company</span><br/>${escapeHtml(data.company_name)}<br/>${signatureImg ? `<img class="signature-image" src="${signatureImg}" alt="Signature and stamp"/>` : ''}</td><td><span class="label">Name of Declarant</span><br/>${escapeHtml(data.dgd_company_declarant || 'JIGAR SHETH')}</td><td><span class="label">Place and Date</span><br/>${escapeHtml(data.dgd_company_place || 'VAPI')} ${dateValue(data.ci_invoice_date)}</td></tr></table>
<div class="section">Haulier</div>
<table class="signatures"><tr><td><span class="label">22 Name of Company (OF SHIPPER PREPARING THIS NOTE)</span><br/>${escapeHtml(data.consignor_name)}</td><td><span class="label">Name of Declarant</span><br/>${escapeHtml(data.dgd_haulier_declarant || 'JIGAR SETH')}</td><td><span class="label">Place and Date</span><br/>${escapeHtml(data.dgd_haulier_place)} ${dateValue(data.dgd_haulier_date)}</td></tr>
<tr><td colspan="3">${signatureImg ? `<img class="signature-image" src="${signatureImg}" alt="Signature and stamp"/>` : ''}</td></tr></table>
</div></body></html>`;
}

module.exports = { generateDGDTemplate };
