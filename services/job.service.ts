import { api } from "@/lib/axios";
import { CreateJobPayload } from "@/types";
import { mapJobDetail, mapJobFavorite, mapJobListItem, unwrapData } from "@/services/mappers";

function toJobRequestPayload(data: Partial<CreateJobPayload>) {
    const payload: Record<string, unknown> = {};

    if (data.Title !== undefined) payload.title = data.Title;
    if (data.Description !== undefined) payload.description = data.Description;
    if (data.Address !== undefined) payload.address = data.Address;
    if (data.Salary !== undefined) payload.salary = data.Salary;
    if (data.Vacancies !== undefined) payload.vacancies = data.Vacancies;
    if (data.Type !== undefined) payload.type = data.Type;
    if (data.WorkingTimes !== undefined) payload.workingTimes = data.WorkingTimes;
    if (data.ExpiredAt !== undefined) payload.expiredDate = data.ExpiredAt;
    if (data.Level !== undefined) payload.level = data.Level;
    if (data.Categories !== undefined) payload.categories = data.Categories;
    if (data.JobDescriptions !== undefined) payload.descriptions = data.JobDescriptions;
    if (data.JobBenefits !== undefined) payload.benefits = data.JobBenefits;
    if (data.JobRequirements !== undefined) payload.requirements = data.JobRequirements;

    return payload;
}

export const jobService = {
    async getJobs(params?: Record<string, string | string[]>) {
        const response = await api.get("/jobs", { params });
        return unwrapData<Record<string, unknown>[]>(response).map((job) => mapJobListItem(job));
    },

    async getJobById(id: string) {
        const response = await api.get(`/jobs/${id}`);
        return mapJobDetail(unwrapData<Record<string, unknown>>(response));
    },

    async getJobsByRecruiter(recruiterId?: string) {
        void recruiterId;
        const response = await api.get("/jobs");
        return unwrapData<Record<string, unknown>[]>(response).map((job) => mapJobListItem(job));
    },

    createJob: (data: CreateJobPayload) =>
        api.post("/jobs", toJobRequestPayload(data)),

    updateJob: (id: string, data: Partial<CreateJobPayload>) =>
        api.patch(`/jobs/${id}`, toJobRequestPayload(data)),

    deleteJob: (id: string) =>
        api.delete(`/jobs/${id}`),

    async getFavoriteJobs() {
        const response = await api.get("/jobs/favorites");
        return unwrapData<Record<string, unknown>[]>(response).map((item) => mapJobFavorite(item));
    },

    addFavoriteJob: (jobId: string) =>
        api.post("/jobs/favorites", { jobIds: [jobId] }),

    removeFavoriteJob: (jobId: string) =>
        api.delete("/jobs/favorites", { data: { jobIds: [jobId] } }),
};
