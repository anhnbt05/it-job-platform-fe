"use client";

import Image from "next/image";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { recruiterService } from "@/services/recruiter.service";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Building2,
    ChevronRight,
    Globe,
    Info,
    Mail,
    MapPin,
    Pencil,
    Phone,
    User,
} from "lucide-react";

export default function RecruiterProfilePage() {
    const { data: recruiter, isLoading } = useQuery({
        queryKey: ["recruiter-profile"],
        queryFn: () => recruiterService.getProfile(),
    });

    if (isLoading) {
        return (
            <div className="mx-auto max-w-[960px] space-y-6">
                <Skeleton className="h-[260px] rounded-xl" />
                <Skeleton className="h-[220px] rounded-xl" />
            </div>
        );
    }

    if (!recruiter) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <User size={48} className="mb-4 text-muted-foreground" />
                <p className="text-lg font-medium text-muted-foreground">Không tìm thấy hồ sơ nhà tuyển dụng</p>
            </div>
        );
    }

    const branch = recruiter.CompanyLocations;
    const company = recruiter.Company;

    return (
        <div className="mx-auto max-w-[960px] space-y-6">
            <Card className="border-border shadow-sm">
                <CardContent className="p-6">
                    <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
                        <Avatar className="h-24 w-24 border-4 border-white shadow-lg">
                            <AvatarImage src={recruiter.AvatarUrl || undefined} />
                            <AvatarFallback className="bg-primary text-2xl text-white">
                                {recruiter.FullName?.charAt(0) || "R"}
                            </AvatarFallback>
                        </Avatar>

                        <div className="flex-1">
                            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                                <div>
                                    <h1 className="text-2xl font-bold text-foreground">
                                        {recruiter.FullName || "Nhà tuyển dụng"}
                                    </h1>
                                    {recruiter.Department && (
                                        <Badge className="mt-3 bg-primary/10 text-primary">
                                            {recruiter.Department}
                                        </Badge>
                                    )}
                                </div>

                                <Link href="/recruiter/profile/edit">
                                    <Button variant="outline">
                                        <Pencil size={14} className="mr-1.5" />
                                        Chỉnh sửa hồ sơ, công ty & chi nhánh
                                    </Button>
                                </Link>
                            </div>

                            <Separator className="my-5" />

                            <div className="grid gap-3 text-sm md:grid-cols-2">
                                <InfoRow icon={<Mail size={14} />} value={recruiter.Email || "Chưa cập nhật email"} />
                                <InfoRow icon={<Phone size={14} />} value={recruiter.PhoneNumber || "Chưa cập nhật số điện thoại"} />
                                <InfoRow icon={<Building2 size={14} />} value={company?.Name || "Chưa liên kết công ty"} />
                                <InfoRow
                                    icon={<MapPin size={14} />}
                                    value={formatBranch(branch)}
                                />
                            </div>

                            {recruiter.Bio && (
                                <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
                                    {recruiter.Bio}
                                </p>
                            )}

                            <div className="mt-5 rounded-2xl border border-blue-100 bg-gradient-to-r from-blue-50 via-white to-cyan-50 p-4">
                                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                                    <div>
                                        <p className="text-sm font-semibold text-primary">
                                            Có thể quản lý company và branch trực tiếp
                                        </p>
                                        <p className="mt-1 text-sm text-muted-foreground">
                                            Từ màn chỉnh sửa, recruiter có thể cập nhật thông tin hồ sơ, công ty và chi nhánh đã liên kết.
                                        </p>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        <Link href="/recruiter/branches">
                                            <Button variant="outline">
                                                Quản lý chi nhánh
                                            </Button>
                                        </Link>
                                        <Link href="/recruiter/profile/edit">
                                            <Button className="bg-primary hover:bg-primary/90">
                                                Quản lý ngay
                                                <ChevronRight size={16} className="ml-1.5" />
                                            </Button>
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
                <Card className="border-border shadow-sm">
                    <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-base font-semibold">
                            <Building2 size={18} className="text-primary" />
                            Thông tin công ty
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center gap-4">
                            <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-border bg-muted/40">
                                {company?.LogoUrl ? (
                                    <Image
                                        src={company.LogoUrl}
                                        alt={company.Name || "Company logo"}
                                        width={48}
                                        height={48}
                                        className="h-12 w-12 rounded-xl object-cover"
                                        unoptimized
                                    />
                                ) : (
                                    <Building2 size={28} className="text-muted-foreground" />
                                )}
                            </div>
                            <div>
                                <p className="text-lg font-semibold text-foreground">{company?.Name || "Chưa cập nhật công ty"}</p>
                                {company?.Location && (
                                    <p className="text-sm text-muted-foreground">{company.Location}</p>
                                )}
                            </div>
                        </div>

                        {company?.WebsiteUrl && (
                            <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                <Globe size={16} className="text-blue-500" />
                                <a
                                    href={company.WebsiteUrl.startsWith("http") ? company.WebsiteUrl : `https://${company.WebsiteUrl}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-primary hover:underline"
                                >
                                    {company.WebsiteUrl}
                                </a>
                            </div>
                        )}

                        {company?.Description ? (
                            <div className="flex items-start gap-3 text-sm text-muted-foreground">
                                <Info size={16} className="mt-0.5 text-blue-500" />
                                <p className="leading-relaxed">{company.Description}</p>
                            </div>
                        ) : (
                            <p className="text-sm text-muted-foreground">Công ty chưa có mô tả hiển thị trên hệ thống.</p>
                        )}
                    </CardContent>
                </Card>

                <Card className="border-border shadow-sm">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base font-semibold">Tổng quan</CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-3 sm:grid-cols-2">
                        <StatCard label="Phòng ban" value={recruiter.Department || "Chưa cập nhật"} />
                        <StatCard label="Chi nhánh" value={branch?.BranchName || "Chưa cập nhật"} />
                        <StatCard label="Thành phố" value={branch?.City || company?.Location || "Chưa cập nhật"} />
                        <StatCard label="Quy mô" value={company?.Size ? `${company.Size}+` : "Chưa cập nhật"} />
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

function InfoRow({ icon, value }: { icon: React.ReactNode; value: string }) {
    return (
        <div className="flex items-center gap-2 text-muted-foreground">
            <span className="text-muted-foreground">{icon}</span>
            <span>{value}</span>
        </div>
    );
}

function StatCard({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-xl bg-primary/5 p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
            <p className="mt-1 text-sm font-semibold text-primary">{value}</p>
        </div>
    );
}

function formatBranch(branch: { BranchName: string | null; Address: string | null; City?: string | null; Country?: string | null } | null) {
    if (!branch) {
        return "Chưa cập nhật chi nhánh";
    }

    return [
        branch.BranchName,
        branch.Address,
        branch.City,
        branch.Country,
    ].filter(Boolean).join(", ") || "Chưa cập nhật chi nhánh";
}
