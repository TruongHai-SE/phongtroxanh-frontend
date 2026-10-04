export interface LifestyleItem {
  label: string;
  value: string;
}

export interface CompatibilityItem {
  label: string;
  value: number;
}

export interface Roommate {
  id: string;
  name: string;
  age: number;
  school: string;
  match: number;
  avatar: string;
  bio: string;
  interests: string[];
  budget: string;
  areas: string[];
  lifestyle: LifestyleItem[];
  compatibility: CompatibilityItem[];
  phone?: string;
  gender?: string;
  job?: string;
  trustScore?: number;
  earlySleeper?: boolean;
  isNeat?: boolean;
  allowGuests?: boolean;
  nonSmoking?: boolean;
}

export interface MatchingFilterParams {
  district?: string;
  gender?: "ANY" | "MALE" | "FEMALE";
  minBudget?: number;
  maxBudget?: number;
  limit?: number;
}

export interface MatchingCandidateResponse extends Roommate {}

export interface SwipeRequest {
  targetUserId: string;
  action: "LIKE" | "DISLIKE";
}

export interface SwipeResultResponse {
  matched: boolean;
  matchId?: string;
  message?: string;
}

export interface RoommateMatchResponse {
  matchId: string;
  user: Roommate;
  matchedAt: string;
  compatibilityScore: number;
  conversationId?: string;
}

export interface BoostResponse {
  active: boolean;
  expiresAt: string;
  remainingBoosts: number;
}
