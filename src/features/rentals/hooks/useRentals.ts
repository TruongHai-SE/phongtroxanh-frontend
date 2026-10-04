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

  const fetchMyRentals = useCallback(async () => {
    setIsLoading(true);
    setIsError(false);
    setErrorMessage(null);
    try {
      const isLandlord = user?.role === "landlord";
      const data = isLandlord
        ? await rentalsApi.getMyLandlordRentals()
        : await rentalsApi.getMyTenantRentals();
      setRentals(data || []);
    } catch (err: any) {
      setIsError(true);
      setErrorMessage(err.message || "Không thể tải danh sách hợp đồng thuê.");
      setRentals([]);
    } finally {
      setIsLoading(false);
    }
  }, [user?.role]);

  useEffect(() => {
    fetchMyRentals();
  }, [fetchMyRentals]);

  const verifyCheckIn = async (rentalId: string, code: string) => {
    return await rentalsApi.verifyCheckIn(rentalId, { code });
  };

  const terminateRental = async (rentalId: string) => {
    const res = await rentalsApi.terminateRental(rentalId);
    setRentals((prev) => prev.map((r) => (r.id === rentalId ? { ...r, status: "COMPLETED" as any } : r)));
    return res;
  };

  const isEmpty = !isLoading && !isError && rentals.length === 0;

  return {
    rentals,
    isLoading,
    isError,
    isEmpty,
    errorMessage,
    refetch: fetchMyRentals,
    verifyCheckIn,
    terminateRental,
  };
}

