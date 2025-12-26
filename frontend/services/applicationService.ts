import { api } from "@/lib/api";
import { Application, ApplicationStatus } from "@/models/User";

interface UploadResponse {
  url: string;
}

export const ApplicationService = {
  uploadCV: async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append("file", file);
    const response = await api.post<UploadResponse>("/upload", formData);
    return response.url;
  },

  deleteFile: async (url: string): Promise<void> => {
    if (!url) return;
    const parts = url.split("/");
    const filename = parts[parts.length - 1];
    return api.delete(`/upload/${filename}`);
  },

  submitApplication: async (
    jobId: string,
    userId: string,
    cvUrl: string
  ): Promise<Application> => {
    return api.post("/applications", {
      jobId,
      userId,
      cvUrl,
    });
  },

  getMyApplications: async (): Promise<Application[]> => {
    return api.get("/applications/my");
  },

  getAllApplications: async (): Promise<Application[]> => {
    return api.get("/applications");
  },

  getEmployerApplications: async (): Promise<Application[]> => {
    return api.get("/applications/employer");
  },

  updateStatus: async (
    id: string,
    status: ApplicationStatus
  ): Promise<void> => {
    return api.patch(`/applications/${id}/status`, { status });
  },
};
