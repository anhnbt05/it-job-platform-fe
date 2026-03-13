import { api } from "@/lib/axios";

export const authService = {
    signIn: (email: string, password: string) =>
        api.post("/auth/signin", { email, password }),

    signUp: (data: {
        email: string;
        password: string;
        fullName: string;
        role: string;
        companyId?: string;
        position?: string;
        phoneNumber?: string;
    }) => api.post("/auth/signup", data),

    signOut: () => api.post("/auth/signout"),

    forgotPassword: (email: string) =>
        api.post("/auth/forget-password", { email }),

    verifyEmail: (email: string) =>
        api.post("/auth/verify-email", { email }),

    verifyOTP: (email: string, otp: string) =>
        api.post("/auth/verify-otp", { email, otp }),

    resetPassword: (email: string, password: string, otp: string) =>
        api.post("/auth/reset-password", { email, password, otp }),

    refreshToken: () => api.post("/auth/refresh-token"),
};
