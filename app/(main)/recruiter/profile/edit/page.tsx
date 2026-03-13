"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { recruiterService } from "@/services/recruiter.service";
import { RecruiterInfo } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Save, Loader2, User, Phone, Briefcase } from "lucide-react";
import { toast } from "react-toastify";
import Link from "next/link";

export default function EditRecruiterProfilePage() {
    const router = useRouter();
    const queryClient = useQueryClient();

    const { data: recruiter } = useQuery({
        queryKey: ["recruiter-profile"],
        queryFn: async () => {
            const res = await recruiterService.getProfile();
            return res as unknown as RecruiterInfo;
        },
    });

    const [form, setForm] = useState({
        FullName: recruiter?.FullName || "",
        PhoneNumber: recruiter?.PhoneNumber || "",
        Position: recruiter?.Position || "",
    });

    const updateMutation = useMutation({
        mutationFn: (data: Partial<RecruiterInfo>) => recruiterService.updateProfile(data),
        onSuccess: () => {
            toast.success("Cập nhật thành công!");
            queryClient.invalidateQueries({ queryKey: ["recruiter-profile"] });
            router.push("/recruiter/profile");
        },
        onError: () => toast.error("Cập nhật thất bại"),
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        updateMutation.mutate(form as Partial<RecruiterInfo>);
    };

    return (
        <div className="mx-auto max-w-[700px]">
            <Link href="/recruiter/profile" className="mb-6 inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700">
                <ArrowLeft size={16} /> Quay lại hồ sơ
            </Link>

            <Card className="border-gray-100 shadow-sm">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg"><User size={20} className="text-[#194d8e]" /> Chỉnh sửa hồ sơ</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-2">
                            <Label>Họ và tên</Label>
                            <div className="relative"><User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                                <Input value={form.FullName} onChange={(e) => setForm({ ...form, FullName: e.target.value })} className="h-11 pl-10" /></div>
                        </div>
                        <div className="space-y-2">
                            <Label>Số điện thoại</Label>
                            <div className="relative"><Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                                <Input value={form.PhoneNumber} onChange={(e) => setForm({ ...form, PhoneNumber: e.target.value })} className="h-11 pl-10" /></div>
                        </div>
                        <div className="space-y-2">
                            <Label>Chức vụ</Label>
                            <div className="relative"><Briefcase className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                                <Input value={form.Position} onChange={(e) => setForm({ ...form, Position: e.target.value })} className="h-11 pl-10" /></div>
                        </div>
                        <div className="flex gap-3 pt-2">
                            <Button type="button" variant="outline" className="flex-1" onClick={() => router.back()}>Huỷ</Button>
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
