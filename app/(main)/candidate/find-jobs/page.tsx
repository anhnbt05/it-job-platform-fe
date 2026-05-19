"use client";

import "swiper/css";
import "swiper/css/pagination";

import Link from "next/link";
import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
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
import { PaginationBar } from "@/components/ui/pagination-bar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetFooter,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import {
    BrainCircuit,
    Briefcase,
    ChevronRight,
    Clock,
    DollarSign,
    Heart,
    MapPin,
    RotateCcw,
    Search,
    SlidersHorizontal,
    Tag,
    X,
} from "lucide-react";
import { toast } from "react-toastify";
import { Autoplay, Pagination } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";

type FilterState = {
    query: string;
    location: string;
    type: string;
    level: string;
    category: string;
};

const DEFAULT_FILTERS: FilterState = {
    query: "",
    location: "",
    type: "all",
    level: "all",
    category: "all",
};

const QUERY_KEYS = {
    query: "q",
    location: "location",
    type: "type",
    level: "level",
    category: "category",
    page: "page",
} as const;

function normalizeFilterValue(value: string | null, fallback = "all") {
    if (!value) return fallback;
    const normalized = value.trim();
    return normalized.length > 0 ? normalized : fallback;
}

function buildFiltersFromSearchParams(searchParams: URLSearchParams): FilterState {
    return {
        query: searchParams.get(QUERY_KEYS.query)?.trim() ?? "",
        location: searchParams.get(QUERY_KEYS.location)?.trim() ?? "",
        type: normalizeFilterValue(searchParams.get(QUERY_KEYS.type)),
        level: normalizeFilterValue(searchParams.get(QUERY_KEYS.level)),
        category: normalizeFilterValue(searchParams.get(QUERY_KEYS.category)),
    };
}

function buildPageFromSearchParams(searchParams: URLSearchParams) {
    const rawPage = Number(searchParams.get(QUERY_KEYS.page) ?? "1");
    return Number.isFinite(rawPage) && rawPage > 0 ? Math.floor(rawPage) : 1;
}

function createQueryString(filters: FilterState, page: number) {
    const params = new URLSearchParams();

    if (filters.query.trim()) {
        params.set(QUERY_KEYS.query, filters.query.trim());
    }
    if (filters.location.trim()) {
        params.set(QUERY_KEYS.location, filters.location.trim());
    }
    if (filters.type !== "all") {
        params.set(QUERY_KEYS.type, filters.type);
    }
    if (filters.level !== "all") {
        params.set(QUERY_KEYS.level, filters.level);
    }
    if (filters.category !== "all") {
        params.set(QUERY_KEYS.category, filters.category);
    }
    if (page > 1) {
        params.set(QUERY_KEYS.page, String(page));
    }

    return params.toString();
}

function getFilterBadges(filters: FilterState) {
    const items: Array<{ key: keyof FilterState; label: string; value: string }> = [];

    if (filters.query.trim()) {
        items.push({ key: "query", label: "Từ khóa", value: filters.query.trim() });
    }
    if (filters.location.trim()) {
        items.push({ key: "location", label: "Địa điểm", value: filters.location.trim() });
    }
    if (filters.type !== "all") {
        items.push({
            key: "type",
            label: "Hình thức",
            value: JobTypeLabel[filters.type as JobType] || filters.type,
        });
    }
    if (filters.level !== "all") {
        items.push({
            key: "level",
            label: "Cấp độ",
            value: LevelLabel[filters.level as Level] || filters.level,
        });
    }
    if (filters.category !== "all") {
        items.push({ key: "category", label: "Lĩnh vực", value: filters.category });
    }

    return items;
}

function hasActiveFilters(filters: FilterState) {
    return (
        filters.query.trim().length > 0 ||
        filters.location.trim().length > 0 ||
        filters.type !== "all" ||
        filters.level !== "all" ||
        filters.category !== "all"
    );
}

