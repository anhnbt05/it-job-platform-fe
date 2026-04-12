"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { uploadService } from "@/services/upload.service";
import { UploadedFileAsset } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Copy, ExternalLink, FileImage, FileText, Loader2, Upload } from "lucide-react";
import { toast } from "react-toastify";

export default function AdminUploadsPage() {
    const [folder, setFolder] = useState("");
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [uploadedFile, setUploadedFile] = useState<UploadedFileAsset | null>(null);

    const uploadMutation = useMutation({
        mutationFn: async () => {
            if (!selectedFile) {
                throw new Error("missing_file");
            }

            return uploadService.uploadFile(selectedFile, folder);
        },
        onSuccess: (data) => {
            setUploadedFile(data);
            toast.success("Đã upload tệp");
        },
        onError: (error) => {
            if (error instanceof Error && error.message === "missing_file") {
                toast.error("Bạn cần chọn tệp trước khi upload");
                return;
            }

            toast.error("Không thể upload tệp");
        },
    });

    return (
        <div className="mx-auto max-w-[1120px] space-y-6">
            <div>
                <Badge className="bg-primary/10 text-primary">Upload Utility</Badge>
                <h1 className="mt-3 text-2xl font-bold text-foreground">Tải tệp lên hệ thống</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                    Giao diện gọi trực tiếp `POST /identity/uploads/file` để lấy URL tệp đã được lưu trên backend.
                </p>
            </div>

            <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
                <Card className="border-border shadow-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <Upload size={18} className="text-primary" />
                            Cấu hình upload
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-5">
                        <div className="space-y-2">
                            <Label htmlFor="upload-folder">Folder đích</Label>
                            <Input
                                id="upload-folder"
                                value={folder}
                                onChange={(event) => setFolder(event.target.value)}
                                placeholder="examples: companies, avatars, banners"
                            />
                            <p className="text-xs text-muted-foreground">
                                Tham số này sẽ được gửi dưới dạng query `folder`. Có thể để trống.
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="upload-file">Chọn tệp</Label>
                            <Input
                                id="upload-file"
                                type="file"
                                onChange={(event) => setSelectedFile(event.target.files?.[0] || null)}
                            />
                        </div>

                        <div className="rounded-2xl border border-dashed border-border bg-muted/30 p-5">
                            {selectedFile ? (
                                <div className="space-y-2">
                                    <p className="font-medium text-foreground">{selectedFile.name}</p>
                                    <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                                        <span>{selectedFile.type || "application/octet-stream"}</span>
                                        <span>{formatFileSize(selectedFile.size)}</span>
                                    </div>
                                </div>
                            ) : (
                                <p className="text-sm text-muted-foreground">
                                    Chưa chọn file. Endpoint backend yêu cầu multipart field name là `file`.
                                </p>
                            )}
                        </div>

                        <div className="flex flex-wrap gap-3">
                            <Button
                                type="button"
                                className="bg-primary hover:bg-primary/90"
                                disabled={uploadMutation.isPending}
                                onClick={() => uploadMutation.mutate()}
                            >
                                {uploadMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload size={16} className="mr-2" />}
                                Upload ngay
                            </Button>

                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                    setFolder("");
                                    setSelectedFile(null);
                                    setUploadedFile(null);
                                }}
                            >
                                Reset
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-border shadow-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <FileImage size={18} className="text-primary" />
                            Kết quả trả về
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {uploadedFile ? (
                            <div className="space-y-4">
                                {uploadedFile.fileType.startsWith("image/") && (
                                    <div className="overflow-hidden rounded-2xl border border-border bg-muted/30">
                                        <img
                                            src={uploadedFile.url}
                                            alt={uploadedFile.name}
                                            className="h-56 w-full object-cover"
                                        />
                                    </div>
                                )}

                                <ResultItem label="Tên file" value={uploadedFile.name} />
                                <ResultItem label="File ID" value={uploadedFile.fileId} />
                                <ResultItem label="File type" value={uploadedFile.fileType} />
                                <ResultItem label="Dung lượng" value={formatFileSize(uploadedFile.size)} />
                                <ResultItem label="Kích thước" value={formatDimensions(uploadedFile)} />
                                <ResultItem label="URL" value={uploadedFile.url} multiline />

                                <div className="flex flex-wrap gap-3">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={async () => {
                                            await navigator.clipboard.writeText(uploadedFile.url);
                                            toast.success("Đã copy URL");
                                        }}
                                    >
                                        <Copy size={16} className="mr-2" />
                                        Copy URL
                                    </Button>
                                    <Button asChild className="bg-primary hover:bg-primary/90">
                                        <a href={uploadedFile.url} target="_blank" rel="noreferrer">
                                            <ExternalLink size={16} className="mr-2" />
                                            Mở file
                                        </a>
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div className="rounded-2xl border border-dashed border-border bg-muted/30 p-6 text-sm text-muted-foreground">
                                Chưa có kết quả upload. Sau khi gửi file thành công, URL và metadata trả về sẽ hiển thị ở đây.
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            <Card className="border-border shadow-sm">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                        <FileText size={18} className="text-primary" />
                        Lưu ý kỹ thuật
                    </CardTitle>
                </CardHeader>
                <CardContent className="grid gap-3 text-sm text-muted-foreground md:grid-cols-3">
                    <div className="rounded-2xl border border-border p-4">
                        Endpoint public nên có thể gọi không cần đăng nhập, nhưng giao diện này vẫn đặt trong admin để tiện test nội bộ.
                    </div>
                    <div className="rounded-2xl border border-border p-4">
                        Backend hiện trả về `fileId`, `url`, `name`, `size`, `fileType` và có thể có `thumbnailUrl`, `width`, `height`.
                    </div>
                    <div className="rounded-2xl border border-border p-4">
                        Nếu muốn dùng cho các flow business khác như upload logo công ty, avatar hoặc banner thì có thể tái sử dụng service này.
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

function ResultItem({
    label,
    value,
    multiline = false,
}: {
    label: string;
    value: string;
    multiline?: boolean;
}) {
    return (
        <div className="rounded-xl border border-border p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
            <p className={`mt-2 text-sm font-medium text-foreground ${multiline ? "break-all" : ""}`}>{value}</p>
        </div>
    );
}

function formatFileSize(size: number) {
    if (size < 1024) {
        return `${size} B`;
    }

    if (size < 1024 * 1024) {
        return `${(size / 1024).toFixed(1)} KB`;
    }

    return `${(size / (1024 * 1024)).toFixed(2)} MB`;
}

function formatDimensions(file: UploadedFileAsset) {
    if (!file.width || !file.height) {
        return "Không có";
    }

    return `${file.width} x ${file.height}`;
}
