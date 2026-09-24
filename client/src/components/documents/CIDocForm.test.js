import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import CIDocForm from './CIDocForm';

test('CI shows the Master vessel and emits edited values', () => {
    const onChange = jest.fn();
    const onSave = jest.fn();
    const onDownloadPDF = jest.fn();
    render(<CIDocForm
        data={{ vessel_no: 'MASTER-VESSEL' }}
        onChange={onChange} onSave={onSave} onDownloadPDF={onDownloadPDF}
    />);

    const vessel = screen.getByRole('textbox', { name: 'Vessel No.' });
    expect(vessel).toHaveValue('MASTER-VESSEL');
    fireEvent.change(vessel, { target: { value: 'UPDATED-VESSEL' } });
    expect(onChange).toHaveBeenCalledWith({ vessel_no: 'UPDATED-VESSEL' });
    fireEvent.click(screen.getByRole('button', { name: /Download PDF/i }));
    expect(onDownloadPDF).toHaveBeenCalledTimes(1);
});
