"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { candidateService } from "@/services/candidate.service";
import { Candidate } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
    User,
    Mail,
    Phone,
    GraduationCap,
    FileText,
    Edit,
    Briefcase,
    Calendar,
    MapPin,
    Award,
    ExternalLink,
} from "lucide-react";
import { LevelLabel, Level } from "@/types/enums";

export default function CandidateProfilePage() {
    const { data: candidate, isLoading } = useQuery({
        queryKey: ["candidate-profile"],
        queryFn: async () => {
            const res = await candidateService.getProfile();
            return res as unknown as Candidate;
        },
    });

    const formatDate = (dateStr: string | null) => {
        if (!dateStr) return "Hiện tại";
        const d = new Date(dateStr);
        return `${(d.getMonth() + 1).toString().padStart(2, "0")}/${d.getFullYear()}`;
    };

    if (isLoading) {
        return (
            <div className="mx-auto max-w-[900px] space-y-6">
                <Skeleton className="h-[300px] rounded-xl" />
                <Skeleton className="h-[200px] rounded-xl" />
                <Skeleton className="h-[250px] rounded-xl" />
            </div>
        );
    }

    if (!candidate) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <User size={48} className="mb-4 text-gray-300" />
                <p className="text-lg font-medium text-gray-500">Không tìm thấy hồ sơ</p>
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-[900px] space-y-6">
            {/* Profile Card */}
            <Card className="border-gray-100 shadow-sm">
                <CardContent className="p-6">
                    <div className="flex items-start gap-6">
                        <Avatar className="h-24 w-24 border-4 border-white shadow-lg">
                            <AvatarImage src={candidate.AvatarUrl || undefined} />
                            <AvatarFallback className="bg-[#194d8e] text-2xl text-white">
                                {candidate.FullName?.charAt(0) || "U"}
                            </AvatarFallback>
                        </Avatar>

                        <div className="flex-1">
                            <div className="flex items-start justify-between">
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-900">{candidate.FullName}</h2>
                                    {candidate.Level && (
                                        <Badge className="mt-1 bg-purple-50 text-purple-700">
                                            <GraduationCap size={12} className="mr-1" />
                                            {LevelLabel[candidate.Level as Level] || candidate.Level}
                                        </Badge>
                                    )}
                                </div>
                                <Link href="/candidate/profile/edit">
                                    <Button variant="outline" size="sm">
                                        <Edit size={14} className="mr-1.5" /> Chỉnh sửa
                                    </Button>
                                </Link>
                            </div>

                            <Separator className="my-4" />

                            <div className="grid grid-cols-2 gap-3 text-sm">
                                <div className="flex items-center gap-2 text-gray-600">
                                    <Mail size={14} className="text-gray-400" />
                                    {candidate.Email || "Chưa cập nhật"}
                                </div>
                                <div className="flex items-center gap-2 text-gray-600">
                                    <Phone size={14} className="text-gray-400" />
                                    {candidate.PhoneNumber || "Chưa cập nhật"}
                                </div>
                            </div>

                            {candidate.Bio && (
                                <p className="mt-4 text-sm leading-relaxed text-gray-600">{candidate.Bio}</p>
                            )}
                        </div>
                    </div>

                    {/* CV Button */}
                    {candidate.ResumeUrl && (
                        <div className="mt-4 flex justify-end">
                            <a href={candidate.ResumeUrl} target="_blank" rel="noopener noreferrer">
                                <Button variant="outline" size="sm" className="text-[#194d8e]">
                                    <FileText size={14} className="mr-1.5" /> Xem CV
                                    <ExternalLink size={12} className="ml-1.5" />
                                </Button>
                            </a>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Certifications */}
            {candidate.Certifications && candidate.Certifications.length > 0 && (
                <Card className="border-gray-100 shadow-sm">
                    <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-base font-semibold">
                            <Award size={18} className="text-[#194d8e]" />
                            Chứng chỉ
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-wrap gap-2">
                            {candidate.Certifications.map((cert, idx) => (
                                <Badge key={idx} variant="secondary" className="bg-amber-50 px-3 py-1 text-amber-800">
                                    <Award size={12} className="mr-1.5" />
                                    {cert}
                                </Badge>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Work Experience */}
            <Card className="border-gray-100 shadow-sm">
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2 text-base font-semibold">
                            <Briefcase size={18} className="text-[#194d8e]" />
                            Kinh nghiệm làm việc
                        </CardTitle>
                    </div>
                </CardHeader>
                <CardContent>
                    {!candidate.WorkExperiences || candidate.WorkExperiences.length === 0 ? (
                        <p className="py-6 text-center text-sm text-gray-400">Chưa có kinh nghiệm làm việc</p>
                    ) : (
                        <div className="space-y-4">
                            {candidate.WorkExperiences.map((exp, idx) => (
                                <div key={exp.ID || idx} className="flex items-start gap-4 rounded-lg border border-gray-100 p-4">
                                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-gray-50">
                                        {exp.CompanyLogoUrl ? (
                                            <img src={exp.CompanyLogoUrl} alt="" className="h-6 w-6 rounded object-cover" />
                                        ) : (
                                            <Briefcase size={18} className="text-gray-400" />
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-semibold text-gray-900">{exp.Position}</p>
                                        <p className="text-sm text-gray-500">{exp.CompanyName}</p>
                                        <div className="mt-1.5 flex items-center gap-4 text-xs text-gray-400">
                                            <span className="flex items-center gap-1">
                                                <Calendar size={12} />
                                                {formatDate(exp.StartDate)} - {formatDate(exp.EndDate)}
                                            </span>
                                            {exp.Location && (
                                                <span className="flex items-center gap-1">
                                                    <MapPin size={12} />
                                                    {exp.Location}
                                                </span>
                                            )}
                                        </div>
                                        {exp.Descriptions && exp.Descriptions.length > 0 && (
                                            <ul className="mt-2 space-y-1">
                                                {exp.Descriptions.map((desc, dIdx) => (
                                                    <li key={dIdx} className="flex items-start gap-2 text-xs text-gray-600">
                                                        <span className="mt-1.5 h-1 w-1 flex-shrink-0 rounded-full bg-gray-400" />
                                                        {desc}
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
