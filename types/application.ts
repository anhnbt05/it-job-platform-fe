import { JobListItem } from "./job";
import { CandidateApplied } from "./candidate";

export interface Application {
    ID: string;
    JobId: string;
    JobTitle: string;
    CandidateId: string;
    CandidateName: string;
    RecruiterId: string;
    Status: string;
    AppliedAt: string;
    ResumeUrl: string | null;
    Job: Partial<JobListItem> | null;
}

export interface AppliedJobWithDetail {
    application: Application;
}

export interface ApplicationRecruiter {
    ID: string;
    JobId: string;
    JobTitle: string;
    CandidateId: string;
    CandidateName: string;
    RecruiterId: string;
    Status: string;
    AppliedAt: string;
    ResumeUrl: string | null;
    Candidate: CandidateApplied;
}
