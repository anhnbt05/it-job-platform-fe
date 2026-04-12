import { api } from "@/lib/axios";
import { RecruiterInfo } from "@/types";
import { Company, CompanyBranch, CompanyLocation } from "@/types/company";
import { mapBranch, mapCompany, mapRecruiter, unwrapData } from "@/services/mappers";

type RecruiterProfileUpdatePayload = Partial<
    Pick<RecruiterInfo, "FullName" | "PhoneNumber" | "Bio" | "Department">
>;

type RecruiterCompanyUpdatePayload = Partial<
    Pick<Company, "Name" | "Location" | "WebsiteUrl" | "LogoUrl" | "Size">
>;

type RecruiterBranchUpdatePayload = Partial<
    Pick<CompanyLocation, "BranchName" | "Address" | "City" | "Country">
>;

type RecruiterBranchCreatePayload = Pick<
    CompanyBranch,
    "CompanyId" | "BranchName" | "Address" | "City" | "Country"
>;

function sanitizeText(value: string | null | undefined) {
    const trimmed = value?.trim();
    return trimmed ? trimmed : undefined;
}

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

    updateCompany: (companyId: string, data: RecruiterCompanyUpdatePayload) =>
        api.patch(`/organization/companies/${companyId}`, {
            name: sanitizeText(data.Name),
            location: sanitizeText(data.Location),
            website: sanitizeText(data.WebsiteUrl),
            logo_url: sanitizeText(data.LogoUrl),
            size: data.Size,
        }),

    updateBranch: (branchId: string, data: RecruiterBranchUpdatePayload) =>
        api.patch(`/organization/branches/${branchId}`, {
            name: sanitizeText(data.BranchName),
            address: sanitizeText(data.Address),
            city: sanitizeText(data.City),
            country: sanitizeText(data.Country),
        }),

    createBranch: (data: RecruiterBranchCreatePayload) =>
        api.post("/organization/branches", {
            company_id: data.CompanyId,
            name: sanitizeText(data.BranchName),
            address: sanitizeText(data.Address),
            city: sanitizeText(data.City),
            country: sanitizeText(data.Country),
        }),

    uploadAvatar: (file: File) => {
        const formData = new FormData();
        formData.append("avatar", file);

        return api.patch("/identity/users/me/avatar", formData, {
            headers: { "Content-Type": "multipart/form-data" },
        });
    },

    deleteAccount: () => api.delete("/identity/users"),

    async getCompanies(): Promise<Company[]> {
        const response = await api.get("/organization/companies");
        return unwrapData<Record<string, unknown>[]>(response).map((item) => mapCompany(item));
    },

    async getBranches(companyId: string): Promise<CompanyBranch[]> {
        const response = await api.get("/organization/branches", {
            params: {
                companyId,
            },
        });

        return unwrapData<Record<string, unknown>[]>(response).map((item) => mapBranch(item));
    },

    async getBranchDetail(branchId: string): Promise<CompanyBranch> {
        const response = await api.get(`/organization/branches/${branchId}`);
        return mapBranch(unwrapData<Record<string, unknown>>(response));
    },

    getProvinces: () =>
        api.get("/provinces"),
};
