import { api } from "@/lib/axios";
import { Candidate } from "@/types";
import { mapCandidate, mapWorkExperience, unwrapData } from "@/services/mappers";

export const candidateService = {
    async getProfile() {
        const profileResponse = await api.get("/identity/users/me");
        const profile = unwrapData<Record<string, unknown>>(profileResponse);
        const profileId = typeof profile.id === "string" ? profile.id : "";

        let workExperiences: ReturnType<typeof mapWorkExperience>[] = [];
        if (profileId) {
            const workExperienceResponse = await api.get(
                `/identity/users/${profileId}/work-experiences`,
            );
            workExperiences = unwrapData<Record<string, unknown>[]>(
                workExperienceResponse,
            ).map((item) => mapWorkExperience(item));
        }

        return mapCandidate(profile, workExperiences);
    },

    updateProfile: (data: Partial<Candidate>) => {
        const summary = Array.isArray(data.Summary)
            ? data.Summary.filter(Boolean)
            : undefined;

        return api.patch("/identity/users/me", {
            full_name: data.FullName,
            phone_number: data.PhoneNumber,
            bio: data.Bio,
            updateCandidateDto: {
                headline: data.Headline,
                summary,
                level: data.Level,
                resume_urls: data.ResumeUrls,
            },
        });
    },

    uploadResume: (file: File) => {
        const formData = new FormData();
        formData.append("file", file);

        return api.post("/identity/uploads/resume", formData, {
            headers: { "Content-Type": "multipart/form-data" },
        });
    },

    uploadAvatar: (file: File) => {
        const formData = new FormData();
        formData.append("avatar", file);

        return api.patch("/identity/users/me/avatar", formData, {
            headers: { "Content-Type": "multipart/form-data" },
        });
    },

    deleteAccount: () => api.delete("/identity/users"),

    // Work Experiences
    addWorkExperience: (data: Record<string, unknown>) =>
        api.post("/identity/work-experiences", data),

    updateWorkExperience: (id: string, data: Record<string, unknown>) =>
        api.patch(`/identity/work-experiences/${id}`, data),

    deleteWorkExperience: (id: string) =>
        api.delete(`/identity/work-experiences/${id}`),
};
