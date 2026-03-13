import { api } from "@/lib/axios";
import { JobListItem, JobDetail, CreateJobPayload } from "@/types";

export const jobService = {
    getJobs: (params?: Record<string, string>) =>
        api.get<JobListItem[]>("/jobs", { params }),

    getJobById: (id: string) =>
        api.get<JobDetail>(`/jobs/${id}`),

    getJobsByRecruiter: (recruiterId: string) =>
        api.get<JobListItem[]>(`/recruiters/${recruiterId}/jobs`),

    createJob: (data: CreateJobPayload) =>
        api.post("/jobs", data),

    updateJob: (id: string, data: Partial<CreateJobPayload>) =>
        api.patch(`/jobs/${id}`, data),

    deleteJob: (id: string) =>
        api.delete(`/jobs/${id}`),

    getFavoriteJobs: () =>
        api.get("/jobs/favorites"),

    addFavoriteJob: (jobId: string) =>
        api.post("/jobs/favorites", { jobId }),

    removeFavoriteJob: (jobId: string) =>
        api.delete("/jobs/favorites", { data: { jobId } }),
};
