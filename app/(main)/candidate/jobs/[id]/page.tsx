"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toastApiError, toastApiSuccess } from "@/lib/axios";
import { applicationService } from "@/services/application.service";
import { candidateService } from "@/services/candidate.service";
import { jobService } from "@/services/job.service";
import { JobType, JobTypeLabel, Level, LevelLabel } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
    ArrowLeft,
    Briefcase,
    Calendar,
    CheckCircle2,
    Clock,
    DollarSign,
    FileText,
    GraduationCap,
    Heart,
    Loader2,
    MapPin,
    Paperclip,
    ShieldCheck,
    Star,
    Upload,
    Users,
} from "lucide-react";
import { toast } from "react-toastify";

export default function JobDetailPage() {
    const params = useParams();
    const queryClient = useQueryClient();
    const jobId = params.id as string;
    const [applyDialogOpen, setApplyDialogOpen] = useState(false);
    const [resumeFile, setResumeFile] = useState<File | null>(null);

    const { data: job, isLoading } = useQuery({
        queryKey: ["job", jobId],
        queryFn: () => jobService.getJobById(jobId),
        enabled: !!jobId,
    });

    const { data: favoriteJobs = [] } = useQuery({
        queryKey: ["favorite-jobs"],
        queryFn: () => jobService.getFavoriteJobs(),
    });

    const { data: applications = [] } = useQuery({
        queryKey: ["applied-jobs"],
        queryFn: () => applicationService.getAppliedJobs(),
    });

    const { data: candidate } = useQuery({
        queryKey: ["candidate-profile"],
        queryFn: () => candidateService.getProfile(),
    });

    const isFavorite = useMemo(
        () => favoriteJobs.some((favorite) => favorite.Job.ID === jobId),
        [favoriteJobs, jobId],
    );

    const existingApplication = useMemo(
        () => applications.find((application) => application.JobId === jobId && application.Status === "pending"),
        [applications, jobId],
    );

    const favoriteMutation = useMutation({
        mutationFn: () => (isFavorite ? jobService.removeFavoriteJob(jobId) : jobService.addFavoriteJob(jobId)),
        onSuccess: (response) => {
            toastApiSuccess(response);
            queryClient.invalidateQueries({ queryKey: ["favorite-jobs"] });
        },
        onError: (error) => toastApiError(error),
    });

    const applyMutation = useMutation({
        mutationFn: async () => {
            if (!job || !candidate) {
                throw new Error("missing-data");
            }

            let resumeUrl = candidate.ResumeUrl || candidate.ResumeUrls[0] || null;
            const responses: unknown[] = [];

            if (resumeFile) {
                const uploadResponse = await candidateService.uploadResume(resumeFile);
                const uploadData = uploadResponse as {
                    data?: {
                        resumeUrl?: string;
                    };
                };

                resumeUrl = uploadData.data?.resumeUrl ?? resumeUrl;
                responses.push(uploadResponse);
            }

            if (!resumeUrl) {
                throw new Error("missing-resume");
            }

            const applicationResponse = await applicationService.applyForJob({
                jobId: job.ID,
                resumeUrl,
                candidateName: candidate.FullName ?? "",
                jobTitle: job.Title,
                recruiterId: job.RecruiterId,
            });

            responses.push(applicationResponse);
            return responses;
        },
        onSuccess: (responses) => {
            toastApiSuccess(responses);
            setApplyDialogOpen(false);
            setResumeFile(null);
            queryClient.invalidateQueries({ queryKey: ["applied-jobs"] });
            queryClient.invalidateQueries({ queryKey: ["candidate-profile"] });
        },
        onError: (error) => {
            if (error instanceof Error && error.message === "missing-resume") {
                toast.error("Bạn cần có CV đã lưu hoặc tải CV mới trước khi ứng tuyển");
                return;
            }

            toastApiError(error);
        },
    });

    if (isLoading) {
        return (
            <div className="mx-auto max-w-[1100px] space-y-6">
                <Skeleton className="h-10 w-40" />
                <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
                    <div className="space-y-6">
                        <Skeleton className="h-[220px] rounded-xl" />
                        <Skeleton className="h-[320px] rounded-xl" />
                    </div>
                    <Skeleton className="h-[420px] rounded-xl" />
                </div>
            </div>
        );
    }

    if (!job) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <Briefcase size={48} className="mb-4 text-muted-foreground" />
                <p className="text-lg font-medium text-muted-foreground">Không tìm thấy công việc</p>
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-[1100px]">
            <Link
                href="/candidate/find-jobs"
                className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
            >
                <ArrowLeft size={16} />
                Quay lại tìm việc
            </Link>

            <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
                <div className="space-y-6">
                    <Card className="border-border shadow-sm">
                        <CardContent className="p-6">
                            <div className="flex flex-col gap-6 md:flex-row md:items-start">
                                <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-2xl bg-primary/10">
                                    <Briefcase size={30} className="text-primary" />
                                </div>

                                <div className="flex-1">
                                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                                        <div>
                                            <h1 className="text-2xl font-bold text-foreground">{job.Title}</h1>
                                            <p className="mt-1 text-base text-muted-foreground">
                                                Cơ hội tuyển dụng đang mở trên IT Job Platform
                                            </p>
                                        </div>

                                        <Button
                                            variant="outline"
                                            onClick={() => favoriteMutation.mutate()}
                                            disabled={favoriteMutation.isPending}
                                            className="border-red-100 text-red-500 hover:bg-red-50 hover:text-red-600"
                                        >
                                            {favoriteMutation.isPending ? (
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            ) : (
                                                <Heart
                                                    size={16}
                                                    className={`mr-2 ${isFavorite ? "fill-red-500 text-red-500" : ""}`}
                                                />
                                            )}
                                            {isFavorite ? "Đã lưu" : "Lưu việc"}
                                        </Button>
                                    </div>

                                    <div className="mt-4 flex flex-wrap gap-2">
                                        <Badge className="bg-primary/10 text-primary">
                                            <Briefcase size={12} className="mr-1" />
                                            {JobTypeLabel[job.Type as JobType] || job.Type}
                                        </Badge>
                                        <Badge className="bg-purple-50 text-purple-700">
                                            <GraduationCap size={12} className="mr-1" />
                                            {LevelLabel[job.Level as Level] || job.Level}
                                        </Badge>
                                        {job.Categories.map((category) => (
                                            <Badge key={category} variant="outline" className="border-border text-muted-foreground">
                                                {category}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <Separator className="my-5" />

                            <div className="grid gap-4 text-sm md:grid-cols-2">
                                <InfoRow icon={<DollarSign size={16} className="text-green-500" />} label="Mức lương" value={job.Salary || "Thoả thuận"} />
                                <InfoRow icon={<MapPin size={16} className="text-orange-400" />} label="Địa điểm" value={job.Address || "Chưa cập nhật"} />
                                <InfoRow icon={<Users size={16} className="text-blue-500" />} label="Số lượng tuyển" value={`${job.Vacancies} người`} />
                                <InfoRow icon={<Clock size={16} className="text-violet-500" />} label="Thời gian làm việc" value={job.WorkingTimes || "Chưa cập nhật"} />
                                <InfoRow icon={<Calendar size={16} className="text-teal-500" />} label="Ngày đăng" value={formatDate(job.PostedAt)} />
                                <InfoRow icon={<Calendar size={16} className="text-red-400" />} label="Hạn nộp" value={formatDate(job.ExpiredAt)} />
                            </div>
                        </CardContent>
                    </Card>

                    {job.Description && (
                        <SectionCard icon={<FileText size={18} />} title="Tổng quan công việc">
                            <p className="whitespace-pre-line text-foreground">{job.Description}</p>
                        </SectionCard>
                    )}

                    {job.JobDescriptions.length > 0 && (
                        <SectionCard icon={<FileText size={18} />} title="Nhiệm vụ chính">
                            <BulletList items={job.JobDescriptions} />
                        </SectionCard>
                    )}

                    {job.JobRequirements.length > 0 && (
                        <SectionCard icon={<CheckCircle2 size={18} />} title="Yêu cầu ứng viên">
                            <BulletList items={job.JobRequirements} />
                        </SectionCard>
                    )}

                    {job.JobBenefits.length > 0 && (
                        <SectionCard icon={<Star size={18} />} title="Quyền lợi">
                            <BulletList items={job.JobBenefits} />
                        </SectionCard>
                    )}
                </div>

                <div className="space-y-6">
                    <Card className="border-border shadow-sm">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base font-semibold">Ứng tuyển ngay</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="rounded-xl bg-primary/5 p-4 text-sm text-muted-foreground">
                                <div className="mb-2 flex items-center gap-2 font-medium text-foreground">
                                    <ShieldCheck size={16} className="text-primary" />
                                    Hồ sơ ứng tuyển
                                </div>
                                <p>
                                    {candidate?.ResumeUrl || candidate?.ResumeUrls[0]
                                        ? "Bạn có thể dùng CV đã lưu hoặc tải CV mới cho lần ứng tuyển này."
                                        : "Hồ sơ của bạn chưa có CV lưu sẵn. Tải CV mới để tiếp tục."}
                                </p>
                            </div>

                            <Button
                                className="w-full bg-primary hover:bg-primary/90"
                                onClick={() => setApplyDialogOpen(true)}
                                disabled={!!existingApplication}
                            >
                                {existingApplication ? "Đã ứng tuyển" : "Ứng tuyển công việc này"}
                            </Button>

                            {existingApplication && (
                                <p className="text-xs text-amber-600">
                                    Bạn đã gửi đơn cho công việc này và đang chờ phản hồi.
                                </p>
                            )}
                        </CardContent>
                    </Card>

                    <Card className="border-border shadow-sm">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base font-semibold">Thông tin tuyển dụng</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 text-sm text-muted-foreground">
                            <div>
                                <p className="text-xs uppercase tracking-wide text-muted-foreground">Trạng thái</p>
                                <p className="mt-1 font-medium text-foreground">{job.Status}</p>
                            </div>
                            <div>
                                <p className="text-xs uppercase tracking-wide text-muted-foreground">Mã nhà tuyển dụng</p>
                                <p className="mt-1 break-all font-medium text-foreground">{job.RecruiterId}</p>
                            </div>
                            <div>
                                <p className="text-xs uppercase tracking-wide text-muted-foreground">Danh mục</p>
                                <p className="mt-1">{job.Categories.join(", ") || "Chưa cập nhật"}</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            <Dialog open={applyDialogOpen} onOpenChange={setApplyDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Ứng tuyển công việc</DialogTitle>
                        <DialogDescription>
                            Bạn có thể dùng CV đã lưu trong hồ sơ hoặc tải thêm một CV mới để nộp cho vị trí này.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div className="rounded-xl border border-border bg-muted/40 p-4">
                            <div className="mb-2 flex items-center gap-2 text-sm font-medium text-foreground">
                                <Paperclip size={16} className="text-primary" />
                                CV đang có trong hồ sơ
                            </div>
                            {candidate?.ResumeUrl || candidate?.ResumeUrls[0] ? (
                                <a
                                    href={candidate.ResumeUrl || candidate.ResumeUrls[0]}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-sm text-primary hover:underline"
                                >
                                    Xem CV đã lưu
                                </a>
                            ) : (
                                <p className="text-sm text-muted-foreground">Bạn chưa có CV đã lưu.</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-foreground">Tải CV mới (tuỳ chọn)</label>
                            <Input
                                type="file"
                                accept=".pdf,.doc,.docx"
                                onChange={(event) => setResumeFile(event.target.files?.[0] ?? null)}
                            />
                            <p className="text-xs text-muted-foreground">
                                Nếu chọn file mới, hệ thống sẽ tải file đó lên và dùng file mới cho đơn ứng tuyển.
                            </p>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setApplyDialogOpen(false)}>
                            Đóng
                        </Button>
                        <Button
                            onClick={() => applyMutation.mutate()}
                            disabled={applyMutation.isPending}
                            className="bg-primary hover:bg-primary/90"
                        >
                            {applyMutation.isPending ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <Upload size={16} className="mr-2" />
                            )}
                            Gửi đơn ứng tuyển
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
    return (
        <div className="flex items-start gap-3">
            <span className="mt-0.5">{icon}</span>
            <div>
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="font-medium text-foreground">{value}</p>
            </div>
        </div>
    );
}

function SectionCard({
    icon,
    title,
    children,
}: {
    icon: React.ReactNode;
    title: string;
    children: React.ReactNode;
}) {
    return (
        <Card className="border-border shadow-sm">
            <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base font-semibold">
                    <span className="text-primary">{icon}</span>
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
            {items.map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-sm text-foreground">
                    <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary" />
                    <span className="leading-relaxed">{item}</span>
                </li>
            ))}
        </ul>
    );
}

function formatDate(dateString: string) {
    if (!dateString) {
        return "Chưa cập nhật";
    }

    const date = new Date(dateString);
    return `${date.getDate().toString().padStart(2, "0")}/${(date.getMonth() + 1)
        .toString()
        .padStart(2, "0")}/${date.getFullYear()}`;
}
