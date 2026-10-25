import { api } from "@/lib/api";
import type {
  LocationSuggestionResponse,
  GeocodeResponse,
  ReverseGeocodeResponse,
} from "../types/location.types";

const getFrontendGoongKey = (): string => {
  const env = (import.meta as any).env;
  return (env?.VITE_GOONG_API_KEY || env?.VITE_GOONG_MAP_KEY || "").trim();
};

export const locationsApi = {
  // #92 GET /locations/autocomplete (Ưu tiên gọi trực tiếp Goong từ FE nếu có key, fallback qua BE & Nominatim)
  autocomplete: async (query: string): Promise<LocationSuggestionResponse[]> => {
    const trimmed = query?.trim();
    if (!trimmed) return [];

    const feKey = getFrontendGoongKey();
    if (feKey && !feKey.startsWith("your_")) {
      try {
        const url = `https://rsapi.goong.io/Place/AutoComplete?api_key=${encodeURIComponent(
          feKey
        )}&location=10.7769,106.7009&radius=50&more_compound=true&input=${encodeURIComponent(
          trimmed
        )}`;
        const resp = await fetch(url);
        if (resp.ok) {
          const data = await resp.json();
          if (Array.isArray(data?.predictions) && data.predictions.length > 0) {
            return data.predictions.map((item: any) => ({
              placeId: item.place_id || "",
              description: item.description || "",
              mainText: item.structured_formatting?.main_text || item.description || "",
              secondaryText: item.structured_formatting?.secondary_text || "",
            }));
          }
        }
      } catch {
        // Fallback sang Backend bên dưới
      }
    }

    try {
      const res = await api.get<any>("/locations/autocomplete", { input: trimmed });
      if (Array.isArray(res) && res.length > 0) return res;
      if (res?.predictions && Array.isArray(res.predictions) && res.predictions.length > 0) {
        return res.predictions;
      }
    } catch {
      // Fallback sang OpenStreetMap Nominatim nếu cả FE và BE chưa cấu hình Goong Key
    }

    try {
      const q = trimmed.toLowerCase().includes("hồ chí minh")
        ? trimmed
        : `${trimmed}, Hồ Chí Minh, Việt Nam`;
      const osmResp = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=5&countrycodes=vn&q=${encodeURIComponent(
          q
        )}`,
        { headers: { "Accept-Language": "vi" } }
      );
      if (osmResp.ok) {
        const items = await osmResp.json();
        if (Array.isArray(items)) {
          return items.map((it: any) => {
            const parts = String(it.display_name || "").split(",");
            return {
              placeId: String(it.place_id || ""),
              description: String(it.display_name || ""),
              mainText: (parts[0] || "").trim(),
              secondaryText: parts.slice(1, 4).join(",").trim(),
            };
          });
        }
      }
    } catch {
      // Ignore network error
    }
    return [];
  },

  // #93 GET /locations/geocode (Ưu tiên gọi trực tiếp Goong từ FE nếu có key, fallback qua BE & Nominatim)
  geocode: async (address: string): Promise<GeocodeResponse> => {
    const trimmed = address?.trim();
    const feKey = getFrontendGoongKey();

    if (feKey && !feKey.startsWith("your_") && trimmed) {
      try {
        const url = `https://rsapi.goong.io/Geocode?api_key=${encodeURIComponent(
          feKey
        )}&address=${encodeURIComponent(trimmed)}`;
        const resp = await fetch(url);
        if (resp.ok) {
          const data = await resp.json();
          const first = data?.results?.[0];
          const loc = first?.geometry?.location;
          if (loc && typeof loc.lat === "number" && typeof loc.lng === "number") {
            return {
              lat: loc.lat,
              lng: loc.lng,
              latitude: loc.lat,
              longitude: loc.lng,
              address: first.formatted_address || trimmed,
              formattedAddress: first.formatted_address || trimmed,
            };
          }
        }
      } catch {
        // Fallback sang Backend bên dưới
      }
    }

    try {
      const res = await api.get<any>("/locations/geocode", { address: trimmed });
      const lat = Number(res?.latitude ?? res?.lat ?? 0);
      const lng = Number(res?.longitude ?? res?.lng ?? 0);
      if (lat && lng) {
        return {
          ...res,
          lat,
          lng,
          latitude: lat,
          longitude: lng,
          address: res?.formattedAddress ?? res?.address ?? trimmed,
          formattedAddress: res?.formattedAddress ?? res?.address ?? trimmed,
        };
      }
    } catch {
      // Fallback sang OpenStreetMap Nominatim bên dưới
    }

    const q = trimmed.toLowerCase().includes("hồ chí minh")
      ? trimmed
      : `${trimmed}, Hồ Chí Minh, Việt Nam`;
    const osmResp = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=vn&q=${encodeURIComponent(
        q
      )}`,
      { headers: { "Accept-Language": "vi" } }
    );
    if (osmResp.ok) {
      const items = await osmResp.json();
      if (Array.isArray(items) && items.length > 0) {
        const lat = Number(items[0].lat);
        const lng = Number(items[0].lon);
        const formatted = String(items[0].display_name || trimmed);
        return {
          lat,
          lng,
          latitude: lat,
          longitude: lng,
          address: formatted,
          formattedAddress: formatted,
        };
      }
    }
    throw new Error("GEOCODE_NOT_FOUND");
  },

  // #94 GET /locations/reverse-geocode
  reverseGeocode: (lat: number, lng: number): Promise<ReverseGeocodeResponse> => {
    return api.get<ReverseGeocodeResponse>("/locations/reverse-geocode", { lat, lng });
  },
};
