"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "react-toastify";
import { authService } from "@/services/auth.service";
import { recruiterService } from "@/services/recruiter.service";
import { Company } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Image from "next/image";
import {
  Building2,
  Mail,
  Lock,
  Phone,
  Eye,
  EyeOff,
  Loader2,
  ArrowLeft,
  User,
  Briefcase,
  Users,
  BarChart3,
  CheckCircle2,
  Search,
  ChevronRight,
  Plus,
  MapPin,
  Globe,
  Check,
} from "lucide-react";

const benefits = [
  { icon: Users, text: "Tiếp cận hàng nghìn ứng viên IT chất lượng" },
  { icon: Briefcase, text: "Đăng tin tuyển dụng nhanh chóng, dễ dàng" },
  { icon: BarChart3, text: "Quản lý đơn ứng tuyển và hồ sơ tập trung" },
  { icon: CheckCircle2, text: "Tìm đúng ứng viên phù hợp với yêu cầu" },
];

const COMPANY_SIZES = [
  "1-10",
  "11-50",
  "51-200",
  "201-500",
  "501-1000",
  "1000+",
];

interface NewCompany {
  name: string;
  size: string;
  website: string;
  description: string;
  location: string;
}

interface NewBranch {
  name: string;
  address: string;
  city: string;
  country: string;
}

type CompanyMode = "select" | "create";

