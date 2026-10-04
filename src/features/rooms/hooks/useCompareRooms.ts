import { useState, useCallback } from "react";
import { roomsApi } from "../api/roomsApi";
import type { RoomComparisonResponse } from "../types/room.types";

export function useCompareRooms() {
  const [comparison, setComparison] = useState<RoomComparisonResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const compare = useCallback(async (roomIds: string[]) => {
    if (!roomIds || roomIds.length < 2) return;
    setIsLoading(true);
    setIsError(false);
    setErrorMessage(null);
    try {
      const res = await roomsApi.compareRooms({ roomIds });
      setComparison(res);
      return res;
    } catch (err: any) {
      setIsError(true);
      setErrorMessage(err.message || "Không thể so sánh các phòng trọ.");
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    comparison,
    isLoading,
    isError,
    errorMessage,
    compare,
  };
}
