import { api } from "@/lib/axios";
import { AccountProfile } from "@/types";
import { unwrapData } from "@/services/mappers";

type AnyRecord = Record<string, unknown>;

function asRecord(value: unknown): AnyRecord {
    return value && typeof value === "object" ? (value as AnyRecord) : {};
}

function asString(value: unknown): string {
    return typeof value === "string" ? value : "";
}

function asNullableString(value: unknown): string | null {
    return typeof value === "string" && value.trim() ? value : null;
}

export const accountService = {
    async getMe(): Promise<AccountProfile> {
        const response = await api.get("/identity/users/me");
        const raw = unwrapData<Record<string, unknown>>(response);
        const profile = asRecord(raw.profile);
        const recruiter = asRecord(raw.recruiter);
        const candidate = asRecord(raw.candidate);
        const company = asRecord(recruiter.company);
        const branch = asRecord(recruiter.branch);

        return {
            ID: asString(raw.id),
            Role: asString(raw.role) as AccountProfile["Role"],
            Email: asNullableString(raw.email),
            FullName: asNullableString(profile.full_name),
            PhoneNumber: asNullableString(profile.phone_number),
            AvatarUrl: asNullableString(profile.avatar_url),
            Bio: asNullableString(profile.bio),
            Department: asNullableString(recruiter.department),
            Headline: asNullableString(candidate.headline),
            Level: asNullableString(candidate.level),
            CompanyName: asNullableString(company.name),
            BranchName: asNullableString(branch.name),
        };
    },

    updateProfile: (data: {
        FullName?: string;
        PhoneNumber?: string;
        Bio?: string;
    }) =>
        api.patch("/identity/users/me", {
            full_name: data.FullName,
            phone_number: data.PhoneNumber,
            bio: data.Bio,
        }),

    uploadAvatar: (file: File) => {
        const formData = new FormData();
        formData.append("avatar", file);

        return api.patch("/identity/users/me/avatar", formData, {
            headers: { "Content-Type": "multipart/form-data" },
        });
    },
};
