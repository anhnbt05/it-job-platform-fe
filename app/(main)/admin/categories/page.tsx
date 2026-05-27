"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useClientPagination } from "@/hooks/use-client-pagination";
import { toastApiError, toastApiSuccess } from "@/lib/axios";
import { categoryService } from "@/services/category.service";
import { AdminCategory } from "@/types";
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
import { PaginationBar } from "@/components/ui/pagination-bar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FolderTree, Loader2, Pencil, Plus, Search, Tags, Trash2 } from "lucide-react";
import { toast } from "react-toastify";

type CategoryDialogState = {
    mode: "create" | "edit";
    category: AdminCategory | null;
    name: string;
};

type CategoryFilter = "all" | "updated_7d" | "stale_30d";

export default function AdminCategoriesPage() {
    const queryClient = useQueryClient();
    const categoriesPerPage = 10;
    const [dialogState, setDialogState] = useState<CategoryDialogState | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<AdminCategory | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [filter, setFilter] = useState<CategoryFilter>("all");
    const [viewTimestamp] = useState(() => Date.now());

    const { data: categories = [], isLoading } = useQuery({
        queryKey: ["admin-categories"],
        queryFn: () => categoryService.getCategories(),
    });

    const saveMutation = useMutation({
        mutationFn: async () => {
            if (!dialogState) {
                return;
            }

            const name = dialogState.name.trim();
            if (!name) {
                throw new Error("empty_name");
            }

            if (dialogState.mode === "create") {
                return categoryService.createCategory({ name });
            }

            return categoryService.updateCategory(dialogState.category!.ID, { name });
        },
        onSuccess: (response) => {
            toastApiSuccess(response);
            setDialogState(null);
            queryClient.invalidateQueries({ queryKey: ["admin-categories"] });
        },
        onError: (error) => {
            if (error instanceof Error && error.message === "empty_name") {
                toast.error("Tên danh mục không được để trống");
                return;
            }

            toastApiError(error);
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => categoryService.deleteCategory(id),
        onSuccess: (response) => {
            toastApiSuccess(response);
            setDeleteTarget(null);
            queryClient.invalidateQueries({ queryKey: ["admin-categories"] });
        },
        onError: (error) => toastApiError(error),
    });

    const stats = useMemo(() => ({
        total: categories.length,
        latest:
            [...categories]
                .sort((a, b) => new Date(b.UpdatedAt || 0).getTime() - new Date(a.UpdatedAt || 0).getTime())[0]
                ?.Name || "Chưa có",
    }), [categories]);

    const filteredCategories = useMemo(() => {
        const keyword = searchTerm.trim().toLowerCase();

        return categories
            .filter((category) => {
                const matchesKeyword = !keyword || category.Name.toLowerCase().includes(keyword);

                if (!matchesKeyword) {
                    return false;
                }

                if (filter === "all") {
                    return true;
                }

                const updatedAt = category.UpdatedAt ? new Date(category.UpdatedAt) : null;
                if (!updatedAt || Number.isNaN(updatedAt.getTime())) {
                    return filter === "stale_30d";
                }

                const diffDays = Math.floor((viewTimestamp - updatedAt.getTime()) / (1000 * 60 * 60 * 24));

                if (filter === "updated_7d") {
                    return diffDays <= 7;
                }

                return diffDays >= 30;
            })
            .sort((left, right) => {
                const rightTime = new Date(right.CreatedAt || right.UpdatedAt || 0).getTime();
                const leftTime = new Date(left.CreatedAt || left.UpdatedAt || 0).getTime();
                return rightTime - leftTime;
            });
    }, [categories, filter, searchTerm, viewTimestamp]);

    const {
        currentPage,
        totalPages,
        paginatedItems: paginatedCategories,
        setCurrentPage,
    } = useClientPagination({
        items: filteredCategories,
        itemsPerPage: categoriesPerPage,
        resetKey: `${searchTerm}|${filter}|${categories.length}`,
    });

    return (
        <div className="mx-auto max-w-[1120px] space-y-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Quản lý danh mục</h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Quản trị danh mục nghề nghiệp để recruiter gắn vào job và candidate dùng để lọc công việc.
                    </p>
                </div>
                <Button
                    type="button"
                    className="bg-primary hover:bg-primary/90"
                    onClick={() =>
                        setDialogState({
                            mode: "create",
                            category: null,
                            name: "",
                        })
                    }
                >
                    <Plus size={16} className="mr-2" />
                    Thêm danh mục
                </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                <StatCard label="Tổng danh mục" value={String(stats.total)} icon={<Tags size={18} className="text-primary" />} />
                <StatCard label="Cập nhật gần nhất" value={stats.latest} icon={<FolderTree size={18} className="text-emerald-600" />} />
            </div>

            <Card className="border-border shadow-sm">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                        <Tags size={18} className="text-primary" />
                        Danh sách danh mục
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="mb-5 grid gap-3 md:grid-cols-[1fr_220px]">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                value={searchTerm}
                                onChange={(event) => setSearchTerm(event.target.value)}
                                placeholder="Tìm theo tên danh mục"
                                className="pl-10"
                            />
                        </div>

                        <Select value={filter} onValueChange={(value) => setFilter(value as CategoryFilter)}>
                            <SelectTrigger className="bg-card">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Tất cả danh mục</SelectItem>
                                <SelectItem value="updated_7d">Cập nhật 7 ngày</SelectItem>
                                <SelectItem value="stale_30d">Chưa cập nhật 30 ngày</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="mb-4 flex items-center justify-between text-sm text-muted-foreground">
                        <span>
                            {isLoading
                                ? "Đang tải danh mục..."
                                : `Hiển thị ${filteredCategories.length}/${categories.length} danh mục`}
                        </span>
                        {(searchTerm || filter !== "all") && (
                            <button
                                type="button"
                                className="font-medium text-primary hover:underline"
                                onClick={() => {
                                    setSearchTerm("");
                                    setFilter("all");
                                }}
                            >
                                Xóa bộ lọc
                            </button>
                        )}
                    </div>

                    {isLoading ? (
                        <div className="space-y-3">
                            {[...Array(6)].map((_, index) => (
                                <Skeleton key={index} className="h-14 rounded-lg" />
                            ))}
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Tên danh mục</TableHead>
                                    <TableHead>Ngày tạo</TableHead>
                                    <TableHead>Cập nhật</TableHead>
                                    <TableHead className="text-right">Thao tác</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {paginatedCategories.map((category) => (
                                    <TableRow key={category.ID}>
                                        <TableCell>
                                            <Badge variant="secondary" className="bg-primary/5 text-primary">
                                                {category.Name}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>{formatDate(category.CreatedAt)}</TableCell>
                                        <TableCell>{formatDate(category.UpdatedAt)}</TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() =>
                                                        setDialogState({
                                                            mode: "edit",
                                                            category,
                                                            name: category.Name,
                                                        })
                                                    }
                                                >
                                                    <Pencil size={14} className="mr-1.5" />
                                                    Sửa
                                                </Button>
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    variant="outline"
                                                    className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                                                    onClick={() => setDeleteTarget(category)}
                                                >
                                                    <Trash2 size={14} className="mr-1.5" />
                                                    Xóa
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {filteredCategories.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
                                            {categories.length === 0
                                                ? "Chưa có danh mục nào trong hệ thống."
                                                : "Không có danh mục nào khớp với bộ lọc hiện tại."}
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                        </div>
                    )}

                    <PaginationBar
                        currentPage={currentPage}
                        totalPages={totalPages}
                        totalItems={filteredCategories.length}
                        itemsPerPage={categoriesPerPage}
                        itemLabel="danh mục"
                        className="mt-4"
                        onPageChange={setCurrentPage}
                    />
                </CardContent>
            </Card>

            <Dialog open={!!dialogState} onOpenChange={(open) => !open && setDialogState(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {dialogState?.mode === "create" ? "Thêm danh mục mới" : "Chỉnh sửa danh mục"}
                        </DialogTitle>
                        <DialogDescription>
                            Tên danh mục sẽ được dùng trong job posting và bộ lọc tìm việc.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-2">
                        <Label htmlFor="category-name">Tên danh mục</Label>
                        <Input
                            id="category-name"
                            value={dialogState?.name || ""}
                            onChange={(event) =>
                                setDialogState((current) =>
                                    current
                                        ? {
                                            ...current,
                                            name: event.target.value,
                                        }
                                        : current,
                                )
                            }
                            placeholder="Ví dụ: Backend Development"
                        />
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setDialogState(null)}>
                            Hủy
                        </Button>
                        <Button
                            type="button"
                            disabled={saveMutation.isPending}
                            className="bg-primary hover:bg-primary/90"
                            onClick={() => saveMutation.mutate()}
                        >
                            {saveMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {dialogState?.mode === "create" ? "Tạo danh mục" : "Lưu thay đổi"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Xóa danh mục</DialogTitle>
                        <DialogDescription>
                            Bạn sắp xóa danh mục <span className="font-medium text-foreground">{deleteTarget?.Name}</span>.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">
                        Nếu backend đang dùng danh mục này cho dữ liệu khác, thao tác có thể bị từ chối.
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setDeleteTarget(null)}>
                            Hủy
                        </Button>
                        <Button
                            type="button"
                            className="bg-red-600 hover:bg-red-700"
                            disabled={deleteMutation.isPending}
                            onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.ID)}
                        >
                            {deleteMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Xác nhận xóa
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

function StatCard({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
    return (
        <Card className="border-border shadow-sm">
            <CardContent className="flex items-start justify-between p-5">
                <div>
                    <p className="text-sm text-muted-foreground">{label}</p>
                    <p className="mt-2 text-2xl font-bold text-foreground">{value}</p>
                </div>
                <div className="rounded-xl bg-muted/40 p-3">
                    {icon}
                </div>
            </CardContent>
        </Card>
    );
}

function formatDate(value: string | null) {
    if (!value) {
        return "--";
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return "--";
    }

    return `${date.getDate().toString().padStart(2, "0")}/${(date.getMonth() + 1).toString().padStart(2, "0")}/${date.getFullYear()}`;
}
