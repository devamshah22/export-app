import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import CIDocForm from './CIDocForm';

test('CI vessel edits are document-only; other editable fields still use Master changes', () => {
    const onChange = jest.fn();
    const onSave = jest.fn();
    const onDownloadPDF = jest.fn();
    render(<CIDocForm
        data={{ vessel_no: 'MASTER-VESSEL', other_ref: 'MASTER-REF' }}
        onChange={onChange} onSave={onSave} onDownloadPDF={onDownloadPDF}
    />);

    const vessel = screen.getByRole('textbox', { name: 'Vessel No.' });
    expect(vessel).toHaveValue('MASTER-VESSEL');
    fireEvent.change(vessel, { target: { value: 'UPDATED-VESSEL' } });
    expect(onChange).not.toHaveBeenCalled();
    fireEvent.change(screen.getByRole('textbox', { name: 'Other Ref' }), { target: { value: 'CI-REF' } });
    expect(onChange).toHaveBeenCalledWith({ vessel_no: 'MASTER-VESSEL', other_ref: 'CI-REF' });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(onSave).toHaveBeenCalledWith({
        fields: { vessel_no: 'MASTER-VESSEL', other_ref: 'MASTER-REF' },
        overrides: { vessel_no: 'UPDATED-VESSEL' }
    });
    fireEvent.click(screen.getByRole('button', { name: /Download PDF/i }));
    expect(onDownloadPDF).toHaveBeenCalledTimes(1);
});

test('CI restores a saved override, allows an intentional blank, and can revert to Master', () => {
    const onSave = jest.fn();
    const view = render(<CIDocForm data={{ vessel_no: 'MASTER', overrides: { CI: { vessel_no: 'CI-ONLY' } } }}
        onChange={jest.fn()} onSave={onSave} />);
    const vessel = screen.getByRole('textbox', { name: 'Vessel No.' });
    expect(vessel).toHaveValue('CI-ONLY');
    fireEvent.change(vessel, { target: { value: '' } });
    expect(vessel).toHaveValue('');
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ overrides: { vessel_no: '' } }));
    fireEvent.click(screen.getByRole('button', { name: 'Use Master vessel number' }));
    expect(vessel).toHaveValue('MASTER');
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(onSave).toHaveBeenLastCalledWith(expect.objectContaining({ overrides: { vessel_no: null } }));

    view.rerender(<CIDocForm data={{ vessel_no: 'NEW-MASTER', overrides: {} }}
        onChange={jest.fn()} onSave={onSave} />);
    expect(vessel).toHaveValue('NEW-MASTER');
});
