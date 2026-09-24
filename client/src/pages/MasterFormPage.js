import React, { useState, useEffect, useRef } from 'react';
import {
    Box, Typography, Button, Grid, TextField, MenuItem, Paper, Divider,
    Accordion, AccordionSummary, AccordionDetails, IconButton, Chip,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Dialog, DialogTitle, DialogContent, DialogActions, Alert
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import { useNavigate, useParams } from 'react-router-dom';
import { mastersAPI, companiesAPI, clientsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import ContainerDialog from '../components/ContainerDialog';
import DocumentSidebar from '../components/DocumentSidebar';
import SearchableDropdown from '../components/SearchableDropdown';
import PIDocForm from '../components/documents/PIDocForm';
import CIDocForm from '../components/documents/CIDocForm';
import PLDocForm from '../components/documents/PLDocForm';
import COADocForm from '../components/documents/COADocForm';
import CCVODocForm from '../components/documents/CCVODocForm';
import BCDocForm from '../components/documents/BCDocForm';
import MFGDocForm from '../components/documents/MFGDocForm';
import SCOMETDocForm from '../components/documents/SCOMETDocForm';
import FormSDFDocForm from '../components/documents/FormSDFDocForm';
import EUCDocForm from '../components/documents/EUCDocForm';
import AnnexureADocForm from '../components/documents/AnnexureADocForm';
import AnnexureCDocForm from '../components/documents/AnnexureCDocForm';
import DGDDocForm from '../components/documents/DGDDocForm';
import VGMDocForm from '../components/documents/VGMDocForm';
import BLDraftDocForm from '../components/documents/BLDraftDocForm';
import GenericDocForm from '../components/documents/GenericDocForm';

const SUPPORTED_DOCUMENT_TYPES = new Set([
    'edit', 'BL_DRAFT', 'PI', 'CI', 'PL', 'COA', 'CCVO', 'BC',
    'MFG_CERTI', 'SCOMET', 'FORM_SDF', 'EUC', 'ANNEXURE_A',
    'ANNEXURE_C', 'DGD', 'VGM'
]);

const cloneValue = (value) => {
    if (Array.isArray(value)) return value.map(cloneValue);
    if (value && typeof value === 'object') {
        return Object.fromEntries(Object.entries(value).map(([key, nested]) => [key, cloneValue(nested)]));
    }
    return value;
};

export default function MasterFormPage() {
    const { selectedCompany } = useAuth();
    const navigate = useNavigate();
    const { id, docType } = useParams();
    const requestedDoc = docType || 'edit';
    const currentDoc = SUPPORTED_DOCUMENT_TYPES.has(requestedDoc) ? requestedDoc : 'edit';

    const [master, setMaster] = useState(null);
    const [bankAccounts, setBankAccounts] = useState([]);
    const [saving, setSaving] = useState(false);
    const [documentSaving, setDocumentSaving] = useState(false);
    const documentSaveInFlight = useRef(false);
    const routeKeyRef = useRef(null);
    const saveMessageTimer = useRef(null);
    const [saveMessage, setSaveMessage] = useState('');
    const [conflictDraft, setConflictDraft] = useState(null);
    const [containerDialogOpen, setContainerDialogOpen] = useState(false);
    const [editingContainer, setEditingContainer] = useState(null);
    const [restoringContainerConflict, setRestoringContainerConflict] = useState(false);
    const [documentDialogOpen, setDocumentDialogOpen] = useState(false);
    const [selectedDocuments, setSelectedDocuments] = useState([]);

    const [clients, setClients] = useState([]);
    const [companies, setCompanies] = useState([]);
    const [weighbridges, setWeighbridges] = useState([]);

    const [documentDraft, setDocumentDraft] = useState({});
    const [formData, setFormData] = useState({
        // Consignor
        consignor_name: '',
        consignor_address: '',
        // Buyer
        buyer_name: '',
        buyer_address: '',
        // Invoice Details
        invoice_no: '',
        invoice_date: '',
        po_no: '',
        po_date: '',
        other_ref: '',
        lut_arn_no: '',
        // CI Invoice
        ci_invoice_no: '',
        ci_invoice_date: '',
        // Shipping
        port_of_loading: '',
        port_of_discharge: '',
        country_of_origin: 'India',
        country_of_discharge: '',
        country_of_supply: 'India',
        shipment_date: '',
        vessel_no: '',
        bill_of_lading_no: '',
        shipping_bill_no: '',
        shipping_bill_date: '',
        // Consignee
        consignee_name: '',
        consignee_address: '',
        // Terms
        currency: 'USD',
        incoterms: '',
        payment_terms: '',
        freight_terms: '',
        issuing_bank: '',
        lc_no_and_date: '',
        account_name: '',
        bank_name: '',
        account_no: '',
        swift_code: '',
        branch: '',
        // Pricing
        fob_amount: '',
        freight_amount: '',
        total_amount: '',
        // Product
        product_name: '',
        hs_code: '',
        description: '',
        packing_type: '',
        bag_weight: '',
        tare_weight: '',
        total_quantity: '',
        total_packages: '',
        per_fcl_packages: '',
        unit_1: '',
        unit_2: '',
        uom: 'MT',
        unit_rate: '',
        lot_no: '',
        bag_no_from: '',
        bag_no_to: '',
        // Weights
        total_gross_weight: '',
        net_weight: '',
        nett_weight: '',
        // Bank
        company_bank_id: '',
        // DGD
        booking_no: '',
        un_number: '',
        imdg_class: '',
        packing_group: '',
        marine_pollutant: '',
        flash_point: '',
        ems_code: '',
        proper_shipping_name: '',
        un_packaging_code: '',
        // COA
        mfg_date: '',
        expiry_date: '',
        // EUC
        application: '',
        // Status
        status: 'draft'
    });

    useEffect(() => {
        if (id) loadMaster();
        if (selectedCompany) loadBankAccounts();
    }, [id, selectedCompany]);

    useEffect(() => () => {
        if (saveMessageTimer.current) clearTimeout(saveMessageTimer.current);
    }, []);

    const showSaveMessage = (message, { clearAfter } = {}) => {
        if (saveMessageTimer.current) clearTimeout(saveMessageTimer.current);
        setSaveMessage(message);
        if (clearAfter) {
            saveMessageTimer.current = setTimeout(() => {
                setSaveMessage(current => current === message ? '' : current);
                saveMessageTimer.current = null;
            }, clearAfter);
        }
    };

    const clearConflictDraft = () => {
        setConflictDraft(null);
        setDocumentDraft({});
        setRestoringContainerConflict(false);
    };

    const loadMaster = async () => {
        try {
            const response = await mastersAPI.getById(id);
            const m = response.data;
            setMaster(m);

            // Populate form
            const populated = {};
            Object.keys(formData).forEach(key => {
                if (m[key] !== null && m[key] !== undefined) {
                    // Handle date fields
                    if (key.includes('date') && m[key] && !key.includes('lc_no')) {
                        populated[key] = m[key].split('T')[0];
                    } else {
                        populated[key] = m[key].toString();
                    }
                } else {
                    populated[key] = '';
                }
            });
            // Recalculate derived weights when loading existing or imported Masters.
            const tareWt = parseFloat(populated.tare_weight) || 0;
            const netWt = parseFloat(populated.net_weight) || 0;
            const packages = parseFloat(populated.total_packages) || 0;
            if (packages && netWt) {
                populated.nett_weight = parseFloat((netWt * packages / 1000).toFixed(3)).toString();
            }
            if (packages && (tareWt || netWt)) {
                populated.total_gross_weight = parseFloat(((tareWt + netWt) * packages / 1000).toFixed(3)).toString();
            }
            populated.version = m.version;
            setFormData(populated);

            // Load selected documents
            if (m.documents) {
                const docTypes = [...new Set(
                    m.documents
                        .filter(d => d.is_selected && SUPPORTED_DOCUMENT_TYPES.has(d.document_type))
                        .map(d => d.document_type)
                )];
                setSelectedDocuments(docTypes);
            }
            return m;
        } catch (err) {
            console.error('Failed to load master:', err);
            return null;
        }
    };

    const loadBankAccounts = async () => {
        try {
            const [bankRes, clientRes, compRes, wbRes] = await Promise.all([
                companiesAPI.getBankAccounts(selectedCompany.id),
                clientsAPI.getAll(selectedCompany.id),
                companiesAPI.getAll(),
                companiesAPI.getWeighbridges()
            ]);
            setBankAccounts(bankRes.data);
            setClients(clientRes.data);
            setCompanies(compRes.data);
            setWeighbridges(wbRes.data);
        } catch (err) {
            console.error('Failed to load data:', err);
        }
    };

    useEffect(() => {
        const routeKey = `${id || ''}:${currentDoc}`;
        if (!routeKeyRef.current) {
            routeKeyRef.current = routeKey;
            return;
        }
        if (routeKeyRef.current !== routeKey) {
            clearConflictDraft();
            setContainerDialogOpen(false);
            setEditingContainer(null);
            showSaveMessage('');
            routeKeyRef.current = routeKey;
        }
    }, [id, currentDoc]);

    const handleDocNavigate = (docKey) => {
        if (!SUPPORTED_DOCUMENT_TYPES.has(docKey)) {
            showSaveMessage('Unsupported document type.');
            return;
        }
        if (docKey === 'edit') {
            navigate(`/masters/${id}/edit`);
        } else {
            navigate(`/masters/${id}/${docKey}`);
        }
    };

    const handleChange = (field) => (e) => {
        const newData = { ...formData, [field]: e.target.value };

        // Auto-calculate total amount
        if (field === 'fob_amount' || field === 'freight_amount') {
            const fob = parseFloat(field === 'fob_amount' ? e.target.value : newData.fob_amount) || 0;
            const freight = parseFloat(field === 'freight_amount' ? e.target.value : newData.freight_amount) || 0;
            newData.total_amount = (fob + freight).toString();
        }

        // Auto-calculate net and gross weights from packing values.
        if (field === 'tare_weight' || field === 'net_weight' || field === 'total_packages') {
            const tareWt = parseFloat(newData.tare_weight) || 0;
            const netWt = parseFloat(newData.net_weight) || 0;
            const packages = parseFloat(newData.total_packages) || 0;
            newData.nett_weight = netWt && packages
                ? parseFloat((netWt * packages / 1000).toFixed(3)).toString()
                : '';
            newData.total_gross_weight = (tareWt || netWt) && packages
                ? parseFloat(((tareWt + netWt) * packages / 1000).toFixed(3)).toString()
                : '';
        }

        setFormData(newData);
    };

    const canonicalMasterFromResponse = (response) => response?.data?.master || response?.data;

    const conflictMatchesCurrentView = (draft = conflictDraft) => {
        if (!draft) return false;
        if (draft.masterId && String(draft.masterId) !== String(id)) return false;
        if (draft.type === 'document') return draft.document === currentDoc;
        return currentDoc === 'edit';
    };

    const installCanonicalMaster = (canonical, { clearDraft = true, clearConflict = true } = {}) => {
        if (!canonical) return;
        if (clearDraft) setDocumentDraft({});
        if (clearConflict) {
            setConflictDraft(null);
            setRestoringContainerConflict(false);
        }
        setMaster(canonical);
        setFormData(previous => {
            const next = { ...previous };
            Object.keys(next).forEach(key => {
                if (Object.prototype.hasOwnProperty.call(canonical, key)) {
                    const value = canonical[key];
                    next[key] = value === null || value === undefined
                        ? ''
                        : key.includes('date') && !key.includes('lc_no')
                            ? String(value).split('T')[0]
                            : value.toString();
                }
            });
            next.version = canonical.version;
            return next;
        });
        if (canonical.documents) {
            setSelectedDocuments([...new Set(
                canonical.documents
                    .filter(document => document.is_selected && SUPPORTED_DOCUMENT_TYPES.has(document.document_type))
                    .map(document => document.document_type)
            )]);
        }
    };

    const handleSave = async (draftOverride = null) => {
        setSaving(true);
        showSaveMessage('');
        let attemptedPayload;
        try {
            const payload = { ...(draftOverride || formData) };
            // Convert numeric fields
            const numericFields = ['fob_amount', 'freight_amount', 'total_amount', 'bag_weight',
                'tare_weight', 'total_quantity', 'total_packages', 'per_fcl_packages', 'unit_rate',
                'total_gross_weight', 'net_weight', 'nett_weight', 'bag_no_from', 'bag_no_to'];
            numericFields.forEach(f => {
                if (payload[f] === '') payload[f] = null;
                else if (payload[f]) payload[f] = parseFloat(parseFloat(payload[f]).toFixed(3));
            });
            // Convert empty strings to null
            Object.keys(payload).forEach(k => {
                if (payload[k] === '') payload[k] = null;
            });

            if (id) {
                if (!master?.version) throw new Error('Master version is unavailable. Reload before saving.');
                payload.version = master.version;
                attemptedPayload = cloneValue(payload);
                const response = await mastersAPI.update(id, payload);
                installCanonicalMaster(canonicalMasterFromResponse(response));
                showSaveMessage('Saved successfully!', { clearAfter: 3000 });
            } else {
                // Create new blank master
                payload.company_id = selectedCompany.id;
                const response = await mastersAPI.createBlank(payload);
                navigate(`/masters/${response.data.id}/edit`, { replace: true });
            }
        } catch (err) {
            console.error('Failed to save:', err);
            if (err.response?.status === 409) {
                setConflictDraft({
                    type: 'root',
                    masterId: id,
                    document: currentDoc,
                    baseVersion: master?.version,
                    data: attemptedPayload
                });
                const latest = err.response.data?.master;
                if (latest) {
                    installCanonicalMaster(latest, { clearDraft: false, clearConflict: false });
                } else {
                    await loadMaster();
                }
                showSaveMessage('Conflict: another user changed this Master. Latest data loaded; unsaved edits remain available for review before retrying.');
            } else {
                showSaveMessage('Error saving. Please try again.');
                throw err;
            }
        } finally {
            setSaving(false);
        }
    };

    const handleRestoreConflictDraft = () => {
        if (!conflictMatchesCurrentView()) return;

        if (conflictDraft.type === 'root') {
            setFormData(previous => ({
                ...previous,
                ...(conflictDraft.data || {}),
                version: master?.version
            }));
        } else if (conflictDraft.type === 'container') {
            if (conflictDraft.containerId) {
                const latestContainer = master?.containers?.find(container =>
                    String(container.id) === String(conflictDraft.containerId)
                );
                setEditingContainer({
                    ...(latestContainer || { id: conflictDraft.containerId }),
                    ...(conflictDraft.data || {})
                });
            } else {
                setEditingContainer(null);
            }
            setRestoringContainerConflict(true);
            setContainerDialogOpen(true);
        } else if (conflictDraft.type === 'document') {
            const fields = conflictDraft.saveParts?.fields || conflictDraft.data || {};
            setFormData(previous => ({ ...previous, ...fields, version: master?.version }));
            setDocumentDraft(previous => ({ ...previous, ...fields }));
        } else if (conflictDraft.type === 'documents') {
            setSelectedDocuments(conflictDraft.documentTypes || []);
        } else if (conflictDraft.type === 'container-delete') {
            showSaveMessage('Delete intent remains pending. Retry deletion with the current Master version.');
            return;
        }

        showSaveMessage('Unsaved edits restored over the latest Master. Review them, then save to retry with the current version.');
    };

    const handleDiscardConflictDraft = () => {
        clearConflictDraft();
        if (master) installCanonicalMaster(master, { clearDraft: true, clearConflict: false });
        showSaveMessage('');
    };

    const handleAddContainer = () => {
        clearConflictDraft();
        setEditingContainer(null);
        setContainerDialogOpen(true);
    };

    const handleEditContainer = (container) => {
        clearConflictDraft();
        setEditingContainer(container);
        setContainerDialogOpen(true);
    };

    const handleCloseContainerDialog = () => {
        setContainerDialogOpen(false);
        setEditingContainer(null);
        if (restoringContainerConflict) clearConflictDraft();
        setRestoringContainerConflict(false);
    };

    const handleDeleteContainer = async (containerId, { skipConfirmation = false } = {}) => {
        if (!skipConfirmation && !window.confirm('Delete this container?')) return;
        try {
            if (!master?.version) throw new Error('Master version is unavailable. Reload before saving.');
            const response = await mastersAPI.deleteContainer(id, containerId, master.version);
            installCanonicalMaster(canonicalMasterFromResponse(response));
            showSaveMessage('Container deleted successfully.');
        } catch (err) {
            console.error('Failed to delete container:', err);
            if (err.response?.status === 409) {
                const latest = err.response.data?.master;
                if (latest) {
                    const stillExists = latest.containers?.some(container =>
                        String(container.id) === String(containerId)
                    );
                    installCanonicalMaster(latest, {
                        clearDraft: false,
                        clearConflict: !stillExists
                    });
                    if (!stillExists) {
                        showSaveMessage('Container was already deleted by another user. Latest data loaded.');
                        return;
                    }
                } else {
                    await loadMaster();
                }
                setConflictDraft({
                    type: 'container-delete',
                    masterId: id,
                    baseVersion: master?.version,
                    containerId
                });
                showSaveMessage('Conflict: another user changed this Master. Latest data loaded; retry container deletion when ready.');
            } else if (err.response?.status === 404) {
                const latest = await loadMaster();
                const stillExists = latest?.containers?.some(container =>
                    String(container.id) === String(containerId)
                );
                if (!stillExists) {
                    clearConflictDraft();
                    showSaveMessage('Container was already deleted. Latest data loaded.');
                } else {
                    showSaveMessage('Container could not be deleted. Latest data loaded.');
                }
            } else {
                showSaveMessage('Error deleting container.');
            }
        }
    };

    const handleContainerSave = async (containerData) => {
        try {
            if (!master?.version) throw new Error('Master version is unavailable. Reload before saving.');
            const payload = { ...containerData, version: master.version };
            const response = editingContainer
                ? await mastersAPI.updateContainer(id, editingContainer.id, payload)
                : await mastersAPI.addContainer(id, payload);
            installCanonicalMaster(canonicalMasterFromResponse(response));
            setContainerDialogOpen(false);
            setEditingContainer(null);
            setRestoringContainerConflict(false);
            showSaveMessage('');
        } catch (err) {
            console.error('Failed to save container:', err);
            if (err.response?.status === 409) {
                setConflictDraft({
                    type: 'container',
                    masterId: id,
                    document: 'edit',
                    baseVersion: master?.version,
                    data: cloneValue(containerData),
                    containerId: editingContainer?.id || null
                });
                const latest = err.response.data?.master;
                if (latest) installCanonicalMaster(latest, { clearDraft: false, clearConflict: false });
                else await loadMaster();
                showSaveMessage('Conflict: another user changed this Master. Latest data loaded; unsaved container edits remain available for review before retrying.');
            } else if (err.response?.status === 404 && editingContainer) {
                const latest = await loadMaster();
                const stillExists = latest?.containers?.some(container =>
                    String(container.id) === String(editingContainer.id)
                );
                setContainerDialogOpen(false);
                setEditingContainer(null);
                clearConflictDraft();
                showSaveMessage(stillExists
                    ? 'Container could not be saved. Reloaded latest Master data.'
                    : 'Container was deleted by another user. Latest data loaded; start a new container if needed.');
            } else {
                showSaveMessage('Error saving container: ' + (err.response?.data?.error || err.message));
            }
        }
    };

    const handleDocumentsSave = async () => {
        try {
            if (!master?.version) throw new Error('Master version is unavailable. Reload before saving.');
            const attemptedDocuments = [...selectedDocuments];
            const response = await mastersAPI.setDocuments(id, attemptedDocuments, master.version);
            installCanonicalMaster(canonicalMasterFromResponse(response));
            setDocumentDialogOpen(false);
        } catch (err) {
            console.error('Failed to save documents:', err);
            if (err.response?.status === 409) {
                setConflictDraft({
                    type: 'documents',
                    baseVersion: master?.version,
                    documentTypes: [...selectedDocuments]
                });
                const latest = err.response.data?.master;
                if (latest) installCanonicalMaster(latest, { clearDraft: false, clearConflict: false });
                else await loadMaster();
                showSaveMessage('Conflict: another user changed this Master. Latest document selection loaded; unsaved selection remains available for review before retrying.');
            } else {
                showSaveMessage('Error saving selected documents.');
            }
        }
    };

    const handleGenerateAllPDFs = async () => {
        for (const docType of selectedDocuments) {
            try {
                await mastersAPI.generatePDF(id, docType);
            } catch (err) {
                console.error(`Failed to generate ${docType}:`, err);
                alert(`Failed to generate ${docType}. It may not be implemented yet.`);
            }
        }
        alert('All documents generated and saved to client folder.');
    };

    const handleOpenSinglePDF = async (docType) => {
        try {
            const response = await mastersAPI.generatePDF(id, docType);
            const blob = new Blob([response.data], { type: 'application/pdf' });
            const url = window.URL.createObjectURL(blob);
            window.open(url, '_blank');
        } catch (err) {
            console.error(`Failed to open ${docType}:`, err);
            alert(`Failed to generate ${docType}. It may not be implemented yet.`);
        }
    };

    const handleDocToggle = (docType) => {
        setSelectedDocuments(prev =>
            prev.includes(docType)
                ? prev.filter(d => d !== docType)
                : [...prev, docType]
        );
    };

    if (!master && id) {
        return <Box sx={{ p: 3 }}><Typography>Loading...</Typography></Box>;
    }

    if (id && requestedDoc !== currentDoc) {
        return (
            <Box sx={{ p: 3 }}>
                <Alert severity="error" sx={{ mb: 2 }}>Unsupported document type.</Alert>
                <Button onClick={() => navigate(`/masters/${id}/edit`)}>Return to Master</Button>
            </Box>
        );
    }

    // Document form view
    if (currentDoc !== 'edit' && id) {
        const handleDocDownloadPDF = async () => {
            try {
                const response = await mastersAPI.generatePDF(id, currentDoc);
                const blob = new Blob([response.data], { type: 'application/pdf' });
                const url = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.target = '_blank';
                link.click();
                setTimeout(() => window.URL.revokeObjectURL(url), 1000);
            } catch (err) {
                console.error('PDF error:', err);
                alert(`Failed to generate ${currentDoc} PDF. It may not be implemented yet.`);
            }
        };

            const handleDocSave = async (saveParts = {}) => {
            if (documentSaveInFlight.current) return;
            documentSaveInFlight.current = true;
            setDocumentSaving(true);
            const hasFields = Object.prototype.hasOwnProperty.call(saveParts, 'fields');
            const attemptedSaveParts = cloneValue(saveParts);
            try {
                const payload = hasFields
                    ? Object.entries(saveParts.fields).reduce((fields, [key, value]) => {
                        if (master && Object.prototype.hasOwnProperty.call(master, key)) {
                            const canonicalValue = master[key] ?? '';
                            const nextValue = value ?? '';
                            if (String(nextValue) !== String(canonicalValue)) fields[key] = value;
                        }
                        return fields;
                    }, {})
                    : Object.keys(saveParts).length === 0
                        ? { ...documentDraft }
                        : {};
                // Remove non-DB fields
                delete payload.consignor_id;
                delete payload.consignee_id;
                delete payload.buyer_id;
                // Convert empty strings to null
                Object.keys(payload).forEach(k => {
                    if (payload[k] === '') payload[k] = null;
                });
                if (!master?.version) throw new Error('Master version is unavailable. Reload before saving.');
                const response = await mastersAPI.documentSave(id, currentDoc, {
                    version: master.version,
                    fields: payload,
                    overrides: saveParts.overrides,
                    coa_tests: saveParts.coa_tests,
                    container: saveParts.container
                });
                installCanonicalMaster(response.data);
                showSaveMessage('Saved successfully!', { clearAfter: 3000 });
            } catch (err) {
                console.error('Save error:', err);
                if (err.response?.status === 409) {
                    setConflictDraft({
                        type: 'document',
                        masterId: id,
                        document: currentDoc,
                        baseVersion: master?.version,
                        data: { ...documentDraft, ...formData },
                        saveParts: attemptedSaveParts
                    });
                    const latest = err.response.data?.master;
                    if (latest) {
                        installCanonicalMaster(latest, { clearDraft: false, clearConflict: false });
                    } else {
                        await loadMaster();
                    }
                    showSaveMessage('Conflict: another user changed this Master. Latest data loaded; unsaved edits remain available for review before retrying.');
                    throw err;
                } else {
                    showSaveMessage('Error saving document: ' + (err.response?.data?.error || err.message));
                    throw err;
                }
            } finally {
                documentSaveInFlight.current = false;
                setDocumentSaving(false);
            }
        };

        const handleDocumentChange = (nextData) => {
            setFormData(nextData);
            setDocumentDraft(previous => {
                const nextDraft = { ...previous };
                Object.keys(nextData || {}).forEach(key => {
                    if (!master || !Object.prototype.hasOwnProperty.call(master, key)) return;
                    const canonicalValue = master[key] ?? '';
                    const draftValue = nextData[key] ?? '';
                    if (String(draftValue) === String(canonicalValue)) delete nextDraft[key];
                    else nextDraft[key] = nextData[key];
                });
                return nextDraft;
            });
        };

        const renderDocForm = () => {
                const props = {
                key: currentDoc,
                data: { ...master, ...documentDraft, version: master?.version, containers: master?.containers || [] },
                masterId: id,
                onChange: handleDocumentChange,
                onSave: handleDocSave,
                onDownloadPDF: handleDocDownloadPDF,
                conflictDraft
            };
            switch (currentDoc) {
                case 'PI': return <PIDocForm {...props} />;
                case 'CI': return <CIDocForm {...props} />;
                case 'PL': return <PLDocForm {...props} />;
                case 'COA': return <COADocForm {...props} masterId={id} />;
                case 'CCVO': return <CCVODocForm {...props} masterId={id} />;
                case 'BC': return <BCDocForm {...props} masterId={id} />;
                case 'MFG_CERTI': return <MFGDocForm {...props} masterId={id} />;
                case 'SCOMET': return <SCOMETDocForm {...props} masterId={id} />;
                case 'FORM_SDF': return <FormSDFDocForm {...props} masterId={id} />;
                case 'EUC': return <EUCDocForm {...props} masterId={id} />;
                case 'ANNEXURE_A': return <AnnexureADocForm {...props} masterId={id} />;
                case 'ANNEXURE_C': return <AnnexureCDocForm {...props} masterId={id} />;
                case 'DGD': return <DGDDocForm {...props} masterId={id} />;
                case 'VGM': return <VGMDocForm {...props} masterId={id} />;
                case 'BL_DRAFT': return <BLDraftDocForm {...props} masterId={id} />;
                default: return <GenericDocForm docType={currentDoc} data={formData} onDownloadPDF={handleDocDownloadPDF} />;
            }
        };

        return (
            <Box sx={{ display: 'flex', gap: 2, p: 2 }} aria-busy={documentSaving}>
                <Box sx={{ flex: 1 }}>
                    {saveMessage && (
                        <Alert severity={saveMessage.startsWith('Conflict:') ? 'warning' : 'error'} sx={{ mb: 2 }}>
                            {saveMessage}
                            {conflictMatchesCurrentView() && (
                                <>
                                    {' Unsaved edits remain preserved locally for review before retrying.'}
                                    <Button size="small" sx={{ ml: 1 }} onClick={handleRestoreConflictDraft}>
                                        Restore unsaved edits
                                    </Button>
                                    <Button size="small" sx={{ ml: 1 }} onClick={handleDiscardConflictDraft}>
                                        Discard unsaved edits
                                    </Button>
                                </>
                            )}
                        </Alert>
                    )}
                    {renderDocForm()}
                </Box>
                <Box sx={{ width: 200, flexShrink: 0 }}>
                    <DocumentSidebar currentDoc={currentDoc} masterId={id} onNavigate={handleDocNavigate} />
                </Box>
            </Box>
        );
    }

    return (
        <Box sx={{ display: 'flex', gap: 2, p: 2 }}>
            <Box sx={{ flex: 1 }}>
            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/masters')}>
                        Back
                    </Button>
                    <Typography variant="h5" fontWeight="bold">
                        {id ? `Master - M_${String(master?.master_number || '').padStart(3, '0')}_${master?.master_financial_year || ''}`
                            : 'New Master'}
                    </Typography>
                    {master?.client_name && <Chip label={master.client_name} color="primary" variant="outlined" />}
                </Box>
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                    {saveMessage && (
                        <Alert
                            severity={saveMessage.startsWith('Conflict:')
                                ? 'warning'
                                : saveMessage.includes('Error') ? 'error' : 'success'}
                            sx={{ py: 0 }}
                        >
                            {saveMessage}
                            {conflictMatchesCurrentView() && conflictDraft.type === 'container-delete' && (
                                <Button size="small" sx={{ ml: 1 }} onClick={() => handleDeleteContainer(conflictDraft.containerId, { skipConfirmation: true })}>
                                    Retry delete container
                                </Button>
                            )}
                            {conflictMatchesCurrentView() && (conflictDraft.type === 'root' || conflictDraft.type === 'container') && (
                                <>
                                    <Button size="small" sx={{ ml: 1 }} onClick={handleRestoreConflictDraft}>
                                        Restore unsaved edits
                                    </Button>
                                    <Button size="small" sx={{ ml: 1 }} onClick={handleDiscardConflictDraft}>
                                        Discard unsaved edits
                                    </Button>
                                </>
                            )}
                        </Alert>
                    )}
                    <Button
                        variant="contained"
                        startIcon={<SaveIcon />}
                        onClick={() => handleSave()}
                        disabled={saving}
                    >
                        {saving ? 'Saving...' : 'Save'}
                    </Button>
                </Box>
            </Box>

            {/* Consignor Details */}
            <Accordion defaultExpanded>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography variant="h6">Consignor (Exporter)</Typography>
                </AccordionSummary>
                <AccordionDetails>
                    <Grid container spacing={2}>
                        <Grid item xs={12} sm={4}>
                            <TextField
                                select fullWidth label="Select Consignor"
                                value={formData.consignor_id || ''}
                                onChange={(e) => {
                                    const option = companies.find(c => c.id === parseInt(e.target.value));
                                    if (option) {
                                        setFormData({ ...formData, consignor_name: option.name, consignor_address: option.address || '', consignor_id: option.id });
                                    }
                                }}
                            >
                                {companies.map(c => (
                                    <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
                                ))}
                            </TextField>
                        </Grid>
                        <Grid item xs={12} sm={4}>
                            <TextField fullWidth label="Consignor Name" value={formData.consignor_name} onChange={handleChange('consignor_name')} />
                        </Grid>
                        <Grid item xs={12} sm={4}>
                            <TextField fullWidth label="Consignor Address" value={formData.consignor_address} onChange={handleChange('consignor_address')} multiline rows={2} />
                        </Grid>
                    </Grid>
                </AccordionDetails>
            </Accordion>

            {/* Consignee */}
            <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography variant="h6">Consignee</Typography>
                </AccordionSummary>
                <AccordionDetails>
                    <Grid container spacing={2}>
                        <Grid item xs={12} sm={4}>
                            <SearchableDropdown
                                label="Select Consignee"
                                options={clients}
                                value={formData.consignee_id}
                                onChange={(option) => {
                                    if (option) {
                                        setFormData({ ...formData, consignee_name: option.name, consignee_address: option.address || '', consignee_id: option.id });
                                    }
                                }}
                            />
                        </Grid>
                        <Grid item xs={12} sm={4}>
                            <TextField fullWidth label="Consignee Name" value={formData.consignee_name} onChange={handleChange('consignee_name')} />
                        </Grid>
                        <Grid item xs={12} sm={4}>
                            <TextField fullWidth label="Consignee Address" value={formData.consignee_address} onChange={handleChange('consignee_address')} multiline rows={2} />
                        </Grid>
                    </Grid>
                </AccordionDetails>
            </Accordion>

            {/* Buyer */}
            <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography variant="h6">Buyer</Typography>
                </AccordionSummary>
                <AccordionDetails>
                    <Grid container spacing={2}>
                        <Grid item xs={12} sm={4}>
                            <SearchableDropdown
                                label="Select Buyer"
                                options={clients}
                                value={formData.buyer_id}
                                onChange={(option) => {
                                    if (option) {
                                        setFormData({ ...formData, buyer_name: option.name, buyer_address: option.address || '', buyer_id: option.id, client_id: option.id });
                                    }
                                }}
                            />
                        </Grid>
                        <Grid item xs={12} sm={4}>
                            <TextField fullWidth label="Buyer Name" value={formData.buyer_name} onChange={handleChange('buyer_name')} />
                        </Grid>
                        <Grid item xs={12} sm={4}>
                            <TextField fullWidth label="Buyer Address" value={formData.buyer_address} onChange={handleChange('buyer_address')} multiline rows={2} />
                        </Grid>
                    </Grid>
                </AccordionDetails>
            </Accordion>

            {/* Invoices & Reference Details */}
            <Accordion defaultExpanded>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography variant="h6">Invoices & Reference Details</Typography>
                </AccordionSummary>
                <AccordionDetails>
                    <Grid container spacing={2}>
                        <Grid item xs={12} sm={3}>
                            <TextField fullWidth label="PI Invoice No." value={formData.invoice_no} onChange={handleChange('invoice_no')} />
                        </Grid>
                        <Grid item xs={12} sm={3}>
                            <TextField fullWidth label="PI Invoice Date" type="date" value={formData.invoice_date} onChange={handleChange('invoice_date')} InputLabelProps={{ shrink: true }} />
                        </Grid>
                        <Grid item xs={12} sm={3}>
                            <TextField fullWidth label="CI Invoice No." value={formData.ci_invoice_no} onChange={handleChange('ci_invoice_no')} />
                        </Grid>
                        <Grid item xs={12} sm={3}>
                            <TextField fullWidth label="CI Invoice Date" type="date" value={formData.ci_invoice_date} onChange={handleChange('ci_invoice_date')} InputLabelProps={{ shrink: true }} />
                        </Grid>
                        <Grid item xs={12} sm={3}>
                            <TextField fullWidth label="PO No." value={formData.po_no} onChange={handleChange('po_no')} />
                        </Grid>
                        <Grid item xs={12} sm={3}>
                            <TextField fullWidth label="PO Date" type="date" value={formData.po_date} onChange={handleChange('po_date')} InputLabelProps={{ shrink: true }} />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField fullWidth label="Other Reference (Form M No.)" value={formData.other_ref} onChange={handleChange('other_ref')} />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField fullWidth label="LUT ARN No." value={formData.lut_arn_no} onChange={handleChange('lut_arn_no')} />
                        </Grid>
                    </Grid>
                </AccordionDetails>
            </Accordion>

            {/* Shipping Details */}
            <Accordion defaultExpanded>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography variant="h6">Shipping Details</Typography>
                </AccordionSummary>
                <AccordionDetails>
                    <Grid container spacing={2}>
                        <Grid item xs={12} sm={4}>
                            <TextField fullWidth label="Port of Loading" value={formData.port_of_loading} onChange={handleChange('port_of_loading')} />
                        </Grid>
                        <Grid item xs={12} sm={4}>
                            <TextField fullWidth label="Port of Discharge" value={formData.port_of_discharge} onChange={handleChange('port_of_discharge')} />
                        </Grid>
                        <Grid item xs={12} sm={4}>
                            <TextField fullWidth label="Shipment Date" type="date" value={formData.shipment_date} onChange={handleChange('shipment_date')} InputLabelProps={{ shrink: true }} />
                        </Grid>
                        <Grid item xs={12} sm={3}>
                            <TextField fullWidth label="Country of Origin" value={formData.country_of_origin} onChange={handleChange('country_of_origin')} />
                        </Grid>
                        <Grid item xs={12} sm={3}>
                            <TextField fullWidth label="Country of Discharge" value={formData.country_of_discharge} onChange={handleChange('country_of_discharge')} />
                        </Grid>
                        <Grid item xs={12} sm={3}>
                            <TextField fullWidth label="Vessel No." value={formData.vessel_no} onChange={handleChange('vessel_no')} placeholder="e.g., MSC MARIANNA IW620A" />
                        </Grid>
                        <Grid item xs={12} sm={3}>
                            <TextField fullWidth label="Bill of Lading No." value={formData.bill_of_lading_no} onChange={handleChange('bill_of_lading_no')} />
                        </Grid>
                        <Grid item xs={12} sm={3}>
                            <TextField fullWidth label="Shipping Bill No." value={formData.shipping_bill_no} onChange={handleChange('shipping_bill_no')} />
                        </Grid>
                        <Grid item xs={12} sm={3}>
                            <TextField fullWidth label="Shipping Bill Date" type="date" value={formData.shipping_bill_date} onChange={handleChange('shipping_bill_date')} InputLabelProps={{ shrink: true }} />
                        </Grid>
                    </Grid>
                </AccordionDetails>
            </Accordion>

            {/* Payment & LC Details */}
            <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography variant="h6">Payment & LC Details</Typography>
                </AccordionSummary>
                <AccordionDetails>
                    <Grid container spacing={2}>
                        <Grid item xs={12} sm={3}>
                            <TextField select fullWidth label="Currency" value={formData.currency} onChange={handleChange('currency')}>
                                <MenuItem value="USD">USD</MenuItem>
                                <MenuItem value="AED">AED</MenuItem>
                                <MenuItem value="EUR">EUR</MenuItem>
                            </TextField>
                        </Grid>
                        <Grid item xs={12} sm={3}>
                            <TextField fullWidth label="Incoterms" value={formData.incoterms} onChange={handleChange('incoterms')} />
                        </Grid>
                        <Grid item xs={12} sm={3}>
                            <TextField fullWidth label="Payment Terms" value={formData.payment_terms} onChange={handleChange('payment_terms')} />
                        </Grid>
                        <Grid item xs={12} sm={3}>
                            <TextField fullWidth label="Freight Terms" value={formData.freight_terms} onChange={handleChange('freight_terms')} placeholder='e.g., "Freight Paid"' />
                        </Grid>
                        <Grid item xs={12} sm={3}>
                            <TextField fullWidth label="Issuing Bank" value={formData.issuing_bank} onChange={handleChange('issuing_bank')} />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField fullWidth label="L/C No. and Date" value={formData.lc_no_and_date} onChange={handleChange('lc_no_and_date')} />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                select fullWidth label="Select Bank Account"
                                value={formData.company_bank_id}
                                onChange={(e) => {
                                    const bankId = e.target.value;
                                    const bank = bankAccounts.find(b => b.id === parseInt(bankId));
                                    setFormData({
                                        ...formData,
                                        company_bank_id: bankId,
                                        account_name: bank?.account_name || '',
                                        bank_name: bank?.bank_name || '',
                                        account_no: bank?.account_no || '',
                                        swift_code: bank?.swift_code || '',
                                        branch: bank?.branch_address || ''
                                    });
                                }}
                            >
                                <MenuItem value="">-- Select Bank --</MenuItem>
                                {bankAccounts.map(b => (
                                    <MenuItem key={b.id} value={b.id}>{b.bank_name} - {b.account_no}</MenuItem>
                                ))}
                            </TextField>
                        </Grid>
                        <Grid item xs={12} sm={3}>
                            <TextField fullWidth label="Account Name" value={formData.account_name} onChange={handleChange('account_name')} />
                        </Grid>
                        <Grid item xs={12} sm={3}>
                            <TextField fullWidth label="Swift Code" value={formData.swift_code} onChange={handleChange('swift_code')} />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField fullWidth label="Branch" value={formData.branch} onChange={handleChange('branch')} />
                        </Grid>
                    </Grid>
                </AccordionDetails>
            </Accordion>

            {/* Product Details */}
            <Accordion defaultExpanded>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography variant="h6">Product Details</Typography>
                </AccordionSummary>
                <AccordionDetails>
                    <Grid container spacing={2}>
                        <Grid item xs={12} sm={4}>
                            <TextField fullWidth label="Product Name" value={formData.product_name} onChange={handleChange('product_name')} />
                        </Grid>
                        <Grid item xs={12} sm={2}>
                            <TextField fullWidth label="HS Code" value={formData.hs_code} onChange={handleChange('hs_code')} />
                        </Grid>
                        <Grid item xs={12} sm={3}>
                            <TextField fullWidth label="Description" value={formData.description} onChange={handleChange('description')} />
                        </Grid>
                        <Grid item xs={12} sm={3}>
                            <TextField fullWidth label="Packing Type" value={formData.packing_type} onChange={handleChange('packing_type')} />
                        </Grid>
                        <Grid item xs={12} sm={2}>
                            <TextField fullWidth label="Tare Weight" type="number" value={formData.tare_weight} onChange={handleChange('tare_weight')} />
                        </Grid>
                        <Grid item xs={12} sm={2}>
                            <TextField fullWidth label="Net Weight" type="number" value={formData.net_weight} onChange={handleChange('net_weight')} />
                        </Grid>
                        <Grid item xs={12} sm={2}>
                            <TextField fullWidth label="Total Packages" type="number" value={formData.total_packages} onChange={handleChange('total_packages')} />
                        </Grid>
                        <Grid item xs={12} sm={2}>
                            <TextField fullWidth label="Per FCL Packages" type="number" value={formData.per_fcl_packages} onChange={handleChange('per_fcl_packages')} />
                        </Grid>
                        <Grid item xs={12} sm={2}>
                            <TextField fullWidth label="Nett Weight" type="number" value={formData.nett_weight} onChange={handleChange('nett_weight')} InputProps={{ readOnly: true }} />
                        </Grid>
                        <Grid item xs={12} sm={2}>
                            <TextField fullWidth label="Gross Weight" type="number" value={formData.total_gross_weight} InputProps={{ readOnly: true }} />
                        </Grid>
                        <Grid item xs={12} sm={1}>
                            <TextField fullWidth label="Unit 1" value={formData.unit_1} onChange={handleChange('unit_1')} placeholder="e.g., MT" />
                        </Grid>
                        <Grid item xs={12} sm={1}>
                            <TextField fullWidth label="Unit 2" value={formData.unit_2} onChange={handleChange('unit_2')} placeholder="e.g., BAGS" />
                        </Grid>
                        <Grid item xs={12} sm={2}>
                            <TextField select fullWidth label="UOM" value={formData.uom} onChange={handleChange('uom')}>
                                <MenuItem value="MT">MT</MenuItem>
                                <MenuItem value="KG">KG</MenuItem>
                                <MenuItem value="LTR">LTR</MenuItem>
                            </TextField>
                        </Grid>
                        <Grid item xs={12} sm={2}>
                            <TextField fullWidth label="Unit Rate" type="number" value={formData.unit_rate} onChange={handleChange('unit_rate')} />
                        </Grid>
                        <Grid item xs={12} sm={3}>
                            <TextField fullWidth label="Lot No." value={formData.lot_no} onChange={handleChange('lot_no')} />
                        </Grid>
                    </Grid>
                </AccordionDetails>
            </Accordion>

            {/* Pricing */}
            <Accordion defaultExpanded>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography variant="h6">Pricing ({formData.currency})</Typography>
                </AccordionSummary>
                <AccordionDetails>
                    <Grid container spacing={2}>
                        <Grid item xs={12} sm={4}>
                            <TextField fullWidth label="FOB Amount" type="number" value={formData.fob_amount} onChange={handleChange('fob_amount')} />
                        </Grid>
                        <Grid item xs={12} sm={4}>
                            <TextField fullWidth label="Freight Amount" type="number" value={formData.freight_amount} onChange={handleChange('freight_amount')} />
                        </Grid>
                        <Grid item xs={12} sm={4}>
                            <TextField fullWidth label="Total Amount" type="number" value={formData.total_amount} onChange={handleChange('total_amount')} InputProps={{ readOnly: true }} />
                        </Grid>
                    </Grid>
                    {master?.amount_in_words && (
                        <Box sx={{ mt: 2, p: 1.5, bgcolor: '#f5f5f5', borderRadius: 1 }}>
                            <Typography variant="body2" color="text.secondary">Amount in Words:</Typography>
                            <Typography variant="body1" fontWeight="bold">{master.amount_in_words}</Typography>
                        </Box>
                    )}
                </AccordionDetails>
            </Accordion>

            {/* Containers Section */}
            <Paper sx={{ mt: 2, p: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6">
                        Containers ({master?.containers?.length || 0})
                    </Typography>
                    <Button variant="outlined" startIcon={<AddIcon />} onClick={handleAddContainer}>
                        Add Container
                    </Button>
                </Box>

                {master?.containers?.length > 0 ? (
                    <TableContainer>
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell>#</TableCell>
                                    <TableCell>Container No.</TableCell>
                                    <TableCell>Truck No.</TableCell>
                                    <TableCell>Liner Seal</TableCell>
                                    <TableCell>RFID Seal</TableCell>
                                    <TableCell>Size</TableCell>
                                    <TableCell>Tare Wt</TableCell>
                                    <TableCell>Gross Wt</TableCell>
                                    <TableCell>Products</TableCell>
                                    <TableCell>Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {master.containers.map((container) => (
                                    <TableRow key={container.id}>
                                        <TableCell>{container.sequence_no}</TableCell>
                                        <TableCell><strong>{container.container_no}</strong></TableCell>
                                        <TableCell>{container.truck_no}</TableCell>
                                        <TableCell>{container.liner_seal_no}</TableCell>
                                        <TableCell>{container.rfid_seal_no}</TableCell>
                                        <TableCell>{container.container_size}</TableCell>
                                        <TableCell>{container.tare_weight}</TableCell>
                                        <TableCell>{container.gross_weight}</TableCell>
                                        <TableCell>{container.products?.length || 0}</TableCell>
                                        <TableCell>
                                            <IconButton size="small" onClick={() => handleEditContainer(container)}>
                                                <EditIcon fontSize="small" />
                                            </IconButton>
                                            <IconButton size="small" color="error" onClick={() => handleDeleteContainer(container.id)}>
                                                <DeleteIcon fontSize="small" />
                                            </IconButton>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                ) : (
                    <Typography color="text.secondary" align="center" sx={{ py: 3 }}>
                        No containers added yet. Click "Add Container" to begin.
                    </Typography>
                )}
            </Paper>

            {/* Container Dialog */}
            <ContainerDialog
                open={containerDialogOpen}
                onClose={handleCloseContainerDialog}
                onSave={handleContainerSave}
                container={editingContainer}
                masterData={formData}
                weighbridges={weighbridges}
                conflictDraft={restoringContainerConflict ? conflictDraft : null}
            />
            </Box>
            {id && (
                <Box sx={{ width: 200, flexShrink: 0 }}>
                    <DocumentSidebar currentDoc={currentDoc} masterId={id} onNavigate={handleDocNavigate} />
                </Box>
            )}
        </Box>
    );
}
