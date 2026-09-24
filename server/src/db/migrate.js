const mysql = require('mysql2/promise');
const { retireUnsupportedDocuments } = require('./documentRetirement');
const { reconcileCurrentSchema } = require('./schemaReconciliation');
require('dotenv').config();

const schema = `
-- =============================================
-- DATABASE CREATION
-- =============================================

-- =============================================
-- CORE TABLES
-- =============================================

CREATE TABLE IF NOT EXISTS companies (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    address TEXT,
    plot_no VARCHAR(100),
    city VARCHAR(100),
    district VARCHAR(100),
    state VARCHAR(100),
    pin_code VARCHAR(10),
    country VARCHAR(50) DEFAULT 'India',
    iec_no VARCHAR(50),
    gst_no VARCHAR(50),
    cin_no VARCHAR(100),
    lut_arn_no VARCHAR(255),
    director_name VARCHAR(100),
    director_contact VARCHAR(20),
    director_email VARCHAR(255),
    ssp_no VARCHAR(255),
    range_name VARCHAR(100),
    division VARCHAR(100),
    commissionerate VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    security_question VARCHAR(255),
    security_answer_hash VARCHAR(255),
    password_reset_version INT NOT NULL DEFAULT 0,
    must_change_password BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS clients (
    id INT AUTO_INCREMENT PRIMARY KEY,
    company_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    address TEXT,
    registration_no VARCHAR(100),
    contact_person VARCHAR(255),
    contact_email VARCHAR(255),
    contact_mobile VARCHAR(50),
    folder_path VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id)
);

CREATE TABLE IF NOT EXISTS company_bank_accounts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    company_id INT NOT NULL,
    bank_name VARCHAR(255),
    account_name VARCHAR(255),
    account_no VARCHAR(50),
    branch_address TEXT,
    swift_code VARCHAR(20),
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id)
);

-- =============================================
-- PI (PROFORMA INVOICE) TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS proforma_invoices (
    id INT AUTO_INCREMENT PRIMARY KEY,
    company_id INT NOT NULL,
    client_id INT NOT NULL,

    -- PI Number (auto-increment per company per FY)
    pi_number INT NOT NULL,
    financial_year VARCHAR(10) NOT NULL,
    pi_date DATE NOT NULL,
    
    -- Terms
    currency ENUM('USD', 'AED', 'EUR') NOT NULL DEFAULT 'USD',
    incoterms VARCHAR(255),
    payment_terms VARCHAR(255),
    consignee_name VARCHAR(255),
    consignee_address TEXT,
    
    -- Product (summary level for PI)
    product_name VARCHAR(255),
    hs_code VARCHAR(20),
    un_number VARCHAR(20),
    description VARCHAR(255),
    packing_type VARCHAR(100),
    country_of_origin VARCHAR(100),
    country_of_discharge VARCHAR(100),
    port_of_loading VARCHAR(255),
    port_of_discharge VARCHAR(255),
    no_kind_of_packages VARCHAR(255),
    gross_weight DECIMAL(10,3),
    tare_weight DECIMAL(10,3),
    net_weight DECIMAL(10,3),
    lot_no VARCHAR(100),
    bag_no VARCHAR(100),
    bag_weight DECIMAL(10,3),
    total_quantity DECIMAL(15,3),
    uom VARCHAR(10),
    unit_rate DECIMAL(15,4),
    
    -- Pricing
    fob_amount DECIMAL(15,2),
    freight_amount DECIMAL(15,2),
    total_amount DECIMAL(15,2),
    
    -- Bank details
    company_bank_id INT,
    
    -- Buyer info (if different from client)
    buyer_name VARCHAR(255),
    buyer_address TEXT,
    
    -- Delivery
    delivery_date DATE,
    
    -- Terms & Conditions (can be customized per PI)
    terms_conditions TEXT,
    
    -- Metadata
    status ENUM('draft', 'confirmed', 'converted') DEFAULT 'draft',
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (company_id) REFERENCES companies(id),
    FOREIGN KEY (client_id) REFERENCES clients(id),
    FOREIGN KEY (company_bank_id) REFERENCES company_bank_accounts(id),
    FOREIGN KEY (created_by) REFERENCES users(id),
    UNIQUE KEY unique_pi (company_id, financial_year, pi_number)
);

-- =============================================
-- MASTER (ORDER) TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS masters (
    id INT AUTO_INCREMENT PRIMARY KEY,
    company_id INT NOT NULL,
    client_id INT NULL,

    -- Master Identification
    master_number INT,
    master_financial_year VARCHAR(10),
    master_folder_path VARCHAR(500),

    -- Consignor and Buyer
    consignor_name VARCHAR(255),
    consignor_address TEXT,
    buyer_name VARCHAR(255),
    buyer_address TEXT,

    -- Invoice Details
    invoice_no VARCHAR(50),
    invoice_date DATE,
    ci_invoice_no VARCHAR(50),
    ci_invoice_date DATE,
    po_no VARCHAR(100),
    po_date DATE,
    other_ref VARCHAR(255),
    lut_arn_no VARCHAR(255),
    
    -- Shipping Details
    port_of_loading VARCHAR(255),
    port_of_discharge VARCHAR(255),
    country_of_origin VARCHAR(100) DEFAULT 'India',
    country_of_discharge VARCHAR(100),
    country_of_supply VARCHAR(100) DEFAULT 'India',
    shipment_date DATE,
    vessel_no VARCHAR(255),
    bill_of_lading_no VARCHAR(100),
    shipping_bill_no VARCHAR(100),
    shipping_bill_date DATE,
    
    -- Consignee (often the bank)
    consignee_name VARCHAR(255),
    consignee_address TEXT,
    
    -- Notify Parties
    notify_party_1_name VARCHAR(255),
    notify_party_1_address TEXT,
    notify_party_2_name VARCHAR(255),
    notify_party_2_address TEXT,
    
    -- Terms (copied from PI)
    currency ENUM('USD', 'AED', 'EUR') NOT NULL DEFAULT 'USD',
    incoterms VARCHAR(255),
    payment_terms VARCHAR(255),
    issuing_bank VARCHAR(255),
    lc_no_and_date VARCHAR(255),
    freight_terms VARCHAR(100),
    terms_conditions TEXT,
    container_goods_description TEXT,
    account_name VARCHAR(255),
    bank_name VARCHAR(255),
    account_no VARCHAR(50),
    swift_code VARCHAR(20),
    branch VARCHAR(255),

    -- Pricing Summary (editable)
    fob_amount DECIMAL(15,2),
    freight_amount DECIMAL(15,2),
    total_amount DECIMAL(15,2),
    amount_in_words TEXT,
    
    -- Product (summary from PI, editable)
    product_name VARCHAR(255),
    hs_code VARCHAR(20),
    description VARCHAR(255),
    packing_type VARCHAR(100),
    bag_weight DECIMAL(10,3),
    tare_weight DECIMAL(10,3),
    total_quantity DECIMAL(15,3),
    total_packages INT,
    per_fcl_packages INT,
    unit_1 VARCHAR(50),
    unit_2 VARCHAR(50),
    uom VARCHAR(10),
    unit_rate DECIMAL(15,4),
    lot_no VARCHAR(100),
    bag_no_from INT,
    bag_no_to INT,
    
    -- Weights (totals)
    total_gross_weight DECIMAL(10,3),
    net_weight DECIMAL(10,3),
    nett_weight DECIMAL(10,3),
    
    -- Bank account
    company_bank_id INT,
    
    -- DGD specific fields
    booking_no VARCHAR(100),
    un_number VARCHAR(20),
    imdg_class VARCHAR(10),
    packing_group VARCHAR(10),
    marine_pollutant VARCHAR(10),
    flash_point VARCHAR(20),
    ems_code VARCHAR(20),
    proper_shipping_name TEXT,
    un_packaging_code VARCHAR(255),
    
    -- COA specific
    mfg_date DATE,
    expiry_date DATE,
    
    -- EUC
    application VARCHAR(255),

    -- BC
    bc_declaration_1 TEXT,
    bc_declaration_2 TEXT,
    bc_declaration_3 TEXT,
    bc_issued_by VARCHAR(255),

    -- Metadata
    status ENUM('draft', 'in_progress', 'dispatched', 'completed') DEFAULT 'draft',
    created_by INT,
    version INT NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (company_id) REFERENCES companies(id),
    FOREIGN KEY (client_id) REFERENCES clients(id),
    FOREIGN KEY (company_bank_id) REFERENCES company_bank_accounts(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- =============================================
-- CONTAINERS (per master, dynamic count)
-- =============================================

CREATE TABLE IF NOT EXISTS containers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    master_id INT NOT NULL,
    sequence_no INT NOT NULL,
    
    container_no VARCHAR(50),
    truck_no VARCHAR(50),
    liner_seal_no VARCHAR(50),
    rfid_seal_no VARCHAR(50),
    container_size VARCHAR(10),
    tare_weight DECIMAL(10,2),
    gross_weight DECIMAL(10,2),
    max_permissible_weight DECIMAL(10,2),
    
    -- VGM specific
    weighbridge_name VARCHAR(255),
    weighing_method VARCHAR(50) DEFAULT 'METHOD-1',
    verified_gross_mass VARCHAR(255),
    verified_gross_mass_unit VARCHAR(10) DEFAULT 'KGS',
    weighing_date DATE,
    weighing_time TIME,
    weighing_slip_no VARCHAR(50),
    cargo_type VARCHAR(50) DEFAULT 'HAZARDOUS',
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (master_id) REFERENCES masters(id) ON DELETE CASCADE
);

-- =============================================
-- PRODUCTS PER CONTAINER
-- =============================================

CREATE TABLE IF NOT EXISTS container_products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    container_id INT NOT NULL,
    master_id INT NOT NULL,
    
    product_name VARCHAR(255),
    hs_code VARCHAR(20),
    description VARCHAR(255),
    packing_type VARCHAR(100),
    bag_weight DECIMAL(10,3),
    tare_weight_per_bag DECIMAL(10,3),
    num_packages INT,
    net_weight DECIMAL(10,3),
    gross_weight DECIMAL(10,3),
    lot_no VARCHAR(100),
    bag_no_from INT,
    bag_no_to INT,
    unit_rate DECIMAL(15,4),
    uom VARCHAR(10),
    application VARCHAR(255),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (container_id) REFERENCES containers(id) ON DELETE CASCADE,
    FOREIGN KEY (master_id) REFERENCES masters(id) ON DELETE CASCADE
);

-- =============================================
-- COA TEST RESULTS (same tests always)
-- =============================================

CREATE TABLE IF NOT EXISTS coa_tests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    master_id INT NOT NULL,
    test_name VARCHAR(255) NOT NULL,
    specification VARCHAR(100),
    result VARCHAR(100),
    method VARCHAR(255),
    sort_order INT DEFAULT 0,
    
    FOREIGN KEY (master_id) REFERENCES masters(id) ON DELETE CASCADE
);

-- =============================================
-- DOCUMENT OVERRIDES
-- =============================================

CREATE TABLE IF NOT EXISTS document_overrides (
    id INT AUTO_INCREMENT PRIMARY KEY,
    master_id INT NOT NULL,
    document_type VARCHAR(50) NOT NULL,
    field_key VARCHAR(100) NOT NULL,
    field_value TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    UNIQUE KEY unique_document_override (master_id, document_type, field_key),
    FOREIGN KEY (master_id) REFERENCES masters(id) ON DELETE CASCADE
);

-- =============================================
-- DOCUMENT TRACKING
-- =============================================

CREATE TABLE IF NOT EXISTS order_documents (
    id INT AUTO_INCREMENT PRIMARY KEY,
    master_id INT NOT NULL,
    document_type ENUM(
        'BL_DRAFT', 'CI', 'PL', 'COA', 'CCVO', 'BC',
        'MFG_CERTI', 'SCOMET', 'FORM_SDF', 'EUC',
        'ANNEXURE_A', 'ANNEXURE_C', 'DGD', 'VGM'
    ) NOT NULL,
    container_id INT NULL,
    file_path VARCHAR(500),
    is_selected BOOLEAN DEFAULT FALSE,
    generated_at TIMESTAMP NULL,
    
    FOREIGN KEY (master_id) REFERENCES masters(id) ON DELETE CASCADE,
    FOREIGN KEY (container_id) REFERENCES containers(id) ON DELETE SET NULL
);

-- =============================================
-- PI NUMBER SEQUENCE
-- =============================================

CREATE TABLE IF NOT EXISTS pi_sequences (
    id INT AUTO_INCREMENT PRIMARY KEY,
    company_id INT NOT NULL,
    financial_year VARCHAR(10) NOT NULL,
    last_number INT DEFAULT 0,
    UNIQUE KEY (company_id, financial_year),
    FOREIGN KEY (company_id) REFERENCES companies(id)
);

-- =============================================
-- LEGACY COURIER DETAILS (preserved data; no active document)
-- =============================================

CREATE TABLE IF NOT EXISTS courier_details (
    id INT AUTO_INCREMENT PRIMARY KEY,
    master_id INT NOT NULL,
    bank_name VARCHAR(255),
    bank_address TEXT,
    lc_reference VARCHAR(255),
    amount DECIMAL(15,2),
    document_list JSON,

    FOREIGN KEY (master_id) REFERENCES masters(id) ON DELETE CASCADE
);

-- =============================================
-- MASTER NUMBER SEQUENCE
-- =============================================

CREATE TABLE IF NOT EXISTS master_sequences (
    id INT AUTO_INCREMENT PRIMARY KEY,
    company_id INT NOT NULL,
    financial_year VARCHAR(10) NOT NULL,
    last_number INT NOT NULL DEFAULT 0,
    UNIQUE KEY unique_master_sequence (company_id, financial_year),
    FOREIGN KEY (company_id) REFERENCES companies(id)
);

-- =============================================
-- WEIGHBRIDGES
-- =============================================

CREATE TABLE IF NOT EXISTS weighbridges (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    address TEXT,
    registration_no VARCHAR(100),
    contact VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
`;

