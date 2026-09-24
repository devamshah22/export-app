/**
 * Number to Words converter - Multi-currency support
 * Supports: USD, AED, EUR
 */

const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
    'Seventeen', 'Eighteen', 'Nineteen'];

const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

const scales = ['', 'Thousand', 'Million', 'Billion'];

const currencyConfig = {
    USD: { major: 'US Dollars', minor: 'Cents', symbol: 'USD' },
    AED: { major: 'Dirhams', minor: 'Fils', symbol: 'AED' },
    EUR: { major: 'Euros', minor: 'Cents', symbol: 'EUR' }
};

function convertHundreds(num) {
    let result = '';
    if (num >= 100) {
        result += ones[Math.floor(num / 100)] + ' Hundred';
        num %= 100;
        if (num > 0) result += ' and ';
    }
    if (num >= 20) {
        result += tens[Math.floor(num / 10)];
        if (num % 10 > 0) result += ' ' + ones[num % 10];
    } else if (num > 0) {
        result += ones[num];
    }
    return result;
}

function numberToWords(num) {
    if (num === 0) return 'Zero';

    let result = '';
    let scaleIndex = 0;

    while (num > 0) {
        const chunk = num % 1000;
        if (chunk > 0) {
            const chunkWords = convertHundreds(chunk);
            if (scaleIndex > 0) {
                result = chunkWords + ' ' + scales[scaleIndex] + (result ? ' ' + result : '');
            } else {
                result = chunkWords;
            }
        }
        num = Math.floor(num / 1000);
        scaleIndex++;
    }

    return result.trim();
}

/**
 * Convert amount to words with currency
 * @param {number} amount - The numeric amount
 * @param {string} currency - Currency code (USD, AED, EUR)
 * @returns {string} Amount in words with currency
 */
function amountToWords(amount, currency = 'USD') {
    const config = currencyConfig[currency] || currencyConfig.USD;

    const intPart = Math.floor(Math.abs(amount));
    const decPart = Math.round((Math.abs(amount) - intPart) * 100);

    let words = config.symbol + ' ' + numberToWords(intPart);

    if (decPart > 0) {
        words += ' and ' + numberToWords(decPart) + ' ' + config.minor;
    }

    words += ' Only';

    return words;
}

/**
 * Simple version without currency prefix (for documents that show currency separately)
 */
function amountToWordsSimple(amount, currency = 'USD') {
    const config = currencyConfig[currency] || currencyConfig.USD;

    const intPart = Math.floor(Math.abs(amount));
    const decPart = Math.round((Math.abs(amount) - intPart) * 100);

    let words = numberToWords(intPart);

    if (decPart > 0) {
        words += ' and ' + numberToWords(decPart) + ' ' + config.minor;
    }

    words += ' Only';

    return words;
}

module.exports = {
    amountToWords,
    amountToWordsSimple,
    numberToWords
};
