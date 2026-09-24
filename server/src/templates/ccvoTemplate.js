const { getImageBase64, formatDate, formatNumber } = require('../services/pdfService');

/**
 * Generate CCVO (Combined Certificate of Origin and Value) HTML template
 */
function generateCCVOTemplate(data) {
    const headerImg = getImageBase64('chirag_organics_header.png');
    const signatureImg = getImageBase64('signature_stamp.png');

    const containers = data.containers || [];
    const containerNos = containers.map(c => c.container_no).filter(Boolean).join('  |  ');
    const incoLabel = data.incoterms ? data.incoterms.split(',')[0].trim() : '';

    return `<!DOCTYPE html>
<html>
<head>
<style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Times New Roman', Times, serif; font-size: 10px; color: #000; }
    .page { width: 100%; padding: 6mm; }
    .header { text-align: center; margin-bottom: 3px; }
    .header img { width: 100%; max-height: 70px; }
    .title { text-align: center; font-size: 13px; font-weight: bold; margin: 8px 0; text-decoration: underline; }
    .main-layout { display: flex; width: 100%; border: 1px solid #000; }
    .left-col { width: 45%; border-right: 1px solid #000; }
    .right-col { width: 55%; }
    .cell { padding: 2px 5px; border-bottom: 1px solid #000; font-size: 9.5px; line-height: 1.4; }
    .cell:last-child { border-bottom: none; }
    .cell-label { font-weight: bold; font-size: 9px; }
    .row-flex { display: flex; }
    .row-flex > div { flex: 1; }
    .product-table { width: 100%; border-collapse: collapse; margin-top: -1px; }
    .product-table th, .product-table td { border: 1px solid #000; padding: 4px 5px; font-size: 9.5px; vertical-align: top; }
    .product-table th { background: #f5f5f5; font-weight: bold; text-align: center; }
    .right { text-align: right; }
    .declaration { margin-top: 12px; font-size: 10px; }
    .declaration-title { font-weight: bold; text-decoration: underline; margin-top: 10px; margin-bottom: 4px; }
    .signature { text-align: right; margin-top: 20px; }
    .signature img { height: 55px; }
</style>
</head>
<body>
<div class="page">
    <div class="header">
        ${headerImg ? `<img src="${headerImg}" alt="Company Header" />` : `<h2>${data.company_name || ''}</h2>`}
    </div>

    <div class="title">COMBINED CERTIFICATE OF ORIGIN AND VALUE</div>

    <!-- Main Layout -->
    <div class="main-layout">
        <div class="left-col">
            <div class="cell">
                <span class="cell-label">CONSIGNEE</span><br/>
                To the Order OF<br/>
                ${data.consignee_name || ''}<br/>
                ${data.consignee_address || ''}
            </div>
            <div class="cell">
                <span class="cell-label">BUYER</span><br/>
                ${data.buyer_name || ''}<br/>
                ${data.buyer_address || ''}
            </div>
        </div>
        <div class="right-col">
            <div class="cell">
                <div class="row-flex">
                    <div><span class="cell-label">CERTIFICATE No.</span> :- ${data.ci_invoice_no || data.invoice_no || ''}</div>
                    <div><span class="cell-label">DATE</span> :- ${formatDate(data.ci_invoice_date || data.invoice_date)}</div>
                </div>
            </div>
            <div class="cell">
                <div class="row-flex">
                    <div><span class="cell-label">INVOICE NO.</span> :- ${data.ci_invoice_no || data.invoice_no || ''}</div>
                    <div><span class="cell-label">DATE</span> :- ${formatDate(data.ci_invoice_date || data.invoice_date)}</div>
                </div>
            </div>
            <div class="cell"><span class="cell-label">FORM "M" No.</span> :- ${data.other_ref || ''}</div>
            <div class="cell"><span class="cell-label">PORT OF LOADING</span> :- ${data.port_of_loading || ''}</div>
            <div class="cell"><span class="cell-label">PORT OF DISCHARGE</span> :- ${data.port_of_discharge || ''}</div>
            <div class="cell"><span class="cell-label">COUNTRY OF ORIGIN</span> :- ${data.country_of_origin || ''}</div>
            <div class="cell"><span class="cell-label">COUNTRY OF DISCHARGE</span> :- ${data.country_of_discharge || ''}</div>
            <div class="cell"><span class="cell-label">COUNTRY OF SUPPLY</span> :- ${data.country_of_supply || 'India'}</div>
            <div class="cell"><span class="cell-label">SHIPMENT DATE</span> :- ${formatDate(data.shipment_date)}</div>
            <div class="cell"><span class="cell-label">VESSEL No.</span> :- ${data.vessel_no || ''}</div>
            <div class="cell"><span class="cell-label">Bill Of Lading No.</span> :- ${data.bill_of_lading_no || ''}</div>
            <div class="cell"><span class="cell-label">CONTAINER No.</span> :- ${containerNos}</div>
        </div>
    </div>

    <!-- Product Table -->
    <table class="product-table">
        <tr>
            <th>Sr. No.</th>
            <th>DESCRIPTION OF GOODS</th>
            <th colspan="2">QUANTITY</th>
            <th colspan="3">VALUE</th>
        </tr>
        <tr>
            <td>1</td>
            <td>
                ${data.product_name || ''}<br/>
                ${data.hs_code ? 'HS CODE : ' + data.hs_code : ''}<br/>
                ${data.container_goods_description || ''}
            </td>
            <td>GW<br/>NW</td>
            <td>${data.total_gross_weight || ''}<br/>${data.nett_weight || ''}</td>
            <td>FOB<br/>${incoLabel}</td>
            <td>${data.currency || ''}<br/>${data.currency || ''}</td>
            <td class="right">${formatNumber(data.fob_amount)}<br/>${formatNumber(data.total_amount)}</td>
        </tr>
    </table>

    <!-- Declarations -->
    <div class="declaration">
        <div class="declaration-title">DECLARATION FOR ORIGIN</div>
        <p>${data.ccvo_declaration_origin || `We, ${data.consignor_name || ''} manufacturer of the goods enumerated in this invoice hereby declare and certify that the goods have been wholly manufactured in India.`}</p>

        <div class="declaration-title">DECLARATION FOR VALUE</div>
        <p>${data.ccvo_declaration_value || `We, ${data.consignor_name || ''} manufacturer of the goods enumerated in this invoice hereby declare and certify that this invoice is in all respect correct and contains a true and full statement of the price actually paid or to be paid for the said goods and the actual quantity thereof.`}</p>
    </div>

    <!-- Signature -->
    <div class="signature">
        <strong>FOR ${data.company_name || ''}</strong><br/><br/>
        ${signatureImg ? `<img src="${signatureImg}" alt="Signature" />` : ''}<br/>
        Authorised Signatory<br/>
        (${data.director_name || ''})
    </div>
</div>
</body>
</html>`;
}

module.exports = { generateCCVOTemplate };
