import { toast } from "sonner";

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data: T;
  pagination?: PaginationMeta;
  token?: string;
  user?: AdminUser;
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: "admin" | "user";
}

export class ApiError extends Error {
  status: number;
  details?: unknown;

  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

type RequestOptions = RequestInit & {
  params?: Record<string, string | number | boolean | undefined | null>;
  suppressToast?: boolean;
};

const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL || "http://localhost:5000"}/api`;
const ASSET_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

export const getAssetUrl = (path?: string) => {
  if (!path) return "#";
  if (path.startsWith("http")) return path;
  return `${ASSET_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
};

const buildUrl = (path: string, params?: RequestOptions["params"]) => {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const url = new URL(`${API_BASE_URL}${normalizedPath}`);

  Object.entries(params || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, String(value));
    }
  });

  return url.toString();
};

const getErrorMessage = (payload: unknown, fallback: string) => {
  if (payload && typeof payload === "object" && "message" in payload) {
    const message = (payload as { message?: unknown }).message;
    if (typeof message === "string") return message;
  }

  return fallback;
};

async function request<T>(path: string, options: RequestOptions = {}): Promise<ApiResponse<T>> {
  const { params, suppressToast, headers, body, ...init } = options;
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const isFormData = body instanceof FormData;

  const response = await fetch(buildUrl(path, params), {
    ...init,
    body,
    headers: {
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      Accept: "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
  });

  const contentType = response.headers.get("content-type") || "";
  const payload = contentType.includes("application/json") ? await response.json() : null;

  if (!response.ok) {
    const message = getErrorMessage(payload, "Request failed");

    if (response.status === 401 && !path.includes("/auth/login")) {
      if (typeof window !== "undefined") {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.href = "/login";
      }
    } else if (!suppressToast) {
      toast.error(message);
    }

    throw new ApiError(message, response.status, payload);
  }

  return payload as ApiResponse<T>;
}

const httpClient = {
  get: <T,>(path: string, options?: RequestOptions) => request<T>(path, { ...options, method: "GET" }),
  post: <T,>(path: string, data?: unknown, options?: RequestOptions) =>
    request<T>(path, {
      ...options,
      method: "POST",
      body: data instanceof FormData ? data : JSON.stringify(data ?? {}),
    }),
  patch: <T,>(path: string, data?: unknown, options?: RequestOptions) =>
    request<T>(path, {
      ...options,
      method: "PATCH",
      body: data instanceof FormData ? data : JSON.stringify(data ?? {}),
    }),
  put: <T,>(path: string, data?: unknown, options?: RequestOptions) =>
    request<T>(path, {
      ...options,
      method: "PUT",
      body: data instanceof FormData ? data : JSON.stringify(data ?? {}),
    }),
  delete: <T,>(path: string, options?: RequestOptions) => request<T>(path, { ...options, method: "DELETE" }),
};

export default httpClient;
