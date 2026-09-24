import React from 'react';
import { Box, Typography, Button, Grid, TextField, Paper } from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import useDocumentOverrides from './useDocumentOverrides';

export default function SCOMETDocForm({ data, onSave, onDownloadPDF, conflictDraft }) {
    const [overrides, setOverrides] = useDocumentOverrides(data, 'SCOMET', conflictDraft);

    const getField = (key, defaultValue) => overrides[key] !== undefined ? overrides[key] : defaultValue;
    const setField = (key, value) => setOverrides({ ...overrides, [key]: value });

    const portName = data.port_of_loading ? data.port_of_loading.split(',')[0].trim() : '';
    const defaultSubject = `Declaration for Export Consignment Being Exported vide our Custom`;
    const defaultDescription = `We wish to bring to your kind notice that the exported item is ${data.product_name || ''} as PER INV & PL We declare that these items do not fall under SCOMET Item list.`;
    const defaultRequest = `We hereby request you to kindly allow the goods to be exported.`;

    const handleSave = async () => {
        await onSave({ overrides });
    };

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h5" fontWeight="bold">SCOMET Declaration</Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button variant="outlined" startIcon={<PictureAsPdfIcon />} onClick={onDownloadPDF}>Download PDF</Button>
                    <Button variant="contained" startIcon={<SaveIcon />} onClick={handleSave}>Save</Button>
                </Box>
            </Box>

            <Paper sx={{ p: 2, mb: 2 }}>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>Addressed To</Typography>
                <Grid container spacing={2}>
                    <Grid item xs={12} sm={4}>
                        <TextField fullWidth label="Date" value={data.ci_invoice_date || data.invoice_date ? new Date(data.ci_invoice_date || data.invoice_date).toLocaleDateString('en-GB') : ''} InputProps={{ readOnly: true }} />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                        <TextField fullWidth label="Port / Customs Office" value={portName} InputProps={{ readOnly: true }} />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                        <TextField fullWidth label="Shipper" value={data.consignor_name ? `M/s ${data.consignor_name}` : ''} InputProps={{ readOnly: true }} />
                    </Grid>
                </Grid>
            </Paper>

            <Paper sx={{ p: 2, mb: 2 }}>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>Subject</Typography>
                <TextField
                    fullWidth multiline rows={2}
                    value={getField('subject', defaultSubject)}
                    onChange={(e) => setField('subject', e.target.value)}
                />
            </Paper>

            <Paper sx={{ p: 2, mb: 2 }}>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>Description</Typography>
                <TextField
                    fullWidth multiline rows={2}
                    value={getField('description', defaultDescription)}
                    onChange={(e) => setField('description', e.target.value)}
                />
            </Paper>

            <Paper sx={{ p: 2, mb: 2 }}>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>Invoice Details</Typography>
                <Grid container spacing={2}>
                    <Grid item xs={12} sm={2}>
                        <TextField fullWidth label="Sr. No." type="number"
                            value={getField('sr_no', '1')}
                            onChange={(e) => setField('sr_no', e.target.value)}
                        />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                        <TextField fullWidth label="Invoice No." value={data.ci_invoice_no || data.invoice_no || ''} InputProps={{ readOnly: true }} />
                    </Grid>
                    <Grid item xs={12} sm={3}>
                        <TextField fullWidth label="Date" value={data.ci_invoice_date || data.invoice_date ? new Date(data.ci_invoice_date || data.invoice_date).toLocaleDateString('en-GB') : ''} InputProps={{ readOnly: true }} />
                    </Grid>
                    <Grid item xs={12} sm={3}>
                        <TextField fullWidth label="HS Code" value={data.hs_code || ''} InputProps={{ readOnly: true }} />
                    </Grid>
                </Grid>
            </Paper>

            <Paper sx={{ p: 2, mb: 2 }}>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>Request</Typography>
                <TextField
                    fullWidth multiline rows={2}
                    value={getField('request', defaultRequest)}
                    onChange={(e) => setField('request', e.target.value)}
                />
            </Paper>
        </Box>
    );
}

