import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Button, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, Paper, Chip, Dialog,
    DialogTitle, DialogContent, DialogActions, TextField, IconButton,
    TablePagination
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DeleteIcon from '@mui/icons-material/Delete';
import { useNavigate } from 'react-router-dom';
import { mastersAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function MasterListPage() {
    const { selectedCompany } = useAuth();
    const navigate = useNavigate();
    const [masters, setMasters] = useState([]);
    const [loading, setLoading] = useState(true);
    const [importDialogOpen, setImportDialogOpen] = useState(false);
    const [selectedSourceMaster, setSelectedSourceMaster] = useState(null);

    useEffect(() => {
        if (selectedCompany) loadData();
    }, [selectedCompany]);

    const loadData = async () => {
        try {
            const response = await mastersAPI.getAll(selectedCompany.id);
            setMasters(response.data);
        } catch (err) {
            console.error('Failed to load masters:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleNewMaster = async () => {
        try {
            const response = await mastersAPI.createBlank({ company_id: selectedCompany.id });
            if (response.data && response.data.id) {
                navigate(`/masters/${response.data.id}/edit`);
            } else {
                alert('Master created but no ID returned');
            }
        } catch (err) {
            console.error('Failed to create master:', err);
            alert('Failed to create master: ' + (err.response?.data?.error || err.message));
        }
    };

    const handleImportMaster = async () => {
        if (!selectedSourceMaster) return;
        try {
            const response = await mastersAPI.importFrom(selectedSourceMaster, { company_id: selectedCompany.id });
            setImportDialogOpen(false);
            navigate(`/masters/${response.data.id}/edit`);
        } catch (err) {
            console.error('Failed to import master:', err);
            alert('Failed to import master data');
        }
    };

    const handleMasterClick = (master) => {
        navigate(`/masters/${master.id}/edit`);
    };

    const handleDeleteMaster = async (e, master) => {
        e.stopPropagation();
        const masterLabel = `M_${String(master.master_number || '').padStart(3, '0')}_${master.master_financial_year || ''}`;
        if (!window.confirm(`Delete ${masterLabel}? This will delete all containers and documents. Cannot be undone.`)) return;
        try {
            await mastersAPI.delete(master.id, master.version);
            loadData();
        } catch (err) {
            alert(err.response?.data?.error || 'Failed to delete master');
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'draft': return 'default';
            case 'in_progress': return 'warning';
            case 'dispatched': return 'info';
            case 'completed': return 'success';
            default: return 'default';
        }
    };

    return (
        <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h5" fontWeight="bold">
                    Masters
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                        variant="outlined"
                        startIcon={<ContentCopyIcon />}
                        onClick={() => setImportDialogOpen(true)}
                    >
                        New Master (Import Master Data)
                    </Button>
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={handleNewMaster}
                    >
                        New Master
                    </Button>
                </Box>
            </Box>

            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell><strong>Master No.</strong></TableCell>
                            <TableCell><strong>Client</strong></TableCell>
                            <TableCell><strong>Product</strong></TableCell>
                            <TableCell><strong>Amount</strong></TableCell>
                            <TableCell><strong>Containers</strong></TableCell>
                            <TableCell><strong>Status</strong></TableCell>
                            <TableCell><strong>Actions</strong></TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {masters.map((master) => (
                            <TableRow
                                key={master.id}
                                hover
                                sx={{ cursor: 'pointer' }}
                                onClick={() => handleMasterClick(master)}
                            >
                                <TableCell><strong>M_{String(master.master_number || '').padStart(3, '0')}_{master.master_financial_year || ''}</strong></TableCell>
                                <TableCell>{master.client_name || '-'}</TableCell>
                                <TableCell>{master.product_name || '-'}</TableCell>
                                <TableCell>
                                    {master.currency} {master.total_amount ? parseFloat(master.total_amount).toLocaleString() : '-'}
                                </TableCell>
                                <TableCell>{master.container_count || '-'}</TableCell>
                                <TableCell>
                                    <Chip label={master.status} size="small" color={getStatusColor(master.status)} />
                                </TableCell>
                                <TableCell>
                                    <IconButton size="small" color="error" onClick={(e) => handleDeleteMaster(e, master)} title="Delete Master">
                                        <DeleteIcon fontSize="small" />
                                    </IconButton>
                                </TableCell>
                            </TableRow>
                        ))}
                        {masters.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                                    <Typography color="text.secondary">
                                        No Masters yet. Click "New Master" to create one.
                                    </Typography>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Import Master Dialog */}
            <Dialog open={importDialogOpen} onClose={() => setImportDialogOpen(false)} maxWidth="md" fullWidth>
                <DialogTitle>Import from Previous Master</DialogTitle>
                <DialogContent>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Select a previous Master to copy its data. A new Master will be created with a new number.
                    </Typography>
                    <TableContainer>
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell></TableCell>
                                    <TableCell>Master No.</TableCell>
                                    <TableCell>Client</TableCell>
                                    <TableCell>Product</TableCell>
                                    <TableCell>Amount</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {masters.map((master) => (
                                    <TableRow
                                        key={master.id}
                                        hover
                                        selected={selectedSourceMaster === master.id}
                                        onClick={() => setSelectedSourceMaster(master.id)}
                                        sx={{ cursor: 'pointer' }}
                                    >
                                        <TableCell>
                                            <input
                                                type="radio"
                                                checked={selectedSourceMaster === master.id}
                                                onChange={() => setSelectedSourceMaster(master.id)}
                                            />
                                        </TableCell>
                                        <TableCell>M_{String(master.master_number || '').padStart(3, '0')}_{master.master_financial_year || ''}</TableCell>
                                        <TableCell>{master.client_name || '-'}</TableCell>
                                        <TableCell>{master.product_name || '-'}</TableCell>
                                        <TableCell>{master.currency} {master.total_amount ? parseFloat(master.total_amount).toLocaleString() : '-'}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setImportDialogOpen(false)}>Cancel</Button>
                    <Button variant="contained" onClick={handleImportMaster} disabled={!selectedSourceMaster}>
                        Import & Create New Master
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
