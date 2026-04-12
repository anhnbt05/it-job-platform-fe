"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { applicationService } from "@/services/application.service";
import { ApplicationStatus, ApplicationStatusLabel, JobType, JobTypeLabel, Level, LevelLabel } from "@/types";
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
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
    ArrowLeft,
    Briefcase,
    Calendar,
    CheckCircle2,
    Clock3,
    ExternalLink,
    FileText,
    Loader2,
    MapPin,
    Trash2,
    UserCheck,
    XCircle,
} from "lucide-react";
import { useState } from "react";
import { toast } from "react-toastify";

export default function CandidateApplicationDetailPage() {
    const params = useParams();
    const router = useRouter();
    const queryClient = useQueryClient();
    const applicationId = params.id as string;
    const [cancelDialogOpen, setCancelDialogOpen] = useState(false);

    const { data: application, isLoading } = useQuery({
        queryKey: ["applied-job-detail", applicationId],
        queryFn: () => applicationService.getApplicationById(applicationId),
        enabled: !!applicationId,
    });

    const deleteMutation = useMutation({
        mutationFn: () => applicationService.deleteApplication(applicationId),
        onSuccess: () => {
            toast.success("Đã hủy đơn ứng tuyển");
            queryClient.invalidateQueries({ queryKey: ["applied-jobs"] });
            queryClient.invalidateQueries({ queryKey: ["applied-job-detail", applicationId] });
            router.push("/candidate/applied-jobs");
        },
        onError: () => toast.error("Không thể hủy đơn ứng tuyển"),
    });

    if (isLoading) {
        return (
            <div className="mx-auto max-w-[1040px] space-y-6">
                <Skeleton className="h-10 w-48" />
                <Skeleton className="h-[220px] rounded-xl" />
                <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
                    <Skeleton className="h-[320px] rounded-xl" />
                    <Skeleton className="h-[280px] rounded-xl" />
                </div>
            </div>
        );
    }

    if (!application) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <FileText size={48} className="mb-4 text-muted-foreground" />
                <p className="text-lg font-medium text-muted-foreground">Không tìm thấy đơn ứng tuyển</p>
                <Link href="/candidate/applied-jobs" className="mt-2 text-sm text-primary hover:underline">
                    Quay lại danh sách đơn đã nộp
                </Link>
            </div>
        );
    }

    const job = application.Job;
    const statusLabel = ApplicationStatusLabel[application.Status as ApplicationStatus] || application.Status;

    return (
        <div className="mx-auto max-w-[1040px] space-y-6">
            <Link
                href="/candidate/applied-jobs"
                className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
            >
                <ArrowLeft size={16} />
                Quay lại đơn đã ứng tuyển
            </Link>

            <Card className="border-border shadow-sm">
                <CardContent className="p-6">
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                        <div className="flex items-start gap-4">
                            <div className={`mt-1 h-12 w-1.5 rounded-full ${getStatusStripe(application.Status)}`} />
                            <div className="space-y-3">
                                <div className="flex flex-wrap items-center gap-2">
                                    <h1 className="text-2xl font-bold text-foreground">
                                        {job?.Title || application.JobTitle}
                                    </h1>
                                    <Badge variant="outline" className={getStatusColor(application.Status)}>
                                        {statusLabel}
                                    </Badge>
                                </div>

                                <p className="text-sm leading-relaxed text-muted-foreground">
                                    Chi tiết đơn ứng tuyển đã gửi tới nhà tuyển dụng. Trạng thái hiện tại được đồng bộ trực tiếp từ backend.
                                </p>

                                <div className="flex flex-wrap gap-2">
                                    {job?.Type && (
                                        <Badge className="bg-primary/10 text-primary">
                                            {JobTypeLabel[job.Type as JobType] || job.Type}
                                        </Badge>
                                    )}
                                    {job?.Level && (
                                        <Badge className="bg-purple-50 text-purple-700">
                                            {LevelLabel[job.Level as Level] || job.Level}
                                        </Badge>
                                    )}
                                    {job?.Categories?.map((category) => (
                                        <Badge key={category} variant="outline" className="border-border text-muted-foreground">
                                            {category}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                            <Link href={`/candidate/jobs/${application.JobId}`}>
                                <Button variant="outline">
                                    <ExternalLink size={16} className="mr-2" />
                                    Xem job detail
                                </Button>
                            </Link>
                            {application.Status === "pending" && (
                                <Button
                                    variant="destructive"
                                    onClick={() => setCancelDialogOpen(true)}
                                >
                                    <Trash2 size={16} className="mr-2" />
                                    Hủy đơn ứng tuyển
                                </Button>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
                <div className="space-y-6">
                    <Card className="border-border shadow-sm">
                        <CardHeader className="pb-3">
                            <CardTitle className="flex items-center gap-2 text-base font-semibold">
                                <FileText size={18} className="text-primary" />
                                Thông tin đơn ứng tuyển
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <InfoRow
                                icon={<Calendar size={16} className="text-primary" />}
                                label="Ngày nộp đơn"
                                value={formatDateTime(application.AppliedAt)}
                            />
                            <InfoRow
                                icon={<UserCheck size={16} className="text-emerald-600" />}
                                label="Trạng thái hiện tại"
                                value={statusLabel}
                            />
                            <InfoRow
                                icon={<Briefcase size={16} className="text-violet-600" />}
                                label="Mã công việc"
                                value={application.JobId}
                                mono
                            />
                            <InfoRow
                                icon={<Briefcase size={16} className="text-amber-600" />}
                                label="Mã recruiter"
                                value={application.RecruiterId}
                                mono
                            />

                            <Separator />

                            <div className={`rounded-2xl border p-4 text-sm ${getStatusPanelClass(application.Status)}`}>
                                <div className="flex items-center gap-2 font-semibold">
                                    {renderStatusIcon(application.Status)}
                                    {getStatusHeadline(application.Status)}
                                </div>
                                <p className="mt-2 leading-relaxed">
                                    {getStatusDescription(application.Status)}
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-border shadow-sm">
                        <CardHeader className="pb-3">
                            <CardTitle className="flex items-center gap-2 text-base font-semibold">
                                <Briefcase size={18} className="text-primary" />
                                Snapshot công việc khi ứng tuyển
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <p className="text-xs uppercase tracking-wide text-muted-foreground">Vị trí</p>
                                <p className="mt-1 text-base font-semibold text-foreground">
                                    {job?.Title || application.JobTitle}
                                </p>
                            </div>

                            {job?.Description && (
                                <div>
                                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Mô tả ngắn</p>
                                    <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
                                        {job.Description}
                                    </p>
                                </div>
                            )}

                            <div className="grid gap-4 md:grid-cols-2">
                                <InfoRow
                                    icon={<MapPin size={16} className="text-orange-500" />}
                                    label="Địa điểm"
                                    value={job?.Address || "Chưa đồng bộ được địa điểm"}
                                />
                                <InfoRow
                                    icon={<Clock3 size={16} className="text-blue-500" />}
                                    label="Thời gian làm việc"
                                    value={job?.WorkingTimes || "Chưa cập nhật"}
                                />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-6">
                    <Card className="border-border shadow-sm">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base font-semibold">CV đã nộp</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {application.ResumeUrl ? (
                                <>
                                    <div className="rounded-xl bg-primary/5 p-4 text-sm text-muted-foreground">
                                        CV này là file đã được dùng cho đơn ứng tuyển hiện tại.
                                    </div>
                                    <a
                                        href={application.ResumeUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
                                    >
                                        <FileText size={16} />
                                        Mở CV đã nộp
                                    </a>
                                </>
                            ) : (
                                <p className="text-sm text-muted-foreground">Đơn ứng tuyển này không có file CV đính kèm.</p>
                            )}
                        </CardContent>
                    </Card>

                    <Card className="border-border shadow-sm">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base font-semibold">Hành động nhanh</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <Link href={`/candidate/jobs/${application.JobId}`} className="block">
                                <Button variant="outline" className="w-full justify-start">
                                    <ExternalLink size={16} className="mr-2" />
                                    Xem lại mô tả công việc
                                </Button>
                            </Link>
                            <Link href="/candidate/find-jobs" className="block">
                                <Button variant="outline" className="w-full justify-start">
                                    <Briefcase size={16} className="mr-2" />
                                    Tìm công việc khác
                                </Button>
                            </Link>
                            {application.Status === "pending" && (
                                <Button
                                    variant="destructive"
                                    className="w-full justify-start"
                                    onClick={() => setCancelDialogOpen(true)}
                                >
                                    <Trash2 size={16} className="mr-2" />
                                    Hủy đơn ứng tuyển này
                                </Button>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>

            <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Hủy đơn ứng tuyển</DialogTitle>
                        <DialogDescription>
                            Bạn có chắc muốn hủy đơn ứng tuyển cho vị trí{" "}
                            <strong>{job?.Title || application.JobTitle}</strong>?
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setCancelDialogOpen(false)}>
                            Đóng
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={() => deleteMutation.mutate()}
                            disabled={deleteMutation.isPending}
                        >
                            {deleteMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Xác nhận hủy đơn
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

function InfoRow({
    icon,
    label,
    value,
    mono = false,
}: {
    icon: React.ReactNode;
    label: string;
    value: string;
    mono?: boolean;
}) {
    return (
        <div className="flex items-start gap-3">
            <span className="mt-0.5">{icon}</span>
            <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
                <p className={`mt-1 text-sm font-medium text-foreground ${mono ? "break-all font-mono text-xs" : ""}`}>
                    {value}
                </p>
            </div>
        </div>
    );
}

function getStatusColor(status: string) {
    switch (status) {
        case "accepted":
            return "border-green-200 bg-green-50 text-green-700";
        case "rejected":
            return "border-red-200 bg-red-50 text-red-700";
        default:
            return "border-amber-200 bg-amber-50 text-amber-700";
    }
}

function getStatusStripe(status: string) {
    switch (status) {
        case "accepted":
            return "bg-green-500";
        case "rejected":
            return "bg-red-500";
        default:
            return "bg-amber-400";
    }
}

function getStatusPanelClass(status: string) {
    switch (status) {
        case "accepted":
            return "border-green-100 bg-green-50 text-green-800";
        case "rejected":
            return "border-red-100 bg-red-50 text-red-800";
        default:
            return "border-amber-100 bg-amber-50 text-amber-900";
    }
}

function renderStatusIcon(status: string) {
    switch (status) {
        case "accepted":
            return <CheckCircle2 size={16} />;
        case "rejected":
            return <XCircle size={16} />;
        default:
            return <Clock3 size={16} />;
    }
}

function getStatusHeadline(status: string) {
    switch (status) {
        case "accepted":
            return "Đơn ứng tuyển đã được chấp nhận";
        case "rejected":
            return "Đơn ứng tuyển chưa phù hợp";
        default:
            return "Đơn ứng tuyển đang chờ xử lý";
    }
}

function getStatusDescription(status: string) {
    switch (status) {
        case "accepted":
            return "Nhà tuyển dụng đã duyệt hồ sơ của bạn. Hãy theo dõi thông báo và email để chờ các bước tiếp theo.";
        case "rejected":
            return "Nhà tuyển dụng đã cập nhật kết quả xử lý cho đơn này. Bạn vẫn có thể tiếp tục ứng tuyển các cơ hội khác phù hợp hơn.";
        default:
            return "Đơn của bạn đang được recruiter xem xét. Bạn có thể chờ phản hồi hoặc hủy đơn nếu không còn nhu cầu.";
    }
}

function formatDateTime(dateString: string) {
    if (!dateString) {
        return "Chưa cập nhật";
    }

    const date = new Date(dateString);
    return `${date.getDate().toString().padStart(2, "0")}/${(date.getMonth() + 1)
        .toString()
        .padStart(2, "0")}/${date.getFullYear()} ${date.getHours().toString().padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}`;
}
