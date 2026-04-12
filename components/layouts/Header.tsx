"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { usePathname } from "next/navigation";
import { accountService } from "@/services/account.service";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import NotificationBell from "@/components/notifications/NotificationBell";
import { useAuthStore } from "@/store/useAuthStore";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/providers/theme-provider";
import { Menu, Moon, PanelLeftClose, PanelLeftOpen, Sun } from "lucide-react";
import AccountDialog from "@/components/layouts/AccountDialog";

type HeaderProps = {
    onOpenSidebar?: () => void;
    desktopSidebarCollapsed?: boolean;
    onToggleDesktopSidebar?: () => void;
};

export default function Header({
    onOpenSidebar,
    desktopSidebarCollapsed = false,
    onToggleDesktopSidebar,
}: HeaderProps) {
    const pathname = usePathname();
    const { role } = useAuthStore();
    const { mounted, theme, toggleTheme } = useTheme();
    const [accountDialogOpen, setAccountDialogOpen] = useState(false);
    const { data: account } = useQuery({
        queryKey: ["account-me"],
        queryFn: () => accountService.getMe(),
    });

    const getPageTitle = () => {
        if (pathname.includes("/admin/dashboard")) return "Tổng quan hệ thống";
        if (pathname.includes("/admin/users")) return "Quản lý người dùng";
        if (pathname.includes("/admin/jobs-review")) return "Duyệt tin tuyển dụng";
        if (pathname.includes("/find-jobs")) return "Tìm kiếm việc làm";
        if (pathname.includes("/applied-jobs")) return "Đã ứng tuyển";
        if (pathname.includes("/favorite-jobs")) return "Việc làm yêu thích";
        if (pathname.includes("/notifications")) return "Thông báo";
        if (pathname.includes("/profile/edit")) return "Chỉnh sửa hồ sơ";
        if (pathname.includes("/profile")) return "Hồ sơ cá nhân";
        if (pathname.includes("/manage-jobs")) return "Quản lý bài đăng";
        if (pathname.includes("/candidates")) return "Danh sách ứng viên";
        if (pathname.includes("/post-job")) return "Thêm tin tuyển dụng";
        if (pathname.includes("/edit-job")) return "Chỉnh sửa tin tuyển dụng";
        if (pathname.includes("/jobs/")) return "Chi tiết công việc";
        return "Trang chủ";
    };

    const displayName = account?.FullName || (role === "recruiter" ? "Nhà tuyển dụng" : role === "admin" ? "Quản trị viên" : "Ứng viên");
    const fallbackText = getAvatarFallback(account?.FullName || displayName);

    return (
        <>
            <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-card px-4 sm:px-6 lg:px-8">
                <div className="flex min-w-0 items-center gap-3">
                    <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="lg:hidden"
                        onClick={onOpenSidebar}
                    >
                        <Menu className="h-5 w-5" />
                        <span className="sr-only">Mở menu điều hướng</span>
                    </Button>
                    <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="hidden lg:inline-flex"
                        onClick={onToggleDesktopSidebar}
                    >
                        {desktopSidebarCollapsed ? (
                            <PanelLeftOpen className="h-5 w-5" />
                        ) : (
                            <PanelLeftClose className="h-5 w-5" />
                        )}
                        <span className="sr-only">
                            {desktopSidebarCollapsed ? "Mở rộng sidebar" : "Thu gọn sidebar"}
                        </span>
                    </Button>
                    <h2 className="truncate text-lg font-semibold text-foreground sm:text-xl">{getPageTitle()}</h2>
                </div>

                <div className="flex items-center gap-4">
                    <NotificationBell />
                    <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={toggleTheme}
                        aria-label={
                            mounted && theme === "dark"
                                ? "Chuyển sang light mode"
                                : "Chuyển sang dark mode"
                        }
                    >
                        {mounted && theme === "dark" ? (
                            <Sun className="h-4 w-4" />
                        ) : (
                            <Moon className="h-4 w-4" />
                        )}
                    </Button>

                    <button
                        type="button"
                        className="flex items-center gap-3 rounded-full px-2 py-1 transition-colors hover:bg-accent"
                        onClick={() => setAccountDialogOpen(true)}
                    >
                        <Avatar className="h-8 w-8">
                            <AvatarImage
                                src={account?.AvatarUrl ?? undefined}
                                alt={displayName}
                            />
                            <AvatarFallback className="bg-primary text-xs text-white">
                                {fallbackText}
                            </AvatarFallback>
                        </Avatar>
                        <div className="hidden text-left md:block">
                            <p className="text-sm font-medium text-foreground">
                                {displayName}
                            </p>
                        </div>
                    </button>
                </div>
            </header>

            <AccountDialog
                open={accountDialogOpen}
                onOpenChange={setAccountDialogOpen}
            />
        </>
    );
}

function getAvatarFallback(value: string) {
    return value
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part.charAt(0).toUpperCase())
        .join("");
}
