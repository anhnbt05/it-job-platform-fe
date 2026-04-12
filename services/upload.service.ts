import { api } from "@/lib/axios";
import { unwrapData } from "@/services/mappers";
import { UploadedFileAsset } from "@/types";

export const uploadService = {
    async uploadFile(file: File, folder?: string): Promise<UploadedFileAsset> {
        const formData = new FormData();
        formData.append("file", file);

        const response = await api.post("/identity/uploads/file", formData, {
            params: {
                folder: folder?.trim() || undefined,
            },
            headers: {
                "Content-Type": "multipart/form-data",
            },
        });

        return unwrapData<UploadedFileAsset>(response);
    },
};
