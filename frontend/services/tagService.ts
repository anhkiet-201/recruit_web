import { api } from "@/lib/api";
import { Tag } from "@/models/Tag";

export const getAllTags = async (): Promise<Tag[]> => {
    return api.get<Tag[]>('/tags');
};

export const createTag = async (name: string): Promise<Tag> => {
    return api.post<Tag>('/tags', { name });
};

export const getJobTags = async (jobId: string): Promise<Tag[]> => {
    // Backend returns JobTag objects which contain the tag info
    // We need to map the response if necessary, but looking at backend logic:
    // it returns JobTag[] with include: { tag: true }.
    // So the response structure is [{ jobId, tagId, tag: { id, name } }, ...]
    const jobTags = await api.get<{ tag: Tag }[]>(`/tags/job/${jobId}`);
    return jobTags.map(jt => jt.tag);
};

export const addTagToJob = async (jobId: string, tagId: string): Promise<void> => {
    return api.post(`/tags/job/${jobId}`, { tagId });
};

export const removeTagFromJob = async (jobId: string, tagId: string): Promise<void> => {
    return api.delete(`/tags/job/${jobId}/${tagId}`);
};

export const deleteTag = async (id: string): Promise<void> => {
    return api.delete(`/tags/${id}`);
};
