"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useClientPagination } from "@/hooks/use-client-pagination";
import { jobService } from "@/services/job.service";
import { JobDetail, JobListItem, JobType, JobTypeLabel, Level, LevelLabel } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Briefcase, CheckCircle2, Clock3, Eye, Loader2, MapPin, Search, XCircle } from "lucide-react";
import { toast } from "react-toastify";

type ExpiryFilter = "all" | "expiring_7d" | "expiring_30d" | "over_30d";

export default function AdminJobsReviewPage() {
    const queryClient = useQueryClient();
    const jobsPerPage = 6;
    const [detailJobId, setDetailJobId] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [typeFilter, setTypeFilter] = useState<JobType | "all">("all");
    const [levelFilter, setLevelFilter] = useState<Level | "all">("all");
    const [expiryFilter, setExpiryFilter] = useState<ExpiryFilter>("all");
    const [rejectState, setRejectState] = useState<{ jobId: string | null; reason: string }>({
        jobId: null,
        reason: "",
    });

    const { data: jobs = [], isLoading } = useQuery({
        queryKey: ["admin-pending-jobs"],
        queryFn: async () => {
            const response = await jobService.getJobs();
            return response as JobListItem[];
        },
    });

    const detailQuery = useQuery({
        queryKey: ["admin-job-detail", detailJobId],
        queryFn: () => jobService.getJobById(detailJobId || ""),
        enabled: !!detailJobId,
    });

    const approveMutation = useMutation({
        mutationFn: (jobId: string) => jobService.approveJob(jobId),
        onSuccess: () => {
            toast.success("Đã duyệt tin tuyển dụng");
            queryClient.invalidateQueries({ queryKey: ["admin-pending-jobs"] });
            queryClient.invalidateQueries({ queryKey: ["admin-dashboard-summary"] });
            setDetailJobId(null);
        },
        onError: () => toast.error("Không thể duyệt tin tuyển dụng"),
    });

    const rejectMutation = useMutation({
        mutationFn: () => jobService.rejectJob(rejectState.jobId || "", rejectState.reason.trim() || undefined),
        onSuccess: () => {
            toast.success("Đã từ chối tin tuyển dụng");
            queryClient.invalidateQueries({ queryKey: ["admin-pending-jobs"] });
            queryClient.invalidateQueries({ queryKey: ["admin-dashboard-summary"] });
            setRejectState({ jobId: null, reason: "" });
            if (detailJobId) {
                setDetailJobId(null);
            }
        },
        onError: () => toast.error("Không thể từ chối tin tuyển dụng"),
    });

    const pendingJobs = jobs.filter((job) => job.Status === "pending");

    const filteredPendingJobs = useMemo(() => {
        const keyword = searchTerm.trim().toLowerCase();

        return pendingJobs.filter((job) => {
            if (typeFilter !== "all" && job.Type !== typeFilter) {
                return false;
            }

            if (levelFilter !== "all" && job.Level !== levelFilter) {
                return false;
            }

            const remainingDays = daysUntil(job.ExpiredAt);
            if (expiryFilter === "expiring_7d" && remainingDays > 7) {
                return false;
            }

            if (expiryFilter === "expiring_30d" && remainingDays > 30) {
                return false;
            }

            if (expiryFilter === "over_30d" && remainingDays <= 30) {
                return false;
            }

            if (!keyword) {
                return true;
            }

            return [
                job.Title,
                job.Address,
                job.Description,
                job.Salary,
                ...job.Categories,
            ]
                .filter((value): value is string => typeof value === "string" && value.length > 0)
                .some((value) => value.toLowerCase().includes(keyword));
        });
    }, [expiryFilter, levelFilter, pendingJobs, searchTerm, typeFilter]);

    const {
        currentPage,
        totalPages,
        paginatedItems: paginatedPendingJobs,
        setCurrentPage,
    } = useClientPagination({
        items: filteredPendingJobs,
        itemsPerPage: jobsPerPage,
        resetKey: `${searchTerm}|${typeFilter}|${levelFilter}|${expiryFilter}|${pendingJobs.length}`,
    });

    return (
        <div className="mx-auto max-w-[1100px] space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-foreground">Duyệt tin tuyển dụng</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                    Danh sách bên dưới là các tin đang chờ duyệt từ recruiter.
                </p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <StatCard label="Tin chờ duyệt" value={pendingJobs.length} tone="amber" />
                <StatCard label="Tổng công việc tải về" value={jobs.length} tone="blue" />
                <StatCard
                    label="Sắp hết hạn trong 7 ngày"
                    value={pendingJobs.filter((job) => daysUntil(job.ExpiredAt) <= 7).length}
                    tone="red"
                />
            </div>

            <Card className="border-border shadow-sm">
                <CardContent className="space-y-4 p-5">
                    <div className="grid gap-3 xl:grid-cols-[1.1fr_220px_220px_220px]">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                value={searchTerm}
                                onChange={(event) => setSearchTerm(event.target.value)}
                                className="pl-10"
                                placeholder="Tìm theo tiêu đề, địa điểm, mô tả, danh mục, lương"
                            />
                        </div>

                        <Select value={typeFilter} onValueChange={(value) => setTypeFilter(value as JobType | "all")}>
                            <SelectTrigger className="bg-card">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Mọi hình thức</SelectItem>
                                {Object.entries(JobTypeLabel).map(([value, label]) => (
                                    <SelectItem key={value} value={value}>{label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Select value={levelFilter} onValueChange={(value) => setLevelFilter(value as Level | "all")}>
                            <SelectTrigger className="bg-card">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Mọi cấp độ</SelectItem>
                                {Object.entries(LevelLabel).map(([value, label]) => (
                                    <SelectItem key={value} value={value}>{label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Select value={expiryFilter} onValueChange={(value) => setExpiryFilter(value as ExpiryFilter)}>
                            <SelectTrigger className="bg-card">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Mọi hạn nộp</SelectItem>
                                <SelectItem value="expiring_7d">Trong 7 ngày</SelectItem>
                                <SelectItem value="expiring_30d">Trong 30 ngày</SelectItem>
                                <SelectItem value="over_30d">Trên 30 ngày</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span>
                            {isLoading
                                ? "Đang tải job..."
                                : `Hiển thị ${filteredPendingJobs.length}/${pendingJobs.length} tin chờ duyệt`}
                        </span>
                        {(searchTerm || typeFilter !== "all" || levelFilter !== "all" || expiryFilter !== "all") && (
                            <button
                                type="button"
                                className="font-medium text-primary hover:underline"
                                onClick={() => {
                                    setSearchTerm("");
                                    setTypeFilter("all");
                                    setLevelFilter("all");
                                    setExpiryFilter("all");
                                }}
                            >
                                Xóa bộ lọc
                            </button>
                        )}
                    </div>
                </CardContent>
            </Card>

            {isLoading ? (
                <div className="space-y-4">
                    {[...Array(4)].map((_, index) => <Skeleton key={index} className="h-[150px] rounded-xl" />)}
                </div>
            ) : filteredPendingJobs.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card py-20">
                    <Briefcase size={42} className="mb-4 text-muted-foreground" />
                    <p className="text-lg font-medium text-muted-foreground">
                        {pendingJobs.length === 0 ? "Không còn tin nào đang chờ duyệt" : "Không có tin nào phù hợp bộ lọc"}
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    {paginatedPendingJobs.map((job) => (
                        <Card key={job.ID} className="border-border shadow-sm">
                            <CardContent className="flex flex-col gap-4 p-5 lg:flex-row lg:items-start lg:justify-between">
                                <div className="min-w-0 flex-1">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <h3 className="text-lg font-semibold text-foreground">{job.Title}</h3>
                                        <Badge className="bg-amber-50 text-amber-700">Chờ duyệt</Badge>
                                        <Badge variant="outline">{JobTypeLabel[job.Type as JobType] || job.Type}</Badge>
                                        <Badge variant="outline">{LevelLabel[job.Level as Level] || job.Level}</Badge>
                                    </div>
                                    <div className="mt-3 flex flex-wrap gap-3 text-sm text-muted-foreground">
                                        <span className="flex items-center gap-1"><MapPin size={14} /> {job.Address}</span>
                                        <span>{job.Salary}</span>
                                        <span className="flex items-center gap-1"><Clock3 size={14} /> Hạn nộp {formatDate(job.ExpiredAt)}</span>
                                    </div>
                                    {job.Description && (
                                        <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-muted-foreground">{job.Description}</p>
                                    )}
                                    <div className="mt-3 flex flex-wrap gap-2">
                                        {job.Categories.map((category) => (
                                            <Badge key={category} variant="secondary" className="bg-muted text-muted-foreground">
                                                {category}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex flex-wrap gap-2">
                                    <Button type="button" variant="outline" onClick={() => setDetailJobId(job.ID)}>
                                        <Eye size={14} className="mr-1.5" />
                                        Xem chi tiết
                                    </Button>
                                    <Button
                                        type="button"
                                        className="bg-green-600 hover:bg-green-700"
                                        disabled={approveMutation.isPending}
                                        onClick={() => approveMutation.mutate(job.ID)}
                                    >
                                        {approveMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 size={14} className="mr-1.5" />}
                                        Duyệt
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                                        onClick={() => setRejectState({ jobId: job.ID, reason: "" })}
                                    >
                                        <XCircle size={14} className="mr-1.5" />
                                        Từ chối
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}

                    <PaginationBar
                        currentPage={currentPage}
                        totalPages={totalPages}
                        totalItems={filteredPendingJobs.length}
                        itemsPerPage={jobsPerPage}
                        itemLabel="tin chờ duyệt"
                        onPageChange={setCurrentPage}
                    />
                </div>
            )}

            <Dialog open={!!detailJobId} onOpenChange={(open) => !open && setDetailJobId(null)}>
                <DialogContent className="flex max-h-[90vh] max-w-3xl flex-col overflow-hidden">
                    <DialogHeader>
                        <DialogTitle>Chi tiết tin tuyển dụng</DialogTitle>
                        <DialogDescription>Rà soát nội dung trước khi duyệt hoặc từ chối.</DialogDescription>
                    </DialogHeader>

                    <div className="flex-1 overflow-y-auto pr-1">
                        {detailQuery.isLoading ? (
                            <div className="space-y-3">
                                {[...Array(4)].map((_, index) => <Skeleton key={index} className="h-20 rounded-lg" />)}
                            </div>
                        ) : detailQuery.data ? (
                            <JobDetailView job={detailQuery.data} />
                        ) : (
                            <p className="text-sm text-muted-foreground">Không thể tải chi tiết công việc.</p>
                        )}
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                            onClick={() => setRejectState({ jobId: detailJobId, reason: "" })}
                        >
                            <XCircle size={14} className="mr-1.5" />
                            Từ chối
                        </Button>
                        <Button
                            type="button"
                            className="bg-green-600 hover:bg-green-700"
                            disabled={approveMutation.isPending}
                            onClick={() => detailJobId && approveMutation.mutate(detailJobId)}
                        >
                            {approveMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Duyệt tin
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog
                open={!!rejectState.jobId}
                onOpenChange={(open) => !open && setRejectState({ jobId: null, reason: "" })}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Từ chối tin tuyển dụng</DialogTitle>
                        <DialogDescription>
                            Lý do này sẽ được gửi lại cho recruiter qua luồng backend hiện có.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-2">
                        <Label>Lý do từ chối</Label>
                        <Textarea
                            rows={4}
                            value={rejectState.reason}
                            onChange={(event) => setRejectState((current) => ({ ...current, reason: event.target.value }))}
                            placeholder="Ví dụ: Nội dung bài đăng chưa rõ, thiếu thông tin hoặc không đúng quy định"
                        />
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setRejectState({ jobId: null, reason: "" })}>
                            Hủy
                        </Button>
                        <Button
                            type="button"
                            className="bg-red-600 hover:bg-red-700"
                            disabled={rejectMutation.isPending}
                            onClick={() => rejectMutation.mutate()}
                        >
                            {rejectMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Xác nhận từ chối
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

function JobDetailView({ job }: { job: JobDetail }) {
    return (
        <div className="space-y-5">
            <div className="rounded-xl border border-border p-4">
                <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-lg font-semibold text-foreground">{job.Title}</h3>
                    <Badge className="bg-amber-50 text-amber-700">Chờ duyệt</Badge>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{job.Description || "Không có mô tả ngắn."}</p>
                <div className="mt-3 flex flex-wrap gap-3 text-sm text-muted-foreground">
                    <span>{job.Salary}</span>
                    <span>{job.WorkingTimes}</span>
                    <span>{job.Address}</span>
                </div>
            </div>

            <SectionList title="Mô tả công việc" items={job.JobDescriptions} />
            <SectionList title="Yêu cầu" items={job.JobRequirements} />
            <SectionList title="Quyền lợi" items={job.JobBenefits} />
        </div>
    );
}

function SectionList({ title, items }: { title: string; items: string[] }) {
    return (
        <div className="rounded-xl border border-border p-4">
            <h4 className="text-sm font-semibold text-foreground">{title}</h4>
            <ul className="mt-3 space-y-2">
                {items.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <span className="mt-2 h-1.5 w-1.5 rounded-full bg-primary" />
                        <span>{item}</span>
                    </li>
                ))}
                {items.length === 0 && <li className="text-sm text-muted-foreground">Chưa có dữ liệu</li>}
            </ul>
        </div>
    );
}

function StatCard({ label, value, tone }: { label: string; value: number; tone: "blue" | "amber" | "red" }) {
    const colorMap = {
        blue: "bg-primary/5 text-primary",
        amber: "bg-amber-50 text-amber-700",
        red: "bg-red-50 text-red-700",
    };

    return (
        <Card className="border-border shadow-sm">
            <CardContent className="p-5">
                <p className="text-sm text-muted-foreground">{label}</p>
                <div className={`mt-3 inline-flex rounded-xl px-3 py-2 ${colorMap[tone]}`}>
                    <span className="text-2xl font-bold">{value}</span>
                </div>
            </CardContent>
        </Card>
    );
}

function formatDate(dateString: string) {
    const date = new Date(dateString);
    return `${date.getDate().toString().padStart(2, "0")}/${(date.getMonth() + 1).toString().padStart(2, "0")}/${date.getFullYear()}`;
}

function daysUntil(dateString: string) {
    const now = new Date();
    const target = new Date(dateString);
    return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}
