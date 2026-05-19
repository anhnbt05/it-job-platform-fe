"use client";

import Link from "next/link";
import { useClientPagination } from "@/hooks/use-client-pagination";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PaginationBar } from "@/components/ui/pagination-bar";
import { jobService } from "@/services/job.service";
import { JobType, JobTypeLabel, Level, LevelLabel } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Calendar,
    ChevronRight,
    DollarSign,
    Heart,
    MapPin,
    Briefcase,
} from "lucide-react";
import { toast } from "react-toastify";

export default function FavoriteJobsPage() {
    const queryClient = useQueryClient();
    const favoritesPerPage = 6;

    const { data: favorites = [], isLoading } = useQuery({
        queryKey: ["favorite-jobs"],
        queryFn: () => jobService.getFavoriteJobs(),
    });

    const {
        currentPage,
        totalPages,
        paginatedItems: paginatedFavorites,
        setCurrentPage,
    } = useClientPagination({
        items: favorites,
        itemsPerPage: favoritesPerPage,
    });

    const removeMutation = useMutation({
        mutationFn: (jobId: string) => jobService.removeFavoriteJob(jobId),
        onSuccess: () => {
            toast.success("Đã xóa khỏi danh sách yêu thích");
            queryClient.invalidateQueries({ queryKey: ["favorite-jobs"] });
        },
        onError: () => toast.error("Không thể xóa công việc"),
    });

    return (
        <div className="mx-auto max-w-[1100px]">
            <p className="mb-4 text-sm text-muted-foreground">
                {isLoading ? "Đang tải danh sách đã lưu..." : `${favorites.length} công việc yêu thích`}
            </p>

            {isLoading ? (
                <div className="space-y-4">
                    {[...Array(4)].map((_, index) => (
                        <Skeleton key={index} className="h-[160px] rounded-xl" />
                    ))}
                </div>
            ) : (
                <div className="space-y-3">
                    {paginatedFavorites.map((favorite) => (
                        <Card key={favorite.ID} className="group border-border p-0 shadow-sm transition-all hover:shadow-md">
                            <div className="flex items-start gap-5 p-5">
                                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-primary/5">
                                    <Briefcase size={20} className="text-primary" />
                                </div>

                                <div className="min-w-0 flex-1">
                                    <Link
                                        href={`/candidate/jobs/${favorite.Job.ID}`}
                                        className="line-clamp-1 text-base font-semibold text-foreground hover:text-primary"
                                    >
                                        {favorite.Job.Title}
                                    </Link>

                                    <div className="mt-2 flex flex-wrap gap-2">
                                        <Badge variant="secondary" className="bg-primary/10 text-primary">
                                            {JobTypeLabel[favorite.Job.Type as JobType] || favorite.Job.Type}
                                        </Badge>
                                        <Badge variant="secondary" className="bg-purple-50 text-purple-700">
                                            {LevelLabel[favorite.Job.Level as Level] || favorite.Job.Level}
                                        </Badge>
                                        {favorite.Job.Categories.slice(0, 2).map((category) => (
                                            <Badge key={category} variant="outline" className="border-border text-muted-foreground">
                                                {category}
                                            </Badge>
                                        ))}
                                    </div>

                                    <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                                        <span className="flex items-center gap-1.5">
                                            <DollarSign size={14} />
                                            {favorite.Job.Salary || "Thoả thuận"}
                                        </span>
                                        <span className="flex items-center gap-1.5">
                                            <MapPin size={14} />
                                            {favorite.Job.Address || "Chưa cập nhật"}
                                        </span>
                                        <span className="flex items-center gap-1.5">
                                            <Calendar size={14} />
                                            Đã lưu ngày {formatDate(favorite.SavedAt)}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="text-red-400 hover:bg-red-50 hover:text-red-500"
                                        onClick={() => removeMutation.mutate(favorite.Job.ID)}
                                    >
                                        <Heart size={18} className="fill-red-400" />
                                    </Button>
                                    <Link href={`/candidate/jobs/${favorite.Job.ID}`}>
                                        <Button variant="ghost" size="icon" className="text-muted-foreground group-hover:text-primary">
                                            <ChevronRight size={18} />
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                        </Card>
                    ))}

                    {favorites.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-20">
                            <Heart size={48} className="mb-4 text-muted-foreground" />
                            <p className="text-lg font-medium text-muted-foreground">Bạn chưa lưu công việc nào</p>
                            <Link href="/candidate/find-jobs" className="mt-2 text-sm text-primary hover:underline">
                                Khám phá việc làm
                            </Link>
                        </div>
                    )}

                    <PaginationBar
                        currentPage={currentPage}
                        totalPages={totalPages}
                        totalItems={favorites.length}
                        itemsPerPage={favoritesPerPage}
                        itemLabel="công việc"
                        onPageChange={setCurrentPage}
                    />
                </div>
            )}
        </div>
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
