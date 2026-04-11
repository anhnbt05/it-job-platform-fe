"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { recruiterService } from "@/services/recruiter.service";
import { RecruiterInfo } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Building2, Loader2, Save, User } from "lucide-react";
import { toast } from "react-toastify";

type RecruiterProfileForm = {
    FullName: string;
    PhoneNumber: string;
    Department: string;
    Bio: string;
};

export default function EditRecruiterProfilePage() {
    const { data: recruiter, isLoading } = useQuery({
        queryKey: ["recruiter-profile"],
        queryFn: () => recruiterService.getProfile(),
    });

    if (isLoading) {
        return (
            <div className="mx-auto max-w-[760px] space-y-6">
                <Skeleton className="h-[480px] rounded-xl" />
            </div>
        );
    }

    if (!recruiter) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <User size={48} className="mb-4 text-gray-300" />
                <p className="text-lg font-medium text-gray-500">Không tìm thấy hồ sơ nhà tuyển dụng</p>
            </div>
        );
    }

    return <RecruiterProfileFormCard recruiter={recruiter} />;
}

function RecruiterProfileFormCard({ recruiter }: { recruiter: RecruiterInfo }) {
    const router = useRouter();
    const queryClient = useQueryClient();
    const [form, setForm] = useState<RecruiterProfileForm>({
        FullName: recruiter.FullName || "",
        PhoneNumber: recruiter.PhoneNumber || "",
        Department: recruiter.Department || "",
        Bio: recruiter.Bio || "",
    });

    const updateMutation = useMutation({
        mutationFn: () =>
            recruiterService.updateProfile({
                FullName: form.FullName.trim(),
                PhoneNumber: form.PhoneNumber.trim(),
                Department: form.Department.trim(),
                Bio: form.Bio.trim(),
            }),
        onSuccess: () => {
            toast.success("Đã cập nhật hồ sơ nhà tuyển dụng");
            queryClient.invalidateQueries({ queryKey: ["recruiter-profile"] });
            router.push("/recruiter/profile");
        },
        onError: () => toast.error("Không thể cập nhật hồ sơ"),
    });

    const uploadAvatarMutation = useMutation({
        mutationFn: (file: File) => recruiterService.uploadAvatar(file),
        onSuccess: () => {
            toast.success("Đã cập nhật ảnh đại diện");
            queryClient.invalidateQueries({ queryKey: ["recruiter-profile"] });
        },
        onError: () => toast.error("Không thể tải ảnh đại diện"),
    });

    const handleSubmit = (event: React.FormEvent) => {
        event.preventDefault();
        updateMutation.mutate();
    };

    return (
        <div className="mx-auto max-w-[760px]">
            <Link href="/recruiter/profile" className="mb-6 inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700">
                <ArrowLeft size={16} />
                Quay lại hồ sơ
            </Link>

            <Card className="border-gray-100 shadow-sm">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <User size={20} className="text-[#194d8e]" />
                        Chỉnh sửa hồ sơ recruiter
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <Field label="Ảnh đại diện">
                            <Input
                                type="file"
                                accept="image/*"
                                onChange={(event) => {
                                    const file = event.target.files?.[0];
                                    if (file) {
                                        uploadAvatarMutation.mutate(file);
                                    }
                                }}
                            />
                            <p className="text-xs text-gray-400">
                                {uploadAvatarMutation.isPending ? "Đang tải ảnh..." : "Chọn ảnh mới để cập nhật avatar."}
                            </p>
                        </Field>

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

                        <Field label="Phòng ban / bộ phận">
                            <div className="relative">
                                <Building2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                                <Input
                                    value={form.Department}
                                    onChange={(event) => setForm((current) => ({ ...current, Department: event.target.value }))}
                                    className="h-11 pl-10"
                                    placeholder="Talent Acquisition, HR, Hiring Team..."
                                />
                            </div>
                        </Field>

                        <Field label="Giới thiệu ngắn">
                            <Textarea
                                value={form.Bio}
                                onChange={(event) => setForm((current) => ({ ...current, Bio: event.target.value }))}
                                rows={5}
                                placeholder="Giới thiệu ngắn về vai trò tuyển dụng, đội ngũ hoặc phạm vi công việc của bạn"
                            />
                        </Field>

                        <div className="rounded-xl border border-blue-100 bg-blue-50/70 p-4 text-sm text-blue-900">
                            Email, công ty và chi nhánh hiện đang lấy trực tiếp từ tài khoản đã liên kết ở backend.
                        </div>

                        <div className="flex gap-3 pt-2">
                            <Button type="button" variant="outline" className="flex-1" onClick={() => router.back()}>
                                Hủy
                            </Button>
                            <Button type="submit" disabled={updateMutation.isPending} className="flex-1 bg-[#194d8e] hover:bg-[#194d8e]/90">
                                {updateMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save size={16} className="mr-2" />}
                                Lưu thay đổi
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
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
