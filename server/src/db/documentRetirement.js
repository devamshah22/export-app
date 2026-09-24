const UNSUPPORTED_DOCUMENT_TYPES = Object.freeze([
    'CL_COURIER',
    'BANK_STICKER'
]);

const CURRENT_ORDER_DOCUMENT_TYPES = Object.freeze([
    'BL_DRAFT', 'CI', 'PL', 'COA', 'CCVO', 'BC',
    'MFG_CERTI', 'SCOMET', 'FORM_SDF', 'EUC',
    'ANNEXURE_A', 'ANNEXURE_C', 'DGD', 'VGM'
]);

function buildOrderDocumentEnumMigration() {
    const enumValues = CURRENT_ORDER_DOCUMENT_TYPES.map(value => `'${value}'`).join(', ');
    return {
        sql: `ALTER TABLE \`order_documents\` MODIFY COLUMN \`document_type\` ENUM(${enumValues}) NOT NULL`,
        values: []
    };
}

function buildUnsupportedDocumentCleanupQueries() {
    const placeholders = UNSUPPORTED_DOCUMENT_TYPES.map(() => '?').join(', ');
    return [
        {
            table: 'order_documents',
            sql: `DELETE FROM order_documents WHERE document_type IN (${placeholders})`,
            values: [...UNSUPPORTED_DOCUMENT_TYPES]
        },
        {
            table: 'document_overrides',
            sql: `DELETE FROM document_overrides WHERE document_type IN (${placeholders})`,
            values: [...UNSUPPORTED_DOCUMENT_TYPES]
        }
    ];
}

async function retireUnsupportedDocuments(connection, logger = console) {
    for (const query of buildUnsupportedDocumentCleanupQueries()) {
        const [result] = await connection.query(query.sql, query.values);
        if (result.affectedRows > 0) {
            logger.log(`✓ Removed ${result.affectedRows} retired ${query.table} row(s).`);
        }
    }

    const enumMigration = buildOrderDocumentEnumMigration();
    await connection.query(enumMigration.sql, enumMigration.values);
    logger.log('✓ Narrowed order_documents.document_type ENUM.');
}

module.exports = {
    CURRENT_ORDER_DOCUMENT_TYPES,
    UNSUPPORTED_DOCUMENT_TYPES,
    buildOrderDocumentEnumMigration,
    buildUnsupportedDocumentCleanupQueries,
    retireUnsupportedDocuments
};
