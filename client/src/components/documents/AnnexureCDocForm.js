import React from 'react';
import {
    Box, Typography, Button, Grid, TextField, Paper,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import useDocumentOverrides from './useDocumentOverrides';

const DEFAULT_CERTIFICATION = 'Certified that the description and value of the goods covered by this invoce have been checked by me and that goods have been packed and sealed with liner seal under my supervision. We declare that export duty drawback (DBK) may be ascertained at the port on the basis of the merit /demerit of above description.';

export default function AnnexureCDocForm({ data, onSave, onDownloadPDF, conflictDraft }) {
    const [overrides, setOverrides] = useDocumentOverrides(data, 'ANNEXURE_C', conflictDraft);

    const getField = (key, defaultValue = '') => (
        overrides[key] !== undefined ? overrides[key] : defaultValue
    );
    const setField = (key, value) => setOverrides(prev => ({ ...prev, [key]: value }));
    const formatDate = (value) => value ? new Date(value).toLocaleDateString('en-GB') : '';

    const containers = data.containers || [];
    const perFclPackages = Number(data.per_fcl_packages || 0);
    const masterTareWeight = Number(data.tare_weight || 0);
    const masterNetWeight = Number(data.net_weight || 0);
    const annexureNetWeight = perFclPackages && masterNetWeight
        ? ((masterNetWeight * perFclPackages) / 1000).toFixed(3)
        : '';
    const annexureGrossWeight = perFclPackages && (masterTareWeight || masterNetWeight)
        ? (((masterTareWeight + masterNetWeight) * perFclPackages) / 1000).toFixed(3)
        : '';
    const docDate = formatDate(data.ci_invoice_date);
    const companyName = data.company_name || data.consignor_name || '';
    const companyAddress = data.company_address || data.consignor_address || '';
    const iecNo = getField('iec_no', '0302034218');

    const handleSave = async () => {
        await onSave({ overrides });
    };

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h5" fontWeight="bold">Annexure C - Factory Sealed Packages / Containers</Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button variant="outlined" startIcon={<PictureAsPdfIcon />} onClick={onDownloadPDF}>Download PDF</Button>
                    <Button variant="contained" startIcon={<SaveIcon />} onClick={handleSave}>Save</Button>
                </Box>
            </Box>

            <Paper sx={{ p: 2, mb: 2 }}>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>Commissionerate Details</Typography>
                <Grid container spacing={2}>
                    <Grid item xs={12} sm={4}>
                        <TextField fullWidth label="Range" value={getField('range', data.range_name || '')}
                            onChange={(e) => setField('range', e.target.value)} />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                        <TextField fullWidth label="Division" value={getField('division', data.division || '')}
                            onChange={(e) => setField('division', e.target.value)} />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                        <TextField fullWidth label="Commissionerate" value={getField('commissionerate', data.commissionerate || '')}
                            onChange={(e) => setField('commissionerate', e.target.value)} />
                    </Grid>
                </Grid>
            </Paper>

            <Paper sx={{ p: 2, mb: 2 }}>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>Shipment and Exporter Details</Typography>
                <Grid container spacing={2}>
                    <Grid item xs={12} sm={4}>
                        <TextField fullWidth label="Shipping Bill No." value={data.shipping_bill_no || ''} InputProps={{ readOnly: true }} />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                        <TextField fullWidth label="Date" value={docDate} InputProps={{ readOnly: true }} />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                        <TextField fullWidth label="Name of Exporter" value={data.consignor_name || ''} InputProps={{ readOnly: true }} />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                        <TextField fullWidth label="IEC No." value={iecNo}
                            onChange={(e) => setField('iec_no', e.target.value)} />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                        <TextField fullWidth label="GST No." value={data.gst_no || ''} InputProps={{ readOnly: true }} />
                    </Grid>
                    <Grid item xs={12}>
                        <TextField fullWidth label="CIN / PAN Based Business Identification No." value={data.cin_no || ''} InputProps={{ readOnly: true }} />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField fullWidth label="Name of Stuffing Premises" value={companyName}
                            InputProps={{ readOnly: true }} />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField fullWidth label="Date of Stuffing" value={docDate}
                            InputProps={{ readOnly: true }} />
                    </Grid>
                    <Grid item xs={12}>
                        <TextField fullWidth multiline rows={2} label="Address of Stuffing Premises"
                            value={companyAddress}
                            InputProps={{ readOnly: true }} />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField fullWidth label="Description of Goods" value={data.product_name || ''} InputProps={{ readOnly: true }} />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField fullWidth label="Particular of Export Invoice" value={data.ci_invoice_no || ''} InputProps={{ readOnly: true }} />
                    </Grid>
                    <Grid item xs={12} sm={3}>
                        <TextField fullWidth label="Total Packages" value={data.total_packages || ''} InputProps={{ readOnly: true }} />
                    </Grid>
                    <Grid item xs={12} sm={3}>
                        <TextField fullWidth label="Is the description of the goods? The quantity and their value as per the particulars furnished in export invoice." value={getField('description_value_match', 'Yes')}
                            onChange={(e) => setField('description_value_match', e.target.value)} />
                    </Grid>
                    <Grid item xs={12} sm={3}>
                        <TextField fullWidth label="Whether sample is drawn for being forwarded to port of export" value={getField('sample_drawn', 'N.A.')}
                            onChange={(e) => setField('sample_drawn', e.target.value)} />
                    </Grid>
                    <Grid item xs={12} sm={9}>
                        <TextField fullWidth label="Self-Sealing Permission" value={getField('self_sealing_permission', '')}
                            onChange={(e) => setField('self_sealing_permission', e.target.value)} />
                    </Grid>
                </Grid>
            </Paper>

            <Paper sx={{ p: 2, mb: 2 }}>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>Container Details</Typography>
                {containers.length === 0 ? (
                    <Typography color="text.secondary">No containers added to this Master.</Typography>
                ) : (
                    <TableContainer>
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell>S No.</TableCell>
                                    <TableCell>Container No.</TableCell>
                                    <TableCell>Size</TableCell>
                                    <TableCell>Liner Seal No.</TableCell>
                                    <TableCell>No. Packages</TableCell>
                                    <TableCell>Gross Weight (MTS)</TableCell>
                                    <TableCell>Net Weight (MTS)</TableCell>
                                    <TableCell>E-Seal</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {containers.map((container, index) => (
                                    <TableRow key={container.id || index}>
                                        <TableCell>{index + 1}</TableCell>
                                        <TableCell>{container.container_no || ''}</TableCell>
                                        <TableCell>{container.container_size || ''}</TableCell>
                                        <TableCell>{container.liner_seal_no || ''}</TableCell>
                                        <TableCell>{perFclPackages || ''}</TableCell>
                                        <TableCell>{annexureGrossWeight}</TableCell>
                                        <TableCell>{annexureNetWeight}</TableCell>
                                        <TableCell>{container.rfid_seal_no || ''}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}
            </Paper>

            <Paper sx={{ p: 2, mb: 2 }}>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>Consignee and Certification</Typography>
                <Grid container spacing={2}>
                    <Grid item xs={12}>
                        <TextField fullWidth label="Name and Address of Consignee" value={`${data.consignee_name || ''}${data.consignee_address ? `\n${data.consignee_address}` : ''}`} InputProps={{ readOnly: true }} multiline rows={2} />
                    </Grid>
                    <Grid item xs={12}>
                        <TextField fullWidth multiline rows={3} label="Certification" value={getField('certification', DEFAULT_CERTIFICATION)}
                            onChange={(e) => setField('certification', e.target.value)} />
                    </Grid>
                </Grid>
            </Paper>
        </Box>
    );
}
