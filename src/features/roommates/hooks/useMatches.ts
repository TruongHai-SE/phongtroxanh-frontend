import { useState, useEffect, useCallback } from "react";
import { matchingApi } from "../api/matchingApi";
import type { RoommateMatchResponse } from "../types/roommate.types";

export function useMatches() {
  const [matches, setMatches] = useState<RoommateMatchResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchMatches = useCallback(async () => {
    setIsLoading(true);
    setIsError(false);
    setErrorMessage(null);
    try {
      const data = await matchingApi.getMatches();
      setMatches(data || []);
    } catch (err: any) {
      setIsError(true);
      setErrorMessage(err.message || "Không thể tải danh sách ghép đôi.");
      setMatches([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMatches();
  }, [fetchMatches]);

  const unmatch = async (matchId: string) => {
    try {
      await matchingApi.unmatch(matchId);
      setMatches((prev) => prev.filter((m) => m.matchId !== matchId));
    } catch (err: any) {
      throw err;
    }
  };

  const boostProfile = async () => {
    return await matchingApi.boostProfile();
  };

  const isEmpty = !isLoading && !isError && matches.length === 0;

  return {
    matches,
    isLoading,
    isError,
    isEmpty,
    errorMessage,
    refetch: fetchMatches,
    unmatch,
    boostProfile,
  };
}
