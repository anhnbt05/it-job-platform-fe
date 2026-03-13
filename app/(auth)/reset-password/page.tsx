"use client";

import { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "react-toastify";
import { authService } from "@/services/auth.service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Lock, Loader2, Eye, EyeOff, KeyRound } from "lucide-react";

function ResetPasswordContent() {
    const searchParams = useSearchParams();
    const email = searchParams.get("email") || "";
    const otp = searchParams.get("otp") || "";
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const handleReset = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!password.trim() || !confirmPassword.trim()) {
            toast.error("Vui lòng nhập đầy đủ thông tin");
            return;
        }

        if (password !== confirmPassword) {
            toast.error("Mật khẩu xác nhận không khớp");
            return;
        }

        setIsLoading(true);
        try {
            await authService.resetPassword(email, password.trim(), otp);
            toast.success("Đổi mật khẩu thành công!");
            router.push("/login");
        } catch {
            toast.error("Đổi mật khẩu thất bại");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
            <Card className="w-full max-w-md border-0 shadow-xl">
                <CardContent className="p-8">
                    <div className="mb-6">
                        <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-[#194d8e]/10">
                            <KeyRound size={24} className="text-[#194d8e]" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900">Đặt lại mật khẩu</h2>
                        <p className="mt-1 text-sm text-gray-500">Nhập mật khẩu mới cho tài khoản của bạn</p>
                    </div>

                    <form onSubmit={handleReset} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="password">Mật khẩu mới</Label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                                <Input id="password" type={showPassword ? "text" : "password"} placeholder="Nhập mật khẩu mới" value={password} onChange={(e) => setPassword(e.target.value)} className="h-11 pl-10 pr-10 bg-gray-50 border-gray-200" />
                                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword">Xác nhận mật khẩu</Label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                                <Input id="confirmPassword" type={showPassword ? "text" : "password"} placeholder="Nhập lại mật khẩu" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="h-11 pl-10 bg-gray-50 border-gray-200" />
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
