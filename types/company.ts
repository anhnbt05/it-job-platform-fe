export interface Company {
    ID: string;
    Name: string;
    Description: string;
    WebsiteUrl: string;
    LogoUrl: string | null;
}

export interface CompanyLocation {
    ID?: string;
    BranchName: string | null;
    Address: string | null;
    Province?: string | null;
}
