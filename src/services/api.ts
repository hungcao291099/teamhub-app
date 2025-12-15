import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001',
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add a request interceptor to add the auth token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers['auth'] = token;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Optional: Add response interceptor to handle 401 (Auto logout)
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            // Logic to logout user if token is invalid
            localStorage.removeItem('token');
            // window.location.href = '/login'; // Or handle via Context
        }
        return Promise.reject(error);
    }
);

// Theme Events
export const getGlobalTheme = async () => {
    const response = await api.get('/settings/theme');
    return response.data;
};

export const updateGlobalTheme = async (themeId: string) => {
    const response = await api.post('/settings/theme', { themeId });
    return response.data;
};

export default api;
