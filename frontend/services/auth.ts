import { api } from '@/lib/api';

export const AuthService = {
    login: async (email: string, password: string) => {
        const response = await api.post('/auth/login', { email, password });
        if (response.access_token) {
            localStorage.setItem('token', response.access_token);
            return response.user;
        }
        throw new Error('Login failed: No access token');
    },

    register: async (email: string, password: string, name: string) => {
        return api.post('/auth/register', { email, password, name });
    },

    logout: async () => {
        localStorage.removeItem('token');
        // Optional: Call backend logout if needed, but JWT is stateless usually
    },

    getCurrentUser: async () => {
        try {
            return await api.get('/auth/profile');
        } catch (error) {
            return null;
        }
    },

    getToken: () => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('token');
        }
        return null;
    },

    // Stub for Google Login - requires backend implementation
    loginWithGoogle: async () => {
        console.warn('Google Login not yet implemented on backend');
        alert("Google Login is not yet implemented.");
    }
};
