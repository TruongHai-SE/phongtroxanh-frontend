import { useState, useCallback } from "react";
import { swapApi } from "../api/swapApi";

export function useLandlordSwaps() {
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const approveSwap = useCallback(async (swapId: string) => {
    setIsLoading(true);
    setIsError(false);
    setErrorMessage(null);
    try {
      await swapApi.landlordApproveSwap(swapId);
    } catch (err: any) {
      setIsError(true);
      setErrorMessage(err.message || "Xử lý duyệt chuyển nhượng thất bại.");
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const declineSwap = useCallback(async (swapId: string) => {
    setIsLoading(true);
    setIsError(false);
    setErrorMessage(null);
    try {
      await swapApi.landlordDeclineSwap(swapId);
    } catch (err: any) {
      setIsError(true);
      setErrorMessage(err.message || "Xử lý từ chối chuyển nhượng thất bại.");
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    isLoading,
    isError,
    errorMessage,
    approveSwap,
    declineSwap,
  };
}
