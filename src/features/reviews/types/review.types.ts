export interface ReviewResponse {
  id: string;
  rentalId?: string;
  reviewerId?: string;
  reviewerName?: string;
  reviewerAvatar?: string;
  revieweeId?: string;
  roomId?: string;
  rating: number;
  cleanlinessRating?: number;
  accuracyRating?: number;
  communicationRating?: number;
  comment?: string;
  tags?: string[];
  images?: string[];
  disputeStatus?: "NONE" | "PENDING" | "RESOLVED" | "REJECTED" | string;
  disputeReason?: string;
  replyComment?: string;
  repliedAt?: string;
  isVerifiedStay?: boolean;
  evidenceImages?: string[];
  createdAt?: string;
}

export interface CreateReviewRequest {
  rentalId?: string;
  roomId?: string;
  rating: number;
  cleanlinessRating?: number;
  accuracyRating?: number;
  communicationRating?: number;
  comment?: string;
  tags?: string[];
  images?: string[];
}

export interface SubmitDisputeRequest {
  reason: string;
  evidenceImages?: string[];
}

export interface ResolveDisputeRequest {
  approved: boolean;
  adminNotes?: string;
}

export interface ReplyReviewRequest {
  replyComment?: string;
  reply?: string;
}

export interface ReportReviewRequest {
  reason: string;
  details?: string;
}

export interface RatingCategoryAvg {
  category: string;
  average: number;
}

export interface ReviewStatsResponse {
  averageRating: number;
  totalReviews: number;
  distribution: Record<number, number>;
  categoryAverages?: RatingCategoryAvg[];
}

