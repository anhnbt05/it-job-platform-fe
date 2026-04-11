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
    RecruiterId: string;
    DeletedAt?: string | null;
    Recruiter?: RecruiterPost | null;
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
    RecruiterId: string;
    JobDescriptions: string[];
    JobBenefits: string[];
    JobRequirements: string[];
    Categories: string[];
    Recruiter?: RecruiterJob | null;
    DeletedAt?: string | null;
}

export interface JobFavorite {
    ID: string;
    SavedAt: string;
    Job: JobDetail;
}

export interface CreateJobPayload {
    Title: string;
    Description: string;
    Address: string;
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
