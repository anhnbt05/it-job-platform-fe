"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import { authService } from "@/services/auth.service";
import {
    Search,
    FileText,
    Heart,
    Bell,
    User,
    Briefcase,
    Users,
    PlusCircle,
    LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
    label: string;
    href: string;
    icon: React.ReactNode;
}

const candidateNavItems: NavItem[] = [
    { label: "Tìm kiếm", href: "/candidate/find-jobs", icon: <Search size={20} /> },
    { label: "Đã ứng tuyển", href: "/candidate/applied-jobs", icon: <FileText size={20} /> },
    { label: "Yêu thích", href: "/candidate/favorite-jobs", icon: <Heart size={20} /> },
    { label: "Thông báo", href: "/candidate/notifications", icon: <Bell size={20} /> },
    { label: "Hồ sơ", href: "/candidate/profile", icon: <User size={20} /> },
];

const recruiterNavItems: NavItem[] = [
    { label: "Quản lý bài đăng", href: "/recruiter/manage-jobs", icon: <Briefcase size={20} /> },
    { label: "Ứng viên", href: "/recruiter/candidates", icon: <Users size={20} /> },
    { label: "Thêm tin tuyển dụng", href: "/recruiter/post-job", icon: <PlusCircle size={20} /> },
    { label: "Thông báo", href: "/recruiter/notifications", icon: <Bell size={20} /> },
    { label: "Hồ sơ", href: "/recruiter/profile", icon: <User size={20} /> },
];

export default function Sidebar() {
    const pathname = usePathname();
    const { role, logout } = useAuthStore();
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    const navItems = role === "recruiter" ? recruiterNavItems : candidateNavItems;

    const handleLogout = async () => {
        setIsLoggingOut(true);

        try {
            await authService.signOut();
        } catch {
            // Clear local session even if the server-side revoke request fails.
        } finally {
            logout();
            window.location.href = "/login";
        }
    };

    return (
        <aside className="fixed left-0 top-0 z-40 flex h-screen w-[240px] flex-col bg-[#071e26] text-white">
            {/* Logo */}
            <div className="flex h-16 items-center gap-3 border-b border-white/10 px-6">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#194d8e]">
                    <Briefcase size={20} className="text-white" />
                </div>
                <div>
                    <h1 className="text-sm font-bold leading-tight">IT Job</h1>
                    <p className="text-[10px] text-white/50">Platform</p>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
                {navItems.map((item) => {
                    const isActive = pathname.startsWith(item.href);
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                                isActive
                                    ? "bg-[#194d8e] text-white shadow-lg shadow-[#194d8e]/30"
                                    : "text-white/60 hover:bg-white/5 hover:text-white"
                            )}
                        >
                            <span className={cn(isActive ? "text-white" : "text-white/50")}>
                                {item.icon}
                            </span>
                            {item.label}
                        </Link>
                    );
                })}
            </nav>

            {/* Logout */}
            <div className="border-t border-white/10 p-3">
                <button
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-red-400 transition-all duration-200 hover:bg-red-500/10"
                >
                    <LogOut size={20} />
                    {isLoggingOut ? "Đang đăng xuất..." : "Đăng xuất"}
                </button>
            </div>
        </aside>
    );
}
