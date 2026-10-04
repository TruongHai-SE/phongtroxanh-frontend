import { api, type PageResponse } from "@/lib/api";
import type {
  RoomSummaryResponse,
  RoomDetailResponse,
  RoomFilterParams,
  CreateRoomRequest,
  UpdateRoomRequest,
  UpdateRoomStatusRequest,
  MapBoundsParams,
  RoomMapMarkerResponse,
  CompareRoomsRequest,
  RoomComparisonResponse,
  RoomReviewResponse,
  LandlordAnalyticsResponse,
} from "../types/room.types";

export const roomsApi = {
  // API #25: GET /rooms (Tìm kiếm & Lọc phòng trọ)
  getRooms: (params?: RoomFilterParams): Promise<PageResponse<RoomSummaryResponse>> => {
    const queryParams: any = { ...params };
    if (params?.type && !params?.roomType) queryParams.roomType = params.type;
    if (params?.query && !params?.keyword) queryParams.keyword = params.query;
    if (params?.size && !params?.limit) queryParams.limit = params.size;
    return api.get<PageResponse<RoomSummaryResponse>>("/rooms", queryParams);
  },

  // API #32: POST /rooms (Đăng tin phòng mới)
  createRoom: (body: CreateRoomRequest): Promise<RoomDetailResponse> => {
    return api.post<RoomDetailResponse>("/rooms", body);
  },

  // API #28: GET /rooms/{id} (Xem chi tiết phòng trọ)
  getRoomById: (id: string): Promise<RoomDetailResponse> => {
    return api.get<RoomDetailResponse>(`/rooms/${id}`);
  },

  // API #33: PUT /rooms/{id} (Chỉnh sửa thông tin phòng)
  updateRoom: (id: string, body: UpdateRoomRequest): Promise<RoomDetailResponse> => {
    return api.put<RoomDetailResponse>(`/rooms/${id}`, body);
  },

  // API #34: DELETE /rooms/{id} (Ẩn/Xóa phòng trọ)
  deleteRoom: (id: string): Promise<void> => {
    return api.delete<void>(`/rooms/${id}`);
  },

  // API #38: POST /rooms/{id}/boost (Đẩy tin phòng trọ - Boost)
  boostRoom: (id: string): Promise<void> => {
    return api.post<void>(`/rooms/${id}/boost`);
  },

  // API #35: POST /rooms/{id}/images (Tải lên hình ảnh phòng)
  uploadRoomImages: (id: string, files: File[]): Promise<any> => {
    const formData = new FormData();
    files.forEach((f) => formData.append("files", f));
    return api.upload<any>(`/rooms/${id}/images`, formData);
  },

  // API #36: DELETE /rooms/{id}/images/{imageId} (Xóa hình ảnh phòng)
  deleteRoomImage: (id: string, imageId: string): Promise<void> => {
    return api.delete<void>(`/rooms/${id}/images/${imageId}`);
  },

  // API #29: POST /rooms/{id}/save (Lưu/Bookmark phòng trọ)
  saveRoom: (id: string): Promise<void> => {
    return api.post<void>(`/rooms/${id}/save`);
  },

  // API #30: DELETE /rooms/{id}/save (Bỏ lưu phòng trọ)
  unsaveRoom: (id: string): Promise<void> => {
    return api.delete<void>(`/rooms/${id}/save`);
  },

  // API #39: POST /rooms/{id}/swipe (Quẹt phòng LIKE / PASS)
  swipeRoom: (id: string, action: "LIKE" | "PASS"): Promise<void> => {
    return api.post<void>(`/rooms/${id}/swipe`, { action });
  },

  // API #39b: DELETE /rooms/swipes/me (Đặt lại lịch sử quẹt phòng)
  resetSwipes: (): Promise<void> => {
    return api.delete<void>("/rooms/swipes/me");
  },

  // API #27: GET/POST /rooms/compare (So sánh phòng trọ)
  compareRooms: (body: CompareRoomsRequest | { ids: string[] }): Promise<RoomComparisonResponse> => {
    const ids = "roomIds" in body ? body.roomIds : body.ids;
    if (ids && ids.length > 0) {
      return api.get<RoomComparisonResponse>("/rooms/compare", { ids: ids.join(",") });
    }
    return api.post<RoomComparisonResponse>("/rooms/compare", body);
  },

  // API #37: GET /rooms/landlord/me (Danh sách phòng của tôi - Chủ trọ)
  getMyRooms: (): Promise<RoomSummaryResponse[]> => {
    return api.get<RoomSummaryResponse[]>("/rooms/landlord/me");
  },

  // API #26: GET /rooms/map (Lấy danh sách ghim bản đồ PostGIS - MapView)
  getRoomsOnMap: (params?: Partial<MapBoundsParams> & { lat?: number; lng?: number; radiusKm?: number }): Promise<RoomMapMarkerResponse[]> => {
    return api.get<RoomMapMarkerResponse[]>("/rooms/map", params);
  },

  // API #31: GET /rooms/saved/me (Danh sách phòng trọ đã lưu)
  getSavedRooms: (): Promise<RoomSummaryResponse[]> => {
    return api.get<RoomSummaryResponse[]>("/rooms/saved/me");
  },

  // Extra helper: PUT /rooms/{id}/status
  updateRoomStatus: (id: string, body: UpdateRoomStatusRequest): Promise<void> => {
    return api.put<void>(`/rooms/${id}/status`, body);
  },

  // API #61: GET /reviews/rooms/{id} or /rooms/{id}/reviews
  getRoomReviews: (id: string, page = 0, size = 10): Promise<any> => {
    return api.get<any>(`/reviews/rooms/${id}`, { page, size }).catch(() => api.get<any>(`/rooms/${id}/reviews`, { page, size }));
  },

  // Extra helper: GET /landlord/analytics
  getLandlordAnalytics: (): Promise<LandlordAnalyticsResponse> => {
    return api.get<LandlordAnalyticsResponse>("/landlord/analytics");
  },

  // API #38b: POST /rooms/{id}/renew (Gia hạn tin đăng phòng)
  renewRoom: (id: string): Promise<RoomDetailResponse> => {
    return api.post<RoomDetailResponse>(`/rooms/${id}/renew`);
  },
};
