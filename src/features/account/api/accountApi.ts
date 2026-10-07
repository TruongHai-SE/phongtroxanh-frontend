import { api } from "@/lib/api";
import type {
  UserProfileResponse,
  UpdateProfileRequest,
  AvatarUploadResponse,
  FcmTokenRequest,
  TrustScoreResponse,
  KycSubmissionResponse,
  KycStatusResponse,
  UserPreferencesResponse,
  UpdatePreferencesRequest,
  UserDeviceResponse,
} from "../types/account.types";

export const accountApi = {
  // #13 PUT /users/me
  updateProfile: (body: UpdateProfileRequest): Promise<UserProfileResponse> => {
    return api.put<UserProfileResponse>("/users/me", body);
  },

  // #14 GET /users/me
  getProfile: (): Promise<UserProfileResponse> => {
    return api.get<UserProfileResponse>("/users/me");
  },

  // #15 POST /users/me/avatar
  uploadAvatar: (file: File): Promise<AvatarUploadResponse> => {
    const formData = new FormData();
    formData.append("file", file);
    return api.upload<AvatarUploadResponse>("/users/me/avatar", formData);
  },

  // #16 POST /users/me/fcm-token
  registerFcmToken: (body: FcmTokenRequest): Promise<void> => {
    return api.post<void>("/users/me/fcm-token", body);
  },

  // #17 GET /users/me/trust-score
  getMyTrustScore: (): Promise<TrustScoreResponse> => {
    return api.get<TrustScoreResponse>("/users/me/trust-score");
  },

  // #18 GET /users/{id}/trust-score
  getUserTrustScore: (id: string): Promise<TrustScoreResponse> => {
    return api.get<TrustScoreResponse>(`/users/${id}/trust-score`);
  },

  // #19 POST /users/me/kyc/cccd
  submitKyc: (body: any): Promise<KycSubmissionResponse> => {
    if (body instanceof FormData) {
      return api.upload<KycSubmissionResponse>("/users/me/kyc/cccd", body);
    }
    return api.post<KycSubmissionResponse>("/users/me/kyc/cccd", body);
  },

  // #20 GET /users/me/kyc/status
  getKycStatus: (): Promise<KycStatusResponse> => {
    return api.get<KycStatusResponse>("/users/me/kyc/status");
  },

  // #21 GET /users/me/preferences
  getPreferences: (): Promise<UserPreferencesResponse> => {
    return api.get<UserPreferencesResponse>("/users/me/preferences");
  },

  // #22 PUT /users/me/preferences
  updatePreferences: (body: UpdatePreferencesRequest): Promise<UserPreferencesResponse> => {
    return api.put<UserPreferencesResponse>("/users/me/preferences", body);
  },

  // #23 GET /users/me/devices
  getDevices: (): Promise<UserDeviceResponse[]> => {
    return api.get<UserDeviceResponse[]>("/users/me/devices");
  },

  // #24 DELETE /users/me/devices/{id}
  revokeDevice: (id: string): Promise<void> => {
    return api.delete<void>(`/users/me/devices/${id}`);
  },

  // #25 GET /users/me/settings
  getSettings: (): Promise<{ isPublic: boolean; showSchool: boolean; hideActiveStatus: boolean }> => {
    return api.get("/users/me/settings");
  },

  // #26 PUT /users/me/settings
  updateSettings: (body: { isPublic?: boolean; showSchool?: boolean; hideActiveStatus?: boolean }): Promise<any> => {
    return api.put("/users/me/settings", body);
  },
};
