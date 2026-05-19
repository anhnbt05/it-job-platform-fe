"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useClientPagination } from "@/hooks/use-client-pagination";
import { notificationService } from "@/services/notification.service";
import { UserNotification, UserNotificationType, UserNotificationTypeLabel } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { PaginationBar } from "@/components/ui/pagination-bar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Check, CheckCheck, ChevronRight, Clock3, Loader2, Trash2 } from "lucide-react";
import { toast } from "react-toastify";
import { cn } from "@/lib/utils";
import {
    formatNotificationDate,
    getNotificationAppearance,
    getNotificationPreview,
    getNotificationTypeLabel,
    notificationQueryKeys,
    NotificationStatusFilter,
    sortNotificationsByNewest,
} from "@/components/notifications/notification-helpers";

const notificationTypeOptions = Object.entries(UserNotificationTypeLabel) as [UserNotificationType, string][];

export default function NotificationCenter() {
    const queryClient = useQueryClient();
    const notificationsPerPage = 8;
    const [statusFilter, setStatusFilter] = useState<NotificationStatusFilter>("all");
    const [typeFilter, setTypeFilter] = useState<UserNotificationType | "all">("all");
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [activeNotificationId, setActiveNotificationId] = useState<string | null>(null);

    const allNotificationsQuery = useQuery({
        queryKey: notificationQueryKeys.all,
        queryFn: () => notificationService.getNotifications(),
    });

    const notificationsQuery = useQuery({
        queryKey: notificationQueryKeys.list(statusFilter, typeFilter),
        queryFn: () =>
            notificationService.getNotifications({
                ...(statusFilter === "unread" ? { isRead: false } : {}),
                ...(statusFilter === "read" ? { isRead: true } : {}),
                ...(typeFilter !== "all" ? { type: typeFilter } : {}),
            }),
    });

    const notificationDetailQuery = useQuery({
        queryKey: notificationQueryKeys.detail(activeNotificationId || ""),
        queryFn: () => notificationService.getNotificationDetail(activeNotificationId || ""),
        enabled: !!activeNotificationId,
    });

    const markAsReadMutation = useMutation({
        mutationFn: (ids: string[]) => notificationService.markAsRead(ids),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: notificationQueryKeys.all });
        },
        onError: () => toast.error("Không thể cập nhật trạng thái thông báo"),
    });

    const deleteNotificationsMutation = useMutation({
        mutationFn: (ids: string[]) => notificationService.deleteNotifications(ids),
        onSuccess: (_, ids) => {
            if (ids.includes(activeNotificationId || "")) {
                setActiveNotificationId(null);
            }

            setSelectedIds((current) => current.filter((id) => !ids.includes(id)));
            toast.success(ids.length > 1 ? "Đã xóa các thông báo đã chọn" : "Đã xóa thông báo");
            queryClient.invalidateQueries({ queryKey: notificationQueryKeys.all });
        },
        onError: () => toast.error("Không thể xóa thông báo"),
    });

    const filteredNotifications = useMemo(
        () => sortNotificationsByNewest(notificationsQuery.data || []),
        [notificationsQuery.data],
    );

    const allNotifications = useMemo(
        () => sortNotificationsByNewest(allNotificationsQuery.data || []),
        [allNotificationsQuery.data],
    );

    const {
        currentPage,
        totalPages,
        paginatedItems: paginatedNotifications,
        setCurrentPage,
    } = useClientPagination<UserNotification>({
        items: filteredNotifications,
        itemsPerPage: notificationsPerPage,
        resetKey: `${statusFilter}|${typeFilter}|${filteredNotifications.length}`,
    });

    const stats = useMemo(() => {
        const unreadCount = allNotifications.filter((notification) => !notification.IsRead).length;

        return {
            total: allNotifications.length,
            unread: unreadCount,
            read: Math.max(allNotifications.length - unreadCount, 0),
        };
    }, [allNotifications]);

    const visibleUnreadIds = paginatedNotifications.filter((notification) => !notification.IsRead).map((notification) => notification.ID);
    const isLoading = notificationsQuery.isLoading || allNotificationsQuery.isLoading;
    const allVisibleSelected =
        paginatedNotifications.length > 0 &&
        paginatedNotifications.every((notification) => selectedIds.includes(notification.ID));

    const handleOpenNotification = (notification: UserNotification) => {
        setActiveNotificationId(notification.ID);

        if (!notification.IsRead) {
            markAsReadMutation.mutate([notification.ID]);
        }
    };

    const toggleSelectedId = (id: string) => {
        setSelectedIds((current) =>
            current.includes(id)
                ? current.filter((selectedId) => selectedId !== id)
                : [...current, id],
        );
    };

    const toggleSelectAllVisible = () => {
        const visibleIds = paginatedNotifications.map((notification) => notification.ID);

        if (allVisibleSelected) {
            setSelectedIds((current) => current.filter((id) => !visibleIds.includes(id)));
            return;
        }

        setSelectedIds((current) => Array.from(new Set([...current, ...visibleIds])));
    };

    return (
        <div className="mx-auto max-w-[980px] space-y-6">
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                <div>
                    <h1 className="text-xl font-bold text-foreground">Thông báo của bạn</h1>
                    <p className="text-sm text-muted-foreground">
                        Theo dõi trạng thái bài đăng, ứng tuyển và các cập nhật quan trọng từ hệ thống.
                    </p>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                    <Button
                        type="button"
                        variant="outline"
                        className="w-full sm:w-auto"
                        disabled={visibleUnreadIds.length === 0 || markAsReadMutation.isPending}
                        onClick={() => markAsReadMutation.mutate(visibleUnreadIds)}
                    >
                        {markAsReadMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCheck size={16} className="mr-2" />}
                        Đánh dấu tất cả đã đọc
                    </Button>
                    <Button
                        type="button"
                        variant="outline"
                        className="w-full sm:w-auto border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 dark:border-red-500/30 dark:text-red-300"
                        disabled={selectedIds.length === 0 || deleteNotificationsMutation.isPending}
                        onClick={() => deleteNotificationsMutation.mutate(selectedIds)}
                    >
                        {deleteNotificationsMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 size={16} className="mr-2" />}
                        Xóa đã chọn
                    </Button>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <StatCard label="Tổng thông báo" value={stats.total} tone="blue" />
                <StatCard label="Chưa đọc" value={stats.unread} tone="amber" />
                <StatCard label="Đã đọc" value={stats.read} tone="green" />
            </div>

            <Card className="border-border p-4 shadow-sm">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <Tabs value={statusFilter} onValueChange={(value) => setStatusFilter(value as NotificationStatusFilter)} className="w-full lg:w-auto">
                        <TabsList className="h-auto w-full flex-wrap justify-start bg-muted">
                            <TabsTrigger value="all">Tất cả</TabsTrigger>
                            <TabsTrigger value="unread">Chưa đọc</TabsTrigger>
                            <TabsTrigger value="read">Đã đọc</TabsTrigger>
                        </TabsList>
                    </Tabs>

                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                        <Select
                            value={typeFilter}
                            onValueChange={(value) => setTypeFilter(value as UserNotificationType | "all")}
                        >
                            <SelectTrigger className="w-full bg-card sm:w-[240px]">
                                <SelectValue placeholder="Lọc theo loại" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Tất cả loại thông báo</SelectItem>
                                {notificationTypeOptions.map(([value, label]) => (
                                    <SelectItem key={value} value={value}>
                                        {label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Button
                            type="button"
                            variant="ghost"
                            className="justify-start text-muted-foreground sm:justify-center"
                            onClick={toggleSelectAllVisible}
                            disabled={paginatedNotifications.length === 0}
                        >
                            {allVisibleSelected ? "Bỏ chọn tất cả" : "Chọn tất cả"}
                        </Button>
                    </div>
                </div>
            </Card>

            {isLoading ? (
                <div className="space-y-3">
                    {[...Array(5)].map((_, index) => (
                        <Skeleton key={index} className="h-[108px] rounded-2xl" />
                    ))}
                </div>
            ) : filteredNotifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card py-20 text-center">
                    <div className="rounded-full bg-muted p-4">
                        <Clock3 size={28} className="text-muted-foreground" />
                    </div>
                    <p className="mt-4 text-lg font-medium text-muted-foreground">Không có thông báo phù hợp</p>
                    <p className="mt-1 max-w-md text-sm text-muted-foreground">
                        Thử đổi bộ lọc hoặc quay lại sau khi hệ thống phát sinh cập nhật mới cho tài khoản của bạn.
                    </p>
                </div>
            ) : (
                <div className="space-y-3">
                    {paginatedNotifications.map((notification) => {
                        const appearance = getNotificationAppearance(notification.Notification?.Type);
                        const Icon = appearance.icon;
                        const isSelected = selectedIds.includes(notification.ID);

                        return (
                            <Card
                                key={notification.ID}
                                className={cn(
                                    "cursor-pointer border p-0 shadow-sm transition-all hover:shadow-md",
                                    notification.IsRead ? "border-border bg-card" : appearance.accent,
                                )}
                                onClick={() => handleOpenNotification(notification)}
                            >
                                <div className="flex gap-4 px-4 py-4">
                                    <button
                                        type="button"
                                        aria-label={isSelected ? "Bỏ chọn thông báo" : "Chọn thông báo"}
                                        className={cn(
                                            "mt-1 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border transition-colors",
                                            isSelected
                                                ? "border-primary bg-primary text-white"
                                                : "border-border bg-card text-transparent hover:border-primary",
                                        )}
                                        onClick={(event) => {
                                            event.stopPropagation();
                                            toggleSelectedId(notification.ID);
                                        }}
                                    >
                                        <Check size={12} />
                                    </button>

                                    <div className={cn("flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl", appearance.iconWrap)}>
                                        <Icon size={18} />
                                    </div>

                                    <div className="min-w-0 flex-1">
                                        <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                                            <div className="min-w-0">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <p className={cn("line-clamp-1 text-sm", notification.IsRead ? "text-foreground" : "font-semibold text-foreground")}>
                                                        {notification.Notification?.Title || "Thông báo"}
                                                    </p>
                                                    <Badge variant="outline" className={appearance.badge}>
                                                        {getNotificationTypeLabel(notification.Notification?.Type)}
                                                    </Badge>
                                                </div>
                                                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                                                    {getNotificationPreview(notification)}
                                                </p>
                                            </div>
                                            <div className="flex flex-shrink-0 items-center gap-3 text-xs text-muted-foreground">
                                                {!notification.IsRead && (
                                                    <span className="h-2.5 w-2.5 rounded-full bg-primary" />
                                                )}
                                                <span>{formatNotificationDate(notification.CreatedAt)}</span>
                                            </div>
                                        </div>

                                        <div className="mt-3 flex flex-wrap items-center gap-2">
                                            {!notification.IsRead && (
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={(event) => {
                                                        event.stopPropagation();
                                                        markAsReadMutation.mutate([notification.ID]);
                                                    }}
                                                >
                                                    <CheckCheck size={14} className="mr-1.5" />
                                                    Đánh dấu đã đọc
                                                </Button>
                                            )}
                                            <Button
                                                type="button"
                                                size="sm"
                                                variant="ghost"
                                                className="text-muted-foreground"
                                                onClick={(event) => {
                                                    event.stopPropagation();
                                                    handleOpenNotification(notification);
                                                }}
                                            >
                                                Xem chi tiết
                                                <ChevronRight size={14} className="ml-1" />
                                            </Button>
                                            <Button
                                                type="button"
                                                size="sm"
                                                variant="ghost"
                                                className="text-red-500 hover:bg-red-50 hover:text-red-600 dark:text-red-300"
                                                onClick={(event) => {
                                                    event.stopPropagation();
                                                    deleteNotificationsMutation.mutate([notification.ID]);
                                                }}
                                            >
                                                <Trash2 size={14} className="mr-1.5" />
                                                Xóa
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        );
                    })}

                    <PaginationBar
                        currentPage={currentPage}
                        totalPages={totalPages}
                        totalItems={filteredNotifications.length}
                        itemsPerPage={notificationsPerPage}
                        itemLabel="thông báo"
                        onPageChange={setCurrentPage}
                    />
                </div>
            )}

            <Dialog open={!!activeNotificationId} onOpenChange={(open) => !open && setActiveNotificationId(null)}>
                <DialogContent className="max-w-2xl">
                    {notificationDetailQuery.isLoading ? (
                        <div className="space-y-3 py-4">
                            <Skeleton className="h-6 w-2/3" />
                            <Skeleton className="h-4 w-1/3" />
                            <Skeleton className="h-24 w-full" />
                            <Skeleton className="h-24 w-full" />
                        </div>
                    ) : (
                        <>
                            <DialogHeader className="space-y-3 text-left">
                                <div className="flex flex-wrap items-start justify-between gap-3">
                                    <div className="space-y-2">
                                        <DialogTitle className="text-xl leading-tight">
                                            {notificationDetailQuery.data?.Notification?.Title || "Thông báo"}
                                        </DialogTitle>
                                        <DialogDescription>
                                            {notificationDetailQuery.data?.CreatedAt
                                                ? formatNotificationDate(notificationDetailQuery.data.CreatedAt)
                                                : ""}
                                        </DialogDescription>
                                    </div>
                                    {notificationDetailQuery.data?.Notification?.Type && (
                                        <Badge
                                            variant="outline"
                                            className={getNotificationAppearance(notificationDetailQuery.data.Notification.Type).badge}
                                        >
                                            {getNotificationTypeLabel(notificationDetailQuery.data.Notification.Type)}
                                        </Badge>
                                    )}
                                </div>
                            </DialogHeader>

                            <div className="space-y-5">
                                <div className="rounded-2xl border border-border bg-muted/30 p-4">
                                    <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                                        Nội dung
                                    </p>
                                    <div className="mt-3 space-y-3">
                                        {notificationDetailQuery.data?.Content.map((line, index) => (
                                            <div
                                                key={`${line}-${index}`}
                                                className="rounded-xl bg-background p-4 text-sm leading-relaxed text-foreground shadow-sm"
                                            >
                                                {line}
                                            </div>
                                        ))}

                                        {!notificationDetailQuery.data?.Content.length && (
                                            <p className="text-sm text-muted-foreground">
                                                Thông báo này chưa có nội dung chi tiết.
                                            </p>
                                        )}
                                    </div>
                                </div>

                                <div className="grid gap-3 sm:grid-cols-2">
                                    <div className="rounded-2xl border border-border bg-card p-4">
                                        <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                                            Trạng thái
                                        </p>
                                        <p className="mt-2 text-sm font-medium text-foreground">
                                            {notificationDetailQuery.data?.IsRead ? "Đã đọc" : "Chưa đọc"}
                                        </p>
                                    </div>

                                    <div className="rounded-2xl border border-border bg-card p-4">
                                        <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                                            Thời điểm đọc
                                        </p>
                                        <p className="mt-2 text-sm font-medium text-foreground">
                                            {notificationDetailQuery.data?.ReadAt
                                                ? formatNotificationDate(notificationDetailQuery.data.ReadAt)
                                                : "Chưa đọc"}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}

function StatCard({
    label,
    value,
    tone,
}: {
    label: string;
    value: number;
    tone: "blue" | "amber" | "green";
}) {
    const toneClass = {
        blue: "bg-primary/5 text-primary",
        amber: "bg-amber-500/15 text-amber-300",
        green: "bg-emerald-500/15 text-emerald-300",
    };

    return (
        <Card className="border-border p-4 shadow-sm">
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className={cn("mt-2 text-2xl font-bold", toneClass[tone])}>{value}</p>
        </Card>
    );
}
