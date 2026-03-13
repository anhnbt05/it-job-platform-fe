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
import { Loader2, ShieldCheck } from "lucide-react";

function VerifyOTPContent() {
    const searchParams = useSearchParams();
    const email = searchParams.get("email") || "";
    const [otp, setOtp] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!otp.trim()) {
            toast.error("Vui lòng nhập mã OTP");
            return;
        }

        setIsLoading(true);
        try {
            await authService.verifyOTP(email, otp.trim());
            toast.success("Xác thực thành công!");
            router.push("/reset-password?email=" + encodeURIComponent(email) + "&otp=" + encodeURIComponent(otp));
        } catch {
            toast.error("Mã OTP không hợp lệ");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
            <Card className="w-full max-w-md border-0 shadow-xl">
                <CardContent className="p-8">
                    <div className="mb-6 text-center">
                        <div className="mx-auto mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-green-50">
                            <ShieldCheck size={32} className="text-green-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900">Xác thực OTP</h2>
                        <p className="mt-1 text-sm text-gray-500">Nhập mã OTP đã gửi đến <strong>{email}</strong></p>
                    </div>

                    <form onSubmit={handleVerify} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="otp">Mã OTP</Label>
                            <Input id="otp" placeholder="Nhập mã OTP" value={otp} onChange={(e) => setOtp(e.target.value)} className="h-12 bg-gray-50 border-gray-200 text-center text-lg tracking-widest" maxLength={6} />
                        </div>

                        <Button type="submit" disabled={isLoading} className="h-11 w-full bg-[#194d8e] font-semibold hover:bg-[#194d8e]/90">
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            XÁC THỰC
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}

export default function VerifyOTPPage() {
    return (
        <Suspense fallback={<div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-[#194d8e]" /></div>}>
            <VerifyOTPContent />
        </Suspense>
    );
}
