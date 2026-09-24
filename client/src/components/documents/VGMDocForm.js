import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
    Box, Typography, Button, Grid, TextField, Paper, MenuItem, Alert
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import { mastersAPI } from '../../services/api';
import useDocumentOverrides from './useDocumentOverrides';

const DEFAULTS = {
    authorized_official: 'JIGER SHETH (DIRECTOR)',
    contact_details: '+91 9820355066',
    weighbridge_name: 'NEW CHAUDARY CONATINER WEIGH BRIDGE',
    weighing_method: 'METHOD-1',
    max_permissible_weight: '32500',
    unit: 'KGS',
    cargo_type: 'HAZARDOUS'
};

const toDateInput = (value) => value ? String(value).split('T')[0] : '';

export default function VGMDocForm({ data, onChange, onSave, masterId, conflictDraft }) {
    const containers = useMemo(() => data.containers || [], [data.containers]);
    const attemptedContainer = conflictDraft?.type === 'document' && conflictDraft.document === 'VGM'
        ? conflictDraft.saveParts?.container
        : null;
    const [selectedContainerId, setSelectedContainerId] = useState('');
    const selectionLost = useRef(false);
    const [containerEdits, setContainerEdits] = useState({});
    const [overrides, setOverrides] = useDocumentOverrides(data, 'VGM', conflictDraft);
    const annexureCIec = data.overrides?.ANNEXURE_C?.iec_no || '';

    useEffect(() => {
        const attemptedExists = attemptedContainer?.id
            && containers.some(container => String(container.id) === String(attemptedContainer.id));
        const selectedExists = containers.some(container => String(container.id) === String(selectedContainerId));
        if (attemptedExists && (!selectedContainerId || String(selectedContainerId) === String(attemptedContainer.id))) {
            setSelectedContainerId(attemptedContainer.id);
        } else if ((attemptedContainer?.id && !attemptedExists && !selectedExists) || (selectedContainerId && !selectedExists)) {
            if (selectedContainerId && !selectedExists) selectionLost.current = true;
            setSelectedContainerId('');
        } else if (!selectedContainerId && containers.length > 0 && !attemptedContainer?.id && !selectionLost.current) {
            setSelectedContainerId(containers[0].id);
        }
    }, [attemptedContainer, containers, selectedContainerId]);

    const selectedContainer = containers.find(c => String(c.id) === String(selectedContainerId)) || null;
    const attemptedContainerMissing = Boolean(attemptedContainer?.id)
        && !containers.some(container => String(container.id) === String(attemptedContainer.id))
        && !selectedContainer;

    useEffect(() => {
        if (selectedContainer) {
            setContainerEdits({
                container_size: selectedContainer.container_size || '',
                weighbridge_name: selectedContainer.weighbridge_name || DEFAULTS.weighbridge_name,
                weighing_method: selectedContainer.weighing_method || DEFAULTS.weighing_method,
                verified_gross_mass: selectedContainer.verified_gross_mass || '',
                verified_gross_mass_unit: selectedContainer.verified_gross_mass_unit || DEFAULTS.unit,
                weighing_slip_no: selectedContainer.weighing_slip_no || '',
                cargo_type: selectedContainer.cargo_type || DEFAULTS.cargo_type,
                ...(attemptedContainer?.id && String(attemptedContainer.id) === String(selectedContainer.id)
                    ? attemptedContainer
                    : {})
            });
        }
    }, [selectedContainer, selectedContainerId, attemptedContainer]);

    const getOverride = (key, fallback = '') => overrides[key] !== undefined ? overrides[key] : fallback;
    const setOverride = (key) => (event) => setOverrides(prev => ({ ...prev, [key]: event.target.value }));
    const setContainerField = (key) => (event) => setContainerEdits(prev => ({ ...prev, [key]: event.target.value }));

    const hazardousDefault = `UN NO: ${data.un_number || '3077'} CLASS: ${data.imdg_class || '9'}`;
    const iecNo = annexureCIec || data.iec_no || '0302034218';
    const weighingDate = toDateInput(data.ci_invoice_date);
    const formatDisplayDate = (value) => value ? new Date(value).toLocaleDateString('en-GB') : '';

    const handleSave = async () => {
        if (!selectedContainer) {
            alert('No container selected.');
            return;
        }
        try {
            const payload = {
                ...selectedContainer,
                ...containerEdits,
                verified_gross_mass: containerEdits.verified_gross_mass === '' ? null : containerEdits.verified_gross_mass,
                // Weighing date always mirrors the CI invoice date
                weighing_date: weighingDate || null,
                weighing_time: null
            };
            // Keep existing container products untouched
            delete payload.products;
            delete payload.id;
            delete payload.master_id;
            delete payload.sequence_no;
            delete payload.created_at;
            delete payload.updated_at;
            if (!data.version) throw new Error('Master version is unavailable. Reload before saving.');
            await onSave({
                fields: {},
                container: { id: selectedContainer.id, ...payload },
                overrides
            });
        } catch (err) {
            throw err;
        }
    };

    const handleDownloadPDF = async () => {
        if (!selectedContainer) {
            alert('No container selected.');
            return;
        }
        try {
            const response = await mastersAPI.generatePDF(masterId, 'VGM', selectedContainer.id);
            const blob = new Blob([response.data], { type: 'application/pdf' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.target = '_blank';
            link.click();
            setTimeout(() => window.URL.revokeObjectURL(url), 1000);
        } catch (err) {
            alert('Failed to generate VGM PDF: ' + (err.response?.data?.error || err.message));
        }
    };

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h5" fontWeight="bold">Verified Gross Mass (VGM)</Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button variant="outlined" startIcon={<PictureAsPdfIcon />} onClick={handleDownloadPDF}>Download PDF</Button>
                    <Button variant="contained" startIcon={<SaveIcon />} onClick={handleSave}>Save</Button>
                </Box>
            </Box>

            <Paper sx={{ p: 2, mb: 2 }}>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>Container Selection</Typography>
                {attemptedContainerMissing && (
                    <Alert severity="warning" sx={{ mb: 2 }}>
                        Attempted container from unsaved VGM edits no longer exists. Select a current container before saving.
                    </Alert>
                )}
                {selectionLost.current && !selectedContainer && !attemptedContainerMissing && (
                    <Alert severity="warning" sx={{ mb: 2 }}>
                        Selected container no longer exists. Select a current container before saving.
                    </Alert>
                )}
                {containers.length === 0 ? (
                    <Typography color="text.secondary">No containers added to this Master. Add containers in the Master form first.</Typography>
                ) : (
                    <TextField
                        select fullWidth label="Container" value={selectedContainerId || ''}
                        onChange={(event) => {
                            selectionLost.current = false;
                            setSelectedContainerId(event.target.value);
                        }}
                        helperText="One VGM document is generated per container."
                    >
                        {containers.map((container) => (
                            <MenuItem key={container.id} value={container.id}>
                                {container.container_no || `Container #${container.sequence_no}`}
                                {container.container_size ? ` (${container.container_size})` : ''}
                            </MenuItem>
                        ))}
                    </TextField>
                )}
            </Paper>

            <Paper sx={{ p: 2, mb: 2 }}>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>Shipper Details</Typography>
                <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}><TextField fullWidth label="Name of Shipper" value={data.company_name || data.consignor_name || ''} InputProps={{ readOnly: true }} /></Grid>
                    <Grid item xs={12} sm={6}><TextField fullWidth label="Shipper Address" value={data.company_address || ''} InputProps={{ readOnly: true }} multiline rows={2} /></Grid>
                    <Grid item xs={12} sm={6}><TextField fullWidth label="IEC No. (linked from Annexure C)" value={iecNo} InputProps={{ readOnly: true }} /></Grid>
                    <Grid item xs={12} sm={6}><TextField fullWidth label="Authorized Official (Name and Designation)" value={getOverride('authorized_official', DEFAULTS.authorized_official)} onChange={setOverride('authorized_official')} /></Grid>
                    <Grid item xs={12} sm={6}><TextField fullWidth label="24 x 7 Contact Details" value={getOverride('contact_details', DEFAULTS.contact_details)} onChange={setOverride('contact_details')} /></Grid>
                </Grid>
            </Paper>

            {selectedContainer && (
                <Paper sx={{ p: 2, mb: 2 }}>
                    <Typography variant="subtitle1" fontWeight="bold" gutterBottom>Weighing Details — {selectedContainer.container_no || `Container #${selectedContainer.sequence_no}`}</Typography>
                    <Grid container spacing={2}>
                        <Grid item xs={12} sm={4}><TextField fullWidth label="Container No." value={selectedContainer.container_no || ''} InputProps={{ readOnly: true }} /></Grid>
                        <Grid item xs={12} sm={4}><TextField fullWidth label="Container Size" value={containerEdits.container_size || ''} onChange={setContainerField('container_size')} /></Grid>
                        <Grid item xs={12} sm={4}><TextField fullWidth label="Max Permissible Weight (from Container Details, KGS)" value={selectedContainer.max_permissible_weight || ''} InputProps={{ readOnly: true }} /></Grid>
                        <Grid item xs={12} sm={8}><TextField fullWidth label="Weighbridge Registration No. and Address" value={containerEdits.weighbridge_name || ''} onChange={setContainerField('weighbridge_name')} /></Grid>
                        <Grid item xs={12} sm={4}>
                            <TextField select fullWidth label="Weighing Method" value={containerEdits.weighing_method || DEFAULTS.weighing_method} onChange={setContainerField('weighing_method')}>
                                <MenuItem value="METHOD-1">METHOD-1</MenuItem>
                                <MenuItem value="METHOD-2">METHOD-2</MenuItem>
                            </TextField>
                        </Grid>
                        <Grid item xs={12} sm={4}><TextField fullWidth label="Verified Gross Mass" value={containerEdits.verified_gross_mass || ''} onChange={setContainerField('verified_gross_mass')} /></Grid>
                        <Grid item xs={12} sm={4}>
                            <TextField select fullWidth label="Unit of Measure" value={containerEdits.verified_gross_mass_unit || DEFAULTS.unit} onChange={setContainerField('verified_gross_mass_unit')}>
                                <MenuItem value="KGS">KGS</MenuItem>
                                <MenuItem value="MT">MT</MenuItem>
                                <MenuItem value="LBS">LBS</MenuItem>
                            </TextField>
                        </Grid>
                        <Grid item xs={12} sm={4}><TextField fullWidth label="Weighing Slip No." value={containerEdits.weighing_slip_no || ''} onChange={setContainerField('weighing_slip_no')} /></Grid>
                        <Grid item xs={12} sm={4}><TextField fullWidth label="Date of Weighing (CI Invoice Date)" value={formatDisplayDate(data.ci_invoice_date)} InputProps={{ readOnly: true }} /></Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField select fullWidth label="Type of Cargo" value={containerEdits.cargo_type || DEFAULTS.cargo_type} onChange={setContainerField('cargo_type')}>
                                <MenuItem value="NORMAL">NORMAL</MenuItem>
                                <MenuItem value="REEFER">REEFER</MenuItem>
                                <MenuItem value="HAZARDOUS">HAZARDOUS</MenuItem>
                                <MenuItem value="OTHERS">OTHERS</MenuItem>
                            </TextField>
                        </Grid>
                        <Grid item xs={12} sm={6}><TextField fullWidth label="If Hazardous — UN No. / IMDG Class (from DGD)" value={hazardousDefault} InputProps={{ readOnly: true }} /></Grid>
                    </Grid>
                </Paper>
            )}
        </Box>
    );
}
