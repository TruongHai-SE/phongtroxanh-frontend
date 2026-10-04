import { useState, useEffect, useCallback } from "react";
import { roomsApi } from "../api/roomsApi";
import type { RoomSummaryResponse } from "../types/room.types";

export function useSavedRooms() {
  const [savedRooms, setSavedRooms] = useState<RoomSummaryResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchSaved = useCallback(async () => {
    setIsLoading(true);
    setIsError(false);
    setErrorMessage(null);
    try {
      const data = await roomsApi.getSavedRooms();
      setSavedRooms(data || []);
    } catch (err: any) {
      setIsError(true);
      setErrorMessage(err.message || "Không thể tải danh sách phòng đã lưu.");
      setSavedRooms([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSaved();
  }, [fetchSaved]);

  const removeSaved = async (roomId: string) => {
    try {
      await roomsApi.unsaveRoom(roomId);
      setSavedRooms((prev) => prev.filter((r) => r.id !== roomId));
    } catch (err: any) {
      throw err;
    }
  };

  const isEmpty = !isLoading && !isError && savedRooms.length === 0;

  return {
    savedRooms,
    isLoading,
    isError,
    isEmpty,
    errorMessage,
    refetch: fetchSaved,
    removeSaved,
  };
}
