const { getImageBase64, formatDate, cleanNum } = require('../services/pdfService');

function escapeHtml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;')
        .replace(/\n/g, '<br/>');
}

function formatWeight(value) {
    if (value === null || value === undefined || value === '') return '';
    const parsed = Number(value);
    return Number.isFinite(parsed) ? cleanNum(parsed) : value;
}

function formatAnnexureDate(value) {
    if (!value) return '';
    const text = String(value);
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(text)) return text;
    return formatDate(value);
}

function generateAnnexureCTemplate(data) {
    const headerImg = getImageBase64('chirag_organics_header.png');
    const signatureImg = getImageBase64('signature_stamp.png');
    const defaultCertification = 'Certified that the description and value of the goods covered by this invoce have been checked by me and that goods have been packed and sealed with liner seal under my supervision. We declare that export duty drawback (DBK) may be ascertained at the port on the basis of the merit /demerit of above description.';
    const containers = data.containers || [];
    const perFclPackages = Number(data.per_fcl_packages || 0);
    const masterTareWeight = Number(data.tare_weight || 0);
    const masterNetWeight = Number(data.net_weight || 0);
    const annexureGrossWeight = perFclPackages && (masterTareWeight || masterNetWeight)
        ? ((masterTareWeight + masterNetWeight) * perFclPackages) / 1000
        : '';
    const annexureNetWeight = perFclPackages && masterNetWeight
        ? (masterNetWeight * perFclPackages) / 1000
        : '';
    const reportDate = data.ci_invoice_date;
    const rows = containers.length ? containers.map((container, index) => `
        <tr>
            <td>${index + 1}</td>
            <td>${escapeHtml(container.container_no)}</td>
            <td>${escapeHtml(container.container_size)}</td>
            <td>${escapeHtml(container.liner_seal_no)}</td>
            <td>${escapeHtml(perFclPackages || '')}</td>
            <td>${escapeHtml(formatWeight(annexureGrossWeight))}</td>
            <td>${escapeHtml(formatWeight(annexureNetWeight))}</td>
            <td>${escapeHtml(container.rfid_seal_no)}</td>
        </tr>`).join('') : `
        <tr><td colspan="8" class="empty">No containers recorded</td></tr>`;

    return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8" />
<style>
    * { box-sizing: border-box; }
    @page { size: A4 portrait; margin: 8mm; }
    body { margin: 0; color: #000; font-family: 'Times New Roman', Times, serif; font-size: 10px; }
    .page { width: 100%; }
    .header { text-align: center; margin-bottom: 4px; }
    .header img { width: 100%; max-height: 58px; object-fit: contain; }
    .title { text-align: center; font-weight: bold; font-size: 14px; margin: 5px 0 2px; }
    .subtitle { text-align: center; font-weight: bold; font-size: 11px; margin-bottom: 8px; }
    table { width: 100%; border-collapse: collapse; }
    th, td { border: 1px solid #000; padding: 3px 4px; vertical-align: top; line-height: 1.25; }
    th { font-weight: bold; text-align: center; }
    .metadata td { height: 21px; }
    .label { font-weight: bold; }
    .center { text-align: center; }
    .details { margin-top: 7px; }
    .details td:first-child { width: 6%; text-align: center; font-weight: bold; }
    .details td:nth-child(2) { width: 38%; font-weight: bold; }
    .details td:nth-child(3) { width: 56%; }
    .containers { margin-top: 8px; font-size: 9px; }
    .containers th { vertical-align: middle; }
    .containers td { text-align: center; }
    .empty { padding: 12px; }
    .certification { margin-top: 10px; border: 1px solid #000; padding: 7px; line-height: 1.4; }
    .signature-section { display: flex; justify-content: space-between; margin-top: 18px; min-height: 92px; }
    .signature img { height: 48px; display: block; margin: 5px 0; }
    .right { text-align: right; }
</style>
</head>
<body>
<div class="page">
    <div class="header">
        ${headerImg ? `<img src="${headerImg}" alt="Company Header" />` : `<strong>${escapeHtml(data.company_name)}</strong>`}
    </div>
    <div class="title">ANNEXURE &quot;C&quot;</div>
    <div class="subtitle">REPORT FOR FACTORY SEALED PACKAGES CONTAINERS</div>

    <table class="metadata">
        <tr>
            <td><span class="label">RANGE</span><br/>${escapeHtml(data.annexc_range || data.range_name)}</td>
            <td><span class="label">DIVISION</span><br/>${escapeHtml(data.annexc_division || data.division)}</td>
            <td><span class="label">COMMISSIONERATE</span><br/>${escapeHtml(data.annexc_commissionerate || data.commissionerate)}</td>
        </tr>
        <tr>
            <td colspan="2"><span class="label">SHIPPING BILL NO.</span><br/>${escapeHtml(data.shipping_bill_no)}</td>
            <td><span class="label">DATE</span><br/>${escapeHtml(formatAnnexureDate(reportDate))}</td>
        </tr>
    </table>

    <table class="details">
        <tr><td>1</td><td>NAME OF EXPORTER</td><td>${escapeHtml(data.consignor_name)}</td></tr>
        <tr><td>2(a)</td><td>IEC No.</td><td>${escapeHtml(data.annexc_iec_no || data.iec_no || '0302034218')}</td></tr>
        <tr><td>2(b)</td><td>GST No.</td><td>${escapeHtml(data.gst_no)}</td></tr>
        <tr><td>2(c)</td><td>CIN / PAN Based Business Identification No. of Exporter</td><td>${escapeHtml(data.cin_no)}</td></tr>
        <tr><td>3</td><td>NAME OF STUFFING PREMISES</td><td>${escapeHtml(data.company_name)}</td></tr>
        <tr><td>4</td><td>ADDRESS</td><td>${escapeHtml(data.company_address)}</td></tr>
        <tr><td>5</td><td>DATE OF STUFFING</td><td>${escapeHtml(formatAnnexureDate(reportDate))}</td></tr>
        <tr><td>6</td><td>PARTICULAR OF EXPORT INVOICE</td><td>${escapeHtml(data.ci_invoice_no)}</td></tr>
        <tr><td>7</td><td>DESCRIPTION OF GOODS</td><td>${escapeHtml(data.product_name)}</td></tr>
        <tr><td>8</td><td>TOTAL NUMBER OF PACKAGES</td><td>${escapeHtml(perFclPackages || '')}</td></tr>
        <tr><td>9</td><td>NAME / ADDRESS OF CONSIGNEE</td><td>${escapeHtml(data.consignee_name)}<br/>${escapeHtml(data.consignee_address)}</td></tr>
        <tr><td>10</td><td>Is the description of the goods? The quantity and their value as per the particulars furnished in export invoice.</td><td>${escapeHtml(data.annexc_description_value_match || 'Yes')}</td></tr>
        <tr><td>11</td><td>Whether sample is drawn for being forwarded to port of export</td><td>${escapeHtml(data.annexc_sample_drawn || 'N.A.')}</td></tr>
        <tr><td></td><td>SELF-SEALING PERMISSION</td><td>${escapeHtml(data.annexc_self_sealing_permission || '')}</td></tr>
    </table>

    <table class="containers">
        <thead>
            <tr>
                <th>S. NO.</th><th>CONTAINER NO.</th><th>SIZE</th><th>LINER SEAL NO.</th>
                <th>NO. PACKAGES</th><th>GROSS WEIGHT<br/>(MTS)</th><th>NET WEIGHT<br/>(MTS)</th><th>E-SEAL</th>
            </tr>
        </thead>
        <tbody>${rows}</tbody>
    </table>

    <div class="certification">${escapeHtml(data.annexc_certification || defaultCertification)}</div>

    <div class="signature-section">
        <div class="signature">
            <strong>For ${escapeHtml(data.company_name)}</strong>
            ${signatureImg ? `<img src="${signatureImg}" alt="Signature" />` : '<br/><br/><br/>'}
            ${escapeHtml(data.director_name)}<br/>DIRECTOR
        </div>
        <div class="right">
            <strong>PLACE :-</strong> ${escapeHtml(data.annexc_place || data.company_city || 'VAPI')}<br/><br/>
            <strong>DATE :-</strong> ${escapeHtml(formatAnnexureDate(reportDate))}
        </div>
    </div>
</div>
</body>
</html>`;
}

module.exports = { generateAnnexureCTemplate };
