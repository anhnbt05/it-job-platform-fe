"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import { authService } from "@/services/auth.service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Mail, Loader2, ArrowLeft, KeyRound } from "lucide-react";

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email.trim()) {
            toast.error("Vui lòng nhập email");
            return;
        }

        setIsLoading(true);
        try {
            await authService.forgotPassword(email.trim());
            toast.success("Đã gửi mã OTP đến email của bạn");
            router.push("/verify-otp?email=" + encodeURIComponent(email));
        } catch {
            toast.error("Không tìm thấy tài khoản với email này");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
            <Card className="w-full max-w-md border-0 shadow-xl">
                <CardContent className="p-8">
                    <Link href="/login" className="mb-6 inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700">
                        <ArrowLeft size={16} /> Quay lại đăng nhập
                    </Link>

                    <div className="mb-6">
                        <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-amber-50">
                            <KeyRound size={24} className="text-amber-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900">Quên mật khẩu</h2>
                        <p className="mt-1 text-sm text-gray-500">Nhập email để nhận mã xác thực</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                                <Input id="email" type="email" placeholder="email@example.com" value={email} onChange={(e) => setEmail(e.target.value)} className="h-11 pl-10 bg-gray-50 border-gray-200" />
                            </div>
                        </div>

                        <Button type="submit" disabled={isLoading} className="h-11 w-full bg-[#194d8e] font-semibold hover:bg-[#194d8e]/90">
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            GỬI MÃ XÁC THỰC
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
