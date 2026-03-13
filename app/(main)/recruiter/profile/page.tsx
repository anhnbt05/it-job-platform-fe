"use client";

import { useQuery } from "@tanstack/react-query";
import { recruiterService } from "@/services/recruiter.service";
import { RecruiterInfo } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    User,
    Mail,
    Phone,
    Building2,
    MapPin,
    Globe,
    Info,
    Edit,
    Briefcase,
} from "lucide-react";
import Link from "next/link";

export default function RecruiterProfilePage() {
    const { data: recruiter, isLoading } = useQuery({
        queryKey: ["recruiter-profile"],
        queryFn: async () => {
            const res = await recruiterService.getProfile();
            return res as unknown as RecruiterInfo;
        },
    });

    if (isLoading) {
        return (
            <div className="mx-auto max-w-[900px] space-y-6">
                <Skeleton className="h-[350px] rounded-xl" />
            </div>
        );
    }

    if (!recruiter) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <User size={48} className="mb-4 text-gray-300" />
                <p className="text-lg font-medium text-gray-500">Không tìm thấy hồ sơ</p>
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-[900px]">
            <Tabs defaultValue="personal" className="w-full">
                <TabsList className="mb-6 grid w-full max-w-[400px] grid-cols-2">
                    <TabsTrigger value="personal">Thông tin cá nhân</TabsTrigger>
                    <TabsTrigger value="company">Thông tin công ty</TabsTrigger>
                </TabsList>

                {/* Personal Info */}
                <TabsContent value="personal">
                    <Card className="border-gray-100 shadow-sm">
                        <CardContent className="p-6">
                            <div className="flex items-start gap-6">
                                <Avatar className="h-24 w-24 border-4 border-white shadow-lg">
                                    <AvatarImage src={recruiter.AvatarUrl || undefined} />
                                    <AvatarFallback className="bg-[#194d8e] text-2xl text-white">{recruiter.FullName?.charAt(0) || "R"}</AvatarFallback>
                                </Avatar>

                                <div className="flex-1">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <h2 className="text-2xl font-bold text-gray-900">{recruiter.FullName}</h2>
                                            <p className="mt-0.5 text-gray-500">{recruiter.Position}</p>
                                        </div>
                                        <Link href="/recruiter/profile/edit">
                                            <Button variant="outline" size="sm"><Edit size={14} className="mr-1.5" /> Chỉnh sửa</Button>
                                        </Link>
                                    </div>

                                    <Separator className="my-4" />

                                    <div className="space-y-3 text-sm">
                                        <div className="flex items-center gap-3 text-gray-600">
                                            <Phone size={16} className="text-green-500" /> {recruiter.PhoneNumber}
                                        </div>
                                        <div className="flex items-center gap-3 text-gray-600">
                                            <Mail size={16} className="text-green-500" /> {recruiter.Email}
                                        </div>
                                        <div className="flex items-center gap-3 text-gray-600">
                                            <Building2 size={16} className="text-green-500" /> {recruiter.Company?.Name}
                                        </div>
                                        {recruiter.CompanyLocations && (
                                            <div className="flex items-center gap-3 text-gray-600">
                                                <MapPin size={16} className="text-green-500" />
                                                {recruiter.CompanyLocations.BranchName}: {recruiter.CompanyLocations.Address}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Company Info */}
                <TabsContent value="company">
                    <Card className="border-gray-100 shadow-sm">
                        <CardContent className="p-6">
                            <div className="flex items-start gap-6">
                                <div className="flex h-24 w-24 flex-shrink-0 items-center justify-center rounded-xl border border-gray-100 bg-gray-50">
                                    {recruiter.Company?.LogoUrl ? (
                                        <img src={recruiter.Company.LogoUrl} alt="" className="h-16 w-16 rounded-lg object-cover" />
                                    ) : (
                                        <Building2 size={36} className="text-gray-400" />
                                    )}
                                </div>

                                <div className="flex-1">
                                    <div className="flex items-start justify-between">
                                        <h2 className="text-2xl font-bold text-gray-900">{recruiter.Company?.Name}</h2>
                                        <Link href="/recruiter/profile/edit">
                                            <Button variant="outline" size="sm"><Edit size={14} className="mr-1.5" /> Chỉnh sửa</Button>
                                        </Link>
                                    </div>

                                    <Separator className="my-4" />

                                    <div className="space-y-3 text-sm">
                                        {recruiter.Company?.WebsiteUrl && (
                                            <div className="flex items-center gap-3">
                                                <Globe size={16} className="text-blue-500" />
                                                <a
                                                    href={recruiter.Company.WebsiteUrl.startsWith("http") ? recruiter.Company.WebsiteUrl : `https://${recruiter.Company.WebsiteUrl}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-[#194d8e] hover:underline"
                                                >
                                                    {recruiter.Company.WebsiteUrl}
                                                </a>
                                            </div>
                                        )}

                                        {recruiter.Company?.Description && (
                                            <div className="flex items-start gap-3">
                                                <Info size={16} className="mt-0.5 text-blue-500" />
                                                <p className="text-gray-600 leading-relaxed text-justify">{recruiter.Company.Description}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
