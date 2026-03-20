import { api } from "@/lib/axios";
import { RecruiterInfo } from "@/types";

export const recruiterService = {
    getProfile: () =>
        api.get<RecruiterInfo>("/recruiters/profile"),

    updateProfile: (data: Partial<RecruiterInfo>) =>
        api.patch("/recruiters/profile", data),

    updateCompany: (data: Record<string, unknown>) =>
        api.patch("/companies", data),

    uploadAvatar: (formData: FormData) =>
        api.post("/recruiters/avatar", formData, {
            headers: { "Content-Type": "multipart/form-data" },
        }),

    uploadCompanyLogo: (formData: FormData) =>
        api.post("/companies/logo", formData, {
            headers: { "Content-Type": "multipart/form-data" },
        }),

    getCompanies: () =>
        api.get("/companies"),

    getProvinces: () =>
        api.get("/provinces"),

    getCompanyBranches: (companyId: string) =>
        api.get(`/companies/${companyId}/branches`),
};
