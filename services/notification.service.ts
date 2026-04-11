import { api } from "@/lib/axios";
import { mapNotification, unwrapData } from "@/services/mappers";
import { UserNotificationType } from "@/types";

type NotificationQueryParams = {
    isRead?: boolean;
    type?: UserNotificationType;
};

export const notificationService = {
    async getNotifications(params?: NotificationQueryParams) {
        const response = await api.get("/notification", { params });
        return unwrapData<Record<string, unknown>[]>(response).map((item) => mapNotification(item));
    },

    async getNotificationDetail(id: string) {
        const response = await api.get(`/notification/${id}`);
        return mapNotification(unwrapData<Record<string, unknown>>(response));
    },

    markAsRead: (ids: string[]) =>
        api.patch("/notification/mark-as-read", { ids }),

    deleteNotifications: (ids: string[]) =>
        api.delete("/notification", {
            params: {
                ids: ids.join(","),
            },
        }),
};
