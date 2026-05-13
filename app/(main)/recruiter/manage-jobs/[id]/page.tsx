"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { jobService } from "@/services/job.service";
import { JobDetail, JobTypeLabel, LevelLabel, JobType, Level, JobStatusLabel, JobStatus } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { MapPin, DollarSign, Clock, Briefcase, Users, Calendar, ArrowLeft, Edit, GraduationCap, CheckCircle2, Star, FileText } from "lucide-react";

export default function RecruiterJobDetailPage() {
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

    if (isLoading) return <div className="mx-auto max-w-[1000px] space-y-6"><Skeleton className="h-[200px] rounded-xl" /><Skeleton className="h-[300px] rounded-xl" /></div>;

    if (!job) return <div className="flex flex-col items-center justify-center py-20"><Briefcase size={48} className="mb-4 text-muted-foreground" /><p className="text-lg font-medium text-muted-foreground">Không tìm thấy</p></div>;

    return (
        <div className="mx-auto max-w-[1000px]">
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <Link href="/recruiter/manage-jobs" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft size={16} /> Quay lại</Link>
                <Link href={`/recruiter/edit-job/${job.ID}`}><Button variant="outline" size="sm" className="w-full sm:w-auto"><Edit size={14} className="mr-1.5" /> Chỉnh sửa</Button></Link>
            </div>

            <Card className="border-border shadow-sm">
                <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-foreground">{job.Title}</h1>
                            <div className="mt-3 flex flex-wrap gap-2">
                                <Badge variant="outline" className={job.Status === "open" ? "bg-green-50 text-green-700 border-green-200" : "bg-muted text-muted-foreground"}>{JobStatusLabel[job.Status as JobStatus] || job.Status}</Badge>
                                <Badge className="bg-primary/10 text-primary"><Briefcase size={12} className="mr-1" />{JobTypeLabel[job.Type as JobType] || job.Type}</Badge>
                                <Badge className="bg-purple-50 text-purple-700"><GraduationCap size={12} className="mr-1" />{LevelLabel[job.Level as Level] || job.Level}</Badge>
                            </div>
                        </div>
                    </div>
                    <Separator className="my-5" />
                    <div className="grid gap-4 text-sm md:grid-cols-2">
                        <div className="flex items-start gap-3"><DollarSign size={16} className="mt-0.5 text-green-500" /><div><p className="text-xs text-muted-foreground">Mức lương</p><p className="font-medium text-foreground">{job.Salary}</p></div></div>
                        <div className="flex items-start gap-3"><MapPin size={16} className="mt-0.5 text-orange-400" /><div><p className="text-xs text-muted-foreground">Địa điểm</p><p className="font-medium text-foreground">{job.Address}</p></div></div>
                        <div className="flex items-start gap-3"><Users size={16} className="mt-0.5 text-blue-500" /><div><p className="text-xs text-muted-foreground">Số lượng</p><p className="font-medium text-foreground">{job.Vacancies} người</p></div></div>
                        <div className="flex items-start gap-3"><Clock size={16} className="mt-0.5 text-violet-500" /><div><p className="text-xs text-muted-foreground">Thời gian</p><p className="font-medium text-foreground">{job.WorkingTimes}</p></div></div>
                        <div className="flex items-start gap-3"><Calendar size={16} className="mt-0.5 text-teal-500" /><div><p className="text-xs text-muted-foreground">Ngày đăng</p><p className="font-medium text-foreground">{formatDate(job.PostedAt)}</p></div></div>
                        <div className="flex items-start gap-3"><Calendar size={16} className="mt-0.5 text-red-400" /><div><p className="text-xs text-muted-foreground">Hạn nộp</p><p className="font-medium text-foreground">{formatDate(job.ExpiredAt)}</p></div></div>
                    </div>
                </CardContent>
            </Card>

            {job.JobDescriptions?.length > 0 && (
                <Card className="mt-6 border-border shadow-sm"><CardHeader className="pb-3"><CardTitle className="flex items-center gap-2 text-base"><FileText size={18} className="text-primary" /> Chi tiết công việc</CardTitle></CardHeader><CardContent><ul className="space-y-2">{job.JobDescriptions.map((item, idx) => <li key={idx} className="flex items-start gap-2.5 text-sm text-foreground"><span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary" />{item}</li>)}</ul></CardContent></Card>
            )}

            {job.JobRequirements?.length > 0 && (
                <Card className="mt-6 border-border shadow-sm"><CardHeader className="pb-3"><CardTitle className="flex items-center gap-2 text-base"><CheckCircle2 size={18} className="text-primary" /> Yêu cầu</CardTitle></CardHeader><CardContent><ul className="space-y-2">{job.JobRequirements.map((item, idx) => <li key={idx} className="flex items-start gap-2.5 text-sm text-foreground"><span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary" />{item}</li>)}</ul></CardContent></Card>
            )}

            {job.JobBenefits?.length > 0 && (
                <Card className="mt-6 border-border shadow-sm"><CardHeader className="pb-3"><CardTitle className="flex items-center gap-2 text-base"><Star size={18} className="text-primary" /> Quyền lợi</CardTitle></CardHeader><CardContent><ul className="space-y-2">{job.JobBenefits.map((item, idx) => <li key={idx} className="flex items-start gap-2.5 text-sm text-foreground"><span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary" />{item}</li>)}</ul></CardContent></Card>
            )}
        </div>
    );
}
