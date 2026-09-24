function parseExpectedVersion(value) {
    if (typeof value === 'number') {
        return Number.isSafeInteger(value) && value > 0 ? value : null;
    }
    if (typeof value !== 'string' || !/^[1-9]\d*$/.test(value)) return null;

    const version = Number(value);
    return Number.isSafeInteger(version) && version > 0 ? version : null;
}

function buildMasterVersionClaim(masterId, expectedVersion) {
    const version = parseExpectedVersion(expectedVersion);
    if (!version) throw new Error('A positive integer version is required.');

    return {
        sql: 'UPDATE masters SET version = version + 1 WHERE id = ? AND version = ?',
        values: [masterId, version]
    };
}

function buildOptimisticMasterUpdate({ updates, values, masterId, expectedVersion }) {
    const version = parseExpectedVersion(expectedVersion);
    if (!version) throw new Error('A positive integer version is required.');
    if (!Array.isArray(updates) || updates.length === 0) {
        throw new Error('At least one field update is required.');
    }
    if (updates.some(update => !/^[A-Za-z_][A-Za-z0-9_]* = \?$/.test(update))) {
        throw new Error('Only allowlisted SQL field assignments are permitted.');
    }
    if (updates.some(update => /^version = \?$/.test(update))) {
        throw new Error('The version is managed exclusively by the concurrency claim.');
    }
    if (!Array.isArray(values) || values.length !== updates.length) {
        throw new Error('Update values must match field assignments.');
    }

    return {
        sql: `UPDATE masters SET ${updates.join(', ')}, version = version + 1 WHERE id = ? AND version = ?`,
        values: [...values, masterId, version]
    };
}

async function withTransaction(pool, callback) {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        const result = await callback(connection);
        await connection.commit();
        return result;
    } catch (error) {
        try {
            await connection.rollback();
        } catch (rollbackError) {
            error.rollbackError = rollbackError;
        }
        throw error;
    } finally {
        connection.release();
    }
}

async function claimMasterVersion(connection, masterId, expectedVersion) {
    const version = parseExpectedVersion(expectedVersion);
    if (!version) {
        return {
            status: 400,
            error: 'A valid Master version is required. Reload the Master and try again.'
        };
    }

    const claim = buildMasterVersionClaim(masterId, version);
    const [result] = await connection.query(claim.sql, claim.values);
    if (result.affectedRows > 0) {
        return { nextVersion: version + 1 };
    }

    const [existing] = await connection.query('SELECT id, version FROM masters WHERE id = ?', [masterId]);
    return existing.length === 0
        ? { status: 404, error: 'Master not found.' }
        : {
            status: 409,
            error: 'This Master was changed by another user. Reload latest data before saving.',
            currentVersion: existing[0].version
        };
}

module.exports = {
    parseExpectedVersion,
    buildMasterVersionClaim,
    buildOptimisticMasterUpdate,
    withTransaction,
    claimMasterVersion
};
