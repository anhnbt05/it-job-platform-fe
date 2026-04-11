import { api } from "@/lib/axios";
import { jobService } from "@/services/job.service";
import { mapApplication, mapApplicationRecruiter, unwrapData } from "@/services/mappers";

export const applicationService = {
    // Candidate side
    async getAppliedJobs() {
        const response = await api.get("/applications");
        const applications = unwrapData<Record<string, unknown>[]>(response);

        return Promise.all(
            applications.map(async (application) => {
                const jobId = typeof application.jobId === "string" ? application.jobId : "";

                if (!jobId) {
                    return mapApplication(application, null);
                }

                try {
                    const job = await jobService.getJobById(jobId);
                    return mapApplication(application, {
                        ...job,
                        ID: job.ID,
                        Title: job.Title,
                    });
                } catch {
                    return mapApplication(application, {
                        ID: jobId,
                        Title: typeof application.jobTitle === "string" ? application.jobTitle : "Công việc đã ứng tuyển",
                    });
                }
            }),
        );
    },

    applyForJob: (data: {
        jobId: string;
        resumeUrl?: string | null;
        candidateName?: string;
        jobTitle?: string;
        recruiterId?: string;
    }) =>
        api.post(
            "/applications",
            {
                jobId: data.jobId,
                resumeUrl: data.resumeUrl ?? undefined,
            },
            {
                headers: {
                    "X-User-Name": data.candidateName ?? "",
                    "X-Job-Title": data.jobTitle ?? "",
                    "X-Recruiter-Id": data.recruiterId ?? "",
                },
            },
        ),

    deleteApplication: (applicationId: string) =>
        api.delete(`/applications/${applicationId}`),

    // Recruiter side
    async getApplicationsByJob(jobId: string) {
        const response = await api.get(`/applications/internal/by-job/${jobId}`);
        return unwrapData<Record<string, unknown>[]>(response).map((item) => mapApplicationRecruiter(item));
    },

    acceptApplications: (applicationIds: string[]) =>
        api.patch("/applications/process", { acceptedApplicationIds: applicationIds }),

    rejectApplication: (applicationId: string, reason?: string) =>
        api.patch("/applications/process", {
            rejectedApplications: [{ applicationId, reason }],
        }),
};
