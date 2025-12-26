import { api } from '@/lib/api';
import { UserProfile } from '@/models/User';

interface LoginResponse {
    access_token: string;
    user: UserProfile;
}

export const AuthService = {
    login: async (email: string, password: string) => {
        const response = await api.post<LoginResponse>('/auth/login', { email, password });
        if (response.access_token) {
            localStorage.setItem('token', response.access_token);
            return response.user;
        }
        throw new Error('Login failed: No access token');
    },

    register: async (email: string, password: string, name: string) => {
        return api.post<UserProfile>('/auth/register', { email, password, name });
    },

    logout: async () => {
        localStorage.removeItem('token');
        // Optional: Call backend logout if needed, but JWT is stateless usually
    },

    getCurrentUser: async () => {
        try {
            return await api.get<UserProfile>('/auth/profile');
        } catch {
            return null;
        }
    },

    getToken: () => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('token');
        }
        return null;
    },

    // Google Login - sends ID token to backend for verification
    loginWithGoogle: async (idToken: string) => {
        const response = await api.post<LoginResponse>('/auth/google', { token: idToken });
        if (response.access_token) {
            localStorage.setItem('token', response.access_token);
            return response.user;
        }
        throw new Error('Google login failed: No access token');
    }
};
