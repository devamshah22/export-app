import React from 'react';
import { Box, Typography, Button, Grid, TextField, Paper } from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import useDocumentOverrides from './useDocumentOverrides';

export default function BCDocForm({ data, onChange, onSave, onDownloadPDF, conflictDraft }) {
    const [overrides, setOverrides] = useDocumentOverrides(data, 'BC', conflictDraft);

    const defaultDecl1 = `We, ${data.consignor_name || ''} manufacturer of the goods enumerated in this invoice hereby declare and certify that one set of original documents Commercial invoice, COA, CCVO, Beneficiary Certificate including a copy of Bill of Lading and a Copy of CRIA report have been forwarded to below mentioned bank and address by courier not later then 21 days after shipment.`;
    const defaultDecl2 = `We, ${data.consignor_name || ''} manufacturer of the goods enumerated in this invoice hereby declare and certify that this is the final shipment and there will neither be any further shipment and nor any additional drawdown other then the Invoice presented for collection against the Letter of Credit issued by ${data.consignee_name || ''} vide LC no. ${data.lc_no_and_date || ''}`;
    const defaultDecl3 = `We, ${data.consignor_name || ''} manufacturer of the goods enumerated in this invoice hereby declare and certify that products have been delivered in conformity with the terms of the LC No. and dated as mentioned below, that all necessary documents have been forwarded to the consignee through the correspondent bank and that payment of the Invoice for delivery is properly due to them and would be exclusively used for the settlement of the Invoice.`;


    const getField = (key, defaultValue) => overrides[key] !== undefined ? overrides[key] : defaultValue;
    const setField = (key, value) => setOverrides({ ...overrides, [key]: value });

    const handleChange = (field) => (e) => {
        onChange({ ...data, [field]: e.target.value });
    };

    const handleSave = async () => {
        await onSave({ fields: data, overrides });
    };

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h5" fontWeight="bold">Beneficiary Certificate</Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button variant="outlined" startIcon={<PictureAsPdfIcon />} onClick={onDownloadPDF}>Download PDF</Button>
                    <Button variant="contained" startIcon={<SaveIcon />} onClick={handleSave}>Save</Button>
                </Box>
            </Box>

            <Paper sx={{ p: 2, mb: 2 }}>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>Consignee & Buyer</Typography>
                <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                        <TextField fullWidth label="Consignee Name" value={data.consignee_name || ''} onChange={handleChange('consignee_name')} />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField fullWidth label="Consignee Address" value={data.consignee_address || ''} onChange={handleChange('consignee_address')} multiline rows={2} />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField fullWidth label="Buyer Name" value={data.buyer_name || ''} onChange={handleChange('buyer_name')} />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField fullWidth label="Buyer Address" value={data.buyer_address || ''} onChange={handleChange('buyer_address')} multiline rows={2} />
                    </Grid>
                </Grid>
            </Paper>

            <Paper sx={{ p: 2, mb: 2 }}>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>Certificate Details</Typography>
                <Grid container spacing={2}>
                    <Grid item xs={12} sm={3}>
                        <TextField fullWidth label="Certificate No." value={data.ci_invoice_no || data.invoice_no || ''} InputProps={{ readOnly: true }} />
                    </Grid>
                    <Grid item xs={12} sm={3}>
                        <TextField fullWidth label="Date" value={data.ci_invoice_date || data.invoice_date || ''} InputProps={{ readOnly: true }} />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField fullWidth label='Form "M" No.' value={data.other_ref || ''} InputProps={{ readOnly: true }} />
                    </Grid>
                </Grid>
            </Paper>

            <Paper sx={{ p: 2, mb: 2 }}>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>Shipping</Typography>
                <Grid container spacing={2}>
                    <Grid item xs={12} sm={3}>
                        <TextField fullWidth label="Port of Loading" value={data.port_of_loading || ''} InputProps={{ readOnly: true }} />
                    </Grid>
                    <Grid item xs={12} sm={3}>
                        <TextField fullWidth label="Port of Discharge" value={data.port_of_discharge || ''} InputProps={{ readOnly: true }} />
                    </Grid>
                    <Grid item xs={12} sm={3}>
                        <TextField fullWidth label="Country of Origin" value={data.country_of_origin || ''} InputProps={{ readOnly: true }} />
                    </Grid>
                    <Grid item xs={12} sm={3}>
                        <TextField fullWidth label="Country of Discharge" value={data.country_of_discharge || ''} InputProps={{ readOnly: true }} />
                    </Grid>
                    <Grid item xs={12} sm={3}>
                        <TextField fullWidth label="Country of Supply" value={data.country_of_supply || 'India'} InputProps={{ readOnly: true }} />
                    </Grid>
                    <Grid item xs={12} sm={3}>
                        <TextField fullWidth label="Shipment Date" value={data.shipment_date || ''} InputProps={{ readOnly: true }} />
                    </Grid>
                    <Grid item xs={12} sm={3}>
                        <TextField fullWidth label="Vessel No." value={data.vessel_no || ''} InputProps={{ readOnly: true }} />
                    </Grid>
                    <Grid item xs={12} sm={3}>
                        <TextField fullWidth label="Bill of Lading No." value={data.bill_of_lading_no || ''} InputProps={{ readOnly: true }} />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField fullWidth label="Container No." value={(data.containers || []).map(c => c.container_no).filter(Boolean).join(', ')} InputProps={{ readOnly: true }} />
                    </Grid>
                </Grid>
            </Paper>

            <Paper sx={{ p: 2, mb: 2 }}>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>Declaration 1</Typography>
                <TextField
                    fullWidth multiline rows={3}
                    value={getField('declaration_1', defaultDecl1)}
                    onChange={(e) => setField('declaration_1', e.target.value)}
                />
            </Paper>

            <Paper sx={{ p: 2, mb: 2 }}>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>Consignee (Bank)</Typography>
                <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                        <TextField fullWidth label="Bank Name" value={getField('issued_by', data.consignee_name || '')} onChange={(e) => setField('issued_by', e.target.value)} />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField fullWidth label="Bank Address" value={data.consignee_address || ''} InputProps={{ readOnly: true }} />
                    </Grid>
                </Grid>
            </Paper>

            <Paper sx={{ p: 2, mb: 2 }}>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>Declaration 2</Typography>
                <TextField
                    fullWidth multiline rows={3}
                    value={getField('declaration_2', defaultDecl2)}
                    onChange={(e) => setField('declaration_2', e.target.value)}
                />
            </Paper>

            <Paper sx={{ p: 2, mb: 2 }}>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>Declaration 3</Typography>
                <TextField
                    fullWidth multiline rows={3}
                    value={getField('declaration_3', defaultDecl3)}
                    onChange={(e) => setField('declaration_3', e.target.value)}
                />
            </Paper>

            <Paper sx={{ p: 2, mb: 2 }}>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>Issued By</Typography>
                <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                        <TextField fullWidth label="Issued By" value={getField('issued_by', data.consignee_name || '')} onChange={(e) => setField('issued_by', e.target.value)} />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField fullWidth label="L/C No." value={data.lc_no_and_date || ''} InputProps={{ readOnly: true }} />
                    </Grid>
                </Grid>
            </Paper>
        </Box>
    );
}
