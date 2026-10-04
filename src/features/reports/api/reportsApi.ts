import { api } from "@/lib/api";

export interface CreateReportRequest {
  targetType: "ROOM" | "USER" | "REVIEW";
  targetId: string;
  reportType: string;
  detail: string;
  evidenceImages?: string[];
  severity?: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
}

export interface ReportResponse {
  id: string;
  reporterId: string;
  targetType: string;
  targetId: string;
  reportType: string;
  detail: string;
  evidenceImages?: string[];
  status: string;
  severity: string;
  createdAt?: string;
}

export const reportsApi = {
  submitReport: (body: CreateReportRequest): Promise<ReportResponse> => {
    return api.post<ReportResponse>("/reports", body);
  },
};
