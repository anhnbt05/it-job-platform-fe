"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import { authService } from "@/services/auth.service";
import {
    LayoutDashboard,
    Search,
    FileText,
    Heart,
    Bell,
    User,
    Briefcase,
    Users,
    PlusCircle,
    LogOut,
    ShieldCheck,
    Tags,
    Building2,
    Upload,
    MapPin,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";

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
    { label: "Chi nhánh", href: "/recruiter/branches", icon: <MapPin size={20} /> },
    { label: "Ứng viên", href: "/recruiter/candidates", icon: <Users size={20} /> },
    { label: "Thêm tin tuyển dụng", href: "/recruiter/post-job", icon: <PlusCircle size={20} /> },
    { label: "Thông báo", href: "/recruiter/notifications", icon: <Bell size={20} /> },
    { label: "Hồ sơ", href: "/recruiter/profile", icon: <User size={20} /> },
];

const adminNavItems: NavItem[] = [
    { label: "Tổng quan", href: "/admin/dashboard", icon: <LayoutDashboard size={20} /> },
    { label: "Người dùng", href: "/admin/users", icon: <Users size={20} /> },
    { label: "Danh mục", href: "/admin/categories", icon: <Tags size={20} /> },
    { label: "Công ty", href: "/admin/companies", icon: <Building2 size={20} /> },
    { label: "Duyệt công việc", href: "/admin/jobs-review", icon: <ShieldCheck size={20} /> },
    { label: "Tải tệp", href: "/admin/uploads", icon: <Upload size={20} /> },
    { label: "Thông báo", href: "/admin/notifications", icon: <Bell size={20} /> },
];

type SidebarProps = {
    mobileOpen?: boolean;
    onMobileOpenChange?: (open: boolean) => void;
    collapsed?: boolean;
};

export default function Sidebar({
    mobileOpen = false,
    onMobileOpenChange,
    collapsed = false,
}: SidebarProps) {
    const pathname = usePathname();
    const { role, logout } = useAuthStore();
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    const navItems = role === "recruiter" ? recruiterNavItems : role === "admin" ? adminNavItems : candidateNavItems;

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

    const handleNavigate = () => {
        onMobileOpenChange?.(false);
    };

    const renderSidebarContent = (isCollapsed: boolean) => (
        <>
            <div className={cn(
                "flex h-16 items-center border-b border-white/10 transition-all duration-300 ease-in-out",
                isCollapsed ? "justify-center px-3" : "gap-3 px-6",
            )}>
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#194d8e]">
                    <Briefcase size={20} className="text-white" />
                </div>
                <div className={cn(
                    "overflow-hidden transition-all duration-300 ease-in-out",
                    isCollapsed ? "max-w-0 opacity-0" : "max-w-[120px] opacity-100",
                )}>
                    <h1 className="text-sm font-bold leading-tight">IT Job</h1>
                    <p className="text-[10px] text-white/50">Platform</p>
                </div>
            </div>

            <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
                {navItems.map((item) => {
                    const isActive = pathname.startsWith(item.href);
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            onClick={handleNavigate}
                            title={isCollapsed ? item.label : undefined}
                            className={cn(
                                "flex items-center rounded-lg text-sm font-medium transition-all duration-300 ease-in-out",
                                isCollapsed ? "justify-center px-2 py-3" : "gap-3 px-3 py-2.5",
                                isActive
                                    ? "bg-[#194d8e] text-white shadow-lg shadow-[#194d8e]/30"
                                    : "text-white/60 hover:bg-white/5 hover:text-white"
                            )}
                        >
                            <span className={cn("shrink-0", isActive ? "text-white" : "text-white/50")}>
                                {item.icon}
                            </span>
                            <span className={cn(
                                "overflow-hidden whitespace-nowrap transition-all duration-300 ease-in-out",
                                isCollapsed ? "max-w-0 opacity-0" : "max-w-[140px] opacity-100",
                            )}>
                                {item.label}
                            </span>
                        </Link>
                    );
                })}
            </nav>

            <div className="border-t border-white/10 p-3">
                <button
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                    title={isCollapsed ? "Đăng xuất" : undefined}
                    className={cn(
                        "flex w-full rounded-lg text-sm font-medium text-red-400 transition-all duration-300 ease-in-out hover:bg-red-500/10",
                        isCollapsed ? "justify-center px-2 py-3" : "items-center gap-3 px-3 py-2.5",
                    )}
                >
                    <LogOut size={20} className="shrink-0" />
                    <span className={cn(
                        "overflow-hidden whitespace-nowrap transition-all duration-300 ease-in-out",
                        isCollapsed ? "max-w-0 opacity-0" : "max-w-[140px] opacity-100",
                    )}>
                        {isLoggingOut ? "Đang đăng xuất..." : "Đăng xuất"}
                    </span>
                </button>
            </div>
        </>
    );

    return (
        <>
            <aside
                className={cn(
                    "fixed left-0 top-0 z-40 hidden h-screen flex-col bg-[#071e26] text-white transition-[width] duration-300 ease-in-out lg:flex",
                    collapsed ? "w-[88px]" : "w-[240px]",
                )}
            >
                {renderSidebarContent(collapsed)}
            </aside>

            <Sheet open={mobileOpen} onOpenChange={onMobileOpenChange}>
                <SheetContent
                    side="left"
                    showCloseButton={false}
                    className="w-[280px] border-r-0 bg-[#071e26] p-0 text-white sm:max-w-[280px]"
                >
                    <SheetHeader className="sr-only">
                        <SheetTitle>Menu điều hướng</SheetTitle>
                        <SheetDescription>
                            Danh sách các mục điều hướng chính và thao tác đăng xuất.
                        </SheetDescription>
                    </SheetHeader>
                    <div className="flex h-full flex-col">
                        {renderSidebarContent(false)}
                    </div>
                </SheetContent>
            </Sheet>
        </>
    );
}
