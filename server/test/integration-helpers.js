const assert = require('node:assert/strict');
const http = require('node:http');
const path = require('node:path');
const { once } = require('node:events');
const { spawn } = require('node:child_process');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

function getTestConfig() {
    const database = process.env.TEST_DB_NAME;
    if (!database || !/^export_app_test_[A-Za-z0-9_$]+$/.test(database)) {
        throw new Error(
            'Integration tests require TEST_DB_NAME matching export_app_test_<suffix>.'
        );
    }
    if (database === 'export_management') {
        throw new Error('Integration tests refuse to use the development database.');
    }

    const required = ['TEST_DB_HOST', 'TEST_DB_USER', 'TEST_DB_PASSWORD'];
    const missing = required.filter(key => process.env[key] === undefined);
    if (missing.length > 0) {
        throw new Error(`Integration tests require: ${missing.join(', ')}.`);
    }

    return {
        host: process.env.TEST_DB_HOST,
        port: process.env.TEST_DB_PORT || 3306,
        user: process.env.TEST_DB_USER,
        password: process.env.TEST_DB_PASSWORD,
        database
    };
}

async function runMigration(config) {
    const migrationPath = path.resolve(__dirname, '../src/db/migrate.js');
    const child = spawn(process.execPath, [migrationPath], {
        cwd: path.resolve(__dirname, '..'),
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
    const [companyOne] = await pool.query(
        'INSERT INTO companies (name, address, iec_no) VALUES (?, ?, ?)',
        ['Integration Company One', 'Test Address One', 'TESTIEC001']
    );
    const [companyTwo] = await pool.query(
        'INSERT INTO companies (name, address, iec_no) VALUES (?, ?, ?)',
        ['Integration Company Two', 'Test Address Two', 'TESTIEC002']
    );
    const [clientOne] = await pool.query(
        'INSERT INTO clients (company_id, name, address) VALUES (?, ?, ?)',
        [companyOne.insertId, 'Integration Client One', 'Client Address One']
    );
    const [clientTwo] = await pool.query(
        'INSERT INTO clients (company_id, name, address) VALUES (?, ?, ?)',
        [companyTwo.insertId, 'Integration Client Two', 'Client Address Two']
    );
    const [bank] = await pool.query(
        `INSERT INTO company_bank_accounts
            (company_id, bank_name, account_name, account_no, swift_code, is_default)
         VALUES (?, ?, ?, ?, ?, TRUE)`,
        [companyOne.insertId, 'Integration Bank', 'Integration Account', 'TEST-001', 'TESTSWIFT']
    );
    const password = 'integration-password-123';
    const passwordHash = await bcrypt.hash(password, 4);
    const [user] = await pool.query(
        `INSERT INTO users
            (username, password_hash, full_name, password_reset_version,
             must_change_password, is_active)
         VALUES (?, ?, ?, 0, FALSE, TRUE)`,
        ['integration-admin', passwordHash, 'Integration Admin']
    );

    return {
        companyOneId: companyOne.insertId,
        companyTwoId: companyTwo.insertId,
        clientOneId: clientOne.insertId,
        clientTwoId: clientTwo.insertId,
        bankId: bank.insertId,
        userId: user.insertId,
        username: 'integration-admin',
        password
    };
}

async function startHttpServer(app) {
    const server = http.createServer(app);
    server.listen(0, '127.0.0.1');
    await once(server, 'listening');
    const { port } = server.address();
    return { server, baseUrl: `http://127.0.0.1:${port}` };
}

async function setupIntegration() {
    const config = getTestConfig();
    process.env.NODE_ENV = 'test';
    process.env.DB_HOST = config.host;
    process.env.DB_PORT = String(config.port);
    process.env.DB_USER = config.user;
    process.env.DB_PASSWORD = config.password;
    process.env.DB_NAME = config.database;
    process.env.JWT_SECRET = process.env.TEST_JWT_SECRET || 'integration-only-jwt-secret';

    await runMigration(config);

    const app = require('../src/index');
    const pool = require('../src/db/connection');
    const fixtures = await seedFixtures(pool);
    const { server, baseUrl } = await startHttpServer(app);

    async function request(method, route, body, token) {
        const headers = {};
        if (body !== undefined) headers['content-type'] = 'application/json';
        if (token) headers.authorization = `Bearer ${token}`;
        const response = await fetch(`${baseUrl}${route}`, {
            method,
            headers,
            body: body === undefined ? undefined : JSON.stringify(body)
        });
        const raw = await response.text();
        let parsed = raw;
        try { parsed = raw ? JSON.parse(raw) : null; } catch (_) { /* binary response */ }
        return { status: response.status, headers: response.headers, body: parsed, raw };
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
            await new Promise(resolve => server.close(resolve));
            await pool.end();
        }
    };
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

async function cleanupFixtures(context) {
    const tables = [
        'document_overrides', 'order_documents', 'coa_tests', 'container_products',
        'containers', 'masters', 'proforma_invoices', 'company_bank_accounts',
        'clients', 'companies', 'users'
    ];
    for (const table of tables) await context.pool.query(`DELETE FROM \`${table}\``);
}

module.exports = {
    setupIntegration,
    login,
    createBlankMaster,
    cleanupFixtures
};
