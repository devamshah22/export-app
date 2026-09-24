const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');
require('dotenv').config();

async function seed() {
    let connection;
    try {
        connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            port: process.env.DB_PORT,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME
        });

        console.log('Seeding database...');

        // Insert companies
        await connection.query(`
            INSERT IGNORE INTO companies (id, name, address, plot_no, city, district, state, pin_code, iec_no, gst_no, cin_no, lut_arn_no, director_name, director_contact, range_name, division, commissionerate, ssp_no)
            VALUES 
            (1, 'CHIRAG ORGANICS PVT LTD', 'PLOT No. 902/, PHASE 3, GIDC, VAPI. DIST-VALSAD. GUJARAT - 396195. INDIA', '902/A', 'VAPI', 'VALSAD', 'GUJARAT', '396195', '0302034218', '24AAACC4868R1Z3', 'U45201GJ1989PTC012617', 'AD240426012878X DT :- 08/04/2026', 'JIGAR SHETH', '+919820355066', 'I', 'X VAPI II', 'SURAT', 'SSP No. - 251/CUS/AHD/2024-25 DT - 01/10/2024')
        `);

        // Repair identity fields for existing company rows; INSERT IGNORE does not update them.
        await connection.query(
            `UPDATE companies SET gst_no = ?, cin_no = ? WHERE id = ?`,
            ['24AAACC4868R1Z3', 'U45201GJ1989PTC012617', 1]
        );

        // Insert default user (password: admin123). Force password change on first login.
        const passwordHash = await bcrypt.hash('admin123', 10);
        await connection.query(`
            INSERT IGNORE INTO users
                (id, username, password_hash, full_name, must_change_password)
            VALUES (1, 'admin', ?, 'Administrator', TRUE)
        `, [passwordHash]);
        await connection.query(
            'UPDATE users SET must_change_password = TRUE WHERE id = 1 AND password_reset_version = 0'
        );

        // Insert company bank account
        await connection.query(`
            INSERT IGNORE INTO company_bank_accounts (id, company_id, bank_name, account_name, account_no, branch_address, swift_code, is_default)
            VALUES (1, 1, 'ICICI BANK LTD', 'M/S CHIRAG ORGANICS PVT LTD', '777705191156', 'Padmavati complex, opp. 21st Century Hospital, GIDC, Vapi, Gujarat - 396195. India', 'ICICINBBNRI', TRUE)
        `);

        console.log('✓ Seed data inserted successfully.');
        console.log('  Default login: admin / admin123');
    } catch (error) {
        console.error('Seeding failed:', error.message);
        process.exit(1);
    } finally {
        if (connection) await connection.end();
    }
}

seed();
