"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { applicationService } from "@/services/application.service";
import { Application, ApplicationStatus, ApplicationStatusLabel } from "@/types";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
    Search,
    Building2,
    Calendar,
    MapPin,
    DollarSign,
    FileText,
    X,
    Loader2,
    ChevronRight,
} from "lucide-react";
import { toast } from "react-toastify";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";

export default function AppliedJobsPage() {
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
    const [selectedAppId, setSelectedAppId] = useState<string | null>(null);
    const queryClient = useQueryClient();

    const { data: applications, isLoading } = useQuery({
        queryKey: ["applied-jobs"],
        queryFn: async () => {
            const res = await applicationService.getAppliedJobs();
            return res as unknown as Application[];
        },
    });

    const cancelMutation = useMutation({
        mutationFn: (appId: string) => applicationService.deleteApplication(appId),
        onSuccess: () => {
            toast.success("Đã huỷ đơn ứng tuyển");
            queryClient.invalidateQueries({ queryKey: ["applied-jobs"] });
            setCancelDialogOpen(false);
        },
        onError: () => toast.error("Có lỗi xảy ra"),
    });

    const filteredApps = applications?.filter((app) => {
        if (statusFilter !== "all" && app.Status !== statusFilter) return false;
        if (searchQuery.trim() && !app.Job?.Title?.toLowerCase().includes(searchQuery.toLowerCase())) return false;
        return true;
    });

    const getStatusColor = (status: string) => {
        switch (status) {
            case "accepted": return "bg-green-50 text-green-700 border-green-200";
            case "rejected": return "bg-red-50 text-red-700 border-red-200";
            default: return "bg-amber-50 text-amber-700 border-amber-200";
        }
    };

    const formatDate = (dateStr: string) => {
        const d = new Date(dateStr);
        return `${d.getDate().toString().padStart(2, "0")}/${(d.getMonth() + 1).toString().padStart(2, "0")}/${d.getFullYear()}`;
    };

    return (
        <div className="mx-auto max-w-[1100px]">
            {/* Search & Filter */}
            <div className="mb-6 flex items-center gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                    <Input
                        placeholder="Tìm kiếm theo tên công việc..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="h-12 bg-white pl-12 shadow-sm border-gray-200"
                    />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="h-12 w-[200px] bg-white shadow-sm border-gray-200">
                        <SelectValue placeholder="Trạng thái" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Tất cả</SelectItem>
                        {Object.entries(ApplicationStatusLabel).map(([key, label]) => (
                            <SelectItem key={key} value={key}>{label}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Stats */}
            <div className="mb-6 grid grid-cols-4 gap-4">
                {[
                    { label: "Tổng cộng", count: applications?.length || 0, color: "bg-blue-50 text-blue-700" },
                    { label: "Đang chờ", count: applications?.filter(a => a.Status === "pending").length || 0, color: "bg-amber-50 text-amber-700" },
                    { label: "Chấp nhận", count: applications?.filter(a => a.Status === "accepted").length || 0, color: "bg-green-50 text-green-700" },
                    { label: "Từ chối", count: applications?.filter(a => a.Status === "rejected").length || 0, color: "bg-red-50 text-red-700" },
                ].map((stat) => (
                    <Card key={stat.label} className="border-gray-100 p-4 shadow-sm">
                        <p className="text-sm text-gray-500">{stat.label}</p>
                        <p className={`mt-1 text-2xl font-bold ${stat.color.split(" ")[1]}`}>{stat.count}</p>
                    </Card>
                ))}
            </div>

            {/* List */}
            {isLoading ? (
                <div className="space-y-4">
                    {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-[120px] rounded-xl" />)}
                </div>
            ) : (
                <div className="space-y-3">
                    {filteredApps?.map((app) => (
                        <Card key={app.ID} className="group border-gray-100 p-0 shadow-sm transition-all hover:shadow-md">
                            <div className="flex items-center gap-5 p-5">
                                {/* Status indicator */}
                                <div className={`h-full w-1 self-stretch rounded-full ${app.Status === "accepted" ? "bg-green-500" : app.Status === "rejected" ? "bg-red-500" : "bg-amber-400"}`} />

                                {/* Logo */}
                                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-gray-50 border border-gray-100">
                                    {app.Job?.Recruiter?.Company?.LogoUrl ? (
                                        <img src={app.Job.Recruiter.Company.LogoUrl} alt="" className="h-8 w-8 rounded-lg object-cover" />
                                    ) : (
                                        <Building2 size={20} className="text-gray-400" />
                                    )}
                                </div>

                                {/* Content */}
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-3">
                                        <Link href={`/candidate/jobs/${app.Job?.ID}`} className="text-base font-semibold text-gray-900 hover:text-[#194d8e] line-clamp-1">
                                            {app.Job?.Title}
                                        </Link>
                                        <Badge variant="outline" className={getStatusColor(app.Status)}>
                                            {ApplicationStatusLabel[app.Status as ApplicationStatus] || app.Status}
                                        </Badge>
                                    </div>
                                    <p className="mt-0.5 text-sm text-gray-500">{app.Job?.Recruiter?.Company?.Name}</p>
                                    <div className="mt-2 flex items-center gap-4 text-xs text-gray-400">
                                        <span className="flex items-center gap-1"><Calendar size={12} /> Ứng tuyển: {formatDate(app.AppliedAt)}</span>
                                        <span className="flex items-center gap-1"><DollarSign size={12} /> {app.Job?.Salary}</span>
                                        <span className="flex items-center gap-1"><MapPin size={12} /> {app.Job?.Address}</span>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-2">
                                    {app.Status === "pending" && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="text-red-500 hover:bg-red-50 hover:text-red-600"
                                            onClick={() => { setSelectedAppId(app.ID); setCancelDialogOpen(true); }}
                                        >
                                            <X size={16} className="mr-1" /> Huỷ
                                        </Button>
                                    )}
                                    <Link href={`/candidate/jobs/${app.Job?.ID}`}>
                                        <Button variant="ghost" size="icon" className="text-gray-400 group-hover:text-[#194d8e]">
                                            <ChevronRight size={18} />
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                        </Card>
                    ))}

                    {filteredApps?.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-20">
                            <FileText size={48} className="mb-4 text-gray-300" />
                            <p className="text-lg font-medium text-gray-500">Chưa có đơn ứng tuyển nào</p>
                        </div>
                    )}
                </div>
            )}

            {/* Cancel Dialog */}
            <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Xác nhận huỷ đơn</DialogTitle>
                        <DialogDescription>Bạn có chắc muốn huỷ đơn ứng tuyển này? Hành động này không thể hoàn tác.</DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setCancelDialogOpen(false)}>Đóng</Button>
                        <Button variant="destructive" disabled={cancelMutation.isPending} onClick={() => selectedAppId && cancelMutation.mutate(selectedAppId)}>
                            {cancelMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Huỷ đơn
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
