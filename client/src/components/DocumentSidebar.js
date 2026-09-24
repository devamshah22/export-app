import React from 'react';
import { List, ListItemButton, ListItemText, Paper, Typography, Divider } from '@mui/material';

const DOCUMENT_LIST = [
    { key: 'edit', label: 'Master Sheet' },
    { key: 'BL_DRAFT', label: 'BL Draft' },
    { key: 'PI', label: 'Proforma Invoice (PI)' },
    { key: 'CI', label: 'Commercial Invoice (CI)' },
    { key: 'PL', label: 'Packing List (PL)' },
    { key: 'COA', label: 'Certificate of Analysis (COA)' },
    { key: 'CCVO', label: 'CCVO' },
    { key: 'BC', label: 'Beneficiary Certificate' },
    { key: 'MFG_CERTI', label: "Manufacturer's Certificate" },
    { key: 'SCOMET', label: 'SCOMET Declaration' },
    { key: 'FORM_SDF', label: 'Form SDF' },
    { key: 'EUC', label: 'End Use Certificate' },
    { key: 'ANNEXURE_A', label: 'Annexure A' },
    { key: 'ANNEXURE_C', label: 'Annexure C' },
    { key: 'DGD', label: 'DGD' },
    { key: 'VGM', label: 'VGM' },
];

export default function DocumentSidebar({ currentDoc, masterId, onNavigate }) {
    return (
        <Paper sx={{ position: 'sticky', top: 80, maxHeight: 'calc(100vh - 100px)', overflow: 'auto' }}>
            <Typography variant="subtitle2" sx={{ p: 1.5, fontWeight: 'bold', bgcolor: '#1565c0', color: '#fff' }}>
                Documents
            </Typography>
            <List dense disablePadding>
                {DOCUMENT_LIST.map((doc) => (
                    <ListItemButton
                        key={doc.key}
                        selected={currentDoc === doc.key}
                        onClick={() => onNavigate(doc.key)}
                        sx={{ py: 0.5, '&.Mui-selected': { bgcolor: '#e3f2fd' } }}
                    >
                        <ListItemText
                            primary={doc.label}
                            primaryTypographyProps={{ fontSize: '12px' }}
                        />
                    </ListItemButton>
                ))}
            </List>
        </Paper>
    );
}

export { DOCUMENT_LIST };
