import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    AppBar, Toolbar, Typography, Button, Box, IconButton, Chip
} from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import { useAuth } from '../context/AuthContext';

export default function Layout({ children }) {
    const { user, selectedCompany, logout, selectCompany } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const navItems = [
        { label: 'Clients', path: '/clients' },
        { label: 'Masters', path: '/masters' },
    ];

    const handleSwitchCompany = () => {
        selectCompany(null);
    };

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
            <AppBar position="static">
                <Toolbar>
                    <Typography variant="h6" sx={{ mr: 3, fontWeight: 'bold' }}>
                        Export Manager
                    </Typography>

                    {navItems.map(item => (
                        <Button
                            key={item.path}
                            color="inherit"
                            onClick={() => navigate(item.path)}
                            sx={{
                                mx: 0.5,
                                borderBottom: location.pathname.startsWith(item.path) ? '2px solid white' : 'none',
                                borderRadius: 0
                            }}
                        >
                            {item.label}
                        </Button>
                    ))}

                    <Box sx={{ flexGrow: 1 }} />

                    <Chip
                        label={selectedCompany?.name}
                        color="secondary"
                        size="small"
                        sx={{ mr: 1 }}
                    />
                    <IconButton color="inherit" onClick={handleSwitchCompany} title="Switch Company">
                        <SwapHorizIcon />
                    </IconButton>
                    <Typography variant="body2" sx={{ mr: 1 }}>
                        {user?.fullName}
                    </Typography>
                    <IconButton color="inherit" onClick={logout} title="Logout">
                        <LogoutIcon />
                    </IconButton>
                </Toolbar>
            </AppBar>

            <Box sx={{ flexGrow: 1, bgcolor: '#f9f9f9' }}>
                {children}
            </Box>
        </Box>
    );
}
