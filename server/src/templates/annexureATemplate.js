const { getImageBase64, formatDate } = require('../services/pdfService');

function generateAnnexureATemplate(data) {
    const headerImg = getImageBase64('chirag_organics_header.png');
    const signatureImg = getImageBase64('signature_stamp.png');

    const docDate = formatDate(data.shipping_bill_date || data.ci_invoice_date || data.invoice_date);
    const decl1 = data.annexa_decl_1 || `We hereby declare that the information furnished above is true, complete and correct in every respect.`;
    const decl2 = data.annexa_decl_2 || `We also undertake to bring to the notice of proper officer any particulars which subsequently come to our knowledge which will have bearing on evaluation`;
    const natureOfTransaction = data.annexa_nature || `SALES`;
    // 'NONE' is the sentinel the form saves when the user picks no rule; render blank.
    const methodOfValuation = data.annexa_method === 'NONE' ? `` : (data.annexa_method || `Rule 3`);
    const sellerBuyerRelated = data.annexa_related || `Not Applicable`;
    const priceInfluenced = data.annexa_price || ``;
    const previousExports = data.annexa_prev_exports || `${data.shipping_bill_no || ''} Date: ${docDate}`;
    const otherInfo = data.annexa_other_info || ``;

    return `<!DOCTYPE html>
<html>
<head>
<style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Times New Roman', Times, serif; font-size: 11px; color: #000; }
    .page { width: 100%; padding: 8mm; }
    .header { text-align: center; margin-bottom: 3px; }
    .header img { width: 100%; max-height: 70px; }
    .title { text-align: center; font-size: 13px; font-weight: bold; margin: 8px 0; text-decoration: underline; }
    .subtitle { text-align: center; font-size: 10px; margin-bottom: 12px; }
    .item { margin: 8px 0; font-size: 11px; line-height: 1.5; }
    .item-num { font-weight: bold; display: inline-block; width: 25px; }
    .item-label { font-weight: bold; }
    .declaration-title { font-weight: bold; text-decoration: underline; margin: 12px 0 5px 0; font-size: 11px; }
    .signature-section { display: flex; justify-content: space-between; margin-top: 25px; font-size: 11px; }
    .signature img { height: 55px; display: block; margin: 5px 0; }
</style>
</head>
<body>
<div class="page">
    <div class="header">
        ${headerImg ? `<img src="${headerImg}" alt="Company Header" />` : `<h2>${data.company_name || ''}</h2>`}
    </div>

    <div class="title">Annexure-A<br/>EXPORT VALUE DECLARATION</div>
    <div class="subtitle">(See Rule 7 of Customs Valuation (Determination of Value of Export Goods) Rules, 2007.)</div>

    <div class="item"><span class="item-num">1)</span> <span class="item-label">Shipping Bill No :-</span> ${data.shipping_bill_no || ''} &nbsp;&nbsp; <span class="item-label">Date :-</span> ${docDate}</div>
    <div class="item"><span class="item-num">2)</span> <span class="item-label">Invoice No :-</span> ${data.ci_invoice_no || data.invoice_no || ''} &nbsp;&nbsp; <span class="item-label">Date :-</span> ${docDate}</div>
    <div class="item"><span class="item-num">3)</span> <span class="item-label">Nature of Transaction :-</span> ${natureOfTransaction}</div>
    <div class="item"><span class="item-num">4)</span> <span class="item-label">Method Of Valuation :-</span> ${methodOfValuation}</div>
    <div class="item"><span class="item-num">5)</span> <span class="item-label">Whether Seller and Buyer Related :-</span> ${sellerBuyerRelated}</div>
    <div class="item"><span class="item-num">6)</span> <span class="item-label">If Yes, Whether relationship has Influenced the Price :-</span> ${priceInfluenced}</div>
    <div class="item"><span class="item-num">7)</span> <span class="item-label">Terms Of Payment :-</span> ${data.payment_terms || ''}</div>
    <div class="item"><span class="item-num">8)</span> <span class="item-label">Terms Of Delivery :-</span> ${data.incoterms || ''}</div>
    <div class="item"><span class="item-num">9)</span> <span class="item-label">Previous Exports of Identical / Similar Goods, if any :-</span><br/>
        &nbsp;&nbsp;&nbsp;&nbsp; ${previousExports}
    </div>
    <div class="item"><span class="item-num">10)</span> <span class="item-label">Any Other Relevant Information :-</span> ${otherInfo}</div>

    <div class="declaration-title">Declaration</div>
    <div class="item"><span class="item-num">1)</span> ${decl1}</div>
    <div class="item"><span class="item-num">2)</span> ${decl2}</div>

    <div class="signature-section">
        <div class="signature">
            <strong>FOR ${data.company_name || ''}</strong>
            ${signatureImg ? `<img src="${signatureImg}" alt="Signature" />` : '<br/><br/><br/>'}
            ${data.director_name || ''}<br/>
            DIRECTOR
        </div>
        <div>
            <strong>PLACE :-</strong> ${data.annexa_place || data.company_city || 'VAPI'}<br/><br/>
            <strong>DATE :-</strong> ${formatDate(data.ci_invoice_date || data.invoice_date)}
        </div>
    </div>
</div>
</body>
</html>`;
}

module.exports = { generateAnnexureATemplate };
