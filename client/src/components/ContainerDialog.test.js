import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import ContainerDialog from './ContainerDialog';

jest.mock('./SearchableDropdown', () => function MockSearchableDropdown({ label, value, onChange }) {
    return (
        <div>
            <span data-testid="weighbridge-value">{value || ''}</span>
            <button onClick={() => onChange({ id: 17, name: 'Test Weighbridge' })}>
                {label}
            </button>
        </div>
    );
});

const masterData = {
    ci_invoice_date: '2026-09-18',
    product_name: 'Master Product',
    hs_code: '1234'
};

const baseContainer = {
    id: 9,
    container_no: 'CONT-009',
    truck_no: 'TRUCK-009',
    weighbridge_id: 17,
    weighbridge_name: 'Test Weighbridge',
    products: [{
        product_name: 'Container Product',
        num_packages: 8,
        net_weight: 12
    }]
};

function renderDialog(props = {}) {
    return render(
        <ContainerDialog
            open
            onClose={jest.fn()}
            onSave={jest.fn()}
            container={baseContainer}
            masterData={masterData}
            weighbridges={[{ id: 17, name: 'Test Weighbridge' }]}
            {...props}
        />
    );
}

test('hydrates weighbridge selection and container products when editing', async () => {
    renderDialog();

    expect(await screen.findByTestId('weighbridge-value')).toHaveTextContent('17');
    expect(screen.getByDisplayValue('Container Product')).toBeInTheDocument();
    expect(screen.getByRole('spinbutton', { name: 'Package Count' })).toHaveValue(8);
});

test('two products remain two product rows with independent package counts', async () => {
    const onSave = jest.fn();
    renderDialog({ container: null, onSave });

    const firstPackageCount = await screen.findByRole('spinbutton', { name: 'Package Count' });
    fireEvent.change(firstPackageCount, { target: { value: '24' } });
    fireEvent.click(screen.getByRole('button', { name: /Add Product/i }));
    expect(screen.getByText('Products in this Container (2)')).toBeInTheDocument();
    const packageCounts = screen.getAllByRole('spinbutton', { name: 'Package Count' });
    expect(packageCounts).toHaveLength(2);
    fireEvent.change(packageCounts[1], { target: { value: '36' } });
    fireEvent.click(screen.getByRole('button', { name: 'Add Container' }));

    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({
        products: [
            expect.objectContaining({ num_packages: 24 }),
            expect.objectContaining({ num_packages: 36 })
        ]
    }));
});

test('does not silently truncate fractional package counts on save', async () => {
    const onSave = jest.fn();
    const alert = jest.spyOn(window, 'alert').mockImplementation(() => {});
    renderDialog({ container: null, onSave });

    fireEvent.change(await screen.findByRole('spinbutton', { name: 'Package Count' }), {
        target: { value: '2.5' }
    });
    fireEvent.click(screen.getByRole('button', { name: 'Add Container' }));

    expect(onSave).not.toHaveBeenCalled();
    expect(alert).toHaveBeenCalledWith('Package Count must be a non-negative whole number.');
    alert.mockRestore();
});

test('rehydrates transient weighbridge ID from persisted name', async () => {
    renderDialog({
        container: {
            ...baseContainer,
            weighbridge_id: undefined,
            weighbridge_name: 'Test Weighbridge'
        }
    });

    expect(await screen.findByTestId('weighbridge-value')).toHaveTextContent('17');
});

test('rehydrates weighbridge ID when options load after container data', async () => {
    const container = { ...baseContainer, weighbridge_id: undefined };
    const { rerender } = renderDialog({ container, weighbridges: [] });

    expect(await screen.findByTestId('weighbridge-value')).toBeEmptyDOMElement();
    rerender(
        <ContainerDialog
            open
            onClose={jest.fn()}
            onSave={jest.fn()}
            container={{ ...baseContainer, weighbridge_id: undefined }}
            masterData={masterData}
            weighbridges={[{ id: 17, name: 'Test Weighbridge' }]}
        />
    );

    await waitFor(() => {
        expect(screen.getByTestId('weighbridge-value')).toHaveTextContent('17');
    });
});

test('does not guess when persisted weighbridge name is ambiguous', async () => {
    renderDialog({
        container: {
            ...baseContainer,
            weighbridge_id: undefined,
            weighbridge_name: 'Duplicate Weighbridge'
        },
        weighbridges: [
            { id: 17, name: 'Duplicate Weighbridge' },
            { id: 18, name: 'Duplicate Weighbridge' }
        ]
    });

    expect(await screen.findByTestId('weighbridge-value')).toBeEmptyDOMElement();
});

test('saves visible container and product values without transient weighbridge ID', async () => {
    const onSave = jest.fn();
    renderDialog({ onSave });

    fireEvent.change(screen.getByLabelText('Container No.'), {
        target: { value: 'LOCAL-CONT-009' }
    });
    fireEvent.change(screen.getByLabelText('Product Name'), {
        target: { value: 'Local Product' }
    });
    fireEvent.click(screen.getByRole('button', { name: 'Update Container' }));

    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({
        container_no: 'LOCAL-CONT-009',
        weighbridge_name: 'Test Weighbridge',
        products: [expect.objectContaining({ product_name: 'Local Product' })]
    }));
    expect(onSave.mock.calls[0][0]).not.toHaveProperty('weighbridge_id');
});

test('resets products when editing a container with no products', async () => {
    const { rerender } = renderDialog();
    expect(await screen.findByDisplayValue('Container Product')).toBeInTheDocument();

    rerender(
        <ContainerDialog
            open
            onClose={jest.fn()}
            onSave={jest.fn()}
            container={{ ...baseContainer, id: 10, products: [] }}
            masterData={masterData}
            weighbridges={[]}
        />
    );

    await waitFor(() => {
        expect(screen.queryByDisplayValue('Container Product')).not.toBeInTheDocument();
    });
});

test('uses conflict draft values while retaining existing container identity', async () => {
    const conflictDraft = {
        type: 'container',
        containerId: 9,
        data: {
            ...baseContainer,
            container_no: 'LOCAL-CONT-009',
            products: [{ product_name: 'Local Product', total_packages: 3 }]
        }
    };
    renderDialog({
        container: { ...baseContainer, container_no: 'LATEST-CONT-009' },
        conflictDraft
    });

    expect(await screen.findByDisplayValue('LOCAL-CONT-009')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Local Product')).toBeInTheDocument();
});
