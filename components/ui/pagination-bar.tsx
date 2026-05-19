"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type PaginationBarProps = {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    onPageChange: (page: number) => void;
    itemLabel?: string;
    className?: string;
};

export function PaginationBar({
    currentPage,
    totalPages,
    totalItems,
    itemsPerPage,
    onPageChange,
    itemLabel = "mục",
    className,
}: PaginationBarProps) {
    if (totalItems <= itemsPerPage) {
        return null;
    }

    const startItem = (currentPage - 1) * itemsPerPage + 1;
    const endItem = Math.min(currentPage * itemsPerPage, totalItems);

    return (
        <div
            className={cn(
                "flex flex-col gap-3 rounded-2xl border border-border bg-card/80 px-4 py-4 shadow-sm sm:flex-row sm:items-center sm:justify-between",
                className,
            )}
        >
            <p className="text-sm text-muted-foreground">
                Hiển thị {startItem}-{endItem} / {totalItems} {itemLabel}
            </p>

            <div className="flex items-center gap-2 self-end sm:self-auto">
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="gap-1"
                    disabled={currentPage === 1}
                    onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                >
                    <ChevronLeft size={16} />
                    Trước
                </Button>
                <div className="min-w-[92px] rounded-full border border-border px-3 py-1 text-center text-sm font-medium text-foreground">
                    {currentPage} / {totalPages}
                </div>
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="gap-1"
                    disabled={currentPage === totalPages}
                    onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
                >
                    Sau
                    <ChevronRight size={16} />
                </Button>
            </div>
        </div>
    );
}
