export enum JobType {
    FULL_TIME = "full_time",
    PART_TIME = "part_time",
    REMOTE = "remote",
    FREELANCE = "free_lance",
}

export const JobTypeLabel: Record<JobType, string> = {
    [JobType.FULL_TIME]: "Toàn thời gian",
    [JobType.PART_TIME]: "Bán thời gian",
    [JobType.REMOTE]: "Làm việc từ xa",
    [JobType.FREELANCE]: "Làm việc tự do",
};

export enum Level {
    INTERN = "intern",
    FRESHER = "fresher",
    JUNIOR = "junior",
    MID = "mid",
    SENIOR = "senior",
}

export const LevelLabel: Record<Level, string> = {
    [Level.INTERN]: "Thực tập sinh",
    [Level.FRESHER]: "Fresher",
    [Level.JUNIOR]: "Junior",
    [Level.MID]: "Middle",
    [Level.SENIOR]: "Senior",
};

export enum JobStatus {
    OPEN = "open",
    CLOSED = "closed",
    PENDING = "pending",
    REJECTED = "rejected",
}

export const JobStatusLabel: Record<JobStatus, string> = {
    [JobStatus.OPEN]: "Đang mở",
    [JobStatus.CLOSED]: "Đã đóng",
    [JobStatus.PENDING]: "Đang chờ duyệt",
    [JobStatus.REJECTED]: "Bị từ chối",
};

export enum ApplicationStatus {
    PENDING = "pending",
    ACCEPTED = "accepted",
    REJECTED = "rejected",
}

export const ApplicationStatusLabel: Record<ApplicationStatus, string> = {
    [ApplicationStatus.PENDING]: "Đang chờ xử lý",
    [ApplicationStatus.ACCEPTED]: "Đã chấp nhận",
    [ApplicationStatus.REJECTED]: "Đã bị từ chối",
};

export type UserRole = "candidate" | "recruiter" | "admin";
