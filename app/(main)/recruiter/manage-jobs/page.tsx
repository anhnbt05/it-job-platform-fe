"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useClientPagination } from "@/hooks/use-client-pagination";
import { jobService } from "@/services/job.service";
import { useAuthStore } from "@/store/useAuthStore";
import { JobListItem, JobStatus, JobStatusLabel, JobTypeLabel, LevelLabel, JobType, Level } from "@/types";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PaginationBar } from "@/components/ui/pagination-bar";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    Briefcase,
    Edit,
    Trash2,
    DollarSign,
    MapPin,
    Clock,
    Users,
    PlusCircle,
    Loader2,
    Search,
} from "lucide-react";
import { toast } from "react-toastify";

export default function ManageJobsPage() {
    const { userId } = useAuthStore();
    const jobsPerPage = 6;
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [deletingJobId, setDeletingJobId] = useState<string | null>(null);
    const queryClient = useQueryClient();

    const { data: jobs, isLoading, isError } = useQuery({
        queryKey: ["recruiter-jobs", userId],
        queryFn: async () => {
            const res = await jobService.getJobsByRecruiter(userId!);
            return res as unknown as JobListItem[];
        },
        enabled: !!userId,
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => jobService.deleteJob(id),
        onSuccess: () => {
            toast.success("Đã xoá bài đăng");
            queryClient.invalidateQueries({ queryKey: ["recruiter-jobs"] });
            setDeleteDialogOpen(false);
        },
        onError: () => toast.error("Có lỗi xảy ra"),
    });

    const filteredJobs = useMemo(() => (jobs || []).filter((job) => {
        if (statusFilter !== "all" && job.Status !== statusFilter) return false;

        const keyword = searchTerm.trim().toLowerCase();
        if (!keyword) return true;

        return [
            job.Title,
            job.Address,
            job.Salary,
            ...job.Categories,
        ]
            .filter(Boolean)
            .some((value) => value.toLowerCase().includes(keyword));
    }), [jobs, searchTerm, statusFilter]);

    const {
        currentPage,
        totalPages,
        paginatedItems: paginatedJobs,
        setCurrentPage,
    } = useClientPagination({
        items: filteredJobs,
        itemsPerPage: jobsPerPage,
        resetKey: `${searchTerm}|${statusFilter}|${jobs?.length || 0}`,
    });

    const getStatusColor = (status: string) => {
        switch (status) {
            case "open": return "bg-green-50 text-green-700 border-green-200";
            case "closed": return "bg-muted text-muted-foreground border-border";
            case "pending": return "bg-amber-50 text-amber-700 border-amber-200";
            case "rejected": return "bg-red-50 text-red-700 border-red-200";
            default: return "bg-muted/40 text-muted-foreground border-border";
        }
    };

    const formatDate = (dateStr: string) => {
        const d = new Date(dateStr);
        return `${d.getDate().toString().padStart(2, "0")}/${(d.getMonth() + 1).toString().padStart(2, "0")}/${d.getFullYear()}`;
    };

    return (
        <div className="mx-auto max-w-[1100px]">
            {/* Header */}
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-xl font-bold text-foreground">Quản lý bài đăng</h1>
                    <p className="text-sm text-muted-foreground">{jobs?.length || 0} bài đăng</p>
                </div>
                <Link href="/recruiter/post-job">
                    <Button className="w-full bg-primary hover:bg-primary/90 sm:w-auto">
                        <PlusCircle size={16} className="mr-2" /> Thêm tin tuyển dụng
                    </Button>
                </Link>
            </div>

            {/* Stats */}
            <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {[
                    { label: "Tổng", count: jobs?.length || 0, color: "text-blue-700" },
                    { label: "Đang mở", count: jobs?.filter(j => j.Status === "open").length || 0, color: "text-green-700" },
                    { label: "Chờ duyệt", count: jobs?.filter(j => j.Status === "pending").length || 0, color: "text-amber-700" },
                    { label: "Đã đóng", count: jobs?.filter(j => j.Status === "closed" || j.Status === "rejected").length || 0, color: "text-red-700" },
                ].map((s) => (
                    <Card key={s.label} className="border-border p-4 shadow-sm">
                        <p className="text-sm text-muted-foreground">{s.label}</p>
                        <p className={`mt-1 text-2xl font-bold ${s.color}`}>{s.count}</p>
                    </Card>
                ))}
            </div>

            {/* Filter */}
            <div className="mb-4 space-y-4">
                <div className="grid gap-3 lg:grid-cols-[1fr_220px]">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            value={searchTerm}
                            onChange={(event) => setSearchTerm(event.target.value)}
                            placeholder="Tìm theo tiêu đề, địa điểm, lương hoặc danh mục"
                            className="h-10 border-border bg-card pl-10 shadow-sm"
                        />
                    </div>

                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="h-10 w-full border-border bg-card shadow-sm sm:w-[220px]">
                            <SelectValue placeholder="Trạng thái" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Tất cả</SelectItem>
                            {Object.entries(JobStatusLabel).map(([key, label]) => (
                                <SelectItem key={key} value={key}>{label}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>
                        {isLoading ? "Đang tải bài đăng..." : `Hiển thị ${filteredJobs.length}/${jobs?.length || 0} bài đăng`}
                    </span>
                    {(searchTerm || statusFilter !== "all") && (
                        <button
                            type="button"
                            className="font-medium text-primary hover:underline"
                            onClick={() => {
                                setSearchTerm("");
                                setStatusFilter("all");
                            }}
                        >
                            Xóa bộ lọc
                        </button>
                    )}
                </div>
            </div>

            {/* Job List */}
            {isLoading ? (
                <div className="space-y-4">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-[140px] rounded-xl" />)}</div>
            ) : isError ? (
                <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card py-20 text-center">
                    <Briefcase size={48} className="mb-4 text-muted-foreground" />
                    <p className="text-lg font-medium text-foreground">Không thể tải danh sách bài đăng</p>
                    <p className="mt-2 max-w-md text-sm text-muted-foreground">
                        Kiểm tra kết nối tới `job-service` hoặc thử tải lại trang.
                    </p>
                </div>
            ) : (
                <div className="space-y-3">
                    {paginatedJobs.map((job) => (
                        <Card key={job.ID} className="border-border p-0 shadow-sm transition-all hover:shadow-md">
                            <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:gap-5">
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-3">
                                        <Link href={`/recruiter/manage-jobs/${job.ID}`} className="text-base font-semibold text-foreground hover:text-primary line-clamp-1">
                                            {job.Title}
                                        </Link>
                                        <Badge variant="outline" className={getStatusColor(job.Status)}>
                                            {JobStatusLabel[job.Status as JobStatus] || job.Status}
                                        </Badge>
                                    </div>

                                    <div className="mt-2 flex flex-wrap gap-2">
                                        <Badge variant="secondary" className="bg-primary/10 text-primary text-xs">
                                            <Briefcase size={10} className="mr-1" /> {JobTypeLabel[job.Type as JobType] || job.Type}
                                        </Badge>
                                        <Badge variant="secondary" className="bg-purple-50 text-purple-700 text-xs">
                                            {LevelLabel[job.Level as Level] || job.Level}
                                        </Badge>
                                        {job.Categories?.slice(0, 3).map((cat, idx) => (
                                            <Badge key={idx} variant="outline" className="border-border text-muted-foreground text-xs">{cat}</Badge>
                                        ))}
                                    </div>

                                    <div className="mt-2.5 flex items-center gap-4 text-xs text-muted-foreground">
                                        <span className="flex items-center gap-1"><DollarSign size={12} /> {job.Salary}</span>
                                        <span className="flex items-center gap-1"><MapPin size={12} /> {job.Address}</span>
                                        <span className="flex items-center gap-1"><Users size={12} /> {job.Vacancies} người</span>
                                        <span className="flex items-center gap-1"><Clock size={12} /> {formatDate(job.PostedAt)} - {formatDate(job.ExpiredAt)}</span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-1 self-end sm:self-auto">
                                    <Link href={`/recruiter/edit-job/${job.ID}`}>
                                        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary">
                                            <Edit size={16} />
                                        </Button>
                                    </Link>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="text-muted-foreground hover:text-red-500"
                                        onClick={() => { setDeletingJobId(job.ID); setDeleteDialogOpen(true); }}
                                    >
                                        <Trash2 size={16} />
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    ))}

                    {filteredJobs?.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-20">
                            <Briefcase size={48} className="mb-4 text-muted-foreground" />
                            <p className="text-lg font-medium text-muted-foreground">Chưa có bài đăng tuyển dụng nào</p>
                            <Link href="/recruiter/post-job" className="mt-2 text-sm text-primary hover:underline">Thêm tin tuyển dụng</Link>
                        </div>
                    )}

                    <PaginationBar
                        currentPage={currentPage}
                        totalPages={totalPages}
                        totalItems={filteredJobs.length}
                        itemsPerPage={jobsPerPage}
                        itemLabel="bài đăng"
                        onPageChange={setCurrentPage}
                    />
                </div>
            )}

            {/* Delete Dialog */}
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Xác nhận xoá</DialogTitle>
                        <DialogDescription>Bạn có chắc muốn xoá bài đăng này? Hành động này không thể hoàn tác.</DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Huỷ</Button>
                        <Button variant="destructive" disabled={deleteMutation.isPending} onClick={() => deletingJobId && deleteMutation.mutate(deletingJobId)}>
                            {deleteMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Xoá bài đăng
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
