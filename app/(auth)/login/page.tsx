"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "react-toastify";
import { useAuthStore } from "@/store/useAuthStore";
import { authService } from "@/services/auth.service";
import { decodeJwtPayload } from "@/lib/auth-token";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Briefcase, Eye, EyeOff, Mail, Lock, Loader2 } from "lucide-react";
import { UserRole } from "@/types/enums";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();
    const { setAuth } = useAuthStore();

    const isValidEmail = (email: string) => {
        const emailRegex = /^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/;
        return emailRegex.test(email);
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!email.trim() || !password.trim()) {
            toast.error("Vui lòng nhập đầy đủ email và mật khẩu");
            return;
        }

        if (!isValidEmail(email.trim())) {
            toast.error("Định dạng email không hợp lệ");
            return;
        }

        setIsLoading(true);
        try {
            const response = await authService.signIn(email.trim(), password.trim());
            const data = response as { accessToken?: string; refreshToken?: string };
            const token = data.accessToken || "";
            const refreshToken = data.refreshToken || null;
            const payload = decodeJwtPayload(token);
            const role = payload.role as UserRole;
            const userId = payload.id as string;

            setAuth(token, refreshToken, role, userId);
            toast.success("Đăng nhập thành công!");

            if (role === "recruiter") {
                router.push("/recruiter/manage-jobs");
            } else {
                router.push("/candidate/find-jobs");
            }
        } catch {
            toast.error("Email hoặc mật khẩu không đúng");
        } finally {
            setIsLoading(false);
        }
    };

    const handleDevLogin = (role: UserRole) => {
        setAuth("dev-token", null, role, "dev-user-id");
        toast.info(`Đã đăng nhập với quyền ${role === "recruiter" ? "Nhà tuyển dụng" : "Ứng viên"}`);
        if (role === "recruiter") {
            router.push("/recruiter/manage-jobs");
        } else {
            router.push("/candidate/find-jobs");
        }
    };

    return (
        <div className="flex min-h-screen">
            {/* Left Panel - Decorative */}
            <div className="relative hidden w-1/2 overflow-hidden bg-[#071e26] lg:flex lg:flex-col lg:items-center lg:justify-center">
                <div className="absolute inset-0 bg-gradient-to-br from-[#071e26] via-[#0d3340] to-[#194d8e] opacity-90" />
                <div className="relative z-10 max-w-md px-12 text-center">
                    <div className="mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-sm">
                        <Briefcase size={40} className="text-white" />
                    </div>
                    <h1 className="mb-4 text-4xl font-bold text-white">
                        IT Job Platform
                    </h1>
                    <p className="text-lg leading-relaxed text-white/70">
                        Nền tảng tuyển dụng IT hàng đầu. Kết nối ứng viên và nhà tuyển dụng
                        trong lĩnh vực công nghệ thông tin.
                    </p>
                    <div className="mt-10 grid grid-cols-3 gap-6">
                        <div className="rounded-xl bg-white/5 p-4 backdrop-blur-sm">
                            <p className="text-2xl font-bold text-white">1000+</p>
                            <p className="text-xs text-white/50">Việc làm</p>
                        </div>
                        <div className="rounded-xl bg-white/5 p-4 backdrop-blur-sm">
                            <p className="text-2xl font-bold text-white">500+</p>
                            <p className="text-xs text-white/50">Công ty</p>
                        </div>
                        <div className="rounded-xl bg-white/5 p-4 backdrop-blur-sm">
                            <p className="text-2xl font-bold text-white">5000+</p>
                            <p className="text-xs text-white/50">Ứng viên</p>
                        </div>
                    </div>
                </div>
                {/* Decorative circles */}
                <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-[#194d8e]/20" />
                <div className="absolute -right-10 -top-10 h-48 w-48 rounded-full bg-[#194d8e]/10" />
            </div>

            {/* Right Panel - Login Form */}
            <div className="flex w-full items-center justify-center bg-gray-50 px-8 lg:w-1/2">
                <Card className="w-full max-w-md border-0 bg-transparent shadow-none">
                    <CardContent className="p-0">
                        {/* Mobile Logo */}
                        <div className="mb-8 flex items-center gap-3 lg:hidden">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#194d8e]">
                                <Briefcase size={22} className="text-white" />
                            </div>
                            <h1 className="text-xl font-bold text-gray-900">IT Job Platform</h1>
                        </div>

                        <div className="mb-2">
                            <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-[#194d8e] to-[#194d8e]/80">
                                <Lock size={28} className="text-white" />
                            </div>
                            <h2 className="text-3xl font-bold text-gray-900">Xin chào</h2>
                            <p className="mt-1 text-gray-500">Chào mừng bạn trở lại</p>
                        </div>

                        <form onSubmit={handleLogin} className="mt-8 space-y-5">
                            <div className="space-y-2">
                                <Label htmlFor="email" className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                                    Email
                                </Label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="Nhập email của bạn"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="h-12 bg-gray-100 pl-10 border-0 focus-visible:ring-[#194d8e]"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="password" className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                                    Mật khẩu
                                </Label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                                    <Input
                                        id="password"
                                        type={showPassword ? "text" : "password"}
                                        placeholder="Nhập mật khẩu"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="h-12 bg-gray-100 pl-10 pr-10 border-0 focus-visible:ring-[#194d8e]"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                    >
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>

                            <Button
                                type="submit"
                                disabled={isLoading}
                                className="h-12 w-full bg-[#194d8e] text-base font-semibold hover:bg-[#194d8e]/90"
                            >
                                {isLoading ? (
                                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                ) : null}
                                ĐĂNG NHẬP
                            </Button>

                            <div className="flex items-center justify-between pt-2">
                                <Link
                                    href="/register"
                                    className="text-sm text-gray-500 transition-colors hover:text-gray-700"
                                >
                                    ĐĂNG KÝ TÀI KHOẢN
                                </Link>
                                <Link
                                    href="/forgot-password"
                                    className="text-sm font-medium text-[#194d8e] transition-colors hover:text-[#194d8e]/80"
                                >
                                    QUÊN MẬT KHẨU
                                </Link>
                            </div>

                            <div className="mt-8">
                                <div className="relative mb-6">
                                    <div className="absolute inset-0 flex items-center">
                                        <span className="w-full border-t border-gray-200" />
                                    </div>
                                    <div className="relative flex justify-center text-xs uppercase">
                                        <span className="bg-gray-50 px-2 text-gray-400 font-medium tracking-wider">Xem nhanh UI (Dev mode)</span>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => handleDevLogin("candidate")}
                                        className="border-blue-200 text-[#194d8e] hover:bg-blue-50"
                                    >
                                        Vào Candidate UI
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => handleDevLogin("recruiter")}
                                        className="border-blue-200 text-[#194d8e] hover:bg-blue-50"
                                    >
                                        Vào Recruiter UI
                                    </Button>
                                </div>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
