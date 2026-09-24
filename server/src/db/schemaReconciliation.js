const MASTER_COLUMNS = Object.freeze([
    ['master_number', 'INT NULL'],
    ['master_financial_year', 'VARCHAR(10) NULL'],
    ['master_folder_path', 'VARCHAR(500) NULL'],
    ['consignor_name', 'VARCHAR(255) NULL'],
    ['consignor_address', 'TEXT NULL'],
    ['buyer_name', 'VARCHAR(255) NULL'],
    ['buyer_address', 'TEXT NULL'],
    ['ci_invoice_no', 'VARCHAR(50) NULL'],
    ['ci_invoice_date', 'DATE NULL'],
    ['terms_conditions', 'TEXT NULL'],
    ['container_goods_description', 'TEXT NULL'],
    ['account_name', 'VARCHAR(255) NULL'],
    ['bank_name', 'VARCHAR(255) NULL'],
    ['account_no', 'VARCHAR(50) NULL'],
    ['swift_code', 'VARCHAR(20) NULL'],
    ['branch', 'VARCHAR(255) NULL'],
    ['bc_declaration_1', 'TEXT NULL'],
    ['bc_declaration_2', 'TEXT NULL'],
    ['bc_declaration_3', 'TEXT NULL'],
    ['bc_issued_by', 'VARCHAR(255) NULL'],
    ['version', 'INT NOT NULL DEFAULT 1'],
    ['per_fcl_packages', 'INT NULL']
]);

const PI_COLUMNS = Object.freeze([
    ['country_of_origin', 'VARCHAR(100) NULL'],
    ['country_of_discharge', 'VARCHAR(100) NULL'],
    ['port_of_loading', 'VARCHAR(255) NULL'],
    ['port_of_discharge', 'VARCHAR(255) NULL'],
    ['gross_weight', 'DECIMAL(10,3) NULL'],
    ['tare_weight', 'DECIMAL(10,3) NULL'],
    ['net_weight', 'DECIMAL(10,3) NULL'],
    ['lot_no', 'VARCHAR(100) NULL'],
    ['bag_no', 'VARCHAR(100) NULL'],
    ['no_kind_of_packages', 'VARCHAR(255) NULL']
]);

function identifier(value) {
    if (!/^[A-Za-z0-9_]+$/.test(value)) {
        throw new Error(`Unsafe schema identifier: ${value}`);
    }
    return `\`${value}\``;
}

async function tableExists(connection, tableName) {
    const [rows] = await connection.query(
        `SELECT 1 FROM information_schema.tables
         WHERE table_schema = DATABASE() AND table_name = ?`,
        [tableName]
    );
    return rows.length > 0;
}

async function columnExists(connection, tableName, columnName) {
    const [rows] = await connection.query(
        `SELECT 1 FROM information_schema.columns
         WHERE table_schema = DATABASE()
           AND table_name = ?
           AND column_name = ?`,
        [tableName, columnName]
    );
    return rows.length > 0;
}

async function addMissingColumns(connection, tableName, definitions, logger = console) {
    for (const [columnName, definition] of definitions) {
        if (await columnExists(connection, tableName, columnName)) continue;
        await connection.query(
            `ALTER TABLE ${identifier(tableName)} ADD COLUMN ${identifier(columnName)} ${definition}`
        );
        logger.log(`✓ Added ${tableName}.${columnName}.`);
    }
}

async function createMissingTable(connection, tableName, ddl, logger = console) {
    if (await tableExists(connection, tableName)) return;
    await connection.query(ddl);
    logger.log(`✓ Created ${tableName}.`);
}

async function reconcileCurrentSchema(connection, logger = console) {
    await addMissingColumns(connection, 'masters', MASTER_COLUMNS, logger);

    if (await columnExists(connection, 'masters', 'client_id')) {
        const [rows] = await connection.query(
            `SELECT is_nullable AS is_nullable
             FROM information_schema.columns
             WHERE table_schema = DATABASE()
               AND table_name = 'masters' AND column_name = 'client_id'`
        );
        if (String(rows[0]?.is_nullable || rows[0]?.IS_NULLABLE).toUpperCase() === 'NO') {
            await connection.query(
                'ALTER TABLE `masters` MODIFY COLUMN `client_id` INT NULL'
            );
            logger.log('✓ Widened masters.client_id to nullable.');
        }
    }

    await addMissingColumns(connection, 'proforma_invoices', PI_COLUMNS, logger);

    await createMissingTable(connection, 'master_sequences', `
        CREATE TABLE \`master_sequences\` (
            id INT AUTO_INCREMENT PRIMARY KEY,
            company_id INT NOT NULL,
            financial_year VARCHAR(10) NOT NULL,
            last_number INT NOT NULL DEFAULT 0,
            UNIQUE KEY unique_master_sequence (company_id, financial_year),
            FOREIGN KEY (company_id) REFERENCES companies(id)
        )`, logger);

    await createMissingTable(connection, 'weighbridges', `
        CREATE TABLE \`weighbridges\` (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            address TEXT,
            registration_no VARCHAR(100),
            contact VARCHAR(100),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`, logger);
}

module.exports = {
    MASTER_COLUMNS,
    PI_COLUMNS,
    reconcileCurrentSchema
};