export default function FindJobsPage() {
    const jobsPerPage = 8;
    const { userId } = useAuthStore();
    const queryClient = useQueryClient();
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const [filters, setFilters] = useState<FilterState>(() => buildFiltersFromSearchParams(new URLSearchParams(searchParams.toString())));
    const [currentPage, setCurrentPage] = useState(() => buildPageFromSearchParams(new URLSearchParams(searchParams.toString())));
    const [showMobileFilters, setShowMobileFilters] = useState(false);

    const deferredQuery = useDeferredValue(filters.query);
    const deferredLocation = useDeferredValue(filters.location);

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

    const filterBadges = useMemo(() => getFilterBadges(filters), [filters]);
    const activeFilterCount = filterBadges.length;
    const hasFilters = activeFilterCount > 0;

    const filteredJobs = useMemo(() => {
        const keyword = deferredQuery.trim().toLowerCase();
        const locationKeyword = deferredLocation.trim().toLowerCase();

        return jobs.filter((job) => {
            const matchesKeyword = !keyword || [
                job.Title,
                job.Description ?? "",
                ...job.Categories,
            ].some((value) => value.toLowerCase().includes(keyword));

            const matchesLocation = !locationKeyword || (job.Address || "").toLowerCase().includes(locationKeyword);
            const matchesType = filters.type === "all" || job.Type === filters.type;
            const matchesLevel = filters.level === "all" || job.Level === filters.level;
            const matchesCategory = filters.category === "all" || job.Categories.includes(filters.category);

            return matchesKeyword && matchesLocation && matchesType && matchesLevel && matchesCategory;
        });
    }, [deferredLocation, deferredQuery, filters.category, filters.level, filters.type, jobs]);

    const totalPages = Math.max(1, Math.ceil(filteredJobs.length / jobsPerPage));
    const paginatedJobs = useMemo(() => {
        const startIndex = (currentPage - 1) * jobsPerPage;
        return filteredJobs.slice(startIndex, startIndex + jobsPerPage);
    }, [currentPage, filteredJobs]);
    const hasRecommendedJobs = recommendedJobs.length > 0;

    useEffect(() => {
        const nextFilters = buildFiltersFromSearchParams(new URLSearchParams(searchParams.toString()));
        const nextPage = buildPageFromSearchParams(new URLSearchParams(searchParams.toString()));

        setFilters((current) => (
            current.query === nextFilters.query &&
            current.location === nextFilters.location &&
            current.type === nextFilters.type &&
            current.level === nextFilters.level &&
            current.category === nextFilters.category
        )
            ? current
            : nextFilters);

        setCurrentPage((current) => (current === nextPage ? current : nextPage));
    }, [searchParams]);

    useEffect(() => {
        setCurrentPage((page) => Math.min(page, totalPages));
    }, [totalPages]);

    useEffect(() => {
        const nextQueryString = createQueryString(filters, currentPage);
        const currentQueryString = searchParams.toString();

        if (nextQueryString === currentQueryString) {
            return;
        }

        const nextUrl = nextQueryString ? `${pathname}?${nextQueryString}` : pathname;
        router.replace(nextUrl, { scroll: false });
    }, [currentPage, filters, pathname, router, searchParams]);

    const updateFilter = <K extends keyof FilterState>(key: K, value: FilterState[K]) => {
        setFilters((current) => ({
            ...current,
            [key]: value,
        }));
        setCurrentPage(1);
    };

    const clearFilters = () => {
        setFilters(DEFAULT_FILTERS);
        setCurrentPage(1);
    };

    const clearSingleFilter = (key: keyof FilterState) => {
        const resetValue = key === "query" || key === "location" ? "" : "all";
        updateFilter(key, resetValue as FilterState[keyof FilterState]);
    };

    return (
        <div className="mx-auto max-w-[1100px]">
            <section className="mb-6 overflow-hidden rounded-[28px] border border-primary/10 bg-[radial-gradient(circle_at_top_left,_rgba(25,77,142,0.16),_transparent_38%),linear-gradient(135deg,_#f8fbff_0%,_#eef6ff_46%,_#f4fbf7_100%)] shadow-sm dark:border-white/10 dark:bg-[radial-gradient(circle_at_top_left,_rgba(25,77,142,0.28),_transparent_36%),linear-gradient(135deg,_rgba(15,23,42,0.98)_0%,_rgba(17,24,39,0.95)_52%,_rgba(8,47,73,0.92)_100%)]">
                <div className={`grid gap-6 px-6 py-6 lg:px-8 ${hasRecommendedJobs ? "lg:grid-cols-[0.78fr_1.22fr]" : "lg:grid-cols-[0.88fr_1.12fr] lg:items-stretch"}`}>
                    <div>
                        <Badge className="bg-card text-primary shadow-sm">Dành riêng cho bạn</Badge>
                        <h2 className="mt-3 text-2xl font-bold text-foreground">
                            Công việc gợi ý theo cấp độ {candidate?.Level ? `(${LevelLabel[candidate.Level as Level] || candidate.Level})` : ""}
                        </h2>
                        <p className="mt-2 max-w-[620px] text-sm leading-relaxed text-muted-foreground">
                            Hệ thống đang ưu tiên các vị trí phù hợp với level hiện tại trong hồ sơ ứng viên của bạn để bạn lọc nhanh hơn.
                        </p>

                        <div className={`mt-4 grid max-w-[560px] gap-3 ${hasRecommendedJobs ? "sm:grid-cols-3" : "sm:grid-cols-4"}`}>
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
                            <div className="rounded-2xl border border-white/70 bg-white/80 px-4 py-3 shadow-sm dark:border-white/10 dark:bg-white/5 dark:shadow-none">
                                <p className="text-xs uppercase tracking-wide text-muted-foreground">Đã lưu</p>
                                <p className="mt-1 text-sm font-semibold text-primary">
                                    {favorites.length} công việc
                                </p>
                            </div>
                            {!hasRecommendedJobs && (
                                <div className="rounded-2xl border border-white/70 bg-white/80 px-4 py-3 shadow-sm dark:border-white/10 dark:bg-white/5 dark:shadow-none">
                                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Đang khớp bộ lọc</p>
                                    <p className="mt-1 text-sm font-semibold text-primary">{filteredJobs.length} kết quả</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="min-w-0 rounded-[24px] border border-white/60 bg-white/85 p-4 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-950/40 dark:shadow-none">
                        <div className="mb-3 flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                                <BrainCircuit size={16} />
                                Top gợi ý nổi bật
                            </div>

                            {recommendedJobs.length > 1 && (
                                <Badge variant="secondary" className="bg-primary/10 text-primary">
                                    Tự động phát
                                </Badge>
                            )}
                        </div>

                        {isLoadingRecommended ? (
                            <div className="grid gap-3 sm:grid-cols-2">
                                {[...Array(3)].map((_, index) => (
                                    <Skeleton key={index} className="h-20 rounded-2xl" />
                                ))}
                            </div>
                        ) : hasRecommendedJobs ? (
                            <>
                                <p className="mb-3 text-xs text-muted-foreground">
                                    Vuốt hoặc để slider tự chạy để xem thêm công việc phù hợp với cấp độ hiện tại của bạn.
                                </p>
                                <Swiper
                                    modules={[Autoplay, Pagination]}
                                    className="[&_.swiper-pagination]:!-bottom-0.5 [&_.swiper-pagination-bullet]:bg-slate-300 [&_.swiper-pagination-bullet]:opacity-100 [&_.swiper-pagination-bullet-active]:!bg-primary"
                                    spaceBetween={16}
                                    loop={recommendedJobs.length > 1}
                                    autoplay={
                                        recommendedJobs.length > 1
                                            ? {
                                                delay: 2600,
                                                disableOnInteraction: false,
                                                pauseOnMouseEnter: true,
                                            }
                                            : false
                                    }
                                    pagination={recommendedJobs.length > 1 ? { clickable: true } : false}
                                    breakpoints={{
                                        0: { slidesPerView: 1 },
                                        768: { slidesPerView: 1.1 },
                                        1024: { slidesPerView: 1.25 },
                                        1280: { slidesPerView: 1.45 },
                                    }}
                                >
                                    {recommendedJobs.map((job) => (
                                        <SwiperSlide key={job.ID} className="!h-auto pb-8">
                                            <RecommendedJobCard
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
                                        </SwiperSlide>
                                    ))}
                                </Swiper>
                            </>
                        ) : (
                            <div className="space-y-4 rounded-[24px] border border-dashed border-border bg-[linear-gradient(180deg,_rgba(255,255,255,0.88)_0%,_rgba(245,249,255,0.92)_100%)] p-5 shadow-sm dark:bg-white/5">
                                <div>
                                    <p className="text-sm font-semibold text-foreground">
                                        {candidate?.Level
                                            ? "Tạm thời chưa có job nổi bật khớp level hiện tại"
                                            : "Hoàn thiện hồ sơ để mở khoá gợi ý nổi bật"}
                                    </p>
                                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                                        {candidate?.Level
                                            ? "Bạn vẫn có thể khám phá toàn bộ danh sách việc làm bên dưới hoặc mở rộng bộ lọc để bắt thêm cơ hội gần với level hiện tại."
                                            : "Khi hồ sơ có level và thông tin rõ hơn, hệ thống sẽ ưu tiên đẩy các vị trí phù hợp lên khu vực này cho bạn."}
                                    </p>
                                </div>

                                <div className="grid gap-3 sm:grid-cols-4">
                                    <div className="rounded-2xl border border-white/70 bg-white/85 px-4 py-3 shadow-sm dark:border-white/10 dark:bg-white/5 dark:shadow-none">
                                        <p className="text-xs uppercase tracking-wide text-muted-foreground">Việc làm mở</p>
                                        <p className="mt-1 text-sm font-semibold text-primary">{jobs.length} công việc</p>
                                    </div>
                                    <div className="rounded-2xl border border-white/70 bg-white/85 px-4 py-3 shadow-sm dark:border-white/10 dark:bg-white/5 dark:shadow-none">
                                        <p className="text-xs uppercase tracking-wide text-muted-foreground">Danh mục</p>
                                        <p className="mt-1 text-sm font-semibold text-primary">{categories.length} nhóm ngành</p>
                                    </div>
                                    <div className="rounded-2xl border border-white/70 bg-white/85 px-4 py-3 shadow-sm dark:border-white/10 dark:bg-white/5 dark:shadow-none">
                                        <p className="text-xs uppercase tracking-wide text-muted-foreground">Bộ lọc đang bật</p>
                                        <p className="mt-1 text-sm font-semibold text-primary">{activeFilterCount} tiêu chí</p>
                                    </div>
                                    <div className="rounded-2xl border border-white/70 bg-white/85 px-4 py-3 shadow-sm dark:border-white/10 dark:bg-white/5 dark:shadow-none">
                                        <p className="text-xs uppercase tracking-wide text-muted-foreground">Phù hợp hiện tại</p>
                                        <p className="mt-1 text-sm font-semibold text-primary">{filteredJobs.length} kết quả</p>
                                    </div>
                                </div>

                                <div className="rounded-2xl border border-border/70 bg-white/75 p-4 dark:bg-slate-950/20">
                                    <div className="space-y-2 text-sm text-muted-foreground">
                                        <p>1. Cập nhật level và hồ sơ để hệ thống hiểu rõ hơn vị trí bạn đang hướng tới.</p>
                                        <p>2. Dùng riêng bộ lọc địa điểm và lĩnh vực để thu hẹp nhanh nhóm job gần nhu cầu thật.</p>
                                        <p>3. Lưu job bạn quan tâm để hệ thống học thêm hành vi gợi ý cho các lần sau.</p>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-3 sm:flex-row">
                                    <Link href="/candidate/profile/edit" className="flex-1">
                                        <Button className="w-full bg-primary hover:bg-primary/90">
                                            Hoàn thiện hồ sơ
                                        </Button>
                                    </Link>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="flex-1 border-border bg-white/80 hover:bg-white dark:bg-white/5 dark:hover:bg-white/10 lg:hidden"
                                        onClick={() => setShowMobileFilters(true)}
                                    >
                                        Mở bộ lọc việc làm
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </section>

            <div className="mb-4 flex flex-col gap-3 lg:flex-row">
                <div className="grid flex-1 gap-3 md:grid-cols-[1.3fr_0.9fr]">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            placeholder="Tìm theo vị trí, mô tả hoặc kỹ năng"
                            value={filters.query}
                            onChange={(event) => updateFilter("query", event.target.value)}
                            className="h-12 border-border bg-card pl-12 text-base shadow-sm"
                        />
                    </div>
                    <div className="relative">
                        <MapPin className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            placeholder="Lọc theo địa điểm"
                            value={filters.location}
                            onChange={(event) => updateFilter("location", event.target.value)}
                            className="h-12 border-border bg-card pl-12 text-base shadow-sm"
                        />
                    </div>
                </div>

                <div className="flex items-center gap-2 lg:hidden">
                    <Button
                        variant="outline"
                        className="h-12 flex-1 justify-center gap-2 border-border shadow-sm"
                        onClick={() => setShowMobileFilters(true)}
                    >
                        <SlidersHorizontal size={18} />
                        Bộ lọc
                        {hasFilters && <Badge className="ml-1 bg-primary text-primary-foreground">{activeFilterCount}</Badge>}
                    </Button>
                    {hasFilters && (
                        <Button
                            type="button"
                            variant="ghost"
                            className="h-12 px-3"
                            onClick={clearFilters}
                        >
                            <RotateCcw size={16} />
                        </Button>
                    )}
                </div>
            </div>

            <div className="mb-6 hidden rounded-[24px] border border-border/70 bg-card/80 p-4 shadow-sm lg:block">
                <div className="flex items-center justify-between gap-3">
                    <div>
                        <p className="text-sm font-semibold text-foreground">Bộ lọc tìm việc</p>
                        <p className="text-sm text-muted-foreground">
                            Kết hợp lĩnh vực, cấp độ và hình thức để rút ngắn danh sách job phù hợp.
                        </p>
                    </div>
                    <Button
                        type="button"
                        variant="ghost"
                        className="gap-2"
                        onClick={clearFilters}
                        disabled={!hasFilters}
                    >
                        <RotateCcw size={16} />
                        Xóa bộ lọc
                    </Button>
                </div>

                <div className="mt-4 grid gap-4 xl:grid-cols-3">
                    <FilterSelect
                        label="Hình thức"
                        value={filters.type}
                        onValueChange={(value) => updateFilter("type", value)}
                        placeholder="Tất cả hình thức"
                    >
                        <SelectItem value="all">Tất cả</SelectItem>
                        {Object.entries(JobTypeLabel).map(([key, label]) => (
                            <SelectItem key={key} value={key}>
                                {label}
                            </SelectItem>
                        ))}
                    </FilterSelect>

                    <FilterSelect
                        label="Cấp độ"
                        value={filters.level}
                        onValueChange={(value) => updateFilter("level", value)}
                        placeholder="Tất cả cấp độ"
                    >
                        <SelectItem value="all">Tất cả</SelectItem>
                        {Object.entries(LevelLabel).map(([key, label]) => (
                            <SelectItem key={key} value={key}>
                                {label}
                            </SelectItem>
                        ))}
                    </FilterSelect>

                    <FilterSelect
                        label="Lĩnh vực"
                        value={filters.category}
                        onValueChange={(value) => updateFilter("category", value)}
                        placeholder="Tất cả lĩnh vực"
                    >
                        <SelectItem value="all">Tất cả</SelectItem>
                        {categories.map((category) => (
                            <SelectItem key={category.ID || category.Name} value={category.Name}>
                                {category.Name}
                            </SelectItem>
                        ))}
                    </FilterSelect>
                </div>
            </div>

            {hasFilters && (
                <div className="mb-4 flex flex-wrap items-center gap-2">
                    {filterBadges.map((item) => (
                        <Badge
                            key={`${item.key}-${item.value}`}
                            variant="secondary"
                            className="gap-2 rounded-full bg-primary/10 px-3 py-1 text-primary"
                        >
                            <span className="text-[11px] uppercase tracking-wide text-primary/75">{item.label}</span>
                            <span>{item.value}</span>
                            <button
                                type="button"
                                onClick={() => clearSingleFilter(item.key)}
                                className="rounded-full p-0.5 transition-colors hover:bg-primary/15"
                                aria-label={`Xóa bộ lọc ${item.label}`}
                            >
                                <X size={12} />
                            </button>
                        </Badge>
                    ))}
                </div>
            )}

            <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <p className="text-sm text-muted-foreground">
                        {isLoading ? "Đang tải danh sách công việc..." : `Tìm thấy ${filteredJobs.length} công việc phù hợp`}
                    </p>
                    {!isLoading && hasFilters && (
                        <p className="mt-1 text-xs text-muted-foreground">
                            {activeFilterCount} bộ lọc đang được áp dụng
                        </p>
                    )}
                </div>
                {!isLoading && filteredJobs.length > 0 && (
                    <p className="text-sm text-muted-foreground">
                        Trang {currentPage}/{totalPages}
                    </p>
                )}
            </div>

            {isLoading ? (
                <div className="space-y-4">
                    {[...Array(5)].map((_, index) => (
                        <Skeleton key={index} className="h-[188px] rounded-xl" />
                    ))}
                </div>
            ) : (
                <div className="space-y-4">
                    {paginatedJobs.map((job) => (
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
                        <div className="flex flex-col items-center justify-center rounded-[24px] border border-dashed border-border bg-card/50 py-20 text-center">
                            <Briefcase size={48} className="mb-4 text-muted-foreground" />
                            <p className="text-lg font-medium text-muted-foreground">Không tìm thấy công việc phù hợp</p>
                            <p className="mt-1 text-sm text-muted-foreground">Thử đổi địa điểm, mở rộng lĩnh vực hoặc dùng từ khóa ngắn hơn</p>
                            {hasFilters && (
                                <Button type="button" variant="outline" className="mt-4 gap-2" onClick={clearFilters}>
                                    <RotateCcw size={16} />
                                    Xóa bộ lọc hiện tại
                                </Button>
                            )}
                        </div>
                    )}

                    <PaginationBar
                        currentPage={currentPage}
                        totalPages={totalPages}
                        totalItems={filteredJobs.length}
                        itemsPerPage={jobsPerPage}
                        itemLabel="công việc"
                        onPageChange={setCurrentPage}
                    />
                </div>
            )}

            <Sheet open={showMobileFilters} onOpenChange={setShowMobileFilters}>
                <SheetContent side="bottom" className="max-h-[85vh] rounded-t-[28px]">
                    <SheetHeader>
                        <SheetTitle>Bộ lọc tìm việc</SheetTitle>
                        <SheetDescription>
                            Chọn nhanh điều kiện phù hợp rồi quay lại danh sách công việc.
                        </SheetDescription>
                    </SheetHeader>

                    <div className="mt-6 space-y-4 overflow-y-auto pb-4">
                        <div className="space-y-1.5">
                            <label className="block text-xs font-medium text-muted-foreground">Từ khóa</label>
                            <Input
                                placeholder="Ví dụ: React, Java, Product Designer"
                                value={filters.query}
                                onChange={(event) => updateFilter("query", event.target.value)}
                                className="h-11"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="block text-xs font-medium text-muted-foreground">Địa điểm</label>
                            <Input
                                placeholder="Ví dụ: Hà Nội, Đà Nẵng, Remote"
                                value={filters.location}
                                onChange={(event) => updateFilter("location", event.target.value)}
                                className="h-11"
                            />
                        </div>

                        <FilterSelect
                            label="Hình thức"
                            value={filters.type}
                            onValueChange={(value) => updateFilter("type", value)}
                            placeholder="Tất cả hình thức"
                        >
                            <SelectItem value="all">Tất cả</SelectItem>
                            {Object.entries(JobTypeLabel).map(([key, label]) => (
                                <SelectItem key={key} value={key}>
                                    {label}
                                </SelectItem>
                            ))}
                        </FilterSelect>

                        <FilterSelect
                            label="Cấp độ"
                            value={filters.level}
                            onValueChange={(value) => updateFilter("level", value)}
                            placeholder="Tất cả cấp độ"
                        >
                            <SelectItem value="all">Tất cả</SelectItem>
                            {Object.entries(LevelLabel).map(([key, label]) => (
                                <SelectItem key={key} value={key}>
                                    {label}
                                </SelectItem>
                            ))}
                        </FilterSelect>

                        <FilterSelect
                            label="Lĩnh vực"
                            value={filters.category}
                            onValueChange={(value) => updateFilter("category", value)}
                            placeholder="Tất cả lĩnh vực"
                        >
                            <SelectItem value="all">Tất cả</SelectItem>
                            {categories.map((category) => (
                                <SelectItem key={category.ID || category.Name} value={category.Name}>
                                    {category.Name}
                                </SelectItem>
                            ))}
                        </FilterSelect>
                    </div>

                    <SheetFooter className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-2">
                        <Button type="button" variant="outline" onClick={clearFilters} disabled={!hasFilters}>
                            Xóa bộ lọc
                        </Button>
                        <Button type="button" onClick={() => setShowMobileFilters(false)}>
                            Xem {filteredJobs.length} kết quả
                        </Button>
                    </SheetFooter>
                </SheetContent>
            </Sheet>
        </div>
    );
}

function FilterSelect({
    label,
    value,
    onValueChange,
    placeholder,
    children,
}: {
    label: string;
    value: string;
    onValueChange: (value: string) => void;
    placeholder: string;
    children: React.ReactNode;
}) {
    return (
        <div className="space-y-1.5">
            <label className="block text-xs font-medium text-muted-foreground">{label}</label>
            <Select value={value} onValueChange={onValueChange}>
                <SelectTrigger className="h-11">
                    <SelectValue placeholder={placeholder} />
                </SelectTrigger>
                <SelectContent>{children}</SelectContent>
            </Select>
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
            className="block h-full rounded-2xl border border-border bg-card p-4 transition-all hover:border-primary/20 hover:shadow-sm"
        >
            <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-primary/10">
                    <Briefcase size={18} className="text-primary" />
                </div>

                <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                            <p className="line-clamp-2 text-sm font-semibold text-foreground">{job.Title}</p>
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
