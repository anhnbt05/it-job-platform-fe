import { UserRole } from "./enums";

export type AdminUserStatus = "active" | "inactive";
export type AdminReportType = "pdf" | "xlsx";

export const AdminUserStatusLabel: Record<AdminUserStatus, string> = {
    active: "Đang hoạt động",
    inactive: "Đã khóa",
};

export const UserRoleLabel: Record<UserRole, string> = {
    admin: "Quản trị viên",
    recruiter: "Nhà tuyển dụng",
    candidate: "Ứng viên",
};

export interface AdminDashboardSummary {
    jobStats: {
        total: number;
        open: number;
        pending: number;
        closed: number;
        rejected: number;
        expired: number;
    };
    applicationStats: {
        total: number;
        pending: number;
        accepted: number;
        rejected: number;
    };
}

export interface AdminUser {
    ID: string;
    Email: string;
    Role: UserRole;
    Status: AdminUserStatus;
    IsEmailVerified: boolean;
    CreatedAt: string;
    UpdatedAt: string;
    FullName: string | null;
    PhoneNumber: string | null;
    AvatarUrl: string | null;
    Bio: string | null;
    CandidateLevel: string | null;
    CandidateHeadline: string | null;
    RecruiterDepartment: string | null;
    CompanyName: string | null;
    BranchName: string | null;
}

export interface AdminCategory {
    ID: string;
    Name: string;
    CreatedAt: string | null;
    UpdatedAt: string | null;
}
