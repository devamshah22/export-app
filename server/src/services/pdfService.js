const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

let browserInstance = null;

/**
 * Get or create a shared browser instance
 * If the browser has crashed/disconnected, create a new one
 */
async function getBrowser() {
    try {
        if (browserInstance && browserInstance.isConnected()) {
            return browserInstance;
        }
    } catch (e) {
        // Browser reference is stale
        browserInstance = null;
    }

    // Close old instance if it exists but is disconnected
    if (browserInstance) {
        try { await browserInstance.close(); } catch (e) {}
        browserInstance = null;
    }

    browserInstance = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    });

    return browserInstance;
}

/**
 * Generate PDF from HTML template
 * @param {string} html - Full HTML content
 * @param {object} options - PDF options
 * @returns {Buffer} PDF buffer
 */
async function generatePDF(html, options = {}) {
    let page = null;
    try {
        const browser = await getBrowser();
        page = await browser.newPage();

        await page.setContent(html, { waitUntil: 'networkidle0', timeout: 30000 });

        const pdfBuffer = await page.pdf({
            format: 'A4',
            printBackground: true,
            margin: {
                top: options.marginTop || '10mm',
                bottom: options.marginBottom || '10mm',
                left: options.marginLeft || '10mm',
                right: options.marginRight || '10mm'
            },
            ...options
        });

        return pdfBuffer;
    } catch (error) {
        // If PDF generation fails, try closing and recreating browser
        console.error('PDF generation error:', error.message);
        if (browserInstance) {
            try { await browserInstance.close(); } catch (e) {}
            browserInstance = null;
        }
        throw error;
    } finally {
        if (page) {
            try { await page.close(); } catch (e) {}
        }
    }
}

/**
 * Get base64 encoded image for embedding in HTML
 */
function getImageBase64(imageName) {
    const imagePath = path.join(__dirname, '..', 'templates', 'images', imageName);
    if (fs.existsSync(imagePath)) {
        const imageBuffer = fs.readFileSync(imagePath);
        const ext = path.extname(imageName).slice(1);
        return `data:image/${ext};base64,${imageBuffer.toString('base64')}`;
    }
    return '';
}

/**
 * Format date as DD/MM/YYYY
 */
function formatDate(date) {
    if (!date) return '';
    const d = new Date(date);
    if (isNaN(d.getTime())) return date; // Return as-is if not a valid date
    const day = d.getDate().toString().padStart(2, '0');
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
}

/**
 * Format number with commas (removes trailing zeros)
 */
function formatNumber(num) {
    if (!num && num !== 0) return '';
    const parsed = parseFloat(num);
    const clean = parseFloat(parsed.toFixed(4));
    return clean.toLocaleString('en-IN');
}

/**
 * Format number - clean decimals (no trailing zeros)
 */
function cleanNum(num) {
    if (!num && num !== 0) return '';
    const parsed = parseFloat(num);
    if (Number.isInteger(parsed)) return parsed.toString();
    return parseFloat(parsed.toFixed(3)).toString();
}

module.exports = {
    generatePDF,
    getImageBase64,
    formatDate,
    formatNumber,
    cleanNum,
    getBrowser
};
