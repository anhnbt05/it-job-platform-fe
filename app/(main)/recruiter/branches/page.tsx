"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useClientPagination } from "@/hooks/use-client-pagination";
import { recruiterService } from "@/services/recruiter.service";
import { CompanyBranch } from "@/types";
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
import { Skeleton } from "@/components/ui/skeleton";
import { MapPin, Building2, Plus, Pencil, Search, Loader2, Network } from "lucide-react";
import { toast } from "react-toastify";

type BranchFormValues = {
    BranchName: string;
    Address: string;
    City: string;
    Country: string;
};

type BranchDialogState =
    | {
        mode: "create";
        branch: null;
        values: BranchFormValues;
    }
    | {
        mode: "edit";
        branch: CompanyBranch;
        values: BranchFormValues;
    };

const emptyBranchForm: BranchFormValues = {
    BranchName: "",
    Address: "",
    City: "",
    Country: "",
};

export default function RecruiterBranchesPage() {
    const queryClient = useQueryClient();
    const branchesPerPage = 6;
    const [searchTerm, setSearchTerm] = useState("");
    const [dialogState, setDialogState] = useState<BranchDialogState | null>(null);

    const { data: recruiter, isLoading: recruiterLoading } = useQuery({
        queryKey: ["recruiter-profile"],
        queryFn: () => recruiterService.getProfile(),
    });

    const company = recruiter?.Company;
    const linkedBranchId = recruiter?.CompanyLocations?.ID || null;

    const { data: branches = [], isLoading: branchesLoading } = useQuery({
        queryKey: ["recruiter-branches", company?.ID],
        queryFn: () => recruiterService.getBranches(company!.ID),
        enabled: !!company?.ID,
    });

    const createMutation = useMutation({
        mutationFn: async () => {
            if (!company?.ID || !dialogState || dialogState.mode !== "create") {
                throw new Error("missing_company");
            }

            const payload = normalizeBranchForm(dialogState.values);
            if (!payload.BranchName || !payload.Address) {
                throw new Error("invalid_form");
            }

            return recruiterService.createBranch({
                CompanyId: company.ID,
                ...payload,
            });
        },
        onSuccess: async () => {
            toast.success("Đã tạo chi nhánh");
            setDialogState(null);
            await queryClient.invalidateQueries({ queryKey: ["recruiter-branches"] });
        },
        onError: (error) => {
            if (error instanceof Error && error.message === "invalid_form") {
                toast.error("Tên chi nhánh và địa chỉ không được để trống");
                return;
            }

            toast.error("Không thể tạo chi nhánh");
        },
    });

    const updateMutation = useMutation({
        mutationFn: async () => {
            if (!dialogState || dialogState.mode !== "edit") {
                throw new Error("missing_branch");
            }

            const payload = normalizeBranchForm(dialogState.values);
            if (!payload.BranchName || !payload.Address) {
                throw new Error("invalid_form");
            }

            return recruiterService.updateBranch(dialogState.branch.ID, payload);
        },
        onSuccess: async () => {
            toast.success("Đã cập nhật chi nhánh");
            setDialogState(null);
            await queryClient.invalidateQueries({ queryKey: ["recruiter-branches"] });
            await queryClient.invalidateQueries({ queryKey: ["recruiter-profile"] });
        },
        onError: (error) => {
            if (error instanceof Error && error.message === "invalid_form") {
                toast.error("Tên chi nhánh và địa chỉ không được để trống");
                return;
            }

            toast.error("Không thể cập nhật chi nhánh");
        },
    });

    const stats = useMemo(() => ({
        total: branches.length,
        cities: new Set(branches.map((branch) => branch.City).filter(Boolean)).size,
        countries: new Set(branches.map((branch) => branch.Country).filter(Boolean)).size,
        linked: branches.filter((branch) => branch.ID === linkedBranchId).length,
    }), [branches, linkedBranchId]);

    const filteredBranches = useMemo(() => {
        const keyword = searchTerm.trim().toLowerCase();

        return branches.filter((branch) => {
            if (!keyword) {
                return true;
            }

            return [
                branch.BranchName,
                branch.Address,
                branch.City,
                branch.Country,
            ]
                .filter(Boolean)
                .some((value) => value!.toLowerCase().includes(keyword));
        });
    }, [branches, searchTerm]);

    const {
        currentPage,
        totalPages,
        paginatedItems: paginatedBranches,
        setCurrentPage,
    } = useClientPagination({
        items: filteredBranches,
        itemsPerPage: branchesPerPage,
        resetKey: `${searchTerm}|${branches.length}|${linkedBranchId || ""}`,
    });

    const isSaving = createMutation.isPending || updateMutation.isPending;

    if (recruiterLoading) {
        return (
            <div className="mx-auto max-w-[1120px] space-y-6">
                <Skeleton className="h-[140px] rounded-2xl" />
                <Skeleton className="h-[420px] rounded-2xl" />
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-[1120px] space-y-6">
            <Card className="border-border shadow-sm">
                <CardContent className="flex flex-col gap-4 p-6 lg:flex-row lg:items-end lg:justify-between">
                    <div>
                        <Badge className="bg-primary/10 text-primary">Recruiter Branches</Badge>
                        <h1 className="mt-3 text-2xl font-bold text-foreground">Quản lý chi nhánh công ty</h1>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Tạo mới và cập nhật các chi nhánh thuộc công ty của recruiter. Dữ liệu lấy trực tiếp từ organization-service.
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2 text-sm text-muted-foreground">
                            <span>Công ty hiện tại:</span>
                            <span className="font-medium text-foreground">{company?.Name || "Chưa liên kết công ty"}</span>
                        </div>
                    </div>

                    <Button
                        type="button"
                        className="bg-primary hover:bg-primary/90"
                        disabled={!company?.ID}
                        onClick={() =>
                            setDialogState({
                                mode: "create",
                                branch: null,
                                values: { ...emptyBranchForm },
                            })
                        }
                    >
                        <Plus size={16} className="mr-2" />
                        Thêm chi nhánh
                    </Button>
                </CardContent>
            </Card>

            {!company?.ID && (
                <Card className="border-border shadow-sm">
                    <CardContent className="p-6 text-sm text-muted-foreground">
                        Tài khoản recruiter hiện chưa liên kết company ID nên chưa thể dùng màn quản lý chi nhánh này.
                    </CardContent>
                </Card>
            )}

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <StatCard label="Tổng chi nhánh" value={stats.total} icon={<Building2 size={18} className="text-primary" />} />
                <StatCard label="Thành phố" value={stats.cities} icon={<MapPin size={18} className="text-emerald-600" />} />
                <StatCard label="Quốc gia" value={stats.countries} icon={<Network size={18} className="text-sky-600" />} />
                <StatCard label="Đang liên kết" value={stats.linked} icon={<Pencil size={18} className="text-amber-600" />} />
            </div>

            <Card className="border-border shadow-sm">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                        <MapPin size={18} className="text-primary" />
                        Danh sách chi nhánh
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="mb-5 relative">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            value={searchTerm}
                            onChange={(event) => setSearchTerm(event.target.value)}
                            className="pl-10"
                            placeholder="Tìm theo tên chi nhánh, địa chỉ, thành phố hoặc quốc gia"
                        />
                    </div>

                    {branchesLoading ? (
                        <div className="space-y-3">
                            {[...Array(4)].map((_, index) => (
                                <Skeleton key={index} className="h-[160px] rounded-2xl" />
                            ))}
                        </div>
                    ) : filteredBranches.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-border bg-muted/30 p-8 text-center">
                            <p className="text-base font-medium text-foreground">
                                {branches.length === 0 ? "Chưa có chi nhánh nào" : "Không có chi nhánh phù hợp"}
                            </p>
                            <p className="mt-2 text-sm text-muted-foreground">
                                {branches.length === 0
                                    ? "Tạo chi nhánh đầu tiên để quản lý địa điểm tuyển dụng của công ty."
                                    : "Thử thay đổi từ khóa tìm kiếm để xem thêm kết quả."}
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="grid gap-4 lg:grid-cols-2">
                                {paginatedBranches.map((branch) => (
                                    <Card key={branch.ID} className="border-border shadow-sm">
                                        <CardContent className="space-y-4 p-5">
                                            <div className="flex items-start justify-between gap-3">
                                                <div>
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <h3 className="text-lg font-semibold text-foreground">
                                                            {branch.BranchName || "Chi nhánh chưa đặt tên"}
                                                        </h3>
                                                        {branch.ID === linkedBranchId && (
                                                            <Badge className="bg-primary/10 text-primary">
                                                                Đang gắn với tài khoản
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    <p className="mt-2 text-sm text-muted-foreground">
                                                        {formatBranchLocation(branch)}
                                                    </p>
                                                </div>

                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() =>
                                                        setDialogState({
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

                            <PaginationBar
                                currentPage={currentPage}
                                totalPages={totalPages}
                                totalItems={filteredBranches.length}
                                itemsPerPage={branchesPerPage}
                                itemLabel="chi nhánh"
                                onPageChange={setCurrentPage}
                            />
                        </div>
                    )}
                </CardContent>
            </Card>

            <Dialog open={!!dialogState} onOpenChange={(open) => !open && setDialogState(null)}>
                <DialogContent className="max-w-xl">
                    <DialogHeader>
                        <DialogTitle>
                            {dialogState?.mode === "create" ? "Thêm chi nhánh mới" : "Chỉnh sửa chi nhánh"}
                        </DialogTitle>
                        <DialogDescription>
                            {dialogState?.mode === "create"
                                ? "Tạo branch mới cho công ty hiện tại."
                                : "Cập nhật thông tin branch hiện có trong organization-service."}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 md:grid-cols-2">
                        <Field label="Tên chi nhánh" htmlFor="branch-name">
                            <Input
                                id="branch-name"
                                value={dialogState?.values.BranchName || ""}
                                onChange={(event) => updateDialogField(setDialogState, "BranchName", event.target.value)}
                                placeholder="Head Office, Da Nang Branch..."
                            />
                        </Field>

                        <Field label="Thành phố" htmlFor="branch-city">
                            <Input
                                id="branch-city"
                                value={dialogState?.values.City || ""}
                                onChange={(event) => updateDialogField(setDialogState, "City", event.target.value)}
                                placeholder="Ho Chi Minh City"
                            />
                        </Field>

                        <div className="md:col-span-2">
                            <Field label="Địa chỉ" htmlFor="branch-address">
                                <Input
                                    id="branch-address"
                                    value={dialogState?.values.Address || ""}
                                    onChange={(event) => updateDialogField(setDialogState, "Address", event.target.value)}
                                    placeholder="Số nhà, đường, quận/huyện"
                                />
                            </Field>
                        </div>

                        <Field label="Quốc gia" htmlFor="branch-country">
                            <Input
                                id="branch-country"
                                value={dialogState?.values.Country || ""}
                                onChange={(event) => updateDialogField(setDialogState, "Country", event.target.value)}
                                placeholder="Vietnam"
                            />
                        </Field>

                        <div className="rounded-2xl border border-border bg-muted/30 p-4">
                            <p className="text-sm font-medium text-foreground">Company</p>
                            <p className="mt-2 text-sm text-muted-foreground">{company?.Name || "Không có dữ liệu"}</p>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setDialogState(null)} disabled={isSaving}>
                            Hủy
                        </Button>
                        <Button
                            type="button"
                            className="bg-primary hover:bg-primary/90"
                            disabled={isSaving}
                            onClick={() => dialogState?.mode === "create" ? createMutation.mutate() : updateMutation.mutate()}
                        >
                            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {dialogState?.mode === "create" ? "Tạo chi nhánh" : "Lưu thay đổi"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

function updateDialogField(
    setDialogState: React.Dispatch<React.SetStateAction<BranchDialogState | null>>,
    field: keyof BranchFormValues,
    value: string,
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

function normalizeBranchForm(values: BranchFormValues) {
    return {
        BranchName: values.BranchName.trim(),
        Address: values.Address.trim(),
        City: values.City.trim() || undefined,
        Country: values.Country.trim() || undefined,
    };
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

function InfoTile({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-xl border border-border p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
            <p className="mt-2 text-sm font-medium text-foreground">{value}</p>
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
