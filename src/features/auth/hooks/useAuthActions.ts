import { useState, useCallback } from "react";
import { authApi } from "../api/authApi";
import { tokenStorage } from "@/lib/api";
import type {
  LoginRequest,
  RegisterRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  ChangePasswordRequest,
  TokenResponse,
  Role,
} from "../types/auth.types";

export interface AuthUser {
  userId: string;
  fullName: string;
  email: string;
  role: Role;
}

export function useAuthActions() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getStoredUser = (): AuthUser | null => {
    try {
      const raw = localStorage.getItem("ptx_user");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  };

  const [currentUser, setCurrentUser] = useState<AuthUser | null>(getStoredUser);

  const saveAuthSession = (tokenData: TokenResponse) => {
    tokenStorage.setToken(tokenData.accessToken);
    const user: AuthUser = {
      userId: tokenData.userId,
      fullName: tokenData.fullName,
      email: tokenData.email,
      role: tokenData.role,
    };
    localStorage.setItem("ptx_user", JSON.stringify(user));
    setCurrentUser(user);
  };

  const clearAuthSession = () => {
    tokenStorage.clear();
    localStorage.removeItem("ptx_user");
    setCurrentUser(null);
  };

  const login = useCallback(async (credentials: LoginRequest): Promise<TokenResponse> => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await authApi.login(credentials);
      saveAuthSession(res);
      return res;
    } catch (err: any) {
      const msg = err.message || "Đăng nhập thất bại. Vui lòng thử lại.";
      setError(msg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const register = useCallback(async (data: RegisterRequest): Promise<TokenResponse> => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await authApi.register(data);
      saveAuthSession(res);
      return res;
    } catch (err: any) {
      const msg = err.message || "Đăng ký thất bại. Vui lòng thử lại.";
      setError(msg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    try {
      await authApi.logout();
    } catch {
      // ignore logout failure, proceed to clear session
    } finally {
      clearAuthSession();
      setIsLoading(false);
    }
  }, []);

  const forgotPassword = useCallback(async (data: ForgotPasswordRequest): Promise<void> => {
    setIsLoading(true);
    setError(null);
    try {
      await authApi.forgotPassword(data);
    } catch (err: any) {
      setError(err.message || "Gửi yêu cầu thất bại.");
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const resetPassword = useCallback(async (data: ResetPasswordRequest): Promise<void> => {
    setIsLoading(true);
    setError(null);
    try {
      await authApi.resetPassword(data);
    } catch (err: any) {
      setError(err.message || "Đặt lại mật khẩu thất bại.");
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const changePassword = useCallback(async (data: ChangePasswordRequest): Promise<void> => {
    setIsLoading(true);
    setError(null);
    try {
      await authApi.changePassword(data);
    } catch (err: any) {
      setError(err.message || "Đổi mật khẩu thất bại.");
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    currentUser,
    isAuthenticated: !!tokenStorage.getToken(),
    isLoading,
    error,
    login,
    register,
    logout,
    forgotPassword,
    resetPassword,
    changePassword,
  };
}
