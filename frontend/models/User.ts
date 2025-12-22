import { Job } from "./Job";

export interface UserProfile {
    id: string;
    email: string;
    role: 'candidate' | 'admin';
    name?: string;
    phone?: string;
    address?: string;
    education?: string;
    skills?: string;
    cvUrl?: string;
    avatarUrl?: string;
    createdAt: string;
}

export interface Application {
    id: string;
    jobId: string;
    userId: string;
    cvUrl: string;
    status: 'pending' | 'reviewed' | 'rejected' | 'accepted';
    createdAt: string;
    job?: Job; // For display purposes
    user?: UserProfile; // For display purposes
}
