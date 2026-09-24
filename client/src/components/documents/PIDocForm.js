import React, { useEffect, useState } from 'react';
import { Box, Typography, Button, Grid, TextField, Paper, Divider } from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';

/**
 * PI Document Form - Proforma Invoice
 * Fields pre-filled from master data, editable
 */
export default function PIDocForm({ data, onChange, onSave, onDownloadPDF, conflictDraft }) {
    const [overrides, setOverrides] = useState(() => (
        conflictDraft?.type === 'document' && conflictDraft.document === 'PI'
            ? conflictDraft.saveParts?.overrides || {}
            : data.overrides?.PI || {}
    ));

    useEffect(() => {
        if (conflictDraft?.type === 'document' && conflictDraft.document === 'PI') {
            setOverrides(conflictDraft.saveParts?.overrides || {});
        } else {
            setOverrides(data.overrides?.PI || {});
        }
    }, [conflictDraft, data.overrides]);

    const getValue = (field, fallback = '') => overrides[field] !== undefined
        ? overrides[field] : (data[field] || fallback);
    const setOverride = (field) => (event) => setOverrides(prev => ({ ...prev, [field]: event.target.value }));

    const netWeight = parseFloat(data.net_weight);
    const tareWeight = parseFloat(data.tare_weight);
    const grossWeight = Number.isFinite(netWeight) && Number.isFinite(tareWeight)
        ? (netWeight + tareWeight).toFixed(3) : '';

    const handleSave = async () => {
        await onSave({ fields: data, overrides });
    };

    const handleChange = (field) => (e) => {
        const next = { ...data, [field]: e.target.value };
        if (field === 'net_weight' || field === 'tare_weight') {
            const net = parseFloat(next.net_weight);
            const tare = parseFloat(next.tare_weight);
            next.total_gross_weight = Number.isFinite(net) && Number.isFinite(tare)
                ? (net + tare).toFixed(3) : '';
        }
        onChange(next);
    };

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h5" fontWeight="bold">Proforma Invoice (PI)</Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button variant="outlined" startIcon={<PictureAsPdfIcon />} onClick={onDownloadPDF}>Download PDF</Button>
                    <Button variant="contained" startIcon={<SaveIcon />} onClick={handleSave}>Save</Button>
                </Box>
            </Box>

            <Paper sx={{ p: 2, mb: 2 }}>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>Exporter</Typography>
                <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                        <TextField fullWidth label="Exporter Name" value={data.consignor_name || ''} onChange={handleChange('consignor_name')} />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField fullWidth label="Exporter Address" value={data.consignor_address || ''} onChange={handleChange('consignor_address')} multiline rows={2} />
                    </Grid>
                </Grid>
            </Paper>

            <Paper sx={{ p: 2, mb: 2 }}>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>Invoice Details</Typography>
                <Grid container spacing={2}>
                    <Grid item xs={12} sm={3}>
                        <TextField fullWidth label="PI Invoice No." value={data.invoice_no || ''} onChange={handleChange('invoice_no')} />
                    </Grid>
                    <Grid item xs={12} sm={3}>
                        <TextField fullWidth label="PI Date" type="date" value={data.invoice_date || ''} onChange={handleChange('invoice_date')} InputLabelProps={{ shrink: true }} />
                    </Grid>
                    <Grid item xs={12} sm={3}>
                        <TextField fullWidth label="Currency" value={data.currency || ''} onChange={handleChange('currency')} />
                    </Grid>
                    <Grid item xs={12} sm={3}>
                        <TextField fullWidth label="Delivery Date" type="date" value={getValue('delivery_date')} onChange={setOverride('delivery_date')} InputLabelProps={{ shrink: true }} />
                    </Grid>
                </Grid>
            </Paper>

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
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>Country & Port</Typography>
                <Grid container spacing={2}>
                    <Grid item xs={12} sm={3}>
                        <TextField fullWidth label="Country of Origin" value={data.country_of_origin || ''} onChange={handleChange('country_of_origin')} />
                    </Grid>
                    <Grid item xs={12} sm={3}>
                        <TextField fullWidth label="Country of Discharge" value={data.country_of_discharge || ''} onChange={handleChange('country_of_discharge')} />
                    </Grid>
                    <Grid item xs={12} sm={3}>
                        <TextField fullWidth label="Port of Loading" value={data.port_of_loading || ''} onChange={handleChange('port_of_loading')} />
                    </Grid>
                    <Grid item xs={12} sm={3}>
                        <TextField fullWidth label="Port of Discharge" value={data.port_of_discharge || ''} onChange={handleChange('port_of_discharge')} />
                    </Grid>
                </Grid>
            </Paper>

            <Paper sx={{ p: 2, mb: 2 }}>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>Terms</Typography>
                <Grid container spacing={2}>
                    <Grid item xs={12} sm={4}>
                        <TextField fullWidth label="Incoterms" value={data.incoterms || ''} onChange={handleChange('incoterms')} />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                        <TextField fullWidth label="Payment Terms" value={data.payment_terms || ''} onChange={handleChange('payment_terms')} />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                        <TextField fullWidth label="Freight Terms" value={data.freight_terms || ''} onChange={handleChange('freight_terms')} />
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
                        <TextField fullWidth label="Bag No." value={getValue('bag_no')} onChange={setOverride('bag_no')} />
                    </Grid>
                    <Grid item xs={12} sm={2}>
                        <TextField fullWidth label="Ref" value={getValue('ref')} onChange={setOverride('ref')} />
                    </Grid>
                    <Grid item xs={12} sm={2}>
                        <TextField fullWidth label="UN No." value={data.un_number || ''} onChange={handleChange('un_number')} />
                    </Grid>
                    <Grid item xs={12} sm={2}>
                        <TextField fullWidth label="Gross Weight (Net + Tare)" value={grossWeight} InputProps={{ readOnly: true }} />
                    </Grid>
                    <Grid item xs={12} sm={2}>
                        <TextField fullWidth label="Tare Weight" value={data.tare_weight || ''} onChange={handleChange('tare_weight')} />
                    </Grid>
                    <Grid item xs={12} sm={2}>
                        <TextField fullWidth label="Net Weight" value={data.net_weight || ''} onChange={handleChange('net_weight')} />
                    </Grid>
                    <Grid item xs={12} sm={2}>
                        <TextField fullWidth label="Lot No." value={data.lot_no || ''} onChange={handleChange('lot_no')} />
                    </Grid>
                    <Grid item xs={12} sm={2}>
                        <TextField fullWidth label="Total Quantity" value={data.nett_weight || ''} onChange={handleChange('nett_weight')} />
                    </Grid>
                    <Grid item xs={12} sm={2}>
                        <TextField fullWidth label="UOM" value={data.uom || ''} onChange={handleChange('uom')} />
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
                        <TextField fullWidth label="Bank Name" value={data.bank_name || ''} onChange={handleChange('bank_name')} />
                    </Grid>
                    <Grid item xs={12} sm={3}>
                        <TextField fullWidth label="Account No." value={data.account_no || ''} onChange={handleChange('account_no')} />
                    </Grid>
                    <Grid item xs={12} sm={3}>
                        <TextField fullWidth label="Swift Code" value={data.swift_code || ''} onChange={handleChange('swift_code')} />
                    </Grid>
                    <Grid item xs={12} sm={3}>
                        <TextField fullWidth label="Branch" value={data.branch || ''} onChange={handleChange('branch')} />
                    </Grid>
                </Grid>
            </Paper>

            <Paper sx={{ p: 2, mb: 2 }}>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>Terms & Conditions</Typography>
                <TextField
                    fullWidth multiline rows={5}
                    value={data.terms_conditions || `1) Any Bank charges outside India will be to consignee Account.\n2) Price per kg is net receivable to us. Irrelevant to any bank settlement charges, advising charges, third party banks charges outside india, confirmation fee etc.\n3) All Quantity under this proforma will have single BL and Single CRIA certificate.\n4) Consignee is requested to send the draft L/c for consignor confirmation before final transmission.`}
                    onChange={handleChange('terms_conditions')}
                />
            </Paper>
        </Box>
    );
}
