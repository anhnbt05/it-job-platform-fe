import { UserRole } from "./enums";

export interface AccountProfile {
    ID: string;
    Role: UserRole;
    Email: string | null;
    FullName: string | null;
    PhoneNumber: string | null;
    AvatarUrl: string | null;
    Bio: string | null;
    Department: string | null;
    Headline: string | null;
    Level: string | null;
    CompanyName: string | null;
    BranchName: string | null;
}
