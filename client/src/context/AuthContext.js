import React, { createContext, useState, useContext, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

function clearStoredSession() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('selectedCompany');
}

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [selectedCompany, setSelectedCompany] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;
        const savedToken = localStorage.getItem('token');
        const savedUser = localStorage.getItem('user');
        const savedCompany = localStorage.getItem('selectedCompany');

        if (!savedToken) {
            setLoading(false);
            return undefined;
        }

        if (savedCompany) {
            try {
                setSelectedCompany(JSON.parse(savedCompany));
            } catch {
                localStorage.removeItem('selectedCompany');
            }
        }
        setToken(savedToken);
        if (savedUser) {
            try {
                setUser(JSON.parse(savedUser));
            } catch {
                localStorage.removeItem('user');
            }
        }

        authAPI.me()
            .then(response => {
                if (!cancelled) {
                    setUser(response.data.user);
                    localStorage.setItem('user', JSON.stringify(response.data.user));
                }
            })
            .catch(() => {
                if (!cancelled) {
                    clearStoredSession();
                    setUser(null);
                    setToken(null);
                    setSelectedCompany(null);
                }
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });

        return () => { cancelled = true; };
    }, []);

    const login = (userData, authToken) => {
        const previousUser = localStorage.getItem('user');
        const previousId = previousUser ? JSON.parse(previousUser).id : null;
        if (previousId !== userData.id) {
            localStorage.removeItem('selectedCompany');
            setSelectedCompany(null);
        }
        setUser(userData);
        setToken(authToken);
        localStorage.setItem('token', authToken);
        localStorage.setItem('user', JSON.stringify(userData));
    };

    const logout = () => {
        setUser(null);
        setToken(null);
        setSelectedCompany(null);
        clearStoredSession();
    };

    const selectCompany = (company) => {
        setSelectedCompany(company);
        if (company) localStorage.setItem('selectedCompany', JSON.stringify(company));
        else localStorage.removeItem('selectedCompany');
    };

    return (
        <AuthContext.Provider value={{
            user, token, selectedCompany, loading,
            login, logout, selectCompany,
            isAuthenticated: !!token,
            mustChangePassword: Boolean(user?.mustChangePassword)
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within an AuthProvider');
    return context;
}
