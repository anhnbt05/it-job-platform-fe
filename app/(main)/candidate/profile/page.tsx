"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { candidateService } from "@/services/candidate.service";
import { Level, LevelLabel } from "@/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Briefcase,
    ExternalLink,
    FileText,
    GraduationCap,
    Mail,
    MapPin,
    Pencil,
    Phone,
    User,
} from "lucide-react";

export default function CandidateProfilePage() {
    const { data: candidate, isLoading } = useQuery({
        queryKey: ["candidate-profile"],
        queryFn: () => candidateService.getProfile(),
    });

    if (isLoading) {
        return (
            <div className="mx-auto max-w-[960px] space-y-6">
                <Skeleton className="h-[280px] rounded-xl" />
                <Skeleton className="h-[220px] rounded-xl" />
                <Skeleton className="h-[280px] rounded-xl" />
            </div>
        );
    }

    if (!candidate) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <User size={48} className="mb-4 text-gray-300" />
                <p className="text-lg font-medium text-gray-500">Không tìm thấy hồ sơ ứng viên</p>
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-[960px] space-y-6">
            <Card className="border-gray-100 shadow-sm">
                <CardContent className="p-6">
                    <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
                        <Avatar className="h-24 w-24 border-4 border-white shadow-lg">
                            <AvatarImage src={candidate.AvatarUrl || undefined} />
                            <AvatarFallback className="bg-[#194d8e] text-2xl text-white">
                                {candidate.FullName?.charAt(0) || "U"}
                            </AvatarFallback>
                        </Avatar>

                        <div className="flex-1">
                            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                                <div>
                                    <h1 className="text-2xl font-bold text-gray-900">{candidate.FullName || "Ứng viên"}</h1>
                                    {candidate.Headline && (
                                        <p className="mt-1 text-sm font-medium text-[#194d8e]">{candidate.Headline}</p>
                                    )}
                                    {candidate.Level && (
                                        <Badge className="mt-3 bg-purple-50 text-purple-700">
                                            <GraduationCap size={12} className="mr-1" />
                                            {LevelLabel[candidate.Level as Level] || candidate.Level}
                                        </Badge>
                                    )}
                                </div>

                                <Link href="/candidate/profile/edit">
                                    <Button variant="outline">
                                        <Pencil size={14} className="mr-1.5" />
                                        Chỉnh sửa hồ sơ
                                    </Button>
                                </Link>
                            </div>

                            <Separator className="my-5" />

                            <div className="grid gap-3 text-sm md:grid-cols-2">
                                <InfoRow icon={<Mail size={14} />} value={candidate.Email || "Chưa cập nhật email"} />
                                <InfoRow icon={<Phone size={14} />} value={candidate.PhoneNumber || "Chưa cập nhật số điện thoại"} />
                            </div>

                            {candidate.Bio && (
                                <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-gray-600">
                                    {candidate.Bio}
                                </p>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
                <div className="space-y-6">
                    <Card className="border-gray-100 shadow-sm">
                        <CardHeader className="pb-3">
                            <CardTitle className="flex items-center gap-2 text-base font-semibold">
                                <User size={18} className="text-[#194d8e]" />
                                Tóm tắt chuyên môn
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {candidate.Summary.length > 0 ? (
                                <ul className="space-y-2">
                                    {candidate.Summary.map((summary) => (
                                        <li key={summary} className="flex items-start gap-2 text-sm text-gray-700">
                                            <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[#194d8e]" />
                                            <span>{summary}</span>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-sm text-gray-400">Bạn chưa cập nhật phần tóm tắt chuyên môn.</p>
                            )}
                        </CardContent>
                    </Card>

                    <Card className="border-gray-100 shadow-sm">
                        <CardHeader className="pb-3">
                            <CardTitle className="flex items-center gap-2 text-base font-semibold">
                                <Briefcase size={18} className="text-[#194d8e]" />
                                Kinh nghiệm làm việc
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {candidate.WorkExperiences.length === 0 ? (
                                <p className="py-6 text-center text-sm text-gray-400">Chưa có kinh nghiệm làm việc nào</p>
                            ) : (
                                <div className="space-y-4">
                                    {candidate.WorkExperiences.map((experience) => (
                                        <div key={experience.ID || `${experience.CompanyName}-${experience.Position}`} className="rounded-xl border border-gray-100 p-4">
                                            <div className="flex items-start justify-between gap-4">
                                                <div>
                                                    <p className="font-semibold text-gray-900">{experience.Position || "Vị trí chưa cập nhật"}</p>
                                                    <p className="text-sm text-gray-500">{experience.CompanyName || "Công ty chưa cập nhật"}</p>
                                                </div>
                                                <Badge variant="outline" className="border-gray-200 text-gray-500">
                                                    {experience.JobType}
                                                </Badge>
                                            </div>

                                            <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-gray-400">
                                                <span>{formatMonthYear(experience.StartDate)} - {formatMonthYear(experience.EndDate)}</span>
                                                {experience.Location && (
                                                    <span className="flex items-center gap-1">
                                                        <MapPin size={12} />
                                                        {experience.Location}
                                                    </span>
                                                )}
                                            </div>

                                            {experience.Descriptions && experience.Descriptions.length > 0 && (
                                                <ul className="mt-3 space-y-1.5">
                                                    {experience.Descriptions.map((description) => (
                                                        <li key={description} className="flex items-start gap-2 text-sm text-gray-600">
                                                            <span className="mt-2 h-1 w-1 flex-shrink-0 rounded-full bg-gray-400" />
                                                            <span>{description}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-6">
                    <Card className="border-gray-100 shadow-sm">
                        <CardHeader className="pb-3">
                            <CardTitle className="flex items-center gap-2 text-base font-semibold">
                                <FileText size={18} className="text-[#194d8e]" />
                                Hồ sơ CV
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {candidate.ResumeUrls.length > 0 ? (
                                candidate.ResumeUrls.map((resumeUrl, index) => (
                                    <a
                                        key={`${resumeUrl}-${index}`}
                                        href={resumeUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center justify-between rounded-xl border border-gray-100 p-3 text-sm text-gray-700 transition-colors hover:border-[#194d8e]/30 hover:bg-[#194d8e]/5"
                                    >
                                        <span>CV #{index + 1}</span>
                                        <ExternalLink size={14} className="text-[#194d8e]" />
                                    </a>
                                ))
                            ) : (
                                <p className="text-sm text-gray-400">Bạn chưa tải CV nào lên hệ thống.</p>
                            )}
                        </CardContent>
                    </Card>

                    <Card className="border-gray-100 shadow-sm">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base font-semibold">Tóm tắt hồ sơ</CardTitle>
                        </CardHeader>
                        <CardContent className="grid gap-3 sm:grid-cols-2">
                            <StatCard label="CV đã tải" value={String(candidate.ResumeUrls.length)} />
                            <StatCard label="Kinh nghiệm" value={String(candidate.WorkExperiences.length)} />
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}

function InfoRow({ icon, value }: { icon: React.ReactNode; value: string }) {
    return (
        <div className="flex items-center gap-2 text-gray-600">
            <span className="text-gray-400">{icon}</span>
            <span>{value}</span>
        </div>
    );
}

function StatCard({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-xl bg-[#194d8e]/5 p-4">
            <p className="text-xs uppercase tracking-wide text-gray-500">{label}</p>
            <p className="mt-1 text-2xl font-bold text-[#194d8e]">{value}</p>
        </div>
    );
}

function formatMonthYear(dateString: string | null) {
    if (!dateString) {
        return "Hiện tại";
    }

    const date = new Date(dateString);
    return `${(date.getMonth() + 1).toString().padStart(2, "0")}/${date.getFullYear()}`;
}
