export interface Company {
    ID: string;
    Name: string;
    Description: string | null;
    WebsiteUrl: string | null;
    LogoUrl: string | null;
    Location?: string | null;
    Size?: number | null;
}

export interface CompanyFormValues {
    Name: string;
    Description?: string | null;
    WebsiteUrl?: string | null;
    LogoUrl?: string | null;
    Location?: string | null;
    Size?: number | null;
}

export interface CompanyBranch {
    ID: string;
    CompanyId?: string | null;
    BranchName: string | null;
    Address: string | null;
    Province?: string | null;
    City?: string | null;
    Country?: string | null;
    CreatedAt?: string | null;
    UpdatedAt?: string | null;
}

export interface CompanyLocation {
    ID?: string;
    BranchName: string | null;
    Address: string | null;
    Province?: string | null;
    City?: string | null;
    Country?: string | null;
    CompanyId?: string | null;
    CreatedAt?: string | null;
    UpdatedAt?: string | null;
}
