"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Briefcase, User, Building2 } from "lucide-react";

export default function RegisterPage() {
    return (
        <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4">
            <div className="w-full max-w-lg">
                <div className="mb-8 text-center">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary">
                        <Briefcase size={32} className="text-white" />
                    </div>
                    <h1 className="text-3xl font-bold text-foreground">Đăng ký tài khoản</h1>
                    <p className="mt-2 text-muted-foreground">Chọn loại tài khoản phù hợp với bạn</p>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                    <Link href="/register/candidate">
                        <Card className="group cursor-pointer border-2 border-transparent transition-all duration-300 hover:border-primary hover:shadow-lg hover:shadow-[#194d8e]/10">
                            <CardHeader className="pb-2 text-center">
                                <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 transition-colors group-hover:bg-primary/10">
                                    <User size={32} className="text-primary" />
                                </div>
                                <CardTitle className="text-lg">Ứng viên</CardTitle>
                            </CardHeader>
                            <CardContent className="text-center">
                                <p className="text-sm text-muted-foreground">
                                    Tìm kiếm công việc IT phù hợp, nộp CV và theo dõi đơn ứng tuyển
                                </p>
                            </CardContent>
                        </Card>
                    </Link>

                    <Link href="/register/recruiter">
                        <Card className="group cursor-pointer border-2 border-transparent transition-all duration-300 hover:border-primary hover:shadow-lg hover:shadow-[#194d8e]/10">
                            <CardHeader className="pb-2 text-center">
                                <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 transition-colors group-hover:bg-primary/10">
                                    <Building2 size={32} className="text-primary" />
                                </div>
                                <CardTitle className="text-lg">Nhà tuyển dụng</CardTitle>
                            </CardHeader>
                            <CardContent className="text-center">
                                <p className="text-sm text-muted-foreground">
                                    Đăng tin tuyển dụng, tìm kiếm ứng viên và quản lý đơn ứng tuyển
                                </p>
                            </CardContent>
                        </Card>
                    </Link>
                </div>

                <p className="mt-8 text-center text-sm text-muted-foreground">
                    Đã có tài khoản?{" "}
                    <Link href="/login" className="font-medium text-primary hover:underline">
                        Đăng nhập
                    </Link>
                </p>
            </div>
        </div>
    );
}
