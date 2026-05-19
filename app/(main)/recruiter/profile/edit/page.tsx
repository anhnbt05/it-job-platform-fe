"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { recruiterService } from "@/services/recruiter.service";
import { RecruiterInfo } from "@/types";
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
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useAuthStore } from "@/store/useAuthStore";
import {
    ArrowLeft,
    Building2,
    Globe,
    Loader2,
    MapPin,
    Save,
    Trash2,
    Upload,
    User,
} from "lucide-react";
import { toast } from "react-toastify";

type RecruiterProfileForm = {
    FullName: string;
    PhoneNumber: string;
    Department: string;
    Bio: string;
    CompanyName: string;
    CompanyLocation: string;
    CompanyWebsite: string;
    CompanyLogoUrl: string;
    CompanySize: string;
    BranchName: string;
    BranchAddress: string;
    BranchCity: string;
    BranchCountry: string;
};

export default function EditRecruiterProfilePage() {
    const { data: recruiter, isLoading } = useQuery({
        queryKey: ["recruiter-profile"],
        queryFn: () => recruiterService.getProfile(),
    });

    if (isLoading) {
        return (
            <div className="mx-auto max-w-[960px] space-y-6">
                <Skeleton className="h-[260px] rounded-xl" />
                <Skeleton className="h-[320px] rounded-xl" />
                <Skeleton className="h-[260px] rounded-xl" />
            </div>
        );
    }

    if (!recruiter) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <User size={48} className="mb-4 text-muted-foreground" />
                <p className="text-lg font-medium text-muted-foreground">Không tìm thấy hồ sơ nhà tuyển dụng</p>
            </div>
        );
    }

    return <RecruiterProfileFormCard recruiter={recruiter} />;
}

