import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, Grid, TextField, Paper } from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import { clientsAPI } from '../../services/api';
import useDocumentOverrides from './useDocumentOverrides';
import { useAuth } from '../../context/AuthContext';
import SearchableDropdown from '../SearchableDropdown';

export default function MFGDocForm({ data, onChange, onSave, onDownloadPDF, conflictDraft }) {
    const { selectedCompany } = useAuth();
    const [overrides, setOverrides] = useDocumentOverrides(data, 'MFG_CERTI', conflictDraft);
    const [clients, setClients] = useState([]);

    useEffect(() => {
        if (selectedCompany) {
            clientsAPI.getAll(selectedCompany.id).then(res => setClients(res.data)).catch(() => {});
        }
    }, [selectedCompany]);

    const getField = (key, defaultValue) => overrides[key] !== undefined ? overrides[key] : defaultValue;
    const setField = (key, value) => setOverrides({ ...overrides, [key]: value });

    const defaultCertify = `This is to certify that the goods are of India origin and the goods are produced to ISO 9001: 2015 standards. The goods are considered fit for sale anywhere in the world`;
    const defaultGoodsDesc = data.product_name || '';

    const handleSave = async () => {
        await onSave({ fields: data, overrides });
    };

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h5" fontWeight="bold">Manufacturer's Certificate</Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button variant="outlined" startIcon={<PictureAsPdfIcon />} onClick={onDownloadPDF}>Download PDF</Button>
                    <Button variant="contained" startIcon={<SaveIcon />} onClick={handleSave}>Save</Button>
                </Box>
            </Box>

            <Paper sx={{ p: 2, mb: 2 }}>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>To (Buyer)</Typography>
                <Grid container spacing={2}>
                    <Grid item xs={12} sm={4}>
                        <SearchableDropdown
                            label="Select Buyer"
                            options={clients}
                            value={data.buyer_id}
                            onChange={(option) => {
                                if (option) {
                                    onChange({ ...data, buyer_name: option.name, buyer_address: option.address || '', buyer_id: option.id });
                                }
                            }}
                        />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                        <TextField fullWidth label="Buyer Name" value={data.buyer_name || ''} onChange={(e) => onChange({ ...data, buyer_name: e.target.value })} />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                        <TextField fullWidth label="Buyer Address" value={data.buyer_address || ''} onChange={(e) => onChange({ ...data, buyer_address: e.target.value })} multiline rows={2} />
                    </Grid>
                </Grid>
            </Paper>

            <Paper sx={{ p: 2, mb: 2 }}>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>Certification Text</Typography>
                <TextField
                    fullWidth multiline rows={3}
                    value={getField('certify_text', defaultCertify)}
                    onChange={(e) => setField('certify_text', e.target.value)}
                />
            </Paper>

            <Paper sx={{ p: 2, mb: 2 }}>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>Details</Typography>
                <Grid container spacing={2}>
                    <Grid item xs={12}>
                        <TextField
                            fullWidth label="Description of Goods" multiline rows={2}
                            value={getField('goods_description', defaultGoodsDesc)}
                            onChange={(e) => setField('goods_description', e.target.value)}
                        />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField fullWidth label='Form "M" No.' value={data.other_ref || ''} InputProps={{ readOnly: true }} />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField fullWidth label="L/C No." value={data.lc_no_and_date || ''} InputProps={{ readOnly: true }} />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                        <TextField fullWidth label="Lot No." value={data.lot_no || ''} InputProps={{ readOnly: true }} />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                        <TextField fullWidth label="Manufacturing Date" value={data.mfg_date ? new Date(data.mfg_date).toLocaleDateString('en-GB') : ''} InputProps={{ readOnly: true }} />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                        <TextField fullWidth label="Expiry Date" value={data.expiry_date ? new Date(data.expiry_date).toLocaleDateString('en-GB') : ''} InputProps={{ readOnly: true }} />
                    </Grid>
                </Grid>
            </Paper>
        </Box>
    );
}
