const { getImageBase64, formatDate } = require('../services/pdfService');

function generateEUCTemplate(data) {
    const headerImg = getImageBase64('chirag_organics_header.png');
    const signatureImg = getImageBase64('signature_stamp.png');

    const declaration1 = data.euc_declaration_1 || `The above Product is not under APPENDIX-3 - SCOMET list nor NDPSACT, 1985. Also it is not used for Drugs and Pharmaceuticals purpose.\nWe request you to kindly allow export of this goods.`;
    const application = data.euc_application || data.application || '';

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
    .info-table { width: 100%; margin: 15px 0; }
    .info-table td { padding: 4px 5px; font-size: 11px; }
    .info-table .label { font-weight: bold; width: 200px; }
    .section-title { font-weight: bold; text-decoration: underline; margin: 15px 0 8px 0; font-size: 11px; }
    .goods-table { width: 100%; border-collapse: collapse; margin: 10px 0; }
    .goods-table th, .goods-table td { border: 1px solid #000; padding: 5px 8px; font-size: 11px; text-align: left; }
    .goods-table th { background: #f0f0f0; font-weight: bold; }
    .para { margin: 12px 0; font-size: 11px; line-height: 1.6; }
    .signature { margin-top: 40px; font-size: 11px; }
    .signature img { height: 55px; display: block; margin: 5px 0; }
</style>
</head>
<body>
<div class="page">
    <div class="header">
        ${headerImg ? `<img src="${headerImg}" alt="Company Header" />` : `<h2>${data.company_name || ''}</h2>`}
    </div>

    <div class="title">END USE CERTIFICATE</div>

    <table class="info-table">
        <tr><td class="label">Name of The Supplier :-</td><td>${data.consignor_name || ''}</td></tr>
        <tr><td class="label">Name of the Buyer :-</td><td>${data.buyer_name || ''}</td></tr>
    </table>

    <div class="section-title">DETAILS OF THE GOODS</div>

    <table class="goods-table">
        <tr>
            <th>Sr No.</th>
            <th>DESCRIPTION</th>
            <th>UOM</th>
            <th>QTY</th>
            <th>HS CODE</th>
            <th>APPLICATION</th>
        </tr>
        <tr>
            <td>1</td>
            <td>${data.product_name || ''}</td>
            <td>${data.uom || ''}</td>
            <td>${data.nett_weight || data.total_quantity || ''}</td>
            <td>${data.hs_code || ''}</td>
            <td>${application}</td>
        </tr>
    </table>

    <div class="para">${declaration1.replace(/\n/g, '<br/>')}</div>

    <div class="signature">
        <strong>FOR ${data.company_name || ''}</strong>
        ${signatureImg ? `<img src="${signatureImg}" alt="Signature" />` : '<br/><br/><br/>'}
        Authorised Signatory<br/>
        (${data.director_name || ''})
    </div>
</div>
</body>
</html>`;
}

module.exports = { generateEUCTemplate };
