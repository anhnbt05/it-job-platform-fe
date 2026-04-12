"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminService } from "@/services/admin.service";
import { CompanyBranch, CompanyFormValues } from "@/types";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
    ArrowLeft,
    Building2,
    ExternalLink,
    Globe,
    Loader2,
    MapPin,
    Network,
    Pencil,
    Plus,
    Save,
    Search,
} from "lucide-react";
import { toast } from "react-toastify";

type BranchFormValues = {
    BranchName: string;
    Address: string;
    City: string;
    Country: string;
};

type BranchDialogState =
    | { mode: "create"; branch: null; values: BranchFormValues }
    | { mode: "edit"; branch: CompanyBranch; values: BranchFormValues };

const emptyBranchForm: BranchFormValues = {
    BranchName: "",
    Address: "",
    City: "",
    Country: "",
};

export default function AdminCompanyDetailPage() {
    const params = useParams<{ id: string }>();
    const queryClient = useQueryClient();
    const companyId = typeof params?.id === "string" ? params.id : "";
    const [formValues, setFormValues] = useState<CompanyFormValues | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [cityFilter, setCityFilter] = useState("all");
    const [countryFilter, setCountryFilter] = useState("all");
    const [branchDialogState, setBranchDialogState] = useState<BranchDialogState | null>(null);

    const companyQuery = useQuery({
        queryKey: ["admin-company-detail", companyId],
        queryFn: async () => {
            const company = await adminService.getCompanyDetail(companyId);
            setFormValues({
                Name: company.Name,
                Description: company.Description,
                WebsiteUrl: company.WebsiteUrl,
                LogoUrl: company.LogoUrl,
                Location: company.Location,
                Size: company.Size ?? null,
            });

            return company;
        },
        enabled: !!companyId,
    });

    const branchQuery = useQuery({
        queryKey: ["admin-company-branches", companyId],
        queryFn: () => adminService.getBranches(companyId),
        enabled: !!companyId,
    });

    const updateMutation = useMutation({
        mutationFn: () => {
            if (!companyId || !formValues?.Name?.trim()) {
                throw new Error("invalid_payload");
            }

            return adminService.updateCompany(companyId, {
                Name: formValues.Name.trim(),
                Description: formValues.Description?.trim() || null,
                WebsiteUrl: formValues.WebsiteUrl?.trim() || null,
                LogoUrl: formValues.LogoUrl?.trim() || null,
                Location: formValues.Location?.trim() || null,
                Size: formValues.Size ?? null,
            });
        },
        onSuccess: async () => {
            toast.success("Đã cập nhật thông tin công ty");
            await queryClient.invalidateQueries({ queryKey: ["admin-companies"] });
            await queryClient.invalidateQueries({ queryKey: ["admin-company-detail", companyId] });
        },
        onError: (error) => {
            if (error instanceof Error && error.message === "invalid_payload") {
                toast.error("Tên công ty không được để trống");
                return;
            }

            toast.error("Không thể cập nhật thông tin công ty");
        },
    });

    const createBranchMutation = useMutation({
        mutationFn: async () => {
            if (!companyId || !branchDialogState || branchDialogState.mode !== "create") {
                throw new Error("invalid_branch_state");
            }

            const payload = normalizeBranchForm(branchDialogState.values);
            if (!payload.BranchName || !payload.Address) {
                throw new Error("invalid_branch_form");
            }

            return adminService.createBranch({
                companyId,
                branchName: payload.BranchName,
                address: payload.Address,
                city: payload.City,
                country: payload.Country,
            });
        },
        onSuccess: async () => {
            toast.success("Đã tạo chi nhánh");
            setBranchDialogState(null);
            await queryClient.invalidateQueries({ queryKey: ["admin-company-branches", companyId] });
        },
        onError: handleBranchMutationError,
    });

    const updateBranchMutation = useMutation({
        mutationFn: async () => {
            if (!branchDialogState || branchDialogState.mode !== "edit") {
                throw new Error("invalid_branch_state");
            }

            const payload = normalizeBranchForm(branchDialogState.values);
            if (!payload.BranchName || !payload.Address) {
                throw new Error("invalid_branch_form");
            }

            return adminService.updateBranch(branchDialogState.branch.ID, {
                branchName: payload.BranchName,
                address: payload.Address,
                city: payload.City,
                country: payload.Country,
            });
        },
        onSuccess: async () => {
            toast.success("Đã cập nhật chi nhánh");
            setBranchDialogState(null);
            await queryClient.invalidateQueries({ queryKey: ["admin-company-branches", companyId] });
        },
        onError: handleBranchMutationError,
    });

    const summaryItems = useMemo(() => {
        if (!companyQuery.data) {
            return [];
        }

        return [
            { label: "ID", value: companyQuery.data.ID },
            { label: "Quy mô", value: formatCompanySize(companyQuery.data.Size) },
            { label: "Địa điểm", value: companyQuery.data.Location || "Chưa cập nhật" },
            { label: "Website", value: companyQuery.data.WebsiteUrl || "Chưa cập nhật" },
        ];
    }, [companyQuery.data]);

    const branchStats = useMemo(() => {
        const branches = branchQuery.data || [];

        return {
            total: branches.length,
            cities: new Set(branches.map((branch) => branch.City).filter(Boolean)).size,
            countries: new Set(branches.map((branch) => branch.Country).filter(Boolean)).size,
        };
    }, [branchQuery.data]);

    const filteredBranches = useMemo(() => {
        const branches = branchQuery.data || [];
        const keyword = searchTerm.trim().toLowerCase();

        return branches.filter((branch) => {
            if (cityFilter !== "all" && (branch.City || "unknown") !== cityFilter) {
                return false;
            }

            if (countryFilter !== "all" && (branch.Country || "unknown") !== countryFilter) {
                return false;
            }

            if (!keyword) {
                return true;
            }

            return [branch.BranchName, branch.Address, branch.City, branch.Country]
                .filter(Boolean)
                .some((value) => value!.toLowerCase().includes(keyword));
        });
    }, [branchQuery.data, cityFilter, countryFilter, searchTerm]);

    const cityOptions = useMemo(() => {
        const values = Array.from(new Set((branchQuery.data || []).map((branch) => branch.City || "unknown")));
        return values.sort((a, b) => a.localeCompare(b));
    }, [branchQuery.data]);

    const countryOptions = useMemo(() => {
        const values = Array.from(new Set((branchQuery.data || []).map((branch) => branch.Country || "unknown")));
        return values.sort((a, b) => a.localeCompare(b));
    }, [branchQuery.data]);

    const isBranchSaving = createBranchMutation.isPending || updateBranchMutation.isPending;

    if (companyQuery.isLoading && !formValues) {
        return (
            <div className="mx-auto max-w-[1160px] space-y-6">
                <Skeleton className="h-10 w-40 rounded-lg" />
                <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
                    <Skeleton className="h-[420px] rounded-2xl" />
                    <Skeleton className="h-[520px] rounded-2xl" />
                </div>
            </div>
        );
    }

    if (!companyQuery.data || !formValues) {
        return (
            <div className="mx-auto max-w-[1160px]">
                <Card className="border-border shadow-sm">
                    <CardContent className="flex flex-col items-start gap-4 p-6">
                        <h1 className="text-xl font-bold text-foreground">Không thể tải dữ liệu công ty</h1>
                        <p className="text-sm text-muted-foreground">
                            Kiểm tra lại `companyId` hoặc trạng thái API `GET /organization/companies/:id`.
                        </p>
                        <Button asChild variant="outline">
                            <Link href="/admin/companies">Quay lại danh sách</Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-[1160px] space-y-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                    <Button asChild variant="ghost" className="-ml-3 px-3 text-muted-foreground hover:text-foreground">
                        <Link href="/admin/companies">
                            <ArrowLeft size={16} className="mr-2" />
                            Quay lại danh sách công ty
                        </Link>
                    </Button>
                    <div className="mt-3 flex flex-wrap items-center gap-3">
                        <Badge className="bg-primary/10 text-primary">Company Detail</Badge>
                        <h1 className="text-2xl font-bold text-foreground">{companyQuery.data.Name}</h1>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">
                        Chi tiết công ty và danh sách chi nhánh nằm cùng một màn quản trị để thao tác nhanh hơn.
                    </p>
                </div>

                <Button
                    type="button"
                    className="bg-primary text-white hover:bg-primary/90"
                    disabled={updateMutation.isPending}
                    onClick={() => updateMutation.mutate()}
                >
                    {updateMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save size={16} className="mr-2" />}
                    Lưu thông tin công ty
                </Button>
            </div>

            <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
                <Card className="border-border shadow-sm">
                    <CardContent className="space-y-5 p-6">
                        <div className="flex flex-col items-center text-center">
                            {formValues.LogoUrl ? (
                                <img
                                    src={formValues.LogoUrl}
                                    alt={formValues.Name}
                                    className="h-24 w-24 rounded-3xl border border-border object-cover"
                                />
                            ) : (
                                <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-primary/10 text-primary">
                                    <Building2 size={36} />
                                </div>
                            )}
                            <h2 className="mt-4 text-xl font-semibold text-foreground">{formValues.Name || "Chưa đặt tên"}</h2>
                            <p className="mt-1 text-sm text-muted-foreground">{formValues.Location || "Chưa cập nhật địa điểm"}</p>
                        </div>

                        <div className="space-y-3">
                            {summaryItems.map((item) => (
                                <div key={item.label} className="rounded-xl border border-border p-4">
                                    <p className="text-xs uppercase tracking-wide text-muted-foreground">{item.label}</p>
                                    <p className="mt-2 break-all text-sm font-medium text-foreground">{item.value}</p>
                                </div>
                            ))}
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2">
                            <MiniStatCard label="Chi nhánh" value={String(branchStats.total)} icon={<MapPin size={16} className="text-primary" />} />
                            <MiniStatCard label="Thành phố" value={String(branchStats.cities)} icon={<Globe size={16} className="text-emerald-600" />} />
                        </div>

                        {formValues.WebsiteUrl && (
                            <a
                                href={formValues.WebsiteUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
                            >
                                <ExternalLink size={14} />
                                Mở website công ty
                            </a>
                        )}
                    </CardContent>
                </Card>

                <div className="space-y-4">
                    <Tabs defaultValue="overview" className="w-full">
                        <TabsList variant="line" className="w-full justify-start rounded-2xl bg-transparent p-0">
                            <TabsTrigger value="overview" className="px-4 py-2">Thông tin công ty</TabsTrigger>
                            <TabsTrigger value="branches" className="px-4 py-2">Chi nhánh</TabsTrigger>
                        </TabsList>
                        <TabsContent value="overview">
                            <Card className="border-border shadow-sm">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-base">
                                        <Building2 size={18} className="text-primary" />
                                        Cập nhật thông tin công ty
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-5">
                                    <div className="grid gap-5 md:grid-cols-2">
                                        <Field label="Tên công ty" htmlFor="company-name">
                                            <Input
                                                id="company-name"
                                                value={formValues.Name}
                                                onChange={(event) => setFormValues((current) => current ? { ...current, Name: event.target.value } : current)}
                                            />
                                        </Field>

                                        <Field label="Quy mô nhân sự" htmlFor="company-size">
                                            <Input
                                                id="company-size"
                                                type="number"
                                                min={1}
                                                value={formValues.Size?.toString() || ""}
                                                onChange={(event) => setFormValues((current) => (
                                                    current
                                                        ? {
                                                            ...current,
                                                            Size: parseSizeValue(event.target.value),
                                                        }
                                                        : current
                                                ))}
                                            />
                                        </Field>

                                        <Field label="Địa điểm" htmlFor="company-location">
                                            <div className="relative">
                                                <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                                <Input
                                                    id="company-location"
                                                    className="pl-10"
                                                    value={formValues.Location || ""}
                                                    onChange={(event) => setFormValues((current) => current ? { ...current, Location: event.target.value } : current)}
                                                />
                                            </div>
                                        </Field>

                                        <Field label="Website" htmlFor="company-website">
                                            <div className="relative">
                                                <Globe className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                                <Input
                                                    id="company-website"
                                                    className="pl-10"
                                                    value={formValues.WebsiteUrl || ""}
                                                    onChange={(event) => setFormValues((current) => current ? { ...current, WebsiteUrl: event.target.value } : current)}
                                                />
                                            </div>
                                        </Field>

                                        <Field label="Logo URL" htmlFor="company-logo">
                                            <Input
                                                id="company-logo"
                                                value={formValues.LogoUrl || ""}
                                                onChange={(event) => setFormValues((current) => current ? { ...current, LogoUrl: event.target.value } : current)}
                                            />
                                        </Field>

                                        <div className="rounded-2xl border border-border bg-muted/30 p-4">
                                            <p className="text-sm font-medium text-foreground">Preview trạng thái</p>
                                            <div className="mt-3 space-y-2 text-sm text-muted-foreground">
                                                <p>Tên hiển thị: <span className="font-medium text-foreground">{formValues.Name || "--"}</span></p>
                                                <p>Địa điểm: <span className="font-medium text-foreground">{formValues.Location || "--"}</span></p>
                                                <p>Quy mô: <span className="font-medium text-foreground">{formatCompanySize(formValues.Size)}</span></p>
                                            </div>
                                        </div>

                                        <div className="md:col-span-2">
                                            <Field label="Mô tả" htmlFor="company-description">
                                                <Textarea
                                                    id="company-description"
                                                    rows={8}
                                                    value={formValues.Description || ""}
                                                    onChange={(event) => setFormValues((current) => current ? { ...current, Description: event.target.value } : current)}
                                                    placeholder="Mô tả ngắn về công ty, sản phẩm hoặc văn hóa nội bộ"
                                                />
                                            </Field>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="branches">
                            <Card className="border-border shadow-sm">
                                <CardHeader className="gap-4">
                                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                                        <CardTitle className="flex items-center gap-2 text-base">
                                            <MapPin size={18} className="text-primary" />
                                            Danh sách chi nhánh
                                        </CardTitle>

                                        <Button
                                            type="button"
                                            className="bg-primary hover:bg-primary/90"
                                            onClick={() =>
                                                setBranchDialogState({
                                                    mode: "create",
                                                    branch: null,
                                                    values: { ...emptyBranchForm },
                                                })
                                            }
                                        >
                                            <Plus size={16} className="mr-2" />
                                            Thêm chi nhánh
                                        </Button>
                                    </div>

                                    <div className="grid gap-3 md:grid-cols-3">
                                        <MiniStatCard label="Tổng chi nhánh" value={String(branchStats.total)} icon={<MapPin size={16} className="text-primary" />} />
                                        <MiniStatCard label="Thành phố" value={String(branchStats.cities)} icon={<Globe size={16} className="text-emerald-600" />} />
                                        <MiniStatCard label="Quốc gia" value={String(branchStats.countries)} icon={<Network size={16} className="text-sky-600" />} />
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-5">
                                    <div className="grid gap-3 xl:grid-cols-[1.1fr_220px_220px]">
                                        <div className="relative">
                                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                            <Input
                                                value={searchTerm}
                                                onChange={(event) => setSearchTerm(event.target.value)}
                                                className="pl-10"
                                                placeholder="Tìm theo tên chi nhánh, địa chỉ, thành phố hoặc quốc gia"
                                            />
                                        </div>

                                        <Select value={cityFilter} onValueChange={setCityFilter}>
                                            <SelectTrigger className="bg-card">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">Mọi thành phố</SelectItem>
                                                {cityOptions.map((city) => (
                                                    <SelectItem key={city} value={city}>
                                                        {city === "unknown" ? "Chưa cập nhật" : city}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>

                                        <Select value={countryFilter} onValueChange={setCountryFilter}>
                                            <SelectTrigger className="bg-card">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">Mọi quốc gia</SelectItem>
                                                {countryOptions.map((country) => (
                                                    <SelectItem key={country} value={country}>
                                                        {country === "unknown" ? "Chưa cập nhật" : country}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                                        <span>
                                            {branchQuery.isLoading
                                                ? "Đang tải chi nhánh..."
                                                : `Hiển thị ${filteredBranches.length}/${branchStats.total} chi nhánh`}
                                        </span>
                                        {(searchTerm || cityFilter !== "all" || countryFilter !== "all") && (
                                            <button
                                                type="button"
                                                className="font-medium text-primary hover:underline"
                                                onClick={() => {
                                                    setSearchTerm("");
                                                    setCityFilter("all");
                                                    setCountryFilter("all");
                                                }}
                                            >
                                                Xóa bộ lọc
                                            </button>
                                        )}
                                    </div>

                                    {branchQuery.isLoading ? (
                                        <div className="space-y-3">
                                            {[...Array(4)].map((_, index) => (
                                                <Skeleton key={index} className="h-[160px] rounded-2xl" />
                                            ))}
                                        </div>
                                    ) : filteredBranches.length === 0 ? (
                                        <div className="rounded-2xl border border-dashed border-border bg-muted/30 p-8 text-center">
                                            <p className="text-base font-medium text-foreground">
                                                {branchStats.total === 0 ? "Chưa có chi nhánh nào" : "Không có chi nhánh phù hợp"}
                                            </p>
                                            <p className="mt-2 text-sm text-muted-foreground">
                                                {branchStats.total === 0
                                                    ? "Tạo chi nhánh đầu tiên ngay trong tab này để quản trị company trọn vẹn."
                                                    : "Thử đổi từ khóa tìm kiếm để hiển thị thêm kết quả."}
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="grid gap-4 lg:grid-cols-2">
                                            {filteredBranches.map((branch) => (
                                                <Card key={branch.ID} className="border-border shadow-sm">
                                                    <CardContent className="space-y-4 p-5">
                                                        <div className="flex items-start justify-between gap-3">
                                                            <div>
                                                                <h3 className="text-lg font-semibold text-foreground">
                                                                    {branch.BranchName || "Chi nhánh chưa đặt tên"}
                                                                </h3>
                                                                <p className="mt-2 text-sm text-muted-foreground">
                                                                    {formatBranchLocation(branch)}
                                                                </p>
                                                            </div>

                                                            <Button
                                                                type="button"
                                                                size="sm"
                                                                variant="outline"
                                                                onClick={() =>
                                                                    setBranchDialogState({
                                                                        mode: "edit",
                                                                        branch,
                                                                        values: {
                                                                            BranchName: branch.BranchName || "",
                                                                            Address: branch.Address || "",
                                                                            City: branch.City || "",
                                                                            Country: branch.Country || "",
                                                                        },
                                                                    })
                                                                }
                                                            >
                                                                <Pencil size={14} className="mr-1.5" />
                                                                Sửa
                                                            </Button>
                                                        </div>

                                                        <div className="grid gap-3 sm:grid-cols-2">
                                                            <InfoTile label="Địa chỉ" value={branch.Address || "Chưa cập nhật"} />
                                                            <InfoTile label="Thành phố" value={branch.City || "Chưa cập nhật"} />
                                                            <InfoTile label="Quốc gia" value={branch.Country || "Chưa cập nhật"} />
                                                            <InfoTile label="Cập nhật" value={formatDate(branch.UpdatedAt)} />
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            ))}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </div>
            </div>

            <Dialog open={!!branchDialogState} onOpenChange={(open) => !open && setBranchDialogState(null)}>
                <DialogContent className="max-w-xl">
                    <DialogHeader>
                        <DialogTitle>
                            {branchDialogState?.mode === "create" ? "Thêm chi nhánh mới" : "Chỉnh sửa chi nhánh"}
                        </DialogTitle>
                        <DialogDescription>
                            {branchDialogState?.mode === "create"
                                ? "Tạo branch mới trực tiếp từ trang chi tiết công ty."
                                : "Cập nhật branch hiện có mà không cần rời khỏi company detail."}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 md:grid-cols-2">
                        <Field label="Tên chi nhánh" htmlFor="branch-name">
                            <Input
                                id="branch-name"
                                value={branchDialogState?.values.BranchName || ""}
                                onChange={(event) => updateBranchDialogField(setBranchDialogState, "BranchName", event.target.value)}
                                placeholder="Head Office, HCM Branch..."
                            />
                        </Field>

                        <Field label="Thành phố" htmlFor="branch-city">
                            <Input
                                id="branch-city"
                                value={branchDialogState?.values.City || ""}
                                onChange={(event) => updateBranchDialogField(setBranchDialogState, "City", event.target.value)}
                                placeholder="Ho Chi Minh City"
                            />
                        </Field>

                        <div className="md:col-span-2">
                            <Field label="Địa chỉ" htmlFor="branch-address">
                                <Input
                                    id="branch-address"
                                    value={branchDialogState?.values.Address || ""}
                                    onChange={(event) => updateBranchDialogField(setBranchDialogState, "Address", event.target.value)}
                                    placeholder="Số nhà, đường, quận/huyện"
                                />
                            </Field>
                        </div>

                        <Field label="Quốc gia" htmlFor="branch-country">
                            <Input
                                id="branch-country"
                                value={branchDialogState?.values.Country || ""}
                                onChange={(event) => updateBranchDialogField(setBranchDialogState, "Country", event.target.value)}
                                placeholder="Vietnam"
                            />
                        </Field>

                        <div className="rounded-2xl border border-border bg-muted/30 p-4">
                            <p className="text-sm font-medium text-foreground">Company</p>
                            <p className="mt-2 text-sm text-muted-foreground">{companyQuery.data.Name}</p>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setBranchDialogState(null)} disabled={isBranchSaving}>
                            Hủy
                        </Button>
                        <Button
                            type="button"
                            className="bg-primary hover:bg-primary/90"
                            disabled={isBranchSaving}
                            onClick={() => branchDialogState?.mode === "create" ? createBranchMutation.mutate() : updateBranchMutation.mutate()}
                        >
                            {isBranchSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {branchDialogState?.mode === "create" ? "Tạo chi nhánh" : "Lưu thay đổi"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

function Field({
    label,
    htmlFor,
    children,
}: {
    label: string;
    htmlFor: string;
    children: React.ReactNode;
}) {
    return (
        <div className="space-y-2">
            <Label htmlFor={htmlFor}>{label}</Label>
            {children}
        </div>
    );
}

function MiniStatCard({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
    return (
        <div className="rounded-2xl border border-border bg-muted/30 p-4">
            <div className="flex items-center justify-between gap-3">
                <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
                    <p className="mt-2 text-xl font-semibold text-foreground">{value}</p>
                </div>
                <div className="rounded-xl bg-background p-2 shadow-sm">
                    {icon}
                </div>
            </div>
        </div>
    );
}

function InfoTile({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-xl border border-border p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
            <p className="mt-2 text-sm font-medium text-foreground">{value}</p>
        </div>
    );
}

function updateBranchDialogField(
    setBranchDialogState: React.Dispatch<React.SetStateAction<BranchDialogState | null>>,
    field: keyof BranchFormValues,
    value: string,
) {
    setBranchDialogState((current) => (
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

function normalizeBranchForm(values: BranchFormValues) {
    return {
        BranchName: values.BranchName.trim(),
        Address: values.Address.trim(),
        City: values.City.trim() || undefined,
        Country: values.Country.trim() || undefined,
    };
}

function parseSizeValue(value: string) {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function formatCompanySize(size?: number | null) {
    if (!size || size <= 0) {
        return "Chưa rõ";
    }

    return `${size}+ người`;
}

function formatDate(value?: string | null) {
    if (!value) {
        return "--";
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return "--";
    }

    return `${date.getDate().toString().padStart(2, "0")}/${(date.getMonth() + 1).toString().padStart(2, "0")}/${date.getFullYear()}`;
}

function formatBranchLocation(branch: CompanyBranch) {
    return [branch.Address, branch.City, branch.Country].filter(Boolean).join(", ") || "Chưa cập nhật địa chỉ";
}

function handleBranchMutationError(error: unknown) {
    if (error instanceof Error && error.message === "invalid_branch_form") {
        toast.error("Tên chi nhánh và địa chỉ không được để trống");
        return;
    }

    toast.error("Không thể cập nhật dữ liệu chi nhánh");
}
