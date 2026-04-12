import { api } from "@/lib/axios";
import { mapBranch, mapCompany, unwrapData } from "@/services/mappers";
import {
  AdminDashboardSummary,
  AdminReportType,
  AdminUser,
  CompanyBranch,
  Company,
  CompanyFormValues,
} from "@/types";

function mapAdminUser(raw: Record<string, unknown>): AdminUser {
  const profile = asRecord(raw.profile);
  const candidate = asRecord(raw.candidate);
  const recruiter = asRecord(raw.recruiter);
  const company = asRecord(recruiter.company);
  const branch = asRecord(recruiter.branch);

  return {
    ID: asString(raw.id),
    Email: asString(raw.email),
    Role: asString(raw.role) as AdminUser["Role"],
    Status: asString(raw.status) as AdminUser["Status"],
    IsEmailVerified: Boolean(raw.is_email_verified),
    CreatedAt: asString(raw.created_at),
    UpdatedAt: asString(raw.updated_at),
    FullName: asNullableString(profile.full_name),
    PhoneNumber: asNullableString(profile.phone_number),
    AvatarUrl: asNullableString(profile.avatar_url),
    Bio: asNullableString(profile.bio),
    CandidateLevel: asNullableString(candidate.level),
    CandidateHeadline: asNullableString(candidate.headline),
    RecruiterDepartment: asNullableString(recruiter.department),
    CompanyName: asNullableString(company.name),
    BranchName: asNullableString(branch.name),
  };
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object"
    ? (value as Record<string, unknown>)
    : {};
}

function asString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function asNullableString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value : null;
}

function sanitizeText(value: string | null | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

export const adminService = {
  async getDashboardSummary(params?: { startDate?: string; endDate?: string }) {
    const response = await api.get("/dashboard/summary", { params });
    return unwrapData<AdminDashboardSummary>(response);
  },

  downloadReport(
    type: AdminReportType,
    params?: { startDate?: string; endDate?: string },
  ) {
    return api.post<Blob, Blob>(
      "/dashboard/reports",
      {
        type,
        startDate: params?.startDate || undefined,
        endDate: params?.endDate || undefined,
      },
      {
        responseType: "blob",
      },
    );
  },

  async getUsers(role?: AdminUser["Role"]) {
    const response = await api.get<
      Record<string, unknown>[],
      Record<string, unknown>[]
    >("/identity/users", {
      params: {
        role: role || undefined,
      },
    });

    return response.map((item) => mapAdminUser(item));
  },

  async getUserDetail(id: string) {
    const response = await api.get<
      Record<string, unknown>,
      Record<string, unknown>
    >(`/identity/users/detail/${id}`);
    return mapAdminUser(response);
  },

  async getCompanies(): Promise<Company[]> {
    const response = await api.get("/organization/companies");
    return unwrapData<Record<string, unknown>[]>(response).map((item) =>
      mapCompany(item),
    );
  },

  async getCompanyDetail(id: string): Promise<Company> {
    const response = await api.get(`/organization/companies/${id}`);
    return mapCompany(unwrapData<Record<string, unknown>>(response));
  },

  async getBranches(companyId: string): Promise<CompanyBranch[]> {
    const response = await api.get("/organization/branches", {
      params: {
        companyId,
      },
    });

    return unwrapData<Record<string, unknown>[]>(response).map((item) =>
      mapBranch(item),
    );
  },

  async createCompany(payload: CompanyFormValues): Promise<Company> {
    const response = await api.post("/organization/companies", {
      name: sanitizeText(payload.Name),
      description: sanitizeText(payload.Description),
      website: sanitizeText(payload.WebsiteUrl),
      logo_url: sanitizeText(payload.LogoUrl),
      location: sanitizeText(payload.Location),
      size: payload.Size ?? undefined,
    });

    return mapCompany(unwrapData<Record<string, unknown>>(response));
  },

  updateCompany(id: string, payload: CompanyFormValues) {
    return api.patch(`/organization/companies/${id}`, {
      name: sanitizeText(payload.Name),
      description: sanitizeText(payload.Description),
      website: sanitizeText(payload.WebsiteUrl),
      logo_url: sanitizeText(payload.LogoUrl),
      location: sanitizeText(payload.Location),
      size: payload.Size ?? undefined,
    });
  },

  createBranch(payload: {
    companyId: string;
    branchName: string;
    address: string;
    city?: string;
    country?: string;
  }) {
    return api.post("/organization/branches", {
      company_id: payload.companyId,
      name: sanitizeText(payload.branchName),
      address: sanitizeText(payload.address),
      city: sanitizeText(payload.city),
      country: sanitizeText(payload.country),
    });
  },

  updateBranch(
    id: string,
    payload: {
      branchName: string;
      address: string;
      city?: string;
      country?: string;
    },
  ) {
    return api.patch(`/organization/branches/${id}`, {
      name: sanitizeText(payload.branchName),
      address: sanitizeText(payload.address),
      city: sanitizeText(payload.city),
      country: sanitizeText(payload.country),
    });
  },

  updateUserStatus: (
    id: string,
    payload: { status: AdminUser["Status"]; reason?: string },
  ) => api.patch(`/identity/users/${id}/status`, payload),
};
