const { getImageBase64, formatDate } = require('../services/pdfService');

/**
 * Generate Master Form PDF - a printable summary of all master data
 */
function generateMasterFormTemplate(data) {
    const headerImg = getImageBase64('chirag_organics_header.png');

    const containers = data.containers || [];

    return `<!DOCTYPE html>
<html>
<head>
<style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, sans-serif; font-size: 10px; color: #000; }
    .page { width: 100%; padding: 8mm; }
    .header { text-align: center; margin-bottom: 8px; }
    .header img { width: 100%; max-height: 70px; }
    .title { text-align: center; font-size: 14px; font-weight: bold; margin: 8px 0; border-bottom: 2px solid #000; padding-bottom: 5px; }
    .section { margin-bottom: 10px; }
    .section-title { font-size: 11px; font-weight: bold; background: #f0f0f0; padding: 4px 8px; margin-bottom: 4px; border-left: 3px solid #1565c0; }
    .row { display: flex; flex-wrap: wrap; }
    .field { padding: 2px 8px; display: inline-block; width: 33.33%; }
    .field-half { padding: 2px 8px; display: inline-block; width: 50%; }
    .field-full { padding: 2px 8px; display: inline-block; width: 100%; }
    .label { font-weight: bold; color: #333; }
    .value { color: #000; }
    table { width: 100%; border-collapse: collapse; margin-top: 4px; }
    th, td { border: 1px solid #999; padding: 3px 5px; font-size: 9px; text-align: left; }
    th { background: #e8e8e8; font-weight: bold; }
</style>
</head>
<body>
<div class="page">
    <div class="header">
        ${headerImg ? `<img src="${headerImg}" alt="Header" />` : ''}
    </div>
    <div class="title">MASTER SHEET</div>

    <!-- Consignor -->
    <div class="section">
        <div class="section-title">CONSIGNOR (EXPORTER)</div>
        <div class="field-half"><span class="label">Name:</span> <span class="value">${data.consignor_name || ''}</span></div>
        <div class="field-half"><span class="label">Address:</span> <span class="value">${data.consignor_address || ''}</span></div>
    </div>

    <!-- Consignee -->
    <div class="section">
        <div class="section-title">CONSIGNEE</div>
        <div class="field-half"><span class="label">Name:</span> <span class="value">${data.consignee_name || ''}</span></div>
        <div class="field-half"><span class="label">Address:</span> <span class="value">${data.consignee_address || ''}</span></div>
    </div>

    <!-- Buyer -->
    <div class="section">
        <div class="section-title">BUYER</div>
        <div class="field-half"><span class="label">Name:</span> <span class="value">${data.buyer_name || ''}</span></div>
        <div class="field-half"><span class="label">Address:</span> <span class="value">${data.buyer_address || ''}</span></div>
    </div>

    <!-- Invoices & References -->
    <div class="section">
        <div class="section-title">INVOICES & REFERENCE DETAILS</div>
        <div class="field"><span class="label">PI Invoice No.:</span> <span class="value">${data.invoice_no || ''}</span></div>
        <div class="field"><span class="label">PI Invoice Date:</span> <span class="value">${formatDate(data.invoice_date) || ''}</span></div>
        <div class="field"><span class="label">CI Invoice No.:</span> <span class="value">${data.ci_invoice_no || ''}</span></div>
        <div class="field"><span class="label">CI Invoice Date:</span> <span class="value">${formatDate(data.ci_invoice_date) || ''}</span></div>
        <div class="field"><span class="label">PO No.:</span> <span class="value">${data.po_no || ''}</span></div>
        <div class="field"><span class="label">PO Date:</span> <span class="value">${formatDate(data.po_date) || ''}</span></div>
        <div class="field"><span class="label">Other Ref:</span> <span class="value">${data.other_ref || ''}</span></div>
        <div class="field"><span class="label">LUT ARN No.:</span> <span class="value">${data.lut_arn_no || ''}</span></div>
    </div>

    <!-- Shipping -->
    <div class="section">
        <div class="section-title">SHIPPING DETAILS</div>
        <div class="field"><span class="label">Port of Loading:</span> <span class="value">${data.port_of_loading || ''}</span></div>
        <div class="field"><span class="label">Port of Discharge:</span> <span class="value">${data.port_of_discharge || ''}</span></div>
        <div class="field"><span class="label">Shipment Date:</span> <span class="value">${formatDate(data.shipment_date) || ''}</span></div>
        <div class="field"><span class="label">Country of Origin:</span> <span class="value">${data.country_of_origin || ''}</span></div>
        <div class="field"><span class="label">Country of Discharge:</span> <span class="value">${data.country_of_discharge || ''}</span></div>
        <div class="field"><span class="label">Vessel No.:</span> <span class="value">${data.vessel_no || ''}</span></div>
        <div class="field"><span class="label">Bill of Lading No.:</span> <span class="value">${data.bill_of_lading_no || ''}</span></div>
        <div class="field"><span class="label">Shipping Bill No.:</span> <span class="value">${data.shipping_bill_no || ''}</span></div>
        <div class="field"><span class="label">Shipping Bill Date:</span> <span class="value">${formatDate(data.shipping_bill_date) || ''}</span></div>
    </div>

    <!-- Payment & LC -->
    <div class="section">
        <div class="section-title">PAYMENT & LC DETAILS</div>
        <div class="field"><span class="label">Currency:</span> <span class="value">${data.currency || ''}</span></div>
        <div class="field"><span class="label">Incoterms:</span> <span class="value">${data.incoterms || ''}</span></div>
        <div class="field"><span class="label">Payment Terms:</span> <span class="value">${data.payment_terms || ''}</span></div>
        <div class="field"><span class="label">Freight Terms:</span> <span class="value">${data.freight_terms || ''}</span></div>
        <div class="field"><span class="label">Issuing Bank:</span> <span class="value">${data.issuing_bank || ''}</span></div>
        <div class="field-half"><span class="label">L/C No. & Date:</span> <span class="value">${data.lc_no_and_date || ''}</span></div>
        <div class="field"><span class="label">Account Name:</span> <span class="value">${data.account_name || ''}</span></div>
        <div class="field"><span class="label">Swift Code:</span> <span class="value">${data.swift_code || ''}</span></div>
        <div class="field"><span class="label">Branch:</span> <span class="value">${data.branch || ''}</span></div>
    </div>

    <!-- Product Details -->
    <div class="section">
        <div class="section-title">PRODUCT DETAILS</div>
        <div class="field"><span class="label">Product:</span> <span class="value">${data.product_name || ''}</span></div>
        <div class="field"><span class="label">HS Code:</span> <span class="value">${data.hs_code || ''}</span></div>
        <div class="field"><span class="label">Packing Type:</span> <span class="value">${data.packing_type || ''}</span></div>
        <div class="field"><span class="label">Description:</span> <span class="value">${data.description || ''}</span></div>
        <div class="field"><span class="label">Tare Weight:</span> <span class="value">${data.tare_weight || ''}</span></div>
        <div class="field"><span class="label">Net Weight:</span> <span class="value">${data.net_weight || ''}</span></div>
        <div class="field"><span class="label">Gross Weight:</span> <span class="value">${data.total_gross_weight || ''}</span></div>
        <div class="field"><span class="label">Nett Weight:</span> <span class="value">${data.nett_weight || ''}</span></div>
        <div class="field"><span class="label">Total Packages:</span> <span class="value">${data.total_packages || ''}</span></div>
        <div class="field"><span class="label">UOM:</span> <span class="value">${data.uom || ''}</span></div>
        <div class="field"><span class="label">Unit Rate:</span> <span class="value">${data.unit_rate || ''}</span></div>
        <div class="field"><span class="label">Lot No.:</span> <span class="value">${data.lot_no || ''}</span></div>
    </div>

    <!-- Pricing -->
    <div class="section">
        <div class="section-title">PRICING (${data.currency || ''})</div>
        <div class="field"><span class="label">FOB:</span> <span class="value">${data.fob_amount || ''}</span></div>
        <div class="field"><span class="label">Freight:</span> <span class="value">${data.freight_amount || ''}</span></div>
        <div class="field"><span class="label">Total:</span> <span class="value">${data.total_amount || ''}</span></div>
        ${data.amount_in_words ? `<div class="field-full"><span class="label">Amount in Words:</span> <span class="value">${data.amount_in_words}</span></div>` : ''}
    </div>

    <!-- Containers -->
    ${containers.length > 0 ? `
    <div class="section">
        <div class="section-title">CONTAINERS (${containers.length})</div>
        <table>
            <tr>
                <th>#</th>
                <th>Container No.</th>
                <th>Truck No.</th>
                <th>Liner Seal</th>
                <th>RFID Seal</th>
                <th>Size</th>
                <th>Tare Wt</th>
                <th>Gross Wt</th>
            </tr>
            ${containers.map(c => `
            <tr>
                <td>${c.sequence_no}</td>
                <td>${c.container_no || ''}</td>
                <td>${c.truck_no || ''}</td>
                <td>${c.liner_seal_no || ''}</td>
                <td>${c.rfid_seal_no || ''}</td>
                <td>${c.container_size || ''}</td>
                <td>${c.tare_weight || ''}</td>
                <td>${c.gross_weight || ''}</td>
            </tr>`).join('')}
        </table>
    </div>` : ''}
</div>
</body>
</html>`;
}

module.exports = { generateMasterFormTemplate };
