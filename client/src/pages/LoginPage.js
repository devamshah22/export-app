import React, { useState } from 'react';
import {
    Box, Card, CardContent, TextField, Button, Typography, Alert, Link, MenuItem
} from '@mui/material';
import { authAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
    const { login } = useAuth();
    const [mode, setMode] = useState('login'); // 'login', 'register', 'forgot'
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [securityQuestions, setSecurityQuestions] = useState([]);
    const [securityQuestion, setSecurityQuestion] = useState('');
    const [securityAnswer, setSecurityAnswer] = useState('');
    const [resetToken, setResetToken] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);

    const loadSecurityQuestions = async () => {
        try {
            const response = await authAPI.getSecurityQuestions();
            setSecurityQuestions(response.data.securityQuestions || []);
        } catch {
            setError('Unable to load security questions.');
        }
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await authAPI.login(username, password);
            login(response.data.user, response.data.token);
        } catch (err) {
            setError(err.response?.data?.error || 'Login failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (password !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }
        if (password.length < 8) {
            setError('Password must be at least 8 characters.');
            return;
        }

        setLoading(true);
        try {
            await authAPI.register({ username, password, fullName, securityQuestion, securityAnswer });
            setSuccess('Account created successfully! You can now login.');
            setMode('login');
            setPassword('');
            setConfirmPassword('');
            setFullName('');
            setSecurityQuestion('');
            setSecurityAnswer('');
        } catch (err) {
            setError(err.response?.data?.error || 'Registration failed.');
        } finally {
            setLoading(false);
        }
    };

    const handleForgotPassword = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (!username) {
            setError('Please enter your username.');
            return;
        }

        setLoading(true);
        try {
            const response = await authAPI.requestPasswordReset(username);
            if (response.data.challengeToken && response.data.securityQuestion) {
                setResetToken(response.data.challengeToken);
                setSecurityQuestion(response.data.securityQuestion);
                setSuccess('Answer your security question and choose a new password.');
            } else {
                setSuccess(response.data.message);
            }
        } catch (err) {
            setError(err.response?.data?.error || 'Unable to start password recovery.');
        } finally {
            setLoading(false);
        }
    };

    const resetForm = (newMode) => {
        setMode(newMode);
        setError('');
        setSuccess('');
        setPassword('');
        setConfirmPassword('');
        setFullName('');
        setSecurityQuestion('');
        setSecurityAnswer('');
        setResetToken('');
    };

    return (
        <Box sx={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: '#f5f5f5'
        }}>
            <Card sx={{ maxWidth: 420, width: '100%', mx: 2 }}>
                <CardContent sx={{ p: 4 }}>
                    <Typography variant="h4" align="center" gutterBottom fontWeight="bold">
                        Export Manager
                    </Typography>
                    <Typography variant="body2" align="center" color="text.secondary" sx={{ mb: 3 }}>
                        {mode === 'login' && 'Sign in to your account'}
                        {mode === 'register' && 'Create a new account'}
                        {mode === 'forgot' && 'Reset your password'}
                    </Typography>

                    {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                    {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

                    {/* LOGIN FORM */}
                    {mode === 'login' && (
                        <form onSubmit={handleLogin}>
                            <TextField
                                fullWidth label="Username" value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                margin="normal" required autoFocus
                            />
                            <TextField
                                fullWidth label="Password" type="password" value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                margin="normal" required
                            />
                            <Button
                                type="submit" fullWidth variant="contained" size="large"
                                disabled={loading} sx={{ mt: 3, py: 1.5 }}
                            >
                                {loading ? 'Signing in...' : 'Sign In'}
                            </Button>
                            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between' }}>
                                <Link component="button" variant="body2" onClick={() => resetForm('forgot')}>
                                    Forgot Password?
                                </Link>
                                <Link component="button" variant="body2" onClick={() => { resetForm('register'); loadSecurityQuestions(); }}>
                                    Create Account
                                </Link>
                            </Box>
                        </form>
                    )}

                    {/* REGISTER FORM */}
                    {mode === 'register' && (
                        <form onSubmit={handleRegister}>
                            <TextField
                                fullWidth label="Full Name" value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                margin="normal" required autoFocus
                            />
                            <TextField
                                fullWidth label="Username" value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                margin="normal" required
                            />
                            <TextField
                                fullWidth label="Password" type="password" value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                margin="normal" required
                                helperText="Minimum 8 characters"
                            />
                            <TextField
                                fullWidth label="Confirm Password" type="password" value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                margin="normal" required
                            />
                            <TextField
                                select fullWidth label="Security Question" value={securityQuestion}
                                onChange={(e) => setSecurityQuestion(e.target.value)}
                                margin="normal" required
                            >
                                {securityQuestions.map(question => <MenuItem key={question} value={question}>{question}</MenuItem>)}
                            </TextField>
                            <TextField
                                fullWidth label="Security Answer" value={securityAnswer}
                                onChange={(e) => setSecurityAnswer(e.target.value)}
                                margin="normal" required
                            />
                            <Button
                                type="submit" fullWidth variant="contained" size="large"
                                disabled={loading} sx={{ mt: 3, py: 1.5 }}
                            >
                                {loading ? 'Creating Account...' : 'Create Account'}
                            </Button>
                            <Box sx={{ mt: 2, textAlign: 'center' }}>
                                <Link component="button" variant="body2" onClick={() => resetForm('login')}>
                                    Already have an account? Sign In
                                </Link>
                            </Box>
                        </form>
                    )}

                    {/* FORGOT PASSWORD FORM */}
                    {mode === 'forgot' && !resetToken && (
                        <form onSubmit={handleForgotPassword}>
                            <TextField
                                fullWidth label="Username" value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                margin="normal" required autoFocus
                            />
                            <Button
                                type="submit" fullWidth variant="contained" size="large"
                                disabled={loading} sx={{ mt: 3, py: 1.5 }}
                            >
                                {loading ? 'Checking...' : 'Continue'}
                            </Button>
                            <Box sx={{ mt: 2, textAlign: 'center' }}>
                                <Link component="button" variant="body2" onClick={() => resetForm('login')}>
                                    Back to Sign In
                                </Link>
                            </Box>
                        </form>
                    )}
                    {mode === 'forgot' && resetToken && (
                        <form onSubmit={async (e) => {
                            e.preventDefault();
                            setError('');
                            setLoading(true);
                            try {
                                await authAPI.completePasswordReset({
                                    challengeToken: resetToken,
                                    securityAnswer,
                                    newPassword: password,
                                    confirmPassword
                                });
                                setResetToken('');
                                setSecurityAnswer('');
                                setPassword('');
                                setConfirmPassword('');
                                setSuccess('Password reset successfully. You can now sign in.');
                                setMode('login');
                            } catch (err) {
                                setError(err.response?.data?.error || 'Password reset failed.');
                            } finally {
                                setLoading(false);
                            }
                        }}>
                            <TextField fullWidth label="Security Question" value={securityQuestion} margin="normal" InputProps={{ readOnly: true }} />
                            <TextField fullWidth label="Security Answer" value={securityAnswer} onChange={(e) => setSecurityAnswer(e.target.value)} margin="normal" required autoFocus />
                            <TextField fullWidth label="New Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} margin="normal" required helperText="Minimum 8 characters" />
                            <TextField fullWidth label="Confirm New Password" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} margin="normal" required />
                            <Button type="submit" fullWidth variant="contained" size="large" disabled={loading} sx={{ mt: 3, py: 1.5 }}>
                                {loading ? 'Resetting...' : 'Reset Password'}
                            </Button>
                            <Box sx={{ mt: 2, textAlign: 'center' }}>
                                <Link component="button" variant="body2" onClick={() => resetForm('login')}>Back to Sign In</Link>
                            </Box>
                        </form>
                    )}
                </CardContent>
            </Card>
        </Box>
    );
}
