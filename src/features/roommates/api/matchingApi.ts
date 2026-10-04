import { api } from "@/lib/api";
import type {
  MatchingFilterParams,
  MatchingCandidateResponse,
  SwipeRequest,
  SwipeResultResponse,
  RoommateMatchResponse,
  BoostResponse,
} from "../types/roommate.types";

export const matchingApi = {
  // #40 GET /matching/feed (Discovery Feed)
  getDeck: (params?: MatchingFilterParams): Promise<MatchingCandidateResponse[]> => {
    return api.get<MatchingCandidateResponse[]>("/matching/feed", params).catch(() => api.get<MatchingCandidateResponse[]>("/matching/deck", params));
  },

  // #41 POST /matching/swipe
  swipe: (body: SwipeRequest): Promise<SwipeResultResponse> => {
    return api.post<SwipeResultResponse>("/matching/swipe", body);
  },

  // #42 GET /matching/matches
  getMatches: (): Promise<RoommateMatchResponse[]> => {
    return api.get<RoommateMatchResponse[]>("/matching/matches");
  },

  // #43 DELETE /matching/matches/{id}
  unmatch: (id: string): Promise<void> => {
    return api.delete<void>(`/matching/matches/${id}`);
  },

  // #44 POST /matching/boost
  boostProfile: (): Promise<BoostResponse> => {
    return api.post<BoostResponse>("/matching/boost");
  },
};
