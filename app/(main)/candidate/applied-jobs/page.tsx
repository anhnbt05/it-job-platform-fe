"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { applicationService } from "@/services/application.service";
import { Application, ApplicationStatus, ApplicationStatusLabel } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Calendar,
    ChevronRight,
    FileText,
    Loader2,
    MapPin,
    Search,
    Trash2,
} from "lucide-react";
import { toast } from "react-toastify";

export default function AppliedJobsPage() {
    const queryClient = useQueryClient();
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);

    const { data: applications = [], isLoading, isError } = useQuery({
        queryKey: ["applied-jobs"],
        queryFn: () => applicationService.getAppliedJobs(),
    });

    const deleteMutation = useMutation({
        mutationFn: (applicationId: string) => applicationService.deleteApplication(applicationId),
        onSuccess: () => {
            toast.success("Đã hủy đơn ứng tuyển");
            setSelectedApplication(null);
            queryClient.invalidateQueries({ queryKey: ["applied-jobs"] });
        },
        onError: () => toast.error("Không thể hủy đơn ứng tuyển"),
    });

    const filteredApplications = useMemo(() => {
        const keyword = searchQuery.trim().toLowerCase();

        return applications.filter((application) => {
            const title = application.Job?.Title || application.JobTitle;
            const address = application.Job?.Address || "";
            const matchesKeyword = !keyword || [title, address].some((value) =>
                value.toLowerCase().includes(keyword),
            );

            const matchesStatus = statusFilter === "all" || application.Status === statusFilter;
            return matchesKeyword && matchesStatus;
        });
    }, [applications, searchQuery, statusFilter]);

    return (
        <div className="mx-auto max-w-[1100px]">
            <div className="mb-6 flex flex-col gap-4 lg:flex-row">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        placeholder="Tìm theo tên công việc hoặc địa điểm"
                        value={searchQuery}
                        onChange={(event) => setSearchQuery(event.target.value)}
                        className="h-12 border-border bg-card pl-12 shadow-sm"
                    />
                </div>

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="h-12 w-full border-border bg-card shadow-sm sm:w-[220px]">
                        <SelectValue placeholder="Lọc trạng thái" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Tất cả trạng thái</SelectItem>
                        {Object.entries(ApplicationStatusLabel).map(([key, label]) => (
                            <SelectItem key={key} value={key}>
                                {label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div className="mb-4 flex items-center justify-between text-sm text-muted-foreground">
                <span>
                    {isLoading
                        ? "Đang tải đơn ứng tuyển..."
                        : `Hiển thị ${filteredApplications.length}/${applications.length} đơn ứng tuyển`}
                </span>
                {(searchQuery || statusFilter !== "all") && (
                    <button
                        type="button"
                        className="font-medium text-primary hover:underline"
                        onClick={() => {
                            setSearchQuery("");
                            setStatusFilter("all");
                        }}
                    >
                        Xóa bộ lọc
                    </button>
                )}
            </div>

            <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {[
                    { label: "Tổng cộng", count: applications.length, className: "text-blue-700" },
                    { label: "Đang chờ", count: applications.filter((item) => item.Status === "pending").length, className: "text-amber-700" },
                    { label: "Đã duyệt", count: applications.filter((item) => item.Status === "accepted").length, className: "text-green-700" },
                    { label: "Từ chối", count: applications.filter((item) => item.Status === "rejected").length, className: "text-red-700" },
                ].map((stat) => (
                    <Card key={stat.label} className="border-border p-4 shadow-sm">
                        <p className="text-sm text-muted-foreground">{stat.label}</p>
                        <p className={`mt-1 text-2xl font-bold ${stat.className}`}>{stat.count}</p>
                    </Card>
                ))}
            </div>

            {isLoading ? (
                <div className="space-y-4">
                    {[...Array(4)].map((_, index) => (
                        <Skeleton key={index} className="h-[140px] rounded-xl" />
                    ))}
                </div>
            ) : isError ? (
                <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card py-20 text-center">
                    <FileText size={48} className="mb-4 text-muted-foreground" />
                    <p className="text-lg font-medium text-foreground">Không thể tải danh sách ứng tuyển</p>
                    <p className="mt-2 max-w-md text-sm text-muted-foreground">
                        Thử tải lại trang hoặc kiểm tra kết nối tới `application-service`.
                    </p>
                </div>
            ) : (
                <div className="space-y-3">
                    {filteredApplications.map((application) => (
                        <ApplicationCard
                            key={application.ID}
                            application={application}
                            onCancel={() => setSelectedApplication(application)}
                        />
                    ))}

                    {filteredApplications.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-20">
                            <FileText size={48} className="mb-4 text-muted-foreground" />
                            <p className="text-lg font-medium text-muted-foreground">Chưa có đơn ứng tuyển phù hợp bộ lọc</p>
                            <Link href="/candidate/find-jobs" className="mt-2 text-sm text-primary hover:underline">
                                Tìm công việc để ứng tuyển
                            </Link>
                        </div>
                    )}
                </div>
            )}

            <Dialog open={!!selectedApplication} onOpenChange={(open) => !open && setSelectedApplication(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Hủy đơn ứng tuyển</DialogTitle>
                        <DialogDescription>
                            Bạn có chắc muốn hủy đơn ứng tuyển cho vị trí{" "}
                            <strong>{selectedApplication?.Job?.Title || selectedApplication?.JobTitle}</strong>?
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setSelectedApplication(null)}>
                            Đóng
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={() => selectedApplication && deleteMutation.mutate(selectedApplication.ID)}
                            disabled={deleteMutation.isPending}
                        >
                            {deleteMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Hủy đơn
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

function ApplicationCard({
    application,
    onCancel,
}: {
    application: Application;
    onCancel: () => void;
}) {
    const title = application.Job?.Title || application.JobTitle;
    const address = application.Job?.Address || "Địa điểm sẽ được cập nhật sau";

    return (
        <Card className="group border-border p-0 shadow-sm transition-all hover:shadow-md">
            <div className="flex items-start gap-4 p-5">
                <div className={`mt-1 h-10 w-1 rounded-full ${getStatusStripe(application.Status)}`} />

                <div className="flex-1">
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                        <div className="space-y-2">
                            <div className="flex flex-wrap items-center gap-2">
                                <Link
                                    href={`/candidate/applied-jobs/${application.ID}`}
                                    className="text-base font-semibold text-foreground hover:text-primary"
                                >
                                    {title}
                                </Link>
                                <Badge variant="outline" className={getStatusColor(application.Status)}>
                                    {ApplicationStatusLabel[application.Status as ApplicationStatus] || application.Status}
                                </Badge>
                            </div>

                            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                                <span className="flex items-center gap-1.5">
                                    <Calendar size={14} />
                                    Ứng tuyển ngày {formatDate(application.AppliedAt)}
                                </span>
                                <span className="flex items-center gap-1.5">
                                    <MapPin size={14} />
                                    {address}
                                </span>
                            </div>

                            {application.ResumeUrl && (
                                <a
                                    href={application.ResumeUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                                >
                                    <FileText size={14} />
                                    Xem CV đã nộp
                                </a>
                            )}
                        </div>

                        <div className="flex items-center gap-2">
                            {application.Status === "pending" && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="border-red-100 text-red-500 hover:bg-red-50 hover:text-red-600"
                                    onClick={onCancel}
                                >
                                    <Trash2 size={14} className="mr-1.5" />
                                    Hủy đơn
                                </Button>
                            )}
                            <Link href={`/candidate/applied-jobs/${application.ID}`}>
                                <Button variant="ghost" size="icon" className="text-muted-foreground group-hover:text-primary">
                                    <ChevronRight size={18} />
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </Card>
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

function formatDate(dateString: string) {
    if (!dateString) {
        return "Chưa cập nhật";
    }

    const date = new Date(dateString);
    return `${date.getDate().toString().padStart(2, "0")}/${(date.getMonth() + 1)
        .toString()
        .padStart(2, "0")}/${date.getFullYear()}`;
}
