const { getImageBase64, formatDate } = require('../services/pdfService');

/**
 * Generate Beneficiary Certificate HTML template
 */
function generateBCTemplate(data) {
    const headerImg = getImageBase64('chirag_organics_header.png');
    const signatureImg = getImageBase64('signature_stamp.png');

    const containers = data.containers || [];
    const containerNos = containers.map(c => c.container_no).filter(Boolean).join('  |  ');

    const declaration1 = data.bc_declaration_1 || `We, ${data.consignor_name || ''} manufacturer of the goods enumerated in this invoice hereby declare and certify that one set of original documents Commercial invoice, COA, CCVO, Beneficiary Certificate including a copy of Bill of Lading and a Copy of CRIA report have been forwarded to below mentioned bank and address by courier not later then 21 days after shipment.`;
    const declaration2 = data.bc_declaration_2 || `We, ${data.consignor_name || ''} manufacturer of the goods enumerated in this invoice hereby declare and certify that this is the final shipment and there will neither be any further shipment and nor any additional drawdown other then the Invoice presented for collection against the Letter of Credit issued by ${data.consignee_name || ''} vide LC no. ${data.lc_no_and_date || ''}`;
    const declaration3 = data.bc_declaration_3 || `We, ${data.consignor_name || ''} manufacturer of the goods enumerated in this invoice hereby declare and certify that products have been delivered in conformity with the terms of the LC No. and dated as mentioned below, that all necessary documents have been forwarded to the consignee through the correspondent bank and that payment of the Invoice for delivery is properly due to them and would be exclusively used for the settlement of the Invoice.`;
    const issuedBy = data.bc_issued_by || data.consignee_name || '';

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
    .declaration { margin-top: 12px; font-size: 10px; line-height: 1.5; }
    .consignee-block { margin: 10px 0; margin-left: 20px; font-size: 10px; }
    .issued-by { margin-top: 12px; font-size: 10px; }
    .signature { text-align: left; margin-top: 20px; }
    .signature img { height: 55px; }
</style>
</head>
<body>
<div class="page">
    <div class="header">
        ${headerImg ? `<img src="${headerImg}" alt="Company Header" />` : `<h2>${data.company_name || ''}</h2>`}
    </div>

    <div class="title">BENEFICIARY CERTIFICATE</div>

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

    <!-- Declaration 1 -->
    <div class="declaration">
        ${declaration1}
    </div>

    <!-- Consignee Name & Address -->
    <div class="consignee-block">
        <strong>${issuedBy}</strong> &nbsp; ${data.consignee_address || ''}
    </div>

    <!-- Declaration 2 -->
    <div class="declaration">
        ${declaration2}
    </div>

    <!-- Declaration 3 -->
    <div class="declaration" style="margin-top: 12px;">
        ${declaration3}
    </div>

    <!-- Issued By -->
    <div class="issued-by">
        <strong>Issued By</strong> &nbsp; ${issuedBy} &nbsp;&nbsp; <strong>L/C no.</strong> &nbsp; ${data.lc_no_and_date || ''}
    </div>

    <!-- Signature -->
    <div class="signature">
        <br/><strong>FOR ${data.company_name || ''}</strong><br/><br/>
        ${signatureImg ? `<img src="${signatureImg}" alt="Signature" />` : ''}<br/>
        Authorised Signatory<br/>
        (${data.director_name || ''})
    </div>
</div>
</body>
</html>`;
}

module.exports = { generateBCTemplate };
