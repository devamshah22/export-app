import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Button, Card, CardContent, Grid, TextField,
    Dialog, DialogTitle, DialogContent, DialogActions, InputAdornment,
    IconButton, Menu, MenuItem
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import FolderIcon from '@mui/icons-material/Folder';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { useNavigate } from 'react-router-dom';
import { clientsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function ClientsPage() {
    const { selectedCompany } = useAuth();
    const navigate = useNavigate();
    const [clients, setClients] = useState([]);
    const [filteredClients, setFilteredClients] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingClient, setEditingClient] = useState(null);
    const [menuAnchor, setMenuAnchor] = useState(null);
    const [menuClient, setMenuClient] = useState(null);
    const [formData, setFormData] = useState({
        name: '', address: '', registration_no: '',
        contact_person: '', contact_email: '', contact_mobile: ''
    });

    useEffect(() => {
        if (selectedCompany) loadClients();
    }, [selectedCompany]);

    useEffect(() => {
        const filtered = clients.filter(c =>
            c.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setFilteredClients(filtered);
    }, [searchTerm, clients]);

    const loadClients = async () => {
        try {
            const response = await clientsAPI.getAll(selectedCompany.id);
            setClients(response.data);
            setFilteredClients(response.data);
        } catch (err) {
            console.error('Failed to load clients:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenCreate = () => {
        setEditingClient(null);
        setFormData({ name: '', address: '', registration_no: '', contact_person: '', contact_email: '', contact_mobile: '' });
        setDialogOpen(true);
    };

    const handleOpenEdit = (client) => {
        setMenuAnchor(null);
        setEditingClient(client);
        setFormData({
            name: client.name || '',
            address: client.address || '',
            registration_no: client.registration_no || '',
            contact_person: client.contact_person || '',
            contact_email: client.contact_email || '',
            contact_mobile: client.contact_mobile || ''
        });
        setDialogOpen(true);
    };

    const handleSaveClient = async () => {
        try {
            if (editingClient) {
                await clientsAPI.update(editingClient.id, formData);
            } else {
                await clientsAPI.create({
                    ...formData,
                    company_id: selectedCompany.id
                });
            }
            setDialogOpen(false);
            setEditingClient(null);
            loadClients();
        } catch (err) {
            console.error('Failed to save client:', err);
        }
    };

    const handleDeleteClient = async (client) => {
        setMenuAnchor(null);
        if (!window.confirm(`Delete client "${client.name}"? This cannot be undone.`)) return;
        try {
            await clientsAPI.delete(client.id);
            loadClients();
        } catch (err) {
            alert(err.response?.data?.error || 'Failed to delete client. It may have associated PIs or Masters.');
        }
    };

    const handleMenuOpen = (e, client) => {
        e.stopPropagation();
        setMenuAnchor(e.currentTarget);
        setMenuClient(client);
    };

    const handleMenuClose = () => {
        setMenuAnchor(null);
        setMenuClient(null);
    };

    const handleClientClick = (client) => {
        navigate(`/clients/${client.id}`);
    };

    return (
        <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h5" fontWeight="bold">
                    Clients - {selectedCompany?.name}
                </Typography>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={handleOpenCreate}
                >
                    New Client
                </Button>
            </Box>

            <TextField
                fullWidth
                placeholder="Search clients..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                sx={{ mb: 3 }}
                InputProps={{
                    startAdornment: (
                        <InputAdornment position="start">
                            <SearchIcon />
                        </InputAdornment>
                    )
                }}
            />

            <Grid container spacing={2}>
                {filteredClients.map((client) => (
                    <Grid item xs={12} sm={6} md={4} key={client.id}>
                        <Card sx={{ cursor: 'pointer', '&:hover': { boxShadow: 4 } }}>
                            <CardContent>
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flex: 1, minWidth: 0 }}
                                         onClick={() => handleClientClick(client)}>
                                        <FolderIcon color="primary" />
                                        <Box sx={{ minWidth: 0 }}>
                                            <Typography variant="subtitle1" fontWeight="bold" noWrap>
                                                {client.name}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary" noWrap>
                                                {client.contact_person || 'No contact'}
                                            </Typography>
                                        </Box>
                                    </Box>
                                    <IconButton size="small" onClick={(e) => handleMenuOpen(e, client)}>
                                        <MoreVertIcon fontSize="small" />
                                    </IconButton>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>

            {filteredClients.length === 0 && !loading && (
                <Typography color="text.secondary" align="center" sx={{ mt: 4 }}>
                    {searchTerm ? 'No clients match your search.' : 'No clients yet. Create your first one!'}
                </Typography>
            )}

            {/* Context Menu */}
            <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={handleMenuClose}>
                <MenuItem onClick={() => handleOpenEdit(menuClient)}>
                    <EditIcon fontSize="small" sx={{ mr: 1 }} /> Edit
                </MenuItem>
                <MenuItem onClick={() => handleDeleteClient(menuClient)} sx={{ color: 'error.main' }}>
                    <DeleteIcon fontSize="small" sx={{ mr: 1 }} /> Delete
                </MenuItem>
            </Menu>

            {/* Create/Edit Client Dialog */}
            <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>{editingClient ? 'Edit Client' : 'Create New Client'}</DialogTitle>
                <DialogContent>
                    <TextField
                        fullWidth label="Name" margin="normal" required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                    <TextField
                        fullWidth label="Address" margin="normal" multiline rows={2}
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    />
                    <TextField
                        fullWidth label="Registration No." margin="normal"
                        value={formData.registration_no}
                        onChange={(e) => setFormData({ ...formData, registration_no: e.target.value })}
                    />
                    <TextField
                        fullWidth label="Contact Person" margin="normal"
                        value={formData.contact_person}
                        onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                    />
                    <TextField
                        fullWidth label="Contact Email" margin="normal" type="email"
                        value={formData.contact_email}
                        onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                    />
                    <TextField
                        fullWidth label="Contact Mobile No." margin="normal"
                        value={formData.contact_mobile}
                        onChange={(e) => setFormData({ ...formData, contact_mobile: e.target.value })}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
                    <Button variant="contained" onClick={handleSaveClient} disabled={!formData.name}>
                        {editingClient ? 'Save Changes' : 'Create Client'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
