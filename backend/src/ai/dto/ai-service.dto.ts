export interface ChatHistoryItemDto {
  role: string;
  parts: string;
}

export interface JobStructuredInputDto {
  id: string;
  title: string;
  content: string;
  location: string;
  jobType?: string | null;
  salaryMin?: number | string | null;
  salaryMax?: number | string | null;
  experience?: string | number | null;
  deadline?: Date | string | null;
  author?: {
    name?: string | null;
  } | null;
}

export interface JobCvMatchDto {
  title: string;
}

export interface PerformSearchToolArgs {
  query: string;
  mode: 'search' | 'suggest';
}

export interface GetJobDetailToolArgs {
  jobId: string;
}
