const express = require('express');
const path = require('path');
const fs = require('fs');
const pool = require('../db/connection');

const router = express.Router();

// GET /api/clients?company_id=1 - List clients for a company
router.get('/', async (req, res) => {
    try {
        const { company_id } = req.query;

        if (!company_id) {
            return res.status(400).json({ error: 'company_id is required.' });
        }

        const [clients] = await pool.query(
            'SELECT * FROM clients WHERE company_id = ? ORDER BY name',
            [company_id]
        );
        res.json(clients);
    } catch (error) {
        console.error('Get clients error:', error);
        res.status(500).json({ error: 'Internal server error.' });
    }
});

// GET /api/clients/:id - Get single client
router.get('/:id', async (req, res) => {
    try {
        const [clients] = await pool.query('SELECT * FROM clients WHERE id = ?', [req.params.id]);
        if (clients.length === 0) {
            return res.status(404).json({ error: 'Client not found.' });
        }
        res.json(clients[0]);
    } catch (error) {
        console.error('Get client error:', error);
        res.status(500).json({ error: 'Internal server error.' });
    }
});

// POST /api/clients - Create new client
router.post('/', async (req, res) => {
    try {
        const { company_id, name, address, registration_no, contact_person, contact_email, contact_mobile } = req.body;

        if (!company_id || !name) {
            return res.status(400).json({ error: 'company_id and name are required.' });
        }

        // Get company name for folder structure
        const [companies] = await pool.query('SELECT name FROM companies WHERE id = ?', [company_id]);
        if (companies.length === 0) {
            return res.status(400).json({ error: 'Invalid company_id.' });
        }

        // Create folder path: STORAGE_PATH/CompanyName/ClientName
        const storagePath = process.env.STORAGE_PATH || 'D:/Export software/storage';
        const companyFolder = companies[0].name.replace(/[^a-zA-Z0-9\s]/g, '').trim();
        const clientFolder = name.replace(/[^a-zA-Z0-9\s]/g, '').trim();
        const folderPath = path.join(storagePath, companyFolder, clientFolder);

        // Create directory if not exists
        if (!fs.existsSync(folderPath)) {
            fs.mkdirSync(folderPath, { recursive: true });
        }

        const [result] = await pool.query(
            `INSERT INTO clients (company_id, name, address, registration_no, contact_person, contact_email, contact_mobile, folder_path)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [company_id, name, address, registration_no, contact_person, contact_email, contact_mobile, folderPath]
        );

        const [newClient] = await pool.query('SELECT * FROM clients WHERE id = ?', [result.insertId]);

        res.status(201).json(newClient[0]);
    } catch (error) {
        console.error('Create client error:', error);
        res.status(500).json({ error: 'Internal server error.' });
    }
});

// PUT /api/clients/:id - Update client
router.put('/:id', async (req, res) => {
    try {
        const { name, address, registration_no, contact_person, contact_email, contact_mobile } = req.body;

        await pool.query(
            `UPDATE clients SET name = ?, address = ?, registration_no = ?, contact_person = ?, contact_email = ?, contact_mobile = ?
             WHERE id = ?`,
            [name, address, registration_no, contact_person, contact_email, contact_mobile, req.params.id]
        );

        const [updated] = await pool.query('SELECT * FROM clients WHERE id = ?', [req.params.id]);
        res.json(updated[0]);
    } catch (error) {
        console.error('Update client error:', error);
        res.status(500).json({ error: 'Internal server error.' });
    }
});

// DELETE /api/clients/:id - Delete client
router.delete('/:id', async (req, res) => {
    try {
        await pool.query('DELETE FROM clients WHERE id = ?', [req.params.id]);
        res.json({ message: 'Client deleted successfully.' });
    } catch (error) {
        console.error('Delete client error:', error);
        res.status(500).json({ error: 'Internal server error.' });
    }
});

module.exports = router;
