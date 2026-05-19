export const demoAccounts = {
  admin: {
    email: process.env.E2E_ADMIN_EMAIL || "admin@example.com",
    password: process.env.E2E_ADMIN_PASSWORD || "admin123",
    redirectPath: "/admin/dashboard",
  },
  recruiter: {
    email: process.env.E2E_RECRUITER_EMAIL || "recruiter@example.com",
    password: process.env.E2E_RECRUITER_PASSWORD || "recruiter123",
    redirectPath: "/recruiter/manage-jobs",
  },
  candidate: {
    email: process.env.E2E_CANDIDATE_EMAIL || "candidate@example.com",
    password: process.env.E2E_CANDIDATE_PASSWORD || "candidate123",
    redirectPath: "/candidate/find-jobs",
  },
} as const;