export default function RecruiterRegisterPage() {
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // ── Step 1 ─────────────────────────────────────────────
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [department, setDepartment] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // ── Step 2 – Company ───────────────────────────────────
  const [companyMode, setCompanyMode] = useState<CompanyMode>("select");
  const [companies, setCompanies] = useState<Company[]>([]);
  const [companiesLoading, setCompaniesLoading] = useState(false);
  const [companySearch, setCompanySearch] = useState("");
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [newCompany, setNewCompany] = useState<NewCompany>({
    name: "",
    size: "",
    website: "",
    description: "",
    location: "",
  });

  // ── Step 3 – Branch ────────────────────────────────────
  const [newBranch, setNewBranch] = useState<NewBranch>({
    name: "",
    address: "",
    city: "",
    country: "Vietnam",
  });

  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  // Load companies on step 2
  useEffect(() => {
    if (step !== 2 || companyMode !== "select") return;
    setCompaniesLoading(true);
    recruiterService
      .getCompanies()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .then((res: any) =>
        setCompanies(Array.isArray(res) ? res : (res.data ?? [])),
      )
      .catch(() => toast.error("Không thể tải danh sách công ty"))
      .finally(() => setCompaniesLoading(false));
  }, [step, companyMode]);

  const filteredCompanies = useMemo(
    () =>
      companies.filter((c) =>
        c.Name.toLowerCase().includes(companySearch.toLowerCase()),
      ),
    [companies, companySearch],
  );

  // ── Handlers ────────────────────────────────────────────
  const handleStep1 = (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim() || !password.trim() || !phone.trim()) {
      toast.error("Vui lòng nhập đầy đủ thông tin bắt buộc");
      return;
    }
    setStep(2);
  };

  const handleStep2 = () => {
    if (companyMode === "select" && !selectedCompany) {
      toast.error("Vui lòng chọn công ty hoặc tạo công ty mới");
      return;
    }
    if (companyMode === "create" && !newCompany.name.trim()) {
      toast.error("Vui lòng nhập tên công ty");
      return;
    }
    setStep(3);
  };

  const handleRegister = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!newBranch.city.trim()) {
      toast.error("Vui lòng nhập thành phố cho chi nhánh");
      return;
    }

    setIsLoading(true);
    try {
      await authService.signUpRecruiter({
        email: email.trim(),
        password: password.trim(),
        full_name: fullName.trim(),
        phone_number: phone.trim(),
        recruiter: {
          department: department.trim() || undefined,
          ...(companyMode === "select"
            ? { company_id: selectedCompany!.ID }
            : {
                company: {
                  name: newCompany.name.trim(),
                  size: newCompany.size || undefined,
                  website: newCompany.website.trim() || undefined,
                  description: newCompany.description.trim() || undefined,
                  location: newCompany.location.trim() || undefined,
                },
              }),
          branch: {
            name: newBranch.name.trim() || undefined,
            address: newBranch.address.trim() || undefined,
            city: newBranch.city.trim() || undefined,
            country: newBranch.country.trim() || undefined,
          },
        },
      });
      toast.success("Đăng ký thành công! Vui lòng kiểm tra email để xác thực.");
      router.push("/verify-email?email=" + encodeURIComponent(email));
    } catch {
      toast.error("Đăng ký thất bại. Vui lòng thử lại.");
    } finally {
      setIsLoading(false);
    }
  };

  const stepLabels = ["Thông tin cơ bản", "Công ty", "Chi nhánh"];

  // ── Render ───────────────────────────────────────────────
  return (
    <div className="flex h-screen overflow-hidden">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 shrink-0 flex-col justify-between bg-linear-to-br from-[#0f4c2a] via-[#166534] to-[#14532d] px-12 pt-12 pb-16 text-white sticky top-0 overflow-hidden h-screen">
        <div className="absolute -top-24 -left-24 h-96 w-96 rounded-full bg-white/5" />
        <div className="absolute -bottom-32 -right-16 h-80 w-80 rounded-full bg-white/5" />
        <div className="absolute top-1/2 -right-20 h-64 w-64 rounded-full bg-white/5" />

        <div className="relative z-10">
          <Link href="/" className="flex items-center gap-3 w-fit">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20">
              <Briefcase size={22} className="text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight">
              ITJob Platform
            </span>
          </Link>
        </div>

        <div className="relative z-10 flex-1 flex flex-col justify-center py-12">
          <div className="mb-2 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15">
            <Building2 size={28} className="text-white" />
          </div>
          <h2 className="mt-6 text-3xl font-bold leading-tight">
            Tuyển dụng IT
            <br />
            hiệu quả hơn bao giờ hết
          </h2>
          <p className="mt-3 text-green-100/80 text-base leading-relaxed max-w-sm">
            Kết nối với cộng đồng ứng viên IT chuyên nghiệp và tìm kiếm nhân tài
            phù hợp cho doanh nghiệp của bạn.
          </p>

          <ul className="mt-8 space-y-4">
            {benefits.map(({ icon: Icon, text }, i) => (
              <li key={i} className="flex items-center gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/15">
                  <Icon size={16} className="text-white" />
                </div>
                <span className="text-sm text-green-100/90">{text}</span>
              </li>
            ))}
          </ul>

          {/* Step indicator */}
          <div className="mt-10 flex items-center gap-2">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center gap-2">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all ${step > s ? "bg-card text-green-700" : step === s ? "bg-card text-green-700" : "bg-white/20 text-white/60"}`}
                >
                  {step > s ? <Check size={14} /> : s}
                </div>
                {s < 3 && (
                  <div
                    className={`h-0.5 w-6 rounded transition-all ${step > s ? "bg-card" : "bg-white/25"}`}
                  />
                )}
              </div>
            ))}
            <span className="ml-2 text-xs text-green-100/70">
              {stepLabels[step - 1]}
            </span>
          </div>
        </div>

        <div className="relative z-10 border-t border-white/15 pt-3">
          <p className="text-xs text-green-100/60">
            © 2026 ITJob Platform. Nền tảng tuyển dụng IT hàng đầu Việt Nam.
          </p>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex w-full lg:w-1/2 flex-col items-center bg-muted/40 px-6 py-12 overflow-y-auto">
        <div className="w-full max-w-md">
          {/* Mobile progress */}
          <div className="mb-6 flex items-center gap-2 lg:hidden">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`h-1.5 flex-1 rounded-full transition-all ${step >= s ? "bg-green-700" : "bg-gray-200"}`}
              />
            ))}
          </div>

          {/* ── STEP 1 ── */}
          {step === 1 && (
            <>
              <Link
                href="/register"
                className="mb-8 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft size={16} /> Quay lại
              </Link>

              <div className="mb-8">
                <p className="text-xs font-medium text-green-700 uppercase tracking-wider mb-1">
                  Bước 1 / 3
                </p>
                <h1 className="text-2xl font-bold text-foreground">
                  Đăng ký Nhà tuyển dụng
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Tạo tài khoản để đăng tin tuyển dụng
                </p>
              </div>

              <form onSubmit={handleStep1} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">
                    Họ và tên <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="fullName"
                      placeholder="Nguyễn Văn A"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="h-11 pl-10 bg-card border-border"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">
                    Email <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="email@company.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="h-11 pl-10 bg-card border-border"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">
                    Số điện thoại <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="phone"
                      placeholder="0123 456 789"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="h-11 pl-10 bg-card border-border"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="department">Phòng ban</Label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="department"
                      placeholder="HR, Talent Acquisition..."
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      className="h-11 pl-10 bg-card border-border"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">
                    Mật khẩu <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Nhập mật khẩu"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-11 pl-10 pr-10 bg-card border-border"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-muted-foreground"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="mt-2 h-11 w-full bg-green-700 font-semibold hover:bg-green-800 gap-2"
                >
                  Tiếp tục <ChevronRight size={16} />
                </Button>
              </form>

              <p className="mt-6 text-center text-sm text-muted-foreground">
                Đã có tài khoản?{" "}
                <Link
                  href="/login"
                  className="font-medium text-green-700 hover:underline"
                >
                  Đăng nhập
                </Link>
              </p>
            </>
          )}

          {/* ── STEP 2 – COMPANY ── */}
          {step === 2 && (
            <>
              <button
                onClick={() => setStep(1)}
                className="mb-8 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft size={16} /> Quay lại
              </button>

              <div className="mb-6">
                <p className="text-xs font-medium text-green-700 uppercase tracking-wider mb-1">
                  Bước 2 / 3
                </p>
                <h1 className="text-2xl font-bold text-foreground">
                  Chọn công ty
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Chọn công ty bạn đang làm việc hoặc tạo mới
                </p>
              </div>

              {companyMode === "select" ? (
                <>
                  {/* Search */}
                  <div className="relative mb-3">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Tìm kiếm công ty..."
                      value={companySearch}
                      onChange={(e) => setCompanySearch(e.target.value)}
                      className="h-10 pl-10 bg-card border-border"
                    />
                  </div>

                  {/* Company list */}
                  <div className="max-h-72 overflow-y-auto space-y-2 mb-4 pr-1">
                    {companiesLoading ? (
                      <div className="flex items-center justify-center py-10 text-muted-foreground">
                        <Loader2 size={20} className="animate-spin mr-2" /> Đang
                        tải...
                      </div>
                    ) : filteredCompanies.length === 0 ? (
                      <p className="py-8 text-center text-sm text-muted-foreground">
                        Không tìm thấy công ty
                      </p>
                    ) : (
                      filteredCompanies.map((company) => (
                        <button
                          key={company.ID}
                          type="button"
                          onClick={() => setSelectedCompany(company)}
                          className={`w-full flex items-center gap-3 rounded-lg border p-3 text-left transition-all ${selectedCompany?.ID === company.ID ? "border-green-600 bg-green-50 ring-1 ring-green-600" : "border-border bg-card hover:border-green-300 hover:bg-green-50/30"}`}
                        >
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-muted overflow-hidden">
                            {company.LogoUrl ? (
                              <Image
                                src={company.LogoUrl!}
                                alt={company.Name}
                                width={40}
                                height={40}
                                className="h-full w-full object-contain"
                              />
                            ) : (
                              <Building2 size={18} className="text-muted-foreground" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-foreground">
                              {company.Name}
                            </p>
                            {company.WebsiteUrl && (
                              <p className="truncate text-xs text-muted-foreground">
                                {company.WebsiteUrl}
                              </p>
                            )}
                          </div>
                          {selectedCompany?.ID === company.ID && (
                            <Check
                              size={16}
                              className="shrink-0 text-green-600"
                            />
                          )}
                        </button>
                      ))
                    )}
                  </div>

                  <div className="relative mb-4">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-border" />
                    </div>
                    <div className="relative flex justify-center text-xs text-muted-foreground">
                      <span className="bg-muted/40 px-2">hoặc</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setCompanyMode("create");
                      setSelectedCompany(null);
                    }}
                    className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-card py-3 text-sm font-medium text-muted-foreground hover:border-green-500 hover:text-green-700 transition-colors"
                  >
                    <Plus size={16} /> Tạo công ty mới
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => setCompanyMode("select")}
                    className="mb-5 inline-flex items-center gap-1.5 text-xs text-green-700 hover:text-green-800 font-medium transition-colors"
                  >
                    <ArrowLeft size={13} /> Quay lại danh sách
                  </button>

                  <div className="space-y-4 mb-6">
                    <div className="space-y-2">
                      <Label>
                        Tên công ty <span className="text-red-500">*</span>
                      </Label>
                      <div className="relative">
                        <Building2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          placeholder="Công ty TNHH ABC"
                          value={newCompany.name}
                          onChange={(e) =>
                            setNewCompany({
                              ...newCompany,
                              name: e.target.value,
                            })
                          }
                          className="h-11 pl-10 bg-card border-border"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Quy mô</Label>
                      <select
                        value={newCompany.size}
                        onChange={(e) =>
                          setNewCompany({ ...newCompany, size: e.target.value })
                        }
                        className="h-11 w-full rounded-md border border-border bg-card px-3 text-sm text-foreground focus:border-green-700 focus:outline-none focus:ring-2 focus:ring-green-700/20"
                      >
                        <option value="">-- Chọn quy mô --</option>
                        {COMPANY_SIZES.map((s) => (
                          <option key={s} value={s}>
                            {s} nhân viên
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <Label>Website</Label>
                      <div className="relative">
                        <Globe className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          placeholder="https://company.com"
                          value={newCompany.website}
                          onChange={(e) =>
                            setNewCompany({
                              ...newCompany,
                              website: e.target.value,
                            })
                          }
                          className="h-11 pl-10 bg-card border-border"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Địa điểm</Label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          placeholder="Hà Nội, TP.HCM..."
                          value={newCompany.location}
                          onChange={(e) =>
                            setNewCompany({
                              ...newCompany,
                              location: e.target.value,
                            })
                          }
                          className="h-11 pl-10 bg-card border-border"
                        />
                      </div>
                    </div>
                  </div>
                </>
              )}

              <Button
                type="button"
                onClick={handleStep2}
                className="mt-2 h-11 w-full bg-green-700 font-semibold hover:bg-green-800 gap-2"
              >
                Tiếp tục <ChevronRight size={16} />
              </Button>
            </>
          )}

          {/* ── STEP 3 – BRANCH ── */}
          {step === 3 && (
            <>
              <button
                onClick={() => setStep(2)}
                className="mb-8 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft size={16} /> Quay lại
              </button>

              <div className="mb-6">
                <p className="text-xs font-medium text-green-700 uppercase tracking-wider mb-1">
                  Bước 3 / 3
                </p>
                <h1 className="text-2xl font-bold text-foreground">
                  Chọn chi nhánh
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  {companyMode === "create"
                    ? `Tạo chi nhánh cho ${newCompany.name || "công ty mới"}`
                    : `Chi nhánh của ${selectedCompany?.Name}`}
                </p>
              </div>

              <form onSubmit={handleRegister} className="space-y-4">
                <div className="rounded-lg border border-green-100 bg-green-50/60 p-3 text-sm text-green-800">
                  Backend hiện yêu cầu recruiter phải có chi nhánh khi đăng ký.
                  Ở bước này bạn sẽ khai báo chi nhánh làm việc để hệ thống tạo
                  mới cùng lúc với tài khoản.
                </div>

                <div className="space-y-3 rounded-lg border border-border bg-card p-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Tên chi nhánh</Label>
                    <Input
                      placeholder="Chi nhánh Hà Nội"
                      value={newBranch.name}
                      onChange={(e) =>
                        setNewBranch({ ...newBranch, name: e.target.value })
                      }
                      className="h-9 text-sm bg-muted/40 border-border"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Địa chỉ</Label>
                    <Input
                      placeholder="123 Đường ABC, Quận 1"
                      value={newBranch.address}
                      onChange={(e) =>
                        setNewBranch({
                          ...newBranch,
                          address: e.target.value,
                        })
                      }
                      className="h-9 text-sm bg-muted/40 border-border"
                    />
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label className="text-xs">
                        Thành phố <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        placeholder="Hà Nội"
                        value={newBranch.city}
                        onChange={(e) =>
                          setNewBranch({
                            ...newBranch,
                            city: e.target.value,
                          })
                        }
                        className="h-9 text-sm bg-muted/40 border-border"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Quốc gia</Label>
                      <Input
                        placeholder="Vietnam"
                        value={newBranch.country}
                        onChange={(e) =>
                          setNewBranch({
                            ...newBranch,
                            country: e.target.value,
                          })
                        }
                        className="h-9 text-sm bg-muted/40 border-border"
                      />
                    </div>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="mt-2 h-11 w-full bg-green-700 font-semibold hover:bg-green-800"
                >
                  {isLoading && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  HOÀN TẤT ĐĂNG KÝ
                </Button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
