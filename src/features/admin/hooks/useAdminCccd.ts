import { useState, useEffect, useCallback } from "react";
import { adminApi } from "../api/adminApi";
import type { AdminKycResponse } from "../types/admin.types";

export function useAdminCccd() {
  const [pendingQueue, setPendingQueue] = useState<AdminKycResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchQueue = useCallback(async () => {
    setIsLoading(true);
    setIsError(false);
    setErrorMessage(null);
    try {
      const res = await adminApi.getPendingKyc();
      setPendingQueue(res?.content || []);
    } catch (err: any) {
      setIsError(true);
      setErrorMessage(err.message || "Không thể tải danh sách CCCD chờ duyệt.");
      setPendingQueue([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchQueue();
  }, [fetchQueue]);

  const reviewCccd = async (id: string, approved: boolean, rejectionReason?: string) => {
    await adminApi.reviewKyc(id, { approved, rejectionReason });
    setPendingQueue((prev) => prev.filter((item) => item.id !== id));
  };

  const isEmpty = !isLoading && !isError && pendingQueue.length === 0;

  return {
    pendingQueue,
    isLoading,
    isError,
    isEmpty,
    errorMessage,
    refetch: fetchQueue,
    reviewCccd,
  };
}
