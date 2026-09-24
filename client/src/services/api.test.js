import { mastersAPI } from './api';

jest.mock('axios', () => {
    const post = jest.fn(() => Promise.resolve({ data: {} }));
    const instance = {
        post,
        get: jest.fn(),
        put: jest.fn(),
        delete: jest.fn(),
        interceptors: { request: { use: jest.fn() }, response: { use: jest.fn() } }
    };
    const create = jest.fn(() => instance);
    return { __esModule: true, default: { create }, __instance: instance };
});

test('documentSave sends explicit current Master version', async () => {
    await mastersAPI.documentSave(12, 'PI', { fields: { invoice_no: 'PI-1' } }, 9);

    const axios = require('axios');
    expect(axios.__instance.post).toHaveBeenCalledWith(
        '/masters/12/document-save',
        { fields: { invoice_no: 'PI-1' }, document_type: 'PI', version: 9 }
    );
});

test('documentSave preserves version supplied in data for compatibility', async () => {
    await mastersAPI.documentSave(12, 'PI', { version: 8, overrides: { ref: 'A' } });

    const axios = require('axios');
    expect(axios.__instance.post).toHaveBeenCalledWith(
        '/masters/12/document-save',
        { version: 8, overrides: { ref: 'A' }, document_type: 'PI' }
    );
});

test('Master mutation APIs preserve version request contracts', async () => {
    const axios = require('axios');
    const instance = axios.__instance;

    await mastersAPI.update(12, { version: 4, invoice_no: 'PI-4' });
    expect(instance.put).toHaveBeenCalledWith(
        '/masters/12',
        { version: 4, invoice_no: 'PI-4' }
    );

    await mastersAPI.delete(12, 5);
    expect(instance.delete).toHaveBeenCalledWith(
        '/masters/12',
        { data: { version: 5 } }
    );

    await mastersAPI.deleteContainer(12, 8, 6);
    expect(instance.delete).toHaveBeenCalledWith(
        '/masters/12/containers/8',
        { data: { version: 6 } }
    );

    await mastersAPI.setDocuments(12, ['CI', 'VGM'], 7);
    expect(instance.post).toHaveBeenCalledWith(
        '/masters/12/documents',
        { document_types: ['CI', 'VGM'], version: 7 }
    );
});
