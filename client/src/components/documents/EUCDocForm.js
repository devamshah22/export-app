import React from 'react';
import { Box, Typography, Button, Grid, TextField, Paper } from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import useDocumentOverrides from './useDocumentOverrides';

export default function EUCDocForm({ data, onSave, onDownloadPDF, conflictDraft }) {
    const [overrides, setOverrides] = useDocumentOverrides(data, 'EUC', conflictDraft);

    const getField = (key, defaultValue) => overrides[key] !== undefined ? overrides[key] : defaultValue;
    const setField = (key, value) => setOverrides({ ...overrides, [key]: value });

    const defaultDecl1 = `The above Product is not under APPENDIX-3 - SCOMET list nor NDPSACT, 1985. Also it is not used for Drugs and Pharmaceuticals purpose.`;
    const defaultDecl2 = `We request you to kindly allow export of this goods.`;

    const handleSave = async () => {
        await onSave({ overrides });
    };

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h5" fontWeight="bold">End Use Certificate (EUC)</Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button variant="outlined" startIcon={<PictureAsPdfIcon />} onClick={onDownloadPDF}>Download PDF</Button>
                    <Button variant="contained" startIcon={<SaveIcon />} onClick={handleSave}>Save</Button>
                </Box>
            </Box>

            <Paper sx={{ p: 2, mb: 2 }}>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>Parties</Typography>
                <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                        <TextField fullWidth label="Supplier" value={data.consignor_name || ''} InputProps={{ readOnly: true }} />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField fullWidth label="Buyer" value={data.buyer_name || ''} InputProps={{ readOnly: true }} />
                    </Grid>
                </Grid>
            </Paper>

            <Paper sx={{ p: 2, mb: 2 }}>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>Goods Details</Typography>
                <Grid container spacing={2}>
                    <Grid item xs={12} sm={4}>
                        <TextField fullWidth label="Product Description" value={data.product_name || ''} InputProps={{ readOnly: true }} />
                    </Grid>
                    <Grid item xs={12} sm={2}>
                        <TextField fullWidth label="UOM" value={data.uom || ''} InputProps={{ readOnly: true }} />
                    </Grid>
                    <Grid item xs={12} sm={2}>
                        <TextField fullWidth label="Quantity" value={data.nett_weight || data.total_quantity || ''} InputProps={{ readOnly: true }} />
                    </Grid>
                    <Grid item xs={12} sm={2}>
                        <TextField fullWidth label="HS Code" value={data.hs_code || ''} InputProps={{ readOnly: true }} />
                    </Grid>
                    <Grid item xs={12} sm={2}>
                        <TextField fullWidth label="Application"
                            value={getField('application', data.application || '')}
                            onChange={(e) => setField('application', e.target.value)}
                            placeholder="e.g., AIR FRESHNER"
                        />
                    </Grid>
                </Grid>
            </Paper>

            <Paper sx={{ p: 2, mb: 2 }}>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>Declaration</Typography>
                <TextField fullWidth multiline rows={4}
                    value={getField('declaration_1', `${defaultDecl1}\n${defaultDecl2}`)}
                    onChange={(e) => setField('declaration_1', e.target.value)}
                />
            </Paper>
        </Box>
    );
}
