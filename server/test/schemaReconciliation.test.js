const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const source = fs.readFileSync(
    path.resolve(__dirname, '..', 'src/db/migrate.js'),
    'utf8'
);
const readSchemaHelper = () => fs.readFileSync(
    path.resolve(__dirname, '..', 'src/db/schemaReconciliation.js'),
    'utf8'
);

const masterDefinition = source.slice(
    source.indexOf('CREATE TABLE IF NOT EXISTS masters'),
    source.indexOf('-- =============================================\n-- CONTAINERS')
);

const piDefinition = source.slice(
    source.indexOf('CREATE TABLE IF NOT EXISTS proforma_invoices'),
    source.indexOf('-- =============================================\n-- MASTER (ORDER) TABLE')
);

test('fresh Master schema supports current Master fields and nullable client', () => {
    for (const column of [
        'master_number', 'master_financial_year', 'master_folder_path',
        'consignor_name', 'consignor_address', 'buyer_name', 'buyer_address',
        'ci_invoice_no', 'ci_invoice_date', 'terms_conditions',
        'container_goods_description', 'account_name', 'bank_name', 'account_no',
        'swift_code', 'branch', 'bc_declaration_1', 'bc_declaration_2',
        'bc_declaration_3', 'bc_issued_by'
    ]) {
        assert.match(masterDefinition, new RegExp(`\\b${column}\\b`));
    }
    assert.match(masterDefinition, /client_id INT(?: NULL)?\s*,/);
    assert.doesNotMatch(masterDefinition, /client_id INT NOT NULL/);
});

test('fresh PI schema includes preserved PI compatibility fields', () => {
    for (const column of [
        'country_of_origin', 'country_of_discharge', 'port_of_loading',
        'port_of_discharge', 'gross_weight', 'tare_weight', 'net_weight',
        'lot_no', 'bag_no', 'no_kind_of_packages'
    ]) {
        assert.match(piDefinition, new RegExp(`\\b${column}\\b`));
    }
});

test('fresh schema defines sequence and weighbridge tables', () => {
    assert.match(source, /CREATE TABLE IF NOT EXISTS master_sequences/);
    assert.match(source, /UNIQUE KEY[^\n]*company_id[^\n]*financial_year/);
    assert.match(source, /CREATE TABLE IF NOT EXISTS weighbridges/);
});

test('migration contains additive reconciliation for current schema', () => {
    assert.match(source, /reconcileCurrentSchema\(connection\)/);
    assert.match(readSchemaHelper(), /information_schema\.columns/);
    assert.match(readSchemaHelper(), /information_schema\.tables/);
});
