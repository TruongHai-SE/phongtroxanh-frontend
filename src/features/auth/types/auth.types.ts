export type Role = "TENANT" | "LANDLORD" | "ADMIN";

export interface RegisterRequest {
  fullName: string;
  email: string;
  password: string;
  phone?: string;
  role: Role;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface TokenResponse {
  accessToken: string;
  refreshToken?: string;
  tokenType: string;
  expiresIn: number;
  userId: string;
  role: Role;
  fullName: string;
  email: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface LogoutRequest {
  refreshToken?: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface SendVerifyEmailRequest {
  email?: string;
}

export interface VerifyEmailRequest {
  token: string;
}

export interface LandingStatsResponse {
  totalRooms: number;
  totalRoommates: number;
  totalDeals: number;
  satisfactionRate: number;
}
