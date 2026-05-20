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

type ApiErrorPayload = {
  message?: string;
  error?: string;
  data?: {
    message?: string;
    error?: string;
  };
};

type ApiMessagePayload = {
  message?: string;
};

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1"]);

const INTERNAL_CLIENT_MESSAGE_PATTERN = /^[a-z0-9]+(?:[_-][a-z0-9]+)*$/;

const MESSAGE_TRANSLATIONS: Record<string, string> = {
  Unauthorized: "Bạn chưa được xác thực hoặc phiên đăng nhập đã hết hạn.",
  Forbidden: "Bạn không có quyền thực hiện thao tác này.",
  "Bad Request": "Yêu cầu gửi lên không hợp lệ.",
  "Not Found": "Không tìm thấy dữ liệu yêu cầu.",
  Conflict: "Dữ liệu đang bị xung đột.",
  "Internal Server Error": "Hệ thống đang gặp lỗi nội bộ.",
  "Network Error": "Không thể kết nối tới máy chủ.",
};

function normalizeDisplayMessage(message?: string | null): string {
  const trimmed = message?.trim();
  if (!trimmed) {
    return "";
  }

  if (
    INTERNAL_CLIENT_MESSAGE_PATTERN.test(trimmed) ||
    trimmed === "Missing access token"
  ) {
    return "";
  }

  if (MESSAGE_TRANSLATIONS[trimmed]) {
    return MESSAGE_TRANSLATIONS[trimmed];
  }

  if (/^Request failed with status code \d+$/.test(trimmed)) {
    return "";
  }

  if (/timeout/i.test(trimmed)) {
    return "Yêu cầu tới máy chủ đã quá thời gian chờ.";
  }

  return trimmed;
}

function extractPayloadMessage(payload: unknown): string {
  if (!payload || typeof payload !== "object") {
    return "";
  }

  const record = payload as Record<string, unknown>;
  const directMessage =
    typeof record.message === "string" ? normalizeDisplayMessage(record.message) : "";
  if (directMessage) {
    return directMessage;
  }

  const nestedData = record.data;
  if (nestedData && typeof nestedData === "object") {
    const nestedMessage = extractPayloadMessage(nestedData);
    if (nestedMessage) {
      return nestedMessage;
    }
  }

  return "";
}

function resolveApiBaseUrl() {
  const configuredBaseUrl = process.env.NEXT_PUBLIC_API_URL?.trim();
  const internalBaseUrl = process.env.INTERNAL_API_URL?.trim();

  if (typeof window === "undefined") {
    return internalBaseUrl || configuredBaseUrl || "http://localhost:8000";
  }

  const { protocol, hostname } = window.location;
  const inferredBaseUrl = `${protocol}//${hostname}:8000`;

  if (!configuredBaseUrl) {
    return inferredBaseUrl;
  }

  try {
    const configuredUrl = new URL(configuredBaseUrl);
    const currentHostIsLocal = LOCAL_HOSTS.has(hostname);
    const configuredHostIsLocal = LOCAL_HOSTS.has(configuredUrl.hostname);

    if (!currentHostIsLocal && configuredHostIsLocal) {
      return inferredBaseUrl;
    }
  } catch {
    return configuredBaseUrl;
  }

  return configuredBaseUrl;
}

const baseURL = resolveApiBaseUrl();

export function getApiErrorMessage(
  error: unknown,
  fallbackMessage: string,
): string {
  if (axios.isAxiosError<ApiErrorPayload>(error)) {
    const responseMessage = extractPayloadMessage(error.response?.data);
    if (responseMessage) {
      return responseMessage;
    }

    const errorMessage = normalizeDisplayMessage(
      error.response?.data?.error ?? error.response?.data?.data?.error,
    );
    if (errorMessage) {
      return errorMessage;
    }
  }

  if (error instanceof Error) {
    const normalizedErrorMessage = normalizeDisplayMessage(error.message);
    if (normalizedErrorMessage) {
      return normalizedErrorMessage;
    }
  }

  return normalizeDisplayMessage(fallbackMessage);
}

export function getApiMessage(
  payload: unknown,
  fallbackMessage = "",
): string {
  if (Array.isArray(payload)) {
    for (const item of payload) {
      const nestedMessage = getApiMessage(item);
      if (nestedMessage) {
        return nestedMessage;
      }
    }

    return fallbackMessage;
  }

  if (payload && typeof payload === "object") {
    const message = extractPayloadMessage(payload);
    if (message) {
      return message;
    }
  }

  return normalizeDisplayMessage(fallbackMessage);
}

export function toastApiSuccess(
  payload: unknown,
  fallbackMessage = "",
) {
  if (Array.isArray(payload)) {
    const messages = payload
      .map((item) => getApiMessage(item))
      .filter((message): message is string => Boolean(message));

    if (messages.length > 0) {
      for (const message of messages) {
        toast.success(message);
      }
      return;
    }
  }

  const message = getApiMessage(payload, fallbackMessage);
  if (message) {
    toast.success(message);
  }
}

export function toastApiError(
  error: unknown,
  fallbackMessage = "",
) {
  const message = getApiErrorMessage(error, fallbackMessage);
  if (message) {
    toast.error(message);
  }
}

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

function setUserContextHeaders(
  config: AxiosRequestConfig | InternalAxiosRequestConfig,
  userId?: string | null,
  role?: string | null,
) {
  config.headers = config.headers ?? {};

  if (userId) {
    config.headers["X-User-Id"] = userId;
  }

  if (role) {
    config.headers["X-User-Role"] = role;
  }

  return config;
}

api.interceptors.request.use(
  (config) => {
    const { token, userId, role } = useAuthStore.getState();

    if (token && !isPublicAuthRequest(config.url)) {
      setAuthorizationHeader(config, token);
      setUserContextHeaders(config, userId, role);
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
