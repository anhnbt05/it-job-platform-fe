"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { jobService } from "@/services/job.service";
import { JobDetail } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
    MapPin,
    DollarSign,
    Clock,
    Briefcase,
    Building2,
    Users,
    Calendar,
    Globe,
    ArrowLeft,
    CheckCircle2,
    Star,
    FileText,
    GraduationCap,
} from "lucide-react";
import { JobTypeLabel, LevelLabel, JobType, Level } from "@/types/enums";

export default function JobDetailPage() {
    const params = useParams();
    const jobId = params.id as string;

    const { data: job, isLoading } = useQuery({
        queryKey: ["job", jobId],
        queryFn: async () => {
            const res = await jobService.getJobById(jobId);
            return res as unknown as JobDetail;
        },
        enabled: !!jobId,
    });

    const formatDate = (dateStr: string) => {
        const d = new Date(dateStr);
        return `${d.getDate().toString().padStart(2, "0")}/${(d.getMonth() + 1).toString().padStart(2, "0")}/${d.getFullYear()}`;
    };

    if (isLoading) {
        return (
            <div className="mx-auto max-w-[1100px] space-y-6">
                <Skeleton className="h-10 w-40" />
                <div className="grid grid-cols-3 gap-6">
                    <div className="col-span-2 space-y-6">
                        <Skeleton className="h-[200px] rounded-xl" />
                        <Skeleton className="h-[300px] rounded-xl" />
                    </div>
                    <Skeleton className="h-[400px] rounded-xl" />
                </div>
            </div>
        );
    }

    if (!job) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <Briefcase size={48} className="mb-4 text-gray-300" />
                <p className="text-lg font-medium text-gray-500">Không tìm thấy công việc</p>
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-[1100px]">
            <Link href="/candidate/find-jobs" className="mb-6 inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700">
                <ArrowLeft size={16} /> Quay lại tìm kiếm
            </Link>

            <div className="grid grid-cols-3 gap-6">
                {/* Main Content */}
                <div className="col-span-2 space-y-6">
                    {/* Header Card */}
                    <Card className="border-gray-100 shadow-sm">
                        <CardContent className="p-6">
                            <div className="flex items-start gap-5">
                                <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-xl bg-gray-50 border border-gray-100">
                                    {job.Recruiter?.Company?.LogoUrl ? (
                                        <img src={job.Recruiter.Company.LogoUrl} alt="" className="h-12 w-12 rounded-lg object-cover" />
                                    ) : (
                                        <Building2 size={28} className="text-gray-400" />
                                    )}
                                </div>
                                <div className="flex-1">
                                    <h1 className="text-2xl font-bold text-gray-900">{job.Title}</h1>
                                    <p className="mt-1 text-base text-gray-500">{job.Recruiter?.Company?.Name}</p>
                                    <div className="mt-3 flex flex-wrap gap-2">
                                        <Badge className="bg-blue-50 text-[#194d8e]">
                                            <Briefcase size={12} className="mr-1" />
                                            {JobTypeLabel[job.Type as JobType] || job.Type}
                                        </Badge>
                                        <Badge className="bg-purple-50 text-purple-700">
                                            <GraduationCap size={12} className="mr-1" />
                                            {LevelLabel[job.Level as Level] || job.Level}
                                        </Badge>
                                        {job.Categories?.map((cat, idx) => (
                                            <Badge key={idx} variant="outline" className="border-gray-200 text-gray-600">
                                                {cat}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <Separator className="my-5" />

                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <InfoRow icon={<DollarSign size={16} className="text-green-500" />} label="Mức lương" value={job.Salary} />
                                <InfoRow icon={<MapPin size={16} className="text-orange-400" />} label="Địa điểm" value={job.Address} />
                                <InfoRow icon={<Users size={16} className="text-blue-500" />} label="Số lượng" value={`${job.Vacancies} người`} />
                                <InfoRow icon={<Clock size={16} className="text-violet-500" />} label="Thời gian" value={job.WorkingTimes} />
                                <InfoRow icon={<Calendar size={16} className="text-teal-500" />} label="Ngày đăng" value={formatDate(job.PostedAt)} />
                                <InfoRow icon={<Calendar size={16} className="text-red-400" />} label="Hạn nộp" value={formatDate(job.ExpiredAt)} />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Description */}
                    {job.Description && (
                        <SectionCard icon={<FileText size={18} />} title="Mô tả">
                            <p className="text-gray-700 whitespace-pre-line leading-relaxed">{job.Description}</p>
                        </SectionCard>
                    )}

                    {/* Job Descriptions */}
                    {job.JobDescriptions?.length > 0 && (
                        <SectionCard icon={<FileText size={18} />} title="Chi tiết công việc">
                            <BulletList items={job.JobDescriptions} />
                        </SectionCard>
                    )}

                    {/* Requirements */}
                    {job.JobRequirements?.length > 0 && (
                        <SectionCard icon={<CheckCircle2 size={18} />} title="Yêu cầu">
                            <BulletList items={job.JobRequirements} />
                        </SectionCard>
                    )}

                    {/* Benefits */}
                    {job.JobBenefits?.length > 0 && (
                        <SectionCard icon={<Star size={18} />} title="Quyền lợi">
                            <BulletList items={job.JobBenefits} />
                        </SectionCard>
                    )}
                </div>

                {/* Sidebar - Company Info */}
                <div className="space-y-6">
                    <Card className="border-gray-100 shadow-sm">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base font-semibold">Thông tin công ty</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gray-50 border border-gray-100">
                                    {job.Recruiter?.Company?.LogoUrl ? (
                                        <img src={job.Recruiter.Company.LogoUrl} alt="" className="h-8 w-8 rounded-lg object-cover" />
                                    ) : (
                                        <Building2 size={20} className="text-gray-400" />
                                    )}
                                </div>
                                <div>
                                    <p className="font-semibold text-gray-900">{job.Recruiter?.Company?.Name}</p>
                                </div>
                            </div>

                            {job.Recruiter?.Company?.WebsiteUrl && (
                                <div className="flex items-center gap-2 text-sm">
                                    <Globe size={14} className="text-gray-400" />
                                    <a
                                        href={job.Recruiter.Company.WebsiteUrl.startsWith("http") ? job.Recruiter.Company.WebsiteUrl : `https://${job.Recruiter.Company.WebsiteUrl}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-[#194d8e] hover:underline truncate"
                                    >
                                        {job.Recruiter.Company.WebsiteUrl}
                                    </a>
                                </div>
                            )}

                            {job.Recruiter?.Company?.Description && (
                                <>
                                    <Separator />
                                    <p className="text-sm leading-relaxed text-gray-600 line-clamp-6">
                                        {job.Recruiter.Company.Description}
                                    </p>
                                </>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
    return (
        <div className="flex items-start gap-3">
            <span className="mt-0.5">{icon}</span>
            <div>
                <p className="text-xs text-gray-400">{label}</p>
                <p className="font-medium text-gray-700">{value}</p>
            </div>
        </div>
    );
}

function SectionCard({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
    return (
        <Card className="border-gray-100 shadow-sm">
            <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base font-semibold">
                    <span className="text-[#194d8e]">{icon}</span>
                    {title}
                </CardTitle>
            </CardHeader>
            <CardContent>{children}</CardContent>
        </Card>
    );
}

function BulletList({ items }: { items: string[] }) {
    return (
        <ul className="space-y-2">
            {items.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2.5 text-sm text-gray-700">
                    <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[#194d8e]" />
                    <span className="leading-relaxed">{item}</span>
                </li>
            ))}
        </ul>
    );
}
