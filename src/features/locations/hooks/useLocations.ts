import { useState, useCallback } from "react";
import { locationsApi } from "../api/locationsApi";
import type { LocationSuggestionResponse, GeocodeResponse, ReverseGeocodeResponse } from "../types/location.types";

export function useLocations() {
  const [suggestions, setSuggestions] = useState<LocationSuggestionResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const searchLocations = useCallback(async (query: string) => {
    if (!query || query.trim().length < 2) {
      setSuggestions([]);
      return;
    }
    setIsLoading(true);
    setIsError(false);
    setErrorMessage(null);
    try {
      const results = await locationsApi.autocomplete(query.trim());
      setSuggestions(results || []);
    } catch (err: any) {
      setIsError(true);
      setErrorMessage(err.message || "Không thể tìm kiếm địa điểm.");
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const geocode = async (address: string): Promise<GeocodeResponse> => {
    return await locationsApi.geocode(address);
  };

  const reverseGeocode = async (lat: number, lng: number): Promise<ReverseGeocodeResponse> => {
    return await locationsApi.reverseGeocode(lat, lng);
  };

  return {
    suggestions,
    isLoading,
    isError,
    errorMessage,
    searchLocations,
    geocode,
    reverseGeocode,
  };
}
