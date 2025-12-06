import React, { createContext, useContext, useState, useEffect } from 'react';
import { api, setAuthToken, getAuthToken } from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check if user is already logged in
        const token = getAuthToken();
        if (token) {
            // Token exists, user is logged in
            // We could validate token here, but for now just trust it
            const storedUser = localStorage.getItem('user');
            if (storedUser) {
                setUser(JSON.parse(storedUser));
            }
        }
        setLoading(false);
    }, []);

    const login = async (email, password) => {
        const response = await api.auth.login(email, password);
        setUser(response.user);
        localStorage.setItem('user', JSON.stringify(response.user));
        return response;
    };

    const register = async (email, password, name) => {
        const response = await api.auth.register(email, password, name);
        // In development, auto-login after registration
        if (response.autoVerified) {
            return login(email, password);
        }
        return response;
    };

    const logout = () => {
        api.auth.logout();
        setUser(null);
        localStorage.removeItem('user');
        localStorage.removeItem('forsta_kapitlet_library');
        localStorage.removeItem('forsta_kapitlet_profile');
    };

    const value = {
        user,
        loading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
