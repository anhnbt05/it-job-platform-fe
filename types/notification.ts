export interface NotificationDetail {
    ID: string;
    Title: string;
}

export interface UserNotification {
    ID: string;
    IsRead: boolean | null;
    CreatedAt: string;
    Content: string[] | null;
    Notification: NotificationDetail | null;
}
