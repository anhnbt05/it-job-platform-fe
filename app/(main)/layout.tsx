"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import Sidebar from "@/components/layouts/Sidebar";
import Header from "@/components/layouts/Header";

export default function MainLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { isLoggedIn } = useAuthStore();
    const router = useRouter();

    useEffect(() => {
        if (!isLoggedIn) {
            router.replace("/login");
        }
    }, [isLoggedIn, router]);

    if (!isLoggedIn) {
        return (
            <div className="flex h-screen items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#194d8e] border-t-transparent" />
            </div>
        );
    }

    return (
        <div className="flex min-h-screen bg-[#F9FAFB]">
            <Sidebar />
            <div className="ml-[240px] flex flex-1 flex-col">
                <Header />
                <main className="flex-1 p-8">{children}</main>
            </div>
        </div>
    );
}
