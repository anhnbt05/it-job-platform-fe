"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MailCheck, Loader2, ArrowLeft, ShieldCheck } from "lucide-react";
import { authService } from "@/services/auth.service";
import { toast } from "react-toastify";

function VerifyEmailContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const email = searchParams.get("email") || "";
    const [otp, setOtp] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleVerify = async (event: React.FormEvent) => {
        event.preventDefault();

        if (!email.trim() || !otp.trim()) {
            toast.error("Vui lòng nhập mã OTP được gửi tới email của bạn");
            return;
        }

        setIsLoading(true);
        try {
            await authService.verifyEmailOtp(email.trim(), otp.trim());
            toast.success("Xác thực email thành công");
            router.push("/login");
        } catch {
            toast.error("Mã OTP không hợp lệ hoặc đã hết hạn");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4">
            <Card className="w-full max-w-md border-0 shadow-xl">
                <CardContent className="p-8">
                    <Link href="/login" className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
                        <ArrowLeft size={16} />
                        Quay lại đăng nhập
                    </Link>

                    <div className="mb-6 text-center">
                        <div className="mx-auto mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-green-50">
                            <MailCheck size={32} className="text-green-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-foreground">Xác thực email</h2>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Nhập mã OTP đã được gửi tới <strong>{email}</strong>
                        </p>
                    </div>

                    <form onSubmit={handleVerify} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="otp">Mã OTP</Label>
                            <div className="relative">
                                <ShieldCheck className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    id="otp"
                                    placeholder="Nhập mã OTP"
                                    value={otp}
                                    onChange={(event) => setOtp(event.target.value)}
                                    className="h-11 bg-muted/40 pl-10 text-center text-lg tracking-[0.3em]"
                                    maxLength={6}
                                />
                            </div>
                        </div>

                        <Button type="submit" disabled={isLoading} className="h-11 w-full bg-primary font-semibold hover:bg-primary/90">
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            XÁC THỰC EMAIL
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}

export default function VerifyEmailPage() {
    return (
        <Suspense fallback={<div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}>
            <VerifyEmailContent />
        </Suspense>
    );
}
