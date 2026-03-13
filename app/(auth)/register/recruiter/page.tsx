"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "react-toastify";
import { authService } from "@/services/auth.service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Building2, Mail, Lock, Phone, Eye, EyeOff, Loader2, ArrowLeft, User, Briefcase } from "lucide-react";

export default function RecruiterRegisterPage() {
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [phone, setPhone] = useState("");
    const [position, setPosition] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!fullName.trim() || !email.trim() || !password.trim()) {
            toast.error("Vui lòng nhập đầy đủ thông tin bắt buộc");
            return;
        }

        setIsLoading(true);
        try {
            await authService.signUp({
                email: email.trim(),
                password: password.trim(),
                fullName: fullName.trim(),
                role: "recruiter",
                phoneNumber: phone.trim(),
                position: position.trim(),
            });
            toast.success("Đăng ký thành công! Vui lòng kiểm tra email để xác thực.");
            router.push("/verify-email?email=" + encodeURIComponent(email));
        } catch {
            toast.error("Đăng ký thất bại. Vui lòng thử lại.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
            <Card className="w-full max-w-md border-0 shadow-xl">
                <CardContent className="p-8">
                    <Link href="/register" className="mb-6 inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700">
                        <ArrowLeft size={16} /> Quay lại
                    </Link>

                    <div className="mb-6">
                        <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-[#194d8e]/10">
                            <Building2 size={24} className="text-[#194d8e]" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900">Đăng ký Nhà tuyển dụng</h2>
                        <p className="mt-1 text-sm text-gray-500">Tạo tài khoản để đăng tin tuyển dụng</p>
                    </div>

                    <form onSubmit={handleRegister} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="fullName">Họ và tên *</Label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                                <Input id="fullName" placeholder="Nguyễn Văn A" value={fullName} onChange={(e) => setFullName(e.target.value)} className="h-11 pl-10 bg-gray-50 border-gray-200" />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="email">Email *</Label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                                <Input id="email" type="email" placeholder="email@company.com" value={email} onChange={(e) => setEmail(e.target.value)} className="h-11 pl-10 bg-gray-50 border-gray-200" />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="phone">Số điện thoại</Label>
                            <div className="relative">
                                <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                                <Input id="phone" placeholder="0123 456 789" value={phone} onChange={(e) => setPhone(e.target.value)} className="h-11 pl-10 bg-gray-50 border-gray-200" />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="position">Chức vụ</Label>
                            <div className="relative">
                                <Briefcase className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                                <Input id="position" placeholder="HR Manager" value={position} onChange={(e) => setPosition(e.target.value)} className="h-11 pl-10 bg-gray-50 border-gray-200" />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password">Mật khẩu *</Label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                                <Input id="password" type={showPassword ? "text" : "password"} placeholder="Nhập mật khẩu" value={password} onChange={(e) => setPassword(e.target.value)} className="h-11 pl-10 pr-10 bg-gray-50 border-gray-200" />
                                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>

                        <Button type="submit" disabled={isLoading} className="h-11 w-full bg-[#194d8e] font-semibold hover:bg-[#194d8e]/90">
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            ĐĂNG KÝ
                        </Button>
                    </form>

                    <p className="mt-6 text-center text-sm text-gray-500">
                        Đã có tài khoản?{" "}
                        <Link href="/login" className="font-medium text-[#194d8e] hover:underline">Đăng nhập</Link>
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
