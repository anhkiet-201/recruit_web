import { api } from "@/lib/api";
import { UserProfile, EmployerRequest } from "@/models/User";

export const UserService = {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    getProfile: async (userId: string): Promise<UserProfile | null> => {
        // NOTE: Backend currently only supports getting own profile via auth/profile
        // If userId is needed for others, backend implementation is required.
        try {
            return await api.get<UserProfile>('/auth/profile');
        } catch {
            return null;
        }
    },

    syncUser: async (user: { uid: string; email: string; displayName?: string | null; photoURL?: string | null }): Promise<UserProfile> => {
        try {
            return await api.get<UserProfile>('/auth/profile');
        } catch (error) {
            console.warn("Profile not found, attempting to register...", error);
            try {
                // Register new user if profile doesn't exist
                return await api.post<UserProfile>('/auth/register', {
                    uid: user.uid,
                    email: user.email,
                    name: user.displayName || user.email.split('@')[0],
                    password: 'google-oauth-dummy-password-' + Math.random().toString(36).slice(-8)
                });
            } catch (regError) {
                console.error("Sync user registration failed", regError);
                // Return basic info so UI doesn't crash, but features requiring DB will fail
                return {
                    id: user.uid,
                    email: user.email,
                    role: 'candidate',
                    createdAt: new Date().toISOString()
                };
            }
        }
    },

    updateProfile: async (userId: string, data: Partial<UserProfile>): Promise<UserProfile> => {
        // Backend maps PATCH /users/:id
        return api.patch<UserProfile>(`/users/${userId}`, data);
    },

    uploadCV: async (file: File): Promise<{ url: string }> => {
        const formData = new FormData();
        formData.append('file', file);
        return api.post<{ url: string }>('/users/profile/cv', formData);
    },

    uploadAvatar: async (file: File): Promise<{ url: string }> => {
        const formData = new FormData();
        formData.append('file', file);
        return api.post<{ url: string }>('/users/profile/avatar', formData);
    },

    getAllUsers: async (): Promise<UserProfile[]> => {
        return api.get<UserProfile[]>('/users');
    },

    promoteToAdmin: async (userId: string): Promise<void> => {
        console.log('Promote to admin pending migration');
        return api.patch(`/users/${userId}/promote`, {});
    },

    createUser: async (userData: { email: string; name: string; password?: string; role: string }): Promise<UserProfile> => {
        // Using auth/register for creation to handle hashing
        // If your backend has a dedicated Admin POST /users, use that instead.
        return api.post<UserProfile>('/auth/register', userData);
    },

    deleteUser: async (userId: string): Promise<void> => {
        return api.delete(`/users/${userId}`);
    },

    createEmployerRequest: async (): Promise<EmployerRequest> => {
        return api.post<EmployerRequest>('/users/employer-request', {});
    },

    getEmployerRequestStatus: async (): Promise<EmployerRequest | null> => {
        return api.get<EmployerRequest | null>('/users/employer-request/status');
    },

    getAllEmployerRequests: async (): Promise<EmployerRequest[]> => {
        return api.get<EmployerRequest[]>('/users/employer-requests');
    },

    handleEmployerRequest: (id: string, status: 'approved' | 'rejected' | 'pending') =>
        api.patch<{ message: string }>(`/users/employer-requests/${id}`, { status }),

    getPublicProfile: (id: string) =>
        api.get<UserProfile>(`/users/${id}/public`),
};
