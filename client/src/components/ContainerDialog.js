import React, { useState, useEffect } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions, Button, Grid, TextField,
    Typography, IconButton, Box, Paper, MenuItem
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchableDropdown from './SearchableDropdown';

const emptyProduct = {
    product_name: '',
    hs_code: '',
    description: '',
    packing_type: '',
    tare_weight_per_bag: '',
    total_packages: '',
    net_weight: '',
    lot_no: '',
    unit_rate: '',
    uom: 'MT'
};

export default function ContainerDialog({
    open,
    onClose,
    onSave,
    container,
    masterData,
    weighbridges = [],
    conflictDraft,
    saving = false
}) {
    const [formData, setFormData] = useState({
        container_no: '',
        truck_no: '',
        liner_seal_no: '',
        rfid_seal_no: '',
        container_size: '40"',
        tare_weight: '',
        gross_weight: '',
        max_permissible_weight: '32500',
        weighbridge_name: '',
        weighing_method: 'METHOD-1',
        verified_gross_mass: '',
        verified_gross_mass_unit: 'KGS',
        weighing_date: '',
        weighing_slip_no: '',
        cargo_type: 'HAZARDOUS'
    });

    const [products, setProducts] = useState([{ ...emptyProduct }]);
    // Weighing date always mirrors the Master's CI invoice date
    const ciInvoiceDate = masterData?.ci_invoice_date ? String(masterData.ci_invoice_date).split('T')[0] : '';

    useEffect(() => {
        const conflictContainer = conflictDraft?.type === 'container'
            ? conflictDraft.data
            : null;
        const activeContainer = conflictContainer
            ? { ...(container || {}), ...conflictContainer }
            : container;

        if (activeContainer) {
            // Editing existing container or restoring a container conflict draft.
            const matchingWeighbridges = weighbridges.filter(option =>
                option.name === activeContainer.weighbridge_name
            );
            const matchedWeighbridge = activeContainer.weighbridge_id
                ? weighbridges.find(option => option.id === activeContainer.weighbridge_id)
                : matchingWeighbridges.length === 1 ? matchingWeighbridges[0] : null;
            setFormData({
                container_no: activeContainer.container_no || '',
                truck_no: activeContainer.truck_no || '',
                liner_seal_no: activeContainer.liner_seal_no || '',
                rfid_seal_no: activeContainer.rfid_seal_no || '',
                container_size: activeContainer.container_size || '40"',
                tare_weight: activeContainer.tare_weight || '',
                gross_weight: activeContainer.gross_weight || '',
                max_permissible_weight: activeContainer.max_permissible_weight || '32500',
                weighbridge_id: activeContainer.weighbridge_id || matchedWeighbridge?.id || '',
                weighbridge_name: activeContainer.weighbridge_name || matchedWeighbridge?.name || '',
                weighing_method: activeContainer.weighing_method || 'METHOD-1',
                verified_gross_mass: activeContainer.verified_gross_mass || '',
                verified_gross_mass_unit: activeContainer.verified_gross_mass_unit || 'KGS',
                weighing_date: masterData?.ci_invoice_date ? String(masterData.ci_invoice_date).split('T')[0] : (activeContainer.weighing_date ? activeContainer.weighing_date.split('T')[0] : ''),
                weighing_slip_no: activeContainer.weighing_slip_no || '',
                cargo_type: activeContainer.cargo_type || 'HAZARDOUS'
            });
            if (activeContainer.products && activeContainer.products.length > 0) {
                setProducts(activeContainer.products.map(p => ({
                    product_name: p.product_name || '',
                    hs_code: p.hs_code || '',
                    description: p.description || '',
                    packing_type: p.packing_type || '',
                    tare_weight_per_bag: p.tare_weight_per_bag || '',
                    total_packages: p.num_packages ?? p.total_packages ?? '',
                    net_weight: p.net_weight || '',
                    lot_no: p.lot_no || '',
                    unit_rate: p.unit_rate || '',
                    uom: p.uom || 'MT'
                })));
            } else {
                setProducts([]);
            }
        } else {
            // New container - pre-fill from master data
            setFormData({
                container_no: '',
                truck_no: '',
                liner_seal_no: '',
                rfid_seal_no: '',
                container_size: '40"',
                tare_weight: '',
                gross_weight: '',
                max_permissible_weight: '32500',
                weighbridge_name: '',
                weighing_method: 'METHOD-1',
                verified_gross_mass: '',
                verified_gross_mass_unit: 'KGS',
                weighing_date: masterData?.ci_invoice_date ? String(masterData.ci_invoice_date).split('T')[0] : '',
                weighing_slip_no: '',
                cargo_type: 'HAZARDOUS'
            });
            // Pre-fill product from master data
            setProducts([{
                ...emptyProduct,
                product_name: masterData?.product_name || '',
                hs_code: masterData?.hs_code || '',
                description: masterData?.description || '',
                packing_type: masterData?.packing_type || '',
                tare_weight_per_bag: masterData?.tare_weight_per_bag || '',
                unit_rate: masterData?.unit_rate || '',
                uom: masterData?.uom || 'MT',
                lot_no: masterData?.lot_no || ''
            }]);
        }
    }, [container, conflictDraft, masterData, open, weighbridges]);

    const handleChange = (field) => (e) => {
        setFormData({ ...formData, [field]: e.target.value });
    };

    const handleProductChange = (index, field) => (e) => {
        const updated = [...products];
        updated[index] = { ...updated[index], [field]: e.target.value };
        setProducts(updated);
    };

    const addProduct = () => {
        setProducts([...products, { ...emptyProduct }]);
    };

    const removeProduct = (index) => {
        if (products.length === 1) return;
        setProducts(products.filter((_, i) => i !== index));
    };

    const handleSave = () => {
        if (products.some(p => p.total_packages !== '' &&
            (!Number.isSafeInteger(Number(p.total_packages)) || Number(p.total_packages) < 0))) {
            window.alert('Package Count must be a non-negative whole number.');
            return;
        }
        const { weighbridge_id, ...persistedFormData } = formData;
        const payload = {
            ...persistedFormData,
            tare_weight: formData.tare_weight ? parseFloat(formData.tare_weight) : null,
            gross_weight: formData.gross_weight ? parseFloat(formData.gross_weight) : null,
            max_permissible_weight: formData.max_permissible_weight ? parseFloat(formData.max_permissible_weight) : null,
            verified_gross_mass: formData.verified_gross_mass || null,
            weighing_date: ciInvoiceDate || formData.weighing_date || null,
            weighing_time: null,
            products: products.map(p => ({
                ...p,
                tare_weight_per_bag: p.tare_weight_per_bag ? parseFloat(p.tare_weight_per_bag) : null,
                num_packages: p.total_packages !== '' ? Number(p.total_packages) : null,
                total_packages: p.total_packages !== '' ? Number(p.total_packages) : null,
                net_weight: p.net_weight ? parseFloat(p.net_weight) : null,
                unit_rate: p.unit_rate ? parseFloat(p.unit_rate) : null,
            }))
        };
        onSave(payload);
    };

    return (
        <Dialog open={open} onClose={saving ? undefined : onClose} maxWidth="lg" fullWidth>
            <DialogTitle>{container ? 'Edit Container' : 'Add Container'}</DialogTitle>
            <DialogContent component="fieldset" disabled={saving} sx={{ border: 0, minWidth: 0 }}>
                {/* Container Details */}
                <Typography variant="subtitle1" fontWeight="bold" sx={{ mt: 1, mb: 1 }}>
                    Container Details
                </Typography>
                <Grid container spacing={2}>
                    <Grid item xs={12} sm={3}>
                        <TextField fullWidth label="Container No." value={formData.container_no} onChange={handleChange('container_no')} placeholder="e.g., UETU6063230" />
                    </Grid>
                    <Grid item xs={12} sm={3}>
                        <TextField fullWidth label="Truck No." value={formData.truck_no} onChange={handleChange('truck_no')} placeholder="e.g., GJ36T7370" />
                    </Grid>
                    <Grid item xs={12} sm={3}>
                        <TextField fullWidth label="Liner Seal No." value={formData.liner_seal_no} onChange={handleChange('liner_seal_no')} />
                    </Grid>
                    <Grid item xs={12} sm={3}>
                        <TextField fullWidth label="RFID Seal No." value={formData.rfid_seal_no} onChange={handleChange('rfid_seal_no')} />
                    </Grid>
                    <Grid item xs={12} sm={2}>
                        <TextField fullWidth label="Container Size" value={formData.container_size} onChange={handleChange('container_size')} placeholder='e.g., 40"' />
                    </Grid>
                    <Grid item xs={12} sm={2}>
                        <TextField fullWidth label="Tare Weight (kg)" type="number" value={formData.tare_weight} onChange={handleChange('tare_weight')} />
                    </Grid>
                    <Grid item xs={12} sm={2}>
                        <TextField fullWidth label="Gross Weight (kg)" type="number" value={formData.gross_weight} onChange={handleChange('gross_weight')} />
                    </Grid>
                    <Grid item xs={12} sm={2}>
                        <TextField fullWidth label="Max Permissible (kg)" type="number" value={formData.max_permissible_weight} onChange={handleChange('max_permissible_weight')} />
                    </Grid>
                </Grid>

                {/* VGM Details */}
                <Typography variant="subtitle1" fontWeight="bold" sx={{ mt: 3, mb: 1 }}>
                    VGM Details
                </Typography>
                <Grid container spacing={2}>
                    <Grid item xs={12} sm={4}>
                        <SearchableDropdown
                            label="Weighbridge Name"
                            options={weighbridges}
                            value={formData.weighbridge_id}
                            onChange={(option) => {
                                if (option) {
                                    setFormData({ ...formData, weighbridge_name: option.name, weighbridge_id: option.id });
                                }
                            }}
                        />
                    </Grid>
                    <Grid item xs={12} sm={2}>
                        <TextField select fullWidth label="Weighing Method" value={formData.weighing_method} onChange={handleChange('weighing_method')}>
                            <MenuItem value="METHOD-1">METHOD-1</MenuItem>
                            <MenuItem value="METHOD-2">METHOD-2</MenuItem>
                        </TextField>
                    </Grid>
                    <Grid item xs={12} sm={2}>
                        <TextField fullWidth label="Verified Gross Mass" value={formData.verified_gross_mass} onChange={handleChange('verified_gross_mass')} />
                    </Grid>
                    <Grid item xs={12} sm={2}>
                        <TextField select fullWidth label="VGM Unit" value={formData.verified_gross_mass_unit} onChange={handleChange('verified_gross_mass_unit')}>
                            <MenuItem value="KGS">KGS</MenuItem>
                            <MenuItem value="MT">MT</MenuItem>
                            <MenuItem value="LBS">LBS</MenuItem>
                        </TextField>
                    </Grid>
                    <Grid item xs={12} sm={2}>
                        <TextField fullWidth label="Weighing Date (CI Invoice Date)" type="date" value={ciInvoiceDate || formData.weighing_date} InputLabelProps={{ shrink: true }} InputProps={{ readOnly: true }} />
                    </Grid>
                    <Grid item xs={12} sm={2}>
                        <TextField fullWidth label="Weighing Slip No." value={formData.weighing_slip_no} onChange={handleChange('weighing_slip_no')} />
                    </Grid>
                    <Grid item xs={12} sm={2}>
                        <TextField select fullWidth label="Cargo Type" value={formData.cargo_type} onChange={handleChange('cargo_type')}>
                            <MenuItem value="HAZARDOUS">HAZARDOUS</MenuItem>
                            <MenuItem value="Normal">Normal</MenuItem>
                            <MenuItem value="Reefer">Reefer</MenuItem>
                            <MenuItem value="OTHERS">Others</MenuItem>
                        </TextField>
                    </Grid>
                </Grid>

                {/* Products */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 3, mb: 1 }}>
                    <Typography variant="subtitle1" fontWeight="bold">
                        Products in this Container ({products.length})
                    </Typography>
                    <Button size="small" startIcon={<AddIcon />} onClick={addProduct}>
                        Add Product
                    </Button>
                </Box>

                {products.map((product, index) => (
                    <Paper key={index} sx={{ p: 2, mb: 2, bgcolor: '#fafafa' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                            <Typography variant="body2" fontWeight="bold">Product {index + 1}</Typography>
                            {products.length > 1 && (
                                <IconButton size="small" color="error" onClick={() => removeProduct(index)}>
                                    <DeleteIcon fontSize="small" />
                                </IconButton>
                            )}
                        </Box>
                        <Grid container spacing={1.5}>
                            <Grid item xs={12} sm={4}>
                                <TextField fullWidth size="small" label="Product Name" value={product.product_name} onChange={handleProductChange(index, 'product_name')} />
                            </Grid>
                            <Grid item xs={12} sm={2}>
                                <TextField fullWidth size="small" label="HS Code" value={product.hs_code} onChange={handleProductChange(index, 'hs_code')} />
                            </Grid>
                            <Grid item xs={12} sm={3}>
                                <TextField fullWidth size="small" label="Packing Type" value={product.packing_type} onChange={handleProductChange(index, 'packing_type')} />
                            </Grid>
                            <Grid item xs={12} sm={3}>
                                <TextField fullWidth size="small" label="Description" value={product.description} onChange={handleProductChange(index, 'description')} />
                            </Grid>
                            <Grid item xs={6} sm={3}>
                                <TextField fullWidth size="small" label="Package Count" type="number" slotProps={{ htmlInput: { min: 0, step: 1 } }} value={product.total_packages} onChange={handleProductChange(index, 'total_packages')} />
                            </Grid>
                            <Grid item xs={6} sm={2}>
                                <TextField select fullWidth size="small" label="UOM" value={product.uom} onChange={handleProductChange(index, 'uom')}>
                                    <MenuItem value="MT">MT</MenuItem>
                                    <MenuItem value="KG">KG</MenuItem>
                                    <MenuItem value="LTR">LTR</MenuItem>
                                </TextField>
                            </Grid>
                            <Grid item xs={12} sm={3}>
                                <TextField fullWidth size="small" label="Lot No." value={product.lot_no} onChange={handleProductChange(index, 'lot_no')} />
                            </Grid>
                        </Grid>
                    </Paper>
                ))}
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} disabled={saving}>Cancel</Button>
                <Button variant="contained" onClick={handleSave} disabled={saving}>
                    {saving ? 'Saving...' : container ? 'Update Container' : 'Add Container'}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
