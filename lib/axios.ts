import axios, {
  AxiosError,
  AxiosRequestConfig,
  InternalAxiosRequestConfig,
} from "axios";
import { toast } from "react-toastify";
import { useAuthStore } from "@/store/useAuthStore";

type RetryableRequestConfig = InternalAxiosRequestConfig & {
  _retry?: boolean;
};

type QueuedRequest = {
  reject: (error?: unknown) => void;
  resolve: (token: string) => void;
};

const baseURL = process.env.NEXT_PUBLIC_API_URL;

export const api = axios.create({
  baseURL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

const refreshClient = axios.create({
  baseURL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

let isRefreshing = false;
let requestQueue: QueuedRequest[] = [];
let sessionExpiredNoticeShown = false;
let redirectTimer: ReturnType<typeof setTimeout> | null = null;

function processQueue(error: unknown, token: string | null) {
  requestQueue.forEach(({ resolve, reject }) => {
    if (error || !token) {
      reject(error);
      return;
    }

    resolve(token);
  });

  requestQueue = [];
}

function redirectToLogin(message?: string) {
  useAuthStore.getState().logout();

  if (typeof window !== "undefined") {
    if (message && !sessionExpiredNoticeShown) {
      sessionExpiredNoticeShown = true;
      toast.error(message, {
        toastId: "session-expired",
      });
    }

    if (redirectTimer) {
      clearTimeout(redirectTimer);
    }

    redirectTimer = setTimeout(() => {
      window.location.href = "/login";
      sessionExpiredNoticeShown = false;
      redirectTimer = null;
    }, message ? 1200 : 0);
  }
}

function isRefreshRequest(url?: string) {
  return url?.includes("/identity/auth/refresh-token");
}

function isPublicAuthRequest(url?: string) {
  if (!url) {
    return false;
  }

  return [
    "/identity/auth/sign-in",
    "/identity/auth/sign-up",
    "/identity/auth/forgot-password",
    "/identity/auth/verify-otp",
    "/identity/auth/reset-password",
    "/identity/auth/refresh-token",
  ].some((path) => url.includes(path));
}

function setAuthorizationHeader(
  config: AxiosRequestConfig | InternalAxiosRequestConfig,
  token: string,
) {
  config.headers = config.headers ?? {};
  config.headers.Authorization = `Bearer ${token}`;
  return config;
}

api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;

    if (token && !isPublicAuthRequest(config.url)) {
      setAuthorizationHeader(config, token);
    }

    return config;
  },
  (error) => Promise.reject(error),
);

api.interceptors.response.use(
  (response) => response.data,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetryableRequestConfig | undefined;
    const status = error.response?.status;

    if (
      !originalRequest ||
      status !== 401 ||
      isRefreshRequest(originalRequest.url) ||
      isPublicAuthRequest(originalRequest.url)
    ) {
      if (status === 401 && originalRequest && !isPublicAuthRequest(originalRequest.url)) {
        redirectToLogin("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
      }

      return Promise.reject(error);
    }

    if (originalRequest._retry) {
      redirectToLogin();
      return Promise.reject(error);
    }

    const { refreshToken, updateTokens } = useAuthStore.getState();

    if (!refreshToken) {
      redirectToLogin("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        requestQueue.push({
          resolve: (token) => {
            originalRequest._retry = true;
            setAuthorizationHeader(originalRequest, token);
            resolve(api(originalRequest));
          },
          reject,
        });
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const response = await refreshClient.post("/identity/auth/refresh-token", {
        refreshToken,
      });

      const data = response.data as {
        accessToken?: string;
        refreshToken?: string;
      };

      const nextAccessToken = data.accessToken ?? "";
      const nextRefreshToken = data.refreshToken ?? refreshToken;

      if (!nextAccessToken) {
        throw new Error("Missing access token");
      }

      updateTokens(nextAccessToken, nextRefreshToken);
      processQueue(null, nextAccessToken);
      setAuthorizationHeader(originalRequest, nextAccessToken);

      return api(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError, null);
      redirectToLogin("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);