async function retireLegacyMasterPiRelationship(connection) {
    const [columns] = await connection.query(
        `SELECT 1
         FROM information_schema.columns
         WHERE table_schema = DATABASE()
           AND table_name = 'masters'
           AND column_name = 'pi_id'`
    );
    if (columns.length === 0) return;

    const [counts] = await connection.query(
        `SELECT COUNT(*) AS master_count,
                SUM(pi_id IS NOT NULL) AS linked_master_count
         FROM masters`
    );
    const masterCount = Number(counts[0]?.master_count || 0);
    const linkedMasterCount = Number(counts[0]?.linked_master_count || 0);
    const [orphans] = await connection.query(
        `SELECT COUNT(*) AS orphan_count
         FROM masters m
         LEFT JOIN proforma_invoices pi ON pi.id = m.pi_id
         WHERE m.pi_id IS NOT NULL AND pi.id IS NULL`
    );
    const orphanCount = Number(orphans[0]?.orphan_count || 0);
    console.log(`Legacy masters.pi_id snapshot: ${linkedMasterCount}/${masterCount} Masters linked, ${orphanCount} orphaned.`);
    if (orphanCount > 0) {
        throw new Error('Cannot retire masters.pi_id while orphaned PI references exist.');
    }

    const [foreignKeys] = await connection.query(
        `SELECT DISTINCT constraint_name
         FROM information_schema.key_column_usage
         WHERE table_schema = DATABASE()
           AND table_name = 'masters'
           AND column_name = 'pi_id'
           AND referenced_table_name IS NOT NULL`
    );
    for (const foreignKey of foreignKeys) {
        const name = String(
            foreignKey.constraint_name || foreignKey.CONSTRAINT_NAME || ''
        );
        if (!/^[A-Za-z0-9_$]+$/.test(name)) {
            throw new Error(`Unexpected masters.pi_id foreign-key name: ${name}`);
        }
        await connection.query(`ALTER TABLE masters DROP FOREIGN KEY \`${name}\``);
    }

    await connection.query('ALTER TABLE masters DROP COLUMN pi_id');
    const [remaining] = await connection.query(
        `SELECT 1
         FROM information_schema.columns
         WHERE table_schema = DATABASE()
           AND table_name = 'masters'
           AND column_name = 'pi_id'`
    );
    if (remaining.length > 0) throw new Error('masters.pi_id was not removed.');
    console.log('✓ Retired masters.pi_id and its foreign-key relationship.');
}

