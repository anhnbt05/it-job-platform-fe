"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "react-toastify";
import { toastApiError, toastApiSuccess } from "@/lib/axios";
import { authService } from "@/services/auth.service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Loader2, ShieldCheck } from "lucide-react";
import Link from "next/link";

function VerifyOTPContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const email = searchParams.get("email") || "";
    const [otp, setOtp] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleVerify = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!otp.trim()) {
            toast.error("Vui lòng nhập mã OTP");
            return;
        }

        setIsLoading(true);
        try {
            const response = await authService.verifyPasswordResetOtp(email, otp.trim());
            const data = response as { token?: string };

            if (!data.token) {
                throw new Error("missing-token");
            }

            toastApiSuccess(response);
            router.push(`/reset-password?token=${encodeURIComponent(data.token)}&email=${encodeURIComponent(email)}`);
        } catch (error) {
            toastApiError(error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4">
            <Card className="w-full max-w-md border-0 shadow-xl">
                <CardContent className="p-8">
                    <Link href="/forgot-password" className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
                        <ArrowLeft size={16} />
                        Quay lại
                    </Link>

                    <div className="mb-6 text-center">
                        <div className="mx-auto mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-green-50">
                            <ShieldCheck size={32} className="text-green-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-foreground">Xác thực OTP</h2>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Nhập mã OTP đã gửi đến <strong>{email}</strong>
                        </p>
                    </div>

                    <form onSubmit={handleVerify} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="otp">Mã OTP</Label>
                            <Input
                                id="otp"
                                placeholder="Nhập mã OTP"
                                value={otp}
                                onChange={(event) => setOtp(event.target.value)}
                                className="h-12 bg-muted/40 text-center text-lg tracking-widest"
                                maxLength={6}
                            />
                        </div>

                        <Button type="submit" disabled={isLoading} className="h-11 w-full bg-primary font-semibold hover:bg-primary/90">
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
        <Suspense fallback={<div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}>
            <VerifyOTPContent />
        </Suspense>
    );
}
