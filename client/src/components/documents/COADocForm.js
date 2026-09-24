import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, Grid, TextField, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';

const DEFAULT_TESTS = [
    { test_name: 'Physical Appearance', specification: 'WHITE CRYSTALINE POWDER', result: '', method: 'Physical Verification' },
    { test_name: 'Metadichlorobenzene', specification: '0.5 % Max', result: '', method: 'BY GAS CHROMOTOGRAPHY' },
    { test_name: 'Paradichlorobenzene', specification: '99.5 % Min', result: '', method: 'BY GAS CHROMOTOGRAPHY' },
    { test_name: 'Orthodichlorobenzene', specification: '0.5 % Max', result: '', method: 'BY GAS CHROMOTOGRAPHY' },
    { test_name: 'Trichlorobenzenes', specification: '0.5 % Max', result: '', method: 'BY GAS CHROMOTOGRAPHY' },
    { test_name: 'Tetra Chloro Benzenes', specification: '0.5 % Max', result: '', method: 'BY GAS CHROMOTOGRAPHY' },
    { test_name: 'Moisture', specification: '500 PPM', result: '', method: 'BY KARL FISCHER' },
];

export default function COADocForm({ data, onChange, onSave, onDownloadPDF, conflictDraft }) {
    const attemptedSave = conflictDraft?.type === 'document' && conflictDraft.document === 'COA'
        ? conflictDraft.saveParts
        : null;
    const attemptedFields = attemptedSave?.fields || null;
    const [tests, setTests] = useState(DEFAULT_TESTS);
    const [mfgDate, setMfgDate] = useState(data.mfg_date || '');
    const [expiryDate, setExpiryDate] = useState(data.expiry_date || '');

    useEffect(() => {
        const nextTests = attemptedSave?.coa_tests ?? data.coa_tests;
        if (Array.isArray(nextTests)) setTests(nextTests.length ? nextTests : DEFAULT_TESTS);
        const nextMfgDate = attemptedFields?.mfg_date ?? data.mfg_date;
        const nextExpiryDate = attemptedFields?.expiry_date ?? data.expiry_date;
        setMfgDate(nextMfgDate ? String(nextMfgDate).split('T')[0] : '');
        setExpiryDate(nextExpiryDate ? String(nextExpiryDate).split('T')[0] : '');
    }, [attemptedSave, attemptedFields, data.coa_tests, data.mfg_date, data.expiry_date]);

    const handleResultChange = (index, value) => {
        const updated = [...tests];
        updated[index] = { ...updated[index], result: value };
        setTests(updated);
    };

    const handleSave = async () => {
        await onSave({
            fields: {
                mfg_date: mfgDate || null,
                expiry_date: expiryDate || null
            },
            coa_tests: tests
        });
    };

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h5" fontWeight="bold">Certificate of Analysis (COA)</Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button variant="outlined" startIcon={<PictureAsPdfIcon />} onClick={onDownloadPDF}>Download PDF</Button>
                    <Button variant="contained" startIcon={<SaveIcon />} onClick={handleSave}>Save</Button>
                </Box>
            </Box>

            <Paper sx={{ p: 2, mb: 2 }}>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>COA Info</Typography>
                <Grid container spacing={2}>
                    <Grid item xs={12} sm={3}>
                        <TextField fullWidth label="COA No." value={data.ci_invoice_no || data.invoice_no || ''} InputProps={{ readOnly: true }} />
                    </Grid>
                    <Grid item xs={12} sm={3}>
                        <TextField fullWidth label="Product" value={data.product_name || ''} InputProps={{ readOnly: true }} />
                    </Grid>
                    <Grid item xs={12} sm={3}>
                        <TextField fullWidth label="Lot No." value={data.lot_no || ''} InputProps={{ readOnly: true }} />
                    </Grid>
                    <Grid item xs={12} sm={3}>
                        <TextField fullWidth label="Date" value={data.ci_invoice_date || data.invoice_date ? new Date(data.ci_invoice_date || data.invoice_date).toLocaleDateString('en-GB') : ''} InputProps={{ readOnly: true }} />
                    </Grid>
                    <Grid item xs={12} sm={3}>
                        <TextField fullWidth label="Quantity" value={`${data.nett_weight || ''} ${data.unit_1 || 'MT'}`} InputProps={{ readOnly: true }} />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                        <TextField fullWidth label="Other Ref" value={data.other_ref || ''} InputProps={{ readOnly: true }} />
                    </Grid>
                    <Grid item xs={12} sm={5}>
                        <TextField fullWidth label="L/c No." value={data.lc_no_and_date || ''} InputProps={{ readOnly: true }} />
                    </Grid>
                </Grid>
            </Paper>

            <Paper sx={{ p: 2, mb: 2 }}>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>Test Results</Typography>
                <TableContainer>
                    <Table size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell><strong>TEST</strong></TableCell>
                                <TableCell><strong>SPECIFICATION</strong></TableCell>
                                <TableCell><strong>RESULT</strong></TableCell>
                                <TableCell><strong>METHOD</strong></TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {tests.map((test, index) => (
                                <TableRow key={index}>
                                    <TableCell>{test.test_name}</TableCell>
                                    <TableCell>{test.specification}</TableCell>
                                    <TableCell>
                                        <TextField
                                            size="small"
                                            fullWidth
                                            value={test.result || ''}
                                            onChange={(e) => handleResultChange(index, e.target.value)}
                                            variant="standard"
                                        />
                                    </TableCell>
                                    <TableCell>{test.method}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>

            <Paper sx={{ p: 2, mb: 2 }}>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>Manufacturing Details</Typography>
                <Grid container spacing={2}>
                    <Grid item xs={12} sm={4}>
                        <TextField fullWidth label="Manufacture Date" type="date" value={mfgDate} onChange={(e) => setMfgDate(e.target.value)} InputLabelProps={{ shrink: true }} />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                        <TextField fullWidth label="Expiry Date" type="date" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} InputLabelProps={{ shrink: true }} />
                    </Grid>
                </Grid>
            </Paper>
        </Box>
    );
}
