"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { toast } from "react-toastify";
import { accountService } from "@/services/account.service";
import { authService } from "@/services/auth.service";
import { useAuthStore } from "@/store/useAuthStore";
import { UserRoleLabel } from "@/types/admin";
import { AccountProfile } from "@/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
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
import { Textarea } from "@/components/ui/textarea";

type AccountDialogProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
};

type AccountFormState = {
    FullName: string;
    PhoneNumber: string;
    Bio: string;
};

export default function AccountDialog({
    open,
    onOpenChange,
}: AccountDialogProps) {
    const queryClient = useQueryClient();
    const { logout } = useAuthStore();
    const [isEditing, setIsEditing] = useState(false);
    const [form, setForm] = useState<AccountFormState>({
        FullName: "",
        PhoneNumber: "",
        Bio: "",
    });

    const { data: account, isLoading } = useQuery({
        queryKey: ["account-me"],
        queryFn: () => accountService.getMe(),
        enabled: open,
    });

    const updateProfileMutation = useMutation({
        mutationFn: () =>
            accountService.updateProfile({
                FullName: form.FullName.trim(),
                PhoneNumber: form.PhoneNumber.trim(),
                Bio: form.Bio.trim(),
            }),
        onSuccess: async () => {
            toast.success("Đã cập nhật thông tin tài khoản");
            setIsEditing(false);
            await invalidateAccountQueries(queryClient);
        },
        onError: () => toast.error("Không thể cập nhật tài khoản"),
    });

    const uploadAvatarMutation = useMutation({
        mutationFn: (file: File) => accountService.uploadAvatar(file),
        onSuccess: async () => {
            toast.success("Đã cập nhật ảnh đại diện");
            await invalidateAccountQueries(queryClient);
        },
        onError: () => toast.error("Không thể cập nhật ảnh đại diện"),
    });

    const signOutMutation = useMutation({
        mutationFn: async () => {
            try {
                await authService.signOut();
            } catch {
                // Always clear local auth state even if server revoke fails.
            }
        },
        onSuccess: () => {
            onOpenChange(false);
            queryClient.clear();
            logout();
            window.location.href = "/login";
        },
    });

    const profileRoute = useMemo(() => {
        if (!account) {
            return null;
        }

        if (account.Role === "candidate") {
            return "/candidate/profile";
        }

        if (account.Role === "recruiter") {
            return "/recruiter/profile";
        }

        return null;
    }, [account]);

    const summaryRows = useMemo(() => buildSummaryRows(account), [account]);
    const fallbackText = getInitials(account);

    const handleOpenChange = (nextOpen: boolean) => {
        if (!nextOpen) {
            setIsEditing(false);
        }

        onOpenChange(nextOpen);
    };

    const handleToggleEditing = () => {
        if (!account) {
            return;
        }

        if (isEditing) {
            setForm({
                FullName: account.FullName ?? "",
                PhoneNumber: account.PhoneNumber ?? "",
                Bio: account.Bio ?? "",
            });
            setIsEditing(false);
            return;
        }

        setForm({
            FullName: account.FullName ?? "",
            PhoneNumber: account.PhoneNumber ?? "",
            Bio: account.Bio ?? "",
        });
        setIsEditing(true);
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Tài khoản của bạn</DialogTitle>
                    <DialogDescription>
                        Xem nhanh thông tin tài khoản, cập nhật hồ sơ cơ bản và ảnh đại diện.
                    </DialogDescription>
                </DialogHeader>

                {isLoading ? (
                    <div className="flex min-h-[240px] items-center justify-center">
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                ) : account ? (
                    <div className="space-y-6">
                        <div className="flex flex-col gap-4 rounded-2xl border border-border bg-muted/70 p-5 sm:flex-row sm:items-start sm:justify-between">
                            <div className="flex items-center gap-4">
                                <Avatar size="lg" className="h-16 w-16 ring-4 ring-white">
                                    <AvatarImage src={account.AvatarUrl ?? undefined} alt={account.FullName ?? account.Email ?? "Account avatar"} />
                                    <AvatarFallback className="bg-primary text-base font-semibold text-white">
                                        {fallbackText}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="space-y-1">
                                    <p className="text-lg font-semibold text-foreground">
                                        {account.FullName || "Chưa cập nhật họ tên"}
                                    </p>
                                    <p className="text-sm text-muted-foreground">{account.Email || "Chưa có email"}</p>
                                    <div className="inline-flex rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                                        {UserRoleLabel[account.Role]}
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="account-avatar" className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                                    Ảnh đại diện
                                </Label>
                                <Input
                                    id="account-avatar"
                                    type="file"
                                    accept="image/*"
                                    onChange={(event) => {
                                        const file = event.target.files?.[0];
                                        if (file) {
                                            uploadAvatarMutation.mutate(file);
                                        }
                                        event.target.value = "";
                                    }}
                                    disabled={uploadAvatarMutation.isPending}
                                />
                                <p className="text-xs text-muted-foreground">
                                    {uploadAvatarMutation.isPending ? "Đang tải ảnh lên..." : "PNG, JPG hoặc WEBP."}
                                </p>
                            </div>
                        </div>

                        {isEditing ? (
                            <div className="grid gap-4 md:grid-cols-2">
                                <Field label="Họ và tên">
                                    <Input
                                        value={form.FullName}
                                        onChange={(event) =>
                                            setForm((current) => ({
                                                ...current,
                                                FullName: event.target.value,
                                            }))
                                        }
                                        className="h-11"
                                    />
                                </Field>

                                <Field label="Số điện thoại">
                                    <Input
                                        value={form.PhoneNumber}
                                        onChange={(event) =>
                                            setForm((current) => ({
                                                ...current,
                                                PhoneNumber: event.target.value,
                                            }))
                                        }
                                        className="h-11"
                                    />
                                </Field>

                                <div className="md:col-span-2">
                                    <Field label="Giới thiệu ngắn">
                                        <Textarea
                                            value={form.Bio}
                                            onChange={(event) =>
                                                setForm((current) => ({
                                                    ...current,
                                                    Bio: event.target.value,
                                                }))
                                            }
                                            rows={4}
                                            placeholder="Mô tả ngắn về bạn"
                                        />
                                    </Field>
                                </div>
                            </div>
                        ) : (
                            <div className="grid gap-3 sm:grid-cols-2">
                                {summaryRows.map((row) => (
                                    <div key={row.label} className="rounded-2xl border border-border p-4">
                                        <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                                            {row.label}
                                        </p>
                                        <p className="mt-2 text-sm font-medium text-foreground">
                                            {row.value}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="rounded-xl border border-amber-100 bg-amber-50/80 px-4 py-3 text-sm text-amber-900">
                        Không tải được thông tin tài khoản.
                    </div>
                )}

                <DialogFooter className="gap-2 sm:justify-between">
                    <div className="flex flex-col-reverse gap-2 sm:flex-row">
                        <Button
                            type="button"
                            variant="outline"
                            className="text-red-600 hover:bg-red-50 hover:text-red-700"
                            onClick={() => signOutMutation.mutate()}
                            disabled={signOutMutation.isPending}
                        >
                            {signOutMutation.isPending && (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            )}
                            Đăng xuất
                        </Button>
                        {profileRoute && (
                            <Button asChild variant="outline" onClick={() => onOpenChange(false)}>
                                <Link href={profileRoute}>Xem hồ sơ đầy đủ</Link>
                            </Button>
                        )}
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleToggleEditing}
                            disabled={!account || updateProfileMutation.isPending || signOutMutation.isPending}
                        >
                            {isEditing ? "Hủy chỉnh sửa" : "Chỉnh sửa nhanh"}
                        </Button>
                    </div>

                    {isEditing && (
                        <Button
                            type="button"
                            className="bg-primary hover:bg-primary/90"
                            onClick={() => updateProfileMutation.mutate()}
                            disabled={updateProfileMutation.isPending || signOutMutation.isPending}
                        >
                            {updateProfileMutation.isPending && (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            )}
                            Lưu thay đổi
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function Field({
    label,
    children,
}: {
    label: string;
    children: React.ReactNode;
}) {
    return (
        <div className="space-y-2">
            <Label>{label}</Label>
            {children}
        </div>
    );
}

function buildSummaryRows(account?: AccountProfile) {
    if (!account) {
        return [];
    }

    const rows = [
        {
            label: "Email",
            value: account.Email || "Chưa cập nhật",
            order: 0,
        },
        {
            label: "Số điện thoại",
            value: account.PhoneNumber || "Chưa cập nhật",
            order: 1,
        },
        {
            label: account.Role === "recruiter" ? "Phòng ban" : "Vai trò",
            value: account.Role === "recruiter"
                ? account.Department || "Chưa cập nhật"
                : UserRoleLabel[account.Role],
            order: 2,
        },
        {
            label: "Giới thiệu",
            value: account.Bio || "Chưa cập nhật",
            order: 3,
        },
    ];

    if (account.Role === "candidate") {
        rows.push(
            {
                label: "Headline",
                value: account.Headline || "Chưa cập nhật",
                order: 4,
            },
            {
                label: "Cấp độ",
                value: account.Level || "Chưa cập nhật",
                order: 5,
            },
        );
    }

    if (account.Role === "recruiter") {
        rows.push(
            {
                label: "Công ty",
                value: account.CompanyName || "Chưa cập nhật",
                order: 4,
            },
            {
                label: "Chi nhánh",
                value: account.BranchName || "Chưa cập nhật",
                order: 5,
            },
        );
    }

    return rows.sort((left, right) => left.order - right.order);
}

function getInitials(account?: AccountProfile) {
    const source = account?.FullName || account?.Email || "U";

    return source
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part.charAt(0).toUpperCase())
        .join("");
}

async function invalidateAccountQueries(queryClient: ReturnType<typeof useQueryClient>) {
    await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["account-me"] }),
        queryClient.invalidateQueries({ queryKey: ["candidate-profile"] }),
        queryClient.invalidateQueries({ queryKey: ["recruiter-profile"] }),
    ]);
}
