"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toastApiError } from "@/lib/axios";
import { adminService } from "@/services/admin.service";
import { AdminReportType } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart3, CircleAlert, CircleDollarSign, Download, FileSpreadsheet, FileText, Loader2, PieChart as PieChartIcon } from "lucide-react";
import {
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";
import { toast } from "react-toastify";

export default function AdminDashboardPage() {
    const [filters, setFilters] = useState({
        startDate: "",
        endDate: "",
    });

    const { data: summary, isLoading } = useQuery({
        queryKey: ["admin-dashboard-summary", filters.startDate, filters.endDate],
        queryFn: () =>
            adminService.getDashboardSummary({
                startDate: filters.startDate || undefined,
                endDate: filters.endDate || undefined,
            }),
    });

    const reportMutation = useMutation({
        mutationFn: async (type: AdminReportType) => {
            const blob = await adminService.downloadReport(type, {
                startDate: filters.startDate || undefined,
                endDate: filters.endDate || undefined,
            });

            const url = window.URL.createObjectURL(blob as Blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = `admin-report.${type}`;
            link.click();
            window.URL.revokeObjectURL(url);
        },
        onError: (error) => toastApiError(error),
    });

    const jobStats = summary?.jobStats;
    const applicationStats = summary?.applicationStats;
    const dependencyErrors = summary?.dependencyErrors
        ? Object.entries(summary.dependencyErrors)
        : [];
    const chartColors = {
        grid: "hsl(var(--border))",
        axis: "hsl(var(--muted-foreground))",
        tooltipBackground: "hsl(var(--card))",
        tooltipBorder: "hsl(var(--border))",
        tooltipText: "hsl(var(--foreground))",
    };

    const statCards = useMemo(() => ([
        {
            label: "Tổng công việc",
            value: jobStats?.total || 0,
            tone: "text-primary bg-primary/5",
        },
        {
            label: "Chờ duyệt",
            value: jobStats?.pending || 0,
            tone: "text-amber-300 bg-amber-500/15",
        },
        {
            label: "Đơn ứng tuyển",
            value: applicationStats?.total || 0,
            tone: "text-emerald-300 bg-emerald-500/15",
        },
        {
            label: "Đã được nhận",
            value: applicationStats?.accepted || 0,
            tone: "text-violet-300 bg-violet-500/15",
        },
    ]), [applicationStats, jobStats]);

    const jobChartData = useMemo(() => ([
        { name: "Đang mở", value: jobStats?.open || 0, fill: "#0f766e" },
        { name: "Chờ duyệt", value: jobStats?.pending || 0, fill: "#d97706" },
        { name: "Đã đóng", value: jobStats?.closed || 0, fill: "#475569" },
        { name: "Từ chối", value: jobStats?.rejected || 0, fill: "#e11d48" },
        { name: "Hết hạn", value: jobStats?.expired || 0, fill: "#7c3aed" },
    ]), [jobStats]);

    const applicationChartData = useMemo(() => ([
        { name: "Đang chờ", value: applicationStats?.pending || 0, fill: "#f59e0b" },
        { name: "Đã chấp nhận", value: applicationStats?.accepted || 0, fill: "#10b981" },
        { name: "Đã từ chối", value: applicationStats?.rejected || 0, fill: "#f43f5e" },
    ]), [applicationStats]);

    const overviewChartData = useMemo(() => ([
        { name: "Công việc", total: jobStats?.total || 0, actionable: (jobStats?.open || 0) + (jobStats?.pending || 0) },
        { name: "Ứng tuyển", total: applicationStats?.total || 0, actionable: (applicationStats?.pending || 0) + (applicationStats?.accepted || 0) },
    ]), [applicationStats, jobStats]);

    return (
        <div className="mx-auto max-w-[1120px] space-y-6" data-testid="admin-dashboard-page">
            <Card className="border-border shadow-sm">
                <CardContent className="flex flex-col gap-4 p-6 lg:flex-row lg:items-end lg:justify-between">
                    <div>
                        <Badge className="bg-primary/10 text-primary">Admin Console</Badge>
                        <h1 className="mt-3 text-2xl font-bold text-foreground">Bảng điều khiển hệ thống</h1>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Theo dõi tình trạng công việc, đơn ứng tuyển và xuất báo cáo nhanh theo khoảng thời gian.
                        </p>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                        <Field label="Từ ngày">
                            <Input
                                type="date"
                                value={filters.startDate}
                                onChange={(event) => setFilters((current) => ({ ...current, startDate: event.target.value }))}
                            />
                        </Field>
                        <Field label="Đến ngày">
                            <Input
                                type="date"
                                value={filters.endDate}
                                onChange={(event) => setFilters((current) => ({ ...current, endDate: event.target.value }))}
                            />
                        </Field>
                        <Button
                            type="button"
                            variant="outline"
                            className="self-end"
                            disabled={reportMutation.isPending}
                            onClick={() => reportMutation.mutate("pdf")}
                        >
                            {reportMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileText size={16} className="mr-2" />}
                            Báo cáo PDF
                        </Button>
                        <Button
                            type="button"
                            className="self-end bg-primary text-white hover:bg-primary/90"
                            disabled={reportMutation.isPending}
                            onClick={() => reportMutation.mutate("xlsx")}
                        >
                            {reportMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileSpreadsheet size={16} className="mr-2" />}
                            Báo cáo Excel
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {summary?.degraded && (
                <Card className="border-amber-300 bg-amber-50/80 shadow-sm">
                    <CardContent className="space-y-4 p-5">
                        <div className="flex items-start gap-3">
                            <div className="rounded-full bg-amber-100 p-2 text-amber-700">
                                <CircleAlert size={18} />
                            </div>
                            <div className="space-y-1">
                                <p className="font-semibold text-amber-900">
                                    Dashboard đang ở chế độ suy giảm
                                </p>
                                <p className="text-sm text-amber-800">
                                    Một hoặc nhiều dịch vụ phụ trợ đang tạm thời không khả dụng. Hệ thống vẫn trả về dữ liệu một phần để quản trị viên tiếp tục theo dõi.
                                </p>
                            </div>
                        </div>

                        <div className="grid gap-3 md:grid-cols-2">
                            {dependencyErrors.map(([dependency, error]) => (
                                <div
                                    key={dependency}
                                    className="rounded-xl border border-amber-200 bg-white/80 p-4"
                                >
                                    <p className="text-sm font-semibold text-foreground">{dependency}</p>
                                    <p className="mt-1 text-sm text-muted-foreground">{error}</p>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {isLoading ? (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    {[...Array(4)].map((_, index) => (
                        <Skeleton key={index} className="h-[120px] rounded-xl" />
                    ))}
                </div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    {statCards.map((card) => (
                        <Card key={card.label} className="border-border shadow-sm">
                            <CardContent className="p-5">
                                <p className="text-sm text-muted-foreground">{card.label}</p>
                                <div className={`mt-3 inline-flex rounded-xl px-3 py-2 ${card.tone}`}>
                                    <span className="text-2xl font-bold">{card.value}</span>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            <div className="grid gap-6 xl:grid-cols-2">
                <Card className="border-border shadow-sm">
                    <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-base">
                            <BarChart3 size={18} className="text-primary" />
                            Phân bổ trạng thái công việc
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="h-[320px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={jobChartData} barSize={44}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chartColors.grid} />
                                <XAxis
                                    dataKey="name"
                                    tickLine={false}
                                    axisLine={false}
                                    tick={{ fill: chartColors.axis, fontSize: 12 }}
                                />
                                <YAxis
                                    tickLine={false}
                                    axisLine={false}
                                    allowDecimals={false}
                                    tick={{ fill: chartColors.axis, fontSize: 12 }}
                                />
                                <Tooltip
                                    cursor={false}
                                    contentStyle={{
                                        backgroundColor: chartColors.tooltipBackground,
                                        borderRadius: 16,
                                        borderColor: chartColors.tooltipBorder,
                                        color: chartColors.tooltipText,
                                        boxShadow: "0 12px 32px rgba(15, 23, 42, 0.08)",
                                    }}
                                    labelStyle={{ color: chartColors.tooltipText }}
                                    itemStyle={{ color: chartColors.tooltipText }}
                                />
                                <Bar dataKey="value" radius={[12, 12, 4, 4]}>
                                    {jobChartData.map((entry) => (
                                        <Cell key={entry.name} fill={entry.fill} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card className="border-border shadow-sm">
                    <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-base">
                            <PieChartIcon size={18} className="text-primary" />
                            Tỷ lệ xử lý ứng tuyển
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
                        <div className="h-[280px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={applicationChartData}
                                        dataKey="value"
                                        nameKey="name"
                                        innerRadius={62}
                                        outerRadius={96}
                                        paddingAngle={3}
                                    >
                                        {applicationChartData.map((entry) => (
                                            <Cell key={entry.name} fill={entry.fill} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: chartColors.tooltipBackground,
                                            borderRadius: 16,
                                            borderColor: chartColors.tooltipBorder,
                                            color: chartColors.tooltipText,
                                            boxShadow: "0 12px 32px rgba(15, 23, 42, 0.08)",
                                        }}
                                        labelStyle={{ color: chartColors.tooltipText }}
                                        itemStyle={{ color: chartColors.tooltipText }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>

                        <div className="space-y-3">
                            {applicationChartData.map((item) => (
                                <div key={item.name} className="flex items-center justify-between rounded-xl bg-muted/60 px-4 py-3">
                                    <div className="flex items-center gap-3">
                                        <span className="h-3.5 w-3.5 rounded-full" style={{ backgroundColor: item.fill }} />
                                        <span className="text-sm text-muted-foreground">{item.name}</span>
                                    </div>
                                    <span className="text-sm font-semibold text-foreground">{item.value}</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card className="border-border shadow-sm">
                <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                        <CircleDollarSign size={18} className="text-primary" />
                        So sánh tổng quan
                    </CardTitle>
                </CardHeader>
                <CardContent className="h-[260px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={overviewChartData} barGap={14}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chartColors.grid} />
                            <XAxis
                                dataKey="name"
                                tickLine={false}
                                axisLine={false}
                                tick={{ fill: chartColors.axis, fontSize: 12 }}
                            />
                            <YAxis
                                tickLine={false}
                                axisLine={false}
                                allowDecimals={false}
                                tick={{ fill: chartColors.axis, fontSize: 12 }}
                            />
                            <Tooltip
                                cursor={false}
                                contentStyle={{
                                    backgroundColor: chartColors.tooltipBackground,
                                    borderRadius: 16,
                                    borderColor: chartColors.tooltipBorder,
                                    color: chartColors.tooltipText,
                                    boxShadow: "0 12px 32px rgba(15, 23, 42, 0.08)",
                                }}
                                labelStyle={{ color: chartColors.tooltipText }}
                                itemStyle={{ color: chartColors.tooltipText }}
                            />
                            <Bar dataKey="total" name="Tổng" fill="#194d8e" radius={[10, 10, 0, 0]} />
                            <Bar dataKey="actionable" name="Cần theo dõi" fill="#f59e0b" radius={[10, 10, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            <div className="grid gap-6 xl:grid-cols-2">
                <Card className="border-border shadow-sm">
                    <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-base">
                            <BarChart3 size={18} className="text-primary" />
                            Thống kê công việc
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <StatsPanel
                            items={[
                                { label: "Tổng công việc", value: jobStats?.total || 0, color: "bg-primary" },
                                { label: "Đang mở", value: jobStats?.open || 0, color: "bg-emerald-500" },
                                { label: "Chờ duyệt", value: jobStats?.pending || 0, color: "bg-amber-500" },
                                { label: "Đã đóng", value: jobStats?.closed || 0, color: "bg-slate-500" },
                                { label: "Bị từ chối", value: jobStats?.rejected || 0, color: "bg-rose-500" },
                                { label: "Hết hạn", value: jobStats?.expired || 0, color: "bg-violet-500" },
                            ]}
                        />
                    </CardContent>
                </Card>

                <Card className="border-border shadow-sm">
                    <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-base">
                            <Download size={18} className="text-primary" />
                            Thống kê ứng tuyển
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <StatsPanel
                            items={[
                                { label: "Tổng đơn", value: applicationStats?.total || 0, color: "bg-primary" },
                                { label: "Đang chờ", value: applicationStats?.pending || 0, color: "bg-amber-500" },
                                { label: "Đã chấp nhận", value: applicationStats?.accepted || 0, color: "bg-emerald-500" },
                                { label: "Đã từ chối", value: applicationStats?.rejected || 0, color: "bg-rose-500" },
                            ]}
                        />
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

function StatsPanel({
    items,
}: {
    items: Array<{ label: string; value: number; color: string }>;
}) {
    const total = Math.max(items[0]?.value || 0, 1);

    return (
        <div className="space-y-4">
            {items.map((item) => {
                const percentage = Math.min((item.value / total) * 100, 100);

                return (
                    <div key={item.label} className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">{item.label}</span>
                            <span className="font-semibold text-foreground">{item.value}</span>
                        </div>
                        <div className="h-2 rounded-full bg-muted">
                            <div
                                className={`h-2 rounded-full ${item.color}`}
                                style={{ width: `${percentage}%` }}
                            />
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="space-y-2">
            <Label>{label}</Label>
            {children}
        </div>
    );
}