function RecruiterProfileFormCard({ recruiter }: { recruiter: RecruiterInfo }) {
    const router = useRouter();
    const queryClient = useQueryClient();
    const company = recruiter.Company;
    const branch = recruiter.CompanyLocations;
    const canEditCompany = Boolean(company?.ID);
    const canEditBranch = Boolean(branch?.ID);
    const [deleteAccountDialogOpen, setDeleteAccountDialogOpen] = useState(false);
    const [pendingAvatarFile, setPendingAvatarFile] = useState<File | null>(null);

    const [form, setForm] = useState<RecruiterProfileForm>({
        FullName: recruiter.FullName || "",
        PhoneNumber: recruiter.PhoneNumber || "",
        Department: recruiter.Department || "",
        Bio: recruiter.Bio || "",
        CompanyName: company?.Name || "",
        CompanyLocation: company?.Location || "",
        CompanyWebsite: company?.WebsiteUrl || "",
        CompanyLogoUrl: company?.LogoUrl || "",
        CompanySize: company?.Size ? String(company.Size) : "",
        BranchName: branch?.BranchName || "",
        BranchAddress: branch?.Address || "",
        BranchCity: branch?.City || "",
        BranchCountry: branch?.Country || "",
    });

    const updateMutation = useMutation({
        mutationFn: async () => {
            const normalizedCompanySize = parsePositiveInteger(form.CompanySize);

            if (form.CompanySize.trim() && normalizedCompanySize === null) {
                throw new Error("invalid_company_size");
            }

            const requests: Promise<unknown>[] = [
                recruiterService.updateProfile({
                    FullName: form.FullName.trim(),
                    PhoneNumber: form.PhoneNumber.trim(),
                    Department: form.Department.trim(),
                    Bio: form.Bio.trim(),
                }),
            ];

            if (company?.ID) {
                requests.push(
                    recruiterService.updateCompany(company.ID, {
                        Name: form.CompanyName,
                        Location: form.CompanyLocation,
                        WebsiteUrl: normalizeWebsiteUrl(form.CompanyWebsite),
                        LogoUrl: form.CompanyLogoUrl,
                        Size: normalizedCompanySize ?? undefined,
                    }),
                );
            }

            if (branch?.ID) {
                requests.push(
                    recruiterService.updateBranch(branch.ID, {
                        BranchName: form.BranchName,
                        Address: form.BranchAddress,
                        City: form.BranchCity,
                        Country: form.BranchCountry,
                    }),
                );
            }

            await Promise.all(requests);

            if (pendingAvatarFile) {
                await recruiterService.uploadAvatar(pendingAvatarFile);
            }
        },
        onSuccess: () => {
            toast.success("Đã cập nhật hồ sơ recruiter, công ty và chi nhánh");
            setPendingAvatarFile(null);
            queryClient.invalidateQueries({ queryKey: ["recruiter-profile"] });
            router.push("/recruiter/profile");
        },
        onError: (error) => {
            if (error instanceof Error && error.message === "invalid_company_size") {
                toast.error("Quy mô công ty phải là số nguyên dương");
                return;
            }

            toast.error("Không thể cập nhật thông tin recruiter");
        },
    });

    const deleteAccountMutation = useMutation({
        mutationFn: () => recruiterService.deleteAccount(),
        onSuccess: () => {
            setDeleteAccountDialogOpen(false);
            queryClient.clear();
            useAuthStore.getState().logout();
            toast.success("Tài khoản đã được xóa. Đang chuyển về trang đăng nhập...");

            if (typeof window !== "undefined") {
                window.setTimeout(() => {
                    window.location.href = "/login";
                }, 1200);
            }
        },
        onError: () => toast.error("Không thể xóa tài khoản"),
    });

    const handleSubmit = (event: React.FormEvent) => {
        event.preventDefault();
        updateMutation.mutate();
    };

    return (
        <div className="mx-auto max-w-[960px]">
            <Link href="/recruiter/profile" className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
                <ArrowLeft size={16} />
                Quay lại hồ sơ
            </Link>

            <form onSubmit={handleSubmit} className="space-y-6">
                <Card className="border-border shadow-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <User size={20} className="text-primary" />
                            Hồ sơ recruiter
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-5">
                        <div className="grid gap-5 md:grid-cols-2">
                            <Field label="Ảnh đại diện">
                                <div className="rounded-xl border border-dashed border-border bg-muted/80 p-4">
                                    <Input
                                        type="file"
                                        accept="image/*"
                                        onChange={(event) => {
                                            const file = event.target.files?.[0];
                                            if (file) {
                                                setPendingAvatarFile(file);
                                            }
                                            event.target.value = "";
                                        }}
                                        disabled={updateMutation.isPending}
                                    />
                                    <p className="mt-2 text-xs text-muted-foreground">
                                        {pendingAvatarFile
                                            ? `Đã chọn: ${pendingAvatarFile.name}. Ảnh sẽ được tải lên khi bạn bấm Lưu thay đổi.`
                                            : "Chọn ảnh mới để cập nhật avatar recruiter."}
                                    </p>
                                </div>
                            </Field>

                            <Field label="Email">
                                <Input value={recruiter.Email || ""} disabled className="h-11 bg-muted/40 text-muted-foreground" />
                            </Field>
                        </div>

                        <Separator />

                        <div className="grid gap-5 md:grid-cols-2">
                            <Field label="Họ và tên">
                                <Input
                                    value={form.FullName}
                                    onChange={(event) => setForm((current) => ({ ...current, FullName: event.target.value }))}
                                    className="h-11"
                                />
                            </Field>

                            <Field label="Số điện thoại">
                                <Input
                                    value={form.PhoneNumber}
                                    onChange={(event) => setForm((current) => ({ ...current, PhoneNumber: event.target.value }))}
                                    className="h-11"
                                />
                            </Field>
                        </div>

                        <Field label="Phòng ban / bộ phận">
                            <Input
                                value={form.Department}
                                onChange={(event) => setForm((current) => ({ ...current, Department: event.target.value }))}
                                className="h-11"
                                placeholder="Talent Acquisition, HR, Hiring Team..."
                            />
                        </Field>

                        <Field label="Giới thiệu ngắn">
                            <Textarea
                                value={form.Bio}
                                onChange={(event) => setForm((current) => ({ ...current, Bio: event.target.value }))}
                                rows={5}
                                placeholder="Giới thiệu ngắn về vai trò tuyển dụng, đội ngũ hoặc phạm vi công việc của bạn"
                            />
                        </Field>
                    </CardContent>
                </Card>

                <Card className="border-border shadow-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <Building2 size={20} className="text-primary" />
                            Quản lý công ty
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-5">
                        {!canEditCompany && (
                            <Notice>
                                Tài khoản hiện chưa liên kết company ID nên chưa thể cập nhật công ty từ màn này.
                            </Notice>
                        )}

                        <div className="grid gap-5 md:grid-cols-2">
                            <Field label="Tên công ty">
                                <Input
                                    value={form.CompanyName}
                                    onChange={(event) => setForm((current) => ({ ...current, CompanyName: event.target.value }))}
                                    className="h-11"
                                    disabled={!canEditCompany}
                                    placeholder="Tên công ty"
                                />
                            </Field>

                            <Field label="Quy mô công ty">
                                <Input
                                    type="number"
                                    min={1}
                                    value={form.CompanySize}
                                    onChange={(event) => setForm((current) => ({ ...current, CompanySize: event.target.value }))}
                                    className="h-11"
                                    disabled={!canEditCompany}
                                    placeholder="Ví dụ: 200"
                                />
                            </Field>
                        </div>

                        <div className="grid gap-5 md:grid-cols-2">
                            <Field label="Địa điểm công ty">
                                <div className="relative">
                                    <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        value={form.CompanyLocation}
                                        onChange={(event) => setForm((current) => ({ ...current, CompanyLocation: event.target.value }))}
                                        className="h-11 pl-10"
                                        disabled={!canEditCompany}
                                        placeholder="Ho Chi Minh City, Vietnam"
                                    />
                                </div>
                            </Field>

                            <Field label="Website công ty">
                                <div className="relative">
                                    <Globe className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        value={form.CompanyWebsite}
                                        onChange={(event) => setForm((current) => ({ ...current, CompanyWebsite: event.target.value }))}
                                        className="h-11 pl-10"
                                        disabled={!canEditCompany}
                                        placeholder="https://company.com"
                                    />
                                </div>
                            </Field>
                        </div>

                        <Field label="Logo URL">
                            <div className="relative">
                                <Upload className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    value={form.CompanyLogoUrl}
                                    onChange={(event) => setForm((current) => ({ ...current, CompanyLogoUrl: event.target.value }))}
                                    className="h-11 pl-10"
                                    disabled={!canEditCompany}
                                    placeholder="https://cdn.example.com/company-logo.png"
                                />
                            </div>
                        </Field>

                        <Notice tone="neutral">
                            API hiện cho cập nhật tên, location, website, logo và size. Mô tả công ty vẫn đang là dữ liệu hiển thị read-only.
                        </Notice>
                    </CardContent>
                </Card>

                <Card className="border-border shadow-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <MapPin size={20} className="text-primary" />
                            Quản lý chi nhánh
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-5">
                        {!canEditBranch && (
                            <Notice>
                                Tài khoản hiện chưa liên kết branch ID nên chưa thể cập nhật chi nhánh từ màn này.
                            </Notice>
                        )}

                        <div className="grid gap-5 md:grid-cols-2">
                            <Field label="Tên chi nhánh">
                                <Input
                                    value={form.BranchName}
                                    onChange={(event) => setForm((current) => ({ ...current, BranchName: event.target.value }))}
                                    className="h-11"
                                    disabled={!canEditBranch}
                                    placeholder="Head Office, HCM Branch..."
                                />
                            </Field>

                            <Field label="Thành phố">
                                <Input
                                    value={form.BranchCity}
                                    onChange={(event) => setForm((current) => ({ ...current, BranchCity: event.target.value }))}
                                    className="h-11"
                                    disabled={!canEditBranch}
                                    placeholder="Ho Chi Minh City"
                                />
                            </Field>
                        </div>

                        <div className="grid gap-5 md:grid-cols-2">
                            <Field label="Địa chỉ">
                                <Input
                                    value={form.BranchAddress}
                                    onChange={(event) => setForm((current) => ({ ...current, BranchAddress: event.target.value }))}
                                    className="h-11"
                                    disabled={!canEditBranch}
                                    placeholder="Số nhà, đường, quận..."
                                />
                            </Field>

                            <Field label="Quốc gia">
                                <Input
                                    value={form.BranchCountry}
                                    onChange={(event) => setForm((current) => ({ ...current, BranchCountry: event.target.value }))}
                                    className="h-11"
                                    disabled={!canEditBranch}
                                    placeholder="Vietnam"
                                />
                            </Field>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-red-100 bg-red-50/40 shadow-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base text-red-700">
                            <Trash2 size={18} />
                            Vùng nguy hiểm
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div className="space-y-1">
                            <p className="font-medium text-foreground">Xóa vĩnh viễn tài khoản</p>
                            <p className="text-sm text-muted-foreground">
                                Thao tác này sẽ xóa tài khoản recruiter hiện tại và không thể khôi phục.
                            </p>
                        </div>
                        <Button
                            type="button"
                            variant="destructive"
                            onClick={() => setDeleteAccountDialogOpen(true)}
                            disabled={deleteAccountMutation.isPending}
                        >
                            <Trash2 size={16} className="mr-2" />
                            Xóa tài khoản
                        </Button>
                    </CardContent>
                </Card>

                <div className="flex gap-3 pt-2">
                    <Button
                        type="button"
                        variant="outline"
                        className="flex-1"
                        onClick={() => router.back()}
                        disabled={deleteAccountMutation.isPending}
                    >
                        Hủy
                    </Button>
                    <Button
                        type="submit"
                        disabled={updateMutation.isPending || deleteAccountMutation.isPending}
                        className="flex-1 bg-primary hover:bg-primary/90"
                    >
                        {updateMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save size={16} className="mr-2" />}
                        Lưu thay đổi
                    </Button>
                </div>
            </form>

            <Dialog
                open={deleteAccountDialogOpen}
                onOpenChange={(open) => {
                    if (!deleteAccountMutation.isPending) {
                        setDeleteAccountDialogOpen(open);
                    }
                }}
            >
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Xóa tài khoản recruiter?</DialogTitle>
                        <DialogDescription>
                            Sau khi xác nhận, tài khoản của bạn sẽ bị xóa vĩnh viễn và không thể khôi phục.
                        </DialogDescription>
                    </DialogHeader>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setDeleteAccountDialogOpen(false)}
                            disabled={deleteAccountMutation.isPending}
                        >
                            Hủy
                        </Button>
                        <Button
                            type="button"
                            variant="destructive"
                            onClick={() => deleteAccountMutation.mutate()}
                            disabled={deleteAccountMutation.isPending}
                        >
                            {deleteAccountMutation.isPending && (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            )}
                            Xóa vĩnh viễn
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="space-y-2">
            <Label>{label}</Label>
            {children}
        </div>
    );
}

function Notice({
    children,
    tone = "info",
}: {
    children: React.ReactNode;
    tone?: "info" | "neutral";
}) {
    const className = tone === "neutral"
        ? "border-border bg-muted/40 text-muted-foreground"
        : "border-blue-100 bg-blue-50/70 text-blue-900";

    return (
        <div className={`rounded-xl border p-4 text-sm ${className}`}>
            {children}
        </div>
    );
}

function parsePositiveInteger(value: string) {
    const trimmed = value.trim();

    if (!trimmed) {
        return undefined;
    }

    const parsedValue = Number(trimmed);
    if (!Number.isInteger(parsedValue) || parsedValue <= 0) {
        return null;
    }

    return parsedValue;
}

function normalizeWebsiteUrl(value: string) {
    const trimmed = value.trim();

    if (!trimmed) {
        return undefined;
    }

    return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}
