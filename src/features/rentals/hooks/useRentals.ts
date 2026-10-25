import { useState, useEffect, useCallback } from "react";
import { rentalsApi } from "../api/rentalsApi";
import { useAuth } from "@/app/context/AuthContext";
import type { RentalResponse } from "../types/rental.types";

export function useRentals() {
  const { user } = useAuth();
  const [rentals, setRentals] = useState<RentalResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchMyRentals = useCallback(async (silent = false) => {
    if (!silent) {
      setIsLoading(true);
      setIsError(false);
      setErrorMessage(null);
    }
    try {
      const isLandlord = user?.role === "landlord";
      const data = isLandlord
        ? await rentalsApi.getMyLandlordRentals()
        : await rentalsApi.getMyTenantRentals();
      setRentals(data || []);
      if (silent) {
        setIsError(false);
        setErrorMessage(null);
      }
    } catch (err: any) {
      if (!silent) {
        setIsError(true);
        setErrorMessage(err.message || "Không thể tải danh sách hợp đồng thuê.");
        setRentals([]);
      }
    } finally {
      if (!silent) {
        setIsLoading(false);
      }
    }
  }, [user?.role]);

  useEffect(() => {
    fetchMyRentals(false);
    // Real-time background polling every 8 seconds so Tenant & Landlord see approvals/check-ins immediately
    const interval = setInterval(() => {
      fetchMyRentals(true);
    }, 8000);
    return () => clearInterval(interval);
  }, [fetchMyRentals]);

  const verifyCheckIn = async (rentalId: string, code: string) => {
    return await rentalsApi.verifyCheckIn(rentalId, { code });
  };

  const terminateRental = async (rentalId: string, reason?: string, terminationType?: string) => {
    const res = await rentalsApi.terminateRental(rentalId, { reason, terminationType });
    setRentals((prev) => prev.map((r) => (r.id === rentalId ? { ...r, status: "TERMINATED" as any } : r)));
    return res;
  };

  const isEmpty = !isLoading && !isError && rentals.length === 0;

  return {
    rentals,
    isLoading,
    isError,
    isEmpty,
    errorMessage,
    refetch: () => fetchMyRentals(false),
    verifyCheckIn,
    terminateRental,
  };
}
