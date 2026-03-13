import { api } from "@/lib/axios";
import { Candidate } from "@/types";

export const candidateService = {
    getProfile: () =>
        api.get<Candidate>("/candidates/profile"),

    updateProfile: (data: Partial<Candidate>) =>
        api.patch("/candidates/profile", data),

    uploadResume: (formData: FormData) =>
        api.post("/candidates/resume", formData, {
            headers: { "Content-Type": "multipart/form-data" },
        }),

    uploadAvatar: (formData: FormData) =>
        api.post("/candidates/avatar", formData, {
            headers: { "Content-Type": "multipart/form-data" },
        }),

    // Work Experiences
    addWorkExperience: (data: Record<string, unknown>) =>
        api.post("/work-experiences", data),

    updateWorkExperience: (id: string, data: Record<string, unknown>) =>
        api.patch(`/work-experiences/${id}`, data),

    deleteWorkExperience: (id: string) =>
        api.delete(`/work-experiences/${id}`),
};
