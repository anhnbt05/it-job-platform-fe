export interface Company {
    ID: string;
    Name: string;
    Description: string | null;
    WebsiteUrl: string | null;
    LogoUrl: string | null;
    Location?: string | null;
    Size?: number | null;
}

export interface CompanyLocation {
    ID?: string;
    BranchName: string | null;
    Address: string | null;
    Province?: string | null;
    City?: string | null;
    Country?: string | null;
}
