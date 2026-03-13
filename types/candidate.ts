export interface WorkExperience {
    ID?: string;
    Position: string | null;
    CompanyName: string | null;
    CompanyLogoUrl: string | null;
    StartDate: string | null;
    EndDate: string | null;
    JobType: string;
    Location: string | null;
    Descriptions: string[] | null;
}

export interface Candidate {
    ID: string;
    FullName: string | null;
    Email: string | null;
    PhoneNumber: string | null;
    AvatarUrl: string | null;
    ResumeUrl: string | null;
    Bio: string | null;
    Level: string | null;
    Certifications: string[] | null;
    WorkExperiences: WorkExperience[] | null;
}

export interface CandidateApplied {
    ID: string;
    FullName: string;
    AvatarUrl: string;
}
