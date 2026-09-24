const { getImageBase64, formatDate, formatNumber } = require('../services/pdfService');
const { amountToWordsSimple } = require('../utils/numberToWords');

/**
 * Generate Commercial Invoice HTML template
 * @param {object} data - Master data with all related fields
 * @returns {string} HTML string
 */
function generateCITemplate(data) {
    const headerImg = getImageBase64('chirag_organics_header.png');
    const signatureImg = getImageBase64('signature_stamp.png');

    const totalAmount = parseFloat(data.total_amount) || 0;
    const amountWords = totalAmount ? amountToWordsSimple(totalAmount, data.currency || 'USD') : '';
    const incoLabel = data.incoterms ? data.incoterms.split(',')[0].trim() : '';

    // Container numbers list
    const containers = data.containers || [];
    const containerNos = containers.map(c => c.container_no).filter(Boolean).join('  |  ');

    // PI number formatted
    const piNumber = data.pi_number ? String(data.pi_number).padStart(3, '0') : '';

    return `<!DOCTYPE html>
<html>
<head>
<style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Times New Roman', Times, serif; font-size: 10px; color: #000; }
    .page { width: 100%; padding: 5mm; }
    .header { text-align: center; margin-bottom: 3px; }
    .header img { width: 100%; max-height: 70px; }
    .title { text-align: center; font-size: 13px; font-weight: bold; margin: 5px 0; text-decoration: underline; }
    .main-layout { display: flex; width: 100%; border: 1px solid #000; }
    .left-col { width: 45%; border-right: 1px solid #000; }
    .right-col { width: 55%; }
    .cell { padding: 2px 3px 2px 5px; border-bottom: 1px solid #000; font-size: 9.5px; line-height: 1.4; }
    .cell:last-child { border-bottom: none; }
    .cell-label { font-weight: bold; font-size: 9px; }
    .row-flex { display: flex; }
    .row-flex > div { flex: 1; }
    table { width: 100%; border-collapse: collapse; }
    .product-table { margin-top: -1px; }
    .product-table th, .product-table td { border: 1px solid #000; padding: 3px 4px; font-size: 9px; vertical-align: top; }
    .product-table th { background: #f5f5f5; font-weight: bold; text-align: center; }
    .right { text-align: right; }
    .center { text-align: center; }
    .bold { font-weight: bold; }
    .section { padding: 3px 5px; border: 1px solid #000; border-top: none; font-size: 9px; }
    .bank-row { display: flex; font-size: 9px; margin-top: 2px; }
    .bank-row .label { min-width: 65px; font-weight: bold; white-space: nowrap; margin-right: 3px; }
    .signature { text-align: right; margin-top: 10px; }
    .signature img { height: 60px; }
    .declaration { font-size: 8.5px; margin-top: 8px; font-style: italic; }
    .amount-words { font-weight: bold; font-size: 9.5px; padding: 3px 5px; border: 1px solid #000; border-top: none; }
    .bottom-section { display: flex; border: 1px solid #000; border-top: none; font-size: 9px; }
    .bottom-left { width: 50%; padding: 4px 5px; border-right: 1px solid #000; }
    .bottom-right { width: 50%; padding: 4px 5px; }
</style>
</head>
<body>
<div class="page">
    <!-- Header -->
    <div class="header">
        ${headerImg ? `<img src="${headerImg}" alt="Company Header" />` : `<h2>${data.company_name || ''}</h2>`}
    </div>

    <div class="title">COMMERCIAL INVOICE</div>

    <!-- Main Two Column Layout -->
    <div class="main-layout">
        <!-- Left Column: Consignee, Buyer, Notify -->
        <div class="left-col">
            <div class="cell">
                <span class="cell-label">CONSIGNEE</span><br/>
                TO THE ORDER OF<br/>
                ${data.consignee_name || ''}<br/>
                ${data.consignee_address || ''}
            </div>
            <div class="cell">
                <span class="cell-label">BUYER</span><br/>
                ${data.buyer_name || ''}<br/>
                ${data.buyer_address || ''}
            </div>
            <div class="cell" style="padding: 3px 5px;">
                <span class="cell-label">NOTIFY PARTY</span><br/>
                1. ${data.consignee_name || ''}<br/>
                2. ${data.buyer_name || ''}
            </div>
        </div>

        <!-- Right Column: Reference details -->
        <div class="right-col">
            <div class="cell">
                <div class="row-flex">
                    <div><span class="cell-label">PACKING LIST NO</span> :- ${data.ci_invoice_no || data.invoice_no || ''}</div>
                    <div><span class="cell-label">DATE</span> :- ${formatDate(data.ci_invoice_date || data.invoice_date)}</div>
                </div>
            </div>
            <div class="cell">
                <div class="row-flex">
                    <div><span class="cell-label">INVOICE NO.</span> :- ${data.ci_invoice_no || data.invoice_no || ''}</div>
                    <div><span class="cell-label">DATE</span> :- ${formatDate(data.ci_invoice_date || data.invoice_date)}</div>
                </div>
            </div>
            <div class="cell">
                <div class="row-flex">
                    <div><span class="cell-label">PO NO.</span> :- ${data.po_no || ''}</div>
                    <div><span class="cell-label">DATE</span> :- ${formatDate(data.po_date)}</div>
                </div>
            </div>
            <div class="cell"><span class="cell-label">OTHER REF</span> :- ${data.other_ref || ''}</div>
            <div class="cell"><span class="cell-label">LUT ARN No.</span> :- ${data.lut_arn_no || ''}</div>
            <div class="cell"><span class="cell-label">PORT OF LOADING</span> :- ${data.port_of_loading || ''}</div>
            <div class="cell"><span class="cell-label">PORT OF DISCHARGE</span> :- ${data.port_of_discharge || ''}</div>
            <div class="cell">
                <div class="row-flex">
                    <div><span class="cell-label">COUNTRY OF ORIGIN</span> :- ${data.country_of_origin || ''}</div>
                    <div><span class="cell-label">COUNTRY OF DISCHARGE</span> :- ${data.country_of_discharge || ''}</div>
                </div>
            </div>
            <div class="cell"><span class="cell-label">COUNTRY OF SUPPLY</span> :- ${data.country_of_supply || 'India'}</div>
            <div class="cell"><span class="cell-label">Shipment Date</span> :- ${formatDate(data.shipment_date)}</div>
            <div class="cell"><span class="cell-label">VESSEL No.</span> :- ${data.vessel_no || ''}</div>
            <div class="cell"><span class="cell-label">BILL OF LADING No.</span> :- ${data.bill_of_lading_no || ''}</div>
            <div class="cell"><span class="cell-label">CONTAINER No.</span> :- ${containerNos}</div>
            <div class="cell"><span class="cell-label">Incoterms</span> :- ${data.incoterms || ''}</div>
            <div class="cell"><span class="cell-label">Payment</span> :- ${data.payment_terms || ''}</div>
            <div class="cell"><span class="cell-label">Issuing Bank</span> :- ${data.issuing_bank || ''}</div>
            <div class="cell"><span class="cell-label">L/c No. and Date</span> :- ${data.lc_no_and_date || ''}</div>
        </div>
    </div>

    <!-- Product Table -->
    <table class="product-table">
        <tr>
            <th>SR NO</th>
            <th>PRODUCT</th>
            <th>DESCRIPTION</th>
            <th>LOT NO.</th>
            <th>QTY</th>
            <th>UNIT RATE</th>
            <th>AMOUNT</th>
        </tr>
        <tr>
            <td class="center">1)</td>
            <td>
                ${data.product_name || ''}<br/>
                ${data.hs_code ? 'HS CODE:- ' + data.hs_code : ''}
            </td>
            <td>
                ${data.net_weight || ''} ${data.unit_1 || ''} X ${data.total_packages || ''} ${data.unit_2 || ''}<br/>
                ${data.packing_type || ''}<br/>
                ${data.description || ''}
            </td>
            <td>${data.lot_no || ''}</td>
            <td class="right">
                ${data.total_quantity || data.net_weight || ''}<br/>
                ${data.uom || ''}
            </td>
            <td class="right">
                ${data.currency || ''}<br/>
                ${data.unit_rate || ''}<br/>
                PER ${data.uom || ''}
            </td>
            <td class="right">
                ${data.currency || ''}<br/>
                ${formatNumber(data.total_amount)}
            </td>
        </tr>
        <tr>
            <td colspan="4"></td>
            <td colspan="2" style="font-size:9px;">
                ${data.fob_amount ? 'FOB (' + (data.currency || '') + ')' : ''}<br/>
                ${data.freight_amount ? 'Freight (' + (data.currency || '') + ')' : ''}<br/>
                ${incoLabel ? incoLabel + ' (' + (data.currency || '') + ')' : ''}
            </td>
            <td class="right" style="font-size:9px;">
                ${data.fob_amount ? formatNumber(data.fob_amount) : ''}<br/>
                ${data.freight_amount ? formatNumber(data.freight_amount) : ''}<br/>
                ${data.total_amount ? formatNumber(data.total_amount) : ''}
            </td>
        </tr>
    </table>

    <!-- Amount in Words -->
    <div class="amount-words">
        AMOUNT (IN WORDS): ${data.currency || ''} ${amountWords}<br/>
        <span style="font-size:8.5px;">${data.incoterms || ''}</span>
    </div>

    <!-- Bottom Section: Shipping Marks + Bank Details -->
    <div class="bottom-section">
        <div class="bottom-left">
            <span class="bold">Shipping Marks:</span> Product, Gross Wt, Tare wt, Nett Wt, Lot No., Bag No. Mfg Date, Exp Date, "Made In India", UN NO.<br/><br/>
            <span class="bold">Gross Weight:</span> ${data.total_gross_weight || ''} MT<br/>
            <span class="bold">Nett Weight:</span> ${data.nett_weight || ''} MT<br/>
            <span class="bold">Freight:</span> ${data.freight_terms || '"Freight Paid"'}<br/><br/>
            <span class="bold">Drawn Under L/C issued By:</span> ${data.issuing_bank || ''} ${data.lc_no_and_date || ''}
        </div>
        <div class="bottom-right">
            <div class="bank-row"><span class="label">Account Name :-</span> ${data.account_name || ''}</div>
            <div class="bank-row"><span class="label">Bank Name :-</span> ${data.bank_name || data.ba_bank_name || ''}</div>
            <div class="bank-row"><span class="label">A/c No. :-</span> ${data.account_no || data.ba_account_no || ''}</div>
            <div class="bank-row"><span class="label">Branch :-</span> ${data.branch || data.ba_branch_address || ''}</div>
            <div class="bank-row"><span class="label">Swift Code :-</span> ${data.swift_code || data.ba_swift_code || ''}</div>
            <br/>
            <div style="text-align:right;">
                <strong>FOR ${data.company_name || ''}</strong>
            </div>
        </div>
    </div>

    <!-- Declaration -->
    <div class="declaration">
        We certify that the goods are as per proforma invoice no. ${piNumber} dated ${formatDate(data.pi_date)}<br/><br/>
        We declare that this invoice shows the actual price described and that all particulars are true and correct
    </div>

    <!-- Signature -->
    <div class="signature">
        ${signatureImg ? `<img src="${signatureImg}" alt="Signature" />` : ''}<br/>
        Authorised Signatory<br/>
        (${data.director_name || ''})
    </div>
</div>
</body>
</html>`;
}

module.exports = { generateCITemplate };
