import React from 'react';
import {
    Box, Typography, Button, Grid, TextField, Paper,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import useDocumentOverrides from './useDocumentOverrides';

const DEFAULTS = {
    carrier: 'MSC',
    ems_code: 'F-A, S-F',
    technical_name: 'Para Dichloro benzene (PDCB)',
    sub_risk: 'NA',
    outer_packaging: 'NEW PAPER FABRIC BAGS (PER CONTAINER)',
    inner_packing: '',
    imo_label: '',
    mfag_number: '',
    reefer_details: 'NA',
    boiling_point: '174°C',
    emergency_contact: 'Mr. Jigar - +919820355066',
    limited_quantity: '',
    poisonous_inhalation_hazard: 'NA',
    limitation: 'CARGO ONLY',
    declaration: 'I hereby declare that the contents of this consignment are fully and accurately described below by the proper shipping name, and are classified, packaged, marked and labelled/placarded and are in all respects in proper condition for transport according to the applicable international and national government regulations.',
    receiving_organization: '',
    packing_certificate: 'I hereby declare that the goods described above have been placed/loaded into the container/vehicle identified above in accordance with the applicable provisions.',
    receiving_receipt: 'Received the above number of packages/containers/trailers in apparent good order and condition, unless stated hereon: RECEIVING ORGANIZATION RE-MARKS:',
    company_declarant: 'JIGAR SHETH',
    company_place: 'VAPI',
    haulier_company: '',
    haulier_declarant: '',
    haulier_place: ''
};

export default function DGDDocForm({ data, onChange, onSave, onDownloadPDF, conflictDraft }) {
    const [overrides, setOverrides] = useDocumentOverrides(data, 'DGD', conflictDraft);

    const getField = (key, fallback = '') => overrides[key] !== undefined ? overrides[key] : fallback;
    const setField = (key, value) => setOverrides(prev => ({ ...prev, [key]: value }));
    const changeMaster = (field) => (event) => onChange({ ...data, [field]: event.target.value });
    const formatDate = (value) => value ? new Date(value).toLocaleDateString('en-GB') : '';
    const date = formatDate(data.ci_invoice_date || data.invoice_date || data.shipping_bill_date);
    const containers = data.containers || [];
    const perFclPackages = Number(data.per_fcl_packages || 0);
    const outerPackaging = getField('outer_packaging', `${perFclPackages || ''} NEW ${data.net_weight || ''} KG NET ${data.packing_type || 'PAPER FABRIC BAGS'} (PER CONTAINER)`);

    const handleSave = async () => {
        await onSave({ fields: data, overrides });
    };

    const masterField = (label, field, options = {}) => (
        <TextField
            fullWidth label={label} value={data[field] || ''}
            onChange={changeMaster(field)} {...options}
        />
    );

    const overrideField = (label, field, fallback = '', options = {}) => (
        <TextField
            fullWidth label={label} value={getField(field, fallback)}
            onChange={(event) => setField(field, event.target.value)} {...options}
        />
    );

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h5" fontWeight="bold">Multimodal Dangerous Goods Form</Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button variant="outlined" startIcon={<PictureAsPdfIcon />} onClick={onDownloadPDF}>Download PDF</Button>
                    <Button variant="contained" startIcon={<SaveIcon />} onClick={handleSave}>Save</Button>
                </Box>
            </Box>

            <Paper sx={{ p: 2, mb: 2 }}>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>Parties and Transport</Typography>
                <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>{masterField('Shipper / Consignor / Sender', 'consignor_name')}</Grid>
                    <Grid item xs={12} sm={6}>{masterField('Shipper Address', 'consignor_address', { multiline: true, rows: 2 })}</Grid>
                    <Grid item xs={12} sm={6}>{masterField('Consignee', 'buyer_name')}</Grid>
                    <Grid item xs={12} sm={6}>{masterField('Consignee Address', 'buyer_address', { multiline: true, rows: 2 })}</Grid>
                    <Grid item xs={12} sm={4}>{overrideField('Transport Document Number', 'transport_document_no')}</Grid>
                    <Grid item xs={12} sm={4}>{overrideField("Shipper's Reference", 'shipper_reference')}</Grid>
                    <Grid item xs={12} sm={4}>{overrideField("Freight Forwarder's Reference", 'freight_forwarder_reference')}</Grid>
                    <Grid item xs={12} sm={4}>{overrideField('Carrier', 'carrier', DEFAULTS.carrier)}</Grid>
                    <Grid item xs={12} sm={4}>{overrideField('Additional Handling Information', 'additional_handling')}</Grid>
                </Grid>
            </Paper>

            <Paper sx={{ p: 2, mb: 2 }}>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>Declaration and Routing</Typography>
                <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>{overrideField('Shipment Limitation', 'limitation', DEFAULTS.limitation)}</Grid>
                    <Grid item xs={12} sm={6}>{overrideField('Vessel / Voyage Number', 'vessel_voyage', data.vessel_no || '')}</Grid>
                    <Grid item xs={12} sm={4}>{masterField('Port of Loading', 'port_of_loading')}</Grid>
                    <Grid item xs={12} sm={4}>{masterField('Port of Discharge', 'port_of_discharge')}</Grid>
                    <Grid item xs={12} sm={4}>{masterField('Destination', 'port_of_discharge')}</Grid>
                    <Grid item xs={12}>{overrideField("Shipper's Declaration", 'declaration', DEFAULTS.declaration, { multiline: true, rows: 3 })}</Grid>
                </Grid>
            </Paper>

            <Paper sx={{ p: 2, mb: 2 }}>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>Dangerous Goods Details</Typography>
                <Grid container spacing={2}>
                    <Grid item xs={12} sm={4}>{masterField('UN Number', 'un_number')}</Grid>
                    <Grid item xs={12} sm={8}>{masterField('Proper Shipping Name', 'proper_shipping_name')}</Grid>
                    <Grid item xs={12}>{overrideField('Technical / Chemical Name', 'technical_name', DEFAULTS.technical_name)}</Grid>
                    <Grid item xs={12} sm={3}>{masterField('Class', 'imdg_class')}</Grid>
                    <Grid item xs={12} sm={3}>{overrideField('Sub Risk', 'sub_risk', DEFAULTS.sub_risk)}</Grid>
                    <Grid item xs={12} sm={3}>{masterField('Packing Group', 'packing_group')}</Grid>
                    <Grid item xs={12} sm={3}>{masterField('Marine Pollutant', 'marine_pollutant')}</Grid>
                    <Grid item xs={12}>{overrideField('Outer Packaging Type / Quantity', 'outer_packaging', outerPackaging, { multiline: true, rows: 2 })}</Grid>
                    <Grid item xs={12} sm={3}>{masterField('Flashpoint', 'flash_point')}</Grid>
                    <Grid item xs={12} sm={3}>{overrideField('EMS Code', 'ems_code', DEFAULTS.ems_code)}</Grid>
                    <Grid item xs={12} sm={3}>{overrideField('IMO Label', 'imo_label')}</Grid>
                    <Grid item xs={12} sm={3}>{overrideField('MFAG Number', 'mfag_number')}</Grid>
                    <Grid item xs={12} sm={6}>{overrideField('Reefer Temperature / Humidity / Ventilation', 'reefer_details', DEFAULTS.reefer_details)}</Grid>
                    <Grid item xs={12} sm={3}>{overrideField('Boiling Point', 'boiling_point', DEFAULTS.boiling_point)}</Grid>
                    <Grid item xs={12} sm={3}>{overrideField('Limited Quantity', 'limited_quantity')}</Grid>
                    <Grid item xs={12} sm={6}>{overrideField('Emergency Contact Details', 'emergency_contact', DEFAULTS.emergency_contact)}</Grid>
                    <Grid item xs={12} sm={6}>{overrideField('Poisonous Inhalation Hazard', 'poisonous_inhalation_hazard', DEFAULTS.poisonous_inhalation_hazard)}</Grid>
                    <Grid item xs={12}>{masterField('UN Packaging Code', 'un_packaging_code')}</Grid>
                </Grid>
            </Paper>

            <Paper sx={{ p: 2, mb: 2 }}>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>Container Details</Typography>
                {containers.length === 0 ? <Typography color="text.secondary">No containers added to this Master.</Typography> : (
                    <TableContainer>
                        <Table size="small">
                            <TableHead><TableRow>
                                <TableCell>Container Identification No.</TableCell><TableCell>Seal Number(s)</TableCell>
                                <TableCell>Container Size & Type</TableCell><TableCell>Tare Mass (kg)</TableCell><TableCell>Total Gross Mass (kg)</TableCell>
                            </TableRow></TableHead>
                            <TableBody>{containers.map((container, index) => (
                                <TableRow key={container.id || index}>
                                    <TableCell>{container.container_no || ''}</TableCell>
                                    <TableCell>{[container.liner_seal_no, container.rfid_seal_no].filter(Boolean).join(' / ')}</TableCell>
                                    <TableCell>{container.container_size || ''}</TableCell>
                                    <TableCell>{container.tare_weight || ''}</TableCell>
                                    <TableCell>{container.gross_weight || ''}</TableCell>
                                </TableRow>
                            ))}</TableBody>
                        </Table>
                    </TableContainer>
                )}
            </Paper>

            <Paper sx={{ p: 2, mb: 2 }}>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>Container Packing Certificate</Typography>
                <Grid container spacing={2}>
                    <Grid item xs={12}>{overrideField('Container Packing Certificate', 'packing_certificate', DEFAULTS.packing_certificate, { multiline: true, rows: 3 })}</Grid>
                    <Grid item xs={12}>{overrideField('21 RECEIVING ORGANIZATION RECEIPT', 'receiving_receipt', DEFAULTS.receiving_receipt, { multiline: true, rows: 3 })}</Grid>
                </Grid>
            </Paper>

            <Paper sx={{ p: 2, mb: 2 }}>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>Company</Typography>
                <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}><TextField fullWidth label="Name of Company" value={data.company_name || ''} InputProps={{ readOnly: true }} /></Grid>
                    <Grid item xs={12} sm={6}>{overrideField('Name of Declarant', 'company_declarant', DEFAULTS.company_declarant)}</Grid>
                    <Grid item xs={12} sm={6}>{overrideField('Place', 'company_place', DEFAULTS.company_place)}</Grid>
                    <Grid item xs={12} sm={6}><TextField fullWidth label="Date" value={date} InputProps={{ readOnly: true }} /></Grid>
                </Grid>
            </Paper>

            <Paper sx={{ p: 2, mb: 2 }}>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>Haulier</Typography>
                <Grid container spacing={2}>
                    <Grid item xs={12}><TextField fullWidth label="22 Name of Company (OF SHIPPER PREPARING THIS NOTE)" value={data.consignor_name || ''} InputProps={{ readOnly: true }} /></Grid>
                    <Grid item xs={12} sm={4}>{overrideField('Name of Declarant', 'haulier_declarant', 'JIGAR SETH')}</Grid>
                    <Grid item xs={12} sm={4}>{overrideField('Place', 'haulier_place', DEFAULTS.haulier_place)}</Grid>
                    <Grid item xs={12} sm={4}>{overrideField('Date', 'haulier_date', '', { type: 'date', InputLabelProps: { shrink: true } })}</Grid>
                </Grid>
            </Paper>
        </Box>
    );
}
