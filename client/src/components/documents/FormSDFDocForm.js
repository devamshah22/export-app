import React from 'react';
import { Box, Typography, Button, Grid, TextField, Paper } from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import useDocumentOverrides from './useDocumentOverrides';

export default function FormSDFDocForm({ data, onSave, onDownloadPDF, conflictDraft }) {
    const [overrides, setOverrides] = useDocumentOverrides(data, 'FORM_SDF', conflictDraft);

    const getField = (key, defaultValue) => overrides[key] !== undefined ? overrides[key] : defaultValue;
    const setField = (key, value) => setOverrides({ ...overrides, [key]: value });

    const formatDateDisplay = (d) => d ? new Date(d).toLocaleDateString('en-GB') : '';

    const defaultDecl1a = `The value as contracted with the buyer is the same as the full export value declared in the above shipping bill.`;
    const defaultDecl1b = `The full export value of the goods is not ascertainable at the time of export and that the value declared is that which I/We having regard to the prevailing market`;
    const defaultDecl2 = `We undertake that We will deliver to the bank named here in`;
    const defaultDecl3 = `We further declare that We are resident in India and We have a place of business in India.`;
    const defaultCaution = `We are not in Caution List of the Reserve Bank of India.`;

    const handleSave = async () => {
        await onSave({ overrides });
    };

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h5" fontWeight="bold">Form SDF</Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button variant="outlined" startIcon={<PictureAsPdfIcon />} onClick={onDownloadPDF}>Download PDF</Button>
                    <Button variant="contained" startIcon={<SaveIcon />} onClick={handleSave}>Save</Button>
                </Box>
            </Box>

            <Paper sx={{ p: 2, mb: 2 }}>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>Reference</Typography>
                <Grid container spacing={2}>
                    <Grid item xs={12} sm={4}>
                        <TextField fullWidth label="Shipping Bill No." value={data.shipping_bill_no || ''} InputProps={{ readOnly: true }} />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                        <TextField fullWidth label="Date" value={formatDateDisplay(data.shipping_bill_date || data.ci_invoice_date || data.invoice_date)} InputProps={{ readOnly: true }} />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                        <TextField fullWidth label="Bank" value={data.bank_name || ''} InputProps={{ readOnly: true }} />
                    </Grid>
                </Grid>
            </Paper>

            <Paper sx={{ p: 2, mb: 2 }}>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>Declaration 1 (Main)</Typography>
                <TextField
                    fullWidth multiline rows={3}
                    value={getField('decl_1_main', `We hereby declare that We Are the CONSIGNOR of the goods in respect of which this declaration made and that particulars given to shipping Bill no: ${data.shipping_bill_no || ''} dated : ${formatDateDisplay(data.shipping_bill_date || data.ci_invoice_date || data.invoice_date)} are true and that :`)}
                    onChange={(e) => setField('decl_1_main', e.target.value)}
                />
            </Paper>

            <Paper sx={{ p: 2, mb: 2 }}>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>Declaration 1a</Typography>
                <TextField fullWidth multiline rows={2} value={getField('decl_1a', defaultDecl1a)} onChange={(e) => setField('decl_1a', e.target.value)} />
            </Paper>

            <Paper sx={{ p: 2, mb: 2 }}>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>Declaration 1b</Typography>
                <TextField fullWidth multiline rows={2} value={getField('decl_1b', defaultDecl1b)} onChange={(e) => setField('decl_1b', e.target.value)} />
            </Paper>

            <Paper sx={{ p: 2, mb: 2 }}>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>Declaration 2</Typography>
                <Grid container spacing={1} alignItems="center">
                    <Grid item xs={12} sm={8}>
                        <TextField fullWidth multiline rows={1} value={getField('decl_2', defaultDecl2)} onChange={(e) => setField('decl_2', e.target.value)} />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                        <TextField fullWidth label="Bank Name" value={data.bank_name || ''} InputProps={{ readOnly: true }} />
                    </Grid>
                </Grid>
            </Paper>

            <Paper sx={{ p: 2, mb: 2 }}>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>Declaration 3</Typography>
                <TextField fullWidth multiline rows={2} value={getField('decl_3', defaultDecl3)} onChange={(e) => setField('decl_3', e.target.value)} />
            </Paper>

            <Paper sx={{ p: 2, mb: 2 }}>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>Caution Statement</Typography>
                <TextField fullWidth multiline rows={1} value={getField('caution', defaultCaution)} onChange={(e) => setField('caution', e.target.value)} />
            </Paper>
        </Box>
    );
}
