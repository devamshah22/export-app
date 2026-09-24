import React, { useState } from 'react';
import { Box, Card, CardContent, TextField, Button, Typography, Alert } from '@mui/material';
import { authAPI } from '../services/api';
import { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import MenuItem from '@mui/material/MenuItem';

export default function PasswordChangePage() {
    const { user, logout } = useAuth();
    const [securityQuestions, setSecurityQuestions] = useState([]);
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [securityQuestion, setSecurityQuestion] = useState(user?.securityQuestion || '');
    const [securityAnswer, setSecurityAnswer] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        authAPI.getSecurityQuestions()
            .then(response => setSecurityQuestions(response.data.securityQuestions || []))
            .catch(() => setSecurityQuestions([]));
    }, []);

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError('');
        if (newPassword.length < 8 || newPassword !== confirmPassword) {
            setError('New password must be at least 8 characters and match confirmation.');
            return;
        }
        setLoading(true);
        try {
            await authAPI.changePassword({
                currentPassword,
                newPassword,
                confirmPassword,
                securityQuestion,
                securityAnswer
            });
            // Password change invalidates current token by design.
            logout();
        } catch (err) {
            setError(err.response?.data?.error || 'Unable to change password.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#f5f5f5' }}>
            <Card sx={{ maxWidth: 480, width: '100%', mx: 2 }}>
                <CardContent sx={{ p: 4 }}>
                    <Typography variant="h5" fontWeight="bold" gutterBottom>Set Your Password</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Set a new password and security question before using Export Manager.
                    </Typography>
                    {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                    <form onSubmit={handleSubmit}>
                        <TextField fullWidth label="Current Password" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} margin="normal" required autoFocus />
                        <TextField fullWidth label="New Password" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} margin="normal" required helperText="Minimum 8 characters" />
                        <TextField fullWidth label="Confirm New Password" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} margin="normal" required />
                        <TextField
                            select
                            fullWidth
                            label="Security Question"
                            value={securityQuestion}
                            onChange={(e) => setSecurityQuestion(e.target.value)}
                            margin="normal"
                            required
                        >
                            {securityQuestions.map(question => (
                                <MenuItem key={question} value={question}>
                                    {question}
                                </MenuItem>
                            ))}
                        </TextField>
                        <TextField fullWidth label="Security Answer" value={securityAnswer} onChange={(e) => setSecurityAnswer(e.target.value)} margin="normal" required />
                        <Button type="submit" fullWidth variant="contained" size="large" disabled={loading} sx={{ mt: 3, py: 1.5 }}>
                            {loading ? 'Saving...' : 'Save and Continue'}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </Box>
    );
}
