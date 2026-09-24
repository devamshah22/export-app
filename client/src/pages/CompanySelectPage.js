import React, { useState, useEffect } from 'react';
import {
    Box, Card, CardContent, CardActionArea, Typography, Grid, CircularProgress
} from '@mui/material';
import BusinessIcon from '@mui/icons-material/Business';
import { companiesAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function CompanySelectPage() {
    const { selectCompany } = useAuth();
    const [companies, setCompanies] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadCompanies();
    }, []);

    const loadCompanies = async () => {
        try {
            const response = await companiesAPI.getAll();
            setCompanies(response.data);
        } catch (err) {
            console.error('Failed to load companies:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSelect = (company) => {
        selectCompany(company);
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box sx={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: '#f5f5f5',
            p: 3
        }}>
            <Typography variant="h4" gutterBottom fontWeight="bold">
                Select Company
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                Choose which company you want to work with
            </Typography>

            <Grid container spacing={3} justifyContent="center" maxWidth={800}>
                {companies.map((company) => (
                    <Grid item xs={12} sm={6} key={company.id}>
                        <Card sx={{ height: '100%' }}>
                            <CardActionArea onClick={() => handleSelect(company)} sx={{ p: 3, height: '100%' }}>
                                <CardContent sx={{ textAlign: 'center' }}>
                                    <BusinessIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
                                    <Typography variant="h6" fontWeight="bold">
                                        {company.name}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                        {company.city}, {company.state}
                                    </Typography>
                                </CardContent>
                            </CardActionArea>
                        </Card>
                    </Grid>
                ))}
            </Grid>
        </Box>
    );
}
