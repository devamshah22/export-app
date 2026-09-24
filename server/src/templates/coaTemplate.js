const { getImageBase64, formatDate } = require('../services/pdfService');

/**
 * Generate COA (Certificate of Analysis) HTML template
 */
function generateCOATemplate(data) {
    const headerImg = getImageBase64('chirag_organics_header.png');
    const signatureImg = getImageBase64('signature_stamp.png');

    const coaTests = data.coa_tests || [];

    return `<!DOCTYPE html>
<html>
<head>
<style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Times New Roman', Times, serif; font-size: 11px; color: #000; }
    .page { width: 100%; padding: 8mm; }
    .header { text-align: center; margin-bottom: 5px; }
    .header img { width: 100%; max-height: 70px; }
    .title { text-align: center; font-size: 14px; font-weight: bold; margin: 10px 0; text-decoration: underline; }
    .info-table { width: 60%; margin-bottom: 15px; }
    .info-table td { padding: 3px 5px; font-size: 11px; }
    .info-table .label { font-weight: bold; width: 120px; }
    .test-table { width: 100%; border-collapse: collapse; margin-top: 10px; }
    .test-table th, .test-table td { border: 1px solid #000; padding: 5px 8px; font-size: 10px; }
    .test-table th { background: #f0f0f0; font-weight: bold; text-align: center; }
    .test-table td { text-align: left; }
    .dates { margin-top: 15px; font-size: 11px; }
    .dates td { padding: 3px 5px; }
    .dates .label { font-weight: bold; width: 150px; }
    .signature-section { display: flex; justify-content: space-between; margin-top: 40px; font-size: 11px; }
    .signature-section div { text-align: center; }
</style>
</head>
<body>
<div class="page">
    <div class="header">
        ${headerImg ? `<img src="${headerImg}" alt="Company Header" />` : `<h2>${data.company_name || ''}</h2>`}
    </div>

    <div class="title">CERTIFICATE OF ANALYSIS AND SPECIFICATION</div>

    <!-- Info Section -->
    <table class="info-table">
        <tr><td class="label">COA No.</td><td>${data.ci_invoice_no || data.invoice_no || ''}</td></tr>
        <tr><td class="label">Product</td><td>${data.product_name || ''}</td></tr>
        <tr><td class="label">Lot No.</td><td>${data.lot_no || ''}</td></tr>
        <tr><td class="label">Date</td><td>${formatDate(data.ci_invoice_date || data.invoice_date)}</td></tr>
        <tr><td class="label">Quantity</td><td>${data.nett_weight || ''} ${data.unit_1 || 'MT'}</td></tr>
        <tr><td class="label">Other Ref</td><td>${data.other_ref || ''}</td></tr>
        <tr><td class="label">L/c No.</td><td>${data.lc_no_and_date || ''}</td></tr>
    </table>

    <!-- Test Results Table -->
    <table class="test-table">
        <tr>
            <th>TEST</th>
            <th>SPECIFICATION</th>
            <th>RESULT</th>
            <th>METHOD</th>
        </tr>
        ${coaTests.map(test => `
        <tr>
            <td>${test.test_name || ''}</td>
            <td>${test.specification || ''}</td>
            <td>${test.result || ''}</td>
            <td>${test.method || ''}</td>
        </tr>
        `).join('')}
    </table>

    <!-- Dates -->
    <table class="dates" style="margin-top: 15px;">
        <tr><td class="label">MANUFACTURE DATE</td><td>${formatDate(data.mfg_date)}</td></tr>
        <tr><td class="label">EXPIRY DATE</td><td>${formatDate(data.expiry_date)}</td></tr>
    </table>

    <!-- Signatures -->
    <div class="signature-section">
        <div>
            Prepared By
        </div>
        <div>
            ${signatureImg ? `<img src="${signatureImg}" style="height:50px;" />` : ''}<br/>
            Checked By
        </div>
    </div>
</div>
</body>
</html>`;
}

module.exports = { generateCOATemplate };
