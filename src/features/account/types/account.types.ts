export interface UserProfileResponse {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  phoneNumber?: string;
  avatarUrl?: string;
  role: "TENANT" | "LANDLORD" | "ADMIN";
  address?: string;
  bio?: string;
  school?: string;
  job?: string;
  schoolOrCompany?: string;
  interests?: string[];
  budgetMin?: number;
  budgetMax?: number;
  targetDistricts?: string[];
  preferredDistricts?: string[];
  preferredRoomType?: string;
  lifestyle?: Record<string, string>;
  kycStatus?: "UNVERIFIED" | "PENDING" | "APPROVED" | "REJECTED";
  trustScore?: number;
  swipesLeft?: number;
  boostsLeft?: number;
  isVerified?: boolean;
  createdAt?: string;
  lastActiveAt?: string;
  earlySleeper?: boolean;
  isNeat?: boolean;
  allowGuests?: boolean;
  nonSmoking?: boolean;
  noiseTolerance?: number;
  proximitySchool?: boolean;
  proximityWork?: boolean;
  proximityMarket?: boolean;
  proximityBus?: boolean;
}

export interface UpdateProfileRequest {
  fullName?: string;
  phone?: string;
  bio?: string;
  school?: string;
  job?: string;
  interests?: string[];
  budgetMin?: number;
  budgetMax?: number;
  targetDistricts?: string[];
  lifestyle?: Record<string, string>;
}

export interface AvatarUploadResponse {
  avatarUrl: string;
}

export interface FcmTokenRequest {
  token: string;
  deviceType?: string;
}

export interface TrustScoreResponse {
  currentScore: number;
  isVerified: boolean;
  badges: string[];
  kycScore: number;
  reviewScore: number;
  rentalDurationScore: number;
  responseRateScore: number;
  history: Array<{ id: string; delta: number; finalScore: number; reason: string; createdAt: string }>;
}

export interface KycSubmissionResponse {
  id: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  submittedAt: string;
  idNumber?: string;
}

export interface KycStatusResponse {
  status: "UNVERIFIED" | "PENDING" | "APPROVED" | "REJECTED";
  idNumber?: string;
  frontImageUrl?: string;
  backImageUrl?: string;
  rejectionReason?: string;
  verifiedAt?: string;
}

export interface UserPreferencesResponse {
  preferredDistricts: string[];
  minPrice?: number;
  maxPrice?: number;
  roomTypes: string[];
  amenities: string[];
  genderPreference?: "ANY" | "MALE" | "FEMALE";
  lifestylePreferences?: Record<string, string>;
}

export interface UpdatePreferencesRequest {
  preferredDistricts?: string[];
  minPrice?: number;
  maxPrice?: number;
  roomTypes?: string[];
  amenities?: string[];
  genderPreference?: "ANY" | "MALE" | "FEMALE";
  lifestylePreferences?: Record<string, string>;
}

export interface UserDeviceResponse {
  id: string;
  deviceName: string;
  deviceType: string;
  ipAddress?: string;
  lastActive: string;
  current: boolean;
}
