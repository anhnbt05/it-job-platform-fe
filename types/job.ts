import { RecruiterPost, RecruiterJob } from "./recruiter";

export interface JobListItem {
    ID: string;
    Title: string;
    Description: string | null;
    Address: string;
    Salary: string;
    Vacancies: number;
    Type: string;
    WorkingTimes: string;
    Status: string;
    PostedAt: string;
    ExpiredAt: string;
    Level: string;
    DeletedAt: string | null;
    Recruiter: RecruiterPost;
    Categories: string[];
}

export interface JobDetail {
    ID: string;
    Title: string;
    Description: string | null;
    Address: string;
    Salary: string;
    Vacancies: number;
    Type: string;
    WorkingTimes: string;
    Status: string;
    PostedAt: string;
    ExpiredAt: string;
    Level: string;
    JobDescriptions: string[];
    JobBenefits: string[];
    JobRequirements: string[];
    Categories: string[];
    Recruiter: RecruiterJob;
    DeletedAt: string | null;
}

export interface CreateJobPayload {
    Title: string;
    Description: string;
    Vacancies: number;
    Type: string;
    Level: string;
    Categories: string[];
    JobDescriptions: string[];
    JobRequirements: string[];
    JobBenefits: string[];
    WorkingTimes: string;
    Salary: string;
    ExpiredAt: string;
}
