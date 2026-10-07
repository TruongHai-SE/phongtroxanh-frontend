import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { api, tokenStorage } from "@/lib/api";

export type UserRole = "tenant" | "landlord" | "admin" | null;

export interface AuthUser {
  id?: string;
  email?: string;
  fullName?: string;
  name: string;
  phone?: string;
  phoneNumber?: string;
  avatarUrl?: string;
  avatar: number; // fallback index into peopleImages
  role: UserRole;
  trustScore?: number;
  kycStatus?: string;
  isOnboarded?: boolean;
  preferredDistricts?: string[];
  preferredRoomType?: string;
  budgetMin?: number;
  budgetMax?: number;
  schoolOrCompany?: string;
  isPublic?: boolean;
}

const DEMO_ACCOUNTS: Record<string, AuthUser> = {
  tenant: { name: "Lê Thị Kim Ngân", fullName: "Lê Thị Kim Ngân", email: "tenant1@phongtroxanh.vn", avatar: 5, role: "tenant", isOnboarded: true },
  landlord: { name: "Nguyễn Văn Hùng", fullName: "Nguyễn Văn Hùng", email: "landlord1@phongtroxanh.vn", avatar: 1, role: "landlord", isOnboarded: true },
  admin: { name: "Quản Trị Viên Hệ Thống", fullName: "Quản Trị Viên Hệ Thống", email: "admin@phongtroxanh.vn", avatar: 4, role: "admin", isOnboarded: true },
};

interface GoogleAuthResult {
  user: AuthUser;
  isNewUser: boolean;
  isOnboarded: boolean;
}

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  role: UserRole;
  user: AuthUser | null;
  login: (email: string, password: string) => Promise<AuthUser>;
  loginWithGoogle: (idToken: string, role?: string) => Promise<GoogleAuthResult>;
  register: (payload: any) => Promise<any>;
  loginAs: (role: "tenant" | "landlord" | "admin") => void;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  setOnboarded: (status: boolean) => void;
}

