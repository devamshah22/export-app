const assert = require('node:assert/strict');
const test = require('node:test');
const {
    setupIntegration,
    login,
    createBlankMaster
} = require('./helpers');

let context;
let token;

const integrationEnabled = process.env.RUN_INTEGRATION_TESTS === '1';

if (!integrationEnabled) {
    test('backend route integration tests require an isolated test database', t => {
        t.skip('Set RUN_INTEGRATION_TESTS=1 to run against generated or pre-created export_app_test_* database.');
    });
} else {
    test.before(async () => {
        context = await setupIntegration();
        token = await login(context);
    });

    test.after(async () => {
        if (context) await context.close();
    });

test('rejects unauthenticated access and accepts real login token', async () => {
    const denied = await context.request('GET', '/api/masters/1');
    assert.equal(denied.status, 401);
    assert.equal(denied.body.error, 'Access denied. No token provided.');

    const invalid = await context.request('GET', '/api/auth/me', undefined, 'not-a-jwt');
    assert.equal(invalid.status, 401);
    assert.equal(invalid.body.error, 'Invalid or expired token.');

    const badLogin = await context.request('POST', '/api/auth/login', {
        username: context.fixtures.username,
        password: 'wrong-password'
    });
    assert.equal(badLogin.status, 401);
    assert.equal(badLogin.body.error, 'Invalid credentials.');

    const me = await context.request('GET', '/api/auth/me', undefined, token);
    assert.equal(me.status, 200);
    assert.equal(me.body.user.username, context.fixtures.username);

    await context.pool.query(
        'UPDATE users SET password_reset_version = 1 WHERE id = ?',
        [context.fixtures.userId]
    );
    const expiredByReset = await context.request('GET', '/api/auth/me', undefined, token);
    assert.equal(expiredByReset.status, 401);
    assert.equal(expiredByReset.body.error, 'Session expired. Please sign in again.');
    await context.pool.query(
        'UPDATE users SET password_reset_version = 0 WHERE id = ?',
        [context.fixtures.userId]
    );
});

test('creates, lists, reads, updates, and imports Master through HTTP', async () => {
    const created = await createBlankMaster(context, token, {
        invoice_no: 'INT-001',
        product_name: 'Integration Product',
        currency: 'USD',
        total_amount: 123.45
    });
    assert.equal(created.version, 1);
    assert.equal(created.invoice_no, 'INT-001');
    assert.equal(created.product_name, 'Integration Product');
    assert.ok(created.master_number);

    const persisted = await context.query(
        'SELECT invoice_no, product_name, version FROM masters WHERE id = ?',
        [created.id]
    );
    assert.deepEqual(persisted[0], {
        invoice_no: 'INT-001',
        product_name: 'Integration Product',
        version: 1
    });

    const listMissingCompany = await context.request('GET', '/api/masters', undefined, token);
    assert.equal(listMissingCompany.status, 400);
    assert.equal(listMissingCompany.body.error, 'company_id is required.');

    const list = await context.request(
        'GET', `/api/masters?company_id=${context.fixtures.companyOneId}`, undefined, token
    );
    assert.equal(list.status, 200);
    assert.ok(list.body.some(master => master.id === created.id));

    const detail = await context.request('GET', `/api/masters/${created.id}`, undefined, token);
    assert.equal(detail.status, 200);
    assert.equal(detail.body.version, 1);

    const updated = await context.request('PUT', `/api/masters/${created.id}`, {
        version: 1,
        invoice_no: 'INT-002',
        total_amount: 200
    }, token);
    assert.equal(updated.status, 200);
    assert.equal(updated.body.version, 2);
    assert.equal(updated.body.invoice_no, 'INT-002');
    assert.match(updated.body.amount_in_words, /USD/);

    const stale = await context.request('PUT', `/api/masters/${created.id}`, {
        version: 1,
        invoice_no: 'STALE'
    }, token);
    assert.equal(stale.status, 409);
    assert.equal(stale.body.version, 2);
    assert.equal(stale.body.master.invoice_no, 'INT-002');

    const invalidVersion = await context.request('PUT', `/api/masters/${created.id}`, {
        version: ' 2 ',
        invoice_no: 'INVALID'
    }, token);
    assert.equal(invalidVersion.status, 400);

    const missingVersion = await context.request('PUT', `/api/masters/${created.id}`, {
        invoice_no: 'MISSING-VERSION'
    }, token);
    assert.equal(missingVersion.status, 400);
    assert.match(missingVersion.body.error, /valid Master version/i);

    const emptyUpdate = await context.request('PUT', `/api/masters/${created.id}`, {
        version: 2
    }, token);
    assert.equal(emptyUpdate.status, 400);
    assert.equal(emptyUpdate.body.error, 'No valid fields to update.');

    const missing = await context.request('GET', '/api/masters/999999999', undefined, token);
    assert.equal(missing.status, 404);
    assert.equal(missing.body.error, 'Master not found.');

    const missingImport = await context.request('POST', '/api/masters/999999999/import', {}, token);
    assert.equal(missingImport.status, 404);
    assert.equal(missingImport.body.error, 'Source master not found.');

    const imported = await context.request('POST', `/api/masters/${created.id}/import`, {}, token);
    assert.equal(imported.status, 201);
    assert.equal(imported.body.status, 'draft');
    assert.notEqual(imported.body.id, created.id);
    assert.equal(imported.body.invoice_no, 'INT-002');
    assert.equal(imported.body.version, 1);
});

test('persists child workflows and combined document save atomically', async () => {
    const master = await createBlankMaster(context, token, { invoice_no: 'CHILD-001' });

    const invalidProducts = await context.request('POST', `/api/masters/${master.id}/containers`, {
        version: master.version,
        container_no: 'INVALID-CONTAINER',
        products: { not: 'an array' }
    }, token);
    assert.equal(invalidProducts.status, 400);
    assert.match(invalidProducts.body.error, /products must be an array/i);

    const added = await context.request('POST', `/api/masters/${master.id}/containers`, {
        version: master.version,
        container_no: 'CONT-001',
        container_size: '40HC',
        products: [{ product_name: 'Product A', num_packages: 10 }]
    }, token);
    assert.equal(added.status, 201);
    assert.equal(added.body.version, 2);
    assert.equal(added.body.containers.length, 1);
    assert.equal(added.body.containers[0].products.length, 1);
    const container = added.body.containers[0];

    const changedContainer = await context.request(
        'PUT', `/api/masters/${master.id}/containers/${container.id}`, {
            version: 2,
            container_no: 'CONT-002',
            products: [{ product_name: 'Product B', num_packages: 20 }]
        }, token
    );
    assert.equal(changedContainer.status, 200);
    assert.equal(changedContainer.body.version, 3);
    assert.equal(changedContainer.body.containers[0].container_no, 'CONT-002');
    assert.equal(changedContainer.body.containers[0].products[0].product_name, 'Product B');

    const deletedContainer = await context.request(
        'DELETE', `/api/masters/${master.id}/containers/${container.id}`, { version: 3 }, token
    );
    assert.equal(deletedContainer.status, 200);
    assert.equal(deletedContainer.body.version, 4);
    assert.equal(deletedContainer.body.containers.length, 0);

    const recreated = await context.request('POST', `/api/masters/${master.id}/containers`, {
        version: 4,
        container_no: 'CONT-003',
        products: []
    }, token);
    assert.equal(recreated.status, 201);
    assert.equal(recreated.body.version, 5);
    const activeContainer = recreated.body.containers[0];

    const coa = await context.request('POST', `/api/masters/${master.id}/coa-tests`, {
        version: 5,
        tests: [{ test_name: 'Purity', specification: '99%', result: '99.5', method: 'ISO' }]
    }, token);
    assert.equal(coa.status, 200);
    assert.equal(coa.body.version, 6);
    assert.equal(coa.body.coa_tests[0].test_name, 'Purity');

    const documents = await context.request('POST', `/api/masters/${master.id}/documents`, {
        version: 6,
        document_types: ['CI', 'VGM']
    }, token);
    assert.equal(documents.status, 200);
    assert.equal(documents.body.version, 7);
    assert.equal(documents.body.documents.length, 2);
    assert.ok(documents.body.documents.some(row => row.document_type === 'VGM'));

    const overrides = await context.request('POST', `/api/masters/${master.id}/overrides/PI`, {
        version: 7,
        ref: 'PI-REFERENCE'
    }, token);
    assert.equal(overrides.status, 200);
    assert.equal(overrides.body.version, 8);

    const overrideGet = await context.request(
        'GET', `/api/masters/${master.id}/overrides/PI`, undefined, token
    );
    assert.equal(overrideGet.status, 200);
    assert.equal(overrideGet.body.ref, 'PI-REFERENCE');
    assert.equal(overrideGet.headers.get('x-master-version'), '8');

    const saved = await context.request('POST', `/api/masters/${master.id}/document-save`, {
        version: 8,
        document_type: 'PI',
        fields: { invoice_no: 'PI-SAVED' },
        overrides: { ref: 'PI-SAVED-REF' },
        container: { id: activeContainer.id, verified_gross_mass: 'N/A' }
    }, token);
    assert.equal(saved.status, 200);
    assert.equal(saved.body.version, 9);
    assert.equal(saved.body.invoice_no, 'PI-SAVED');
    assert.equal(saved.body.overrides.PI.ref, 'PI-SAVED-REF');
    assert.equal(saved.body.containers[0].verified_gross_mass, 'N/A');

    const childRows = await context.query(
        `SELECT
            (SELECT COUNT(*) FROM containers WHERE master_id = ?) AS containers,
            (SELECT COUNT(*) FROM container_products WHERE master_id = ?) AS products,
            (SELECT COUNT(*) FROM coa_tests WHERE master_id = ?) AS coa_tests,
            (SELECT COUNT(*) FROM order_documents WHERE master_id = ?) AS documents,
            (SELECT COUNT(*) FROM document_overrides WHERE master_id = ?) AS overrides`,
        [master.id, master.id, master.id, master.id, master.id]
    );
    assert.deepEqual(Object.values(childRows[0]).map(Number), [1, 0, 1, 2, 1]);

    const deleted = await context.request('DELETE', `/api/masters/${master.id}`, { version: 9 }, token);
    assert.equal(deleted.status, 200);
    assert.equal(deleted.body.deleted, true);
    const afterDelete = await context.query(
        `SELECT
            (SELECT COUNT(*) FROM masters WHERE id = ?) AS masters,
            (SELECT COUNT(*) FROM containers WHERE master_id = ?) AS containers,
            (SELECT COUNT(*) FROM container_products WHERE master_id = ?) AS products,
            (SELECT COUNT(*) FROM coa_tests WHERE master_id = ?) AS coa_tests,
            (SELECT COUNT(*) FROM order_documents WHERE master_id = ?) AS documents,
            (SELECT COUNT(*) FROM document_overrides WHERE master_id = ?) AS overrides`,
        [master.id, master.id, master.id, master.id, master.id, master.id]
    );
    assert.deepEqual(Object.values(afterDelete[0]).map(Number), [0, 0, 0, 0, 0, 0]);
});

test('allows exactly one winner when two HTTP updates use same version', async () => {
    const master = await createBlankMaster(context, token, { invoice_no: 'RACE-INITIAL' });
    const results = await Promise.all([
        context.request('PUT', `/api/masters/${master.id}`, {
            version: master.version,
            invoice_no: 'RACE-WINNER-A'
        }, token),
        context.request('PUT', `/api/masters/${master.id}`, {
            version: master.version,
            invoice_no: 'RACE-WINNER-B'
        }, token)
    ]);

    assert.equal(results.filter(result => result.status === 200).length, 1);
    assert.equal(results.filter(result => result.status === 409).length, 1);
    const winner = results.find(result => result.status === 200);
    const conflict = results.find(result => result.status === 409);
    assert.equal(winner.body.version, 2);
    assert.equal(conflict.body.version, 2);
    assert.equal(conflict.body.master.invoice_no, winner.body.invoice_no);

    const persisted = await context.query(
        'SELECT invoice_no, version FROM masters WHERE id = ?',
        [master.id]
    );
    assert.equal(persisted[0].invoice_no, winner.body.invoice_no);
    assert.equal(Number(persisted[0].version), 2);
});

test('protects child mutations with the same Master version claim', async () => {
    const master = await createBlankMaster(context, token, { invoice_no: 'CHILD-RACE' });
    const results = await Promise.all([
        context.request('POST', `/api/masters/${master.id}/containers`, {
            version: master.version,
            container_no: 'RACE-CONTAINER-A',
            products: []
        }, token),
        context.request('POST', `/api/masters/${master.id}/containers`, {
            version: master.version,
            container_no: 'RACE-CONTAINER-B',
            products: []
        }, token)
    ]);

    assert.equal(results.filter(result => result.status === 201).length, 1);
    assert.equal(results.filter(result => result.status === 409).length, 1);
    const winner = results.find(result => result.status === 201);
    const conflict = results.find(result => result.status === 409);
    assert.equal(winner.body.version, 2);
    assert.equal(conflict.body.version, 2);
    assert.equal(conflict.body.master.containers.length, 1);

    const persisted = await context.query(
        'SELECT container_no FROM containers WHERE master_id = ?',
        [master.id]
    );
    assert.equal(persisted.length, 1);
    assert.equal(persisted[0].container_no, winner.body.containers[0].container_no);
});

test('rejects unsupported and malformed document requests', async () => {
    const master = await createBlankMaster(context, token);
    const unsupported = await context.request('POST', `/api/masters/${master.id}/documents`, {
        version: 1,
        document_types: ['CL_COURIER']
    }, token);
    assert.equal(unsupported.status, 400);
    assert.match(unsupported.body.error, /unsupported document type/i);

    const duplicate = await context.request('POST', `/api/masters/${master.id}/documents`, {
        version: 1,
        document_types: ['CI', 'CI']
    }, token);
    assert.equal(duplicate.status, 400);
    assert.match(duplicate.body.error, /duplicates/i);

    const override = await context.request('POST', `/api/masters/${master.id}/overrides/PI`, {
        version: 1,
        ref: { nested: true }
    }, token);
    assert.equal(override.status, 400);

    const pdfOne = await context.request(
        'GET', `/api/pdf/master/${master.id}/CL_COURIER`, undefined, token
    );
    const pdfTwo = await context.request(
        'GET', `/api/pdf/master/${master.id}/BANK_STICKER`, undefined, token
    );
    assert.equal(pdfOne.status, 400);
    assert.equal(pdfTwo.status, 400);

    const vgmMissingContainer = await context.request(
        'GET', `/api/pdf/master/${master.id}/VGM`, undefined, token
    );
    assert.equal(vgmMissingContainer.status, 400);
    assert.match(vgmMissingContainer.body.error, /container_id/i);

    const vgmWrongContainer = await context.request(
        'GET', `/api/pdf/master/${master.id}/VGM?container_id=999999999`, undefined, token
    );
    assert.equal(vgmWrongContainer.status, 404);
    assert.match(vgmWrongContainer.body.error, /container/i);
});

test('rolls back combined document-save after child validation failure', async () => {
    const master = await createBlankMaster(context, token, { invoice_no: 'COMBINED-OLD' });
    const added = await context.request('POST', `/api/masters/${master.id}/containers`, {
        version: 1,
        container_no: 'COMBINED-CONTAINER',
        products: []
    }, token);
    assert.equal(added.status, 201);
    const container = added.body.containers[0];

    const failed = await context.request('POST', `/api/masters/${master.id}/document-save`, {
        version: 2,
        document_type: 'PI',
        fields: { invoice_no: 'COMBINED-NEW' },
        overrides: { ref: 'COMBINED-REF' },
        container: { id: container.id, verified_gross_mass: 'SHOULD-ROLLBACK' },
        coa_tests: [{ specification: 'missing required name' }]
    }, token);
    assert.equal(failed.status, 500);

    const persisted = await context.query(
        `SELECT m.invoice_no, m.version, c.verified_gross_mass,
                (SELECT COUNT(*) FROM document_overrides WHERE master_id = ?) AS overrides,
                (SELECT COUNT(*) FROM coa_tests WHERE master_id = ?) AS coa_tests
         FROM masters m
         JOIN containers c ON c.master_id = m.id
         WHERE m.id = ?`,
        [master.id, master.id, master.id]
    );
    assert.equal(persisted[0].invoice_no, 'COMBINED-OLD');
    assert.equal(Number(persisted[0].version), 2);
    assert.equal(persisted[0].verified_gross_mass, null);
    assert.equal(Number(persisted[0].overrides), 0);
    assert.equal(Number(persisted[0].coa_tests), 0);
});

test('rolls back version and child rows when COA write fails', async () => {
    const master = await createBlankMaster(context, token, { invoice_no: 'ROLLBACK-OLD' });
    const initial = await context.request('POST', `/api/masters/${master.id}/coa-tests`, {
        version: 1,
        tests: [{ test_name: 'Existing Test', result: 'pass' }]
    }, token);
    assert.equal(initial.status, 200);

    const failed = await context.request('POST', `/api/masters/${master.id}/coa-tests`, {
        version: 2,
        tests: [{ specification: 'missing required name' }]
    }, token);
    assert.equal(failed.status, 500);

    const rows = await context.query(
        `SELECT m.version, m.invoice_no, c.test_name
         FROM masters m LEFT JOIN coa_tests c ON c.master_id = m.id
         WHERE m.id = ?`,
        [master.id]
    );
    assert.equal(Number(rows[0].version), 2);
    assert.equal(rows[0].invoice_no, 'ROLLBACK-OLD');
    assert.equal(rows[0].test_name, 'Existing Test');
});

test('documents current all-admin cross-company access boundary', async () => {
    const other = await context.request('POST', '/api/masters/blank', {
        company_id: context.fixtures.companyTwoId,
        client_id: context.fixtures.clientTwoId,
        invoice_no: 'OTHER-COMPANY'
    }, token);
    assert.equal(other.status, 201);

    // Current policy has no user/company relation; this records existing behavior.
    const crossCompany = await context.request(
        'GET', `/api/masters/${other.body.id}`, undefined, token
    );
    assert.equal(crossCompany.status, 200);
    assert.equal(crossCompany.body.company_id, context.fixtures.companyTwoId);
});
}
