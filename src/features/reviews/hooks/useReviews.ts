import { useState, useEffect, useCallback } from "react";
import { reviewsApi } from "../api/reviewsApi";
import type { ReviewResponse, CreateReviewRequest, ReviewStatsResponse } from "../types/review.types";

export function useReviews(targetType: "ROOM" | "USER", targetId?: string) {
  const [reviews, setReviews] = useState<ReviewResponse[]>([]);
  const [stats, setStats] = useState<ReviewStatsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchReviews = useCallback(async () => {
    if (!targetId) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setIsError(false);
    setErrorMessage(null);
    try {
      if (targetType === "ROOM") {
        const revRes = await reviewsApi.getRoomReviews(targetId);
        setReviews(Array.isArray(revRes) ? revRes : (revRes as any)?.content || []);
      } else {
        const revRes = await reviewsApi.getUserReviews(targetId);
        setReviews(Array.isArray(revRes) ? revRes : (revRes as any)?.content || []);
      }
    } catch (err: any) {
      setIsError(true);
      setErrorMessage(err.message || "Không thể tải danh sách đánh giá.");
      setReviews([]);
    } finally {
      setIsLoading(false);
    }
  }, [targetType, targetId]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const addReview = async (body: any) => {
    const newRev = await reviewsApi.createReview(body);
    setReviews((prev) => [newRev, ...prev]);
    return newRev;
  };

  const submitDispute = async (reviewId: string, reason: string, evidenceImages?: string[]) => {
    return await reviewsApi.submitDispute(reviewId, { reason, evidenceImages });
  };

  const replyReview = async (reviewId: string, reply: string) => {
    return await reviewsApi.replyReview(reviewId, { reply });
  };

  const isEmpty = !isLoading && !isError && reviews.length === 0;

  return {
    reviews,
    stats,
    isLoading,
    isError,
    isEmpty,
    errorMessage,
    refetch: fetchReviews,
    addReview,
    submitDispute,
    replyReview,
  };
}

