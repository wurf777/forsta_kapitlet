import React, { useState } from 'react';
import { api, getAuthToken } from '../services/api';
import { AuthContext } from './AuthContextBase';
import { fetchUserProfile } from '../services/storage';

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(() => {
        const token = getAuthToken();
        if (!token) return null;
        const storedUser = localStorage.getItem('user');
        return storedUser ? JSON.parse(storedUser) : null;
    });
    const [loading] = useState(false);

    const login = async (email, password) => {
        const response = await api.auth.login(email, password);
        setUser(response.user);
        localStorage.setItem('user', JSON.stringify(response.user));

        // Hydrate profile from backend into localStorage
        fetchUserProfile().catch(err =>
            console.error('Failed to hydrate profile on login:', err)
        );

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
        isAdmin: !!user?.isAdmin,
        login,
        register,
        logout,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
