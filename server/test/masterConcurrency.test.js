const test = require('node:test');
const assert = require('node:assert/strict');
const {
    parseExpectedVersion,
    buildMasterVersionClaim,
    buildOptimisticMasterUpdate,
    withTransaction,
    claimMasterVersion
} = require('../src/utils/masterConcurrency');

test('parseExpectedVersion accepts positive integer versions only', () => {
    assert.equal(parseExpectedVersion(1), 1);
    assert.equal(parseExpectedVersion('3'), 3);
    assert.equal(parseExpectedVersion(0), null);
    assert.equal(parseExpectedVersion('1.5'), null);
    assert.equal(parseExpectedVersion(undefined), null);
});

test('parseExpectedVersion rejects coercible non-canonical wire values', () => {
    for (const value of [true, false, [], [1], ' 1', '01', '1e0', '0x1', {}, null]) {
        assert.equal(parseExpectedVersion(value), null, `expected ${JSON.stringify(value)} to be rejected`);
    }
});

test('buildOptimisticMasterUpdate increments version and matches expected version', () => {
    const update = buildOptimisticMasterUpdate({
        updates: ['description = ?', 'status = ?'],
        values: ['Updated product', 'in_progress'],
        masterId: 42,
        expectedVersion: 7
    });

    assert.equal(
        update.sql,
        'UPDATE masters SET description = ?, status = ?, version = version + 1 WHERE id = ? AND version = ?'
    );
    assert.deepEqual(update.values, ['Updated product', 'in_progress', 42, 7]);
});

test('buildMasterVersionClaim atomically advances a Master version', () => {
    const claim = buildMasterVersionClaim(42, 7);

    assert.deepEqual(claim, {
        sql: 'UPDATE masters SET version = version + 1 WHERE id = ? AND version = ?',
        values: [42, 7]
    });
});

test('buildOptimisticMasterUpdate rejects invalid expected versions', () => {
    assert.throws(
        () => buildOptimisticMasterUpdate({
            updates: ['description = ?'],
            values: ['Updated product'],
            masterId: 42,
            expectedVersion: 0
        }),
        /positive integer version is required/
    );
});

test('buildOptimisticMasterUpdate rejects unsafe SQL fragments and mismatched values', () => {
    assert.throws(
        () => buildOptimisticMasterUpdate({
            updates: ['description = ? OR 1 = 1'],
            values: ['Updated product'],
            masterId: 42,
            expectedVersion: 1
        }),
        /allowlisted SQL field assignments/
    );
    assert.throws(
        () => buildOptimisticMasterUpdate({
            updates: ['description = ?', 'status = ?'],
            values: ['Updated product'],
            masterId: 42,
            expectedVersion: 1
        }),
        /match field assignments/
    );
});

test('buildOptimisticMasterUpdate never treats version as a normal field update', () => {
    assert.throws(
        () => buildOptimisticMasterUpdate({
            updates: ['version = ?'],
            values: [99],
            masterId: 42,
            expectedVersion: 1
        }),
        /version is managed exclusively by the concurrency claim/
    );
});

test('withTransaction commits successful work and releases connection', async () => {
    const calls = [];
    const connection = {
        beginTransaction: async () => calls.push('begin'),
        commit: async () => calls.push('commit'),
        rollback: async () => calls.push('rollback'),
        release: () => calls.push('release')
    };
    const pool = { getConnection: async () => connection };

    const result = await withTransaction(pool, async () => {
        calls.push('work');
        return 'canonical';
    });

    assert.equal(result, 'canonical');
    assert.deepEqual(calls, ['begin', 'work', 'commit', 'release']);
});

test('withTransaction rolls back failed work and releases connection', async () => {
    const calls = [];
    const connection = {
        beginTransaction: async () => calls.push('begin'),
        commit: async () => calls.push('commit'),
        rollback: async () => calls.push('rollback'),
        release: () => calls.push('release')
    };
    const pool = { getConnection: async () => connection };

    await assert.rejects(
        () => withTransaction(pool, async () => {
            calls.push('work');
            throw new Error('child write failed');
        }),
        /child write failed/
    );

    assert.deepEqual(calls, ['begin', 'work', 'rollback', 'release']);
});

test('claimMasterVersion uses supplied transaction connection and distinguishes missing Master', async () => {
    const queries = [];
    const connection = {
        query: async (sql, values) => {
            queries.push({ sql, values });
            if (sql.startsWith('UPDATE')) return [{ affectedRows: 0 }];
            return [[]];
        }
    };

    const result = await claimMasterVersion(connection, 42, 7);

    assert.deepEqual(result, { status: 404, error: 'Master not found.' });
    assert.equal(queries.length, 2);
    assert.match(queries[0].sql, /WHERE id = \? AND version = \?/);
});

test('claimMasterVersion returns conflict when Master exists at another version', async () => {
    const connection = {
        query: async (sql) => {
            if (sql.startsWith('UPDATE')) return [{ affectedRows: 0 }];
            return [[{ id: 42, version: 8 }]];
        }
    };

    assert.deepEqual(await claimMasterVersion(connection, 42, 7), {
        status: 409,
        error: 'This Master was changed by another user. Reload latest data before saving.',
        currentVersion: 8
    });
});
