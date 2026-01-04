import { api } from "@/lib/api";

export interface OptimizedJobResponse {
  title: string;
  content: string;
  location: string;
  salaryMin?: number;
  salaryMax?: number;
  jobType?: string;
  experienceYears?: number;
  deadline?: string;
  skills?: string[];
}

export const AiService = {
  optimizeJob: async (content: string): Promise<OptimizedJobResponse> => {
    try {
      return await api.post<OptimizedJobResponse>("/ai/optimize-job", {
        content,
      });
    } catch (error) {
      console.error("AI Optimize Job Error:", error);
      throw error;
    }
  },
};
