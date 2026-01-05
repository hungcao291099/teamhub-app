import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { authService } from '../services/authService';
import axiosClient from '../api/axiosClient';

interface AuthContextType {
    user: any;
    loading: boolean;
    login: (username: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadAuth = async () => {
            try {
                const token = await authService.getToken();
                const storedUser = await authService.getUser();

                if (token && storedUser) {
                    // Set default header
                    axiosClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
                    setUser(storedUser);
                }
            } catch (e) {
                console.error("Failed to load auth", e);
            } finally {
                setLoading(false);
            }
        };

        loadAuth();
    }, []);

    const login = async (username: string, password: string) => {
        try {
            const data: any = await authService.login(username, password);

            // Backend returns: { token, user: { ... } }
            // So data is that object.

            const { token, user: userData } = data; // Destructure correctly based on AuthController

            if (token) {
                await authService.setToken(token);
                // We want to store the user object, not the whole data minus token if structure is { token, user }
                await authService.setUser(userData);

                axiosClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
                setUser(userData);
            }
        } catch (error) {
            throw error;
        }
    };

    const logout = async () => {
        await authService.logout();
        delete axiosClient.defaults.headers.common['Authorization'];
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
