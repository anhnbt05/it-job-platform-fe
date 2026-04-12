"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { candidateService } from "@/services/candidate.service";
import { categoryService } from "@/services/category.service";
import { jobService } from "@/services/job.service";
import { useAuthStore } from "@/store/useAuthStore";
import { JobDetail, JobListItem, JobType, JobTypeLabel, Level, LevelLabel } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
    BrainCircuit,
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
    const { userId } = useAuthStore();
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

    const { data: candidate } = useQuery({
        queryKey: ["candidate-profile"],
        queryFn: () => candidateService.getProfile(),
    });

    const { data: recommendedJobs = [], isLoading: isLoadingRecommended } = useQuery({
        queryKey: ["recommended-jobs", userId, candidate?.Level],
        queryFn: () => jobService.getRecommendedJobs(userId || "", candidate?.Level || ""),
        enabled: !!userId && !!candidate?.Level,
    });

    const { data: categories = [] } = useQuery({
        queryKey: ["categories"],
        queryFn: () => categoryService.getCategories(),
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
            <section className="mb-6 overflow-hidden rounded-[28px] border border-primary/10 bg-[radial-gradient(circle_at_top_left,_rgba(25,77,142,0.16),_transparent_38%),linear-gradient(135deg,_#f8fbff_0%,_#eef6ff_46%,_#f4fbf7_100%)] shadow-sm dark:border-white/10 dark:bg-[radial-gradient(circle_at_top_left,_rgba(25,77,142,0.28),_transparent_36%),linear-gradient(135deg,_rgba(15,23,42,0.98)_0%,_rgba(17,24,39,0.95)_52%,_rgba(8,47,73,0.92)_100%)]">
                <div className="grid gap-6 px-6 py-6 lg:grid-cols-[1.1fr_0.9fr] lg:px-8">
                    <div>
                        <Badge className="bg-card text-primary shadow-sm">Dành riêng cho bạn</Badge>
                        <h2 className="mt-3 text-2xl font-bold text-foreground">
                            Công việc gợi ý theo cấp độ {candidate?.Level ? `(${LevelLabel[candidate.Level as Level] || candidate.Level})` : ""}
                        </h2>
                        <p className="mt-2 max-w-[620px] text-sm leading-relaxed text-muted-foreground">
                            Hệ thống đang ưu tiên các vị trí phù hợp với level hiện tại trong hồ sơ ứng viên của bạn để bạn lọc nhanh hơn.
                        </p>

                        <div className="mt-4 flex flex-wrap gap-3">
                            <div className="rounded-2xl border border-white/70 bg-white/80 px-4 py-3 shadow-sm dark:border-white/10 dark:bg-white/5 dark:shadow-none">
                                <p className="text-xs uppercase tracking-wide text-muted-foreground">Level hồ sơ</p>
                                <p className="mt-1 text-sm font-semibold text-primary">
                                    {candidate?.Level ? (LevelLabel[candidate.Level as Level] || candidate.Level) : "Chưa cập nhật"}
                                </p>
                            </div>
                            <div className="rounded-2xl border border-white/70 bg-white/80 px-4 py-3 shadow-sm dark:border-white/10 dark:bg-white/5 dark:shadow-none">
                                <p className="text-xs uppercase tracking-wide text-muted-foreground">Số gợi ý</p>
                                <p className="mt-1 text-sm font-semibold text-primary">
                                    {isLoadingRecommended ? "Đang tải..." : `${recommendedJobs.length} công việc`}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-[24px] border border-white/60 bg-white/85 p-4 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-950/40 dark:shadow-none">
                        <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-primary">
                            <BrainCircuit size={16} />
                            Top gợi ý nổi bật
                        </div>

                        {isLoadingRecommended ? (
                            <div className="space-y-3">
                                {[...Array(3)].map((_, index) => (
                                    <Skeleton key={index} className="h-20 rounded-2xl" />
                                ))}
                            </div>
                        ) : recommendedJobs.length > 0 ? (
                            <div className="space-y-3">
                                {recommendedJobs.slice(0, 3).map((job) => (
                                    <RecommendedJobCard
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
                            </div>
                        ) : (
                            <div className="rounded-2xl border border-dashed border-border bg-muted/40 px-4 py-6 text-sm text-muted-foreground">
                                {candidate?.Level
                                    ? "Hiện chưa có công việc gợi ý phù hợp với level của bạn."
                                    : "Cập nhật level trong hồ sơ để hệ thống gợi ý công việc tốt hơn."}
                            </div>
                        )}
                    </div>
                </div>
            </section>

            <div className="mb-6 flex items-center gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        placeholder="Tìm theo vị trí, mô tả, kỹ năng hoặc địa điểm"
                        value={searchQuery}
                        onChange={(event) => setSearchQuery(event.target.value)}
                        className="h-12 border-border bg-card pl-12 text-base shadow-sm"
                    />
                </div>
                <Button
                    variant="outline"
                    size="icon"
                    className="h-12 w-12 border-border shadow-sm"
                    onClick={() => setShowFilters((current) => !current)}
                >
                    <SlidersHorizontal size={20} />
                </Button>
            </div>

            {showFilters && (
                <div className="mb-6 grid gap-4 rounded-xl bg-card p-4 shadow-sm md:grid-cols-3">
                    <div className="space-y-1.5">
                        <label className="block text-xs font-medium text-muted-foreground">Hình thức</label>
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
                        <label className="block text-xs font-medium text-muted-foreground">Cấp độ</label>
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
                        <label className="block text-xs font-medium text-muted-foreground">Lĩnh vực</label>
                        <Select value={filterCategory} onValueChange={setFilterCategory}>
                            <SelectTrigger className="h-10">
                                <SelectValue placeholder="Tất cả" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Tất cả</SelectItem>
                                {categories.map((category) => (
                                    <SelectItem key={category.ID || category.Name} value={category.Name}>
                                        {category.Name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            )}

            <div className="mb-4 flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
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
                            <Briefcase size={48} className="mb-4 text-muted-foreground" />
                            <p className="text-lg font-medium text-muted-foreground">Không tìm thấy công việc phù hợp</p>
                            <p className="mt-1 text-sm text-muted-foreground">Thử đổi bộ lọc hoặc dùng từ khóa ngắn hơn</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

function RecommendedJobCard({
    job,
    isFavorite,
    isUpdatingFavorite,
    onToggleFavorite,
}: {
    job: JobDetail;
    isFavorite: boolean;
    isUpdatingFavorite: boolean;
    onToggleFavorite: () => void;
}) {
    return (
        <Link
            href={`/candidate/jobs/${job.ID}`}
            className="block rounded-2xl border border-border bg-card p-4 transition-all hover:border-primary/20 hover:shadow-sm"
        >
            <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-primary/10">
                    <Briefcase size={18} className="text-primary" />
                </div>

                <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                        <div>
                            <p className="line-clamp-1 text-sm font-semibold text-foreground">{job.Title}</p>
                            <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">{job.Address || "Chưa cập nhật địa điểm"}</p>
                        </div>

                        <button
                            type="button"
                            disabled={isUpdatingFavorite}
                            onClick={(event) => {
                                event.preventDefault();
                                onToggleFavorite();
                            }}
                            className="rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-red-50 disabled:opacity-60"
                        >
                            <Heart size={16} className={isFavorite ? "fill-red-500 text-red-500" : "text-muted-foreground"} />
                        </button>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                        <Badge variant="secondary" className="bg-primary/10 text-primary">
                            {JobTypeLabel[job.Type as JobType] || job.Type}
                        </Badge>
                        <Badge variant="secondary" className="bg-purple-50 text-purple-700">
                            {LevelLabel[job.Level as Level] || job.Level}
                        </Badge>
                    </div>

                    <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                        <span>{job.Salary || "Thoả thuận"}</span>
                        <span className="inline-flex items-center gap-1">
                            Xem chi tiết
                            <ChevronRight size={14} />
                        </span>
                    </div>
                </div>
            </div>
        </Link>
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
        <Card className="group overflow-hidden border-border bg-card p-0 shadow-sm transition-all duration-300 hover:border-primary/20 hover:shadow-md">
            <div className="flex items-start gap-5 p-5">
                <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-xl border border-border bg-primary/5">
                    <Briefcase size={24} className="text-primary" />
                </div>

                <div className="min-w-0 flex-1">
                    <div className="mb-2 flex items-start justify-between gap-3">
                        <div>
                            <Link
                                href={`/candidate/jobs/${job.ID}`}
                                className="line-clamp-1 text-lg font-semibold text-foreground transition-colors hover:text-primary"
                            >
                                {job.Title}
                            </Link>
                            <p className="mt-0.5 text-sm text-muted-foreground">Tin tuyển dụng dành cho ứng viên trên IT Job Platform</p>
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
                            <Heart size={20} className={isFavorite ? "fill-red-500 text-red-500" : "text-muted-foreground"} />
                        </button>
                    </div>

                    <div className="mb-3 flex flex-wrap gap-2">
                        <Badge variant="secondary" className="bg-primary/10 text-primary">
                            <Briefcase size={12} className="mr-1" />
                            {JobTypeLabel[job.Type as JobType] || job.Type}
                        </Badge>
                        <Badge variant="secondary" className="bg-purple-50 text-purple-700">
                            {LevelLabel[job.Level as Level] || job.Level}
                        </Badge>
                        {job.Categories.slice(0, 3).map((category) => (
                            <Badge key={category} variant="outline" className="border-border text-muted-foreground">
                                <Tag size={12} className="mr-1" />
                                {category}
                            </Badge>
                        ))}
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
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
                    className="flex-shrink-0 self-center rounded-full p-2 text-muted-foreground transition-all group-hover:bg-primary/5 group-hover:text-primary"
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
