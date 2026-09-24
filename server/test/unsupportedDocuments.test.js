const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const {
    UNSUPPORTED_DOCUMENT_TYPES,
    buildUnsupportedDocumentCleanupQueries,
    buildOrderDocumentEnumMigration
} = require('../src/db/documentRetirement');

const read = relativePath => fs.readFileSync(
    path.resolve(__dirname, '..', relativePath),
    'utf8'
);

test('unsupported document contract contains only retired document types', () => {
    assert.deepEqual(UNSUPPORTED_DOCUMENT_TYPES, ['CL_COURIER', 'BANK_STICKER']);
});

test('cleanup queries remove retired document rows without interpolating values', () => {
    const queries = buildUnsupportedDocumentCleanupQueries();
    assert.deepEqual(queries.map(query => query.table), [
        'order_documents',
        'document_overrides'
    ]);
    assert.deepEqual(queries[0].values, UNSUPPORTED_DOCUMENT_TYPES);
    assert.deepEqual(queries[1].values, UNSUPPORTED_DOCUMENT_TYPES);
    assert.match(queries[0].sql, /DELETE FROM order_documents WHERE document_type IN \(\?, \?\)/);
    assert.match(queries[1].sql, /DELETE FROM document_overrides WHERE document_type IN \(\?, \?\)/);
    for (const query of queries) {
        assert.doesNotMatch(query.sql, /CL_COURIER|BANK_STICKER/);
    }
});

test('existing order document enum can be narrowed after retired rows are removed', () => {
    const query = buildOrderDocumentEnumMigration();
    assert.match(query.sql, /^ALTER TABLE `order_documents` MODIFY COLUMN `document_type` ENUM\(/);
    assert.doesNotMatch(query.sql, /CL_COURIER|BANK_STICKER/);
    assert.deepEqual(query.values, []);
});

test('Master hydration filters stale retired document and override rows', () => {
    const source = read('src/routes/masters.js');
    assert.match(source, /ORDER_DOCUMENT_TYPES\.has\(document\.document_type\)/);
    assert.match(source, /DOCUMENT_TYPES\.has\(row\.document_type\)/);
});

test('server document contracts no longer advertise retired values', () => {
    const source = read('src/routes/masters.js');
    assert.doesNotMatch(source, /CL_COURIER/);
    assert.doesNotMatch(source, /BANK_STICKER/);
});

test('fresh order document schema excludes retired values', () => {
    const source = read('src/db/migrate.js');
    const orderDocumentDefinition = source.slice(
        source.indexOf('CREATE TABLE IF NOT EXISTS order_documents'),
        source.indexOf('-- =============================================\n-- PI NUMBER SEQUENCE')
    );
    assert.doesNotMatch(orderDocumentDefinition, /CL_COURIER|BANK_STICKER/);
});

test('migration invokes retired-row cleanup before completing', () => {
    const source = read('src/db/migrate.js');
    assert.match(source, /retireUnsupportedDocuments\(connection\)/);
});

test('Master PDF route rejects retired document types explicitly', () => {
    const source = read('src/routes/pdf.js');
    assert.match(source, /CL_COURIER|BANK_STICKER/);
    assert.match(source, /Unsupported document type/);
});

test('Master page filters retired document selections and guards direct URLs', () => {
    const source = fs.readFileSync(
        path.resolve(__dirname, '..', '..', 'client/src/pages/MasterFormPage.js'),
        'utf8'
    );
    assert.match(source, /SUPPORTED_DOCUMENT_TYPES/);
    assert.match(source, /currentDoc.*SUPPORTED_DOCUMENT_TYPES/);
    assert.match(source, /SUPPORTED_DOCUMENT_TYPES\.has\(document\.document_type\)/);
});
