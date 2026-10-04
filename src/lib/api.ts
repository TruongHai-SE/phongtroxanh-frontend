/**
 * Centralized API Client for PhongTroXanh Frontend
 * Handles automatic JWT Bearer Authorization, HttpOnly cookie credentials,
 * uniform response unwrapping, and friendly error reporting.
 */

const BASE_URL = ((import.meta as any).env?.VITE_API_BASE_URL || "/api/v1").replace(/\/+$/, "");

export interface ApiResponse<T = any> {
  success: boolean;
  statusCode: number;
  message?: string;
  data: T;
  timestamp?: string;
}

export interface PageResponse<T = any> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}

export interface ApiError {
  status: number;
  message: string;
  detail?: string;
  code?: string;
  invalidParams?: Array<{ name: string; reason: string }>;
}

export class ApiException extends Error {
  status: number;
  code?: string;
  invalidParams?: Array<{ name: string; reason: string }>;

  constructor(error: ApiError) {
    super(error.detail || error.message || "Đã có lỗi xảy ra, vui lòng thử lại.");
    this.name = "ApiException";
    this.status = error.status;
    this.code = error.code;
    this.invalidParams = error.invalidParams;
  }
}

// Token management in memory / localStorage fallback
let inMemoryToken: string | null = localStorage.getItem("ptx_access_token");

export const tokenStorage = {
  getToken(): string | null {
    return inMemoryToken || localStorage.getItem("ptx_access_token");
  },
  setToken(token: string | null) {
    inMemoryToken = token;
    if (token) {
      localStorage.setItem("ptx_access_token", token);
    } else {
      localStorage.removeItem("ptx_access_token");
    }
  },
  clear() {
    inMemoryToken = null;
    localStorage.removeItem("ptx_access_token");
    localStorage.removeItem("ptx_user");
    localStorage.removeItem("ptx_role");
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("ptx:auth_cleared"));
    }
  },
};

async function request<T>(
  endpoint: string,
  options: RequestInit = {},
  customHeaders: Record<string, string> = {}
): Promise<T> {
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  const url = `${BASE_URL}${cleanEndpoint}`;

  const headers: Record<string, string> = {
    ...customHeaders,
  };

  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  const token = tokenStorage.getToken();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const config: RequestInit = {
    ...options,
    headers: {
      ...headers,
      ...(options.headers as Record<string, string> || {}),
    },
    credentials: "include", // Required for HttpOnly refresh-token cookie
  };

  try {
    let res = await fetch(url, config);

    // Auto Token Rotation on 401 (if not already refreshing or logging in)
    if (res.status === 401 && !endpoint.includes("/auth/refresh-token") && !endpoint.includes("/auth/login") && tokenStorage.getToken()) {
      try {
        const refreshRes = await fetch(`${BASE_URL}/auth/refresh-token`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
        });
        if (refreshRes.ok) {
          const refreshJson = await refreshRes.json();
          const newAccessToken = refreshJson?.data?.accessToken || refreshJson?.accessToken;
          if (newAccessToken) {
            tokenStorage.setToken(newAccessToken);
            headers["Authorization"] = `Bearer ${newAccessToken}`;
            config.headers = {
              ...headers,
              ...(options.headers as Record<string, string> || {}),
            };
            // Retry the original request with new token
            res = await fetch(url, config);
          }
        } else {
          tokenStorage.clear();
        }
      } catch {
        tokenStorage.clear();
      }
    }

    // Handle 204 No Content
    if (res.status === 204) {
      return null as unknown as T;
    }

    const contentType = res.headers.get("content-type");
    const isJson = contentType && contentType.includes("application/json");
    const payload = isJson ? await res.json() : await res.text();

    if (!res.ok) {
      const errDetail = isJson ? payload.detail || payload.message : payload;
      throw new ApiException({
        status: res.status,
        message: errDetail || `Lỗi HTTP ${res.status}`,
        detail: errDetail,
        code: payload?.code,
        invalidParams: payload?.invalidParams,
      });
    }

    // Unwrap standard ApiResponse<T> wrapper if present
    if (isJson && payload && typeof payload === "object" && "data" in payload && "success" in payload) {
      return payload.data as T;
    }

    return payload as T;
  } catch (err: any) {
    if (err instanceof ApiException) {
      throw err;
    }
    // Network or parser error
    throw new ApiException({
      status: 0,
      message: err.message || "Không thể kết nối đến máy chủ. Vui lòng kiểm tra lại mạng.",
    });
  }
}

export const api = {
  get<T>(endpoint: string, params?: Record<string, any>): Promise<T> {
    let url = endpoint;
    if (params) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, val]) => {
        if (val !== undefined && val !== null && val !== "") {
          searchParams.append(key, String(val));
        }
      });
      const queryStr = searchParams.toString();
      if (queryStr) {
        url += (url.includes("?") ? "&" : "?") + queryStr;
      }
    }
    return request<T>(url, { method: "GET" });
  },

  post<T>(endpoint: string, body?: any): Promise<T> {
    return request<T>(endpoint, {
      method: "POST",
      body: body instanceof FormData ? body : JSON.stringify(body),
    });
  },

  put<T>(endpoint: string, body?: any): Promise<T> {
    return request<T>(endpoint, {
      method: "PUT",
      body: body instanceof FormData ? body : JSON.stringify(body),
    });
  },

  patch<T>(endpoint: string, body?: any): Promise<T> {
    return request<T>(endpoint, {
      method: "PATCH",
      body: body instanceof FormData ? body : JSON.stringify(body),
    });
  },

  delete<T>(endpoint: string): Promise<T> {
    return request<T>(endpoint, { method: "DELETE" });
  },

  upload<T>(endpoint: string, formData: FormData): Promise<T> {
    return request<T>(endpoint, {
      method: "POST",
      body: formData,
    });
  },
};

export default api;
