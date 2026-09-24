import React from 'react';
import { Box, Typography, Button, Grid, TextField, Paper, MenuItem } from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';

/**
 * CI Document Form - Commercial Invoice
 */
export default function CIDocForm({ data, onChange, onSave, onDownloadPDF }) {
    const handleChange = (field) => (e) => {
        onChange({ ...data, [field]: e.target.value });
    };

    const handleSave = () => onSave({ fields: data });

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h5" fontWeight="bold">Commercial Invoice (CI)</Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button variant="outlined" startIcon={<PictureAsPdfIcon />} onClick={onDownloadPDF}>Download PDF</Button>
                    <Button variant="contained" startIcon={<SaveIcon />} onClick={handleSave}>Save</Button>
                </Box>
            </Box>

            <Paper sx={{ p: 2, mb: 2 }}>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>Consignee</Typography>
                <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                        <TextField fullWidth label="Consignee Name" value={data.consignee_name || ''} onChange={handleChange('consignee_name')} />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField fullWidth label="Consignee Address" value={data.consignee_address || ''} onChange={handleChange('consignee_address')} multiline rows={2} />
                    </Grid>
                </Grid>
            </Paper>

            <Paper sx={{ p: 2, mb: 2 }}>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>Buyer</Typography>
                <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                        <TextField fullWidth label="Buyer Name" value={data.buyer_name || ''} onChange={handleChange('buyer_name')} />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField fullWidth label="Buyer Address" value={data.buyer_address || ''} onChange={handleChange('buyer_address')} multiline rows={2} />
                    </Grid>
                </Grid>
            </Paper>

            <Paper sx={{ p: 2, mb: 2 }}>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>Invoice Details</Typography>
                <Grid container spacing={2}>
                    <Grid item xs={12} sm={3}>
                        <TextField fullWidth label="CI Invoice No." value={data.ci_invoice_no || ''} onChange={handleChange('ci_invoice_no')} />
                    </Grid>
                    <Grid item xs={12} sm={3}>
                        <TextField fullWidth label="CI Date" type="date" value={data.ci_invoice_date || ''} onChange={handleChange('ci_invoice_date')} InputLabelProps={{ shrink: true }} />
                    </Grid>
                    <Grid item xs={12} sm={3}>
                        <TextField fullWidth label="PO No." value={data.po_no || ''} onChange={handleChange('po_no')} />
                    </Grid>
                    <Grid item xs={12} sm={3}>
                        <TextField fullWidth label="Other Ref" value={data.other_ref || ''} onChange={handleChange('other_ref')} />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField fullWidth label="LUT ARN No." value={data.lut_arn_no || ''} onChange={handleChange('lut_arn_no')} />
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
                        <TextField fullWidth label="Shipment Date" type="date" value={data.shipment_date || ''} onChange={handleChange('shipment_date')} InputLabelProps={{ shrink: true }} />
                    </Grid>
                    <Grid item xs={12} sm={3}>
                        <TextField fullWidth label="Vessel No." value={data.vessel_no || ''} onChange={handleChange('vessel_no')} />
                    </Grid>
                    <Grid item xs={12} sm={3}>
                        <TextField fullWidth label="Bill of Lading No." value={data.bill_of_lading_no || ''} onChange={handleChange('bill_of_lading_no')} />
                    </Grid>
                    <Grid item xs={12} sm={3}>
                        <TextField fullWidth label="Shipping Bill No." value={data.shipping_bill_no || ''} onChange={handleChange('shipping_bill_no')} />
                    </Grid>
                </Grid>
            </Paper>

            <Paper sx={{ p: 2, mb: 2 }}>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>Payment & LC</Typography>
                <Grid container spacing={2}>
                    <Grid item xs={12} sm={3}>
                        <TextField fullWidth label="Incoterms" value={data.incoterms || ''} onChange={handleChange('incoterms')} />
                    </Grid>
                    <Grid item xs={12} sm={3}>
                        <TextField fullWidth label="Payment Terms" value={data.payment_terms || ''} onChange={handleChange('payment_terms')} />
                    </Grid>
                    <Grid item xs={12} sm={3}>
                        <TextField fullWidth label="Issuing Bank" value={data.issuing_bank || ''} onChange={handleChange('issuing_bank')} />
                    </Grid>
                    <Grid item xs={12} sm={3}>
                        <TextField fullWidth label="L/C No. and Date" value={data.lc_no_and_date || ''} onChange={handleChange('lc_no_and_date')} />
                    </Grid>
                </Grid>
            </Paper>

            <Paper sx={{ p: 2, mb: 2 }}>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>Product</Typography>
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
                        <TextField fullWidth label="Net Weight" type="number" value={data.net_weight || ''} onChange={handleChange('net_weight')} />
                    </Grid>
                    <Grid item xs={12} sm={2}>
                        <TextField fullWidth label="Nett Weight" value={data.nett_weight || ''} onChange={handleChange('nett_weight')} />
                    </Grid>
                    <Grid item xs={12} sm={2}>
                        <TextField fullWidth label="Total Packages" value={data.total_packages || ''} onChange={handleChange('total_packages')} />
                    </Grid>
                    <Grid item xs={12} sm={2}>
                        <TextField fullWidth label="Unit 1 (Net Weight)" value={data.unit_1 || ''} onChange={handleChange('unit_1')} />
                    </Grid>
                    <Grid item xs={12} sm={2}>
                        <TextField fullWidth label="Unit 2 (Total Packages)" value={data.unit_2 || ''} onChange={handleChange('unit_2')} />
                    </Grid>
                    <Grid item xs={12} sm={2}>
                        <TextField select fullWidth label="UOM" value={data.uom || ''} onChange={handleChange('uom')}>
                            <MenuItem value="MT">MT</MenuItem>
                            <MenuItem value="KG">KG</MenuItem>
                            <MenuItem value="LTR">LTR</MenuItem>
                        </TextField>
                    </Grid>
                    <Grid item xs={12} sm={2}>
                        <TextField fullWidth label="Lot No." value={data.lot_no || ''} onChange={handleChange('lot_no')} />
                    </Grid>
                    <Grid item xs={12} sm={2}>
                        <TextField fullWidth label="Unit Rate" value={data.unit_rate || ''} onChange={handleChange('unit_rate')} />
                    </Grid>
                </Grid>
            </Paper>

            <Paper sx={{ p: 2, mb: 2 }}>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>Pricing</Typography>
                <Grid container spacing={2}>
                    <Grid item xs={12} sm={4}>
                        <TextField fullWidth label="FOB Amount" value={data.fob_amount || ''} onChange={handleChange('fob_amount')} />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                        <TextField fullWidth label="Freight Amount" value={data.freight_amount || ''} onChange={handleChange('freight_amount')} />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                        <TextField fullWidth label="Total Amount" value={data.total_amount || ''} onChange={handleChange('total_amount')} />
                    </Grid>
                </Grid>
            </Paper>

            <Paper sx={{ p: 2, mb: 2 }}>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>Bank Details</Typography>
                <Grid container spacing={2}>
                    <Grid item xs={12} sm={3}>
                        <TextField fullWidth label="Account Name" value={data.account_name || ''} onChange={handleChange('account_name')} />
                    </Grid>
                    <Grid item xs={12} sm={3}>
                        <TextField fullWidth label="Bank Name" value={data.bank_name || ''} onChange={handleChange('bank_name')} />
                    </Grid>
                    <Grid item xs={12} sm={3}>
                        <TextField fullWidth label="Account No." value={data.account_no || ''} onChange={handleChange('account_no')} />
                    </Grid>
                    <Grid item xs={12} sm={3}>
                        <TextField fullWidth label="Swift Code" value={data.swift_code || ''} onChange={handleChange('swift_code')} />
                    </Grid>
                    <Grid item xs={12}>
                        <TextField fullWidth label="Branch" value={data.branch || ''} onChange={handleChange('branch')} />
                    </Grid>
                </Grid>
            </Paper>
        </Box>
    );
}
