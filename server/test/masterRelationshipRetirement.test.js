const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const read = relativePath => fs.readFileSync(
    path.resolve(__dirname, '..', relativePath),
    'utf8'
);

test('Master routes do not depend on the retired PI relationship', () => {
    const source = read('src/routes/masters.js');

    assert.doesNotMatch(source, /pi_id/);
    assert.doesNotMatch(source, /proforma_invoices/);
});

test('Master PDF loading does not require a standalone PI row', () => {
    const source = read('src/routes/pdf.js');
    const masterRoute = source.slice(source.indexOf("router.get('/master/"));

    assert.doesNotMatch(masterRoute, /LEFT JOIN proforma_invoices pi/);
    assert.match(masterRoute, /m\.invoice_no AS pi_number/);
    assert.match(masterRoute, /m\.invoice_date AS pi_date/);
    assert.match(masterRoute, /m\.master_financial_year AS financial_year/);
    assert.match(source.slice(0, source.indexOf("router.get('/master/")), /FROM proforma_invoices pi/);
});

test('Migration omits pi_id from new Master tables and retires it idempotently', () => {
    const source = read('src/db/migrate.js');
    const masterDefinition = source.slice(
        source.indexOf('CREATE TABLE IF NOT EXISTS masters'),
        source.indexOf('-- =============================================\n-- CONTAINERS')
    );

    assert.doesNotMatch(masterDefinition, /pi_id/);
    assert.match(source, /retireLegacyMasterPiRelationship/);
});
