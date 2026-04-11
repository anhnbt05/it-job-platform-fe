import {
    Application,
    ApplicationRecruiter,
    Candidate,
    Company,
    CompanyLocation,
    JobDetail,
    JobFavorite,
    JobListItem,
    RecruiterInfo,
    UserNotification,
    UserNotificationType,
    WorkExperience,
} from "@/types";

type ApiEnvelope<T> = {
    success?: boolean;
    message?: string;
    data?: T;
};

type AnyRecord = Record<string, unknown>;

export function unwrapData<T>(payload: T | ApiEnvelope<T>): T {
    if (
        payload &&
        typeof payload === "object" &&
        "data" in (payload as AnyRecord)
    ) {
        return (payload as ApiEnvelope<T>).data as T;
    }

    return payload as T;
}

export function mapWorkExperience(raw: AnyRecord): WorkExperience {
    return {
        ID: asString(raw.id),
        Position: asNullableString(raw.position),
        CompanyName: asNullableString(raw.company_name),
        CompanyLogoUrl: asNullableString(raw.company_logo_url),
        StartDate: asNullableString(raw.start_date),
        EndDate: asNullableString(raw.end_date),
        JobType: asString(raw.job_type),
        Location: asNullableString(raw.location),
        Descriptions: asStringArray(raw.descriptions),
    };
}

export function mapCandidate(raw: AnyRecord, workExperiences: WorkExperience[] = []): Candidate {
    const profile = asRecord(raw.profile);
    const candidate = asRecord(raw.candidate);
    const resumeUrls = asStringArray(candidate.resume_urls);

    return {
        ID: asString(raw.id),
        FullName: asNullableString(profile.full_name),
        Email: asNullableString(raw.email),
        PhoneNumber: asNullableString(profile.phone_number),
        AvatarUrl: asNullableString(profile.avatar_url),
        ResumeUrl: resumeUrls[0] ?? null,
        ResumeUrls: resumeUrls,
        Bio: asNullableString(profile.bio),
        Headline: asNullableString(candidate.headline),
        Summary: asStringArray(candidate.summary),
        Level: asNullableString(candidate.level),
        Certifications: null,
        WorkExperiences: workExperiences,
    };
}

export function mapCompany(raw: AnyRecord): Company {
    return {
        ID: asString(raw.id),
        Name: asString(raw.name),
        Description: asNullableString(raw.description),
        WebsiteUrl: asNullableString(raw.website),
        LogoUrl: asNullableString(raw.logo_url),
        Location: asNullableString(raw.location),
        Size: asNullableNumber(raw.size),
    };
}

export function mapCompanyLocation(raw: AnyRecord): CompanyLocation | null {
    if (Object.keys(raw).length === 0) {
        return null;
    }

    return {
        ID: asString(raw.id) || undefined,
        BranchName: asNullableString(raw.name),
        Address: asNullableString(raw.address),
        Province: asNullableString(raw.city),
        City: asNullableString(raw.city),
        Country: asNullableString(raw.country),
    };
}

export function mapRecruiter(raw: AnyRecord): RecruiterInfo {
    const profile = asRecord(raw.profile);
    const recruiter = asRecord(raw.recruiter);
    const company = asRecord(recruiter.company);
    const branch = asRecord(recruiter.branch);

    return {
        ID: asString(raw.id),
        FullName: asNullableString(profile.full_name),
        Email: asNullableString(raw.email),
        PhoneNumber: asNullableString(profile.phone_number),
        Department: asNullableString(recruiter.department),
        Bio: asNullableString(profile.bio),
        AvatarUrl: asNullableString(profile.avatar_url),
        Company: Object.keys(company).length > 0 ? mapCompany(company) : null,
        CompanyLocations: mapCompanyLocation(branch),
    };
}

