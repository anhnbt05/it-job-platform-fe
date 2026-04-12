"use client";

import Link from "next/link";
import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { jobService } from "@/services/job.service";
import { CreateJobPayload, JobDetail, JobTypeLabel, LevelLabel } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Briefcase, Calendar, DollarSign, FileText, Loader2, MapPin, Save } from "lucide-react";
import { toast } from "react-toastify";

type JobFormState = {
    Title: string;
    Description: string;
    Vacancies: number;
    Type: string;
    Level: string;
    Categories: string;
    JobDescriptions: string;
    JobRequirements: string;
    JobBenefits: string;
    WorkingTimes: string;
    Salary: string;
    Address: string;
    ExpiredAt: string;
};

export default function EditJobPage() {
    const params = useParams();
    const jobId = params.id as string;

    const { data: job, isLoading } = useQuery({
        queryKey: ["job", jobId],
        queryFn: () => jobService.getJobById(jobId),
        enabled: !!jobId,
    });

    if (isLoading) {
        return (
            <div className="mx-auto max-w-[800px] space-y-6">
                <Skeleton className="h-[620px] rounded-xl" />
            </div>
        );
    }

    if (!job) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <Briefcase size={48} className="mb-4 text-muted-foreground" />
                <p className="text-lg font-medium text-muted-foreground">Không tìm thấy tin tuyển dụng</p>
            </div>
        );
    }

    return <EditJobForm job={job} jobId={jobId} />;
}

function EditJobForm({ job, jobId }: { job: JobDetail; jobId: string }) {
    const router = useRouter();
    const queryClient = useQueryClient();
    const [form, setForm] = useState<JobFormState>({
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
        ExpiredAt: job.ExpiredAt ? new Date(job.ExpiredAt).toISOString().slice(0, 10) : "",
    });

    const updateMutation = useMutation({
        mutationFn: (data: Partial<CreateJobPayload>) => jobService.updateJob(jobId, data),
        onSuccess: () => {
            toast.success("Cập nhật thành công!");
            queryClient.invalidateQueries({ queryKey: ["recruiter-jobs"] });
            queryClient.invalidateQueries({ queryKey: ["job", jobId] });
            router.push("/recruiter/manage-jobs");
        },
        onError: () => toast.error("Cập nhật thất bại"),
    });

    const handleSubmit = (event: React.FormEvent) => {
        event.preventDefault();

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

        const categories = splitLines(form.Categories);
        const descriptions = splitLines(form.JobDescriptions);
        const requirements = splitLines(form.JobRequirements);
        const benefits = splitLines(form.JobBenefits);

        if (categories.length === 0 || descriptions.length === 0 || requirements.length === 0 || benefits.length === 0) {
            toast.error("Vui lòng nhập ít nhất 1 dòng cho danh mục, mô tả, yêu cầu và quyền lợi");
            return;
        }

        updateMutation.mutate({
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
            Salary: form.Salary.trim(),
            ExpiredAt: form.ExpiredAt,
        });
    };

    return (
        <div className="mx-auto max-w-[800px]">
            <Link href="/recruiter/manage-jobs" className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
                <ArrowLeft size={16} />
                Quay lại
            </Link>

            <form onSubmit={handleSubmit} className="space-y-6">
                <Card className="border-border shadow-sm">
                    <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-base">
                            <Briefcase size={18} className="text-primary" />
                            Thông tin cơ bản
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Tên công việc</Label>
                            <Input value={form.Title} onChange={(event) => setForm((current) => ({ ...current, Title: event.target.value }))} className="h-11" />
                        </div>
                        <div className="space-y-2">
                            <Label>Mô tả chung</Label>
                            <Textarea value={form.Description} onChange={(event) => setForm((current) => ({ ...current, Description: event.target.value }))} rows={3} />
                        </div>
                        <div className="grid gap-4 md:grid-cols-[180px_minmax(0,1fr)_minmax(0,1fr)]">
                            <div className="space-y-2">
                                <Label>Số lượng</Label>
                                <Input type="number" min={1} value={form.Vacancies} onChange={(event) => setForm((current) => ({ ...current, Vacancies: parseInt(event.target.value, 10) || 1 }))} className="h-11" />
                            </div>
                            <div className="space-y-2">
                                <Label>Hình thức</Label>
                                <Select value={form.Type} onValueChange={(value) => setForm((current) => ({ ...current, Type: value }))}>
                                    <SelectTrigger className="h-11 w-full">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {Object.entries(JobTypeLabel).map(([key, label]) => (
                                            <SelectItem key={key} value={key}>{label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Cấp độ</Label>
                                <Select value={form.Level} onValueChange={(value) => setForm((current) => ({ ...current, Level: value }))}>
                                    <SelectTrigger className="h-11 w-full">
                                        <SelectValue />
                                    </SelectTrigger>
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

                <Card className="border-border shadow-sm">
                    <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-base">
                            <FileText size={18} className="text-primary" />
                            Chi tiết
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Lĩnh vực (mỗi dòng 1)</Label>
                            <Textarea value={form.Categories} onChange={(event) => setForm((current) => ({ ...current, Categories: event.target.value }))} rows={3} />
                        </div>
                        <div className="space-y-2">
                            <Label>Mô tả công việc</Label>
                            <Textarea value={form.JobDescriptions} onChange={(event) => setForm((current) => ({ ...current, JobDescriptions: event.target.value }))} rows={4} />
                        </div>
                        <div className="space-y-2">
                            <Label>Yêu cầu</Label>
                            <Textarea value={form.JobRequirements} onChange={(event) => setForm((current) => ({ ...current, JobRequirements: event.target.value }))} rows={4} />
                        </div>
                        <div className="space-y-2">
                            <Label>Quyền lợi</Label>
                            <Textarea value={form.JobBenefits} onChange={(event) => setForm((current) => ({ ...current, JobBenefits: event.target.value }))} rows={4} />
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-border shadow-sm">
                    <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-base">
                            <DollarSign size={18} className="text-primary" />
                            Lương & Địa điểm
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Mức lương</Label>
                            <Input value={form.Salary} onChange={(event) => setForm((current) => ({ ...current, Salary: event.target.value }))} className="h-11" />
                        </div>
                        <div className="space-y-2">
                            <Label>Thời gian</Label>
                            <Input value={form.WorkingTimes} onChange={(event) => setForm((current) => ({ ...current, WorkingTimes: event.target.value }))} className="h-11" />
                        </div>
                        <div className="space-y-2">
                            <Label>Địa điểm</Label>
                            <div className="relative">
                                <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <Input value={form.Address} onChange={(event) => setForm((current) => ({ ...current, Address: event.target.value }))} className="h-11 pl-10" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Hạn nộp</Label>
                            <div className="relative">
                                <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <Input type="date" value={form.ExpiredAt} onChange={(event) => setForm((current) => ({ ...current, ExpiredAt: event.target.value }))} className="h-11 pl-10" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Separator />

                <div className="flex gap-3">
                    <Button type="button" variant="outline" className="flex-1" onClick={() => router.back()}>
                        Hủy
                    </Button>
                    <Button type="submit" disabled={updateMutation.isPending} className="flex-1 bg-primary hover:bg-primary/90">
                        {updateMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save size={16} className="mr-2" />}
                        Lưu thay đổi
                    </Button>
                </div>
            </form>
        </div>
    );
}

function splitLines(value: string) {
    return value
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean);
}
