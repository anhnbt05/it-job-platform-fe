"use client";

import { useEffect, useMemo, useState } from "react";

type UseClientPaginationOptions<T> = {
    items: T[];
    itemsPerPage: number;
    resetKey?: string;
};

export function useClientPagination<T>({
    items,
    itemsPerPage,
    resetKey,
}: UseClientPaginationOptions<T>) {
    const [currentPage, setCurrentPage] = useState(1);

    const totalPages = Math.max(1, Math.ceil(items.length / itemsPerPage));

    useEffect(() => {
        setCurrentPage(1);
    }, [resetKey]);

    useEffect(() => {
        setCurrentPage((page) => Math.min(page, totalPages));
    }, [totalPages]);

    const paginatedItems = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return items.slice(startIndex, startIndex + itemsPerPage);
    }, [currentPage, items, itemsPerPage]);

    const startItem = items.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
    const endItem = items.length === 0 ? 0 : Math.min(currentPage * itemsPerPage, items.length);

    return {
        currentPage,
        totalPages,
        paginatedItems,
        setCurrentPage,
        startItem,
        endItem,
    };
}
