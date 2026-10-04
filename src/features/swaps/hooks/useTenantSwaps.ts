import { useState, useEffect, useCallback } from "react";
import { swapApi } from "../api/swapApi";
import type {
  RoomSwapListingResponse,
  CreateSwapListingRequest,
  SwapProposalResponse,
  SwapFilterParams,
} from "../types/swap.types";

export function useTenantSwaps(initialParams?: SwapFilterParams) {
  const [listings, setListings] = useState<RoomSwapListingResponse[]>([]);
  const [proposals, setProposals] = useState<SwapProposalResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchSwapData = useCallback(async () => {
    setIsLoading(true);
    setIsError(false);
    setErrorMessage(null);
    try {
      const [listRes, myRes] = await Promise.all([
        swapApi.getSwapListings(initialParams).catch(() => ({ content: [] })),
        swapApi.getMySwaps().catch(() => []),
      ]);
      setListings(listRes?.content || (Array.isArray(listRes) ? listRes : []));
      setProposals(myRes || []);
    } catch (err: any) {
      setIsError(true);
      setErrorMessage(err.message || "Không thể tải danh sách chuyển phòng trọ.");
    } finally {
      setIsLoading(false);
    }
  }, [initialParams]);

  useEffect(() => {
    fetchSwapData();
  }, [fetchSwapData]);

  const createListing = async (body: CreateSwapListingRequest) => {
    const created = await swapApi.createSwapListing(body);
    setListings((prev) => [created, ...prev]);
    return created;
  };

  const submitProposal = async (swapId: string, offeredRoomId: string, note?: string) => {
    return await swapApi.createProposal(swapId, { offeredRoomId, note });
  };

  const respondProposal = async (proposalId: string, action: "ACCEPT" | "REJECT") => {
    await swapApi.updateProposalStatus(proposalId, action === "ACCEPT" ? "ACCEPTED" : "REJECTED");
    setProposals((prev) =>
      prev.map((p) => (p.id === proposalId ? { ...p, status: action === "ACCEPT" ? "ACCEPTED" : "REJECTED" } : p))
    );
  };

  const isEmpty = !isLoading && !isError && listings.length === 0;

  return {
    listings,
    proposals,
    isLoading,
    isError,
    isEmpty,
    errorMessage,
    refetch: fetchSwapData,
    createListing,
    submitProposal,
    respondProposal,
  };
}
