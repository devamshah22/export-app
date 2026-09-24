import React from 'react';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import MasterFormPage from './MasterFormPage';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useParams } from 'react-router-dom';
import { clientsAPI, companiesAPI, mastersAPI } from '../services/api';

jest.setTimeout(30000);

jest.mock('../context/AuthContext', () => ({
    useAuth: jest.fn()
}));

jest.mock('react-router-dom', () => {
    const actual = jest.requireActual('react-router-dom');
    return {
        ...actual,
        useNavigate: jest.fn(),
        useParams: jest.fn()
    };
});

jest.mock('../services/api', () => ({
    clientsAPI: {
        getAll: jest.fn()
    },
    companiesAPI: {
        getAll: jest.fn(),
        getBankAccounts: jest.fn(),
        getWeighbridges: jest.fn()
    },
    mastersAPI: {
        getById: jest.fn(),
        update: jest.fn(),
        createBlank: jest.fn(),
        deleteContainer: jest.fn(),
        addContainer: jest.fn(),
        updateContainer: jest.fn(),
        setDocuments: jest.fn(),
        documentSave: jest.fn(),
        generatePDF: jest.fn()
    }
}));

jest.mock('../components/DocumentSidebar', () => function MockDocumentSidebar() {
    return <div data-testid="document-sidebar" />;
});

jest.mock('../components/ContainerDialog', () => function MockContainerDialog({
    open,
    onSave,
    onClose,
    container,
    conflictDraft
}) {
    if (!open) return null;
    return (
        <div data-testid="container-dialog">
            <span data-testid="container-id">{container?.id || ''}</span>
            <span data-testid="container-name">{container?.container_no || ''}</span>
            <span data-testid="container-conflict">
                {conflictDraft ? JSON.stringify(conflictDraft.data) : ''}
            </span>
            <button onClick={() => onSave({ container_no: 'LOCAL-CONTAINER', products: [] })}>
                Save test container
            </button>
            <button onClick={onClose}>Cancel test container</button>
        </div>
    );
});

jest.mock('../components/documents/PIDocForm', () => function MockPIDocForm({ onSave, conflictDraft }) {
    return (
        <div data-testid="pi-form">
            <span data-testid="document-conflict">
                {conflictDraft ? JSON.stringify(conflictDraft.saveParts) : ''}
            </span>
            <button onClick={() => void onSave({
                fields: { invoice_no: 'LOCAL-DOCUMENT' },
                overrides: { delivery_date: '2026-01-01' }
            }).catch(() => {})}>
                Save test document
            </button>
        </div>
    );
});

