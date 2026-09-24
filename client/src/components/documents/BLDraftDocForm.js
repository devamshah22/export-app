import React from 'react';
import {
    Box, Typography, Button, Grid, TextField, Paper, MenuItem,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import useDocumentOverrides from './useDocumentOverrides';

const DEFAULT_REMARKS = '';

export default function BLDraftDocForm({ data, onChange, onSave, onDownloadPDF, conflictDraft }) {
    const [overrides, setOverrides] = useDocumentOverrides(data, 'BL_DRAFT', conflictDraft);

    const getField = (key, fallback = '') => (
        overrides[key] !== undefined ? overrides[key] : fallback
    );
    const setField = (key) => (event) => {
        setOverrides(prev => ({ ...prev, [key]: event.target.value }));
    };
    const changeMaster = (field) => (event) => {
        onChange({ ...data, [field]: event.target.value });
    };

    const containers = data.containers || [];
    const weightXPackages = `${data.net_weight || ''} KGS X ${data.total_packages || ''} BAGS`;
    const totalNetMt = data.nett_weight || '';
    const totalGrossMt = data.total_gross_weight || '';
    const defaultMarks = 'Product, Gross Wt, Tare wt, Nett Wt, Lot No., Bag No. Mfg Date, Exp Date, "Made In India", UN NO.';
    const consigneeOptions = [{
        key: 'master_consignee',
        label: data.consignee_name || '',
        name: data.consignee_name || '',
        address: data.consignee_address || ''
    }].filter(option => option.name);
    const notifyOptions = [{
        key: 'master_buyer',
        label: data.buyer_name || '',
        name: data.buyer_name || '',
        address: data.buyer_address || ''
    }].filter(option => option.name);
    const selectedConsignee = consigneeOptions.find(option => option.key === getField('consignee_source', 'master_consignee')) || consigneeOptions[0];
    const selectedNotify = notifyOptions.find(option => option.key === getField('notify_party_source', 'master_buyer')) || notifyOptions[0];
    const defaultNotifyTelephone = data.contact_mobile || '';
    const defaultNotifyEmail = data.contact_email || '';
    const defaultForwarding = '';
    const defaultMovement = containers.length
        ? `${containers.length} X ${containers[0].container_size || '40"'} FCL`
        : '';
    const firstContainer = containers[0] || {};
    const firstContainerProducts = firstContainer.products || [];
    const defaultContainerGross = firstContainer.gross_weight || '';
    const defaultContainerNet = firstContainerProducts.reduce(
        (sum, product) => sum + (parseFloat(product.net_weight) || 0),
        0
    ) || ((parseFloat(data.net_weight) || 0) * (parseFloat(data.per_fcl_packages) || 0)) || '';
    const defaultPackagesPerContainer = data.per_fcl_packages || firstContainerProducts.reduce(
        (sum, product) => sum + (parseFloat(product.num_packages) || 0),
        0
    ) || '';
    const blContainerGross = getField('container_gross_weight', defaultContainerGross);
    const blContainerNet = getField('container_net_weight', defaultContainerNet);
    const blPackagesPerContainer = getField('packages_per_container', defaultPackagesPerContainer);
    const numericValue = (value) => {
        const parsed = Number(String(value ?? '').replace(/,/g, '').trim());
        return Number.isFinite(parsed) ? parsed : null;
    };
    const grossPerContainer = numericValue(blContainerGross);
    const netPerContainer = numericValue(blContainerNet);
    const totalContainerGross = containers.length && grossPerContainer !== null
        ? grossPerContainer * containers.length
        : '';
    const totalContainerNet = containers.length && netPerContainer !== null
        ? netPerContainer * containers.length
        : '';

    const handleSave = async () => {
        await onSave({ fields: data, overrides });
    };

    const masterField = (label, field, options = {}) => (
        <TextField
            fullWidth
            label={label}
            value={data[field] || ''}
            onChange={changeMaster(field)}
            {...options}
        />
    );

    const overrideField = (label, field, fallback = '', options = {}) => (
        <TextField
            fullWidth
            label={label}
            value={getField(field, fallback)}
            onChange={setField(field)}
            {...options}
        />
    );

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h5" fontWeight="bold">Bill of Lading Draft</Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button variant="outlined" startIcon={<PictureAsPdfIcon />} onClick={onDownloadPDF}>Download PDF</Button>
                    <Button variant="contained" startIcon={<SaveIcon />} onClick={handleSave}>Save</Button>
                </Box>
            </Box>

            <Paper sx={{ p: 2, mb: 2 }}>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>Parties</Typography>
                <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>{masterField('Shipper Name', 'consignor_name')}</Grid>
                    <Grid item xs={12} sm={6}>{masterField('Shipper Address', 'consignor_address', { multiline: true, rows: 2 })}</Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField select fullWidth label="Consignee Name"
                            value={getField('consignee_source', selectedConsignee?.key || '')}
                            onChange={setField('consignee_source')}
                        >
                            {consigneeOptions.map(option => <MenuItem key={option.key} value={option.key}>{option.label}</MenuItem>)}
                        </TextField>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField fullWidth label="Consignee Address" value={selectedConsignee?.address || ''} InputProps={{ readOnly: true }} multiline rows={2} />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField select fullWidth label="Notify Party"
                            value={getField('notify_party_source', selectedNotify?.key || '')}
                            onChange={setField('notify_party_source')}
                        >
                            {notifyOptions.map(option => <MenuItem key={option.key} value={option.key}>{option.label}</MenuItem>)}
                        </TextField>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField fullWidth label="Notify Party Address" value={selectedNotify?.address || ''} InputProps={{ readOnly: true }} multiline rows={2} />
                    </Grid>
                    <Grid item xs={12} sm={4}>{overrideField('Notify Party Telephone', 'notify_telephone', defaultNotifyTelephone)}</Grid>
                    <Grid item xs={12} sm={4}>{overrideField('Notify Party Email', 'notify_email', defaultNotifyEmail, { type: 'email' })}</Grid>
                    <Grid item xs={12} sm={4}>{overrideField('Notify Party Fax', 'notify_fax')}</Grid>
                    <Grid item xs={12}>{overrideField('Forwarding Details', 'forwarding_details', defaultForwarding, { multiline: true, rows: 2 })}</Grid>
                </Grid>
            </Paper>

            <Paper sx={{ p: 2, mb: 2 }}>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>Routing and References</Typography>
                <Grid container spacing={2}>
                    <Grid item xs={12} sm={4}>{masterField('Vessel / Voyage No.', 'vessel_no')}</Grid>
                    <Grid item xs={12} sm={4}>{overrideField('Place of Delivery', 'place_of_delivery', data.port_of_discharge || '')}</Grid>
                    <Grid item xs={12} sm={4}>{masterField('Port of Loading', 'port_of_loading')}</Grid>
                    <Grid item xs={12} sm={4}>{masterField('Port of Discharge', 'port_of_discharge')}</Grid>
                    <Grid item xs={12} sm={4}>{masterField('Invoice No.', 'ci_invoice_no')}</Grid>
                    <Grid item xs={12} sm={4}>{masterField('Invoice Date', 'ci_invoice_date', { type: 'date', InputLabelProps: { shrink: true } })}</Grid>
                    <Grid item xs={12} sm={4}>{overrideField('Form M No.', 'form_m_no', data.other_ref || '')}</Grid>
                    <Grid item xs={12} sm={6}>{overrideField('L/C No. and Date', 'lc_no_and_date', data.lc_no_and_date || '')}</Grid>
                    <Grid item xs={12} sm={3}>{overrideField('Freight', 'freight', data.freight_terms || 'Freight Prepaid')}</Grid>
                    <Grid item xs={12} sm={3}>{overrideField('Movement', 'movement', defaultMovement)}</Grid>
                    <Grid item xs={12} sm={6}>{overrideField('Total Containers / Package', 'total_containers', defaultMovement)}</Grid>
                </Grid>
            </Paper>

            <Paper sx={{ p: 2, mb: 2 }}>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>Cargo Description</Typography>
                <Grid container spacing={2}>
                    <Grid item xs={12} sm={4}>{masterField('Product', 'product_name')}</Grid>
                    <Grid item xs={12} sm={2}>{masterField('HS Code', 'hs_code')}</Grid>
                    <Grid item xs={12} sm={3}>{masterField('Packing Type', 'packing_type')}</Grid>
                    <Grid item xs={12} sm={3}>{masterField('Lot No.', 'lot_no')}</Grid>
                    <Grid item xs={12} sm={6}>{overrideField('Marks and Numbers', 'marks_and_numbers', defaultMarks, { multiline: true, rows: 3 })}</Grid>
                    <Grid item xs={12} sm={4}>
                        <TextField fullWidth label="Weight X No. of Bags" value={weightXPackages} InputProps={{ readOnly: true }} />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                        <TextField fullWidth label="Total Net (MT)" value={totalNetMt} InputProps={{ readOnly: true }} />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                        <TextField fullWidth label="Total GR WT (MT)" value={totalGrossMt} InputProps={{ readOnly: true }} />
                    </Grid>
                    <Grid item xs={12} sm={4}>{masterField('UN Number', 'un_number')}</Grid>
                    <Grid item xs={12} sm={4}>{masterField('Class', 'imdg_class')}</Grid>
                    <Grid item xs={12} sm={4}>{masterField('Packing Group', 'packing_group')}</Grid>
                </Grid>
            </Paper>

            <Paper sx={{ p: 2, mb: 2 }}>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>Container Details</Typography>
                <Grid container spacing={2} sx={{ mb: 2 }}>
                    <Grid item xs={12} sm={4}>{overrideField('Gross Weight', 'container_gross_weight', defaultContainerGross)}</Grid>
                    <Grid item xs={12} sm={4}>{overrideField('Net Weight', 'container_net_weight', defaultContainerNet)}</Grid>
                    <Grid item xs={12} sm={4}>{overrideField('Packages/Container (Alpha_numeric)', 'packages_per_container', defaultPackagesPerContainer)}</Grid>
                </Grid>
                {containers.length === 0 ? (
                    <Typography color="text.secondary">No containers added to this Master.</Typography>
                ) : (
                    <TableContainer>
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell>S. No.</TableCell>
                                    <TableCell>Container No.</TableCell>
                                    <TableCell>Size</TableCell>
                                    <TableCell>Liner Seal No.</TableCell>
                                    <TableCell>Packages/Container (Alpha_numeric)</TableCell>
                                    <TableCell>Gross Weight (kg)</TableCell>
                                    <TableCell>Net Weight (kg)</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {containers.map((container, index) => (
                                    <TableRow key={container.id || index}>
                                        <TableCell>{index + 1}</TableCell>
                                        <TableCell>{container.container_no || ''}</TableCell>
                                        <TableCell>{container.container_size || ''}</TableCell>
                                        <TableCell>{container.liner_seal_no || ''}</TableCell>
                                        <TableCell>{blPackagesPerContainer}</TableCell>
                                        <TableCell>{blContainerGross}</TableCell>
                                        <TableCell>{blContainerNet}</TableCell>
                                    </TableRow>
                                ))}
                                <TableRow>
                                    <TableCell colSpan={4}><strong>Total</strong></TableCell>
                                    <TableCell>{blPackagesPerContainer}</TableCell>
                                    <TableCell>{totalContainerGross}</TableCell>
                                    <TableCell>{totalContainerNet}</TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}
            </Paper>

            <Paper sx={{ p: 2, mb: 2 }}>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>Remarks</Typography>
                <Grid container spacing={2}>
                    <Grid item xs={12}>{overrideField('Remarks', 'remarks', DEFAULT_REMARKS, { multiline: true, rows: 3 })}</Grid>
                </Grid>
            </Paper>
        </Box>
    );
}
