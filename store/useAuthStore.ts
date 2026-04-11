import { create } from "zustand";
import { UserRole } from "@/types/enums";

type AuthState = {
  token: string | null;
  refreshToken: string | null;
  role: UserRole | null;
  userId: string | null;
  isLoggedIn: boolean;

  setAuth: (
    token: string,
    refreshToken: string | null,
    role: UserRole,
    userId: string,
  ) => void;
  updateAccessToken: (token: string) => void;
  updateTokens: (token: string, refreshToken: string | null) => void;
  logout: () => void;
};

export const useAuthStore = create<AuthState>((set) => {
  let initialToken: string | null = null;
  let initialRefreshToken: string | null = null;
  let initialRole: UserRole | null = null;
  let initialUserId: string | null = null;

  if (typeof window !== "undefined") {
    initialToken = localStorage.getItem("token");
    initialRefreshToken = localStorage.getItem("refreshToken");
    initialRole = localStorage.getItem("role") as UserRole | null;
    initialUserId = localStorage.getItem("userId");
  }

  return {
    token: initialToken,
    refreshToken: initialRefreshToken,
    role: initialRole,
    userId: initialUserId,
    isLoggedIn: !!initialToken,

    setAuth: (token, refreshToken, role, userId) => {
      if (typeof window !== "undefined") {
        localStorage.setItem("token", token);
        if (refreshToken) {
          localStorage.setItem("refreshToken", refreshToken);
        } else {
          localStorage.removeItem("refreshToken");
        }
        localStorage.setItem("role", role);
        localStorage.setItem("userId", userId);
      }
      set({ token, refreshToken, role, userId, isLoggedIn: true });
    },

    updateAccessToken: (token) => {
      if (typeof window !== "undefined") {
        localStorage.setItem("token", token);
      }

      set((state) => ({ ...state, token, isLoggedIn: true }));
    },

    updateTokens: (token, refreshToken) => {
      if (typeof window !== "undefined") {
        localStorage.setItem("token", token);
        if (refreshToken) {
          localStorage.setItem("refreshToken", refreshToken);
        } else {
          localStorage.removeItem("refreshToken");
        }
      }

      set((state) => ({
        ...state,
        token,
        refreshToken,
        isLoggedIn: true,
      }));
    },

    logout: () => {
      if (typeof window !== "undefined") {
        localStorage.removeItem("token");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("role");
        localStorage.removeItem("userId");
      }
      set({
        token: null,
        refreshToken: null,
        role: null,
        userId: null,
        isLoggedIn: false,
      });
    },
  };
});
