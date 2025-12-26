import { JobStatus } from "./JobStatus";

export interface Job {
    id: string;
    title: string;
    content: string;
    location: string;
    salaryMin?: number;
    salaryMax?: number;
    experienceYears?: number;
    createdAt: string;
    updatedAt?: string;
    deadline?: string; // ISO Date string
    status: JobStatus;
    imageUrl?: string;
    jobType?: string;
    views?: number;
    tags?: string[];
    jobTags?: {
        tagId: string;
        tag: {
            name: string;
        };
    }[];
    author?: {
        id: string;
        name: string;
        email: string;
        phone?: string;
        avatarUrl?: string;
        address?: string;
    };
}

export interface JobFilter {
    title?: string;
    location?: string;
    salaryMin?: number;
    experienceYears?: number;
}
