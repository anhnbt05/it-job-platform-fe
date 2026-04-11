export type UserNotificationType =
    | "candidate_application_approved"
    | "candidate_application_rejected"
    | "recruiter_job_approved"
    | "recruiter_job_rejected"
    | "recruiter_new_application"
    | "admin_new_job_post"
    | "recruiter_job_expiring_soon"
    | "recruiter_job_expired"
    | "candidate_job_closed";

export const UserNotificationTypeLabel: Record<UserNotificationType, string> = {
    candidate_application_approved: "Ứng tuyển được chấp nhận",
    candidate_application_rejected: "Ứng tuyển bị từ chối",
    recruiter_job_approved: "Tin tuyển dụng được duyệt",
    recruiter_job_rejected: "Tin tuyển dụng bị từ chối",
    recruiter_new_application: "Ứng viên mới",
    admin_new_job_post: "Bài đăng mới",
    recruiter_job_expiring_soon: "Sắp hết hạn",
    recruiter_job_expired: "Đã hết hạn",
    candidate_job_closed: "Công việc đã đóng",
};

export interface NotificationDetail {
    ID: string;
    Title: string;
    Type?: UserNotificationType;
}

export interface UserNotification {
    ID: string;
    IsRead: boolean;
    CreatedAt: string;
    ReadAt: string | null;
    Content: string[];
    Metadata: Record<string, unknown> | null;
    Notification: NotificationDetail | null;
}
