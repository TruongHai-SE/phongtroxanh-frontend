import { api, type PageResponse } from "@/lib/api";
import type {
  CreateSwapListingRequest,
  RoomSwapListingResponse,
  RoomSwapDetailResponse,
  SwapFilterParams,
  UpdateSwapStatusRequest,
  CreateSwapProposalRequest,
  SwapProposalResponse,
  RespondProposalRequest,
  LandlordSwapApprovalRequest,
} from "../types/swap.types";

export const swapApi = {
  // API #48 / #46: POST /api/v1/swaps (or /posts)
  createSwapListing: (body: any): Promise<any> => {
    return api.post<any>("/swaps", body);
  },

  // API #49 / #45: GET /api/v1/swaps (or /feed)
  getSwapListings: (params?: any): Promise<any> => {
    return api.get<any>("/swaps", params);
  },

  // API #47 / #61: GET /api/v1/swaps/me (or /my-posts, /mine)
  getMySwaps: (): Promise<any[]> => {
    return api.get<any[]>("/swaps/me");
  },

  // API #50: GET /api/v1/swaps/{id}
  getSwapDetail: (id: string): Promise<any> => {
    return api.get<any>(`/swaps/${id}`);
  },

  // API #51 / #49: POST /api/v1/swaps/{id}/request (or /posts/{id}/apply)
  createProposal: (swapId: string, body: any): Promise<any> => {
    return api.post<any>(`/swaps/${swapId}/request`, body);
  },

  // API #52: PUT /api/v1/swaps/requests/{requestId}
  updateProposalStatus: (requestId: string, status: "ACCEPTED" | "REJECTED"): Promise<any> => {
    return api.put<any>(`/swaps/requests/${requestId}`, { status });
  },

  // API #50 (Spec): GET /api/v1/swaps/landlord/requests
  getLandlordRequests: (): Promise<any[]> => {
    return api.get<any[]>("/swaps/landlord/requests");
  },

  // API #51 (Spec): PUT /api/v1/swaps/landlord/{id}/approve
  landlordApproveSwap: (swapId: string): Promise<any> => {
    return api.put<any>(`/swaps/landlord/${swapId}/approve`);
  },

  // API #52 (Spec): PUT /api/v1/swaps/landlord/{id}/decline
  landlordDeclineSwap: (swapId: string): Promise<any> => {
    return api.put<any>(`/swaps/landlord/${swapId}/decline`);
  },
};

