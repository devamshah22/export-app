const { getImageBase64, formatDate } = require('../services/pdfService');

function generateFormSDFTemplate(data) {
    const headerImg = getImageBase64('chirag_organics_header.png');
    const signatureImg = getImageBase64('signature_stamp.png');

    const decl1a = data.sdf_decl_1a || `The value as contracted with the buyer is the same as the full export value declared in the above shipping bill.`;
    const decl1b = data.sdf_decl_1b || `The full export value of the goods is not ascertainable at the time of export and that the value declared is that which I/We having regard to the prevailing market`;
    const decl2 = data.sdf_decl_2 || `We undertake that We will deliver to the bank named here in`;
    const decl3 = data.sdf_decl_3 || `We further declare that We are resident in India and We have a place of business in India.`;
    const cautionText = data.sdf_caution || `We are not in Caution List of the Reserve Bank of India.`;
    const docDate = formatDate(data.shipping_bill_date || data.ci_invoice_date || data.invoice_date);

    return `<!DOCTYPE html>
<html>
<head>
<style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Times New Roman', Times, serif; font-size: 11px; color: #000; }
    .page { width: 100%; padding: 10mm; }
    .header { text-align: center; margin-bottom: 5px; }
    .header img { width: 100%; max-height: 70px; }
    .title { text-align: center; font-size: 14px; font-weight: bold; margin: 10px 0; text-decoration: underline; }
    .ref-line { margin: 8px 0; font-size: 11px; }
    .heading { font-weight: bold; margin: 15px 0 8px 0; font-size: 11px; text-decoration: underline; }
    .para { margin: 8px 0 8px 20px; font-size: 11px; line-height: 1.6; }
    .sub-para { margin: 5px 0 5px 40px; font-size: 11px; line-height: 1.6; }
    .signature { margin-top: 30px; font-size: 11px; }
    .signature img { height: 55px; display: block; margin: 5px 0; }
    .date-bottom { margin-top: 10px; font-size: 11px; }
</style>
</head>
<body>
<div class="page">
    <div class="header">
        ${headerImg ? `<img src="${headerImg}" alt="Company Header" />` : `<h2>${data.company_name || ''}</h2>`}
    </div>

    <div class="title">"Form SDF"</div>

    <div class="ref-line">
        <strong>Shipping Bill No:-</strong> ${data.shipping_bill_no || ''} &nbsp;&nbsp;&nbsp;&nbsp;
        <strong>Date :-</strong> ${docDate}
    </div>

    <div class="heading">Declaration under Foreign Exchange Regulation Act, 1973:</div>

    <div class="para">
        1) ${data.sdf_decl_1_main || `We hereby declare that We Are the CONSIGNOR of the goods in respect of which this declaration made and that particulars given to shipping Bill no: <strong>${data.shipping_bill_no || ''}</strong> dated: <strong>${docDate}</strong> are true and that:`}
    </div>
    <div class="sub-para">a) ${decl1a}</div>
    <div class="sub-para">b) ${decl1b}</div>

    <div class="para">2) ${decl2} <strong>${data.bank_name || ''}</strong></div>
    <div class="para">3) ${decl3}</div>
    <div class="para">${cautionText}</div>

    <div class="signature">
        <strong>FOR ${data.company_name || ''}</strong>
        ${signatureImg ? `<img src="${signatureImg}" alt="Signature" />` : '<br/><br/><br/>'}
        ${data.director_name || ''}<br/>
        DIRECTOR
    </div>

    <div class="date-bottom"><strong>Date :-</strong> ${docDate}</div>
</div>
</body>
</html>`;
}

module.exports = { generateFormSDFTemplate };
