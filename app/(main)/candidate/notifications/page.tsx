"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { notificationService } from "@/services/notification.service";
import { UserNotification } from "@/types";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Bell, BellOff, Trash2, Clock, X } from "lucide-react";
import { toast } from "react-toastify";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
} from "@/components/ui/sheet";
import { useState } from "react";

export default function NotificationsPage() {
    const [selectedNotification, setSelectedNotification] = useState<UserNotification | null>(null);
    const queryClient = useQueryClient();

    const { data: notifications, isLoading } = useQuery({
        queryKey: ["notifications"],
        queryFn: async () => {
            const res = await notificationService.getNotifications();
            return res as unknown as UserNotification[];
        },
    });

    const markReadMutation = useMutation({
        mutationFn: (id: string) => notificationService.markAsRead(id),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => notificationService.deleteNotification(id),
        onSuccess: () => {
            toast.success("Đã xoá thông báo");
            queryClient.invalidateQueries({ queryKey: ["notifications"] });
        },
        onError: () => toast.error("Có lỗi xảy ra"),
    });

    const handleClick = (notification: UserNotification) => {
        if (!notification.IsRead) {
            markReadMutation.mutate(notification.ID);
        }
        setSelectedNotification(notification);
    };

    const formatDate = (dateStr: string) => {
        const d = new Date(dateStr);
        return `${d.getDate().toString().padStart(2, "0")}/${(d.getMonth() + 1).toString().padStart(2, "0")}/${d.getFullYear()}, ${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
    };

    return (
        <div className="mx-auto max-w-[800px]">
            {isLoading ? (
                <div className="space-y-3">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-[72px] rounded-xl" />)}</div>
            ) : (
                <>
                    {notifications?.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-20">
                            <BellOff size={48} className="mb-4 text-gray-300" />
                            <p className="text-lg font-medium text-gray-500">Không có thông báo nào</p>
                        </div>
                    )}

                    <div className="space-y-2">
                        {notifications?.map((n) => (
                            <Card
                                key={n.ID}
                                onClick={() => handleClick(n)}
                                className={`cursor-pointer border p-0 shadow-sm transition-all hover:shadow-md ${n.IsRead ? "border-gray-100 bg-white" : "border-blue-100 bg-blue-50/50"
                                    }`}
                            >
                                <div className="flex items-center gap-4 px-5 py-4">
                                    <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full ${n.IsRead ? "bg-gray-100" : "bg-blue-100"}`}>
                                        <Bell size={18} className={n.IsRead ? "text-gray-400" : "text-[#194d8e]"} />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className={`text-sm line-clamp-1 ${n.IsRead ? "text-gray-600" : "font-semibold text-gray-900"}`}>
                                            {n.Notification?.Title || "Thông báo"}
                                        </p>
                                        <div className="mt-1 flex items-center gap-1 text-xs text-gray-400">
                                            <Clock size={12} />
                                            {formatDate(n.CreatedAt)}
                                        </div>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="flex-shrink-0 text-gray-300 hover:bg-red-50 hover:text-red-500"
                                        onClick={(e) => { e.stopPropagation(); deleteMutation.mutate(n.ID); }}
                                    >
                                        <Trash2 size={16} />
                                    </Button>
                                </div>
                            </Card>
                        ))}
                    </div>
                </>
            )}

            {/* Detail Sheet */}
            <Sheet open={!!selectedNotification} onOpenChange={() => setSelectedNotification(null)}>
                <SheetContent className="sm:max-w-md">
                    <SheetHeader>
                        <SheetTitle>{selectedNotification?.Notification?.Title || "Thông báo"}</SheetTitle>
                        <SheetDescription>
                            {selectedNotification?.CreatedAt && formatDate(selectedNotification.CreatedAt)}
                        </SheetDescription>
                    </SheetHeader>
                    <div className="mt-6 space-y-3">
                        {selectedNotification?.Content?.map((line, idx) => (
                            <p key={idx} className="text-sm leading-relaxed text-gray-700">{line}</p>
                        ))}
                    </div>
                    <div className="mt-8">
                        <Button onClick={() => setSelectedNotification(null)} className="w-full bg-[#194d8e] hover:bg-[#194d8e]/90">
                            Đóng
                        </Button>
                    </div>
                </SheetContent>
            </Sheet>
        </div>
    );
}