const AuthContext = createContext<AuthState>({
  isAuthenticated: false,
  isLoading: false,
  role: null,
  user: null,
  login: async () => { throw new Error("Unimplemented"); },
  loginWithGoogle: async () => { throw new Error("Unimplemented"); },
  register: async () => { throw new Error("Unimplemented"); },
  loginAs: () => {},
  logout: async () => {},
  refreshProfile: async () => {},
  setOnboarded: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState<boolean>(() => {
    return !!tokenStorage.getToken() && !localStorage.getItem("ptx_user");
  });

  const [user, setUser] = useState<AuthUser | null>(() => {
    const token = tokenStorage.getToken();
    if (!token) {
      localStorage.removeItem("ptx_user");
      localStorage.removeItem("ptx_role");
      return null;
    }
    const savedUser = localStorage.getItem("ptx_user");
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        if (parsed && (parsed.role === "admin" || parsed.role === "landlord")) {
          parsed.isOnboarded = true;
        }
        return parsed;
      } catch (e) {
        // ignore
      }
    }
    return null;
  });

  const fetchCurrentUser = useCallback(async () => {
    try {
      const token = tokenStorage.getToken();
      if (!token) {
        setUser(null);
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      const data = await api.get<any>("/users/me");
      if (data) {
        const mappedRole = (data.role?.toLowerCase() as UserRole) || "tenant";
        const authPhone = data.phoneNumber || data.phone;
        const authUser: AuthUser = {
          id: data.id,
          email: data.email,
          fullName: data.fullName || data.name,
          name: data.fullName || data.name || "Người dùng",
          phone: authPhone,
          phoneNumber: authPhone,
          avatarUrl: data.avatarUrl,
          avatar: 0,
          role: mappedRole,
          trustScore: data.trustScore,
          kycStatus: data.kycStatus,
          isOnboarded: (mappedRole === "admin" || mappedRole === "landlord")
            ? true
            : (data.isOnboarded !== undefined ? Boolean(data.isOnboarded) : Boolean(data.schoolOrCompany || data.preferredDistricts?.length)),
          preferredDistricts: data.preferredDistricts || [],
          preferredRoomType: data.preferredRoomType,
          budgetMin: data.budgetMin ? Number(data.budgetMin) : undefined,
          budgetMax: data.budgetMax ? Number(data.budgetMax) : undefined,
          schoolOrCompany: data.schoolOrCompany,
          isPublic: data.isPublic !== undefined ? Boolean(data.isPublic) : true,
        };
        setUser(authUser);
        localStorage.setItem("ptx_user", JSON.stringify(authUser));
        localStorage.setItem("ptx_role", mappedRole || "");
      }
    } catch (err) {
      tokenStorage.clear();
      setUser(null);
      localStorage.removeItem("ptx_user");
      localStorage.removeItem("ptx_role");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (tokenStorage.getToken()) {
      fetchCurrentUser();
    }
  }, [fetchCurrentUser]);

  useEffect(() => {
    const handleAuthCleared = () => {
      setUser(null);
    };
    window.addEventListener("ptx:auth_cleared", handleAuthCleared);
    return () => window.removeEventListener("ptx:auth_cleared", handleAuthCleared);
  }, []);

  const setOnboarded = useCallback((status: boolean) => {
    setUser((prev) => {
      if (!prev) return null;
      const updated = { ...prev, isOnboarded: status };
      localStorage.setItem("ptx_user", JSON.stringify(updated));
      return updated;
    });
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await api.post<any>("/auth/login", { login: email, email, password });
    if (res?.accessToken) {
      tokenStorage.setToken(res.accessToken);
    }
    let userDetails = res?.user || {};
    try {
      const profile = await api.get<any>("/users/me");
      if (profile) userDetails = { ...userDetails, ...profile };
    } catch {
      // quiet fallback
    }

    const mappedRole = (userDetails.role?.toLowerCase() as UserRole) || "tenant";
    const isOnboardedVal = (mappedRole === "admin" || mappedRole === "landlord")
      ? true
      : (res?.isOnboarded !== undefined ? Boolean(res.isOnboarded) : (userDetails.isOnboarded !== undefined ? Boolean(userDetails.isOnboarded) : Boolean(userDetails.schoolOrCompany || userDetails.preferredDistricts?.length)));
    const authPhone = userDetails.phoneNumber || userDetails.phone;
    const authUser: AuthUser = {
      id: userDetails.id,
      email: userDetails.email || email,
      fullName: userDetails.fullName || userDetails.name,
      name: userDetails.fullName || userDetails.name || "Người dùng",
      phone: authPhone,
      phoneNumber: authPhone,
      avatarUrl: userDetails.avatarUrl,
      avatar: 0,
      role: mappedRole,
      trustScore: userDetails.trustScore,
      kycStatus: userDetails.kycStatus,
      isOnboarded: isOnboardedVal,
      preferredDistricts: userDetails.preferredDistricts || [],
      preferredRoomType: userDetails.preferredRoomType,
      budgetMin: userDetails.budgetMin ? Number(userDetails.budgetMin) : undefined,
      budgetMax: userDetails.budgetMax ? Number(userDetails.budgetMax) : undefined,
      schoolOrCompany: userDetails.schoolOrCompany,
      isPublic: userDetails.isPublic !== undefined ? Boolean(userDetails.isPublic) : true,
    };
    setUser(authUser);
    localStorage.setItem("ptx_user", JSON.stringify(authUser));
    localStorage.setItem("ptx_role", mappedRole);
    return authUser;
  }, []);

  const loginWithGoogle = useCallback(async (idToken: string, role?: string) => {
    const res = await api.post<any>("/auth/oauth/google", { idToken, role });
    if (res?.accessToken) {
      tokenStorage.setToken(res.accessToken);
    }
    const backendUser = res?.user || {};
    const mappedRole = (backendUser.role?.toLowerCase() as UserRole) || "tenant";
    const isGoogleNewUser = Boolean(res?.isNewUser);
    const isOnboardedVal = (mappedRole === "admin" || (mappedRole === "landlord" && !isGoogleNewUser))
      ? true
      : (res?.isOnboarded !== undefined ? Boolean(res.isOnboarded) : (backendUser.isOnboarded !== undefined ? Boolean(backendUser.isOnboarded) : Boolean(backendUser.schoolOrCompany)));
    const googlePhone = backendUser.phoneNumber || backendUser.phone;
    const authUser: AuthUser = {
      id: backendUser.id,
      email: backendUser.email,
      fullName: backendUser.fullName || backendUser.name,
      name: backendUser.fullName || backendUser.name || "Người dùng Google",
      phone: googlePhone,
      phoneNumber: googlePhone,
      avatarUrl: backendUser.avatarUrl,
      avatar: 0,
      role: mappedRole,
      trustScore: backendUser.trustScore,
      kycStatus: backendUser.kycStatus,
      isOnboarded: isOnboardedVal,
      isPublic: backendUser.isPublic !== undefined ? Boolean(backendUser.isPublic) : true,
    };
    setUser(authUser);
    localStorage.setItem("ptx_user", JSON.stringify(authUser));
    localStorage.setItem("ptx_role", mappedRole);
    return {
      user: authUser,
      isNewUser: Boolean(res?.isNewUser),
      isOnboarded: isOnboardedVal,
    };
  }, []);

  const register = useCallback(async (payload: any) => {
    const registerBody = {
      email: payload.email,
      password: payload.password,
      fullName: payload.fullName || payload.name,
      phoneNumber: payload.phoneNumber || payload.phone,
      role: payload.role || "TENANT",
    };
    return api.post("/auth/register", registerBody);
  }, []);

  const loginAs = useCallback(async (role: "tenant" | "landlord" | "admin") => {
    const email =
      role === "landlord"
        ? "landlord1@phongtroxanh.vn"
        : role === "admin"
        ? "admin@phongtroxanh.vn"
        : "tenant1@phongtroxanh.vn";
    const password = "Password123!";

    return await login(email, password);
  }, [login]);

  const logout = useCallback(async () => {
    try {
      await api.post("/auth/logout");
    } catch (e) {
      // ignore logout network errors
    } finally {
      setUser(null);
      tokenStorage.clear();
      localStorage.removeItem("ptx_user");
      localStorage.removeItem("ptx_role");
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated: !!user,
        isLoading,
        role: user?.role ?? null,
        user,
        login,
        loginWithGoogle,
        register,
        loginAs,
        logout,
        refreshProfile: fetchCurrentUser,
        setOnboarded,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
