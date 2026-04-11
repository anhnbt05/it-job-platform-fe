import { api } from "@/lib/axios";

export const authService = {
    signIn: (email: string, password: string) =>
        api.post("/identity/auth/sign-in", { email, password }),

    signUpCandidate: (data: {
        email: string;
        password: string;
        full_name: string;
        phone_number: string;
        candidate: {
            level: string;
            headline?: string;
            summary?: string[];
            skills?: string[];
            educations?: string[];
            certifications?: string[];
            resume_url?: string;
        };
    }) => api.post("/identity/auth/sign-up", { ...data, role: "candidate" }),

    signUpRecruiter: (data: {
        email: string;
        password: string;
        full_name: string;
        phone_number?: string;
        recruiter: {
            department?: string;
            company_id?: string;
            company?: {
                name: string;
                size?: string;
                website?: string;
                description?: string;
                location?: string;
            };
            branch_id?: string;
            branch?: {
                name?: string;
                address?: string;
                city?: string;
                country?: string;
            };
        };
    }) => api.post("/identity/auth/sign-up", { ...data, role: "recruiter" }),

    signOut: () => api.post("/identity/auth/sign-out"),

    forgotPassword: (email: string) =>
        api.post("/identity/auth/forgot-password", { email }),

    verifyEmailOtp: (email: string, otp: string) =>
        api.post("/identity/auth/verify-otp", {
            email,
            otp,
            type: "email_verification",
        }),

    verifyPasswordResetOtp: (email: string, otp: string) =>
        api.post("/identity/auth/verify-otp", {
            email,
            otp,
            type: "password_reset",
        }),

    resetPassword: (newPassword: string, token: string) =>
        api.post("/identity/auth/reset-password", { newPassword, token }),

    refreshToken: (refreshToken: string) =>
        api.post("/identity/auth/refresh-token", { refreshToken }),
};
