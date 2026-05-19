"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { notificationService } from "@/services/notification.service";
import { useAuthStore } from "@/store/useAuthStore";
import { Button } from "@/components/ui/button";
import {
    Popover,
    PopoverContent,
    PopoverDescription,
    PopoverHeader,
    PopoverTitle,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Bell, CheckCheck, Loader2 } from "lucide-react";
import { toast } from "react-toastify";
import { cn } from "@/lib/utils";
import {
    formatNotificationDate,
    getNotificationAppearance,
    getNotificationPreview,
    notificationQueryKeys,
    sortNotificationsByNewest,
} from "@/components/notifications/notification-helpers";

export default function NotificationBell() {
    const router = useRouter();
    const queryClient = useQueryClient();
    const { role } = useAuthStore();
    const [open, setOpen] = useState(false);

    const { data: notifications, isLoading } = useQuery({
        queryKey: notificationQueryKeys.all,
        queryFn: () => notificationService.getNotifications(),
        staleTime: 15_000,
        refetchOnWindowFocus: false,
    });

    const markAsReadMutation = useMutation({
        mutationFn: (ids: string[]) => notificationService.markAsRead(ids),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: notificationQueryKeys.all });
        },
        onError: () => toast.error("Không thể cập nhật thông báo"),
    });

    const sortedNotifications = useMemo(
        () => sortNotificationsByNewest(notifications || []),
        [notifications],
    );

    const unreadNotifications = sortedNotifications.filter((notification) => !notification.IsRead);
    const previewNotifications = sortedNotifications.slice(0, 5);
    const notificationsPage = role === "recruiter"
        ? "/recruiter/notifications"
        : role === "admin"
            ? "/admin/notifications"
            : "/candidate/notifications";

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <button className="relative rounded-full p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground">
                    <Bell size={20} />
                    {unreadNotifications.length > 0 && (
                        <span className="absolute -right-0.5 -top-0.5 flex min-h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white">
                            {unreadNotifications.length > 9 ? "9+" : unreadNotifications.length}
                        </span>
                    )}
                </button>
            </PopoverTrigger>

            <PopoverContent align="end" className="w-[calc(100vw-1rem)] max-w-[380px] p-0 sm:w-[380px]">
                <PopoverHeader className="border-b border-border p-4">
                    <div className="flex items-start justify-between gap-3">
                        <div>
                            <PopoverTitle className="text-base text-foreground">Thông báo</PopoverTitle>
                            <PopoverDescription className="mt-1 text-xs text-muted-foreground">
                                {unreadNotifications.length > 0
                                    ? `Bạn có ${unreadNotifications.length} thông báo chưa đọc`
                                    : "Bạn đã đọc hết các thông báo mới"}
                            </PopoverDescription>
                        </div>
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="text-primary"
                            disabled={unreadNotifications.length === 0 || markAsReadMutation.isPending}
                            onClick={() => markAsReadMutation.mutate(unreadNotifications.map((notification) => notification.ID))}
                        >
                            {markAsReadMutation.isPending ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <CheckCheck size={14} className="mr-1.5" />}
                            Đọc tất cả
                        </Button>
                    </div>
                </PopoverHeader>

                <div className="max-h-[360px] overflow-y-auto p-2">
                    {isLoading ? (
                        <div className="space-y-2 p-2">
                            {[...Array(4)].map((_, index) => (
                                <div key={index} className="h-20 animate-pulse rounded-xl bg-muted" />
                            ))}
                        </div>
                    ) : previewNotifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center px-6 py-10 text-center">
                            <div className="rounded-full bg-muted p-3">
                                <Bell size={20} className="text-muted-foreground" />
                            </div>
                            <p className="mt-3 text-sm font-medium text-muted-foreground">Chưa có thông báo nào</p>
                        </div>
                    ) : (
                        previewNotifications.map((notification) => {
                            const appearance = getNotificationAppearance(notification.Notification?.Type);
                            const Icon = appearance.icon;

                            return (
                                <button
                                    key={notification.ID}
                                    type="button"
                                    className={cn(
                                        "flex w-full items-start gap-3 rounded-xl p-3 text-left transition-colors hover:bg-accent/60",
                                        !notification.IsRead && "bg-primary/10",
                                    )}
                                    onClick={async () => {
                                        if (!notification.IsRead) {
                                            try {
                                                await notificationService.markAsRead([notification.ID]);
                                                queryClient.invalidateQueries({ queryKey: notificationQueryKeys.all });
                                            } catch {
                                                toast.error("Không thể cập nhật thông báo");
                                            }
                                        }

                                        setOpen(false);
                                        router.push(notificationsPage);
                                    }}
                                >
                                    <div className={cn("mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl", appearance.iconWrap)}>
                                        <Icon size={16} />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2">
                                            <p className={cn("line-clamp-1 text-sm", notification.IsRead ? "text-foreground" : "font-semibold text-foreground")}>
                                                {notification.Notification?.Title || "Thông báo"}
                                            </p>
                                            {!notification.IsRead && <span className="h-2 w-2 rounded-full bg-primary" />}
                                        </div>
                                        <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                                            {getNotificationPreview(notification)}
                                        </p>
                                        <p className="mt-2 text-[11px] text-muted-foreground">
                                            {formatNotificationDate(notification.CreatedAt)}
                                        </p>
                                    </div>
                                </button>
                            );
                        })
                    )}
                </div>

                <div className="border-t border-border p-3">
                    <Link
                        href={notificationsPage}
                        className="block rounded-lg bg-primary px-4 py-2 text-center text-sm font-medium text-white transition-colors hover:bg-primary/90"
                        onClick={() => setOpen(false)}
                    >
                        Xem tất cả thông báo
                    </Link>
                </div>
            </PopoverContent>
        </Popover>
    );
}
