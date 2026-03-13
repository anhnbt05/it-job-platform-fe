import { JobListItem } from "./job";
import { CandidateApplied } from "./candidate";

export interface Application {
    ID: string;
    Status: string;
    AppliedAt: string;
    ResumeUrl: string | null;
    Job: JobListItem | null;
}

export interface AppliedJobWithDetail {
    application: Application;
}

export interface ApplicationRecruiter {
    ID: string;
    Status: string;
    AppliedAt: string;
    ResumeUrl: string | null;
    Candidate: CandidateApplied;
}
