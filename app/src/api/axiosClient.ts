import axios from 'axios';
import { BASE_URL } from '../config/constants';
import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'auth_token';

const axiosClient = axios.create({
    baseURL: BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor to add token on every request
axiosClient.interceptors.request.use(
    async (config) => {
        try {
            const token = await SecureStore.getItemAsync(TOKEN_KEY);
            if (token) {
                // Server expects token in 'auth' header (not 'Authorization')
                config.headers['auth'] = token;
            }
        } catch (e) {
            console.error('[Axios] Error getting token from SecureStore', e);
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor
axiosClient.interceptors.response.use(
    (response) => {
        if (response && response.data) {
            return response.data;
        }
        return response;
    },
    (error) => {
        console.error('[Axios] API Error:', error.response?.status, error.config?.url);
        throw error;
    }
);

export default axiosClient;
