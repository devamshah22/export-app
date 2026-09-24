import React from 'react';
import { Box, Typography, Button, Grid, TextField, Paper } from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';

/**
 * PL Document Form - Packing List
 * Same structure as CI but with weights instead of pricing
 */
export default function PLDocForm({ data, onChange, onSave, onDownloadPDF }) {
    const handleChange = (field) => (e) => {
        onChange({ ...data, [field]: e.target.value });
    };

    const handleSave = () => onSave({ fields: data });

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h5" fontWeight="bold">Packing List (PL)</Typography>
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
                        <TextField fullWidth label="Buyer Name" value={data.buyer_name || ''} onChange={handleChange('buyer_name')} />
                    </Grid>
                </Grid>
            </Paper>

            <Paper sx={{ p: 2, mb: 2 }}>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>Packing List Details</Typography>
                <Grid container spacing={2}>
                    <Grid item xs={12} sm={3}>
                        <TextField fullWidth label="Packing List No." value={data.ci_invoice_no || ''} onChange={handleChange('ci_invoice_no')} />
                    </Grid>
                    <Grid item xs={12} sm={3}>
                        <TextField fullWidth label="Date" type="date" value={data.ci_invoice_date || ''} onChange={handleChange('ci_invoice_date')} InputLabelProps={{ shrink: true }} />
                    </Grid>
                    <Grid item xs={12} sm={3}>
                        <TextField fullWidth label="Vessel No." value={data.vessel_no || ''} onChange={handleChange('vessel_no')} />
                    </Grid>
                    <Grid item xs={12} sm={3}>
                        <TextField fullWidth label="Bill of Lading No." value={data.bill_of_lading_no || ''} onChange={handleChange('bill_of_lading_no')} />
                    </Grid>
                </Grid>
            </Paper>

            <Paper sx={{ p: 2, mb: 2 }}>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>Product & Weights</Typography>
                <Grid container spacing={2}>
                    <Grid item xs={12} sm={4}>
                        <TextField fullWidth label="Product Name" value={data.product_name || ''} onChange={handleChange('product_name')} />
                    </Grid>
                    <Grid item xs={12} sm={2}>
                        <TextField fullWidth label="HS Code" value={data.hs_code || ''} onChange={handleChange('hs_code')} />
                    </Grid>
                    <Grid item xs={12} sm={3}>
                        <TextField fullWidth label="Packing Type" value={data.packing_type || ''} onChange={handleChange('packing_type')} />
                    </Grid>
                    <Grid item xs={12} sm={3}>
                        <TextField fullWidth label="Description" value={data.description || ''} onChange={handleChange('description')} />
                    </Grid>
                    <Grid item xs={12} sm={2}>
                        <TextField fullWidth label="Nett Weight" value={data.nett_weight || ''} onChange={handleChange('nett_weight')} />
                    </Grid>
                    <Grid item xs={12} sm={2}>
                        <TextField fullWidth label="Gross Weight" value={data.total_gross_weight || ''} onChange={handleChange('total_gross_weight')} />
                    </Grid>
                    <Grid item xs={12} sm={2}>
                        <TextField fullWidth label="Total Packages" value={data.total_packages || ''} onChange={handleChange('total_packages')} />
                    </Grid>
                    <Grid item xs={12} sm={2}>
                        <TextField fullWidth label="Lot No." value={data.lot_no || ''} onChange={handleChange('lot_no')} />
                    </Grid>
                    <Grid item xs={12} sm={2}>
                        <TextField fullWidth label="Unit 1" value={data.unit_1 || ''} onChange={handleChange('unit_1')} />
                    </Grid>
                    <Grid item xs={12} sm={2}>
                        <TextField fullWidth label="Unit 2" value={data.unit_2 || ''} onChange={handleChange('unit_2')} />
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
                        <TextField fullWidth label="Shipment Date" type="date" value={data.shipment_date || ''} onChange={handleChange('shipment_date')} InputLabelProps={{ shrink: true }} />
                    </Grid>
                    <Grid item xs={12} sm={3}>
                        <TextField fullWidth label="Freight Terms" value={data.freight_terms || ''} onChange={handleChange('freight_terms')} />
                    </Grid>
                </Grid>
            </Paper>
        </Box>
    );
}
