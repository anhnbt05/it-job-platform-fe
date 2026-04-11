"use client";

import { usePathname } from "next/navigation";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import NotificationBell from "@/components/notifications/NotificationBell";
import { useAuthStore } from "@/store/useAuthStore";

export default function Header() {
    const pathname = usePathname();
    const { role } = useAuthStore();

    const getPageTitle = () => {
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

    return (
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-gray-200 bg-white px-8">
            <h2 className="text-xl font-semibold text-gray-900">{getPageTitle()}</h2>

            <div className="flex items-center gap-4">
                <NotificationBell />

                <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-[#194d8e] text-xs text-white">
                            {role === "recruiter" ? "RC" : "CD"}
                        </AvatarFallback>
                    </Avatar>
                    <div className="hidden md:block">
                        <p className="text-sm font-medium text-gray-900">
                            {role === "recruiter" ? "Nhà tuyển dụng" : "Ứng viên"}
                        </p>
                    </div>
                </div>
            </div>
        </header>
    );
}
