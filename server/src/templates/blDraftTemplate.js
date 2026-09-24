const { formatDate, cleanNum } = require('../services/pdfService');

function escapeHtml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;')
        .replace(/\r?\n/g, '<br/>');
}

function numberText(value) {
    if (value === null || value === undefined || value === '') return '';
    const number = Number(value);
    return Number.isFinite(number) ? cleanNum(number) : value;
}

function generateBLDraftTemplate(data) {
    const containers = data.containers || [];
    const weightXPackages = `${data.net_weight || ''} KGS X ${data.total_packages || ''} BAGS`;
    const descriptionOfGoods = [
        data.product_name,
        data.hs_code ? `HS CODE: ${data.hs_code}` : '',
        data.description
    ]
        .filter(Boolean)
        .join('\n')
        .replace(/Non-Palletised UN approved Bags/gi, '')
        .replace(/\n{2,}/g, '\n')
        .trim();
    const packageAndGoods = [
        weightXPackages,
        descriptionOfGoods
    ].filter(Boolean).join('\n');
    const marks = data.bl_marks_and_numbers || 'Product, Gross Wt, Tare wt, Nett Wt, Lot No., Bag No. Mfg Date, Exp Date, "Made In India", UN NO.';
    const notifyParty = [
        data.buyer_name,
        data.buyer_address,
        data.bl_notify_telephone || data.contact_mobile ? `Telephone: ${data.bl_notify_telephone || data.contact_mobile}` : '',
        data.bl_notify_email || data.contact_email ? `Email: ${data.bl_notify_email || data.contact_email}` : '',
        data.bl_notify_fax ? `Fax: ${data.bl_notify_fax}` : ''
    ].filter(Boolean).join('\n');
    const forwarding = data.bl_forwarding_details || '';
    const placeOfDelivery = data.bl_place_of_delivery || data.port_of_discharge || '';
    const freight = data.bl_freight || data.freight_terms || 'Freight Prepaid';
    const derivedMovement = containers.length
        ? `${containers.length} X ${containers[0].container_size || '40"'} FCL`
        : '';
    const movementOverride = String(data.bl_movement || '').trim();
    const movement = movementOverride && !/^FCL$/i.test(movementOverride)
        ? data.bl_movement
        : derivedMovement || data.bl_movement || '';
    const totalContainersOverride = String(data.bl_total_containers || '').trim();
    const totalContainers = totalContainersOverride && !/^FCL$/i.test(totalContainersOverride)
        ? data.bl_total_containers
        : derivedMovement || data.bl_total_containers || movement;
    const invoiceNo = data.ci_invoice_no || data.invoice_no || '';
    const invoiceDate = data.ci_invoice_date || data.invoice_date;
    const firstContainer = containers[0] || {};
    const firstProducts = firstContainer.products || [];
    const defaultGross = firstContainer.gross_weight || '';
    const defaultNet = firstProducts.reduce(
        (sum, product) => sum + (Number(product.net_weight) || 0),
        0
    ) || ((Number(data.net_weight) || 0) * (Number(data.per_fcl_packages) || 0)) || '';
    const defaultPackages = data.per_fcl_packages || firstProducts.reduce(
        (sum, product) => sum + (Number(product.num_packages) || 0),
        0
    ) || '';
    const blGross = data.bl_container_gross_weight || defaultGross;
    const blNet = data.bl_container_net_weight || defaultNet;
    const blPackages = data.bl_packages_per_container || defaultPackages;
    const numericValue = (value) => {
        const parsed = Number(String(value ?? '').replace(/,/g, '').trim());
        return Number.isFinite(parsed) ? parsed : null;
    };
    const grossPerContainer = numericValue(blGross);
    const netPerContainer = numericValue(blNet);
    const totalContainerGross = containers.length && grossPerContainer !== null
        ? grossPerContainer * containers.length
        : '';
    const totalContainerNet = containers.length && netPerContainer !== null
        ? netPerContainer * containers.length
        : '';

    const rows = containers.map((container, index) => `<tr>
            <td class="center">${index + 1}</td>
            <td>${escapeHtml(container.container_no)}<br/>${escapeHtml(container.liner_seal_no)}</td>
            <td>${escapeHtml(blPackages)}</td>
            <td class="right">${escapeHtml(numberText(blGross))}</td>
            <td class="right">${escapeHtml(numberText(blNet))}</td>
        </tr>`
    ).join('') || '<tr><td colspan="5" class="center">No containers recorded</td></tr>';

    const totalGross = totalContainerGross || (
        data.total_gross_weight ? Number(data.total_gross_weight) * 1000 : ''
    );
    const totalNet = totalContainerNet || (
        data.nett_weight ? Number(data.nett_weight) * 1000 : ''
    );
    const totalGrossMtValue = numericValue(totalGross);
    const totalNetMtValue = numericValue(totalNet);
    const totalGrossMt = totalGrossMtValue === null ? '' : totalGrossMtValue / 1000;
    const totalNetMt = totalNetMtValue === null ? '' : totalNetMtValue / 1000;

    return `<!DOCTYPE html>
<html><head><meta charset="UTF-8"/><style>
* { box-sizing: border-box; }
@page { size: A4 portrait; margin: 6mm; }
body { margin: 0; font-family: Arial, Helvetica, sans-serif; color: #000; font-size: 8px; }
.page { width: 100%; }
.header { text-align: center; margin-bottom: 3px; }.header img { width: 100%; max-height: 43px; object-fit: contain; }
.title { text-align: center; font-size: 14px; font-weight: bold; margin: 3px 0 5px; text-decoration: underline; }
table { width: 100%; border-collapse: collapse; table-layout: fixed; }
td, th { border: 1px solid #000; padding: 3px 4px; vertical-align: top; line-height: 1.25; word-wrap: break-word; }
.label { font-weight: bold; }.center { text-align: center; }.right { text-align: right; }
.party td { height: 48px; }.party .label-cell { width: 22%; font-weight: bold; }.party .value-cell { width: 28%; }
.routing td { height: 22px; }.routing .key { width: 22%; font-weight: bold; }.routing .value { width: 28%; }
.routing { margin-bottom: 0; }
.cargo { margin-top: 0; border-top: 0; }.cargo th { text-align: center; vertical-align: middle; font-weight: bold; }.cargo td { min-height: 28px; }
.cargo .marks { width: 22%; }.cargo .packages { width: 50%; }.cargo .weights { width: 28%; }
.cargo col.marks { width: 22%; }.cargo col.packages { width: 50%; }.cargo col.weights { width: 28%; }
.section { margin-top: 4px; font-weight: bold; font-size: 9px; }
.details td { height: 20px; }.details .key { width: 22%; font-weight: bold; }.details .value { width: 28%; }
.containers { margin-top: 4px; }.containers th { text-align: center; vertical-align: middle; }.containers td { height: 20px; }
.containers th:nth-child(1) { width: 8%; }.containers th:nth-child(2) { width: 28%; }.containers th:nth-child(3) { width: 22%; }.containers th:nth-child(4), .containers th:nth-child(5) { width: 21%; }
.footer { margin-top: 4px; }.footer td { height: 23px; }.remarks { height: 35px; }
</style></head><body><div class="page">
<div class="title">BILL OF LADING DRAFT</div>

<table class="party">
<tr><td class="label-cell">SHIPPER</td><td class="value-cell">${escapeHtml(data.consignor_name)}<br/>${escapeHtml(data.consignor_address)}</td><td class="label-cell">CONSIGNEE</td><td class="value-cell">TO THE ORDER OF<br/>${escapeHtml(data.consignee_name)}<br/>${escapeHtml(data.consignee_address)}</td></tr>
<tr><td class="label-cell">NOTIFY</td><td class="value-cell">${escapeHtml(notifyParty)}</td><td class="label-cell">FORWARDING</td><td class="value-cell">${escapeHtml(forwarding)}</td></tr>
</table>

<table class="routing">
<tr><td class="key">Vessel and Voyage No.</td><td class="value">${escapeHtml(data.vessel_no)}</td><td class="key">Place of Delivery</td><td class="value">${escapeHtml(placeOfDelivery)}</td></tr>
<tr><td class="key">Port of Loading</td><td class="value">${escapeHtml(data.port_of_loading)}</td><td class="key">Port of Discharge</td><td class="value">${escapeHtml(data.port_of_discharge)}</td></tr>
<tr><td class="key">Freight</td><td class="value">${escapeHtml(freight)}</td><td class="key"></td><td class="value"></td></tr>
</table>

<table class="cargo">
<colgroup><col class="marks"/><col class="packages"/><col class="weights"/></colgroup>
<tr><th class="marks">Marks &amp; Numbers</th><th class="packages">Number &amp; Kind of Packages<br/>Description of Goods</th><th class="weights">Weights</th></tr>
<tr><td class="marks">${escapeHtml(marks)}</td><td class="packages">${escapeHtml(packageAndGoods)}</td><td class="weights">Total Gross (KGS): ${escapeHtml(numberText(totalGross))}<br/>Total Net (KGS): ${escapeHtml(numberText(totalNet))}</td></tr>
</table>

<table class="details">
<tr><td class="key">INVOICE NO.</td><td class="value">${escapeHtml(invoiceNo)}</td><td class="key">INVOICE DATE</td><td class="value">${escapeHtml(formatDate(invoiceDate))}</td></tr>
<tr><td class="key">FORM M NO.</td><td class="value">${escapeHtml(data.bl_form_m_no || data.other_ref || '')}</td><td class="key">L/C NO. &amp; DATE</td><td class="value">${escapeHtml(data.bl_lc_no_and_date || data.lc_no_and_date || '')}</td></tr>
<tr><td class="key">TOTAL NET WT.</td><td class="value">${escapeHtml(numberText(totalNetMt))} MT</td><td class="key">TOTAL GR. WT.</td><td class="value">${escapeHtml(numberText(totalGrossMt))} MT</td></tr>
<tr><td class="key">UN NUMBER</td><td class="value">${escapeHtml(data.un_number)}</td><td class="key">CLASS / PACKING GROUP</td><td class="value">${escapeHtml(data.imdg_class)} / ${escapeHtml(data.packing_group)}</td></tr>
</table>

<div class="section">CONTAINER DETAILS</div>
<table class="containers"><thead><tr><th>S. NO.</th><th>CONTAINER NO. / LINER SEAL NO.</th><th>PACKAGES / CONTAINER (ALPHA-NUMERIC)</th><th>GROSS WT. (KGS)</th><th>NET WT. (KGS)</th></tr></thead><tbody>${rows}</tbody></table>

<table class="footer">
<tr><td><span class="label">Total No. of Containers / Package:</span> ${escapeHtml(totalContainers)}</td><td><span class="label">Movement:</span> ${escapeHtml(movement)}</td><td><span class="label">Freight:</span> ${escapeHtml(freight)}</td></tr>
<tr><td colspan="3" class="remarks"><span class="label">Remarks:</span><br/>${escapeHtml(data.bl_remarks)}</td></tr>
</table>
</div></body></html>`;
}

module.exports = { generateBLDraftTemplate };
