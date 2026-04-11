import { api } from "@/lib/axios";
import { RecruiterInfo } from "@/types";
import { Company } from "@/types/company";
import { mapCompany, mapRecruiter, unwrapData } from "@/services/mappers";

type RecruiterProfileUpdatePayload = Partial<
    Pick<RecruiterInfo, "FullName" | "PhoneNumber" | "Bio" | "Department">
>;

export const recruiterService = {
    async getProfile() {
        const response = await api.get("/identity/users/me");
        return mapRecruiter(unwrapData<Record<string, unknown>>(response));
    },

    updateProfile: (data: RecruiterProfileUpdatePayload) => {
        const hasDepartment = Object.prototype.hasOwnProperty.call(data, "Department");

        return api.patch("/identity/users/me", {
            full_name: data.FullName,
            phone_number: data.PhoneNumber,
            bio: data.Bio,
            ...(hasDepartment
                ? {
                    updateRecruiterDto: {
                        department: data.Department,
                    },
                }
                : {}),
        });
    },

    updateCompany: (companyId: string, data: Record<string, unknown>) =>
        api.patch(`/organization/companies/${companyId}`, data),

    uploadAvatar: (file: File) => {
        const formData = new FormData();
        formData.append("avatar", file);

        return api.patch("/identity/users/me/avatar", formData, {
            headers: { "Content-Type": "multipart/form-data" },
        });
    },

    async getCompanies(): Promise<Company[]> {
        const response = await api.get("/organization/companies");
        return unwrapData<Record<string, unknown>[]>(response).map((item) => mapCompany(item));
    },

    getProvinces: () =>
        api.get("/provinces"),
};
