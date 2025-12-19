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
    isActive: boolean;
    imageUrl?: string;
    jobType?: string;
    views?: number;
    tags?: string[];
}

export interface JobFilter {
    title?: string;
    location?: string;
    salaryMin?: number;
    experienceYears?: number;
}
