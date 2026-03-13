"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { jobService } from "@/services/job.service";
import { JobListItem } from "@/types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
    Search,
    MapPin,
    DollarSign,
    Clock,
    Heart,
    Briefcase,
    Building2,
    SlidersHorizontal,
    ChevronRight,
} from "lucide-react";
import { toast } from "react-toastify";
import { JobTypeLabel, LevelLabel, JobType, Level } from "@/types/enums";

export default function FindJobsPage() {
    const [searchQuery, setSearchQuery] = useState("");
    const [filterType, setFilterType] = useState<string>("all");
    const [filterLevel, setFilterLevel] = useState<string>("all");
    const [showFilters, setShowFilters] = useState(false);
    const [favorites, setFavorites] = useState<Set<string>>(new Set());

    const { data: jobs, isLoading } = useQuery({
        queryKey: ["jobs", searchQuery],
        queryFn: async () => {
            const params: Record<string, string> = {};
            if (searchQuery.trim()) params.search = searchQuery.trim();
            const res = await jobService.getJobs(params);
            return res as unknown as JobListItem[];
        },
    });

    const toggleFavorite = async (jobId: string) => {
        try {
            if (favorites.has(jobId)) {
                await jobService.removeFavoriteJob(jobId);
                setFavorites((prev) => {
                    const next = new Set(prev);
                    next.delete(jobId);
                    return next;
                });
                toast.info("Đã xóa khỏi yêu thích");
            } else {
                await jobService.addFavoriteJob(jobId);
                setFavorites((prev) => new Set(prev).add(jobId));
                toast.success("Đã thêm vào yêu thích");
            }
        } catch {
            toast.error("Có lỗi xảy ra");
        }
    };

    const filteredJobs = jobs?.filter((job) => {
        if (filterType !== "all" && job.Type !== filterType) return false;
        if (filterLevel !== "all" && job.Level !== filterLevel) return false;
        return true;
    });

    return (
        <div className="mx-auto max-w-[1100px]">
            {/* Search Bar */}
            <div className="mb-6 flex items-center gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                    <Input
                        placeholder="Tìm kiếm công việc, chức danh, công ty..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="h-12 bg-white pl-12 text-base shadow-sm border-gray-200"
                    />
                </div>
                <Button
                    variant="outline"
                    size="icon"
                    className="h-12 w-12 border-gray-200 shadow-sm"
                    onClick={() => setShowFilters(!showFilters)}
                >
                    <SlidersHorizontal size={20} />
                </Button>
            </div>

            {/* Filters */}
            {showFilters && (
                <div className="mb-6 flex gap-4 rounded-xl bg-white p-4 shadow-sm">
                    <div className="flex-1">
                        <label className="mb-1.5 block text-xs font-medium text-gray-500">Hình thức</label>
                        <Select value={filterType} onValueChange={setFilterType}>
                            <SelectTrigger className="h-10">
                                <SelectValue placeholder="Tất cả" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Tất cả</SelectItem>
                                {Object.entries(JobTypeLabel).map(([key, label]) => (
                                    <SelectItem key={key} value={key}>{label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="flex-1">
                        <label className="mb-1.5 block text-xs font-medium text-gray-500">Cấp độ</label>
                        <Select value={filterLevel} onValueChange={setFilterLevel}>
                            <SelectTrigger className="h-10">
                                <SelectValue placeholder="Tất cả" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Tất cả</SelectItem>
                                {Object.entries(LevelLabel).map(([key, label]) => (
                                    <SelectItem key={key} value={key}>{label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            )}

            {/* Job count */}
            <div className="mb-4 flex items-center justify-between">
                <p className="text-sm text-gray-500">
                    {isLoading ? "Đang tải..." : `Tìm thấy ${filteredJobs?.length || 0} công việc`}
                </p>
            </div>

            {/* Job List */}
            {isLoading ? (
                <div className="space-y-4">
                    {[...Array(5)].map((_, i) => (
                        <Skeleton key={i} className="h-[180px] rounded-xl" />
                    ))}
                </div>
            ) : (
                <div className="space-y-4">
                    {filteredJobs?.map((job) => (
                        <JobCard
                            key={job.ID}
                            job={job}
                            isFavorite={favorites.has(job.ID)}
                            onToggleFavorite={() => toggleFavorite(job.ID)}
                        />
                    ))}

                    {filteredJobs?.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-20">
                            <Briefcase size={48} className="mb-4 text-gray-300" />
                            <p className="text-lg font-medium text-gray-500">Không tìm thấy công việc phù hợp</p>
                            <p className="mt-1 text-sm text-gray-400">Thử tìm kiếm với từ khóa khác</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

function JobCard({
    job,
    isFavorite,
    onToggleFavorite,
}: {
    job: JobListItem;
    isFavorite: boolean;
    onToggleFavorite: () => void;
}) {
    const formatDate = (dateStr: string) => {
        const d = new Date(dateStr);
        return `${d.getDate().toString().padStart(2, "0")}/${(d.getMonth() + 1).toString().padStart(2, "0")}/${d.getFullYear()}`;
    };

    return (
        <Card className="group overflow-hidden border-gray-100 bg-white p-0 shadow-sm transition-all duration-300 hover:shadow-md hover:border-[#194d8e]/20">
            <div className="flex items-start gap-5 p-5">
                {/* Company Logo */}
                <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-xl bg-gray-50 border border-gray-100">
                    {job.Recruiter?.Company?.LogoUrl ? (
                        <img
                            src={job.Recruiter.Company.LogoUrl}
                            alt={job.Recruiter.Company.Name}
                            className="h-10 w-10 rounded-lg object-cover"
                        />
                    ) : (
                        <Building2 size={24} className="text-gray-400" />
                    )}
                </div>

                {/* Content */}
                <div className="min-w-0 flex-1">
                    <div className="mb-2 flex items-start justify-between gap-3">
                        <div>
                            <Link
                                href={`/candidate/jobs/${job.ID}`}
                                className="text-lg font-semibold text-gray-900 transition-colors hover:text-[#194d8e] line-clamp-1"
                            >
                                {job.Title}
                            </Link>
                            <p className="mt-0.5 text-sm text-gray-500">{job.Recruiter?.Company?.Name}</p>
                        </div>
                        <button
                            onClick={(e) => { e.preventDefault(); onToggleFavorite(); }}
                            className="flex-shrink-0 rounded-full p-2 transition-colors hover:bg-red-50"
                        >
                            <Heart
                                size={20}
                                className={isFavorite ? "fill-red-500 text-red-500" : "text-gray-300"}
                            />
                        </button>
                    </div>

                    {/* Tags */}
                    <div className="mb-3 flex flex-wrap gap-2">
                        <Badge variant="secondary" className="bg-blue-50 text-[#194d8e] font-normal text-xs">
                            <Briefcase size={12} className="mr-1" />
                            {JobTypeLabel[job.Type as JobType] || job.Type}
                        </Badge>
                        <Badge variant="secondary" className="bg-purple-50 text-purple-700 font-normal text-xs">
                            {LevelLabel[job.Level as Level] || job.Level}
                        </Badge>
                        {job.Categories?.slice(0, 3).map((cat, idx) => (
                            <Badge key={idx} variant="outline" className="border-gray-200 text-gray-500 font-normal text-xs">
                                {cat}
                            </Badge>
                        ))}
                    </div>

                    {/* Info row */}
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                        <span className="flex items-center gap-1.5">
                            <DollarSign size={14} className="text-green-500" />
                            {job.Salary}
                        </span>
                        <span className="flex items-center gap-1.5">
                            <MapPin size={14} className="text-orange-400" />
                            <span className="line-clamp-1 max-w-[200px]">{job.Address}</span>
                        </span>
                        <span className="flex items-center gap-1.5">
                            <Clock size={14} className="text-blue-400" />
                            {formatDate(job.PostedAt)}
                        </span>
                    </div>
                </div>

                {/* Arrow */}
                <Link
                    href={`/candidate/jobs/${job.ID}`}
                    className="flex-shrink-0 self-center rounded-full p-2 text-gray-300 transition-all group-hover:bg-[#194d8e]/5 group-hover:text-[#194d8e]"
                >
                    <ChevronRight size={20} />
                </Link>
            </div>
        </Card>
    );
}
