"use client";

import { useQuery } from "@tanstack/react-query";
import { jobService } from "@/services/job.service";
import { applicationService } from "@/services/application.service";
import { useAuthStore } from "@/store/useAuthStore";
import { JobListItem, ApplicationRecruiter } from "@/types";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import {
    Users,
    FileText,
    User,
    Calendar,
    ExternalLink,
    Briefcase,
} from "lucide-react";

export default function CandidatesPage() {
    const { userId } = useAuthStore();

    const { data: jobs, isLoading } = useQuery({
        queryKey: ["recruiter-jobs-for-candidates", userId],
        queryFn: async () => {
            const res = await jobService.getJobsByRecruiter(userId!);
            return res as unknown as JobListItem[];
        },
        enabled: !!userId,
    });

    if (isLoading) {
        return (
            <div className="mx-auto max-w-[1000px] space-y-4">
                {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-[100px] rounded-xl" />)}
            </div>
        );
    }

    if (!jobs || jobs.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <Users size={48} className="mb-4 text-gray-300" />
                <p className="text-lg font-medium text-gray-500">Hiện tại bạn chưa có bài đăng tuyển dụng nào</p>
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-[1000px]">
            <Accordion type="multiple" className="space-y-3">
                {jobs.map((job) => (
                    <JobApplicationItem key={job.ID} job={job} />
                ))}
            </Accordion>
        </div>
    );
}

function JobApplicationItem({ job }: { job: JobListItem }) {
    const { data: applications, isLoading } = useQuery({
        queryKey: ["job-applications", job.ID],
        queryFn: async () => {
            const res = await applicationService.getApplicationsByJob(job.ID);
            return res as unknown as ApplicationRecruiter[];
        },
    });

    const hasNew = applications?.some((a) => a.Status === "pending") || false;
    const acceptedCount = applications?.filter((a) => a.Status === "accepted").length || 0;

    const formatDate = (dateStr: string) => {
        const d = new Date(dateStr);
        return `${d.getDate().toString().padStart(2, "0")}/${(d.getMonth() + 1).toString().padStart(2, "0")}/${d.getFullYear()}`;
    };

    return (
        <AccordionItem value={job.ID} className="rounded-xl border border-gray-100 bg-white shadow-sm">
            <AccordionTrigger className="px-5 py-4 hover:no-underline [&[data-state=open]]:pb-2">
                <div className="flex flex-1 flex-col items-start gap-1 text-left">
                    <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-900">{job.Title}</span>
                        {hasNew && (
                            <Badge className="bg-red-50 text-red-600 text-[10px]">Mới</Badge>
                        )}
                    </div>
                    <span className="text-xs text-gray-400">
                        {formatDate(job.PostedAt)} - {formatDate(job.ExpiredAt)}
                    </span>
                    <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">
                        <Users size={14} />
                        Có {applications?.length || 0} đơn ứng tuyển
                    </div>
                </div>
            </AccordionTrigger>

            <AccordionContent className="px-5 pb-4">
                <div className="mb-3 text-right text-xs text-gray-500">
                    Số ứng viên được duyệt: <strong className="text-base">{acceptedCount}/{job.Vacancies}</strong> người
                </div>

                {isLoading ? (
                    <div className="space-y-2">
                        {[...Array(2)].map((_, i) => <Skeleton key={i} className="h-[60px] rounded-lg" />)}
                    </div>
                ) : !applications || applications.length === 0 ? (
                    <p className="py-4 text-center text-sm text-gray-400">Chưa có ứng viên nào ứng tuyển</p>
                ) : (
                    <div className="space-y-2">
                        {applications.map((app) => (
                            <CandidateCard key={app.ID} application={app} />
                        ))}
                    </div>
                )}
            </AccordionContent>
        </AccordionItem>
    );
}

function CandidateCard({ application }: { application: ApplicationRecruiter }) {
    const getStatusBorder = (status: string) => {
        switch (status) {
            case "accepted": return "border-l-green-500";
            case "rejected": return "border-l-red-500";
            default: return "border-l-transparent";
        }
    };

    const getAvatarBorder = (status: string) => {
        switch (status) {
            case "accepted": return "ring-2 ring-green-500";
            case "rejected": return "ring-2 ring-red-500";
            default: return "";
        }
    };

    const formatDate = (dateStr: string) => {
        const d = new Date(dateStr);
        return `${d.getDate().toString().padStart(2, "0")}/${(d.getMonth() + 1).toString().padStart(2, "0")}/${d.getFullYear()}`;
    };

    return (
        <div className={`flex items-center gap-4 rounded-lg border-l-[3px] bg-gray-50/50 p-3 ${getStatusBorder(application.Status)}`}>
            <Avatar className={`h-10 w-10 ${getAvatarBorder(application.Status)}`}>
                <AvatarImage src={application.Candidate.AvatarUrl} />
                <AvatarFallback className="bg-gray-200 text-sm text-gray-600">
                    {application.Candidate.FullName.charAt(0)}
                </AvatarFallback>
            </Avatar>

            <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-900">{application.Candidate.FullName}</p>
                <Badge variant="secondary" className="mt-0.5 bg-blue-50 text-[#194d8e] text-[10px]">
                    <Calendar size={10} className="mr-1" /> {formatDate(application.AppliedAt)}
                </Badge>
            </div>

            <div className="flex items-center gap-1">
                {application.ResumeUrl && (
                    <a href={application.ResumeUrl} target="_blank" rel="noopener noreferrer">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-[#194d8e]">
                            <FileText size={16} />
                        </Button>
                    </a>
                )}
                <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-[#194d8e]">
                    <User size={16} />
                </Button>
            </div>
        </div>
    );
}
