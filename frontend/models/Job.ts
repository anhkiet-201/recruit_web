import { JobStatus } from "./JobStatus";

export interface Job {
  id: string;
  authorId?: string;
  title: string;
  content: string;
  description?: string; // Short description for meta tags and schema
  location: string;
  salaryMin?: number;
  salaryMax?: number;
  salary?: number; // Fixed salary amount
  experienceYears?: number;
  createdAt: string;
  updatedAt?: string;
  deadline?: string; // ISO Date string
  expiresAt?: string; // Job posting expiration date (ISO Date string)
  status: JobStatus;
  imageUrl?: string;
  jobType?: string;
  views?: number;
  _count?: {
    applications: number;
  };
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
  employer?: {
    name: string;
    logo?: string;
    website?: string;
  };
}

export interface JobFilter {
  title?: string;
  location?: string;
  salaryMin?: number;
  experienceYears?: number;
}
