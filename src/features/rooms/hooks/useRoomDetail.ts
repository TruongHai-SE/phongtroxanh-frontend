import { useState, useEffect, useCallback } from "react";
import { roomsApi } from "../api/roomsApi";
import type { RoomDetailResponse, RoomReviewResponse } from "../types/room.types";

export function useRoomDetail(roomId: string | undefined) {
  const [room, setRoom] = useState<RoomDetailResponse | null>(null);
  const [reviews, setReviews] = useState<RoomReviewResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchDetail = useCallback(async () => {
    if (!roomId) return;
    setIsLoading(true);
    setIsError(false);
    setErrorMessage(null);
    try {
      const [detailData, reviewsData] = await Promise.all([
        roomsApi.getRoomById(roomId),
        roomsApi.getRoomReviews(roomId).catch(() => []),
      ]);
      setRoom(detailData);
      const list = Array.isArray(reviewsData)
        ? reviewsData
        : Array.isArray(reviewsData?.data)
        ? reviewsData.data
        : Array.isArray(reviewsData?.content)
        ? reviewsData.content
        : [];
      setReviews(list);
    } catch (err: any) {
      setIsError(true);
      setErrorMessage(err.message || "Không thể tải thông tin phòng.");
    } finally {
      setIsLoading(false);
    }
  }, [roomId]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  const toggleSave = async (saved: boolean) => {
    if (!roomId) return;
    if (saved) {
      await roomsApi.unsaveRoom(roomId);
    } else {
      await roomsApi.saveRoom(roomId);
    }
  };

  return {
    room,
    reviews,
    isLoading,
    isError,
    errorMessage,
    refetch: fetchDetail,
    toggleSave,
  };
}
