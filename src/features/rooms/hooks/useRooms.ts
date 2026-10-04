import { useState, useEffect, useCallback } from "react";
import { roomsApi } from "../api/roomsApi";
import type { Room, RoomSummaryResponse, RoomFilterParams } from "../types/room.types";

export function useRooms(initialFilters?: RoomFilterParams) {
  const [filters, setFilters] = useState<RoomFilterParams>(initialFilters || {});
  const [rooms, setRooms] = useState<Room[]>([]);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchRooms = useCallback(async (currentFilters?: RoomFilterParams) => {
    setIsLoading(true);
    setIsError(false);
    setErrorMessage(null);
    try {
      const res = await roomsApi.getRooms(currentFilters || filters);
      const items = (res?.content || []) as Room[];
      setRooms(items);
      setTotalElements(res?.totalElements || items.length);
      setTotalPages(res?.totalPages || 1);
    } catch (err: any) {
      setIsError(true);
      setErrorMessage(err.message || "Không thể tải danh sách phòng trọ.");
      setRooms([]);
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  const updateFilters = (newFilters: RoomFilterParams, replace = false) => {
    setFilters((prev) => (replace ? newFilters : { ...prev, ...newFilters }));
  };

  const isEmpty = !isLoading && !isError && rooms.length === 0;

  return {
    rooms,
    totalElements,
    totalPages,
    isLoading,
    isError,
    isEmpty,
    errorMessage,
    filters,
    updateFilters,
    refetch: fetchRooms,
  };
}
