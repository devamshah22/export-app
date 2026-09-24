import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Button, Grid, TextField, MenuItem, Card, CardContent,
    Dialog, DialogTitle, DialogContent, DialogActions, Table, TableBody,
    TableCell, TableContainer, TableHead, TableRow, Paper, Chip, IconButton
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DeleteIcon from '@mui/icons-material/Delete';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import { useNavigate } from 'react-router-dom';
import { piAPI, clientsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function PIListPage() {
    const { selectedCompany } = useAuth();
    const navigate = useNavigate();
    const [pis, setPIs] = useState([]);
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [importDialogOpen, setImportDialogOpen] = useState(false);
    const [selectedSourcePI, setSelectedSourcePI] = useState(null);

    useEffect(() => {
        if (selectedCompany) {
            loadData();
        }
    }, [selectedCompany]);

    const loadData = async () => {
        try {
            const [piRes, clientRes] = await Promise.all([
                piAPI.getAll(selectedCompany.id),
                clientsAPI.getAll(selectedCompany.id)
            ]);
            setPIs(piRes.data);
            setClients(clientRes.data);
        } catch (err) {
            console.error('Failed to load data:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleNewPI = () => {
        navigate('/pi/new');
    };

    const handleImportPI = async () => {
        if (!selectedSourcePI) return;
        try {
            const today = new Date();
            const piDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
            const response = await piAPI.import(selectedSourcePI, {
                company_id: selectedCompany.id,
                pi_date: piDate
            });
            setImportDialogOpen(false);
            navigate(`/pi/${response.data.id}/edit`);
        } catch (err) {
            console.error('Failed to import PI:', err);
        }
    };

    const handlePIClick = (pi) => {
        navigate(`/pi/${pi.id}/edit`);
    };

    const handleDeletePI = async (e, pi) => {
        e.stopPropagation();
        if (!window.confirm(`Delete PI ${String(pi.pi_number).padStart(3, '0')}? This cannot be undone.`)) return;
        try {
            await piAPI.delete(pi.id);
            loadData();
        } catch (err) {
            alert(err.response?.data?.error || 'Failed to delete PI');
        }
    };

    const handleDownloadPDF = async (e, pi) => {
        e.stopPropagation();
        try {
            const response = await piAPI.downloadPDF(pi.id);
            const blob = new Blob([response.data], { type: 'application/pdf' });
            const url = window.URL.createObjectURL(blob);
            window.open(url, '_blank');
        } catch (err) {
            alert('Failed to generate PDF');
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'draft': return 'default';
            case 'confirmed': return 'primary';
            case 'converted': return 'success';
            default: return 'default';
        }
    };

    const formatPINumber = (num) => String(num).padStart(3, '0');

    return (
        <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h5" fontWeight="bold">
                    Proforma Invoices
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                        variant="outlined"
                        startIcon={<ContentCopyIcon />}
                        onClick={() => setImportDialogOpen(true)}
                    >
                        Import from Previous PI
                    </Button>
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={handleNewPI}
                    >
                        New PI
                    </Button>
                </Box>
            </Box>

            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell><strong>PI No.</strong></TableCell>
                            <TableCell><strong>Date</strong></TableCell>
                            <TableCell><strong>Client</strong></TableCell>
                            <TableCell><strong>Product</strong></TableCell>
                            <TableCell><strong>Amount</strong></TableCell>
                            <TableCell><strong>Currency</strong></TableCell>
                            <TableCell><strong>Status</strong></TableCell>
                            <TableCell><strong>Actions</strong></TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {pis.map((pi) => (
                            <TableRow
                                key={pi.id}
                                hover
                                sx={{ cursor: 'pointer' }}
                                onClick={() => handlePIClick(pi)}
                            >
                                <TableCell>{formatPINumber(pi.pi_number)}</TableCell>
                                <TableCell>
                                    {pi.pi_date ? new Date(pi.pi_date).toLocaleDateString('en-GB') : '-'}
                                </TableCell>
                                <TableCell>{pi.client_name}</TableCell>
                                <TableCell>{pi.product_name || '-'}</TableCell>
                                <TableCell>{pi.total_amount ? parseFloat(pi.total_amount).toLocaleString() : '-'}</TableCell>
                                <TableCell>{pi.currency}</TableCell>
                                <TableCell>
                                    <Chip label={pi.status} size="small" color={getStatusColor(pi.status)} />
                                </TableCell>
                                <TableCell>
                                    <IconButton size="small" color="primary" onClick={(e) => handleDownloadPDF(e, pi)} title="Download PDF">
                                        <PictureAsPdfIcon fontSize="small" />
                                    </IconButton>
                                    <IconButton size="small" color="error" onClick={(e) => handleDeletePI(e, pi)} title="Delete PI">
                                        <DeleteIcon fontSize="small" />
                                    </IconButton>
                                </TableCell>
                            </TableRow>
                        ))}
                        {pis.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                                    <Typography color="text.secondary">
                                        No Proforma Invoices yet. Create your first one!
                                    </Typography>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Import Dialog */}
            <Dialog open={importDialogOpen} onClose={() => setImportDialogOpen(false)} maxWidth="md" fullWidth>
                <DialogTitle>Import from Previous PI</DialogTitle>
                <DialogContent>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Select a previous PI to copy its data. A new PI will be created with a new number and today's date.
                    </Typography>
                    <TableContainer>
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell></TableCell>
                                    <TableCell>PI No.</TableCell>
                                    <TableCell>Date</TableCell>
                                    <TableCell>Client</TableCell>
                                    <TableCell>Product</TableCell>
                                    <TableCell>Amount</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {pis.map((pi) => (
                                    <TableRow
                                        key={pi.id}
                                        hover
                                        selected={selectedSourcePI === pi.id}
                                        onClick={() => setSelectedSourcePI(pi.id)}
                                        sx={{ cursor: 'pointer' }}
                                    >
                                        <TableCell>
                                            <input
                                                type="radio"
                                                checked={selectedSourcePI === pi.id}
                                                onChange={() => setSelectedSourcePI(pi.id)}
                                            />
                                        </TableCell>
                                        <TableCell>{formatPINumber(pi.pi_number)}</TableCell>
                                        <TableCell>{pi.pi_date ? new Date(pi.pi_date).toLocaleDateString('en-GB') : '-'}</TableCell>
                                        <TableCell>{pi.client_name}</TableCell>
                                        <TableCell>{pi.product_name || '-'}</TableCell>
                                        <TableCell>{pi.currency} {pi.total_amount ? parseFloat(pi.total_amount).toLocaleString() : '-'}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setImportDialogOpen(false)}>Cancel</Button>
                    <Button variant="contained" onClick={handleImportPI} disabled={!selectedSourcePI}>
                        Import & Create New PI
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
