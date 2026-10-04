import { useState, useEffect, useCallback } from "react";
import { roomsApi } from "../api/roomsApi";
import type {
  RoomSummaryResponse,
  CreateRoomRequest,
  UpdateRoomRequest,
  LandlordAnalyticsResponse,
} from "../types/room.types";

export function useLandlordRooms() {
  const [myRooms, setMyRooms] = useState<RoomSummaryResponse[]>([]);
  const [analytics, setAnalytics] = useState<LandlordAnalyticsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchLandlordData = useCallback(async () => {
    setIsLoading(true);
    setIsError(false);
    setErrorMessage(null);
    try {
      const [roomsData, analyticsData] = await Promise.all([
        roomsApi.getMyRooms().catch(() => []),
        roomsApi.getLandlordAnalytics().catch(() => null),
      ]);
      setMyRooms(roomsData || []);
      setAnalytics(analyticsData);
    } catch (err: any) {
      setIsError(true);
      setErrorMessage(err.message || "Không thể tải dữ liệu chủ trọ.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLandlordData();
  }, [fetchLandlordData]);

  const createRoom = async (body: CreateRoomRequest) => {
    const created = await roomsApi.createRoom(body);
    setMyRooms((prev) => [created, ...prev]);
    return created;
  };

  const updateRoom = async (id: string, body: UpdateRoomRequest) => {
    const updated = await roomsApi.updateRoom(id, body);
    setMyRooms((prev) => prev.map((r) => (r.id === id ? updated : r)));
    return updated;
  };

  const deleteRoom = async (id: string) => {
    await roomsApi.deleteRoom(id);
    setMyRooms((prev) => prev.filter((r) => r.id !== id));
  };

  const updateStatus = async (id: string, status: "AVAILABLE" | "RENTED" | "HIDDEN") => {
    await roomsApi.updateRoomStatus(id, { status });
    setMyRooms((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
  };

  const uploadImages = async (id: string, files: File[]) => {
    return await roomsApi.uploadRoomImages(id, files);
  };

  return {
    myRooms,
    analytics,
    isLoading,
    isError,
    errorMessage,
    refetch: fetchLandlordData,
    createRoom,
    updateRoom,
    deleteRoom,
    updateStatus,
    uploadImages,
  };
}
