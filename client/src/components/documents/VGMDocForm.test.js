import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import VGMDocForm from './VGMDocForm';

jest.mock('../../services/api', () => ({
    mastersAPI: {
        generatePDF: jest.fn()
    }
}));

const latestContainer = {
    id: 10,
    container_no: 'CURRENT-CONTAINER',
    container_size: '40"',
    max_permissible_weight: 32500,
    products: []
};

const baseData = {
    version: 2,
    containers: [latestContainer],
    overrides: {}
};

beforeEach(() => {
    window.alert = jest.fn();
});

test('marks conflict draft target missing without selecting or submitting deleted container', async () => {
    const onSave = jest.fn();
    render(
        <VGMDocForm
            data={baseData}
            onSave={onSave}
            masterId="42"
            conflictDraft={{
                type: 'document',
                document: 'VGM',
                saveParts: {
                    container: { id: 9, weighing_slip_no: 'STALE-SLIP' },
                    overrides: { authorized_official: 'LOCAL-OFFICIAL' }
                }
            }}
        />
    );

    expect(await screen.findByText(/attempted container.*no longer exists/i)).toBeInTheDocument();
    expect(screen.getByRole('combobox')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    expect(onSave).not.toHaveBeenCalled();
    expect(window.alert).toHaveBeenCalledWith('No container selected.');
});

test('submits replacement VGM container after deleted conflict target is replaced', async () => {
    const onSave = jest.fn().mockResolvedValue(undefined);
    render(
        <VGMDocForm
            data={baseData}
            onSave={onSave}
            masterId="42"
            conflictDraft={{
                type: 'document',
                document: 'VGM',
                saveParts: {
                    container: { id: 9, weighing_slip_no: 'STALE-SLIP' },
                    overrides: { authorized_official: 'LOCAL-OFFICIAL' }
                }
            }}
        />
    );

    const containerSelect = await screen.findByRole('combobox');
    fireEvent.mouseDown(containerSelect);
    fireEvent.click(await screen.findByRole('option', { name: /CURRENT-CONTAINER/ }));
    await waitFor(() => expect(containerSelect).toHaveTextContent(/CURRENT-CONTAINER/));
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => expect(onSave).toHaveBeenCalledWith(expect.objectContaining({
        container: expect.objectContaining({ id: 10 })
    })));
    expect(onSave.mock.calls[0][0].container.id).not.toBe(9);
    expect(window.alert).not.toHaveBeenCalledWith('VGM saved!');
});

test('shows deleted VGM target even when no containers remain', async () => {
    const onSave = jest.fn();
    render(<VGMDocForm
        data={{ ...baseData, containers: [] }} onSave={onSave} masterId="42"
        conflictDraft={{ type: 'document', document: 'VGM', saveParts: {
            container: { id: 9, weighing_slip_no: 'STALE-SLIP' }
        } }}
    />);

    expect(await screen.findByText(/attempted container.*no longer exists/i)).toBeInTheDocument();
    expect(screen.getByText(/add containers in the Master form first/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(onSave).not.toHaveBeenCalled();
});

test('does not silently select a different container when the selected VGM container disappears', async () => {
    const onSave = jest.fn();
    const view = render(<VGMDocForm data={baseData} onSave={onSave} masterId="42" />);
    await waitFor(() => expect(screen.getByRole('combobox', { name: 'Container' })).toHaveTextContent('CURRENT-CONTAINER'));

    view.rerender(<VGMDocForm data={{ ...baseData, containers: [{ ...latestContainer, id: 11, container_no: 'REPLACEMENT' }] }} onSave={onSave} masterId="42" />);
    expect(await screen.findByText(/selected container.*no longer exists/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(onSave).not.toHaveBeenCalled();

    fireEvent.mouseDown(screen.getByRole('combobox', { name: 'Container' }));
    fireEvent.click(await screen.findByRole('option', { name: /REPLACEMENT/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(onSave).toHaveBeenCalledWith(expect.objectContaining({
        container: expect.objectContaining({ id: 11 })
    })));
});
