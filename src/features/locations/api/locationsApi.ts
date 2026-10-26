import { api } from "@/lib/api";
import {
  expandPlaceQueryForMap,
  resolveLandmarkFromQuery,
  searchLocalLandmarks,
} from "@/lib/constants";
import type {
  LocationSuggestionResponse,
  GeocodeResponse,
  ReverseGeocodeResponse,
} from "../types/location.types";

export const locationsApi = {
  // #92 GET /locations/autocomplete (Kết hợp từ điển Trường ĐH/Địa điểm chuẩn + Backend Proxy / Nominatim đã chuẩn hóa "ĐH" -> "Trường Đại học")
  autocomplete: async (query: string): Promise<LocationSuggestionResponse[]> => {
    const trimmed = query?.trim();
    if (!trimmed) return [];

    const localMatches: LocationSuggestionResponse[] = searchLocalLandmarks(trimmed, 4).map(
      (lm) => ({
        placeId: `local-${lm.lat}-${lm.lng}`,
        description: `${lm.name}, ${lm.district}, TP. Hồ Chí Minh`,
        mainText: lm.shortName,
        secondaryText: `${lm.name} • ${lm.district}`,
      })
    );

    const expanded = expandPlaceQueryForMap(trimmed);

    try {
      const res = await api.get<any>("/locations/autocomplete", { input: expanded });
      const list = Array.isArray(res) ? res : Array.isArray(res?.predictions) ? res.predictions : [];
      if (list.length > 0) {
        return [...localMatches, ...list].slice(0, 7);
      }
    } catch {
      // Fallback sang OpenStreetMap Nominatim
    }

    try {
      const osmResp = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=5&countrycodes=vn&viewbox=106.35,11.16,107.05,10.35&bounded=1&q=${encodeURIComponent(
          expanded
        )}`,
        { headers: { "Accept-Language": "vi" } }
      );
      if (osmResp.ok) {
        const items = await osmResp.json();
        if (Array.isArray(items) && items.length > 0) {
          const osmItems = items.map((it: any) => {
            const parts = String(it.display_name || "").split(",");
            return {
              placeId: String(it.place_id || ""),
              description: String(it.display_name || ""),
              mainText: (parts[0] || "").trim(),
              secondaryText: parts.slice(1, 4).join(",").trim(),
            };
          });
          return [...localMatches, ...osmItems].slice(0, 7);
        }
      }
    } catch {
      // Ignore network error
    }
    return localMatches;
  },

  // #93 GET /locations/geocode (Chuẩn hóa "ĐH" -> "Trường Đại học", ưu tiên tọa độ chuẩn của Trường ĐH/Làng Đại học, không lộ API key ở client)
  geocode: async (address: string): Promise<GeocodeResponse> => {
    const trimmed = address?.trim();
    if (!trimmed) throw new Error("GEOCODE_NOT_FOUND");

    // 1. Ưu tiên khớp chính xác trong danh mục Trường ĐH / Làng Đại học / Khu công nghệ
    const landmark = resolveLandmarkFromQuery(trimmed);
    if (landmark) {
      return {
        lat: landmark.lat,
        lng: landmark.lng,
        latitude: landmark.lat,
        longitude: landmark.lng,
        address: `${landmark.name}, ${landmark.district}, TP. Hồ Chí Minh`,
        formattedAddress: `${landmark.name}, ${landmark.district}, TP. Hồ Chí Minh`,
      };
    }

    // 2. Mở rộng từ viết tắt ("ĐH" -> "Trường Đại học", "IU" -> "Trường Đại học Quốc tế...")
    const expanded = expandPlaceQueryForMap(trimmed);

    // 3. Tìm qua OpenStreetMap Nominatim trong khung tọa độ TP.HCM mở rộng (bao gồm cả Làng Đại học Thủ Đức / Dĩ An)
    const queriesToTry = [
      expanded,
      expanded.toLowerCase().includes("hồ chí minh") ? null : `${expanded}, Hồ Chí Minh`,
    ].filter(Boolean) as string[];

    for (const q of queriesToTry) {
      try {
        const osmResp = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=vn&viewbox=106.35,11.16,107.05,10.35&bounded=1&q=${encodeURIComponent(
            q
          )}`,
          { headers: { "Accept-Language": "vi" } }
        );
        if (osmResp.ok) {
          const items = await osmResp.json();
          if (Array.isArray(items) && items.length > 0) {
            const lat = Number(items[0].lat);
            const lng = Number(items[0].lon);
            const formatted = String(items[0].display_name || expanded);
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
      } catch {
        // Continue to next fallback
      }
    }

    // 4. Cuối cùng thử qua Backend Proxy (giữ kín GOONG_API_KEY phía server, loại bỏ tọa độ giả 10.7769, 106.7009)
    try {
      const res = await api.get<any>("/locations/geocode", { address: expanded });
      const lat = Number(res?.latitude ?? res?.lat ?? 0);
      const lng = Number(res?.longitude ?? res?.lng ?? 0);
      const formatted = String(res?.formattedAddress ?? res?.address ?? "");
      const isDummyFallback =
        Math.abs(lat - 10.7769) < 0.0002 &&
        Math.abs(lng - 106.7009) < 0.0002 &&
        formatted === expanded;
      if (lat && lng && !isDummyFallback) {
        return {
          ...res,
          lat,
          lng,
          latitude: lat,
          longitude: lng,
          address: formatted || expanded,
          formattedAddress: formatted || expanded,
        };
      }
    } catch {
      // Ignore
    }

    throw new Error("GEOCODE_NOT_FOUND");
  },

  // #94 GET /locations/reverse-geocode
  reverseGeocode: (lat: number, lng: number): Promise<ReverseGeocodeResponse> => {
    return api.get<ReverseGeocodeResponse>("/locations/reverse-geocode", { lat, lng });
  },
};
