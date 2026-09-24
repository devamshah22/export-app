import React from 'react';
import { Box, Typography, Button, Grid, TextField, Paper, MenuItem } from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import useDocumentOverrides from './useDocumentOverrides';

export default function AnnexureADocForm({ data, onSave, onDownloadPDF, conflictDraft }) {
    const [overrides, setOverrides] = useDocumentOverrides(data, 'ANNEXURE_A', conflictDraft);

    const getField = (key, defaultValue) => overrides[key] !== undefined ? overrides[key] : defaultValue;
    const setField = (key, value) => setOverrides({ ...overrides, [key]: value });

    const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-GB') : '';
    const docDate = formatDate(data.shipping_bill_date || data.ci_invoice_date || data.invoice_date);

    const handleSave = async () => {
        await onSave({ overrides });
    };

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h5" fontWeight="bold">Annexure A - Export Value Declaration</Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button variant="outlined" startIcon={<PictureAsPdfIcon />} onClick={onDownloadPDF}>Download PDF</Button>
                    <Button variant="contained" startIcon={<SaveIcon />} onClick={handleSave}>Save</Button>
                </Box>
            </Box>

            <Paper sx={{ p: 2, mb: 2 }}>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>Reference</Typography>
                <Grid container spacing={2}>
                    <Grid item xs={12} sm={3}>
                        <TextField fullWidth label="Shipping Bill No." value={data.shipping_bill_no || ''} InputProps={{ readOnly: true }} />
                    </Grid>
                    <Grid item xs={12} sm={3}>
                        <TextField fullWidth label="Shipping Bill Date" value={docDate} InputProps={{ readOnly: true }} />
                    </Grid>
                    <Grid item xs={12} sm={3}>
                        <TextField fullWidth label="Invoice No." value={data.ci_invoice_no || data.invoice_no || ''} InputProps={{ readOnly: true }} />
                    </Grid>
                    <Grid item xs={12} sm={3}>
                        <TextField fullWidth label="Invoice Date" value={formatDate(data.ci_invoice_date || data.invoice_date)} InputProps={{ readOnly: true }} />
                    </Grid>
                </Grid>
            </Paper>

            <Paper sx={{ p: 2, mb: 2 }}>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>Details</Typography>
                <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                        <TextField select fullWidth label="Nature of Transaction"
                            value={getField('nature', 'SALES')}
                            onChange={(e) => setField('nature', e.target.value)}>
                            <MenuItem value="SALES">SALES</MenuItem>
                            <MenuItem value="SALES ON CONSIGNMENT BASIS">SALES ON CONSIGNMENT BASIS</MenuItem>
                            <MenuItem value="GIFT">GIFT</MenuItem>
                            <MenuItem value="SAMPLE">SAMPLE</MenuItem>
                            <MenuItem value="OTHER">OTHER</MenuItem>
                        </TextField>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField select fullWidth label="Method of Valuation"
                            value={getField('method', 'Rule 3')}
                            onChange={(e) => setField('method', e.target.value)}>
                            <MenuItem value="NONE"><em>None (leave blank in PDF)</em></MenuItem>
                            <MenuItem value="Rule 3">Rule 3</MenuItem>
                            <MenuItem value="Rule 4">Rule 4</MenuItem>
                            <MenuItem value="Rule 5">Rule 5</MenuItem>
                            <MenuItem value="Rule 6">Rule 6</MenuItem>
                        </TextField>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField fullWidth label="Whether Seller and Buyer Related"
                            value={getField('related', 'Not Applicable')}
                            onChange={(e) => setField('related', e.target.value)} />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField fullWidth label="If Yes, Relationship Influenced Price"
                            value={getField('price', '')}
                            onChange={(e) => setField('price', e.target.value)} />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField fullWidth label="Terms of Payment" value={data.payment_terms || ''} InputProps={{ readOnly: true }} />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField fullWidth label="Terms of Delivery" value={data.incoterms || ''} InputProps={{ readOnly: true }} />
                    </Grid>
                    <Grid item xs={12}>
                        <TextField fullWidth label="Previous Exports (Shipping Bill No. & Date)"
                            value={getField('prev_exports', `${data.shipping_bill_no || ''} Date: ${docDate}`)}
                            onChange={(e) => setField('prev_exports', e.target.value)} />
                    </Grid>
                    <Grid item xs={12}>
                        <TextField fullWidth label="Any Other Relevant Information"
                            value={getField('other_info', '')}
                            onChange={(e) => setField('other_info', e.target.value)} />
                    </Grid>
                </Grid>
            </Paper>

            <Paper sx={{ p: 2, mb: 2 }}>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>Declaration</Typography>
                <Grid container spacing={2}>
                    <Grid item xs={12}>
                        <TextField fullWidth multiline rows={2} label="Declaration 1"
                            value={getField('decl_1', 'We hereby declare that the information furnished above is true, complete and correct in every respect.')}
                            onChange={(e) => setField('decl_1', e.target.value)} />
                    </Grid>
                    <Grid item xs={12}>
                        <TextField fullWidth multiline rows={2} label="Declaration 2"
                            value={getField('decl_2', 'We also undertake to bring to the notice of proper officer any particulars which subsequently come to our knowledge which will have bearing on evaluation')}
                            onChange={(e) => setField('decl_2', e.target.value)} />
                    </Grid>
                </Grid>
            </Paper>

            <Paper sx={{ p: 2, mb: 2 }}>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>Place & Date</Typography>
                <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                        <TextField fullWidth label="Place"
                            value={getField('place', data.company_city || '')}
                            onChange={(e) => setField('place', e.target.value)} />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField fullWidth label="Date" value={formatDate(data.ci_invoice_date || data.invoice_date)} InputProps={{ readOnly: true }} />
                    </Grid>
                </Grid>
            </Paper>
        </Box>
    );
}
