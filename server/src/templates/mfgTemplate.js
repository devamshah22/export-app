const { getImageBase64, formatDate } = require('../services/pdfService');

/**
 * Generate Manufacturer's Certificate HTML template
 */
function generateMFGTemplate(data) {
    const headerImg = getImageBase64('chirag_organics_header.png');
    const signatureImg = getImageBase64('signature_stamp.png');

    const certifyText = data.mfg_certify_text || `This is to certify that the goods are of India origin and the goods are produced to ISO 9001: 2015 standards. The goods are considered fit for sale anywhere in the world`;
    const goodsDesc = data.mfg_goods_description || `${data.product_name || ''}`;

    return `<!DOCTYPE html>
<html>
<head>
<style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Times New Roman', Times, serif; font-size: 11px; color: #000; }
    .page { width: 100%; padding: 10mm; }
    .header { text-align: center; margin-bottom: 5px; }
    .header img { width: 100%; max-height: 70px; }
    .title { text-align: center; font-size: 14px; font-weight: bold; margin: 15px 0; text-decoration: underline; }
    .to-block { margin: 15px 0; font-size: 11px; }
    .certify { margin: 20px 0; font-size: 11px; line-height: 1.6; }
    .details-table { width: 100%; margin-top: 15px; }
    .details-table td { padding: 5px; font-size: 11px; vertical-align: top; }
    .details-table .label { font-weight: bold; width: 180px; }
    .signature { margin-top: 50px; font-size: 11px; }
    .signature img { height: 60px; display: block; margin: 5px 0; }
</style>
</head>
<body>
<div class="page">
    <div class="header">
        ${headerImg ? `<img src="${headerImg}" alt="Company Header" />` : `<h2>${data.company_name || ''}</h2>`}
    </div>

    <div class="title">MANUFACTURER's CERTIFICATE</div>

    <div class="to-block">
        <strong>To,</strong><br/>
        ${data.buyer_name || ''}<br/>
        ${data.buyer_address || ''}
    </div>

    <div class="certify">
        ${certifyText}
    </div>

    <table class="details-table">
        <tr><td class="label">Description of goods</td><td>${goodsDesc}</td></tr>
        <tr><td class="label">Form "M" No.</td><td>${data.other_ref || ''}</td></tr>
        <tr><td class="label">L/C No.</td><td>${data.lc_no_and_date || ''}</td></tr>
        <tr><td class="label">Lot No</td><td>${data.lot_no || ''}</td></tr>
        <tr><td class="label">Manufacturing Date</td><td>${formatDate(data.mfg_date)}</td></tr>
        <tr><td class="label">Expiry Date</td><td>${formatDate(data.expiry_date)}</td></tr>
    </table>

    <div class="signature">
        <strong>FOR ${data.company_name || ''}</strong>
        ${signatureImg ? `<img src="${signatureImg}" alt="Signature" />` : '<br/><br/><br/>'}
        DIRECTOR
    </div>
</div>
</body>
</html>`;
}

module.exports = { generateMFGTemplate };
