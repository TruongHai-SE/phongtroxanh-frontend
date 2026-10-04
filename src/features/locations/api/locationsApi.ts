import { api } from "@/lib/api";
import type {
  LocationSuggestionResponse,
  GeocodeResponse,
  ReverseGeocodeResponse,
} from "../types/location.types";

export const locationsApi = {
  // #92 GET /locations/autocomplete
  autocomplete: async (query: string): Promise<LocationSuggestionResponse[]> => {
    try {
      const res = await api.get<any>("/locations/autocomplete", { input: query });
      if (Array.isArray(res)) return res;
      if (res?.predictions && Array.isArray(res.predictions)) return res.predictions;
      return [];
    } catch {
      return [];
    }
  },

  // #93 GET /locations/geocode
  geocode: (address: string): Promise<GeocodeResponse> => {
    return api.get<GeocodeResponse>("/locations/geocode", { address });
  },

  // #94 GET /locations/reverse-geocode
  reverseGeocode: (lat: number, lng: number): Promise<ReverseGeocodeResponse> => {
    return api.get<ReverseGeocodeResponse>("/locations/reverse-geocode", { lat, lng });
  },
};
