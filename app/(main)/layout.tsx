"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import Sidebar from "@/components/layouts/Sidebar";
import Header from "@/components/layouts/Header";
import { cn } from "@/lib/utils";

export default function MainLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { isLoggedIn, role } = useAuthStore();
    const router = useRouter();
    const pathname = usePathname();
    const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
    const [desktopSidebarCollapsed, setDesktopSidebarCollapsed] = useState(
        () =>
            typeof window !== "undefined" &&
            window.localStorage.getItem("main-sidebar-collapsed") === "true",
    );

    const defaultRoute = role === "recruiter"
        ? "/recruiter/manage-jobs"
        : role === "admin"
            ? "/admin/dashboard"
            : "/candidate/find-jobs";

    useEffect(() => {
        if (!isLoggedIn) {
            router.replace("/login");
            return;
        }

        if (!role) {
            return;
        }

        if (pathname.startsWith("/candidate") && role !== "candidate") {
            router.replace(defaultRoute);
        }

        if (pathname.startsWith("/recruiter") && role !== "recruiter") {
            router.replace(defaultRoute);
        }

        if (pathname.startsWith("/admin") && role !== "admin") {
            router.replace(defaultRoute);
        }
    }, [defaultRoute, isLoggedIn, pathname, role, router]);

    useEffect(() => {
        window.localStorage.setItem("main-sidebar-collapsed", String(desktopSidebarCollapsed));
    }, [desktopSidebarCollapsed]);

    if (!isLoggedIn) {
        return (
            <div className="flex h-screen items-center justify-center bg-background text-foreground">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
        );
    }

    return (
        <div className="flex min-h-screen bg-background text-foreground">
            <Sidebar
                mobileOpen={mobileSidebarOpen}
                onMobileOpenChange={setMobileSidebarOpen}
                collapsed={desktopSidebarCollapsed}
            />
            <div
                className={cn(
                    "flex min-w-0 flex-1 flex-col transition-[margin-left] duration-300 ease-in-out",
                    desktopSidebarCollapsed ? "lg:ml-[88px]" : "lg:ml-[240px]",
                )}
            >
                <Header
                    onOpenSidebar={() => setMobileSidebarOpen(true)}
                    desktopSidebarCollapsed={desktopSidebarCollapsed}
                    onToggleDesktopSidebar={() => setDesktopSidebarCollapsed((current) => !current)}
                />
                <main className="min-w-0 flex-1 overflow-x-hidden p-4 sm:p-6 lg:p-8">{children}</main>
            </div>
        </div>
    );
}