jest.mock('../components/documents/CIDocForm', () => function MockCIDocForm() {
    return <div data-testid="document-form" />;
});
jest.mock('../components/documents/PLDocForm', () => function MockPLDocForm() {
    return <div data-testid="document-form" />;
});
jest.mock('../components/documents/COADocForm', () => function MockCOADocForm({ onSave, conflictDraft }) {
    const saveParts = conflictDraft?.saveParts || {
        fields: { invoice_no: 'LOCAL-COA-INVOICE' },
        overrides: { certificate_note: 'LOCAL-COA' },
        coa_tests: [{ test_name: 'Purity', result: '99.9' }]
    };
    return (
        <div data-testid="document-form">
            <span data-testid="coa-conflict">{JSON.stringify(conflictDraft?.saveParts || '')}</span>
            <button onClick={() => void onSave(saveParts).catch(() => {})}>Save test COA</button>
        </div>
    );
});
jest.mock('../components/documents/CCVODocForm', () => function MockCCVODocForm() {
    return <div data-testid="document-form" />;
});
jest.mock('../components/documents/BCDocForm', () => function MockBCDocForm() {
    return <div data-testid="document-form" />;
});
jest.mock('../components/documents/MFGDocForm', () => function MockMFGDocForm() {
    return <div data-testid="document-form" />;
});
jest.mock('../components/documents/SCOMETDocForm', () => function MockSCOMETDocForm() {
    return <div data-testid="document-form" />;
});
jest.mock('../components/documents/FormSDFDocForm', () => function MockFormSDFDocForm() {
    return <div data-testid="document-form" />;
});
jest.mock('../components/documents/EUCDocForm', () => function MockEUCDocForm() {
    return <div data-testid="document-form" />;
});
jest.mock('../components/documents/AnnexureADocForm', () => function MockAnnexureADocForm() {
    return <div data-testid="document-form" />;
});
jest.mock('../components/documents/AnnexureCDocForm', () => function MockAnnexureCDocForm() {
    return <div data-testid="document-form" />;
});
jest.mock('../components/documents/DGDDocForm', () => function MockDGDDocForm() {
    return <div data-testid="document-form" />;
});
jest.mock('../components/documents/VGMDocForm', () => function MockVGMDocForm({ onSave, conflictDraft }) {
    const saveParts = conflictDraft?.saveParts || {
        fields: { verified_gross_mass: '25000' },
        overrides: { authorized_official: 'LOCAL-OFFICIAL' },
        coa_tests: undefined,
        container: { id: 9, weighing_slip_no: 'LOCAL-SLIP' }
    };
    return (
        <div data-testid="document-form">
            <span data-testid="vgm-conflict">{JSON.stringify(conflictDraft?.saveParts || '')}</span>
            <button onClick={() => void onSave(saveParts).catch(() => {})}>Save test VGM</button>
        </div>
    );
});
jest.mock('../components/documents/BLDraftDocForm', () => function MockBLDraftDocForm() {
    return <div data-testid="document-form" />;
});
jest.mock('../components/documents/GenericDocForm', () => function MockGenericDocForm() {
    return <div data-testid="document-form" />;
});

const baseMaster = {
    id: 42,
    company_id: 7,
    client_id: 11,
    version: 1,
    master_number: 3,
    master_financial_year: '2026-27',
    invoice_no: 'SERVER-INVOICE',
    invoice_date: null,
    currency: 'USD',
    status: 'draft',
    containers: [],
    documents: [],
    overrides: {}
};

let routeParams;
let navigate;

function conflictResponse(master) {
    const error = new Error('stale Master');
    error.response = {
        status: 409,
        data: {
            error: 'This Master was changed by another user.',
            master
        }
    };
    return error;
}

function renderPage(params = { id: '42' }) {
    routeParams = params;
    return render(<MasterFormPage />);
}

beforeEach(() => {
    jest.clearAllMocks();
    routeParams = { id: '42' };
    navigate = jest.fn();
    useParams.mockImplementation(() => routeParams);
    useNavigate.mockReturnValue(navigate);
    useAuth.mockReturnValue({ selectedCompany: { id: 7 } });

    mastersAPI.getById.mockResolvedValue({ data: { ...baseMaster } });
    mastersAPI.update.mockResolvedValue({ data: { ...baseMaster, version: 2 } });
    mastersAPI.addContainer.mockResolvedValue({ data: { ...baseMaster, version: 2 } });
    mastersAPI.updateContainer.mockResolvedValue({ data: { ...baseMaster, version: 2 } });
    mastersAPI.deleteContainer.mockResolvedValue({ data: { ...baseMaster, version: 2 } });
    mastersAPI.documentSave.mockResolvedValue({ data: { ...baseMaster, version: 2 } });
    companiesAPI.getBankAccounts.mockResolvedValue({ data: [] });
    companiesAPI.getAll.mockResolvedValue({ data: [] });
    companiesAPI.getWeighbridges.mockResolvedValue({ data: [] });
    clientsAPI.getAll.mockResolvedValue({ data: [] });
    window.alert = jest.fn();
    window.confirm = jest.fn(() => true);
});

