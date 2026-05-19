"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useClientPagination } from "@/hooks/use-client-pagination";
import { applicationService } from "@/services/application.service";
import { jobService } from "@/services/job.service";
import { ApplicationRecruiter, ApplicationStatus, ApplicationStatusLabel, JobListItem } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PaginationBar } from "@/components/ui/pagination-bar";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Check, Clock, FileText, Loader2, Search, Users, X } from "lucide-react";
import { toast } from "react-toastify";

export default function CandidatesPage() {
    const jobsPerPage = 5;
    const [searchTerm, setSearchTerm] = useState("");
    const { data: jobs, isLoading, isError } = useQuery({
        queryKey: ["recruiter-jobs-for-candidates"],
        queryFn: () => jobService.getJobsByRecruiter(),
    });

    const filteredJobs = useMemo(() => {
        const keyword = searchTerm.trim().toLowerCase();
        if (!keyword) {
            return jobs || [];
        }

        return (jobs || []).filter((job) =>
            [job.Title, job.Address, ...job.Categories]
                .filter(Boolean)
                .some((value) => value.toLowerCase().includes(keyword)),
        );
    }, [jobs, searchTerm]);

    const {
        currentPage,
        totalPages,
        paginatedItems: paginatedJobs,
        setCurrentPage,
    } = useClientPagination({
        items: filteredJobs,
        itemsPerPage: jobsPerPage,
        resetKey: `${searchTerm}|${jobs?.length || 0}`,
    });

    if (isLoading) {
        return (
            <div className="mx-auto max-w-[1000px] space-y-4">
                {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-[100px] rounded-xl" />)}
            </div>
        );
    }

    if (isError) {
        return (
            <div className="mx-auto max-w-[1000px]">
                <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card py-20 text-center">
                    <Users size={48} className="mb-4 text-muted-foreground" />
                    <p className="text-lg font-medium text-foreground">Không thể tải danh sách ứng viên</p>
                    <p className="mt-2 max-w-md text-sm text-muted-foreground">
                        Kiểm tra kết nối tới `job-service` hoặc `application-service`, rồi thử tải lại trang.
                    </p>
                </div>
            </div>
        );
    }

    if (!jobs || jobs.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <Users size={48} className="mb-4 text-muted-foreground" />
                <p className="text-lg font-medium text-muted-foreground">Hiện tại bạn chưa có bài đăng tuyển dụng nào</p>
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-[1000px] space-y-4">
            <div className="space-y-3">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        value={searchTerm}
                        onChange={(event) => setSearchTerm(event.target.value)}
                        className="h-10 border-border bg-card pl-10 shadow-sm"
                        placeholder="Tìm theo tên job, địa điểm hoặc danh mục"
                    />
                </div>
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>Hiển thị {filteredJobs.length}/{jobs.length} bài đăng</span>
                    {searchTerm && (
                        <button
                            type="button"
                            className="font-medium text-primary hover:underline"
                            onClick={() => setSearchTerm("")}
                        >
                            Xóa tìm kiếm
                        </button>
                    )}
                </div>
            </div>

            {filteredJobs.length > 0 && (
                <>
                    <Accordion type="multiple" className="space-y-3">
                        {paginatedJobs.map((job) => (
                            <JobApplicationItem key={job.ID} job={job} />
                        ))}
                    </Accordion>

                    <PaginationBar
                        currentPage={currentPage}
                        totalPages={totalPages}
                        totalItems={filteredJobs.length}
                        itemsPerPage={jobsPerPage}
                        itemLabel="bài đăng"
                        onPageChange={setCurrentPage}
                    />
                </>
            )}

            {filteredJobs.length === 0 && (
                <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card py-16 text-center">
                    <Users size={42} className="mb-4 text-muted-foreground" />
                    <p className="text-lg font-medium text-foreground">Không có bài đăng phù hợp</p>
                    <p className="mt-2 text-sm text-muted-foreground">
                        Thử thay đổi từ khóa để xem các job khác.
                    </p>
                </div>
            )}
        </div>
    );
}

function JobApplicationItem({ job }: { job: JobListItem }) {
    const { data: applications, isLoading } = useQuery({
        queryKey: ["job-applications", job.ID],
        queryFn: () => applicationService.getApplicationsByJob(job.ID),
    });

    const pendingCount = applications?.filter((application) => application.Status === ApplicationStatus.PENDING).length || 0;
    const acceptedCount = applications?.filter((application) => application.Status === ApplicationStatus.ACCEPTED).length || 0;

    return (
        <AccordionItem value={job.ID} className="rounded-xl border border-border bg-card shadow-sm">
            <AccordionTrigger className="px-5 py-4 hover:no-underline [&[data-state=open]]:pb-2">
                <div className="flex flex-1 flex-col items-start gap-2 text-left">
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-foreground">{job.Title}</span>
                        {pendingCount > 0 && (
                            <Badge className="bg-red-50 text-red-600 text-[10px]">
                                {pendingCount} mới
                            </Badge>
                        )}
                    </div>
                    <span className="text-xs text-muted-foreground">
                        {formatDate(job.PostedAt)} - {formatDate(job.ExpiredAt)}
                    </span>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                            <Users size={14} />
                            {applications?.length || 0} đơn ứng tuyển
                        </span>
                        <span className="rounded-full bg-green-50 px-2 py-1 text-green-700">
                            Đã duyệt {acceptedCount}/{job.Vacancies}
                        </span>
                    </div>
                </div>
            </AccordionTrigger>

            <AccordionContent className="px-5 pb-4">
                {isLoading ? (
                    <div className="space-y-2">
                        {[...Array(2)].map((_, i) => <Skeleton key={i} className="h-[96px] rounded-lg" />)}
                    </div>
                ) : !applications || applications.length === 0 ? (
                    <p className="py-4 text-center text-sm text-muted-foreground">Chưa có ứng viên nào ứng tuyển</p>
                ) : (
                    <div className="space-y-3">
                        {applications.map((application) => (
                            <CandidateCard
                                key={application.ID}
                                application={application}
                                jobId={job.ID}
                                reachedVacancy={acceptedCount >= job.Vacancies}
                            />
                        ))}
                    </div>
                )}
            </AccordionContent>
        </AccordionItem>
    );
}

function CandidateCard({
    application,
    jobId,
    reachedVacancy,
}: {
    application: ApplicationRecruiter;
    jobId: string;
    reachedVacancy: boolean;
}) {
    const queryClient = useQueryClient();
    const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
    const [rejectReason, setRejectReason] = useState("");

    const acceptMutation = useMutation({
        mutationFn: () => applicationService.acceptApplications([application.ID]),
        onSuccess: () => {
            toast.success("Đã duyệt ứng viên");
            queryClient.invalidateQueries({ queryKey: ["job-applications", jobId] });
        },
        onError: () => toast.error("Không thể duyệt ứng viên"),
    });

    const rejectMutation = useMutation({
        mutationFn: () => applicationService.rejectApplication(application.ID, rejectReason.trim() || undefined),
        onSuccess: () => {
            toast.success("Đã từ chối ứng viên");
            setRejectDialogOpen(false);
            setRejectReason("");
            queryClient.invalidateQueries({ queryKey: ["job-applications", jobId] });
        },
        onError: () => toast.error("Không thể từ chối ứng viên"),
    });

    const isPending = application.Status === ApplicationStatus.PENDING;
    const canAccept = isPending && !reachedVacancy;

    return (
        <>
            <Card className={`border-l-4 p-0 ${getCardBorder(application.Status)}`}>
                <div className="flex flex-col gap-4 p-4 md:flex-row md:items-center">
                    <div className="flex min-w-0 flex-1 items-center gap-4">
                        <Avatar className="h-11 w-11">
                            <AvatarImage src={application.Candidate.AvatarUrl || undefined} />
                            <AvatarFallback className="bg-primary/10 text-primary">
                                {application.Candidate.FullName.charAt(0) || "U"}
                            </AvatarFallback>
                        </Avatar>

                        <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                                <p className="truncate text-sm font-semibold text-foreground">
                                    {application.Candidate.FullName}
                                </p>
                                <Badge variant="outline" className={getStatusBadge(application.Status)}>
                                    {ApplicationStatusLabel[application.Status as ApplicationStatus] || application.Status}
                                </Badge>
                            </div>
                            <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1">
                                    <Clock size={12} />
                                    Ứng tuyển lúc {formatDateTime(application.AppliedAt)}
                                </span>
                                {application.ResumeUrl ? (
                                    <a
                                        href={application.ResumeUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1 text-primary hover:underline"
                                    >
                                        <FileText size={12} />
                                        Xem CV
                                    </a>
                                ) : (
                                    <span className="text-muted-foreground">Chưa có CV đính kèm</span>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <Button
                            type="button"
                            size="sm"
                            className="bg-green-600 hover:bg-green-700"
                            disabled={!canAccept || acceptMutation.isPending}
                            onClick={() => acceptMutation.mutate()}
                        >
                            {acceptMutation.isPending ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Check size={14} className="mr-1.5" />}
                            Duyệt
                        </Button>
                        <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                            disabled={!isPending || rejectMutation.isPending}
                            onClick={() => setRejectDialogOpen(true)}
                        >
                            <X size={14} className="mr-1.5" />
                            Từ chối
                        </Button>
                    </div>
                </div>
            </Card>

            <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Từ chối ứng viên</DialogTitle>
                        <DialogDescription>
                            Bạn có thể nhập lý do để lưu cùng kết quả xử lý hồ sơ.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-2">
                        <Label htmlFor={`reject-reason-${application.ID}`}>Lý do từ chối</Label>
                        <Textarea
                            id={`reject-reason-${application.ID}`}
                            rows={4}
                            value={rejectReason}
                            onChange={(event) => setRejectReason(event.target.value)}
                            placeholder="Ví dụ: Hồ sơ chưa phù hợp với yêu cầu hiện tại"
                        />
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setRejectDialogOpen(false)}>
                            Hủy
                        </Button>
                        <Button
                            type="button"
                            variant="destructive"
                            disabled={rejectMutation.isPending}
                            onClick={() => rejectMutation.mutate()}
                        >
                            {rejectMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Xác nhận từ chối
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}

function getCardBorder(status: string) {
    switch (status) {
        case ApplicationStatus.ACCEPTED:
            return "border-l-green-500";
        case ApplicationStatus.REJECTED:
            return "border-l-red-500";
        default:
            return "border-l-blue-200";
    }
}

function getStatusBadge(status: string) {
    switch (status) {
        case ApplicationStatus.ACCEPTED:
            return "border-green-200 bg-green-50 text-green-700";
        case ApplicationStatus.REJECTED:
            return "border-red-200 bg-red-50 text-red-700";
        default:
            return "border-amber-200 bg-amber-50 text-amber-700";
    }
}

function formatDate(dateStr: string) {
    const date = new Date(dateStr);
    return `${date.getDate().toString().padStart(2, "0")}/${(date.getMonth() + 1).toString().padStart(2, "0")}/${date.getFullYear()}`;
}

function formatDateTime(dateStr: string) {
    const date = new Date(dateStr);
    return `${formatDate(dateStr)} ${date.getHours().toString().padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}`;
}
