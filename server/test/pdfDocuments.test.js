const assert = require('node:assert/strict');
const test = require('node:test');
const express = require('express');
const request = require('supertest');
const pool = require('../src/db/connection');
const pdfService = require('../src/services/pdfService');

const pdfBytes = Buffer.from('%PDF-1.4\nfixture PDF bytes');
const master = {
    id: 42,
    company_id: 7,
    client_id: 11,
    master_folder_path: null,
    invoice_no: 'PI-001',
    ci_invoice_no: 'CI-123',
    master_financial_year: '2026-27',
    vessel_no: 'SAVED-VESSEL-42',
    product_name: 'Test Product',
    company_name: 'Test Company',
    currency: 'USD'
};
const container = { id: 9, container_no: 'CONT-009', sequence_no: 1 };
const coaTest = { test_name: 'Purity', specification: '99% min', result: '99.8%', method: 'Lab' };

test('all supported Master document routes render HTML and return PDF bytes', async t => {
    const rendered = [];
    let ciVesselOverride;
    t.mock.method(pool, 'query', async (sql, values) => {
        if (sql.includes('FROM masters m')) return [[{ ...master }]];
        if (sql.includes('FROM containers WHERE master_id')) return [[{ ...container }]];
        if (sql.includes('FROM container_products WHERE container_id')) return [[]];
        if (sql.includes('FROM coa_tests WHERE master_id')) return [[{ ...coaTest }]];
        if (sql.includes('FROM document_overrides WHERE master_id')) {
            return [values?.[1] === 'CI' && ciVesselOverride !== undefined
                ? [{ field_key: 'vessel_no', field_value: ciVesselOverride }]
                : []];
        }
        throw new Error(`Unexpected PDF query: ${sql}`);
    });
    t.mock.method(pdfService, 'generatePDF', async (html, options) => {
        rendered.push({ html, options });
        return pdfBytes;
    });

    const routePath = require.resolve('../src/routes/pdf');
    delete require.cache[routePath];
    t.after(() => { delete require.cache[routePath]; });
    const app = express().use('/api/pdf', require('../src/routes/pdf'));

    const documentTypes = [
        'PI', 'MASTER_FORM', 'CI', 'PL', 'COA', 'CCVO', 'BC', 'MFG_CERTI',
        'SCOMET', 'FORM_SDF', 'EUC', 'ANNEXURE_A', 'ANNEXURE_C', 'DGD',
        'BL_DRAFT', 'VGM'
    ];
    for (const docType of documentTypes) {
        const path = `/api/pdf/master/42/${docType}${docType === 'VGM' ? '?container_id=9' : ''}`;
        const response = await request(app).get(path);
        assert.equal(response.status, 200, `${docType}: ${JSON.stringify(response.body)}`);
        assert.match(response.headers['content-type'], /application\/pdf/);
        assert.match(response.headers['content-disposition'], /^inline; filename=/);
        assert.deepEqual(response.body, pdfBytes);
        assert.match(rendered.at(-1).html, /<!DOCTYPE html>/i, docType);
    }

    const ci = rendered[documentTypes.indexOf('CI')].html;
    const pl = rendered[documentTypes.indexOf('PL')].html;
    const coa = rendered[documentTypes.indexOf('COA')].html;
    assert.match(ci, /COMMERCIAL INVOICE/);
    assert.match(ci, /VESSEL No.<\/span> :- SAVED-VESSEL-42/);
    assert.match(pl, /PACKING LIST/);
    assert.match(pl, /VESSEL No.<\/span> :- SAVED-VESSEL-42/);
    assert.match(coa, /CERTIFICATE OF ANALYSIS AND SPECIFICATION/);
    assert.match(coa, /Purity/);
    assert.match(coa, /99.8%/);

    ciVesselOverride = 'CI-ONLY-VESSEL';
    const ciOverrideResponse = await request(app).get('/api/pdf/master/42/CI');
    assert.equal(ciOverrideResponse.status, 200);
    assert.match(rendered.at(-1).html, /VESSEL No.<\/span> :- CI-ONLY-VESSEL/);
    const plResponse = await request(app).get('/api/pdf/master/42/PL');
    assert.equal(plResponse.status, 200);
    assert.match(rendered.at(-1).html, /VESSEL No.<\/span> :- SAVED-VESSEL-42/);

    ciVesselOverride = '';
    const blankResponse = await request(app).get('/api/pdf/master/42/CI');
    assert.equal(blankResponse.status, 200);
    assert.match(rendered.at(-1).html, /VESSEL No.<\/span> :- <\/div>/);
    assert.doesNotMatch(rendered.at(-1).html, /SAVED-VESSEL-42/);
    assert.equal(rendered.length, documentTypes.length + 3);
});
