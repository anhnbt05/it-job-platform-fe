"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { candidateService } from "@/services/candidate.service";
import { Candidate, JobTypeLabel, LevelLabel } from "@/types";
import {
  ArrowLeft,
  Loader2,
  Pencil,
  Plus,
  Save,
  Trash2,
  Upload,
  User,
} from "lucide-react";
import { toast } from "react-toastify";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAuthStore } from "@/store/useAuthStore";

type ProfileFormState = {
  FullName: string;
  PhoneNumber: string;
  Bio: string;
  Headline: string;
  Level: string;
  SummaryText: string;
};

type WorkExperienceFormState = {
  ID?: string;
  CompanyName: string;
  Position: string;
  Location: string;
  JobType: string;
  StartDate: string;
  EndDate: string;
  DescriptionsText: string;
};

const initialExperienceState: WorkExperienceFormState = {
  CompanyName: "",
  Position: "",
  Location: "",
  JobType: "full_time",
  StartDate: "",
  EndDate: "",
  DescriptionsText: "",
};

export default function EditProfilePage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<Partial<ProfileFormState>>({});
  const [pendingAvatarFile, setPendingAvatarFile] = useState<File | null>(null);
  const [pendingResumeFile, setPendingResumeFile] = useState<File | null>(null);
  const [experienceDialogOpen, setExperienceDialogOpen] = useState(false);
  const [deleteAccountDialogOpen, setDeleteAccountDialogOpen] =
    useState(false);
  const [experienceForm, setExperienceForm] = useState<WorkExperienceFormState>(
    initialExperienceState,
  );

  const { data: candidate } = useQuery({
    queryKey: ["candidate-profile"],
    queryFn: () => candidateService.getProfile(),
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (payload: Partial<Candidate>) => {
      await candidateService.updateProfile(payload);

      if (pendingAvatarFile) {
        await candidateService.uploadAvatar(pendingAvatarFile);
      }

      if (pendingResumeFile) {
        await candidateService.uploadResume(pendingResumeFile);
      }
    },
    onSuccess: () => {
      toast.success("Đã cập nhật hồ sơ");
      setPendingAvatarFile(null);
      setPendingResumeFile(null);
      queryClient.invalidateQueries({ queryKey: ["candidate-profile"] });
      router.push("/candidate/profile");
    },
    onError: () => toast.error("Không thể cập nhật hồ sơ"),
  });

  const saveExperienceMutation = useMutation({
    mutationFn: (payload: WorkExperienceFormState) => {
      const requestBody = {
        company_name: payload.CompanyName,
        position: payload.Position,
        location: payload.Location,
        job_type: payload.JobType,
        start_date: payload.StartDate,
        end_date: payload.EndDate || undefined,
        descriptions: splitLines(payload.DescriptionsText),
      };

      if (payload.ID) {
        return candidateService.updateWorkExperience(payload.ID, requestBody);
      }

      return candidateService.addWorkExperience(requestBody);
    },
    onSuccess: () => {
      toast.success("Đã lưu kinh nghiệm làm việc");
      setExperienceDialogOpen(false);
      setExperienceForm(initialExperienceState);
      queryClient.invalidateQueries({ queryKey: ["candidate-profile"] });
    },
    onError: () => toast.error("Không thể lưu kinh nghiệm làm việc"),
  });

  const deleteExperienceMutation = useMutation({
    mutationFn: (experienceId: string) =>
      candidateService.deleteWorkExperience(experienceId),
    onSuccess: () => {
      toast.success("Đã xóa kinh nghiệm làm việc");
      queryClient.invalidateQueries({ queryKey: ["candidate-profile"] });
    },
    onError: () => toast.error("Không thể xóa kinh nghiệm làm việc"),
  });

  const deleteAccountMutation = useMutation({
    mutationFn: () => candidateService.deleteAccount(),
    onSuccess: () => {
      setDeleteAccountDialogOpen(false);
      queryClient.clear();
      useAuthStore.getState().logout();
      toast.success("Tài khoản đã được xóa. Đang chuyển về trang đăng nhập...");

      if (typeof window !== "undefined") {
        window.setTimeout(() => {
          window.location.href = "/login";
        }, 1200);
      }
    },
    onError: () => toast.error("Không thể xóa tài khoản"),
  });

  const summaryText = form.SummaryText ?? candidate?.Summary.join("\n") ?? "";
  const summaryLines = useMemo(() => splitLines(summaryText), [summaryText]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    updateProfileMutation.mutate({
      FullName: (form.FullName ?? candidate?.FullName ?? "").trim(),
      PhoneNumber: (form.PhoneNumber ?? candidate?.PhoneNumber ?? "").trim(),
      Bio: (form.Bio ?? candidate?.Bio ?? "").trim(),
      Headline: (form.Headline ?? candidate?.Headline ?? "").trim(),
      Level: (form.Level ?? candidate?.Level) || null,
      Summary: summaryLines,
    });
  };

  return (
    <div className="mx-auto max-w-[960px]">
      <Link
        href="/candidate/profile"
        className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft size={16} />
        Quay lại hồ sơ
      </Link>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="border-border shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <User size={20} className="text-primary" />
              Chỉnh sửa hồ sơ ứng viên
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-5 md:grid-cols-2">
            <Field label="Họ và tên">
              <Input
                value={form.FullName ?? candidate?.FullName ?? ""}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    FullName: event.target.value,
                  }))
                }
                className="h-11"
              />
            </Field>

            <Field label="Số điện thoại">
              <Input
                value={form.PhoneNumber ?? candidate?.PhoneNumber ?? ""}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    PhoneNumber: event.target.value,
                  }))
                }
                className="h-11"
              />
            </Field>

            <Field label="Headline">
              <Input
                value={form.Headline ?? candidate?.Headline ?? ""}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    Headline: event.target.value,
                  }))
                }
                placeholder="Ví dụ: Frontend Developer"
                className="h-11"
              />
            </Field>

            <Field label="Cấp độ">
              <Select
                value={(form.Level ?? candidate?.Level) || undefined}
                onValueChange={(value) =>
                  setForm((current) => ({ ...current, Level: value }))
                }
              >
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Chọn cấp độ" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(LevelLabel).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <div className="md:col-span-2">
              <Field label="Giới thiệu bản thân">
                <Textarea
                  value={form.Bio ?? candidate?.Bio ?? ""}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      Bio: event.target.value,
                    }))
                  }
                  rows={4}
                  placeholder="Viết vài dòng mô tả về bản thân và mục tiêu nghề nghiệp"
                />
              </Field>
            </div>

            <div className="md:col-span-2">
              <Field label="Tóm tắt chuyên môn">
                <Textarea
                  value={summaryText}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      SummaryText: event.target.value,
                    }))
                  }
                  rows={5}
                  placeholder="Mỗi dòng là một ý nổi bật về kinh nghiệm, kỹ năng hoặc thành tựu"
                />
              </Field>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
          <Card className="border-border shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-semibold">
                Tệp hồ sơ
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <Field label="Ảnh đại diện">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) {
                      setPendingAvatarFile(file);
                    }
                    event.target.value = "";
                  }}
                  disabled={updateProfileMutation.isPending}
                />
                <p className="mt-2 text-xs text-muted-foreground">
                  {pendingAvatarFile
                    ? `Đã chọn: ${pendingAvatarFile.name}. Ảnh sẽ được tải lên khi bạn bấm Lưu thay đổi.`
                    : "Chọn ảnh mới nếu bạn muốn thay avatar hiện tại."}
                </p>
              </Field>

              <Field label="Tải CV mới">
                <Input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) {
                      setPendingResumeFile(file);
                    }
                    event.target.value = "";
                  }}
                  disabled={updateProfileMutation.isPending}
                />
                <p className="mt-2 text-xs text-muted-foreground">
                  {pendingResumeFile
                    ? `Đã chọn: ${pendingResumeFile.name}. CV sẽ được tải lên khi bạn bấm Lưu thay đổi.`
                    : "Hỗ trợ PDF, DOC, DOCX."}
                </p>
              </Field>

              <div className="space-y-2">
                <Label>CV hiện có</Label>
                <div className="space-y-2">
                  {candidate?.ResumeUrls.length ? (
                    candidate.ResumeUrls.map((resumeUrl, index) => (
                      <a
                        key={`${resumeUrl}-${index}`}
                        href={resumeUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between rounded-xl border border-border px-3 py-2 text-sm text-foreground hover:border-primary/30 hover:bg-primary/5"
                      >
                        <span>CV #{index + 1}</span>
                        <Upload size={14} className="text-primary" />
                      </a>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Chưa có CV nào trong hồ sơ.
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base font-semibold">
                Kinh nghiệm làm việc
              </CardTitle>
              <Button
                type="button"
                size="sm"
                className="bg-primary hover:bg-primary/90"
                onClick={() => {
                  setExperienceForm(initialExperienceState);
                  setExperienceDialogOpen(true);
                }}
              >
                <Plus size={14} className="mr-1.5" />
                Thêm kinh nghiệm
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {candidate?.WorkExperiences.length ? (
                candidate.WorkExperiences.map((experience) => (
                  <div
                    key={experience.ID}
                    className="rounded-xl border border-border p-4"
                  >
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div>
                        <p className="font-semibold text-foreground">
                          {experience.Position}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {experience.CompanyName}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {formatDateInput(experience.StartDate)} -{" "}
                          {formatDateInput(experience.EndDate)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setExperienceForm({
                              ID: experience.ID,
                              CompanyName: experience.CompanyName || "",
                              Position: experience.Position || "",
                              Location: experience.Location || "",
                              JobType: experience.JobType || "full_time",
                              StartDate: toInputDate(experience.StartDate),
                              EndDate: toInputDate(experience.EndDate),
                              DescriptionsText: (
                                experience.Descriptions || []
                              ).join("\n"),
                            });
                            setExperienceDialogOpen(true);
                          }}
                        >
                          <Pencil size={14} className="mr-1.5" />
                          Sửa
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="border-red-100 text-red-500 hover:bg-red-50 hover:text-red-600"
                          onClick={() =>
                            experience.ID &&
                            deleteExperienceMutation.mutate(experience.ID)
                          }
                        >
                          <Trash2 size={14} className="mr-1.5" />
                          Xóa
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">
                  Bạn chưa thêm kinh nghiệm làm việc nào.
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="border-red-100 bg-red-50/40 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base text-red-700">
              <Trash2 size={18} />
              Vùng nguy hiểm
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="space-y-1">
              <p className="font-medium text-foreground">Xóa vĩnh viễn tài khoản</p>
              <p className="text-sm text-muted-foreground">
                Thao tác này sẽ xóa tài khoản hiện tại và bạn sẽ phải đăng nhập
                lại nếu tạo tài khoản mới.
              </p>
            </div>
            <Button
              type="button"
              variant="destructive"
              onClick={() => setDeleteAccountDialogOpen(true)}
              disabled={deleteAccountMutation.isPending}
            >
              <Trash2 size={16} className="mr-2" />
              Xóa tài khoản
            </Button>
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={() => router.back()}
            disabled={deleteAccountMutation.isPending}
          >
            Hủy
          </Button>
          <Button
            type="submit"
            className="flex-1 bg-primary hover:bg-primary/90"
            disabled={
              updateProfileMutation.isPending || deleteAccountMutation.isPending
            }
          >
            {updateProfileMutation.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save size={16} className="mr-2" />
            )}
            Lưu thay đổi
          </Button>
        </div>
      </form>

      <Dialog
        open={experienceDialogOpen}
        onOpenChange={setExperienceDialogOpen}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {experienceForm.ID
                ? "Cập nhật kinh nghiệm"
                : "Thêm kinh nghiệm làm việc"}
            </DialogTitle>
            <DialogDescription>
              Nhập các thông tin chính về vị trí, công ty và những đầu việc bạn
              đã đảm nhiệm.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Công ty">
              <Input
                value={experienceForm.CompanyName}
                onChange={(event) =>
                  setExperienceForm((current) => ({
                    ...current,
                    CompanyName: event.target.value,
                  }))
                }
              />
            </Field>

            <Field label="Vị trí">
              <Input
                value={experienceForm.Position}
                onChange={(event) =>
                  setExperienceForm((current) => ({
                    ...current,
                    Position: event.target.value,
                  }))
                }
              />
            </Field>

            <Field label="Địa điểm">
              <Input
                value={experienceForm.Location}
                onChange={(event) =>
                  setExperienceForm((current) => ({
                    ...current,
                    Location: event.target.value,
                  }))
                }
              />
            </Field>

            <Field label="Hình thức">
              <Select
                value={experienceForm.JobType}
                onValueChange={(value) =>
                  setExperienceForm((current) => ({
                    ...current,
                    JobType: value,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(JobTypeLabel).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field label="Ngày bắt đầu">
              <Input
                type="date"
                value={experienceForm.StartDate}
                onChange={(event) =>
                  setExperienceForm((current) => ({
                    ...current,
                    StartDate: event.target.value,
                  }))
                }
              />
            </Field>

            <Field label="Ngày kết thúc">
              <Input
                type="date"
                value={experienceForm.EndDate}
                onChange={(event) =>
                  setExperienceForm((current) => ({
                    ...current,
                    EndDate: event.target.value,
                  }))
                }
              />
            </Field>

            <div className="md:col-span-2">
              <Field label="Mô tả công việc">
                <Textarea
                  rows={5}
                  value={experienceForm.DescriptionsText}
                  onChange={(event) =>
                    setExperienceForm((current) => ({
                      ...current,
                      DescriptionsText: event.target.value,
                    }))
                  }
                  placeholder="Mỗi dòng là một đầu việc hoặc thành tựu"
                />
              </Field>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setExperienceDialogOpen(false)}
            >
              Hủy
            </Button>
            <Button
              type="button"
              onClick={() => saveExperienceMutation.mutate(experienceForm)}
              disabled={saveExperienceMutation.isPending}
              className="bg-primary hover:bg-primary/90"
            >
              {saveExperienceMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Lưu kinh nghiệm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={deleteAccountDialogOpen}
        onOpenChange={(open) => {
          if (!deleteAccountMutation.isPending) {
            setDeleteAccountDialogOpen(open);
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Xóa tài khoản ứng viên?</DialogTitle>
            <DialogDescription>
              Sau khi xác nhận, tài khoản của bạn sẽ bị xóa vĩnh viễn và không
              thể khôi phục.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteAccountDialogOpen(false)}
              disabled={deleteAccountMutation.isPending}
            >
              Hủy
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => deleteAccountMutation.mutate()}
              disabled={deleteAccountMutation.isPending}
            >
              {deleteAccountMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Xóa vĩnh viễn
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function splitLines(value: string) {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function toInputDate(dateString: string | null) {
  if (!dateString) {
    return "";
  }

  return new Date(dateString).toISOString().slice(0, 10);
}

function formatDateInput(dateString: string | null) {
  if (!dateString) {
    return "Hiện tại";
  }

  const date = new Date(dateString);
  return `${(date.getMonth() + 1).toString().padStart(2, "0")}/${date.getFullYear()}`;
}
