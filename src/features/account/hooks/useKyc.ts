import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";
import { accountApi } from "../api/accountApi";
import type { KycStatusResponse, KycSubmissionResponse } from "../types/account.types";

export function useKyc() {
  const [kycStatus, setKycStatus] = useState<KycStatusResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isError, setIsError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [submissionResult, setSubmissionResult] = useState<KycSubmissionResponse | null>(null);

  const fetchKycStatus = useCallback(async () => {
    setIsLoading(true);
    setIsError(false);
    try {
      const data = await accountApi.getKycStatus();
      setKycStatus(data);
    } catch (err: any) {
      setIsError(true);
      setErrorMessage(err.message || "Không thể tải trạng thái KYC.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchKycStatus();
  }, [fetchKycStatus]);

  const submitKycCccd = async (frontFile: File | string, backFile: File | string, idNumber?: string) => {
    setIsSubmitting(true);
    setIsError(false);
    setErrorMessage(null);
    try {
      let frontUrl = typeof frontFile === "string" ? frontFile : "https://res.cloudinary.com/front.jpg";
      let backUrl = typeof backFile === "string" ? backFile : "https://res.cloudinary.com/back.jpg";

      const payload = {
        idCardNumber: idNumber ? idNumber.replace(/\D/g, "") : "079201008888",
        idCardFrontUrl: frontUrl,
        idCardBackUrl: backUrl,
      };

      const res = await api.post<any>("/users/me/kyc/cccd", payload);
      setSubmissionResult(res);
      setKycStatus((prev) => ({
        ...(prev || { status: "PENDING" }),
        status: "PENDING",
        idNumber: idNumber || prev?.idNumber,
      }));
      return res;
    } catch (err: any) {
      setIsError(true);
      setErrorMessage(err.message || "Gửi tài liệu xác thực thất bại.");
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    kycStatus,
    isLoading,
    isSubmitting,
    isError,
    errorMessage,
    submissionResult,
    refetch: fetchKycStatus,
    submitKycCccd,
  };
}
