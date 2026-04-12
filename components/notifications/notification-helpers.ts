import { Bell, Briefcase, CalendarClock, CheckCircle2, Users, XCircle } from "lucide-react";
import { UserNotification, UserNotificationType, UserNotificationTypeLabel } from "@/types";

export type NotificationStatusFilter = "all" | "unread" | "read";

export const notificationQueryKeys = {
    all: ["notifications"] as const,
    list: (status: NotificationStatusFilter, type: UserNotificationType | "all") =>
        ["notifications", status, type] as const,
    detail: (id: string) => ["notifications", "detail", id] as const,
};

export function formatNotificationDate(dateString: string) {
    const date = new Date(dateString);

    return `${date.getDate().toString().padStart(2, "0")}/${(date.getMonth() + 1).toString().padStart(2, "0")}/${date.getFullYear()} ${date.getHours().toString().padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}`;
}

export function getNotificationPreview(notification: UserNotification) {
    return notification.Content[0] || "Bạn có một thông báo mới.";
}

export function sortNotificationsByNewest(notifications: UserNotification[]) {
    return [...notifications].sort((left, right) => {
        return new Date(right.CreatedAt).getTime() - new Date(left.CreatedAt).getTime();
    });
}

export function getNotificationAppearance(type?: UserNotificationType) {
    const fallback = {
        icon: Bell,
        accent: "border-primary/20 bg-primary/10",
        iconWrap: "bg-primary/10 text-primary",
        badge: "border-primary/20 bg-primary/10 text-primary",
    };

    switch (type) {
        case "candidate_application_approved":
        case "recruiter_job_approved":
            return {
                icon: CheckCircle2,
                accent: "border-green-100 bg-green-50/60",
                iconWrap: "bg-green-100 text-green-700",
                badge: "border-green-200 bg-green-50 text-green-700",
            };
        case "candidate_application_rejected":
        case "recruiter_job_rejected":
            return {
                icon: XCircle,
                accent: "border-red-100 bg-red-50/60",
                iconWrap: "bg-red-100 text-red-700",
                badge: "border-red-200 bg-red-50 text-red-700",
            };
        case "recruiter_new_application":
            return {
                icon: Users,
                accent: "border-violet-100 bg-violet-50/60",
                iconWrap: "bg-violet-100 text-violet-700",
                badge: "border-violet-200 bg-violet-50 text-violet-700",
            };
        case "recruiter_job_expiring_soon":
        case "recruiter_job_expired":
        case "candidate_job_closed":
            return {
                icon: CalendarClock,
                accent: "border-amber-100 bg-amber-50/60",
                iconWrap: "bg-amber-100 text-amber-700",
                badge: "border-amber-200 bg-amber-50 text-amber-700",
            };
        case "admin_new_job_post":
            return {
                icon: Briefcase,
                accent: "border-border bg-muted/70",
                iconWrap: "bg-muted text-foreground",
                badge: "border-border bg-muted text-foreground",
            };
        default:
            return fallback;
    }
}

export function getNotificationTypeLabel(type?: UserNotificationType) {
    if (!type) {
        return "Thông báo chung";
    }

    return UserNotificationTypeLabel[type];
}