async function migrate() {
    let connection;
    try {
        const database = process.env.DB_NAME;
        if (!database || !/^[A-Za-z0-9_$]+$/.test(database)) {
            throw new Error('DB_NAME must be a valid MySQL database name.');
        }

        connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            port: process.env.DB_PORT,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            multipleStatements: true
        });
        const quotedDatabase = `\`${database.replace(/`/g, '``')}\``;
        await connection.query(`CREATE DATABASE IF NOT EXISTS ${quotedDatabase}`);
        await connection.changeUser({ database });

        console.log('Connected to MySQL server.');
        console.log('Running migrations...');

        await connection.query(schema);
        await retireLegacyMasterPiRelationship(connection);
        await reconcileCurrentSchema(connection);
        await retireUnsupportedDocuments(connection);

        const userColumnAdditions = [
            { name: 'security_question', ddl: 'ALTER TABLE users ADD COLUMN security_question VARCHAR(255) AFTER full_name' },
            { name: 'security_answer_hash', ddl: 'ALTER TABLE users ADD COLUMN security_answer_hash VARCHAR(255) AFTER security_question' },
            { name: 'password_reset_version', ddl: 'ALTER TABLE users ADD COLUMN password_reset_version INT NOT NULL DEFAULT 0 AFTER security_answer_hash' },
            { name: 'must_change_password', ddl: 'ALTER TABLE users ADD COLUMN must_change_password BOOLEAN NOT NULL DEFAULT FALSE AFTER password_reset_version' },
            { name: 'updated_at', ddl: 'ALTER TABLE users ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER created_at' }
        ];
        for (const column of userColumnAdditions) {
            const [rows] = await connection.query(
                `SELECT 1 FROM information_schema.columns
                 WHERE table_schema = DATABASE() AND table_name = 'users' AND column_name = ?`,
                [column.name]
            );
            if (rows.length === 0) {
                await connection.query(column.ddl);
                console.log(`✓ Added users.${column.name}.`);
            }
        }

        // Keep existing installations aligned with the current Master schema.
        const [masterVersionColumns] = await connection.query(
            `SELECT 1
             FROM information_schema.columns
             WHERE table_schema = DATABASE()
               AND table_name = 'masters'
               AND column_name = 'version'`
        );
        if (masterVersionColumns.length === 0) {
            await connection.query('ALTER TABLE masters ADD COLUMN version INT NOT NULL DEFAULT 1 AFTER created_by');
            console.log('✓ Added masters.version.');
        }

        const [perFclColumns] = await connection.query(
            `SELECT 1
             FROM information_schema.columns
             WHERE table_schema = DATABASE()
               AND table_name = 'masters'
               AND column_name = 'per_fcl_packages'`
        );
        if (perFclColumns.length === 0) {
            await connection.query('ALTER TABLE masters ADD COLUMN per_fcl_packages INT');
            console.log('✓ Added masters.per_fcl_packages.');
        }

        // PI: UN number for product details.
        const [piUnColumns] = await connection.query(
            `SELECT 1
             FROM information_schema.columns
             WHERE table_schema = DATABASE()
               AND table_name = 'proforma_invoices'
               AND column_name = 'un_number'`
        );
        if (piUnColumns.length === 0) {
            await connection.query('ALTER TABLE proforma_invoices ADD COLUMN un_number VARCHAR(20) AFTER hs_code');
            console.log('✓ Added proforma_invoices.un_number.');
        }

        // VGM: unit of measure and weighing time on containers.
        const containerColumnAdditions = [
            { name: 'verified_gross_mass_unit', ddl: "ALTER TABLE containers ADD COLUMN verified_gross_mass_unit VARCHAR(10) DEFAULT 'KGS'" },
            { name: 'weighing_time', ddl: 'ALTER TABLE containers ADD COLUMN weighing_time TIME' }
        ];
        for (const column of containerColumnAdditions) {
            const [rows] = await connection.query(
                `SELECT 1
                 FROM information_schema.columns
                 WHERE table_schema = DATABASE()
                   AND table_name = 'containers'
                   AND column_name = ?`,
                [column.name]
            );
            if (rows.length === 0) {
                await connection.query(column.ddl);
                console.log(`✓ Added containers.${column.name}.`);
            }
        }

        // VGM mass accepts alphanumeric values, including values such as N/A.
        const [vgmMassColumns] = await connection.query(
            `SELECT column_type
             FROM information_schema.columns
             WHERE table_schema = DATABASE()
               AND table_name = 'containers'
               AND column_name = 'verified_gross_mass'`
        );
        if (vgmMassColumns.length > 0 && String(vgmMassColumns[0].column_type || vgmMassColumns[0].COLUMN_TYPE).toLowerCase() !== 'varchar(255)') {
            await connection.query('ALTER TABLE containers MODIFY COLUMN verified_gross_mass VARCHAR(255)');
            console.log('✓ Changed containers.verified_gross_mass to VARCHAR(255).');
        }

        console.log('✓ Database and tables created successfully.');
    } catch (error) {
        console.error('Migration failed:', error.message);
        process.exit(1);
    } finally {
        if (connection) await connection.end();
    }
}

migrate();
