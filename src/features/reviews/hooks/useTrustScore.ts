import { useState, useEffect, useCallback } from "react";
import { accountApi } from "@/features/account/api/accountApi";
import type { TrustScoreResponse } from "@/features/account/types/account.types";

export function useTrustScore(userId?: string) {
  const [trustScore, setTrustScore] = useState<TrustScoreResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchScore = useCallback(async () => {
    setIsLoading(true);
    setIsError(false);
    setErrorMessage(null);
    try {
      const data = userId
        ? await accountApi.getUserTrustScore(userId)
        : await accountApi.getMyTrustScore();
      setTrustScore(data);
    } catch (err: any) {
      setIsError(true);
      setErrorMessage(err.message || "Không thể tải dữ liệu điểm tín nhiệm TrustScore.");
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchScore();
  }, [fetchScore]);

  return {
    trustScore,
    isLoading,
    isError,
    errorMessage,
    refetch: fetchScore,
  };
}
