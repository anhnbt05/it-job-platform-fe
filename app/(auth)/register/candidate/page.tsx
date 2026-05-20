"use client";

import { useState, KeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "react-toastify";
import { toastApiError, toastApiSuccess } from "@/lib/axios";
import { authService } from "@/services/auth.service";
import { Level, LevelLabel } from "@/types/enums";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  User,
  Mail,
  Lock,
  Phone,
  Eye,
  EyeOff,
  Loader2,
  ArrowLeft,
  Briefcase,
  Search,
  TrendingUp,
  CheckCircle2,
  X,
  Plus,
  GraduationCap,
  ChevronRight,
} from "lucide-react";

const benefits = [
  { icon: Search, text: "Tìm kiếm hàng nghìn việc làm IT chất lượng" },
  { icon: Briefcase, text: "Nộp CV và theo dõi đơn ứng tuyển dễ dàng" },
  { icon: TrendingUp, text: "Nhận gợi ý việc làm phù hợp với kỹ năng" },
  { icon: CheckCircle2, text: "Kết nối trực tiếp với nhà tuyển dụng hàng đầu" },
];

interface Education {
  school: string;
  degree: string;
  field: string;
  startYear: string;
  endYear: string;
}

const emptyEducation = (): Education => ({
  school: "",
  degree: "",
  field: "",
  startYear: "",
  endYear: "",
});

