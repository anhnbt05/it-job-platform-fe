"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminService } from "@/services/admin.service";
import { AdminUser, AdminUserStatus, AdminUserStatusLabel, UserRole, UserRoleLabel } from "@/types";
import { useAuthStore } from "@/store/useAuthStore";
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
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Eye, Loader2, Lock, Search, ShieldCheck, Unlock } from "lucide-react";
import { toast } from "react-toastify";

type RoleFilter = UserRole | "all";
type StatusFilter = AdminUserStatus | "all";
type VerificationFilter = "all" | "verified" | "unverified";

export default function AdminUsersPage() {
    const queryClient = useQueryClient();
    const { userId } = useAuthStore();
    const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");
    const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
    const [verificationFilter, setVerificationFilter] = useState<VerificationFilter>("all");
    const [searchTerm, setSearchTerm] = useState("");
    const [detailUserId, setDetailUserId] = useState<string | null>(null);
    const [statusDialog, setStatusDialog] = useState<{
        user: AdminUser | null;
        nextStatus: AdminUserStatus | null;
        reason: string;
    }>({
        user: null,
        nextStatus: null,
        reason: "",
    });

    const { data: users = [], isLoading } = useQuery({
        queryKey: ["admin-users", roleFilter],
        queryFn: () => adminService.getUsers(roleFilter === "all" ? undefined : roleFilter),
    });

    const detailQuery = useQuery({
        queryKey: ["admin-user-detail", detailUserId],
        queryFn: () => adminService.getUserDetail(detailUserId || ""),
        enabled: !!detailUserId,
    });

    const updateStatusMutation = useMutation({
        mutationFn: () =>
            adminService.updateUserStatus(statusDialog.user!.ID, {
                status: statusDialog.nextStatus!,
                reason: statusDialog.reason.trim() || undefined,
            }),
        onSuccess: () => {
            toast.success("Đã cập nhật trạng thái người dùng");
            setStatusDialog({ user: null, nextStatus: null, reason: "" });
            queryClient.invalidateQueries({ queryKey: ["admin-users"] });
            queryClient.invalidateQueries({ queryKey: ["admin-user-detail"] });
        },
        onError: () => toast.error("Không thể cập nhật trạng thái người dùng"),
    });

    const stats = useMemo(() => ({
        total: users.length,
        active: users.filter((user) => user.Status === "active").length,
        inactive: users.filter((user) => user.Status === "inactive").length,
        recruiters: users.filter((user) => user.Role === "recruiter").length,
    }), [users]);

    const filteredUsers = useMemo(() => {
        const keyword = searchTerm.trim().toLowerCase();

        return users.filter((user) => {
            if (statusFilter !== "all" && user.Status !== statusFilter) {
                return false;
            }

            if (verificationFilter === "verified" && !user.IsEmailVerified) {
                return false;
            }

            if (verificationFilter === "unverified" && user.IsEmailVerified) {
                return false;
            }

            if (!keyword) {
                return true;
            }

            return [
                user.Email,
                user.FullName,
                user.PhoneNumber,
                user.CompanyName,
                user.BranchName,
                user.RecruiterDepartment,
                user.CandidateHeadline,
                user.CandidateLevel,
            ]
                .filter(Boolean)
                .some((value) => value!.toLowerCase().includes(keyword));
        });
    }, [searchTerm, statusFilter, users, verificationFilter]);

    return (
        <div className="mx-auto max-w-[1160px] space-y-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Quản lý người dùng</h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Theo dõi tài khoản trong hệ thống, xem nhanh chi tiết và khóa hoặc mở lại quyền truy cập.
                    </p>
                </div>
                <div className="w-full lg:max-w-[220px]">
                    <Label>Lọc theo vai trò</Label>
                    <Select value={roleFilter} onValueChange={(value) => setRoleFilter(value as RoleFilter)}>
                        <SelectTrigger className="mt-2 bg-card">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Tất cả vai trò</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                            <SelectItem value="recruiter">Recruiter</SelectItem>
                            <SelectItem value="candidate">Candidate</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <StatCard label="Tổng tài khoản" value={stats.total} tone="blue" />
                <StatCard label="Đang hoạt động" value={stats.active} tone="green" />
                <StatCard label="Đã khóa" value={stats.inactive} tone="red" />
                <StatCard label="Recruiter" value={stats.recruiters} tone="amber" />
            </div>

            <Card className="border-border shadow-sm">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                        <ShieldCheck size={18} className="text-primary" />
                        Danh sách tài khoản
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="mb-5 grid gap-3 xl:grid-cols-[1.2fr_220px_220px]">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                value={searchTerm}
                                onChange={(event) => setSearchTerm(event.target.value)}
                                placeholder="Tìm theo email, tên, công ty, chi nhánh, số điện thoại"
                                className="pl-10"
                            />
                        </div>

                        <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as StatusFilter)}>
                            <SelectTrigger className="bg-card">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Mọi trạng thái</SelectItem>
                                <SelectItem value="active">Đang hoạt động</SelectItem>
                                <SelectItem value="inactive">Đã khóa</SelectItem>
                            </SelectContent>
                        </Select>

                        <Select value={verificationFilter} onValueChange={(value) => setVerificationFilter(value as VerificationFilter)}>
                            <SelectTrigger className="bg-card">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Mọi xác thực</SelectItem>
                                <SelectItem value="verified">Đã xác thực</SelectItem>
                                <SelectItem value="unverified">Chưa xác thực</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="mb-4 flex items-center justify-between text-sm text-muted-foreground">
                        <span>
                            {isLoading ? "Đang tải người dùng..." : `Hiển thị ${filteredUsers.length}/${users.length} tài khoản`}
                        </span>
                        {(searchTerm || statusFilter !== "all" || verificationFilter !== "all" || roleFilter !== "all") && (
                            <button
                                type="button"
                                className="font-medium text-primary hover:underline"
                                onClick={() => {
                                    setSearchTerm("");
                                    setStatusFilter("all");
                                    setVerificationFilter("all");
                                    setRoleFilter("all");
                                }}
                            >
                                Xóa bộ lọc
                            </button>
                        )}
                    </div>

                    {isLoading ? (
                        <div className="space-y-3">
                            {[...Array(5)].map((_, index) => (
                                <Skeleton key={index} className="h-14 rounded-lg" />
                            ))}
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Vai trò</TableHead>
                                    <TableHead>Trạng thái</TableHead>
                                    <TableHead>Xác thực</TableHead>
                                    <TableHead>Tóm tắt</TableHead>
                                    <TableHead>Ngày tạo</TableHead>
                                    <TableHead className="text-right">Thao tác</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredUsers.map((user) => (
                                    <TableRow key={user.ID}>
                                        <TableCell className="font-medium text-foreground">{user.Email}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline">{UserRoleLabel[user.Role]}</Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Badge className={user.Status === "active" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}>
                                                {AdminUserStatusLabel[user.Status]}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <span className={user.IsEmailVerified ? "text-green-600" : "text-amber-600"}>
                                                {user.IsEmailVerified ? "Đã xác thực" : "Chưa xác thực"}
                                            </span>
                                        </TableCell>
                                        <TableCell className="max-w-[220px] truncate text-muted-foreground">
                                            {user.Role === "recruiter"
                                                ? [user.RecruiterDepartment, user.CompanyName].filter(Boolean).join(" • ") || "Chưa có dữ liệu"
                                                : user.Role === "candidate"
                                                    ? [user.CandidateHeadline, user.CandidateLevel].filter(Boolean).join(" • ") || "Chưa có dữ liệu"
                                                    : "Tài khoản quản trị"}
                                        </TableCell>
                                        <TableCell>{formatDate(user.CreatedAt)}</TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button type="button" size="sm" variant="outline" onClick={() => setDetailUserId(user.ID)}>
                                                    <Eye size={14} className="mr-1.5" />
                                                    Xem
                                                </Button>
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    variant="outline"
                                                    disabled={user.ID === userId}
                                                    className={user.Status === "active" ? "border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700" : "border-green-200 text-green-700 hover:bg-green-50"}
                                                    onClick={() =>
                                                        setStatusDialog({
                                                            user,
                                                            nextStatus: user.Status === "active" ? "inactive" : "active",
                                                            reason: "",
                                                        })
                                                    }
                                                >
                                                    {user.Status === "active" ? <Lock size={14} className="mr-1.5" /> : <Unlock size={14} className="mr-1.5" />}
                                                    {user.Status === "active" ? "Khóa" : "Mở khóa"}
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {filteredUsers.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                                            Không có tài khoản nào phù hợp bộ lọc hiện tại.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Dialog open={!!detailUserId} onOpenChange={(open) => !open && setDetailUserId(null)}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Chi tiết người dùng</DialogTitle>
                        <DialogDescription>Thông tin profile và metadata tài khoản lấy từ identity-service.</DialogDescription>
                    </DialogHeader>
                    {detailQuery.isLoading ? (
                        <div className="space-y-3">
                            {[...Array(4)].map((_, index) => <Skeleton key={index} className="h-16 rounded-lg" />)}
                        </div>
                    ) : detailQuery.data ? (
                        <div className="grid gap-4 md:grid-cols-2">
                            <InfoItem label="Họ tên" value={detailQuery.data.FullName || "Chưa cập nhật"} />
                            <InfoItem label="Email" value={detailQuery.data.Email} />
                            <InfoItem label="Vai trò" value={UserRoleLabel[detailQuery.data.Role]} />
                            <InfoItem label="Trạng thái" value={AdminUserStatusLabel[detailQuery.data.Status]} />
                            <InfoItem label="Số điện thoại" value={detailQuery.data.PhoneNumber || "Chưa cập nhật"} />
                            <InfoItem label="Xác thực email" value={detailQuery.data.IsEmailVerified ? "Đã xác thực" : "Chưa xác thực"} />
                            <InfoItem label="Candidate level" value={detailQuery.data.CandidateLevel || "Không áp dụng"} />
                            <InfoItem label="Recruiter department" value={detailQuery.data.RecruiterDepartment || "Không áp dụng"} />
                            <InfoItem label="Công ty" value={detailQuery.data.CompanyName || "Không áp dụng"} />
                            <InfoItem label="Chi nhánh" value={detailQuery.data.BranchName || "Không áp dụng"} />
                            <div className="md:col-span-2">
                                <InfoItem label="Bio" value={detailQuery.data.Bio || "Chưa cập nhật"} />
                            </div>
                        </div>
                    ) : (
                        <p className="text-sm text-muted-foreground">Không thể tải chi tiết người dùng.</p>
                    )}
                </DialogContent>
            </Dialog>

            <Dialog
                open={!!statusDialog.user && !!statusDialog.nextStatus}
                onOpenChange={(open) => !open && setStatusDialog({ user: null, nextStatus: null, reason: "" })}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {statusDialog.nextStatus === "inactive" ? "Khóa tài khoản" : "Mở khóa tài khoản"}
                        </DialogTitle>
                        <DialogDescription>
                            {statusDialog.user?.Email}
                        </DialogDescription>
                    </DialogHeader>

                    {statusDialog.nextStatus === "inactive" && (
                        <div className="space-y-2">
                            <Label>Lý do khóa</Label>
                            <Textarea
                                rows={4}
                                value={statusDialog.reason}
                                onChange={(event) => setStatusDialog((current) => ({ ...current, reason: event.target.value }))}
                                placeholder="Nhập lý do khóa tài khoản"
                            />
                        </div>
                    )}

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setStatusDialog({ user: null, nextStatus: null, reason: "" })}
                        >
                            Hủy
                        </Button>
                        <Button
                            type="button"
                            disabled={updateStatusMutation.isPending}
                            className={statusDialog.nextStatus === "inactive" ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"}
                            onClick={() => updateStatusMutation.mutate()}
                        >
                            {updateStatusMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Xác nhận
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

function StatCard({ label, value, tone }: { label: string; value: number; tone: "blue" | "green" | "red" | "amber" }) {
    const colorMap = {
        blue: "bg-primary/5 text-primary",
        green: "bg-green-50 text-green-700",
        red: "bg-red-50 text-red-700",
        amber: "bg-amber-50 text-amber-700",
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

function InfoItem({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-xl border border-border p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
            <p className="mt-2 text-sm font-medium text-foreground">{value}</p>
        </div>
    );
}

function formatDate(dateString: string) {
    if (!dateString) {
        return "--";
    }

    const date = new Date(dateString);
    return `${date.getDate().toString().padStart(2, "0")}/${(date.getMonth() + 1).toString().padStart(2, "0")}/${date.getFullYear()}`;
}
