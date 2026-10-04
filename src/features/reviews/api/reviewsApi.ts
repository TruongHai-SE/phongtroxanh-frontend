import { api, type PageResponse } from "@/lib/api";
import type {
  CreateReviewRequest,
  ReviewResponse,
  ReportReviewRequest,
  ReviewStatsResponse,
} from "../types/review.types";

export const reviewsApi = {
  // #60 POST /reviews
  createReview: (body: any): Promise<ReviewResponse> => {
    return api.post<ReviewResponse>("/reviews", body);
  },

  // #61 GET /reviews/rooms/{id}
  getRoomReviews: (roomId: string): Promise<ReviewResponse[]> => {
    return api.get<ReviewResponse[]>(`/reviews/rooms/${roomId}`);
  },

  // #62 GET /reviews/users/{id}
  getUserReviews: (userId: string): Promise<ReviewResponse[]> => {
    return api.get<ReviewResponse[]>(`/reviews/users/${userId}`);
  },

  // #63 POST /reviews/{id}/dispute
  submitDispute: (reviewId: string, body: any): Promise<ReviewResponse> => {
    return api.post<ReviewResponse>(`/reviews/${reviewId}/dispute`, body);
  },

  // #64 POST /reviews/{id}/evidences
  uploadEvidence: (reviewId: string, formData: FormData): Promise<string[]> => {
    return api.post<string[]>(`/reviews/${reviewId}/evidences`, formData);
  },

  // #65 GET /reviews/{id}
  getReviewDetail: (reviewId: string): Promise<ReviewResponse> => {
    return api.get<ReviewResponse>(`/reviews/${reviewId}`);
  },

  // #66 POST /reviews/{id}/reply
  replyReview: (reviewId: string, body: { reply: string }): Promise<ReviewResponse> => {
    return api.post<ReviewResponse>(`/reviews/${reviewId}/reply`, body);
  },

  // #67 GET /reviews/disputes/pending
  getPendingDisputes: (params?: { page?: number; limit?: number }): Promise<PageResponse<ReviewResponse>> => {
    return api.get<PageResponse<ReviewResponse>>("/reviews/disputes/pending", params);
  },

  // #68 POST /reviews/disputes/{id}/resolve
  resolveDispute: (disputeId: string, body: { approved: boolean; adminNotes?: string }): Promise<ReviewResponse> => {
    return api.post<ReviewResponse>(`/reviews/disputes/${disputeId}/resolve`, body);
  },
};

