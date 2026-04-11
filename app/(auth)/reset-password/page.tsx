"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "react-toastify";
import { authService } from "@/services/auth.service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Eye, EyeOff, KeyRound, Loader2, Lock } from "lucide-react";
import Link from "next/link";

function ResetPasswordContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const token = searchParams.get("token") || "";
    const email = searchParams.get("email") || "";
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const handleReset = async (event: React.FormEvent) => {
        event.preventDefault();

        if (!token) {
            toast.error("Thiếu token xác nhận đặt lại mật khẩu");
            return;
        }

        if (!password.trim() || !confirmPassword.trim()) {
            toast.error("Vui lòng nhập đầy đủ thông tin");
            return;
        }

        if (password.trim().length < 8) {
            toast.error("Mật khẩu mới phải có ít nhất 8 ký tự");
            return;
        }

        if (password !== confirmPassword) {
            toast.error("Mật khẩu xác nhận không khớp");
            return;
        }

        setIsLoading(true);
        try {
            await authService.resetPassword(password.trim(), token);
            toast.success("Đặt lại mật khẩu thành công");
            router.push("/login");
        } catch {
            toast.error("Không thể đặt lại mật khẩu");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
            <Card className="w-full max-w-md border-0 shadow-xl">
                <CardContent className="p-8">
                    <Link href={email ? `/verify-otp?email=${encodeURIComponent(email)}` : "/forgot-password"} className="mb-6 inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700">
                        <ArrowLeft size={16} />
                        Quay lại
                    </Link>

                    <div className="mb-6">
                        <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-[#194d8e]/10">
                            <KeyRound size={24} className="text-[#194d8e]" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900">Đặt lại mật khẩu</h2>
                        <p className="mt-1 text-sm text-gray-500">
                            Tạo mật khẩu mới cho tài khoản {email ? <strong>{email}</strong> : "của bạn"}
                        </p>
                    </div>

                    <form onSubmit={handleReset} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="password">Mật khẩu mới</Label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                                <Input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    placeholder="Nhập mật khẩu mới"
                                    value={password}
                                    onChange={(event) => setPassword(event.target.value)}
                                    className="h-11 bg-gray-50 pl-10 pr-10"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword((current) => !current)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                                >
                                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword">Xác nhận mật khẩu</Label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                                <Input
                                    id="confirmPassword"
                                    type={showPassword ? "text" : "password"}
                                    placeholder="Nhập lại mật khẩu"
                                    value={confirmPassword}
                                    onChange={(event) => setConfirmPassword(event.target.value)}
                                    className="h-11 bg-gray-50 pl-10"
                                />
                            </div>
                        </div>

                        <Button type="submit" disabled={isLoading} className="h-11 w-full bg-[#194d8e] font-semibold hover:bg-[#194d8e]/90">
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            ĐỔI MẬT KHẨU
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}

export default function ResetPasswordPage() {
    return (
        <Suspense fallback={<div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-[#194d8e]" /></div>}>
            <ResetPasswordContent />
        </Suspense>
    );
}
