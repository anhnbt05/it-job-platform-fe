"use client";

import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { AdminCategory } from "@/types";
import { Check, ChevronDown, Loader2, X } from "lucide-react";

type CategoryMultiSelectProps = {
    categories: AdminCategory[];
    value: string[];
    onChange: (value: string[]) => void;
    isLoading?: boolean;
    placeholder?: string;
};

export function CategoryMultiSelect({
    categories,
    value,
    onChange,
    isLoading = false,
    placeholder = "Chọn lĩnh vực",
}: CategoryMultiSelectProps) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState("");

    const options = useMemo(() => {
        const seen = new Set<string>();
        return categories
            .map((category) => category.Name.trim())
            .filter(Boolean)
            .filter((name) => {
                const key = name.toLowerCase();
                if (seen.has(key)) return false;
                seen.add(key);
                return true;
            })
            .sort((a, b) => a.localeCompare(b, "vi"));
    }, [categories]);

    const filteredOptions = useMemo(() => {
        const keyword = search.trim().toLowerCase();
        if (!keyword) return options;
        return options.filter((option) => option.toLowerCase().includes(keyword));
    }, [options, search]);

    const toggleCategory = (category: string) => {
        if (value.includes(category)) {
            onChange(value.filter((item) => item !== category));
            return;
        }

        onChange([...value, category]);
    };

    const removeCategory = (category: string) => {
        onChange(value.filter((item) => item !== category));
    };

    return (
        <div className="space-y-2">
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button
                        type="button"
                        variant="outline"
                        className="h-auto min-h-11 w-full justify-between px-3 py-2 text-left font-normal"
                    >
                        <span className={cn("line-clamp-1", value.length === 0 && "text-muted-foreground")}>
                            {value.length > 0 ? `${value.length} lĩnh vực đã chọn` : placeholder}
                        </span>
                        {isLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                        ) : (
                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        )}
                    </Button>
                </PopoverTrigger>
                <PopoverContent align="start" className="w-[var(--radix-popover-trigger-width)] p-0">
                    <div className="border-b p-2">
                        <Input
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder="Tìm lĩnh vực..."
                            className="h-9"
                        />
                    </div>
                    <div className="max-h-64 overflow-y-auto p-1">
                        {isLoading ? (
                            <div className="flex items-center gap-2 px-3 py-3 text-sm text-muted-foreground">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Đang tải danh mục...
                            </div>
                        ) : filteredOptions.length > 0 ? (
                            filteredOptions.map((category) => {
                                const selected = value.includes(category);
                                return (
                                    <button
                                        key={category}
                                        type="button"
                                        onClick={() => toggleCategory(category)}
                                        className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground"
                                    >
                                        <span
                                            className={cn(
                                                "flex h-4 w-4 items-center justify-center rounded border",
                                                selected ? "border-primary bg-primary text-primary-foreground" : "border-border",
                                            )}
                                        >
                                            {selected && <Check className="h-3 w-3" />}
                                        </span>
                                        <span>{category}</span>
                                    </button>
                                );
                            })
                        ) : (
                            <div className="px-3 py-3 text-sm text-muted-foreground">
                                Không tìm thấy lĩnh vực phù hợp.
                            </div>
                        )}
                    </div>
                </PopoverContent>
            </Popover>

            {value.length > 0 && (
                <div className="flex flex-wrap gap-2">
                    {value.map((category) => (
                        <Badge key={category} variant="secondary" className="gap-1">
                            {category}
                            <button
                                type="button"
                                onClick={() => removeCategory(category)}
                                className="rounded-full hover:text-destructive"
                                aria-label={`Bỏ chọn ${category}`}
                            >
                                <X className="h-3 w-3" />
                            </button>
                        </Badge>
                    ))}
                </div>
            )}
        </div>
    );
}
