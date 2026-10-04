export interface AdminDashboardStatsResponse {
  totalUsers: number;
  activeUsers: number;
  totalRooms: number;
  pendingRooms: number;
  pendingKyc: number;
  openReports: number;
  openDisputes: number;
  totalRevenue: number;
  monthlyGrowthRate: number;
}

export interface AdminUserResponse {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  role: "TENANT" | "LANDLORD" | "ADMIN";
  status: "ACTIVE" | "BLOCKED" | "PENDING";
  kycStatus: "UNVERIFIED" | "PENDING" | "APPROVED" | "REJECTED";
  trustScore: number;
  createdAt: string;
  avatarUrl?: string;
}

export interface UserFilterParams {
  role?: string;
  status?: string;
  query?: string;
  page?: number;
  size?: number;
}

export interface UpdateUserStatusRequest {
  status: "ACTIVE" | "WARNED" | "LOCKED" | "DELETED" | "BLOCKED";
  reason?: string;
}

export interface AdminKycResponse {
  id: string;
  userId: string;
  fullName: string;
  idNumber: string;
  frontImageUrl: string;
  backImageUrl: string;
  submittedAt: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
}

export interface KycReviewRequest {
  approved: boolean;
  rejectionReason?: string;
}

export interface RoomReviewActionRequest {
  action: "APPROVE" | "REJECT";
  reason?: string;
}

export interface AdminReportResponse {
  id: string;
  reporterId: string;
  reporterName: string;
  targetType: "ROOM" | "USER" | "REVIEW";
  targetId: string;
  targetTitle?: string;
  reason: string;
  description?: string;
  status: "OPEN" | "RESOLVED" | "DISMISSED";
  createdAt: string;
}

export interface ReportFilterParams {
  status?: string;
  targetType?: string;
  page?: number;
  size?: number;
}

export interface ResolveReportRequest {
  action: "RESOLVE" | "DISMISS";
  resolutionNote?: string;
}

export interface AdminDisputeResponse {
  id: string;
  rentalId: string;
  initiatorId: string;
  initiatorName: string;
  respondentId: string;
  respondentName: string;
  reason: string;
  evidenceUrls?: string[];
  status: "OPEN" | "INVESTIGATING" | "RESOLVED";
  createdAt: string;
}

export interface DisputeFilterParams {
  status?: string;
  page?: number;
  size?: number;
}

export interface ResolveDisputeRequest {
  decision: string;
  resolutionNote: string;
}

export interface RevenueParams {
  period?: "3months" | "6months" | "year";
}

export interface AdminRevenueResponse {
  totalRevenue: number;
  chartData: Array<{ month: string; value: number }>;
}

export interface AuditLogResponse {
  id: string;
  adminId: string;
  adminName: string;
  action: string;
  targetEntity: string;
  targetId: string;
  details?: string;
  ipAddress?: string;
  timestamp: string;
}

export interface AuditLogParams {
  page?: number;
  size?: number;
  action?: string;
}

export interface SystemHealthResponse {
  status: "UP" | "DOWN";
  components: Record<string, { status: string; details?: any }>;
}
