import { api, type PageResponse } from "@/lib/api";
import type {
  AdminDashboardStatsResponse,
  AdminUserResponse,
  UserFilterParams,
  UpdateUserStatusRequest,
  AdminKycResponse,
  KycReviewRequest,
  RoomReviewActionRequest,
  AdminReportResponse,
  ReportFilterParams,
  ResolveReportRequest,
  AdminDisputeResponse,
  DisputeFilterParams,
  ResolveDisputeRequest,
  RevenueParams,
  AdminRevenueResponse,
  AuditLogParams,
  AuditLogResponse,
  SystemHealthResponse,
} from "../types/admin.types";
import type { RoomDetailResponse } from "@/features/rooms/types/room.types";

export const adminApi = {
  // #77 GET /admin/dashboard/stats
  getDashboardStats: (): Promise<AdminDashboardStatsResponse> => {
    return api.get<AdminDashboardStatsResponse>("/admin/dashboard/stats");
  },

  // #78 GET /admin/users
  getUsers: (params?: UserFilterParams): Promise<PageResponse<AdminUserResponse>> => {
    return api.get<PageResponse<AdminUserResponse>>("/admin/users", params);
  },

  // #79 PUT /admin/users/{id}/status
  updateUserStatus: (id: string, body: UpdateUserStatusRequest): Promise<void> => {
    return api.put<void>(`/admin/users/${id}/status`, body);
  },

  // Admin verify / unverify user
  verifyUser: (id: string, verified = true): Promise<void> => {
    return api.put<void>(`/admin/users/${id}/verify?verified=${verified}`);
  },

  // Admin reset user password (sends directly to user email)
  resetUserPassword: (id: string): Promise<{ maskedEmail?: string }> => {
    return api.post<{ maskedEmail?: string }>(`/admin/users/${id}/reset-password`);
  },

  // Admin notify/email user
  notifyUser: (id: string, body: { title?: string; message: string }): Promise<void> => {
    return api.post<void>(`/admin/users/${id}/notify`, body);
  },

  // #80 GET /admin/kyc/pending
  getPendingKyc: (page = 0, size = 20): Promise<PageResponse<AdminKycResponse>> => {
    return api.get<PageResponse<AdminKycResponse>>("/admin/kyc/pending", { page, size });
  },

  // #81 PUT /admin/kyc/{id}/review
  reviewKyc: (id: string, body: KycReviewRequest): Promise<void> => {
    return api.put<void>(`/admin/kyc/${id}/review`, body);
  },

  // #82 GET /admin/rooms/pending
  getPendingRooms: (page = 0, size = 20): Promise<PageResponse<RoomDetailResponse>> => {
    return api.get<PageResponse<RoomDetailResponse>>("/admin/rooms/pending", { page, size });
  },

  // #83 PUT /admin/rooms/{id}/review
  reviewRoom: (id: string, body: RoomReviewActionRequest): Promise<void> => {
    return api.put<void>(`/admin/rooms/${id}/review`, body);
  },

  // #84 GET /admin/reports
  getReports: (params?: ReportFilterParams): Promise<PageResponse<AdminReportResponse>> => {
    return api.get<PageResponse<AdminReportResponse>>("/admin/reports", params);
  },

  // #85 PUT /admin/reports/{id}/resolve
  resolveReport: (id: string, body: ResolveReportRequest): Promise<void> => {
    return api.put<void>(`/admin/reports/${id}/resolve`, body);
  },

  // #86 GET /admin/disputes
  getDisputes: (params?: DisputeFilterParams): Promise<PageResponse<AdminDisputeResponse>> => {
    return api.get<PageResponse<AdminDisputeResponse>>("/admin/disputes", params);
  },

  // #87 PUT /admin/disputes/{id}/resolve
  resolveDispute: (id: string, body: ResolveDisputeRequest): Promise<void> => {
    return api.put<void>(`/admin/disputes/${id}/resolve`, body);
  },

  // #88 GET /admin/revenue
  getRevenue: (params?: RevenueParams): Promise<AdminRevenueResponse> => {
    return api.get<AdminRevenueResponse>("/admin/revenue", params);
  },

  // #89 GET /admin/audit-logs
  getAuditLogs: (params?: AuditLogParams): Promise<PageResponse<AuditLogResponse>> => {
    return api.get<PageResponse<AuditLogResponse>>("/admin/audit-logs", params);
  },

  // #90 GET /admin/system/health
  getSystemHealth: (): Promise<SystemHealthResponse> => {
    return api.get<SystemHealthResponse>("/admin/system/health");
  },

  // #91 POST /admin/system/cache/evict
  evictCache: (): Promise<void> => {
    return api.post<void>("/admin/system/cache/evict");
  },
};
