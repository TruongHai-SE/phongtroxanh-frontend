import { api, type PageResponse } from "@/lib/api";
import type {
  CreateReviewRequest,
  ReviewResponse,
  ReportReviewRequest,
  ReviewStatsResponse,
  SystemFeedbackResponse,
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

  // #69 POST /reviews/system-feedback
  createSystemFeedback: (body: { rating: number; category: string; comment: string }): Promise<SystemFeedbackResponse> => {
    return api.post<SystemFeedbackResponse>("/reviews/system-feedback", body);
  },

  // #70 GET /reviews/system-feedbacks
  getSystemFeedbacks: (params?: { page?: number; limit?: number }): Promise<PageResponse<SystemFeedbackResponse>> => {
    return api.get<PageResponse<SystemFeedbackResponse>>("/reviews/system-feedbacks", params);
  },

  // #71 PUT /reviews/{id}
  updateReview: (
    reviewId: string,
    body: { rating: number; comment: string; tags?: string[]; images?: string[] }
  ): Promise<ReviewResponse> => {
    return api.put<ReviewResponse>(`/reviews/${reviewId}`, body);
  },

  // #72 GET /reviews/system-feedback/me
  getMySystemFeedback: (): Promise<SystemFeedbackResponse> => {
    return api.get<SystemFeedbackResponse>("/reviews/system-feedback/me");
  },

  // #73 DELETE /reviews/system-feedback/{id}
  deleteSystemFeedback: (id: string): Promise<void> => {
    return api.delete<void>(`/reviews/system-feedback/${id}`);
  },
};


