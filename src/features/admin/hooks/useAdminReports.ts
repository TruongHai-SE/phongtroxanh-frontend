import { useState, useEffect, useCallback } from "react";
import { adminApi } from "../api/adminApi";
import type { AdminReportResponse, ReportFilterParams } from "../types/admin.types";

export function useAdminReports(initialFilters?: ReportFilterParams) {
  const [reports, setReports] = useState<AdminReportResponse[]>([]);
  const [filters, setFilters] = useState<ReportFilterParams>(initialFilters || {});
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchReports = useCallback(async (customFilters?: ReportFilterParams) => {
    setIsLoading(true);
    setIsError(false);
    setErrorMessage(null);
    try {
      const res = await adminApi.getReports(customFilters || filters);
      setReports(res?.content || []);
    } catch (err: any) {
      setIsError(true);
      setErrorMessage(err.message || "Không thể tải danh sách báo cáo vi phạm.");
      setReports([]);
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const resolveReport = async (id: string, action: "RESOLVE" | "DISMISS", resolutionNote?: string) => {
    await adminApi.resolveReport(id, { action, resolutionNote });
    setReports((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: action === "RESOLVE" ? "RESOLVED" : "DISMISSED" } : r))
    );
  };

  const isEmpty = !isLoading && !isError && reports.length === 0;

  return {
    reports,
    filters,
    isLoading,
    isError,
    isEmpty,
    errorMessage,
    setFilters,
    refetch: fetchReports,
    resolveReport,
  };
}
