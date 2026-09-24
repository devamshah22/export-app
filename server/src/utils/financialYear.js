/**
 * Financial Year utility
 * Indian FY: April 1 to March 31
 * Format: "2026-27"
 */

/**
 * Get current financial year string
 * @param {Date} date - Optional date, defaults to now
 * @returns {string} e.g., "2026-27"
 */
function getCurrentFinancialYear(date = new Date()) {
    const month = date.getMonth(); // 0-indexed (0=Jan, 3=Apr)
    const year = date.getFullYear();

    if (month >= 3) {
        // April onwards = current year is start
        return `${year}-${(year + 1).toString().slice(-2)}`;
    } else {
        // Jan-March = previous year is start
        return `${year - 1}-${year.toString().slice(-2)}`;
    }
}

/**
 * Get financial year start date
 * @param {string} fy - Financial year string e.g., "2026-27"
 * @returns {Date}
 */
function getFYStartDate(fy) {
    const startYear = parseInt(fy.split('-')[0]);
    return new Date(startYear, 3, 1); // April 1
}

/**
 * Get financial year end date
 * @param {string} fy - Financial year string e.g., "2026-27"
 * @returns {Date}
 */
function getFYEndDate(fy) {
    const startYear = parseInt(fy.split('-')[0]);
    return new Date(startYear + 1, 2, 31); // March 31 next year
}

/**
 * Format date as DD/MM/YYYY
 * @param {Date|string} date
 * @returns {string}
 */
function formatDate(date) {
    if (!date) return '';
    const d = new Date(date);
    const day = d.getDate().toString().padStart(2, '0');
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
}

/**
 * Parse DD/MM/YYYY to Date
 * @param {string} dateStr
 * @returns {Date|null}
 */
function parseDate(dateStr) {
    if (!dateStr) return null;
    const parts = dateStr.split('/');
    if (parts.length !== 3) return null;
    return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
}

module.exports = {
    getCurrentFinancialYear,
    getFYStartDate,
    getFYEndDate,
    formatDate,
    parseDate
};
