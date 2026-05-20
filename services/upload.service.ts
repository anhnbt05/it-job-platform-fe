import { api } from "@/lib/axios";
import { UploadedFileAsset } from "@/types";

type UploadFileResponse = {
    success?: boolean;
    message?: string;
    data?: UploadedFileAsset;
};

export const uploadService = {
    async uploadFile(file: File, folder?: string): Promise<UploadFileResponse> {
        const formData = new FormData();
        formData.append("file", file);

        return api.post("/identity/uploads/file", formData, {
            params: {
                folder: folder?.trim() || undefined,
            },
            headers: {
                "Content-Type": "multipart/form-data",
            },
        });
    },
};
