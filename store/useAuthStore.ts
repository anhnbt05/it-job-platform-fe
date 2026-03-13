import { create } from "zustand";
import { UserRole } from "@/types/enums";

type AuthState = {
  token: string | null;
  role: UserRole | null;
  userId: string | null;
  isLoggedIn: boolean;

  setAuth: (token: string, role: UserRole, userId: string) => void;
  logout: () => void;
};

export const useAuthStore = create<AuthState>((set) => {
  let initialToken: string | null = null;
  let initialRole: UserRole | null = null;
  let initialUserId: string | null = null;

  if (typeof window !== "undefined") {
    initialToken = localStorage.getItem("token");
    initialRole = localStorage.getItem("role") as UserRole | null;
    initialUserId = localStorage.getItem("userId");
  }

  return {
    token: initialToken,
    role: initialRole,
    userId: initialUserId,
    isLoggedIn: !!initialToken,

    setAuth: (token, role, userId) => {
      if (typeof window !== "undefined") {
        localStorage.setItem("token", token);
        localStorage.setItem("role", role);
        localStorage.setItem("userId", userId);
      }
      set({ token, role, userId, isLoggedIn: true });
    },

    logout: () => {
      if (typeof window !== "undefined") {
        localStorage.removeItem("token");
        localStorage.removeItem("role");
        localStorage.removeItem("userId");
      }
      set({ token: null, role: null, userId: null, isLoggedIn: false });
    },
  };
});
