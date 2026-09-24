import React from 'react';
import { Box, Typography, Button, Paper } from '@mui/material';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';

/**
 * Generic placeholder for documents not yet built as editable forms
 */
export default function GenericDocForm({ docType, data, onDownloadPDF }) {
    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h5" fontWeight="bold">{docType}</Typography>
                <Button variant="outlined" startIcon={<PictureAsPdfIcon />} onClick={onDownloadPDF}>
                    Download PDF
                </Button>
            </Box>
            <Paper sx={{ p: 3, textAlign: 'center' }}>
                <Typography color="text.secondary">
                    Editable form for this document is coming soon.<br/>
                    Use "Download PDF" to generate from Master data.
                </Typography>
            </Paper>
        </Box>
    );
}
