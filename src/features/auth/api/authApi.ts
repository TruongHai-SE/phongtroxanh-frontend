import { api, tokenStorage } from "@/lib/api";
import type {
  RegisterRequest,
  LoginRequest,
  TokenResponse,
  RefreshTokenRequest,
  LogoutRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  ChangePasswordRequest,
  SendVerifyEmailRequest,
  VerifyEmailRequest,
  LandingStatsResponse,
} from "../types/auth.types";

export const authApi = {
  // 1. POST /api/v1/auth/register
  register: async (body: {
    email: string;
    phoneNumber?: string;
    phone?: string;
    password: string;
    fullName?: string;
    name?: string;
    role?: string;
  }): Promise<TokenResponse> => {
    const payload = {
      email: body.email,
      phoneNumber: body.phoneNumber || body.phone,
      password: body.password,
      fullName: body.fullName || body.name,
      role: body.role || "TENANT",
    };
    const res = await api.post<any>("/auth/register", payload);
    return {
      accessToken: res?.accessToken,
      refreshToken: res?.refreshToken,
      tokenType: res?.tokenType || "Bearer",
      expiresIn: res?.expiresIn || 900,
      userId: res?.userId || res?.user?.id || "",
      fullName: res?.fullName || res?.user?.fullName || body.fullName || "",
      email: res?.email || res?.user?.email || body.email,
      role: (res?.role || res?.user?.role || body.role || "TENANT") as any,
    };
  },

  // 2. POST /api/v1/auth/login
  login: async (body: { login?: string; email?: string; password: string; deviceId?: string }): Promise<TokenResponse> => {
    const payload = {
      login: body.login || body.email,
      password: body.password,
      deviceId: body.deviceId,
    };
    const res = await api.post<any>("/auth/login", payload);
    if (res?.accessToken) {
      tokenStorage.setToken(res.accessToken);
    }
    return {
      accessToken: res?.accessToken,
      refreshToken: res?.refreshToken,
      tokenType: res?.tokenType || "Bearer",
      expiresIn: res?.expiresIn || 900,
      userId: res?.userId || res?.user?.id || "",
      fullName: res?.fullName || res?.user?.fullName || "",
      email: res?.email || res?.user?.email || body.email || body.login || "",
      role: (res?.role || res?.user?.role || "TENANT") as any,
    };
  },

  // 3. POST /api/v1/auth/send-otp
  sendOtp: (body: { email: string; type?: string }): Promise<void> => {
    return api.post<void>("/auth/send-otp", {
      email: body.email,
      type: body.type || "REGISTER",
    });
  },

  // 4. POST /api/v1/auth/verify-otp
  verifyOtp: (body: { email: string; otp: string }): Promise<{ tempToken: string }> => {
    return api.post<{ tempToken: string }>("/auth/verify-otp", body);
  },

  // 5. POST /api/v1/auth/forgot-password
  forgotPassword: (body: { email: string }): Promise<void> => {
    return api.post<void>("/auth/forgot-password", body);
  },

  // 6. POST /api/v1/auth/reset-password
  resetPassword: (body: { tempToken: string; newPassword: string }): Promise<void> => {
    return api.post<void>("/auth/reset-password", body);
  },

  // 7. POST /api/v1/auth/refresh-token
  refreshToken: (body?: { refreshToken?: string }): Promise<TokenResponse> => {
    return api.post<TokenResponse>("/auth/refresh-token", body || {});
  },

  // 8. POST /api/v1/auth/logout
  logout: (body: LogoutRequest = {}): Promise<void> => {
    return api.post<void>("/auth/logout", body).finally(() => {
      tokenStorage.clear();
    });
  },

  // 9. POST /api/v1/auth/oauth/google
  googleLogin: (body: { idToken: string; role?: string }): Promise<TokenResponse> => {
    return api.post<TokenResponse>("/auth/oauth/google", {
      idToken: body.idToken,
      role: body.role || "TENANT",
    });
  },

  // 10. POST /api/v1/auth/onboarding/tenant
  tenantOnboarding: (body: any): Promise<void> => {
    return api.post<void>("/auth/onboarding/tenant", body);
  },

  // 11. POST /api/v1/auth/onboarding/landlord
  landlordOnboarding: (body: any): Promise<void> => {
    return api.post<void>("/auth/onboarding/landlord", body);
  },

  // Misc helper
  getLandingStats: (): Promise<LandingStatsResponse> => {
    return api.get<LandingStatsResponse>("/misc/landing-stats");
  },

  // Google OAuth Client ID - Hybrid resolver
  getGoogleClientId: async (): Promise<string> => {
    // 1. Priority 1: Frontend env (0ms build-time injection)
    const envClientId = (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID;
    if (envClientId && typeof envClientId === "string" && envClientId.trim() !== "") {
      return envClientId.trim();
    }

    // 2. Priority 2: Session cache (0ms navigation cache)
    try {
      const cached = sessionStorage.getItem("GOOGLE_CLIENT_ID");
      if (cached && cached.trim() !== "") {
        return cached.trim();
      }
    } catch {
      // ignore
    }

    // 3. Priority 3: Fetch dynamically from Backend (Single source of truth)
    try {
      const res = await api.get<{ clientId: string }>("/auth/oauth/google/client-id");
      const id = (res as any)?.clientId || (res as any)?.data?.clientId || "";
      if (id) {
        try {
          sessionStorage.setItem("GOOGLE_CLIENT_ID", id);
        } catch {
          // ignore
        }
      }
      return id;
    } catch {
      return "";
    }
  },
};