test('sends root update with loaded Master version and restores stale root draft', async () => {
    const latest = { ...baseMaster, version: 2, invoice_no: 'SERVER-LATEST' };
    mastersAPI.update
        .mockRejectedValueOnce(conflictResponse(latest))
        .mockResolvedValueOnce({ data: { ...latest, version: 3, invoice_no: 'LOCAL-INVOICE' } });

    renderPage();
    await screen.findByDisplayValue('SERVER-INVOICE');
    const invoice = screen.getByDisplayValue('SERVER-INVOICE');
    fireEvent.change(invoice, { target: { value: 'LOCAL-INVOICE' } });
    expect(invoice).toHaveValue('LOCAL-INVOICE');
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => expect(mastersAPI.update).toHaveBeenCalledTimes(1));
    expect(mastersAPI.update.mock.calls[0][1].version).toBe(1);
    expect(mastersAPI.update.mock.calls[0][1].invoice_no).toBe('LOCAL-INVOICE');
    expect(await screen.findByDisplayValue('SERVER-LATEST')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveClass('MuiAlert-colorWarning');
    const restore = screen.getByRole('button', { name: /Restore unsaved edits/i });
    expect(restore).toBeInTheDocument();

    fireEvent.click(restore);
    expect(screen.getByLabelText('PI Invoice No.')).toHaveValue('LOCAL-INVOICE');
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(mastersAPI.update).toHaveBeenCalledTimes(2);
    expect(mastersAPI.update.mock.calls[1][1]).toMatchObject({
        version: 2,
        invoice_no: 'LOCAL-INVOICE'
    });
    expect(screen.queryByRole('button', { name: /Restore unsaved edits/i })).not.toBeInTheDocument();
});

test('restores a new-container conflict and retries add with canonical version', async () => {
    const latest = { ...baseMaster, version: 2, containers: [] };
    mastersAPI.addContainer
        .mockRejectedValueOnce(conflictResponse(latest))
        .mockResolvedValueOnce({ data: { ...latest, version: 3 } });

    renderPage();
    await screen.findByText('No containers added yet. Click "Add Container" to begin.');
    fireEvent.click(screen.getByRole('button', { name: /Add Container/i }));
    fireEvent.click(screen.getByRole('button', { name: 'Save test container' }));

    await waitFor(() => expect(mastersAPI.addContainer).toHaveBeenCalledTimes(1));
    expect(mastersAPI.addContainer.mock.calls[0][1]).toMatchObject({ version: 1 });
    fireEvent.click(screen.getByRole('button', { name: /Restore unsaved edits/i }));

    expect(screen.getByTestId('container-id')).toHaveTextContent('');
    expect(screen.getByTestId('container-name')).toHaveTextContent('');
    fireEvent.click(screen.getByRole('button', { name: 'Save test container' }));

    await waitFor(() => expect(mastersAPI.addContainer).toHaveBeenCalledTimes(2));
    expect(mastersAPI.addContainer.mock.calls[1]).toEqual([
        '42',
        expect.objectContaining({ version: 2, container_no: 'LOCAL-CONTAINER' })
    ]);
    expect(mastersAPI.updateContainer).not.toHaveBeenCalled();
});

