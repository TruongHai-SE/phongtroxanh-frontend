import { useState, useEffect, useCallback } from "react";
import { paymentApi } from "../api/paymentApi";
import type {
  PaymentTransactionResponse,
  CreatePaymentUrlRequest,
  PaymentUrlResponse,
} from "../types/payment.types";

export function usePayments() {
  const [history, setHistory] = useState<PaymentTransactionResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isError, setIsError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchHistory = useCallback(async () => {
    setIsLoading(true);
    setIsError(false);
    setErrorMessage(null);
    try {
      const data = await paymentApi.getPaymentHistory();
      setHistory(data || []);
    } catch (err: any) {
      setIsError(true);
      setErrorMessage(err.message || "Không thể tải lịch sử giao dịch.");
      setHistory([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const initiatePayment = async (body: CreatePaymentUrlRequest): Promise<PaymentUrlResponse> => {
    setIsProcessing(true);
    try {
      const res = await paymentApi.createPaymentUrl(body);
      if (res?.paymentUrl) {
        window.location.href = res.paymentUrl;
      }
      return res;
    } catch (err: any) {
      throw err;
    } finally {
      setIsProcessing(false);
    }
  };

  const isEmpty = !isLoading && !isError && history.length === 0;

  return {
    history,
    isLoading,
    isProcessing,
    isError,
    isEmpty,
    errorMessage,
    refetch: fetchHistory,
    initiatePayment,
  };
}
