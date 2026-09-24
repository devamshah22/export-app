const assert = require('node:assert/strict');
const path = require('node:path');
const { once } = require('node:events');
const { spawn } = require('node:child_process');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const supertest = require('supertest');
const dotenv = require('dotenv');

function quoteIdentifier(value) {
    assert.match(value, /^export_app_test_[A-Za-z0-9_$]+$/);
    return `\`${value}\``;
}

function getTestConfig() {
    dotenv.config({ path: path.resolve(__dirname, '../../.env') });

    const generated = !process.env.TEST_DB_NAME;
    const database = process.env.TEST_DB_NAME ||
        `export_app_test_${process.pid}_${Date.now()}`;
    if (!/^export_app_test_[A-Za-z0-9_$]+$/.test(database) || database === 'export_management') {
        throw new Error('Integration tests refuse non-isolated database names.');
    }

    const prefix = process.env.TEST_DB_NAME ? 'TEST_DB' : 'DB';
    const values = {
        host: process.env[`${prefix}_HOST`],
        port: process.env[`${prefix}_PORT`] || 3306,
        user: process.env[`${prefix}_USER`],
        password: process.env[`${prefix}_PASSWORD`],
        database,
        generated
    };
    const missing = ['host', 'user', 'password']
        .filter(key => values[key] === undefined || values[key] === '');
    if (missing.length > 0) {
        throw new Error(`Integration tests require database ${prefix} credentials.`);
    }
    return values;
}

async function runMigration(config) {
    const migrationPath = path.resolve(__dirname, '../../src/db/migrate.js');
    const child = spawn(process.execPath, [migrationPath], {
        cwd: path.resolve(__dirname, '../..'),
        env: {
            ...process.env,
            NODE_ENV: 'test',
            DB_HOST: config.host,
            DB_PORT: String(config.port),
            DB_USER: config.user,
            DB_PASSWORD: config.password,
            DB_NAME: config.database,
            JWT_SECRET: process.env.TEST_JWT_SECRET || 'integration-only-jwt-secret'
        },
        stdio: ['ignore', 'pipe', 'pipe']
    });
    let stdout = '';
    let stderr = '';
    child.stdout.setEncoding('utf8');
    child.stderr.setEncoding('utf8');
    child.stdout.on('data', chunk => { stdout += chunk; });
    child.stderr.on('data', chunk => { stderr += chunk; });
    const [exitCode] = await once(child, 'close');
    if (exitCode !== 0) {
        throw new Error(`Test database migration failed (${exitCode}).\n${stdout}\n${stderr}`);
    }
}

async function seedFixtures(pool) {
    const runId = `${process.pid}-${Date.now()}`;
    const [companyOne] = await pool.query(
        'INSERT INTO companies (name, address, iec_no) VALUES (?, ?, ?)',
        [`Integration Company One ${runId}`, 'Test Address One', `TESTIEC1${runId}`]
    );
    const [companyTwo] = await pool.query(
        'INSERT INTO companies (name, address, iec_no) VALUES (?, ?, ?)',
        [`Integration Company Two ${runId}`, 'Test Address Two', `TESTIEC2${runId}`]
    );
    const [clientOne] = await pool.query(
        'INSERT INTO clients (company_id, name, address) VALUES (?, ?, ?)',
        [companyOne.insertId, `Integration Client One ${runId}`, 'Client Address One']
    );
    const [clientTwo] = await pool.query(
        'INSERT INTO clients (company_id, name, address) VALUES (?, ?, ?)',
        [companyTwo.insertId, `Integration Client Two ${runId}`, 'Client Address Two']
    );
    const [bank] = await pool.query(
        `INSERT INTO company_bank_accounts
            (company_id, bank_name, account_name, account_no, swift_code, is_default)
         VALUES (?, ?, ?, ?, ?, TRUE)`,
        [companyOne.insertId, 'Integration Bank', 'Integration Account', `TEST-${runId}`, 'TESTSWIFT']
    );
    const username = `integration-admin-${runId}`;
    const password = 'integration-password-123';
    const passwordHash = await bcrypt.hash(password, 4);
    const [user] = await pool.query(
        `INSERT INTO users
            (username, password_hash, full_name, password_reset_version,
             must_change_password, is_active)
         VALUES (?, ?, ?, 0, FALSE, TRUE)`,
        [username, passwordHash, 'Integration Admin']
    );

    return {
        companyOneId: companyOne.insertId,
        companyTwoId: companyTwo.insertId,
        clientOneId: clientOne.insertId,
        clientTwoId: clientTwo.insertId,
        bankId: bank.insertId,
        userId: user.insertId,
        username,
        password
    };
}

