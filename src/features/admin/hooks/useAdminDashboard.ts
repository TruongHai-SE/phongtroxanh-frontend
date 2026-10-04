import { useState, useEffect, useCallback } from "react";
import { adminApi } from "../api/adminApi";
import type { AdminDashboardStatsResponse, SystemHealthResponse } from "../types/admin.types";

export function useAdminDashboard() {
  const [stats, setStats] = useState<AdminDashboardStatsResponse | null>(null);
  const [health, setHealth] = useState<SystemHealthResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchDashboardData = useCallback(async () => {
    setIsLoading(true);
    setIsError(false);
    setErrorMessage(null);
    try {
      const [statsData, healthData] = await Promise.all([
        adminApi.getDashboardStats().catch(() => null),
        adminApi.getSystemHealth().catch(() => null),
      ]);
      setStats(statsData);
      setHealth(healthData);
    } catch (err: any) {
      setIsError(true);
      setErrorMessage(err.message || "Không thể tải thống kê quản trị viên.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const evictCache = async () => {
    await adminApi.evictCache();
  };

  return {
    stats,
    health,
    isLoading,
    isError,
    errorMessage,
    refetch: fetchDashboardData,
    evictCache,
  };
}
