"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { categoryService } from "@/services/category.service";
import { jobService } from "@/services/job.service";
import { JobListItem, JobType, JobTypeLabel, Level, LevelLabel } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Briefcase,
    ChevronRight,
    Clock,
    DollarSign,
    Heart,
    MapPin,
    Search,
    SlidersHorizontal,
    Tag,
} from "lucide-react";
import { toast } from "react-toastify";

export default function FindJobsPage() {
    const queryClient = useQueryClient();
    const [searchQuery, setSearchQuery] = useState("");
    const [filterType, setFilterType] = useState<string>("all");
    const [filterLevel, setFilterLevel] = useState<string>("all");
    const [filterCategory, setFilterCategory] = useState<string>("all");
    const [showFilters, setShowFilters] = useState(false);

    const { data: jobs = [], isLoading } = useQuery({
        queryKey: ["jobs"],
        queryFn: () => jobService.getJobs(),
    });

    const { data: favorites = [] } = useQuery({
        queryKey: ["favorite-jobs"],
        queryFn: () => jobService.getFavoriteJobs(),
    });

    const { data: categories = [] } = useQuery({
        queryKey: ["categories"],
        queryFn: async () => {
            const response = await categoryService.getCategories();
            return (response as unknown as Record<string, unknown>[])
                .map((item) => ({
                    id: typeof item.id === "string" ? item.id : "",
                    name: typeof item.name === "string" ? item.name : "",
                }))
                .filter((item) => item.name);
        },
    });

    const favoriteIds = useMemo(
        () => new Set(favorites.map((favorite) => favorite.Job.ID)),
        [favorites],
    );

    const favoriteMutation = useMutation({
        mutationFn: async ({ jobId, shouldSave }: { jobId: string; shouldSave: boolean }) => {
            if (shouldSave) {
                return jobService.addFavoriteJob(jobId);
            }

            return jobService.removeFavoriteJob(jobId);
        },
        onSuccess: (_, variables) => {
            toast.success(variables.shouldSave ? "Đã lưu công việc" : "Đã bỏ lưu công việc");
            queryClient.invalidateQueries({ queryKey: ["favorite-jobs"] });
        },
        onError: () => toast.error("Không thể cập nhật danh sách yêu thích"),
    });

    const filteredJobs = useMemo(() => {
        return jobs.filter((job) => {
            const keyword = searchQuery.trim().toLowerCase();
            const matchesKeyword = !keyword || [
                job.Title,
                job.Description ?? "",
                job.Address,
                ...job.Categories,
            ].some((value) => value.toLowerCase().includes(keyword));

            const matchesType = filterType === "all" || job.Type === filterType;
            const matchesLevel = filterLevel === "all" || job.Level === filterLevel;
            const matchesCategory = filterCategory === "all" || job.Categories.includes(filterCategory);

            return matchesKeyword && matchesType && matchesLevel && matchesCategory;
        });
    }, [filterCategory, filterLevel, filterType, jobs, searchQuery]);

    return (
        <div className="mx-auto max-w-[1100px]">
            <div className="mb-6 flex items-center gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                    <Input
                        placeholder="Tìm theo vị trí, mô tả, kỹ năng hoặc địa điểm"
                        value={searchQuery}
                        onChange={(event) => setSearchQuery(event.target.value)}
                        className="h-12 border-gray-200 bg-white pl-12 text-base shadow-sm"
                    />
                </div>
                <Button
                    variant="outline"
                    size="icon"
                    className="h-12 w-12 border-gray-200 shadow-sm"
                    onClick={() => setShowFilters((current) => !current)}
                >
                    <SlidersHorizontal size={20} />
                </Button>
            </div>

            {showFilters && (
                <div className="mb-6 grid gap-4 rounded-xl bg-white p-4 shadow-sm md:grid-cols-3">
                    <div className="space-y-1.5">
                        <label className="block text-xs font-medium text-gray-500">Hình thức</label>
                        <Select value={filterType} onValueChange={setFilterType}>
                            <SelectTrigger className="h-10">
                                <SelectValue placeholder="Tất cả" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Tất cả</SelectItem>
                                {Object.entries(JobTypeLabel).map(([key, label]) => (
                                    <SelectItem key={key} value={key}>
                                        {label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-1.5">
                        <label className="block text-xs font-medium text-gray-500">Cấp độ</label>
                        <Select value={filterLevel} onValueChange={setFilterLevel}>
                            <SelectTrigger className="h-10">
                                <SelectValue placeholder="Tất cả" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Tất cả</SelectItem>
                                {Object.entries(LevelLabel).map(([key, label]) => (
                                    <SelectItem key={key} value={key}>
                                        {label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-1.5">
                        <label className="block text-xs font-medium text-gray-500">Lĩnh vực</label>
                        <Select value={filterCategory} onValueChange={setFilterCategory}>
                            <SelectTrigger className="h-10">
                                <SelectValue placeholder="Tất cả" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Tất cả</SelectItem>
                                {categories.map((category) => (
                                    <SelectItem key={category.id || category.name} value={category.name}>
                                        {category.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            )}

            <div className="mb-4 flex items-center justify-between">
                <p className="text-sm text-gray-500">
                    {isLoading ? "Đang tải danh sách công việc..." : `Tìm thấy ${filteredJobs.length} công việc phù hợp`}
                </p>
            </div>

            {isLoading ? (
                <div className="space-y-4">
                    {[...Array(5)].map((_, index) => (
                        <Skeleton key={index} className="h-[188px] rounded-xl" />
                    ))}
                </div>
            ) : (
                <div className="space-y-4">
                    {filteredJobs.map((job) => (
                        <JobCard
                            key={job.ID}
                            job={job}
                            isFavorite={favoriteIds.has(job.ID)}
                            isUpdatingFavorite={favoriteMutation.isPending && favoriteMutation.variables?.jobId === job.ID}
                            onToggleFavorite={() =>
                                favoriteMutation.mutate({
                                    jobId: job.ID,
                                    shouldSave: !favoriteIds.has(job.ID),
                                })
                            }
                        />
                    ))}

                    {filteredJobs.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-20">
                            <Briefcase size={48} className="mb-4 text-gray-300" />
                            <p className="text-lg font-medium text-gray-500">Không tìm thấy công việc phù hợp</p>
                            <p className="mt-1 text-sm text-gray-400">Thử đổi bộ lọc hoặc dùng từ khóa ngắn hơn</p>
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
    isUpdatingFavorite,
    onToggleFavorite,
}: {
    job: JobListItem;
    isFavorite: boolean;
    isUpdatingFavorite: boolean;
    onToggleFavorite: () => void;
}) {
    return (
        <Card className="group overflow-hidden border-gray-100 bg-white p-0 shadow-sm transition-all duration-300 hover:border-[#194d8e]/20 hover:shadow-md">
            <div className="flex items-start gap-5 p-5">
                <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-xl border border-gray-100 bg-[#194d8e]/5">
                    <Briefcase size={24} className="text-[#194d8e]" />
                </div>

                <div className="min-w-0 flex-1">
                    <div className="mb-2 flex items-start justify-between gap-3">
                        <div>
                            <Link
                                href={`/candidate/jobs/${job.ID}`}
                                className="line-clamp-1 text-lg font-semibold text-gray-900 transition-colors hover:text-[#194d8e]"
                            >
                                {job.Title}
                            </Link>
                            <p className="mt-0.5 text-sm text-gray-500">Tin tuyển dụng dành cho ứng viên trên IT Job Platform</p>
                        </div>

                        <button
                            type="button"
                            disabled={isUpdatingFavorite}
                            onClick={(event) => {
                                event.preventDefault();
                                onToggleFavorite();
                            }}
                            className="flex-shrink-0 rounded-full p-2 transition-colors hover:bg-red-50 disabled:opacity-60"
                        >
                            <Heart size={20} className={isFavorite ? "fill-red-500 text-red-500" : "text-gray-300"} />
                        </button>
                    </div>

                    <div className="mb-3 flex flex-wrap gap-2">
                        <Badge variant="secondary" className="bg-blue-50 text-[#194d8e]">
                            <Briefcase size={12} className="mr-1" />
                            {JobTypeLabel[job.Type as JobType] || job.Type}
                        </Badge>
                        <Badge variant="secondary" className="bg-purple-50 text-purple-700">
                            {LevelLabel[job.Level as Level] || job.Level}
                        </Badge>
                        {job.Categories.slice(0, 3).map((category) => (
                            <Badge key={category} variant="outline" className="border-gray-200 text-gray-500">
                                <Tag size={12} className="mr-1" />
                                {category}
                            </Badge>
                        ))}
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                        <span className="flex items-center gap-1.5">
                            <DollarSign size={14} className="text-green-500" />
                            {job.Salary || "Thoả thuận"}
                        </span>
                        <span className="flex items-center gap-1.5">
                            <MapPin size={14} className="text-orange-400" />
                            <span className="line-clamp-1 max-w-[220px]">{job.Address || "Chưa cập nhật"}</span>
                        </span>
                        <span className="flex items-center gap-1.5">
                            <Clock size={14} className="text-blue-400" />
                            Hạn nộp: {formatDate(job.ExpiredAt)}
                        </span>
                    </div>
                </div>

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

function formatDate(dateString: string) {
    if (!dateString) {
        return "Chưa cập nhật";
    }

    const date = new Date(dateString);
    return `${date.getDate().toString().padStart(2, "0")}/${(date.getMonth() + 1)
        .toString()
        .padStart(2, "0")}/${date.getFullYear()}`;
}