async function dropGeneratedDatabase(config) {
    if (!config.generated) return;
    const cleanup = await mysql.createConnection({
        host: config.host,
        port: config.port,
        user: config.user,
        password: config.password
    });
    try {
        await cleanup.query(`DROP DATABASE IF EXISTS ${quoteIdentifier(config.database)}`);
    } finally {
        await cleanup.end();
    }
}

async function setupIntegration() {
    const config = getTestConfig();
    let pool;
    try {
        if (config.generated) {
            const admin = await mysql.createConnection({
                host: config.host,
                port: config.port,
                user: config.user,
                password: config.password
            });
            try {
                await admin.query(`CREATE DATABASE IF NOT EXISTS ${quoteIdentifier(config.database)}`);
            } finally {
                await admin.end();
            }
        }
        process.env.NODE_ENV = 'test';
        process.env.DB_HOST = config.host;
        process.env.DB_PORT = String(config.port);
        process.env.DB_USER = config.user;
        process.env.DB_PASSWORD = config.password;
        process.env.DB_NAME = config.database;
        process.env.JWT_SECRET = process.env.TEST_JWT_SECRET || 'integration-only-jwt-secret';

        await runMigration(config);

        const app = require('../../src/index');
        pool = require('../../src/db/connection');
        const fixtures = await seedFixtures(pool);
        const requestAgent = supertest(app);

        async function request(method, route, body, token) {
            let requestBuilder = requestAgent[method.toLowerCase()](route);
            if (token) requestBuilder = requestBuilder.set('Authorization', `Bearer ${token}`);
            if (body !== undefined) requestBuilder = requestBuilder.send(body);
            const response = await requestBuilder;
            let parsed = response.body;
            if (!Object.keys(response.body || {}).length && response.text) {
                try { parsed = JSON.parse(response.text); } catch (_) { parsed = response.text; }
            }
            return {
                status: response.status,
                headers: new Headers(response.headers),
                body: parsed,
                raw: response.text
            };
        }

        return {
            config,
            pool,
            fixtures,
            request,
            async query(sql, values) {
                const [rows] = await pool.query(sql, values);
                return rows;
            },
            async close() {
                // Restrict teardown to rows created by this fixture set.
                await pool.query(
                    'DELETE FROM masters WHERE company_id IN (?, ?)',
                    [fixtures.companyOneId, fixtures.companyTwoId]
                );
                await pool.query(
                    'DELETE FROM master_sequences WHERE company_id IN (?, ?)',
                    [fixtures.companyOneId, fixtures.companyTwoId]
                );
                await pool.query(
                    'DELETE FROM company_bank_accounts WHERE id = ?',
                    [fixtures.bankId]
                );
                await pool.query(
                    'DELETE FROM clients WHERE id IN (?, ?)',
                    [fixtures.clientOneId, fixtures.clientTwoId]
                );
                await pool.query(
                    'DELETE FROM companies WHERE id IN (?, ?)',
                    [fixtures.companyOneId, fixtures.companyTwoId]
                );
                await pool.query('DELETE FROM users WHERE id = ?', [fixtures.userId]);
                await pool.end();
                await dropGeneratedDatabase(config);
            }
        };
    } catch (error) {
        if (pool) await pool.end();
        await dropGeneratedDatabase(config);
        throw error;
    }
}

async function login(context) {
    const result = await context.request('POST', '/api/auth/login', {
        username: context.fixtures.username,
        password: context.fixtures.password
    });
    assert.equal(result.status, 200);
    assert.equal(typeof result.body.token, 'string');
    return result.body.token;
}

async function createBlankMaster(context, token, fields = {}) {
    const result = await context.request('POST', '/api/masters/blank', {
        company_id: context.fixtures.companyOneId,
        client_id: context.fixtures.clientOneId,
        ...fields
    }, token);
    assert.equal(result.status, 201);
    return result.body;
}

module.exports = {
    setupIntegration,
    login,
    createBlankMaster,
    runMigration
};
