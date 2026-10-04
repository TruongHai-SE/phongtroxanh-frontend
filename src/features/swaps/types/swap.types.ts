export interface RoomSwapListingResponse {
  id: string;
  creatorId: string;
  creatorName: string;
  creatorAvatar?: string;
  currentRoomId: string;
  currentRoomTitle: string;
  currentRoomPrice: number;
  currentDistrict: string;
  targetDistricts: string[];
  targetPriceMax?: number;
  reason?: string;
  status: "OPEN" | "MATCHED" | "COMPLETED" | "CANCELLED";
  images?: string[];
  createdAt: string;
}

export interface RoomSwapDetailResponse extends RoomSwapListingResponse {
  currentRoomAddress?: string;
  currentRoomAmenities?: string[];
  currentRoomDescription?: string;
  landlordApproved?: boolean;
}

export interface CreateSwapListingRequest {
  currentRoomId: string;
  targetDistricts: string[];
  targetPriceMax?: number;
  targetRoomType?: string;
  reason?: string;
}

export interface SwapFilterParams {
  district?: string;
  maxPrice?: number;
  page?: number;
  size?: number;
}

export interface UpdateSwapStatusRequest {
  status: "OPEN" | "CANCELLED" | "COMPLETED";
}

export interface CreateSwapProposalRequest {
  offeredRoomId: string;
  note?: string;
}

export interface SwapProposalResponse {
  id: string;
  listingId: string;
  proposerId: string;
  proposerName: string;
  proposerAvatar?: string;
  offeredRoomId: string;
  offeredRoomTitle: string;
  offeredRoomDistrict: string;
  offeredRoomPrice: number;
  note?: string;
  status: "PENDING" | "ACCEPTED" | "REJECTED";
  createdAt: string;
}

export interface RespondProposalRequest {
  action: "ACCEPT" | "REJECT";
}

export interface LandlordSwapApprovalRequest {
  approved: boolean;
  notes?: string;
}
