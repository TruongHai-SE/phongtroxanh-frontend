import { api } from "@/lib/api";
import type { LandingStatsResponse } from "@/features/auth/types/auth.types";

export const miscApi = {
  // #12 GET /misc/landing-stats
  getLandingStats: (): Promise<LandingStatsResponse> => {
    return api.get<LandingStatsResponse>("/misc/landing-stats");
  },
};