export function mapJobListItem(raw: AnyRecord): JobListItem {
    return {
        ID: asString(raw.id),
        Title: asString(raw.title),
        Description: asNullableString(raw.description),
        Address: asString(raw.address),
        Salary: asString(raw.salary),
        Vacancies: asNumber(raw.vacancies),
        Type: asString(raw.type),
        WorkingTimes: asString(raw.workingTimes),
        Status: asString(raw.status),
        PostedAt: asString(raw.postedAt),
        ExpiredAt: asString(raw.expiredAt),
        Level: asString(raw.level),
        RecruiterId: asString(raw.recruiterId),
        Categories: asStringArray(raw.categories),
        Recruiter: null,
    };
}

export function mapJobDetail(raw: AnyRecord): JobDetail {
    return {
        ...mapJobListItem(raw),
        RecruiterId: asString(raw.recruiterId),
        JobDescriptions: asStringArray(raw.jobDescriptions),
        JobBenefits: asStringArray(raw.jobBenefits),
        JobRequirements: asStringArray(raw.jobRequirements),
        Recruiter: null,
    };
}

export function mapJobFavorite(raw: AnyRecord): JobFavorite {
    return {
        ID: asString(raw.id),
        SavedAt: asString(raw.savedAt),
        Job: mapJobDetail(asRecord(raw.job)),
    };
}

export function mapApplication(raw: AnyRecord, job?: Partial<JobListItem> | null): Application {
    return {
        ID: asString(raw.id),
        JobId: asString(raw.jobId),
        JobTitle: asString(raw.jobTitle),
        CandidateId: asString(raw.candidateId),
        CandidateName: asString(raw.candidateName),
        RecruiterId: asString(raw.recruiterId),
        Status: asString(raw.status),
        AppliedAt: asString(raw.appliedAt),
        ResumeUrl: asNullableString(raw.resumeUrl),
        Job: job ?? null,
    };
}

export function mapApplicationRecruiter(raw: AnyRecord): ApplicationRecruiter {
    const candidateName = asString(raw.candidateName);

    return {
        ID: asString(raw.id),
        JobId: asString(raw.jobId),
        JobTitle: asString(raw.jobTitle),
        CandidateId: asString(raw.candidateId),
        CandidateName: candidateName,
        RecruiterId: asString(raw.recruiterId),
        Status: asString(raw.status),
        AppliedAt: asString(raw.appliedAt),
        ResumeUrl: asNullableString(raw.resumeUrl),
        Candidate: {
            ID: asString(raw.candidateId),
            FullName: candidateName,
            AvatarUrl: null,
        },
    };
}

export function mapNotification(raw: AnyRecord): UserNotification {
    const notification = asRecord(raw.notification);

    return {
        ID: asString(raw.id),
        IsRead: Boolean(raw.isRead),
        CreatedAt: asString(raw.createdAt),
        ReadAt: asNullableString(raw.readAt),
        Content: asStringArray(raw.contents),
        Metadata: asObjectOrNull(raw.metadata),
        Notification: notification
            ? {
                ID: asString(notification.id),
                Title: asString(notification.title),
                Type: (asNullableString(notification.type) ?? undefined) as UserNotificationType | undefined,
            }
            : null,
    };
}

function asRecord(value: unknown): AnyRecord {
    return value && typeof value === "object" ? (value as AnyRecord) : {};
}

function asString(value: unknown): string {
    return typeof value === "string" ? value : "";
}

function asNullableString(value: unknown): string | null {
    return typeof value === "string" && value.trim() ? value : null;
}

function asNumber(value: unknown): number {
    return typeof value === "number" ? value : Number(value ?? 0);
}

function asNullableNumber(value: unknown): number | null {
    if (typeof value === "number") {
        return value;
    }

    const parsedValue = Number(value);
    return Number.isFinite(parsedValue) ? parsedValue : null;
}

function asStringArray(value: unknown): string[] {
    if (!Array.isArray(value)) {
        return [];
    }

    return value.filter((item): item is string => typeof item === "string");
}

function asObjectOrNull(value: unknown): Record<string, unknown> | null {
    return value && typeof value === "object" && !Array.isArray(value)
        ? value as Record<string, unknown>
        : null;
}
