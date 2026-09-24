import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import CompanySelectPage from './pages/CompanySelectPage';
import ClientsPage from './pages/ClientsPage';
import MasterListPage from './pages/MasterListPage';
import MasterFormPage from './pages/MasterFormPage';
import PasswordChangePage from './pages/PasswordChangePage';

const theme = createTheme({
    palette: {
        primary: { main: '#1565c0' },
        secondary: { main: '#f57c00' }
    },
    typography: {
        fontFamily: '"Roboto", "Segoe UI", sans-serif',
    },
    components: {
        MuiTextField: {
            defaultProps: {
                InputLabelProps: { shrink: true },
                size: 'normal'
            }
        },
        MuiInputLabel: {
            defaultProps: {
                shrink: true
            }
        },
        MuiOutlinedInput: {
            defaultProps: {
                notched: true
            }
        }
    }
});

function AppRoutes() {
    const { isAuthenticated, selectedCompany, loading, mustChangePassword } = useAuth();

    if (loading) return null;

    if (!isAuthenticated) {
        return (
            <Routes>
                <Route path="*" element={<LoginPage />} />
            </Routes>
        );
    }

    if (mustChangePassword) {
        return (
            <Routes>
                <Route path="*" element={<PasswordChangePage />} />
            </Routes>
        );
    }

    if (!selectedCompany) {
        return (
            <Routes>
                <Route path="*" element={<CompanySelectPage />} />
            </Routes>
        );
    }

    return (
        <Layout>
            <Routes>
                <Route path="/clients" element={<ClientsPage />} />
                <Route path="/masters" element={<MasterListPage />} />
                <Route path="/masters/new" element={<MasterFormPage />} />
                <Route path="/masters/:id/edit" element={<MasterFormPage />} />
                <Route path="/masters/:id/:docType" element={<MasterFormPage />} />
                <Route path="/" element={<Navigate to="/masters" replace />} />
                <Route path="*" element={<Navigate to="/masters" replace />} />
            </Routes>
        </Layout>
    );
}

function App() {
    return (
        <ThemeProvider theme={theme}>
            <AuthProvider>
                <BrowserRouter>
                    <AppRoutes />
                </BrowserRouter>
            </AuthProvider>
        </ThemeProvider>
    );
}

export default App;
