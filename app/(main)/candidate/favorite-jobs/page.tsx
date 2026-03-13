"use client";

import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { jobService } from "@/services/job.service";
import { JobListItem, JobType, Level, JobTypeLabel, LevelLabel } from "@/types";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Building2, MapPin, DollarSign, Heart, Briefcase, ChevronRight } from "lucide-react";
import { toast } from "react-toastify";

export default function FavoriteJobsPage() {
    const queryClient = useQueryClient();

    const { data: jobs, isLoading } = useQuery({
        queryKey: ["favorite-jobs"],
        queryFn: async () => {
            const res = await jobService.getFavoriteJobs();
            return res as unknown as JobListItem[];
        },
    });

    const removeMutation = useMutation({
        mutationFn: (jobId: string) => jobService.removeFavoriteJob(jobId),
        onSuccess: () => {
            toast.success("Đã xóa khỏi yêu thích");
            queryClient.invalidateQueries({ queryKey: ["favorite-jobs"] });
        },
        onError: () => toast.error("Có lỗi xảy ra"),
    });

    return (
        <div className="mx-auto max-w-[1100px]">
            <p className="mb-4 text-sm text-gray-500">{isLoading ? "Đang tải..." : `${jobs?.length || 0} công việc yêu thích`}</p>

            {isLoading ? (
                <div className="space-y-4">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-[140px] rounded-xl" />)}</div>
            ) : (
                <div className="space-y-3">
                    {jobs?.map((job) => (
                        <Card key={job.ID} className="group border-gray-100 p-0 shadow-sm transition-all hover:shadow-md">
                            <div className="flex items-center gap-5 p-5">
                                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-gray-50 border border-gray-100">
                                    {job.Recruiter?.Company?.LogoUrl ? (
                                        <img src={job.Recruiter.Company.LogoUrl} alt="" className="h-8 w-8 rounded-lg object-cover" />
                                    ) : (
                                        <Building2 size={20} className="text-gray-400" />
                                    )}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <Link href={`/candidate/jobs/${job.ID}`} className="text-base font-semibold text-gray-900 hover:text-[#194d8e] line-clamp-1">
                                        {job.Title}
                                    </Link>
                                    <p className="mt-0.5 text-sm text-gray-500">{job.Recruiter?.Company?.Name}</p>
                                    <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-gray-400">
                                        <Badge variant="secondary" className="bg-blue-50 text-[#194d8e] text-xs">
                                            <Briefcase size={10} className="mr-1" />
                                            {JobTypeLabel[job.Type as JobType] || job.Type}
                                        </Badge>
                                        <span className="flex items-center gap-1"><DollarSign size={12} /> {job.Salary}</span>
                                        <span className="flex items-center gap-1"><MapPin size={12} /> {job.Address}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button variant="ghost" size="icon" onClick={() => removeMutation.mutate(job.ID)} className="text-red-400 hover:bg-red-50 hover:text-red-500">
                                        <Heart size={18} className="fill-red-400" />
                                    </Button>
                                    <Link href={`/candidate/jobs/${job.ID}`}>
                                        <Button variant="ghost" size="icon" className="text-gray-400 group-hover:text-[#194d8e]"><ChevronRight size={18} /></Button>
                                    </Link>
                                </div>
                            </div>
                        </Card>
                    ))}

                    {jobs?.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-20">
                            <Heart size={48} className="mb-4 text-gray-300" />
                            <p className="text-lg font-medium text-gray-500">Chưa có việc làm yêu thích nào</p>
                            <Link href="/candidate/find-jobs" className="mt-2 text-sm text-[#194d8e] hover:underline">Tìm kiếm việc làm</Link>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
