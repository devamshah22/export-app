import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Button, Grid, TextField, MenuItem, Paper, Divider,
    Dialog, DialogTitle, DialogContent, DialogActions
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useNavigate, useParams } from 'react-router-dom';
import { piAPI, clientsAPI, companiesAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const DEFAULT_TERMS = `1) Any Bank charges outside India will be to consignee Account.
2) Price per kg is net receivable to us. Irrelevant to any bank settlement charges, advising charges, third party banks charges outside india, confirmation fee etc.
3) All Quantity under this proforma will have single BL and Single CRIA certificate.
4) Consignee is requested to send the draft L/c for consignor confirmation before final transmission.`;

export default function PIFormPage() {
    const { selectedCompany } = useAuth();
    const navigate = useNavigate();
    const { id } = useParams();
    const isEdit = !!id;

    const [clients, setClients] = useState([]);
    const [bankAccounts, setBankAccounts] = useState([]);
    const [saving, setSaving] = useState(false);
    const [bankDialogOpen, setBankDialogOpen] = useState(false);
    const [bankFormData, setBankFormData] = useState({
        bank_name: '', account_name: '', account_no: '', branch_address: '', swift_code: ''
    });
    const [formData, setFormData] = useState({
        client_id: '',
        pi_date: new Date().toISOString().split('T')[0],
        currency: 'USD',
        incoterms: '',
        payment_terms: '',
        country_of_origin: 'India',
        country_of_discharge: '',
        port_of_loading: '',
        port_of_discharge: '',
        consignee_name: '',
        consignee_address: '',
        product_name: '',
        hs_code: '',
        un_number: '',
        description: '',
        packing_type: '',
        bag_weight: '',
        gross_weight: '',
        tare_weight: '',
        net_weight: '',
        lot_no: '',
        bag_no: '',
        no_kind_of_packages: '',
        total_quantity: '',
        uom: 'MT',
        unit_rate: '',
        fob_amount: '',
        freight_amount: '',
        total_amount: '',
        company_bank_id: '',
        buyer_name: '',
        buyer_address: '',
        delivery_date: '',
        terms_conditions: DEFAULT_TERMS
    });

    useEffect(() => {
        if (selectedCompany) loadInitialData();
    }, [selectedCompany]);

    useEffect(() => {
        if (isEdit) loadPI();
    }, [id]);

    // Gross Weight = Net Weight + Tare Weight
    useEffect(() => {
        const net = parseFloat(formData.net_weight);
        const tare = parseFloat(formData.tare_weight);
        const grossWeight = Number.isFinite(net) && Number.isFinite(tare)
            ? (net + tare).toFixed(3)
            : '';
        setFormData(prev => prev.gross_weight === grossWeight ? prev : { ...prev, gross_weight: grossWeight });
    }, [formData.net_weight, formData.tare_weight]);

    // Auto-calculate total amount
    useEffect(() => {
        const fob = parseFloat(formData.fob_amount) || 0;
        const freight = parseFloat(formData.freight_amount) || 0;
        if (fob || freight) {
            setFormData(prev => ({ ...prev, total_amount: (fob + freight).toString() }));
        }
    }, [formData.fob_amount, formData.freight_amount]);

    const loadInitialData = async () => {
        try {
            const [clientRes, bankRes] = await Promise.all([
                clientsAPI.getAll(selectedCompany.id),
                companiesAPI.getBankAccounts(selectedCompany.id)
            ]);
            setClients(clientRes.data);
            setBankAccounts(bankRes.data);

            // Set default bank
            const defaultBank = bankRes.data.find(b => b.is_default);
            if (defaultBank && !isEdit) {
                setFormData(prev => ({ ...prev, company_bank_id: defaultBank.id }));
            }
        } catch (err) {
            console.error('Failed to load data:', err);
        }
    };

    const loadPI = async () => {
        try {
            const response = await piAPI.getById(id);
            const pi = response.data;
            setFormData({
                client_id: pi.client_id || '',
                pi_date: pi.pi_date ? pi.pi_date.split('T')[0] : '',
                currency: pi.currency || 'USD',
                incoterms: pi.incoterms || '',
                payment_terms: pi.payment_terms || '',
                country_of_origin: pi.country_of_origin || 'India',
                country_of_discharge: pi.country_of_discharge || '',
                port_of_loading: pi.port_of_loading || '',
                port_of_discharge: pi.port_of_discharge || '',
                consignee_name: pi.consignee_name || '',
                consignee_address: pi.consignee_address || '',
                product_name: pi.product_name || '',
                hs_code: pi.hs_code || '',
                un_number: pi.un_number || '',
                description: pi.description || '',
                packing_type: pi.packing_type || '',
                bag_weight: pi.bag_weight || '',
                gross_weight: pi.gross_weight || '',
                tare_weight: pi.tare_weight || '',
                net_weight: pi.net_weight || '',
                lot_no: pi.lot_no || '',
                bag_no: pi.bag_no || '',
                no_kind_of_packages: pi.no_kind_of_packages || '',
                total_quantity: pi.total_quantity || '',
                uom: pi.uom || 'MT',
                unit_rate: pi.unit_rate || '',
                fob_amount: pi.fob_amount || '',
                freight_amount: pi.freight_amount || '',
                total_amount: pi.total_amount || '',
                company_bank_id: pi.company_bank_id || '',
                buyer_name: pi.buyer_name || '',
                buyer_address: pi.buyer_address || '',
                delivery_date: pi.delivery_date ? pi.delivery_date.split('T')[0] : '',
                terms_conditions: pi.terms_conditions || ''
            });
        } catch (err) {
            console.error('Failed to load PI:', err);
        }
    };

    const handleChange = (field) => (e) => {
        const newData = { ...formData, [field]: e.target.value };

        // Auto-fill consignee when client is selected
        if (field === 'client_id') {
            const selectedClient = clients.find(c => c.id === parseInt(e.target.value));
            if (selectedClient) {
                newData.consignee_name = selectedClient.name;
                newData.consignee_address = selectedClient.address || '';
            }
        }

        setFormData(newData);
    };

    const handleAddBank = async () => {
        try {
            const response = await companiesAPI.addBankAccount(selectedCompany.id, bankFormData);
            setBankAccounts([...bankAccounts, response.data]);
            setFormData({ ...formData, company_bank_id: response.data.id.toString() });
            setBankDialogOpen(false);
            setBankFormData({ bank_name: '', account_name: '', account_no: '', branch_address: '', swift_code: '' });
        } catch (err) {
            console.error('Failed to add bank account:', err);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const payload = {
                ...formData,
                company_id: selectedCompany.id,
                bag_weight: formData.bag_weight ? parseFloat(parseFloat(formData.bag_weight).toFixed(3)) : null,
                gross_weight: formData.gross_weight ? parseFloat(parseFloat(formData.gross_weight).toFixed(3)) : null,
                tare_weight: formData.tare_weight ? parseFloat(parseFloat(formData.tare_weight).toFixed(3)) : null,
                net_weight: formData.net_weight ? parseFloat(parseFloat(formData.net_weight).toFixed(3)) : null,
                total_quantity: formData.total_quantity ? parseFloat(parseFloat(formData.total_quantity).toFixed(3)) : null,
                unit_rate: formData.unit_rate ? parseFloat(parseFloat(formData.unit_rate).toFixed(3)) : null,
                fob_amount: formData.fob_amount ? parseFloat(parseFloat(formData.fob_amount).toFixed(3)) : null,
                freight_amount: formData.freight_amount ? parseFloat(parseFloat(formData.freight_amount).toFixed(3)) : null,
                total_amount: formData.total_amount ? parseFloat(parseFloat(formData.total_amount).toFixed(3)) : null,
            };

            if (isEdit) {
                await piAPI.update(id, payload);
            } else {
                await piAPI.create(payload);
            }
            navigate('/pi');
        } catch (err) {
            console.error('Failed to save PI:', err);
        } finally {
            setSaving(false);
        }
    };

    return (
        <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/pi')}>
                        Back
                    </Button>
                    <Typography variant="h5" fontWeight="bold">
                        {isEdit ? 'Edit Proforma Invoice' : 'New Proforma Invoice'}
                    </Typography>
                </Box>
                <Button
                    variant="contained"
                    startIcon={<SaveIcon />}
                    onClick={handleSave}
                    disabled={saving || !formData.client_id || !formData.pi_date}
                >
                    {saving ? 'Saving...' : 'Save'}
                </Button>
            </Box>

            <Paper sx={{ p: 3 }}>
                {/* Basic Info */}
                <Typography variant="h6" gutterBottom>Basic Information</Typography>
                <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                        <TextField
                            select fullWidth label="Client" required
                            value={formData.client_id}
                            onChange={handleChange('client_id')}
                        >
                            {clients.map(c => (
                                <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
                            ))}
                        </TextField>
                    </Grid>
                    <Grid item xs={12} sm={3}>
                        <TextField
                            fullWidth label="PI Date" type="date" required
                            value={formData.pi_date}
                            onChange={handleChange('pi_date')}
                            InputLabelProps={{ shrink: true }}
                        />
                    </Grid>
                    <Grid item xs={12} sm={3}>
                        <TextField
                            select fullWidth label="Currency" required
                            value={formData.currency}
                            onChange={handleChange('currency')}
                        >
                            <MenuItem value="USD">USD - US Dollar</MenuItem>
                            <MenuItem value="AED">AED - UAE Dirham</MenuItem>
                            <MenuItem value="EUR">EUR - Euro</MenuItem>
                        </TextField>
                    </Grid>
                </Grid>

                <Divider sx={{ my: 3 }} />

                {/* Terms */}
                <Typography variant="h6" gutterBottom>Terms</Typography>
                <Grid container spacing={2}>
                    <Grid item xs={12} sm={4}>
                        <TextField
                            fullWidth label="Incoterms"
                            value={formData.incoterms}
                            onChange={handleChange('incoterms')}
                            placeholder="e.g., CFR, APAPA, Lagos, Nigeria"
                        />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                        <TextField
                            fullWidth label="Payment Terms"
                            value={formData.payment_terms}
                            onChange={handleChange('payment_terms')}
                            placeholder="e.g., L/C at Sight"
                        />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                        <TextField
                            fullWidth label="Delivery Date" type="date"
                            value={formData.delivery_date}
                            onChange={handleChange('delivery_date')}
                            InputLabelProps={{ shrink: true }}
                        />
                    </Grid>
                </Grid>

                <Divider sx={{ my: 3 }} />

                {/* Country & Port */}
                <Typography variant="h6" gutterBottom>Country & Port</Typography>
                <Grid container spacing={2}>
                    <Grid item xs={12} sm={3}>
                        <TextField
                            fullWidth label="Country of Origin"
                            value={formData.country_of_origin}
                            onChange={handleChange('country_of_origin')}
                        />
                    </Grid>
                    <Grid item xs={12} sm={3}>
                        <TextField
                            fullWidth label="Country of Discharge"
                            value={formData.country_of_discharge}
                            onChange={handleChange('country_of_discharge')}
                        />
                    </Grid>
                    <Grid item xs={12} sm={3}>
                        <TextField
                            fullWidth label="Port of Loading"
                            value={formData.port_of_loading}
                            onChange={handleChange('port_of_loading')}
                            placeholder="e.g., Nhava Sheva or Hazira, India"
                        />
                    </Grid>
                    <Grid item xs={12} sm={3}>
                        <TextField
                            fullWidth label="Port of Discharge"
                            value={formData.port_of_discharge}
                            onChange={handleChange('port_of_discharge')}
                            placeholder="e.g., Apapa, Lagos, Nigeria"
                        />
                    </Grid>
                </Grid>

                <Divider sx={{ my: 3 }} />

                {/* Consignee */}
                <Typography variant="h6" gutterBottom>Consignee</Typography>
                <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                        <TextField
                            fullWidth label="Consignee Name"
                            value={formData.consignee_name}
                            onChange={handleChange('consignee_name')}
                            helperText="Auto-filled from client. Edit if different."
                        />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField
                            fullWidth label="Consignee Address"
                            value={formData.consignee_address}
                            onChange={handleChange('consignee_address')}
                            multiline rows={2}
                        />
                    </Grid>
                </Grid>

                <Divider sx={{ my: 3 }} />

                {/* Product Details */}
                <Typography variant="h6" gutterBottom>Product Details</Typography>
                <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                        <TextField
                            fullWidth label="Product Name"
                            value={formData.product_name}
                            onChange={handleChange('product_name')}
                            placeholder="e.g., PARA DICHLORO BENZENE (PDCB)"
                        />
                    </Grid>
                    <Grid item xs={12} sm={3}>
                        <TextField
                            fullWidth label="HS Code"
                            value={formData.hs_code}
                            onChange={handleChange('hs_code')}
                        />
                    </Grid>
                    <Grid item xs={12} sm={3}>
                        <TextField
                            fullWidth label="Packing Type"
                            value={formData.packing_type}
                            onChange={handleChange('packing_type')}
                            placeholder="e.g., PAPER FABRIC BAGS"
                        />
                    </Grid>
                    <Grid item xs={12} sm={3}>
                        <TextField
                            fullWidth label="UN No."
                            value={formData.un_number}
                            onChange={handleChange('un_number')}
                            placeholder="e.g., 3077"
                        />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField
                            fullWidth label="Description"
                            value={formData.description}
                            onChange={handleChange('description')}
                            placeholder="e.g., Non-Palletised, UN approved Bags"
                        />
                    </Grid>
                    <Grid item xs={12} sm={3}>
                        <TextField
                            fullWidth label="No. & Kind of Packages"
                            value={formData.no_kind_of_packages}
                            onChange={handleChange('no_kind_of_packages')}
                            placeholder="e.g., 25Kgs X 3360nos"
                        />
                    </Grid>
                    <Grid item xs={12} sm={2}>
                        <TextField
                            fullWidth label="Gross Weight (Net + Tare)"
                            value={formData.gross_weight}
                            InputProps={{ readOnly: true }}
                        />
                    </Grid>
                    <Grid item xs={12} sm={2}>
                        <TextField
                            fullWidth label="Tare Weight"
                            type="number"
                            value={formData.tare_weight}
                            onChange={handleChange('tare_weight')}
                        />
                    </Grid>
                    <Grid item xs={12} sm={2}>
                        <TextField
                            fullWidth label="Net Weight"
                            type="number"
                            value={formData.net_weight}
                            onChange={handleChange('net_weight')}
                        />
                    </Grid>
                    <Grid item xs={12} sm={2}>
                        <TextField
                            fullWidth label="Lot No."
                            value={formData.lot_no}
                            onChange={handleChange('lot_no')}
                        />
                    </Grid>
                    <Grid item xs={12} sm={2}>
                        <TextField
                            fullWidth label="Bag No."
                            value={formData.bag_no}
                            onChange={handleChange('bag_no')}
                            placeholder="e.g., 0001 TO 3360"
                        />
                    </Grid>
                    <Grid item xs={12} sm={2}>
                        <TextField
                            fullWidth label="Total Qty"
                            type="number"
                            value={formData.total_quantity}
                            onChange={handleChange('total_quantity')}
                        />
                    </Grid>
                    <Grid item xs={12} sm={2}>
                        <TextField
                            select fullWidth label="UOM"
                            value={formData.uom}
                            onChange={handleChange('uom')}
                        >
                            <MenuItem value="MT">MT</MenuItem>
                            <MenuItem value="KG">KG</MenuItem>
                            <MenuItem value="LTR">LTR</MenuItem>
                        </TextField>
                    </Grid>
                </Grid>

                <Divider sx={{ my: 3 }} />

                {/* Pricing */}
                <Typography variant="h6" gutterBottom>Pricing ({formData.currency})</Typography>
                <Grid container spacing={2}>
                    <Grid item xs={12} sm={3}>
                        <TextField
                            fullWidth label="Unit Rate"
                            type="number"
                            value={formData.unit_rate}
                            onChange={handleChange('unit_rate')}
                        />
                    </Grid>
                    <Grid item xs={12} sm={3}>
                        <TextField
                            fullWidth label="FOB Amount"
                            type="number"
                            value={formData.fob_amount}
                            onChange={handleChange('fob_amount')}
                        />
                    </Grid>
                    <Grid item xs={12} sm={3}>
                        <TextField
                            fullWidth label="Freight Amount"
                            type="number"
                            value={formData.freight_amount}
                            onChange={handleChange('freight_amount')}
                        />
                    </Grid>
                    <Grid item xs={12} sm={3}>
                        <TextField
                            fullWidth label="Total Amount (CFR/CIF)"
                            type="number"
                            value={formData.total_amount}
                            onChange={handleChange('total_amount')}
                            InputProps={{ readOnly: true }}
                        />
                    </Grid>
                </Grid>

                <Divider sx={{ my: 3 }} />

                {/* Bank Details */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h6" gutterBottom>Bank Details</Typography>
                    <Button size="small" onClick={() => setBankDialogOpen(true)}>+ Add New Bank</Button>
                </Box>
                <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                        <TextField
                            select fullWidth label="Select Bank Account"
                            value={formData.company_bank_id}
                            onChange={handleChange('company_bank_id')}
                        >
                            {bankAccounts.map(b => (
                                <MenuItem key={b.id} value={b.id}>
                                    {b.bank_name} - {b.account_no}
                                </MenuItem>
                            ))}
                        </TextField>
                    </Grid>
                    {formData.company_bank_id && (() => {
                        const bank = bankAccounts.find(b => b.id === parseInt(formData.company_bank_id));
                        if (!bank) return null;
                        return (
                            <>
                                <Grid item xs={12} sm={6}></Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField fullWidth label="NAME" value={bank.bank_name || ''} InputProps={{ readOnly: true }} />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField fullWidth label="ACCOUNT NO" value={bank.account_no || ''} InputProps={{ readOnly: true }} />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField fullWidth label="SWIFT CODE" value={bank.swift_code || ''} InputProps={{ readOnly: true }} />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField fullWidth label="ADDRESS" value={bank.branch_address || ''} InputProps={{ readOnly: true }} multiline rows={2} />
                                </Grid>
                            </>
                        );
                    })()}
                </Grid>

                <Divider sx={{ my: 3 }} />

                {/* Terms & Conditions */}
                <Typography variant="h6" gutterBottom>Terms & Conditions</Typography>
                <TextField
                    fullWidth multiline rows={6}
                    value={formData.terms_conditions}
                    onChange={handleChange('terms_conditions')}
                    helperText="Pre-filled with default terms. Edit as needed."
                />
            </Paper>

            {/* Add Bank Account Dialog */}
            <Dialog open={bankDialogOpen} onClose={() => setBankDialogOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Add New Bank Account</DialogTitle>
                <DialogContent>
                    <TextField
                        fullWidth label="Bank Name" margin="normal" required
                        value={bankFormData.bank_name}
                        onChange={(e) => setBankFormData({ ...bankFormData, bank_name: e.target.value })}
                    />
                    <TextField
                        fullWidth label="Account Name" margin="normal"
                        value={bankFormData.account_name}
                        onChange={(e) => setBankFormData({ ...bankFormData, account_name: e.target.value })}
                    />
                    <TextField
                        fullWidth label="Account No." margin="normal" required
                        value={bankFormData.account_no}
                        onChange={(e) => setBankFormData({ ...bankFormData, account_no: e.target.value })}
                    />
                    <TextField
                        fullWidth label="Swift Code" margin="normal"
                        value={bankFormData.swift_code}
                        onChange={(e) => setBankFormData({ ...bankFormData, swift_code: e.target.value })}
                    />
                    <TextField
                        fullWidth label="Branch Address" margin="normal" multiline rows={2}
                        value={bankFormData.branch_address}
                        onChange={(e) => setBankFormData({ ...bankFormData, branch_address: e.target.value })}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setBankDialogOpen(false)}>Cancel</Button>
                    <Button variant="contained" onClick={handleAddBank} disabled={!bankFormData.bank_name || !bankFormData.account_no}>
                        Add Bank Account
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
