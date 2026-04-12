export interface UploadedFileAsset {
    fileId: string;
    url: string;
    thumbnailUrl?: string;
    name: string;
    height?: number;
    width?: number;
    size: number;
    fileType: string;
}
