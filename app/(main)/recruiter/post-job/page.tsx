"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { jobService } from "@/services/job.service";
import { CreateJobPayload, JobTypeLabel, LevelLabel } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Loader2, Send, Briefcase, FileText, DollarSign, MapPin, Calendar } from "lucide-react";
import { toast } from "react-toastify";
import Link from "next/link";

export default function PostJobPage() {
    const router = useRouter();
    const [form, setForm] = useState({
        Title: "",
        Description: "",
        Vacancies: 1,
        Type: "" as string,
        Level: "" as string,
        Categories: "",
        JobDescriptions: "",
        JobRequirements: "",
        JobBenefits: "",
        WorkingTimes: "",
        Salary: "",
        SalaryType: "negotiable",
        SalaryMin: "",
        SalaryMax: "",
        Address: "",
        ExpiredAt: "",
    });

    const createMutation = useMutation({
        mutationFn: (data: CreateJobPayload) => jobService.createJob(data),
        onSuccess: () => {
            toast.success("Đã đăng tin tuyển dụng thành công!");
            router.push("/recruiter/manage-jobs");
        },
        onError: () => toast.error("Đăng tin thất bại"),
    });

    const computeSalary = () => {
        switch (form.SalaryType) {
            case "negotiable": return "Thỏa thuận";
            case "fixed": return form.SalaryMin ? `${form.SalaryMin} VNĐ` : "Thỏa thuận";
            case "max": return form.SalaryMax ? `Tối đa ${form.SalaryMax} VNĐ` : "Thỏa thuận";
            case "range": return form.SalaryMin && form.SalaryMax ? `${form.SalaryMin} - ${form.SalaryMax} VNĐ` : "Thỏa thuận";
            default: return "Thỏa thuận";
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (
            !form.Title.trim() ||
            !form.Type ||
            !form.Level ||
            !form.Address.trim() ||
            !form.WorkingTimes.trim() ||
            !form.ExpiredAt
        ) {
            toast.error("Vui lòng điền đầy đủ thông tin bắt buộc");
            return;
        }

        const categories = form.Categories.split("\n").map((s) => s.trim()).filter(Boolean);
        const descriptions = form.JobDescriptions.split("\n").map((s) => s.trim()).filter(Boolean);
        const requirements = form.JobRequirements.split("\n").map((s) => s.trim()).filter(Boolean);
        const benefits = form.JobBenefits.split("\n").map((s) => s.trim()).filter(Boolean);

        if (categories.length === 0 || descriptions.length === 0 || requirements.length === 0 || benefits.length === 0) {
            toast.error("Vui lòng nhập ít nhất 1 dòng cho danh mục, mô tả, yêu cầu và quyền lợi");
            return;
        }

        const payload: CreateJobPayload = {
            Title: form.Title.trim(),
            Description: form.Description.trim(),
            Address: form.Address.trim(),
            Vacancies: form.Vacancies,
            Type: form.Type,
            Level: form.Level,
            Categories: categories,
            JobDescriptions: descriptions,
            JobRequirements: requirements,
            JobBenefits: benefits,
            WorkingTimes: form.WorkingTimes.trim(),
            Salary: computeSalary(),
            ExpiredAt: form.ExpiredAt,
        };

        createMutation.mutate(payload);
    };

    return (
        <div className="mx-auto max-w-[800px]">
            <Link href="/recruiter/manage-jobs" className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
                <ArrowLeft size={16} /> Quay lại
            </Link>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Info */}
                <Card className="border-border shadow-sm">
                    <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-base">
                            <Briefcase size={18} className="text-primary" /> Thông tin cơ bản
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Tên công việc *</Label>
                            <Input value={form.Title} onChange={(e) => setForm({ ...form, Title: e.target.value })} placeholder="VD: Frontend Developer" className="h-11" />
                        </div>

                        <div className="space-y-2">
                            <Label>Mô tả chung</Label>
                            <Textarea value={form.Description} onChange={(e) => setForm({ ...form, Description: e.target.value })} placeholder="Mô tả ngắn gọn về vị trí tuyển dụng..." rows={3} />
                        </div>

                        <div className="grid gap-4 md:grid-cols-[180px_minmax(0,1fr)_minmax(0,1fr)]">
                            <div className="space-y-2">
                                <Label>Số lượng</Label>
                                <Input type="number" min={1} value={form.Vacancies} onChange={(e) => setForm({ ...form, Vacancies: parseInt(e.target.value) || 1 })} className="h-11" />
                            </div>
                            <div className="space-y-2">
                                <Label>Hình thức *</Label>
                                <Select value={form.Type} onValueChange={(val) => setForm({ ...form, Type: val })}>
                                    <SelectTrigger className="h-11 w-full"><SelectValue placeholder="Chọn" /></SelectTrigger>
                                    <SelectContent>
                                        {Object.entries(JobTypeLabel).map(([key, label]) => (
                                            <SelectItem key={key} value={key}>{label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Cấp độ *</Label>
                                <Select value={form.Level} onValueChange={(val) => setForm({ ...form, Level: val })}>
                                    <SelectTrigger className="h-11 w-full"><SelectValue placeholder="Chọn" /></SelectTrigger>
                                    <SelectContent>
                                        {Object.entries(LevelLabel).map(([key, label]) => (
                                            <SelectItem key={key} value={key}>{label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Detail */}
                <Card className="border-border shadow-sm">
                    <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-base">
                            <FileText size={18} className="text-primary" /> Chi tiết công việc
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Lĩnh vực (mỗi dòng 1 lĩnh vực)</Label>
                            <Textarea value={form.Categories} onChange={(e) => setForm({ ...form, Categories: e.target.value })} placeholder={"VD:\nReactJS\nNodeJS\nTypeScript"} rows={3} />
                        </div>
                        <div className="space-y-2">
                            <Label>Mô tả công việc (mỗi dòng 1 mục)</Label>
                            <Textarea value={form.JobDescriptions} onChange={(e) => setForm({ ...form, JobDescriptions: e.target.value })} placeholder={"VD:\nPhát triển giao diện người dùng\nTối ưu hiệu năng ứng dụng"} rows={4} />
                        </div>
                        <div className="space-y-2">
                            <Label>Yêu cầu (mỗi dòng 1 mục)</Label>
                            <Textarea value={form.JobRequirements} onChange={(e) => setForm({ ...form, JobRequirements: e.target.value })} placeholder={"VD:\nTối thiểu 2 năm kinh nghiệm\nThành thạo ReactJS"} rows={4} />
                        </div>
                        <div className="space-y-2">
                            <Label>Quyền lợi (mỗi dòng 1 mục)</Label>
                            <Textarea value={form.JobBenefits} onChange={(e) => setForm({ ...form, JobBenefits: e.target.value })} placeholder={"VD:\nLương thưởng hấp dẫn\nBảo hiểm sức khỏe"} rows={4} />
                        </div>
                    </CardContent>
                </Card>

                {/* Salary & Location */}
                <Card className="border-border shadow-sm">
                    <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-base">
                            <DollarSign size={18} className="text-primary" /> Lương & Địa điểm
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Loại lương</Label>
                            <Select value={form.SalaryType} onValueChange={(val) => setForm({ ...form, SalaryType: val })}>
                                <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="negotiable">Thỏa thuận</SelectItem>
                                    <SelectItem value="fixed">Cố định</SelectItem>
                                    <SelectItem value="max">Tối đa</SelectItem>
                                    <SelectItem value="range">Khoảng</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {form.SalaryType !== "negotiable" && (
                            <div className="grid gap-4 md:grid-cols-2">
                                {(form.SalaryType === "fixed" || form.SalaryType === "range") && (
                                    <div className="space-y-2">
                                        <Label>{form.SalaryType === "range" ? "Lương tối thiểu" : "Mức lương"}</Label>
                                        <Input value={form.SalaryMin} onChange={(e) => setForm({ ...form, SalaryMin: e.target.value })} placeholder="VD: 15,000,000" className="h-11" />
                                    </div>
                                )}
                                {(form.SalaryType === "max" || form.SalaryType === "range") && (
                                    <div className="space-y-2">
                                        <Label>Lương tối đa</Label>
                                        <Input value={form.SalaryMax} onChange={(e) => setForm({ ...form, SalaryMax: e.target.value })} placeholder="VD: 30,000,000" className="h-11" />
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label>Thời gian làm việc <span className="text-red-500">*</span></Label>
                            <Input value={form.WorkingTimes} onChange={(e) => setForm({ ...form, WorkingTimes: e.target.value })} placeholder="VD: Thứ 2 - Thứ 6, 8:00 - 17:00" className="h-11" />
                        </div>

                        <div className="space-y-2">
                            <Label>Địa điểm làm việc <span className="text-red-500">*</span></Label>
                            <div className="relative">
                                <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <Input value={form.Address} onChange={(e) => setForm({ ...form, Address: e.target.value })} placeholder="VD: Quận 1, TP. Hồ Chí Minh" className="h-11 pl-10" />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Hạn nộp đơn <span className="text-red-500">*</span></Label>
                            <div className="relative">
                                <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <Input type="date" value={form.ExpiredAt} onChange={(e) => setForm({ ...form, ExpiredAt: e.target.value })} className="h-11 pl-10" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Separator />

                <div className="flex gap-3">
                    <Button type="button" variant="outline" className="flex-1" onClick={() => router.back()}>Huỷ</Button>
                    <Button type="submit" disabled={createMutation.isPending} className="flex-1 bg-primary hover:bg-primary/90">
                        {createMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send size={16} className="mr-2" />}
                        Đăng tin tuyển dụng
                    </Button>
                </div>
            </form>
        </div>
    );
}
