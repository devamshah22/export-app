const { getImageBase64, formatDate, formatNumber, cleanNum } = require('../services/pdfService');
const { amountToWordsSimple } = require('../utils/numberToWords');

/**
 * Generate PI HTML template
 * All values come from data parameter - NO hardcoded values
 * @param {object} data - PI data with all related fields
 * @returns {string} HTML string
 */
function generatePITemplate(data) {
    const piNetWeight = data.net_weight;
    const piTareWeight = data.tare_weight;
    const netWeight = Number(piNetWeight);
    const tareWeight = Number(piTareWeight);
    const calculatedGrossWeight = Number.isFinite(netWeight) && Number.isFinite(tareWeight)
        ? (netWeight + tareWeight).toFixed(3)
        : (data.gross_weight || data.total_gross_weight || '');
    const headerImg = getImageBase64('chirag_organics_header.png');
    const signatureImg = getImageBase64('signature_stamp.png');

    const piNumber = data.invoice_no || String(data.pi_number || '').padStart(3, '0') || '';
    const piDate = formatDate(data.invoice_date || data.pi_date);
    const deliveryDate = formatDate(data.pi_delivery_date || data.delivery_date);
    const bagNo = data.pi_bag_no || data.bag_no || '';
    const packageWeight = piNetWeight || '';
    const packageCount = data.total_packages || '';
    const packageText = packageWeight && packageCount
        ? `${packageWeight}Kgs X ${packageCount}nos`
        : packageCount ? `${packageCount}nos` : (data.no_kind_of_packages || '');
    const ref = data.pi_ref || data.ref || '';

    // Amount in words
    const totalAmount = parseFloat(data.total_amount) || 0;
    const amountWords = totalAmount ? amountToWordsSimple(totalAmount, data.currency || 'USD') : '';

    // Determine CFR/CIF label from incoterms
    const incoLabel = data.incoterms ? data.incoterms.split(',')[0].trim() : '';

    return `<!DOCTYPE html>
<html>
<head>
<style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Times New Roman', Times, serif; font-size: 11px; color: #000; }
    .page { width: 100%; padding: 5mm; }
    .header { text-align: center; margin-bottom: 5px; }
    .header img { width: 100%; max-height: 80px; }
    .title { text-align: center; font-size: 14px; font-weight: bold; margin: 8px 0; text-decoration: underline; }
    .main-table { width: 100%; border-collapse: collapse; border: 1px solid #000; }
    .main-table td { border: 1px solid #000; padding: 4px 6px; vertical-align: top; font-size: 11px; }
    .no-border td { border: none; }
    .label { font-weight: bold; }
    .right { text-align: right; }
    .center { text-align: center; }
    .product-table { width: 100%; border-collapse: collapse; }
    .product-table th, .product-table td { border: 1px solid #000; padding: 3px 5px; font-size: 10px; }
    .product-table th { background: #f0f0f0; font-weight: bold; }
    .terms { font-size: 9px; margin-top: 8px; }
    .terms li { margin-bottom: 3px; }
    .signature { text-align: right; margin-top: 15px; }
    .signature img { height: 70px; }
    .bank-section { margin-top: 8px; font-size: 10px; }
    .amount-words { font-weight: bold; font-size: 10px; margin-top: 5px; }
</style>
</head>
<body>
<div class="page">
    <!-- Header -->
    <div class="header">
        ${headerImg ? `<img src="${headerImg}" alt="Company Header" />` : `<h2>${data.company_name || ''}</h2>`}
    </div>

    <div class="title">PROFORMA INVOICE</div>

    <!-- Main Info Table -->
    <table class="main-table">
        <tr>
            <td width="60%" rowspan="5">
                <strong>EXPORTER</strong><br/>
                ${data.consignor_name || data.company_name || ''}<br/>
                ${data.consignor_address || data.company_address || ''}
            </td>
            <td width="20%"><strong>INVOICE NO.</strong></td>
            <td width="20%">${piNumber}</td>
        </tr>
        <tr>
            <td><strong>DATE</strong></td>
            <td>${piDate}</td>
        </tr>
        <tr>
            <td><strong>ORDER NO.</strong></td>
            <td></td>
        </tr>
        <tr>
            <td><strong>DATE</strong></td>
            <td></td>
        </tr>
        <tr>
            <td><strong>OTHER REF</strong></td>
            <td></td>
        </tr>
        <tr>
            <td>
                <strong>CONSIGNEE</strong><br/>
                ${data.consignee_name || ''}<br/>
                ${data.consignee_address || ''}
            </td>
            <td colspan="2">
                <strong>BUYER (IF OTHER THAN CONSIGNEE)</strong><br/>
                ${data.buyer_name || ''}${data.buyer_address ? '<br/>' + data.buyer_address : ''}
            </td>
        </tr>
        <tr>
            <td colspan="3" style="padding: 2px 6px;">
                <table style="width:auto; border:none;" class="no-border">
                    <tr>
                        <td style="padding-right:5px;"><strong>COUNTRY OF ORIGIN :</strong></td>
                        <td style="padding-right:20px;">${data.country_of_origin || ''}</td>
                        <td style="padding-right:5px;"><strong>PORT OF LOADING :</strong></td>
                        <td>${data.port_of_loading || ''}</td>
                    </tr>
                    <tr>
                        <td style="padding-right:5px;"><strong>COUNTRY OF DISCHARGE :</strong></td>
                        <td style="padding-right:20px;">${data.country_of_discharge || ''}</td>
                        <td style="padding-right:5px;"><strong>PORT OF DISCHARGE :</strong></td>
                        <td>${data.port_of_discharge || ''}</td>
                    </tr>
                </table>
            </td>
        </tr>
        <tr>
            <td colspan="3" style="padding: 4px 6px;">
                <strong>TERMS OF DELIVERY AND PAYMENT</strong><br/>
                <table style="width:auto; border:none; margin-top:3px;" class="no-border">
                    <tr>
                        <td style="padding-right:10px;">Delivery :-</td>
                        <td>${deliveryDate ? 'LATEST BY ' + deliveryDate : ''}</td>
                    </tr>
                    <tr>
                        <td style="padding-right:10px;">Incoterms :-</td>
                        <td>${data.incoterms || ''}</td>
                    </tr>
                    <tr>
                        <td style="padding-right:10px;">PAYMENT :-</td>
                        <td>${data.payment_terms || ''}</td>
                    </tr>
                    <tr>
                        <td style="padding-right:10px;">FREIGHT :-</td>
                        <td>${data.freight_terms || ''}</td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>

    <!-- Product Table -->
    <table class="product-table" style="margin-top: -1px;">
        <tr>
            <th>MARKS & NUMBERS<br/>CONTAINERS No.</th>
            <th>NO. & KIND<br/>OF PACKAGES</th>
            <th>DESCRIPTION OF GOODS</th>
            <th>QUANTITY</th>
            <th>RATE</th>
            <th>AMOUNT</th>
        </tr>
        <tr>
            <td>
                ${data.product_name || ''}<br/>
                ${calculatedGrossWeight ? 'GROSS WT: ' + calculatedGrossWeight + ' kgs<br/>' : ''}
                ${piTareWeight ? 'TARE WT: ' + piTareWeight + ' kgs<br/>' : ''}
                ${piNetWeight ? 'NET WT: ' + piNetWeight + ' kgs<br/>' : ''}
                ${data.lot_no ? 'LOT NO.: ' + data.lot_no + '<br/>' : ''}
                ${bagNo ? 'BAG NO.: ' + bagNo + '<br/>' : ''}
                "MADE IN INDIA"<br/>
                ${data.un_number ? 'UN No.: ' + data.un_number : ''}
            </td>
            <td>
                ${ref ? ref + '<br/>' : ''}
                ${packageText}<br/>
                ${data.packing_type || ''}<br/>
                ${data.description || ''}
            </td>
            <td>
                ${data.product_name || ''}<br/>
                ${data.hs_code ? 'HS CODE :- ' + data.hs_code : ''}
            </td>
            <td class="right">
                ${data.total_quantity || ''}<br/>
                ${data.uom || ''}
            </td>
            <td class="right">
                ${data.currency || ''}<br/>
                ${data.unit_rate || ''}<br/>
                PER<br/>
                ${data.uom || ''}
            </td>
            <td class="right">
                ${data.currency || ''}<br/>
                ${formatNumber(data.total_amount)}
            </td>
        </tr>
        <tr>
            <td colspan="3"></td>
            <td colspan="2" style="font-size:9px;">
                ${data.fob_amount ? 'FOB (' + (data.currency || '') + ')<br/>' : ''}
                ${data.freight_amount ? 'Freight (' + (data.currency || '') + ')<br/>' : ''}
                ${incoLabel && data.total_amount ? incoLabel + ' (' + (data.currency || '') + ')' : ''}
            </td>
            <td class="right" style="font-size:9px;">
                ${data.fob_amount ? formatNumber(data.fob_amount) + '<br/>' : ''}
                ${data.freight_amount ? formatNumber(data.freight_amount) + '<br/>' : ''}
                ${data.total_amount ? formatNumber(data.total_amount) : ''}
            </td>
        </tr>
        <tr>
            <td colspan="3"><strong>TOTAL</strong></td>
            <td colspan="2" class="right"><strong>${data.currency || ''}</strong></td>
            <td class="right"><strong>${formatNumber(data.total_amount)}</strong></td>
        </tr>
    </table>

    <!-- Amount in Words -->
    <div class="amount-words">
        AMOUNT (IN WORDS): ${data.currency || ''} ${amountWords}<br/>
        ${data.incoterms ? '<span style="font-size:9px;">(' + data.incoterms + ')</span>' : ''}
    </div>

    <!-- Bank Details -->
    <div class="bank-section">
        <strong>BANK DETAILS</strong><br/>
        <table style="border:none; font-size:10px;" class="no-border">
            <tr><td width="120">NAME :-</td><td>${data.bank_name || ''}</td></tr>
            <tr><td>ACCOUNT NO :-</td><td>${data.account_no || ''}</td></tr>
            <tr><td>SWIFT CODE :-</td><td>${data.swift_code || ''}</td></tr>
            <tr><td>ADDRESS :-</td><td>${data.branch_address || ''}</td></tr>
        </table>
    </div>

    <!-- Terms & Conditions -->
    ${data.terms_conditions ? `
    <div class="terms">
        <strong>Terms and Conditions:-</strong>
        <ol style="padding-left: 15px; margin-top: 3px;">
            ${data.terms_conditions.split('\n').filter(t => t.trim()).map(t => {
                const cleaned = t.replace(/^\d+\)\s*/, '').trim();
                return `<li>${cleaned}</li>`;
            }).join('')}
        </ol>
    </div>` : ''}

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

module.exports = { generatePITemplate };
