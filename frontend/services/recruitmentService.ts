import { api } from "@/lib/api";
import { RecruitmentPost, JobPosition } from "@/models/Recruitment";

export const RecruitmentService = {
  getAllPosts: async (
    limit: number = 10,
    offset: number = 0
  ): Promise<RecruitmentPost[]> => {
    return api.get<RecruitmentPost[]>(
      `/recruitment?limit=${limit}&offset=${offset}`
    );
  },

  getPostById: async (id: string): Promise<RecruitmentPost> => {
    return api.get<RecruitmentPost>(`/recruitment/${id}`);
  },

  createPost: async (
    post: Omit<RecruitmentPost, "id">
  ): Promise<RecruitmentPost> => {
    return api.post<RecruitmentPost>("/recruitment", post);
  },

  updatePost: async (
    id: string,
    post: Partial<RecruitmentPost>
  ): Promise<RecruitmentPost> => {
    return api.patch<RecruitmentPost>(`/recruitment/${id}`, post);
  },

  deletePost: async (id: string): Promise<void> => {
    return api.delete(`/recruitment/${id}`);
  },

  searchSemantic: async (query: string): Promise<JobPosition[]> => {
    return api.get<JobPosition[]>(
      `/recruitment/search?q=${encodeURIComponent(query)}`
    );
  },
};
