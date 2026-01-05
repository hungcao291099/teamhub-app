import axiosClient from '../api/axiosClient';
import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'user_info';

export const authService = {
    login: async (username: string, password: string) => {
        try {
            // Add clientType for mobile
            const response = await axiosClient.post('/auth/login', { username, password, clientType: 'mobile' });
            console.log('[AuthService] Login response:', JSON.stringify(response));
            return response;
        } catch (error) {
            console.error('[AuthService] Login error:', error);
            throw error;
        }
    },

    setToken: async (token: string) => {
        console.log('[AuthService] Saving token:', token ? `${token.substring(0, 20)}...` : 'NULL');
        await SecureStore.setItemAsync(TOKEN_KEY, token);
        // Verify it was saved
        const saved = await SecureStore.getItemAsync(TOKEN_KEY);
        console.log('[AuthService] Token saved and verified:', saved ? 'YES' : 'NO');
    },

    getToken: async () => {
        const token = await SecureStore.getItemAsync(TOKEN_KEY);
        console.log('[AuthService] getToken:', token ? `${token.substring(0, 20)}...` : 'NULL');
        return token;
    },

    removeToken: async () => {
        await SecureStore.deleteItemAsync(TOKEN_KEY);
    },

    setUser: async (user: any) => {
        console.log('[AuthService] Saving user:', user?.username);
        await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
    },

    getUser: async () => {
        const user = await SecureStore.getItemAsync(USER_KEY);
        return user ? JSON.parse(user) : null;
    },

    removeUser: async () => {
        await SecureStore.deleteItemAsync(USER_KEY);
    },

    logout: async () => {
        await SecureStore.deleteItemAsync(TOKEN_KEY);
        await SecureStore.deleteItemAsync(USER_KEY);
    }
};
