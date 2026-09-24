const { getImageBase64, formatDate } = require('../services/pdfService');

function generateSCOMETTemplate(data) {
    const headerImg = getImageBase64('chirag_organics_header.png');
    const signatureImg = getImageBase64('signature_stamp.png');

    const portName = data.port_of_loading ? data.port_of_loading.split(',')[0].trim() : '';
    const subjectText = data.scomet_subject || `Declaration for Export Consignment Being Exported vide our Custom`;
    const descriptionText = data.scomet_description || `We wish to bring to your kind notice that the exported item is ${data.product_name || ''} as PER INV & PL We declare that these items do not fall under SCOMET Item list.`;
    const requestText = data.scomet_request || `We hereby request you to kindly allow the goods to be exported.`;
    const shipperName = data.consignor_name ? `M/s ${data.consignor_name}` : '';

    return `<!DOCTYPE html>
<html>
<head>
<style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Times New Roman', Times, serif; font-size: 11px; color: #000; }
    .page { width: 100%; padding: 10mm; }
    .header { text-align: center; margin-bottom: 5px; }
    .header img { width: 100%; max-height: 70px; }
    .date-line { text-align: right; margin: 10px 0; font-size: 11px; }
    .to-block { margin: 10px 0; font-size: 11px; line-height: 1.8; }
    .subject { margin: 15px 0; font-size: 11px; }
    .shipper { margin: 10px 0; font-size: 11px; }
    .description { margin: 15px 0; font-size: 11px; line-height: 1.6; }
    .table { width: 80%; margin: 15px 0; border-collapse: collapse; }
    .table th, .table td { border: 1px solid #000; padding: 5px 8px; font-size: 11px; text-align: left; }
    .table th { background: #f0f0f0; font-weight: bold; }
    .request { margin: 20px 0; font-size: 11px; }
    .signature { margin-top: 30px; font-size: 11px; }
    .signature img { height: 55px; display: block; margin: 5px 0; }
</style>
</head>
<body>
<div class="page">
    <div class="header">
        ${headerImg ? `<img src="${headerImg}" alt="Company Header" />` : `<h2>${data.company_name || ''}</h2>`}
    </div>

    <div class="date-line">
        <strong>Date :-</strong> ${formatDate(data.ci_invoice_date || data.invoice_date)}
    </div>

    <div class="to-block">
        <strong>TO,</strong><br/>
        The Superintendent / Dy. Of Customs,<br/>
        Export Department,<br/>
        ${portName}
    </div>

    <div class="subject">
        <strong>Sub:-</strong> ${subjectText}
    </div>

    <div class="shipper">
        <strong>Shipper:-</strong> ${shipperName}
    </div>

    <table class="table">
        <tr>
            <th>Sr. No.</th>
            <th>Invoice No.</th>
            <th>Date</th>
            <th>HS Code</th>
        </tr>
        <tr>
            <td>${data.scomet_sr_no || '1'}</td>
            <td>${data.ci_invoice_no || data.invoice_no || ''}</td>
            <td>${formatDate(data.ci_invoice_date || data.invoice_date)}</td>
            <td>${data.hs_code || ''}</td>
        </tr>
    </table>

    <div class="description">
        ${descriptionText}
    </div>

    <div class="request">
        ${requestText}
    </div>

    <div class="signature">
        <strong>FOR ${data.company_name || ''}</strong>
        ${signatureImg ? `<img src="${signatureImg}" alt="Signature" />` : '<br/><br/><br/>'}
        ${data.director_name || ''}<br/>
        (Director)
    </div>
</div>
</body>
</html>`;
}

module.exports = { generateSCOMETTemplate };