export default function CandidateRegisterPage() {
  const [step, setStep] = useState<1 | 2>(1);

  // Step 1
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Step 2
  const [level, setLevel] = useState<string>("");
  const [skillInput, setSkillInput] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [certInput, setCertInput] = useState("");
  const [certifications, setCertifications] = useState<string[]>([]);
  const [educations, setEducations] = useState<Education[]>([]);

  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  // ── Skills ──────────────────────────────────────────────
  const addSkill = (raw: string) => {
    raw.split(/[,;]+/).forEach((s) => {
      const t = s.trim();
      if (t && !skills.includes(t)) setSkills((prev) => [...prev, t]);
    });
    setSkillInput("");
  };

  const handleSkillKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (["Enter", ",", ";"].includes(e.key)) {
      e.preventDefault();
      addSkill(skillInput);
    }
  };

  const handleSkillBlur = () => {
    if (skillInput.trim()) addSkill(skillInput);
  };

  // ── Certifications ───────────────────────────────────────
  const addCert = (raw: string) => {
    raw.split(/[,;]+/).forEach((s) => {
      const t = s.trim();
      if (t && !certifications.includes(t))
        setCertifications((prev) => [...prev, t]);
    });
    setCertInput("");
  };

  const handleCertKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (["Enter", ",", ";"].includes(e.key)) {
      e.preventDefault();
      addCert(certInput);
    }
  };

  const handleCertBlur = () => {
    if (certInput.trim()) addCert(certInput);
  };

  // ── Educations ───────────────────────────────────────────
  const addEducation = () =>
    setEducations((prev) => [...prev, emptyEducation()]);

  const updateEdu = (i: number, field: keyof Education, value: string) =>
    setEducations((prev) =>
      prev.map((e, idx) => (idx === i ? { ...e, [field]: value } : e)),
    );

  const removeEdu = (i: number) =>
    setEducations((prev) => prev.filter((_, idx) => idx !== i));

  // ── Steps ────────────────────────────────────────────────
  const handleStep1 = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim() || !password.trim() || !phone.trim()) {
      toast.error("Vui lòng nhập đầy đủ thông tin bắt buộc");
      return;
    }
    setStep(2);
  };

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!level) {
      toast.error("Vui lòng chọn cấp độ kinh nghiệm");
      return;
    }

    setIsLoading(true);
    try {
      const response = await authService.signUpCandidate({
        email: email.trim(),
        password: password.trim(),
        full_name: fullName.trim(),
        phone_number: phone.trim(),
        candidate: {
          level,
          ...(skills.length ? { skills } : {}),
          ...(certifications.length ? { certifications } : {}),
          ...(educations.length
            ? {
                educations: educations.map((edu) =>
                  [
                    edu.school.trim(),
                    edu.degree.trim(),
                    edu.field.trim(),
                    edu.startYear.trim() && `Từ ${edu.startYear.trim()}`,
                    edu.endYear.trim() && `đến ${edu.endYear.trim()}`,
                  ]
                    .filter(Boolean)
                    .join(" - "),
                ),
              }
            : {}),
        },
      });

      toastApiSuccess(response);
      router.push("/verify-email?email=" + encodeURIComponent(email));
    } catch (error) {
      toastApiError(error);
    } finally {
      setIsLoading(false);
    }
  };

  // ── Render ───────────────────────────────────────────────
  return (
    <div className="flex h-screen overflow-hidden">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 shrink-0 flex-col justify-between bg-linear-to-br from-[#194d8e] via-[#1a5ba8] to-[#0d3566] px-12 pt-12 pb-16 text-white sticky top-0 overflow-hidden h-screen">
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
            <User size={28} className="text-white" />
          </div>
          <h2 className="mt-6 text-3xl font-bold leading-tight">
            Bắt đầu hành trình
            <br />
            sự nghiệp IT của bạn
          </h2>
          <p className="mt-3 text-blue-100/80 text-base leading-relaxed max-w-sm">
            Gia nhập cộng đồng hàng chục nghìn ứng viên IT đang tìm kiếm cơ hội
            nghề nghiệp tốt nhất.
          </p>

          <ul className="mt-8 space-y-4">
            {benefits.map(({ icon: Icon, text }, i) => (
              <li key={i} className="flex items-center gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/15">
                  <Icon size={16} className="text-white" />
                </div>
                <span className="text-sm text-blue-100/90">{text}</span>
              </li>
            ))}
          </ul>

          {/* Step indicator */}
          <div className="mt-10 flex items-center gap-3">
            {[1, 2].map((s) => (
              <div key={s} className="flex items-center gap-3">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all ${step >= s ? "bg-card text-primary" : "bg-white/20 text-white/60"}`}
                >
                  {s}
                </div>
                {s < 2 && (
                  <div
                    className={`h-0.5 w-8 rounded transition-all ${step >= 2 ? "bg-card" : "bg-white/25"}`}
                  />
                )}
              </div>
            ))}
            <span className="ml-1 text-xs text-blue-100/70">
              {step === 1 ? "Thông tin cơ bản" : "Thông tin nghề nghiệp"}
            </span>
          </div>
        </div>

        <div className="relative z-10 border-t border-white/15 pt-3">
          <p className="text-xs text-blue-100/60">
            © 2026 ITJob Platform. Nền tảng tuyển dụng IT hàng đầu Việt Nam.
          </p>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex w-full lg:w-1/2 flex-col items-center bg-muted/40 px-6 py-12 overflow-y-auto">
        <div className="w-full max-w-md">
          {/* Mobile step indicator */}
          <div className="mb-6 flex items-center gap-2 lg:hidden">
            {[1, 2].map((s) => (
              <div
                key={s}
                className={`h-1.5 flex-1 rounded-full transition-all ${step >= s ? "bg-primary" : "bg-gray-200"}`}
              />
            ))}
          </div>

          {step === 1 ? (
            <>
              <Link
                href="/register"
                className="mb-8 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft size={16} /> Quay lại
              </Link>

              <div className="mb-8">
                <p className="text-xs font-medium text-primary uppercase tracking-wider mb-1">
                  Bước 1 / 2
                </p>
                <h1 className="text-2xl font-bold text-foreground">
                  Đăng ký Ứng viên
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Tạo tài khoản để tìm kiếm việc làm IT
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
                      placeholder="email@example.com"
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
                  className="mt-2 h-11 w-full bg-primary font-semibold hover:bg-primary/90 gap-2"
                >
                  Tiếp tục <ChevronRight size={16} />
                </Button>
              </form>

              <p className="mt-6 text-center text-sm text-muted-foreground">
                Đã có tài khoản?{" "}
                <Link
                  href="/login"
                  className="font-medium text-primary hover:underline"
                >
                  Đăng nhập
                </Link>
              </p>
            </>
          ) : (
            <>
              <button
                onClick={() => setStep(1)}
                className="mb-8 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft size={16} /> Quay lại
              </button>

              <div className="mb-8">
                <p className="text-xs font-medium text-primary uppercase tracking-wider mb-1">
                  Bước 2 / 2
                </p>
                <h1 className="text-2xl font-bold text-foreground">
                  Thông tin nghề nghiệp
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Tất cả đều không bắt buộc, có thể cập nhật sau
                </p>
              </div>

              <form onSubmit={handleRegister} className="space-y-5">
                {/* Level */}
                <div className="space-y-2">
                  <Label htmlFor="level">Cấp độ kinh nghiệm</Label>
                  <select
                    id="level"
                    value={level}
                    onChange={(e) => setLevel(e.target.value)}
                    className="h-11 w-full rounded-md border border-border bg-card px-3 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="">-- Chọn cấp độ --</option>
                    {Object.values(Level).map((v) => (
                      <option key={v} value={v}>
                        {LevelLabel[v]}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Skills */}
                <div className="space-y-2">
                  <Label htmlFor="skills">Kỹ năng</Label>
                  <div className="min-h-11 w-full rounded-md border border-border bg-card px-3 py-2 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all">
                    <div className="flex flex-wrap gap-1.5 mb-1.5">
                      {skills.map((s) => (
                        <span
                          key={s}
                          className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary"
                        >
                          {s}
                          <button
                            type="button"
                            onClick={() =>
                              setSkills(skills.filter((x) => x !== s))
                            }
                            className="hover:text-red-500 transition-colors"
                          >
                            <X size={11} />
                          </button>
                        </span>
                      ))}
                    </div>
                    <input
                      id="skills"
                      value={skillInput}
                      onChange={(e) => setSkillInput(e.target.value)}
                      onKeyDown={handleSkillKeyDown}
                      onBlur={handleSkillBlur}
                      placeholder={
                        skills.length === 0
                          ? "Nhập kỹ năng, phân cách bằng , hoặc ;"
                          : "Thêm kỹ năng..."
                      }
                      className="w-full text-sm outline-none bg-transparent placeholder:text-muted-foreground"
                    />
                  </div>
                </div>

                {/* Certifications */}
                <div className="space-y-2">
                  <Label htmlFor="certifications">Chứng chỉ</Label>
                  <div className="min-h-11 w-full rounded-md border border-border bg-card px-3 py-2 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all">
                    <div className="flex flex-wrap gap-1.5 mb-1.5">
                      {certifications.map((c) => (
                        <span
                          key={c}
                          className="inline-flex items-center gap-1 rounded-full bg-purple-50 px-2.5 py-0.5 text-xs font-medium text-purple-700"
                        >
                          {c}
                          <button
                            type="button"
                            onClick={() =>
                              setCertifications(
                                certifications.filter((x) => x !== c),
                              )
                            }
                            className="hover:text-red-500 transition-colors"
                          >
                            <X size={11} />
                          </button>
                        </span>
                      ))}
                    </div>
                    <input
                      id="certifications"
                      value={certInput}
                      onChange={(e) => setCertInput(e.target.value)}
                      onKeyDown={handleCertKeyDown}
                      onBlur={handleCertBlur}
                      placeholder={
                        certifications.length === 0
                          ? "VD: AWS Solutions Architect, IELTS 7.0,..."
                          : "Thêm chứng chỉ..."
                      }
                      className="w-full text-sm outline-none bg-transparent placeholder:text-muted-foreground"
                    />
                  </div>
                </div>

                {/* Educations */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Học vấn</Label>
                    <button
                      type="button"
                      onClick={addEducation}
                      className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
                    >
                      <Plus size={13} /> Thêm
                    </button>
                  </div>

                  {educations.length === 0 ? (
                    <button
                      type="button"
                      onClick={addEducation}
                      className="flex w-full items-center justify-center gap-2 rounded-md border border-dashed border-border bg-card py-4 text-sm text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors"
                    >
                      <GraduationCap size={16} /> Thêm thông tin học vấn
                    </button>
                  ) : (
                    <div className="space-y-3">
                      {educations.map((edu, i) => (
                        <div
                          key={i}
                          className="rounded-lg border border-border bg-card p-4 space-y-3"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                              Học vấn #{i + 1}
                            </span>
                            <button
                              type="button"
                              onClick={() => removeEdu(i)}
                              className="text-muted-foreground hover:text-red-500 transition-colors"
                            >
                              <X size={14} />
                            </button>
                          </div>

                          <div className="space-y-1">
                            <Label className="text-xs">Trường</Label>
                            <Input
                              placeholder="Đại học Bách Khoa Hà Nội"
                              value={edu.school}
                              onChange={(e) =>
                                updateEdu(i, "school", e.target.value)
                              }
                              className="h-9 text-sm bg-muted/40 border-border"
                            />
                          </div>

                          <div className="grid gap-2 sm:grid-cols-2">
                            <div className="space-y-1">
                              <Label className="text-xs">Bằng cấp</Label>
                              <Input
                                placeholder="Cử nhân"
                                value={edu.degree}
                                onChange={(e) =>
                                  updateEdu(i, "degree", e.target.value)
                                }
                                className="h-9 text-sm bg-muted/40 border-border"
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">Ngành học</Label>
                              <Input
                                placeholder="Công nghệ thông tin"
                                value={edu.field}
                                onChange={(e) =>
                                  updateEdu(i, "field", e.target.value)
                                }
                                className="h-9 text-sm bg-muted/40 border-border"
                              />
                            </div>
                          </div>

                          <div className="grid gap-2 sm:grid-cols-2">
                            <div className="space-y-1">
                              <Label className="text-xs">Năm bắt đầu</Label>
                              <Input
                                placeholder="2020"
                                value={edu.startYear}
                                onChange={(e) =>
                                  updateEdu(i, "startYear", e.target.value)
                                }
                                className="h-9 text-sm bg-muted/40 border-border"
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">Năm kết thúc</Label>
                              <Input
                                placeholder="2024"
                                value={edu.endYear}
                                onChange={(e) =>
                                  updateEdu(i, "endYear", e.target.value)
                                }
                                className="h-9 text-sm bg-muted/40 border-border"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="mt-2 h-11 w-full bg-primary font-semibold hover:bg-primary/90"
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
