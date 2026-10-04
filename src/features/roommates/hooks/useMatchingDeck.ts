import { useState, useEffect, useCallback } from "react";
import { matchingApi } from "../api/matchingApi";
import type { MatchingCandidateResponse, MatchingFilterParams } from "../types/roommate.types";

export function useMatchingDeck(initialFilters?: MatchingFilterParams) {
  const [deck, setDeck] = useState<MatchingCandidateResponse[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchDeck = useCallback(async (filters?: MatchingFilterParams) => {
    setIsLoading(true);
    setIsError(false);
    setErrorMessage(null);
    try {
      const candidates = await matchingApi.getDeck(filters || initialFilters);
      setDeck(candidates || []);
      setCurrentIndex(0);
    } catch (err: any) {
      setIsError(true);
      setErrorMessage(err.message || "Không thể tải danh sách gợi ý ở ghép.");
      setDeck([]);
    } finally {
      setIsLoading(false);
    }
  }, [initialFilters]);

  useEffect(() => {
    fetchDeck();
  }, [fetchDeck]);

  const currentCandidate = deck[currentIndex] || null;

  const swipe = async (action: "LIKE" | "DISLIKE") => {
    if (!currentCandidate) return;
    const targetId = currentCandidate.id;
    try {
      const result = await matchingApi.swipe({ targetUserId: targetId, action });
      setCurrentIndex((prev) => prev + 1);
      return result;
    } catch (err: any) {
      throw err;
    }
  };

  const isEmpty = !isLoading && !isError && (deck.length === 0 || currentIndex >= deck.length);

  return {
    deck,
    currentCandidate,
    currentIndex,
    isLoading,
    isError,
    isEmpty,
    errorMessage,
    swipe,
    refetch: fetchDeck,
  };
}
