import { Company, CompanyLocation } from "./company";

export interface RecruiterPost {
    ID: string;
    FullName: string;
    Company: Company;
}

export interface RecruiterJob {
    ID: string;
    FullName: string;
    Company: Company;
}

export interface RecruiterInfo {
    ID: string;
    FullName: string | null;
    Email: string | null;
    PhoneNumber: string | null;
    Department: string | null;
    Bio: string | null;
    AvatarUrl: string | null;
    Company: Company | null;
    CompanyLocations: CompanyLocation | null;
}
