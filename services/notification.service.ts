import { api } from "@/lib/axios";
import { UserNotification } from "@/types";

export const notificationService = {
    getNotifications: () =>
        api.get<UserNotification[]>("/notifications"),

    markAsRead: (id: string) =>
        api.patch(`/notifications/${id}/read`),

    deleteNotification: (id: string) =>
        api.delete(`/notifications/${id}`),
};
