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
    FullName: string;
    Email: string;
    PhoneNumber: string;
    Position: string;
    AvatarUrl: string;
    Company: Company;
    CompanyLocations: CompanyLocation;
}