test('preserves container delete intent and retries with canonical version', async () => {
    const initial = {
        ...baseMaster,
        containers: [{ id: 9, container_no: 'DELETE-ME', products: [] }]
    };
    const latest = {
        ...initial,
        version: 2,
        containers: [{ id: 9, container_no: 'DELETE-ME', products: [] }]
    };
    const deleted = { ...latest, version: 3, containers: [] };
    mastersAPI.getById.mockResolvedValue({ data: initial });
    mastersAPI.deleteContainer
        .mockRejectedValueOnce(conflictResponse(latest))
        .mockResolvedValueOnce({ data: deleted });

    renderPage();
    await screen.findByText('DELETE-ME');
    const row = screen.getByText('DELETE-ME').closest('tr');
    fireEvent.click(within(row).getAllByRole('button')[1]);

    await waitFor(() => expect(mastersAPI.deleteContainer).toHaveBeenCalledTimes(1));
    expect(mastersAPI.deleteContainer.mock.calls[0]).toEqual(['42', 9, 1]);
    expect(screen.getByRole('alert')).toHaveClass('MuiAlert-colorWarning');
    const retry = screen.getByRole('button', { name: /Retry delete container/i });
    expect(retry).toBeInTheDocument();

    fireEvent.click(retry);
    await waitFor(() => expect(mastersAPI.deleteContainer).toHaveBeenCalledTimes(2));
    expect(mastersAPI.deleteContainer.mock.calls[1]).toEqual(['42', 9, 2]);
    expect(await screen.findByText('No containers added yet. Click "Add Container" to begin.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Retry delete container/i })).not.toBeInTheDocument();
});

test('canceling a restored container conflict prevents draft reuse on new add', async () => {
    const latest = { ...baseMaster, version: 2, containers: [] };
    mastersAPI.addContainer.mockRejectedValueOnce(conflictResponse(latest));

    renderPage();
    await screen.findByText('No containers added yet. Click "Add Container" to begin.');
    fireEvent.click(screen.getByRole('button', { name: /Add Container/i }));
    fireEvent.click(screen.getByRole('button', { name: 'Save test container' }));
    await waitFor(() => expect(mastersAPI.addContainer).toHaveBeenCalledTimes(1));

    fireEvent.click(screen.getByRole('button', { name: /Restore unsaved edits/i }));
    expect(screen.getByTestId('container-conflict')).toHaveTextContent('LOCAL-CONTAINER');
    fireEvent.click(screen.getByRole('button', { name: 'Cancel test container' }));
    fireEvent.click(screen.getByRole('button', { name: /Add Container/i }));

    expect(screen.getByTestId('container-id')).toHaveTextContent('');
    expect(screen.getByTestId('container-name')).toHaveTextContent('');
    expect(screen.getByTestId('container-conflict')).toHaveTextContent('');
});

test('discarding root conflict removes stale restore action and draft', async () => {
    const latest = { ...baseMaster, version: 2, invoice_no: 'SERVER-LATEST' };
    mastersAPI.update.mockRejectedValueOnce(conflictResponse(latest));

    renderPage();
    await screen.findByDisplayValue('SERVER-INVOICE');
    fireEvent.change(screen.getByDisplayValue('SERVER-INVOICE'), { target: { value: 'LOCAL-INVOICE' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(screen.getByRole('alert')).toHaveClass('MuiAlert-colorWarning'));

    fireEvent.click(screen.getByRole('button', { name: /Discard unsaved edits/i }));
    expect(screen.queryByRole('button', { name: /Restore unsaved edits/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Discard unsaved edits/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.getByLabelText('PI Invoice No.')).toHaveValue('SERVER-LATEST');
});

test('document conflict action is hidden after navigating to another document', async () => {
    const latest = { ...baseMaster, version: 2, invoice_no: 'SERVER-PI' };
    mastersAPI.documentSave.mockRejectedValueOnce(conflictResponse(latest));

    const view = renderPage({ id: '42', docType: 'PI' });
    fireEvent.click(await screen.findByRole('button', { name: 'Save test document' }));
    await waitFor(() => expect(screen.getByRole('button', { name: /Restore unsaved edits/i })).toBeInTheDocument());

    routeParams = { id: '42', docType: 'COA' };
    view.rerender(<MasterFormPage />);
    await waitFor(() => {
        expect(screen.queryByRole('button', { name: /Restore unsaved edits/i })).not.toBeInTheDocument();
    });
});

test('successful container retry clears stale conflict message', async () => {
    const initial = { ...baseMaster, containers: [{ id: 9, container_no: 'SERVER-OLD', products: [] }] };
    const latest = { ...initial, version: 2, containers: [{ id: 9, container_no: 'SERVER-NEW', products: [] }] };
    mastersAPI.getById.mockResolvedValue({ data: initial });
    mastersAPI.updateContainer
        .mockRejectedValueOnce(conflictResponse(latest))
        .mockResolvedValueOnce({ data: { ...latest, version: 3 } });

    renderPage();
    await screen.findByText('SERVER-OLD');
    fireEvent.click(within(screen.getByText('SERVER-OLD').closest('tr')).getAllByRole('button')[0]);
    fireEvent.click(screen.getByRole('button', { name: 'Save test container' }));
    await waitFor(() => expect(mastersAPI.updateContainer).toHaveBeenCalledTimes(1));
    fireEvent.click(screen.getByRole('button', { name: /Restore unsaved edits/i }));
    fireEvent.click(screen.getByRole('button', { name: 'Save test container' }));

    await waitFor(() => expect(mastersAPI.updateContainer).toHaveBeenCalledTimes(2));
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
});

test('restores an existing container conflict over latest canonical container', async () => {
    const initial = {
        ...baseMaster,
        containers: [{ id: 9, container_no: 'SERVER-OLD', products: [] }]
    };
    const latest = {
        ...initial,
        version: 2,
        containers: [{ id: 9, container_no: 'SERVER-NEW', products: [] }]
    };
    mastersAPI.getById.mockResolvedValue({ data: initial });
    mastersAPI.updateContainer
        .mockRejectedValueOnce(conflictResponse(latest))
        .mockResolvedValueOnce({ data: { ...latest, version: 3 } });

    renderPage();
    await screen.findByText('SERVER-OLD');
    const row = screen.getByText('SERVER-OLD').closest('tr');
    fireEvent.click(within(row).getAllByRole('button')[0]);
    fireEvent.click(screen.getByRole('button', { name: 'Save test container' }));

    await waitFor(() => expect(mastersAPI.updateContainer).toHaveBeenCalledTimes(1));
    expect(screen.getByRole('alert')).toHaveClass('MuiAlert-colorWarning');
    fireEvent.click(screen.getByRole('button', { name: /Restore unsaved edits/i }));

    expect(screen.getByTestId('container-id')).toHaveTextContent('9');
    expect(screen.getByTestId('container-name')).toHaveTextContent('LOCAL-CONTAINER');
    fireEvent.click(screen.getByRole('button', { name: 'Save test container' }));

    await waitFor(() => expect(mastersAPI.updateContainer).toHaveBeenCalledTimes(2));
    expect(mastersAPI.updateContainer.mock.calls[1]).toEqual([
        '42',
        9,
        expect.objectContaining({ version: 2, container_no: 'LOCAL-CONTAINER' })
    ]);
});

test('preserves multipart COA conflict data and retries with latest version', async () => {
    const latest = { ...baseMaster, version: 2, invoice_no: 'SERVER-COA' };
    mastersAPI.documentSave
        .mockRejectedValueOnce(conflictResponse(latest))
        .mockResolvedValueOnce({ data: { ...latest, version: 3 } });

    renderPage({ id: '42', docType: 'COA' });
    fireEvent.click(await screen.findByRole('button', { name: 'Save test COA' }));

    await waitFor(() => expect(mastersAPI.documentSave).toHaveBeenCalledTimes(1));
    expect(mastersAPI.documentSave.mock.calls[0][2]).toMatchObject({
        version: 1,
        fields: { invoice_no: 'LOCAL-COA-INVOICE' },
        overrides: { certificate_note: 'LOCAL-COA' },
        coa_tests: [{ test_name: 'Purity', result: '99.9' }]
    });
    expect(await screen.findByTestId('coa-conflict')).toHaveTextContent('LOCAL-COA');
    fireEvent.click(screen.getByRole('button', { name: /Restore unsaved edits/i }));
    fireEvent.click(screen.getByRole('button', { name: 'Save test COA' }));

    await waitFor(() => expect(mastersAPI.documentSave).toHaveBeenCalledTimes(2));
    expect(mastersAPI.documentSave.mock.calls[1][2]).toMatchObject({
        version: 2,
        fields: { invoice_no: 'LOCAL-COA-INVOICE' },
        overrides: { certificate_note: 'LOCAL-COA' },
        coa_tests: [{ test_name: 'Purity', result: '99.9' }]
    });
});

test('preserves multipart VGM conflict data and retries with latest version', async () => {
    const initial = {
        ...baseMaster,
        containers: [{ id: 9, container_no: 'CONT-009', products: [] }]
    };
    const latest = { ...initial, version: 2 };
    mastersAPI.getById.mockResolvedValue({ data: initial });
    mastersAPI.documentSave
        .mockRejectedValueOnce(conflictResponse(latest))
        .mockResolvedValueOnce({ data: { ...latest, version: 3 } });

    renderPage({ id: '42', docType: 'VGM' });
    fireEvent.click(await screen.findByRole('button', { name: 'Save test VGM' }));

    await waitFor(() => expect(mastersAPI.documentSave).toHaveBeenCalledTimes(1));
    expect(mastersAPI.documentSave.mock.calls[0][2]).toMatchObject({
        version: 1,
        overrides: { authorized_official: 'LOCAL-OFFICIAL' },
        container: { id: 9, weighing_slip_no: 'LOCAL-SLIP' }
    });
    expect(await screen.findByTestId('vgm-conflict')).toHaveTextContent('LOCAL-SLIP');
    fireEvent.click(screen.getByRole('button', { name: /Restore unsaved edits/i }));
    fireEvent.click(screen.getByRole('button', { name: 'Save test VGM' }));

    await waitFor(() => expect(mastersAPI.documentSave).toHaveBeenCalledTimes(2));
    expect(mastersAPI.documentSave.mock.calls[1][2]).toMatchObject({
        version: 2,
        overrides: { authorized_official: 'LOCAL-OFFICIAL' },
        container: { id: 9, weighing_slip_no: 'LOCAL-SLIP' }
    });
});

test('preserves document conflict draft and retries document save with latest version', async () => {
    const latest = { ...baseMaster, version: 2, invoice_no: 'SERVER-DOCUMENT' };
    mastersAPI.documentSave
        .mockRejectedValueOnce(conflictResponse(latest))
        .mockResolvedValueOnce({ data: { ...latest, version: 3, invoice_no: 'LOCAL-DOCUMENT' } });

    renderPage({ id: '42', docType: 'PI' });
    fireEvent.click(await screen.findByRole('button', { name: 'Save test document' }));

    await waitFor(() => expect(mastersAPI.documentSave).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(screen.getByRole('alert')).toHaveClass('MuiAlert-colorWarning'));
    expect(screen.getByTestId('document-conflict')).toHaveTextContent('LOCAL-DOCUMENT');
    fireEvent.click(screen.getByRole('button', { name: /Restore unsaved edits/i }));
    fireEvent.click(screen.getByRole('button', { name: 'Save test document' }));

    await waitFor(() => expect(mastersAPI.documentSave).toHaveBeenCalledTimes(2));
    expect(mastersAPI.documentSave.mock.calls[1][2]).toMatchObject({
        version: 2,
        fields: { invoice_no: 'LOCAL-DOCUMENT' }
    });
});

test('suppresses duplicate document saves while first request is pending', async () => {
    let resolveSave;
    mastersAPI.documentSave.mockImplementation(() => new Promise(resolve => {
        resolveSave = resolve;
    }));

    renderPage({ id: '42', docType: 'PI' });
    const save = await screen.findByRole('button', { name: 'Save test document' });
    fireEvent.click(save);
    fireEvent.click(save);

    await waitFor(() => expect(mastersAPI.documentSave).toHaveBeenCalledTimes(1));
    resolveSave({ data: { ...baseMaster, version: 2 } });
});
