const assert = require('node:assert/strict');
const test = require('node:test');
const express = require('express');
const request = require('supertest');
const pool = require('../src/db/connection');

test('CI saves vessel only in its override while other fields and PL retain Master behavior', async t => {
    const state = { id: 42, version: 1, vessel_no: 'MASTER-VESSEL', other_ref: 'ORIGINAL' };
    const overrides = {};
    const queries = [];
    const connection = {
        beginTransaction: async () => {},
        commit: async () => {},
        rollback: async () => {},
        release: () => {},
        query: async (sql, params) => {
            queries.push({ sql, params });
            if (sql.startsWith('UPDATE masters SET version = version + 1')) {
                if (state.version !== Number(params[1])) return [{ affectedRows: 0 }];
                state.version++;
                return [{ affectedRows: 1 }];
            }
            if (sql.startsWith('UPDATE masters SET other_ref = ?')) {
                state.other_ref = params[0];
                return [{ affectedRows: 1 }];
            }
            if (sql.startsWith('UPDATE masters SET vessel_no = ?')) {
                state.vessel_no = params[0];
                return [{ affectedRows: 1 }];
            }
            if (sql.includes('INSERT INTO document_overrides')) {
                overrides[params[2]] = params[3];
                return [{ affectedRows: 1 }];
            }
            if (sql.startsWith('DELETE FROM document_overrides')) {
                delete overrides[params[2]];
                return [{ affectedRows: 1 }];
            }
            if (sql.includes('FROM masters m')) return [[{ ...state }]];
            if (sql.includes('FROM containers WHERE master_id') ||
                sql.includes('FROM coa_tests WHERE master_id') ||
                sql.includes('FROM order_documents WHERE master_id')) return [[]];
            if (sql.includes('SELECT document_type, field_key, field_value FROM document_overrides')) {
                return [Object.entries(overrides).map(([field_key, field_value]) => ({
                    document_type: 'CI', field_key, field_value
                }))];
            }
            throw new Error(`Unexpected document save query: ${sql}`);
        }
    };
    t.mock.method(pool, 'getConnection', async () => connection);
    const app = express().use(express.json()).use('/api/masters', require('../src/routes/masters'));

    const ciSave = await request(app).post('/api/masters/42/document-save').send({
        version: 1, document_type: 'CI',
        fields: { other_ref: 'UPDATED-REF' }, overrides: { vessel_no: 'CI-ONLY' }
    });
    assert.equal(ciSave.status, 200, JSON.stringify(ciSave.body));
    assert.equal(ciSave.body.vessel_no, 'MASTER-VESSEL');
    assert.equal(ciSave.body.other_ref, 'UPDATED-REF');
    assert.equal(ciSave.body.overrides.CI.vessel_no, 'CI-ONLY');

    const queryCount = queries.length;
    const invalid = await request(app).post('/api/masters/42/document-save').send({
        version: 2, document_type: 'CI', fields: { vessel_no: 'MUST-NOT-BE-SHARED' }
    });
    assert.equal(invalid.status, 400);
    assert.match(invalid.body.error, /vessel_no.*override/);
    assert.equal(queries.length, queryCount);
    assert.equal(state.version, 2);

    const blank = await request(app).post('/api/masters/42/document-save').send({
        version: 2, document_type: 'CI', overrides: { vessel_no: '' }
    });
    assert.equal(blank.status, 200, JSON.stringify(blank.body));
    assert.equal(blank.body.overrides.CI.vessel_no, '');
    assert.equal(blank.body.vessel_no, 'MASTER-VESSEL');

    const reset = await request(app).post('/api/masters/42/document-save').send({
        version: 3, document_type: 'CI', overrides: { vessel_no: null }
    });
    assert.equal(reset.status, 200, JSON.stringify(reset.body));
    assert.equal(reset.body.overrides.CI, undefined);

    const plSave = await request(app).post('/api/masters/42/document-save').send({
        version: 4, document_type: 'PL', fields: { vessel_no: 'NEW-MASTER-VESSEL' }
    });
    assert.equal(plSave.status, 200, JSON.stringify(plSave.body));
    assert.equal(plSave.body.vessel_no, 'NEW-MASTER-VESSEL');
    assert.equal(plSave.body.overrides.CI, undefined);
});
