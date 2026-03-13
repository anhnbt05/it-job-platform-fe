"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { jobService } from "@/services/job.service";
import { JobDetail, CreateJobPayload, JobTypeLabel, LevelLabel } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Loader2, Save, Briefcase, FileText, DollarSign, MapPin, Calendar } from "lucide-react";
import { toast } from "react-toastify";
import Link from "next/link";

export default function EditJobPage() {
    const router = useRouter();
    const params = useParams();
    const jobId = params.id as string;
    const queryClient = useQueryClient();

    const { data: job } = useQuery({
        queryKey: ["job", jobId],
        queryFn: async () => {
            const res = await jobService.getJobById(jobId);
            return res as unknown as JobDetail;
        },
        enabled: !!jobId,
    });

    const [form, setForm] = useState({
        Title: "",
        Description: "",
        Vacancies: 1,
        Type: "",
        Level: "",
        Categories: "",
        JobDescriptions: "",
        JobRequirements: "",
        JobBenefits: "",
        WorkingTimes: "",
        Salary: "",
        Address: "",
        ExpiredAt: "",
    });

    useEffect(() => {
        if (job) {
            setForm({
                Title: job.Title || "",
                Description: job.Description || "",
                Vacancies: job.Vacancies || 1,
                Type: job.Type || "",
                Level: job.Level || "",
                Categories: job.Categories?.join("\n") || "",
                JobDescriptions: job.JobDescriptions?.join("\n") || "",
                JobRequirements: job.JobRequirements?.join("\n") || "",
                JobBenefits: job.JobBenefits?.join("\n") || "",
                WorkingTimes: job.WorkingTimes || "",
                Salary: job.Salary || "",
                Address: job.Address || "",
                ExpiredAt: job.ExpiredAt ? new Date(job.ExpiredAt).toISOString().split("T")[0] : "",
            });
        }
    }, [job]);

    const updateMutation = useMutation({
        mutationFn: (data: Partial<CreateJobPayload>) => jobService.updateJob(jobId, data),
        onSuccess: () => {
            toast.success("Cập nhật thành công!");
            queryClient.invalidateQueries({ queryKey: ["recruiter-jobs"] });
            router.push("/recruiter/manage-jobs");
        },
        onError: () => toast.error("Cập nhật thất bại"),
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const payload: Partial<CreateJobPayload> = {
            Title: form.Title.trim(),
            Description: form.Description.trim(),
            Vacancies: form.Vacancies,
            Type: form.Type,
            Level: form.Level,
            Categories: form.Categories.split("\n").map(s => s.trim()).filter(Boolean),
            JobDescriptions: form.JobDescriptions.split("\n").map(s => s.trim()).filter(Boolean),
            JobRequirements: form.JobRequirements.split("\n").map(s => s.trim()).filter(Boolean),
            JobBenefits: form.JobBenefits.split("\n").map(s => s.trim()).filter(Boolean),
            WorkingTimes: form.WorkingTimes.trim(),
            Salary: form.Salary.trim(),
            ExpiredAt: form.ExpiredAt,
        };
        updateMutation.mutate(payload);
    };

    return (
        <div className="mx-auto max-w-[800px]">
            <Link href="/recruiter/manage-jobs" className="mb-6 inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"><ArrowLeft size={16} /> Quay lại</Link>

            <form onSubmit={handleSubmit} className="space-y-6">
                <Card className="border-gray-100 shadow-sm">
                    <CardHeader className="pb-3"><CardTitle className="flex items-center gap-2 text-base"><Briefcase size={18} className="text-[#194d8e]" /> Thông tin cơ bản</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2"><Label>Tên công việc</Label><Input value={form.Title} onChange={(e) => setForm({ ...form, Title: e.target.value })} className="h-11" /></div>
                        <div className="space-y-2"><Label>Mô tả chung</Label><Textarea value={form.Description} onChange={(e) => setForm({ ...form, Description: e.target.value })} rows={3} /></div>
                        <div className="grid grid-cols-3 gap-4">
                            <div className="space-y-2"><Label>Số lượng</Label><Input type="number" min={1} value={form.Vacancies} onChange={(e) => setForm({ ...form, Vacancies: parseInt(e.target.value) || 1 })} className="h-11" /></div>
                            <div className="space-y-2"><Label>Hình thức</Label><Select value={form.Type} onValueChange={(val) => setForm({ ...form, Type: val })}><SelectTrigger className="h-11"><SelectValue /></SelectTrigger><SelectContent>{Object.entries(JobTypeLabel).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent></Select></div>
                            <div className="space-y-2"><Label>Cấp độ</Label><Select value={form.Level} onValueChange={(val) => setForm({ ...form, Level: val })}><SelectTrigger className="h-11"><SelectValue /></SelectTrigger><SelectContent>{Object.entries(LevelLabel).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent></Select></div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-gray-100 shadow-sm">
                    <CardHeader className="pb-3"><CardTitle className="flex items-center gap-2 text-base"><FileText size={18} className="text-[#194d8e]" /> Chi tiết</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2"><Label>Lĩnh vực (mỗi dòng 1)</Label><Textarea value={form.Categories} onChange={(e) => setForm({ ...form, Categories: e.target.value })} rows={3} /></div>
                        <div className="space-y-2"><Label>Mô tả công việc</Label><Textarea value={form.JobDescriptions} onChange={(e) => setForm({ ...form, JobDescriptions: e.target.value })} rows={4} /></div>
                        <div className="space-y-2"><Label>Yêu cầu</Label><Textarea value={form.JobRequirements} onChange={(e) => setForm({ ...form, JobRequirements: e.target.value })} rows={4} /></div>
                        <div className="space-y-2"><Label>Quyền lợi</Label><Textarea value={form.JobBenefits} onChange={(e) => setForm({ ...form, JobBenefits: e.target.value })} rows={4} /></div>
                    </CardContent>
                </Card>

                <Card className="border-gray-100 shadow-sm">
                    <CardHeader className="pb-3"><CardTitle className="flex items-center gap-2 text-base"><DollarSign size={18} className="text-[#194d8e]" /> Lương & Địa điểm</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2"><Label>Mức lương</Label><Input value={form.Salary} onChange={(e) => setForm({ ...form, Salary: e.target.value })} className="h-11" /></div>
                        <div className="space-y-2"><Label>Thời gian</Label><Input value={form.WorkingTimes} onChange={(e) => setForm({ ...form, WorkingTimes: e.target.value })} className="h-11" /></div>
                        <div className="space-y-2"><Label>Địa điểm</Label><div className="relative"><MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" /><Input value={form.Address} onChange={(e) => setForm({ ...form, Address: e.target.value })} className="h-11 pl-10" /></div></div>
                        <div className="space-y-2"><Label>Hạn nộp</Label><div className="relative"><Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" /><Input type="date" value={form.ExpiredAt} onChange={(e) => setForm({ ...form, ExpiredAt: e.target.value })} className="h-11 pl-10" /></div></div>
                    </CardContent>
                </Card>

                <Separator />
                <div className="flex gap-3">
                    <Button type="button" variant="outline" className="flex-1" onClick={() => router.back()}>Huỷ</Button>
                    <Button type="submit" disabled={updateMutation.isPending} className="flex-1 bg-[#194d8e] hover:bg-[#194d8e]/90">
                        {updateMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save size={16} className="mr-2" />}
                        Lưu thay đổi
                    </Button>
                </div>
            </form>
        </div>
    );
}
