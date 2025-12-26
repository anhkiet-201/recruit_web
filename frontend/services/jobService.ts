import { api } from "@/lib/api";
import { Job } from "@/models/Job";

export const JobService = {
    getAllJobs: async (query: { page?: number; limit?: number; status?: string; authorId?: string } = {}): Promise<{ items: Job[], total: number, lastPage: number }> => {
        const params = new URLSearchParams();
        if (query.page) params.append('page', query.page.toString());
        if (query.limit) params.append('limit', query.limit.toString());
        if (query.status) params.append('status', query.status);
        if (query.authorId) params.append('authorId', query.authorId);
        return api.get(`/jobs?${params.toString()}`);
    },

    getJobById: async (id: string, options?: { incrementView?: boolean }): Promise<Job | null> => {
        try {
            const url = options?.incrementView === false
                ? `/jobs/${id}?incrementView=false`
                : `/jobs/${id}`;
            return await api.get<Job>(url);
        } catch {
            return null;
        }
    },

    searchJobs: async (filters: { title?: string; location?: string; jobType?: string; page?: number; limit?: number }): Promise<{ items: Job[], total: number, lastPage: number }> => {
        const queryParams = new URLSearchParams();
        if (filters.title) queryParams.append('title', filters.title);
        if (filters.location) queryParams.append('location', filters.location);
        if (filters.jobType) queryParams.append('jobType', filters.jobType);
        if (filters.page) queryParams.append('page', filters.page.toString());
        if (filters.limit) queryParams.append('limit', (filters.limit || 10).toString());

        const queryString = queryParams.toString();
        const url = `/jobs/search${queryString ? `?${queryString}` : ''}`;

        return api.get(url);
    },

    aiSearch: async (query: string): Promise<Job[]> => {
        return api.get<Job[]>(`/jobs/ai-search?q=${encodeURIComponent(query)}`);
    },

    getLocations: async (): Promise<string[]> => {
        return api.get<string[]>('/jobs/locations');
    },

    getSuggestions: async (): Promise<string[]> => {
        return api.get<string[]>('/jobs/suggestions');
    },

    getTrendingJobs: async (limit: number = 6): Promise<Job[]> => {
        return api.get<Job[]>(`/jobs/trending?limit=${limit}`);
    },

    getHotJobs: async (limit: number = 6): Promise<Job[]> => {
        return api.get<Job[]>(`/jobs/hot?limit=${limit}`);
    },

    createJob: async (jobData: Partial<Job>): Promise<Job> => {
        return api.post<Job>('/jobs', jobData);
    },

    updateJob: async (id: string, jobData: Partial<Job>): Promise<void> => {
        return api.patch(`/jobs/${id}`, jobData);
    },

    deleteJob: async (id: string): Promise<void> => {
        return api.delete(`/jobs/${id}`);
    },

    approveJob: async (id: string, status: 'ACTIVE' | 'REJECTED' | 'DRAFT'): Promise<Job> => {
        return api.patch(`/jobs/${id}/approve`, { status });
    },

    importJobs: async (file: File): Promise<{ count: number; errors: { row: number; error: string }[] }> => {
        const formData = new FormData();
        formData.append('file', file);
        return api.post('/jobs/import', formData);
    },

    uploadJobImage: async (file: File): Promise<string> => {
        const formData = new FormData();
        formData.append('file', file);

        const response = await api.post<{ url: string }>('/upload', formData);

        return response.url || "https://placehold.co/800x400";
    },

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    deleteJobImage: async (imageUrl: string): Promise<void> => {
        // Implementation depends on backend, often just ignoring for now or calling a specific endpoint
        console.log('Delete image not fully implemented in backend yet');
    }
};
