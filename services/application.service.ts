import { api } from "@/lib/axios";
import { Application, ApplicationRecruiter } from "@/types";

export const applicationService = {
    // Candidate side
    getAppliedJobs: () =>
        api.get<Application[]>("/applications/candidate"),

    applyForJob: (jobId: string, formData?: FormData) => {
        if (formData) {
            return api.post(`/applications/${jobId}`, formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });
        }
        return api.post(`/applications/${jobId}`, { useProfileCV: true });
    },

    deleteApplication: (applicationId: string) =>
        api.delete(`/applications/${applicationId}`),

    // Recruiter side
    getApplicationsByJob: (jobId: string) =>
        api.get<ApplicationRecruiter[]>(`/applications/job/${jobId}`),

    acceptApplications: (applicationIds: string[]) =>
        api.patch("/applications/accept", { applicationIds }),

    rejectApplication: (applicationId: string) =>
        api.patch(`/applications/reject/${applicationId}`),
};
