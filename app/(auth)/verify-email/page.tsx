"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MailCheck, Loader2 } from "lucide-react";

function VerifyEmailContent() {
    const searchParams = useSearchParams();
    const email = searchParams.get("email") || "";

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
            <Card className="w-full max-w-md border-0 shadow-xl">
                <CardContent className="p-8 text-center">
                    <div className="mx-auto mb-6 inline-flex h-20 w-20 items-center justify-center rounded-full bg-green-50">
                        <MailCheck size={40} className="text-green-600" />
                    </div>
                    <h2 className="mb-2 text-2xl font-bold text-gray-900">Kiểm tra email</h2>
                    <p className="mb-6 text-gray-500">
                        Chúng tôi đã gửi email xác thực đến <strong className="text-gray-700">{email}</strong>.
                        Vui lòng kiểm tra hộp thư và xác thực tài khoản.
                    </p>

                    <Link href="/login">
                        <Button className="h-11 w-full bg-[#194d8e] font-semibold hover:bg-[#194d8e]/90">
                            QUAY LẠI ĐĂNG NHẬP
                        </Button>
                    </Link>
                </CardContent>
            </Card>
        </div>
    );
}

export default function VerifyEmailPage() {
    return (
        <Suspense fallback={<div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-[#194d8e]" /></div>}>
            <VerifyEmailContent />
        </Suspense>
    );
}
