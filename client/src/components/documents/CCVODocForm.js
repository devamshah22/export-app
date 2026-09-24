import React from 'react';
import { Box, Typography, Button, Grid, TextField, Paper } from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import useDocumentOverrides from './useDocumentOverrides';

export default function CCVODocForm({ data, onChange, onSave, onDownloadPDF, conflictDraft }) {
    const [overrides, setOverrides] = useDocumentOverrides(data, 'CCVO', conflictDraft);

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
                <Typography variant="h5" fontWeight="bold">Combined Certificate of Origin & Value (CCVO)</Typography>
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
                        <TextField fullWidth label="Certificate No." value={data.ci_invoice_no || data.invoice_no || ''} onChange={handleChange('ci_invoice_no')} />
                    </Grid>
                    <Grid item xs={12} sm={3}>
                        <TextField fullWidth label="Date" type="date" value={data.ci_invoice_date || data.invoice_date || ''} onChange={handleChange('ci_invoice_date')} InputLabelProps={{ shrink: true }} />
                    </Grid>
                    <Grid item xs={12} sm={3}>
                        <TextField fullWidth label="CI Invoice No." value={data.ci_invoice_no || ''} onChange={handleChange('ci_invoice_no')} />
                    </Grid>
                    <Grid item xs={12} sm={3}>
                        <TextField fullWidth label="CI Invoice Date" type="date" value={data.ci_invoice_date || ''} onChange={handleChange('ci_invoice_date')} InputLabelProps={{ shrink: true }} />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField fullWidth label='Form "M" No.' value={data.other_ref || ''} onChange={handleChange('other_ref')} />
                    </Grid>
                </Grid>
            </Paper>

            <Paper sx={{ p: 2, mb: 2 }}>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>Shipping</Typography>
                <Grid container spacing={2}>
                    <Grid item xs={12} sm={3}>
                        <TextField fullWidth label="Port of Loading" value={data.port_of_loading || ''} onChange={handleChange('port_of_loading')} />
                    </Grid>
                    <Grid item xs={12} sm={3}>
                        <TextField fullWidth label="Port of Discharge" value={data.port_of_discharge || ''} onChange={handleChange('port_of_discharge')} />
                    </Grid>
                    <Grid item xs={12} sm={3}>
                        <TextField fullWidth label="Country of Origin" value={data.country_of_origin || ''} onChange={handleChange('country_of_origin')} />
                    </Grid>
                    <Grid item xs={12} sm={3}>
                        <TextField fullWidth label="Country of Discharge" value={data.country_of_discharge || ''} onChange={handleChange('country_of_discharge')} />
                    </Grid>
                    <Grid item xs={12} sm={3}>
                        <TextField fullWidth label="Country of Supply" value={data.country_of_supply || 'India'} onChange={handleChange('country_of_supply')} />
                    </Grid>
                    <Grid item xs={12} sm={3}>
                        <TextField fullWidth label="Shipment Date" type="date" value={data.shipment_date || ''} onChange={handleChange('shipment_date')} InputLabelProps={{ shrink: true }} />
                    </Grid>
                    <Grid item xs={12} sm={3}>
                        <TextField fullWidth label="Vessel No." value={data.vessel_no || ''} onChange={handleChange('vessel_no')} />
                    </Grid>
                    <Grid item xs={12} sm={3}>
                        <TextField fullWidth label="Bill of Lading No." value={data.bill_of_lading_no || ''} onChange={handleChange('bill_of_lading_no')} />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField fullWidth label="Container No." value={(data.containers || []).map(c => c.container_no).filter(Boolean).join(', ') || ''} InputProps={{ readOnly: true }} />
                    </Grid>
                </Grid>
            </Paper>

            <Paper sx={{ p: 2, mb: 2 }}>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>Product & Value</Typography>
                <Grid container spacing={2}>
                    <Grid item xs={12} sm={4}>
                        <TextField fullWidth label="Product Name" value={data.product_name || ''} onChange={handleChange('product_name')} />
                    </Grid>
                    <Grid item xs={12} sm={2}>
                        <TextField fullWidth label="HS Code" value={data.hs_code || ''} onChange={handleChange('hs_code')} />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField fullWidth label="Container Goods Description" value={data.container_goods_description || ''} onChange={handleChange('container_goods_description')} placeholder="e.g., 25Kgs x 840 Bags Per Container" />
                    </Grid>
                    <Grid item xs={12} sm={2}>
                        <TextField fullWidth label="Gross Weight" value={data.total_gross_weight || ''} onChange={handleChange('total_gross_weight')} />
                    </Grid>
                    <Grid item xs={12} sm={2}>
                        <TextField fullWidth label="Nett Weight" value={data.nett_weight || ''} onChange={handleChange('nett_weight')} />
                    </Grid>
                    <Grid item xs={12} sm={3}>
                        <TextField fullWidth label="FOB Amount" value={data.fob_amount || ''} onChange={handleChange('fob_amount')} />
                    </Grid>
                    <Grid item xs={12} sm={3}>
                        <TextField fullWidth label="Total Amount (CFR)" value={data.total_amount || ''} onChange={handleChange('total_amount')} />
                    </Grid>
                </Grid>
            </Paper>

            <Paper sx={{ p: 2, mb: 2 }}>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>Declaration for Origin</Typography>
                <TextField
                    fullWidth multiline rows={3}
                    value={getField('declaration_origin', `We, ${data.consignor_name || ''} manufacturer of the goods enumerated in this invoice hereby declare and certify that the goods have been wholly manufactured in India.`)}
                    onChange={(e) => setField('declaration_origin', e.target.value)}
                />
            </Paper>

            <Paper sx={{ p: 2, mb: 2 }}>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>Declaration for Value</Typography>
                <TextField
                    fullWidth multiline rows={3}
                    value={getField('declaration_value', `We, ${data.consignor_name || ''} manufacturer of the goods enumerated in this invoice hereby declare and certify that this invoice is in all respect correct and contains a true and full statement of the price actually paid or to be paid for the said goods and the actual quantity thereof.`)}
                    onChange={(e) => setField('declaration_value', e.target.value)}
                />
            </Paper>
        </Box>
    );
}
