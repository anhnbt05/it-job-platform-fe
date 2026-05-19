"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useClientPagination } from "@/hooks/use-client-pagination";
import { adminService } from "@/services/admin.service";
import { CompanyFormValues, type Company } from "@/types";
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
import { Textarea } from "@/components/ui/textarea";
import { Building2, ExternalLink, Globe, ImagePlus, Loader2, MapPin, Plus, Search } from "lucide-react";
import { toast } from "react-toastify";

type CompanyFilter = "all" | "with_logo" | "with_website" | "large";

type CompanyDialogState = {
    values: CompanyFormValues;
};

const defaultCompanyValues: CompanyFormValues = {
    Name: "",
    Description: "",
    WebsiteUrl: "",
    LogoUrl: "",
    Location: "",
    Size: null,
};

export default function AdminCompaniesPage() {
    const queryClient = useQueryClient();
    const companiesPerPage = 8;
    const [dialogState, setDialogState] = useState<CompanyDialogState | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [filter, setFilter] = useState<CompanyFilter>("all");

    const { data: companies = [], isLoading } = useQuery({
        queryKey: ["admin-companies"],
        queryFn: () => adminService.getCompanies(),
    });

    const createMutation = useMutation({
        mutationFn: () => {
            if (!dialogState) {
                throw new Error("missing_dialog_state");
            }

            const normalized = normalizeCompanyValues(dialogState.values);
            if (!normalized.Name) {
                throw new Error("missing_name");
            }

            return adminService.createCompany(normalized);
        },
        onSuccess: () => {
            toast.success("Đã tạo công ty");
            setDialogState(null);
            queryClient.invalidateQueries({ queryKey: ["admin-companies"] });
        },
        onError: (error) => {
            if (error instanceof Error && error.message === "missing_name") {
                toast.error("Tên công ty không được để trống");
                return;
            }

            toast.error("Không thể tạo công ty");
        },
    });

    const stats = useMemo(() => ({
        total: companies.length,
        withLogo: companies.filter((company) => company.LogoUrl).length,
        withWebsite: companies.filter((company) => company.WebsiteUrl).length,
        large: companies.filter((company) => (company.Size ?? 0) >= 100).length,
    }), [companies]);

    const filteredCompanies = useMemo(() => {
        const keyword = searchTerm.trim().toLowerCase();

        return companies.filter((company) => {
            const matchesKeyword = !keyword || [
                company.Name,
                company.Location,
                company.WebsiteUrl,
                company.Description,
                getCompanyDescription(company),
            ]
                .filter(Boolean)
                .some((value) => value!.toLowerCase().includes(keyword));

            if (!matchesKeyword) {
                return false;
            }

            if (filter === "with_logo") {
                return Boolean(company.LogoUrl);
            }

            if (filter === "with_website") {
                return Boolean(company.WebsiteUrl);
            }

            if (filter === "large") {
                return (company.Size ?? 0) >= 100;
            }

            return true;
        });
    }, [companies, filter, searchTerm]);

    const {
        currentPage,
        totalPages,
        paginatedItems: paginatedCompanies,
        setCurrentPage,
    } = useClientPagination({
        items: filteredCompanies,
        itemsPerPage: companiesPerPage,
        resetKey: `${searchTerm}|${filter}|${companies.length}`,
    });

    return (
        <div className="mx-auto max-w-[1160px] space-y-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Quản lý công ty</h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Theo dõi dữ liệu công ty trong organization-service, tạo mới record và mở trang chi tiết để chỉnh sửa.
                    </p>
                </div>
                <Button
                    type="button"
                    className="bg-primary hover:bg-primary/90"
                    onClick={() => setDialogState({ values: { ...defaultCompanyValues } })}
                >
                    <Plus size={16} className="mr-2" />
                    Thêm công ty
                </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <StatCard label="Tổng công ty" value={stats.total} icon={<Building2 size={18} className="text-primary" />} />
                <StatCard label="Có logo" value={stats.withLogo} icon={<ImagePlus size={18} className="text-emerald-600" />} />
                <StatCard label="Có website" value={stats.withWebsite} icon={<Globe size={18} className="text-sky-600" />} />
                <StatCard label="Quy mô lớn" value={stats.large} icon={<MapPin size={18} className="text-amber-600" />} />
            </div>

            <Card className="border-border shadow-sm">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                        <Building2 size={18} className="text-primary" />
                        Danh sách công ty
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="mb-5 grid gap-3 md:grid-cols-[1fr_220px]">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                value={searchTerm}
                                onChange={(event) => setSearchTerm(event.target.value)}
                                placeholder="Tìm theo tên, địa điểm, website"
                                className="pl-10"
                            />
                        </div>

                        <Select value={filter} onValueChange={(value) => setFilter(value as CompanyFilter)}>
                            <SelectTrigger className="bg-card">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Tất cả công ty</SelectItem>
                                <SelectItem value="with_logo">Có logo</SelectItem>
                                <SelectItem value="with_website">Có website</SelectItem>
                                <SelectItem value="large">Quy mô lớn 100+</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="mb-4 flex items-center justify-between text-sm text-muted-foreground">
                        <span>
                            {isLoading
                                ? "Đang tải dữ liệu công ty..."
                                : `Hiển thị ${filteredCompanies.length}/${companies.length} công ty`}
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
                            {[...Array(5)].map((_, index) => (
                                <Skeleton key={index} className="h-14 rounded-lg" />
                            ))}
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Công ty</TableHead>
                                        <TableHead>Địa điểm</TableHead>
                                        <TableHead>Website</TableHead>
                                        <TableHead>Quy mô</TableHead>
                                        <TableHead>Mô tả</TableHead>
                                        <TableHead className="text-right">Thao tác</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {paginatedCompanies.map((company) => (
                                        <TableRow key={company.ID}>
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <CompanyLogo company={company} />
                                                    <div className="min-w-0">
                                                        <p className="font-medium text-foreground">{company.Name}</p>
                                                        <p
                                                            className="max-w-[220px] truncate text-xs text-muted-foreground"
                                                            title={company.ID}
                                                        >
                                                            {company.ID}
                                                        </p>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>{company.Location || "--"}</TableCell>
                                            <TableCell className="max-w-[220px]">
                                                {company.WebsiteUrl ? (
                                                    <a
                                                        href={company.WebsiteUrl}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="inline-flex items-center gap-1 text-primary hover:underline"
                                                    >
                                                        {simplifyUrl(company.WebsiteUrl)}
                                                        <ExternalLink size={12} />
                                                    </a>
                                                ) : (
                                                    <span className="text-muted-foreground">--</span>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline">{formatCompanySize(company.Size)}</Badge>
                                            </TableCell>
                                            <TableCell className="max-w-[280px] truncate text-muted-foreground">
                                                {getCompanyDescription(company)}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button asChild size="sm" variant="outline">
                                                    <Link href={`/admin/companies/${company.ID}`}>Xem chi tiết</Link>
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {filteredCompanies.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                                                {companies.length === 0
                                                    ? "Chưa có công ty nào trong hệ thống."
                                                    : "Không có công ty nào khớp với bộ lọc hiện tại."}
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
                        totalItems={filteredCompanies.length}
                        itemsPerPage={companiesPerPage}
                        itemLabel="công ty"
                        className="mt-4"
                        onPageChange={setCurrentPage}
                    />
                </CardContent>
            </Card>

            <Dialog open={!!dialogState} onOpenChange={(open) => !open && setDialogState(null)}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Thêm công ty mới</DialogTitle>
                        <DialogDescription>
                            Dữ liệu này sẽ được lưu trực tiếp vào organization-service qua endpoint admin tạo company.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2 md:col-span-2">
                            <Label htmlFor="company-name">Tên công ty</Label>
                            <Input
                                id="company-name"
                                value={dialogState?.values.Name || ""}
                                onChange={(event) => updateDialogField(setDialogState, "Name", event.target.value)}
                                placeholder="Ví dụ: NovaTech Solutions"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="company-location">Địa điểm</Label>
                            <Input
                                id="company-location"
                                value={dialogState?.values.Location || ""}
                                onChange={(event) => updateDialogField(setDialogState, "Location", event.target.value)}
                                placeholder="Hồ Chí Minh"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="company-size">Quy mô nhân sự</Label>
                            <Input
                                id="company-size"
                                type="number"
                                min={1}
                                value={dialogState?.values.Size?.toString() || ""}
                                onChange={(event) => updateDialogField(setDialogState, "Size", parseSizeValue(event.target.value))}
                                placeholder="100"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="company-website">Website</Label>
                            <Input
                                id="company-website"
                                value={dialogState?.values.WebsiteUrl || ""}
                                onChange={(event) => updateDialogField(setDialogState, "WebsiteUrl", event.target.value)}
                                placeholder="https://example.com"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="company-logo">Logo URL</Label>
                            <Input
                                id="company-logo"
                                value={dialogState?.values.LogoUrl || ""}
                                onChange={(event) => updateDialogField(setDialogState, "LogoUrl", event.target.value)}
                                placeholder="https://cdn.example.com/logo.png"
                            />
                        </div>

                        <div className="space-y-2 md:col-span-2">
                            <Label htmlFor="company-description">Mô tả</Label>
                            <Textarea
                                id="company-description"
                                rows={5}
                                value={dialogState?.values.Description || ""}
                                onChange={(event) => updateDialogField(setDialogState, "Description", event.target.value)}
                                placeholder="Mô tả ngắn về công ty, lĩnh vực và môi trường làm việc"
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setDialogState(null)}>
                            Hủy
                        </Button>
                        <Button
                            type="button"
                            className="bg-primary hover:bg-primary/90"
                            disabled={createMutation.isPending}
                            onClick={() => createMutation.mutate()}
                        >
                            {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Tạo công ty
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

function updateDialogField(
    setDialogState: React.Dispatch<React.SetStateAction<CompanyDialogState | null>>,
    field: keyof CompanyFormValues,
    value: CompanyFormValues[keyof CompanyFormValues],
) {
    setDialogState((current) => (
        current
            ? {
                ...current,
                values: {
                    ...current.values,
                    [field]: value,
                },
            }
            : current
    ));
}

function normalizeCompanyValues(values: CompanyFormValues): CompanyFormValues {
    return {
        Name: values.Name.trim(),
        Description: values.Description?.trim() || null,
        WebsiteUrl: values.WebsiteUrl?.trim() || null,
        LogoUrl: values.LogoUrl?.trim() || null,
        Location: values.Location?.trim() || null,
        Size: values.Size ?? null,
    };
}

function parseSizeValue(value: string) {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function simplifyUrl(value: string) {
    return value.replace(/^https?:\/\//, "");
}

function formatCompanySize(size?: number | null) {
    if (!size || size <= 0) {
        return "Chưa rõ";
    }

    return `${size}+ người`;
}

function getCompanyDescription(company: Company) {
    if (company.Description?.trim()) {
        return company.Description;
    }

    const facts = [
        company.Location ? `hoat dong tai ${company.Location}` : null,
        company.Size ? `quy mo khoang ${company.Size}+ nhan su` : null,
        company.WebsiteUrl ? `co website ${simplifyUrl(company.WebsiteUrl)}` : null,
    ].filter(Boolean);

    if (facts.length === 0) {
        return "Cong ty da co du lieu co ban de phuc vu demo.";
    }

    return `${company.Name} ${facts.join(", ")}.`;
}

function CompanyLogo({ company }: { company: Company }) {
    if (company.LogoUrl) {
        return (
            <img
                src={company.LogoUrl}
                alt={company.Name}
                className="h-10 w-10 rounded-xl border border-border object-cover"
            />
        );
    }

    return (
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Building2 size={18} />
        </div>
    );
}

function StatCard({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
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
