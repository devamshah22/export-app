const express = require('express');
const pool = require('../db/connection');

const router = express.Router();

// GET /api/companies - List all companies
router.get('/', async (req, res) => {
    try {
        const [companies] = await pool.query('SELECT * FROM companies ORDER BY name');
        res.json(companies);
    } catch (error) {
        console.error('Get companies error:', error);
        res.status(500).json({ error: 'Internal server error.' });
    }
});

// GET /api/companies/:id - Get single company
router.get('/:id', async (req, res) => {
    try {
        const [companies] = await pool.query('SELECT * FROM companies WHERE id = ?', [req.params.id]);
        if (companies.length === 0) {
            return res.status(404).json({ error: 'Company not found.' });
        }
        res.json(companies[0]);
    } catch (error) {
        console.error('Get company error:', error);
        res.status(500).json({ error: 'Internal server error.' });
    }
});

// GET /api/companies/:id/bank-accounts - Get company bank accounts
router.get('/:id/bank-accounts', async (req, res) => {
    try {
        const [accounts] = await pool.query(
            'SELECT * FROM company_bank_accounts WHERE company_id = ? ORDER BY is_default DESC',
            [req.params.id]
        );
        res.json(accounts);
    } catch (error) {
        console.error('Get bank accounts error:', error);
        res.status(500).json({ error: 'Internal server error.' });
    }
});

// POST /api/companies/:id/bank-accounts - Add bank account
router.post('/:id/bank-accounts', async (req, res) => {
    try {
        const { bank_name, account_name, account_no, branch_address, swift_code, is_default } = req.body;

        if (!bank_name || !account_no) {
            return res.status(400).json({ error: 'Bank name and account number are required.' });
        }

        // If setting as default, unset other defaults
        if (is_default) {
            await pool.query('UPDATE company_bank_accounts SET is_default = FALSE WHERE company_id = ?', [req.params.id]);
        }

        const [result] = await pool.query(
            `INSERT INTO company_bank_accounts (company_id, bank_name, account_name, account_no, branch_address, swift_code, is_default)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [req.params.id, bank_name, account_name, account_no, branch_address, swift_code, is_default || false]
        );

        const [newAccount] = await pool.query('SELECT * FROM company_bank_accounts WHERE id = ?', [result.insertId]);
        res.status(201).json(newAccount[0]);
    } catch (error) {
        console.error('Add bank account error:', error);
        res.status(500).json({ error: 'Internal server error.' });
    }
});

// PUT /api/companies/:companyId/bank-accounts/:accountId - Update bank account
router.put('/:companyId/bank-accounts/:accountId', async (req, res) => {
    try {
        const { bank_name, account_name, account_no, branch_address, swift_code, is_default } = req.body;

        if (is_default) {
            await pool.query('UPDATE company_bank_accounts SET is_default = FALSE WHERE company_id = ?', [req.params.companyId]);
        }

        await pool.query(
            `UPDATE company_bank_accounts SET bank_name = ?, account_name = ?, account_no = ?, branch_address = ?, swift_code = ?, is_default = ?
             WHERE id = ? AND company_id = ?`,
            [bank_name, account_name, account_no, branch_address, swift_code, is_default || false, req.params.accountId, req.params.companyId]
        );

        const [updated] = await pool.query('SELECT * FROM company_bank_accounts WHERE id = ?', [req.params.accountId]);
        res.json(updated[0]);
    } catch (error) {
        console.error('Update bank account error:', error);
        res.status(500).json({ error: 'Internal server error.' });
    }
});

// DELETE /api/companies/:companyId/bank-accounts/:accountId - Delete bank account
router.delete('/:companyId/bank-accounts/:accountId', async (req, res) => {
    try {
        await pool.query('DELETE FROM company_bank_accounts WHERE id = ? AND company_id = ?', 
            [req.params.accountId, req.params.companyId]);
        res.json({ message: 'Bank account deleted successfully.' });
    } catch (error) {
        console.error('Delete bank account error:', error);
        res.status(500).json({ error: 'Internal server error.' });
    }
});

// GET /api/companies/weighbridges - Get all weighbridges
router.get('/weighbridges/all', async (req, res) => {
    try {
        const [weighbridges] = await pool.query('SELECT * FROM weighbridges ORDER BY name');
        res.json(weighbridges);
    } catch (error) {
        console.error('Get weighbridges error:', error);
        res.status(500).json({ error: 'Internal server error.' });
    }
});

// POST /api/companies/weighbridges - Add weighbridge
router.post('/weighbridges', async (req, res) => {
    try {
        const { name, address, registration_no, contact } = req.body;
        if (!name) return res.status(400).json({ error: 'Name is required.' });
        const [result] = await pool.query(
            'INSERT INTO weighbridges (name, address, registration_no, contact) VALUES (?, ?, ?, ?)',
            [name, address, registration_no, contact]
        );
        const [newWB] = await pool.query('SELECT * FROM weighbridges WHERE id = ?', [result.insertId]);
        res.status(201).json(newWB[0]);
    } catch (error) {
        console.error('Add weighbridge error:', error);
        res.status(500).json({ error: 'Internal server error.' });
    }
});

module.exports = router;
