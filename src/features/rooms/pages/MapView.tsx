import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import {
  List,
  ChevronLeft,
  ChevronRight,
  Loader2,
  MapPin,
  RefreshCw,
  Compass,
  Search,
  X,
} from "lucide-react";
import { MapContainer, TileLayer, Marker, Tooltip, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ImageWithFallback } from "@/components/shared/ImageWithFallback";
import { formatVND, cn } from "@/lib/utils";
import {
  roomImages,
  calculateDistanceKm,
  searchLocalLandmarks,
  resolveLandmarkFromQuery,
  HCMC_LANDMARKS,
  type LandmarkLocation,
} from "@/lib/constants";
import { locationsApi } from "@/features/locations/api/locationsApi";
import { roomsApi } from "../api/roomsApi";

const QUICK_LANDMARKS = HCMC_LANDMARKS.slice(0, 6);

const ROOM_TYPE_LABELS: Record<string, string> = {
  PHONG_KHEP_KIN: "Phòng khép kín",
  PHONG_TRO: "Phòng trọ",
  STUDIO: "Studio",
  CAN_HO_MINI: "Căn hộ mini",
  CHUNG_CU_MINI: "Căn hộ mini",
  KTX_SLEEPBOX: "Ở ghép / Sleepbox",
  O_GHEP: "Ở ghép",
  SLEEPBOX: "Sleepbox",
  KY_TUC_XA: "Ký túc xá",
};

export interface MapRoomItem {
  id: string;
  title: string;
  price: number;
  lat: number;
  lng: number;
  district: string;
  addressStreet?: string;
  match?: number;
  type?: string;
  area?: number;
  images: string[];
  distanceKm?: number;
}

// Custom Leaflet icon builder displaying room thumbnail and short price
function roomIcon(imageUrl: string, active: boolean, price: number) {
  const priceShort = (price / 1e6).toFixed(1) + "tr";
  return L.divIcon({
    className: "",
    html: `
      <div class="room-marker-container ${active ? "room-marker--active" : ""}">
        <div class="room-marker-image-wrapper">
          <img src="${imageUrl}" class="room-marker-image" alt="phòng" />
        </div>
        <div class="room-marker-badge">${priceShort}</div>
      </div>
    `,
    iconSize: [48, 48],
    iconAnchor: [24, 48],
  });
}

// Custom Leaflet icon for user's real GPS position
function userLocationIcon() {
  return L.divIcon({
    className: "",
    html: `
      <div class="relative flex items-center justify-center w-8 h-8">
        <span class="absolute inline-flex h-8 w-8 animate-ping rounded-full bg-blue-500 opacity-60"></span>
        <span class="absolute inline-flex h-6 w-6 rounded-full bg-blue-400/30"></span>
        <span class="relative inline-flex size-3.5 rounded-full bg-blue-600 border-2 border-white shadow-md"></span>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
}

// Custom Leaflet icon for searched University / Company / Landmark
function landmarkLocationIcon() {
  return L.divIcon({
    className: "",
    html: `
      <div class="relative flex items-center justify-center w-9 h-9">
        <span class="absolute inline-flex h-9 w-9 animate-ping rounded-full bg-emerald-500 opacity-40"></span>
        <span class="relative inline-flex size-4 rounded-full bg-slate-900 border-2 border-white shadow-md ring-2 ring-emerald-500"></span>
      </div>
    `,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
  });
}

function formatDistance(km?: number, targetLabel = "bạn"): string {
  if (km === undefined || km === null) return "";
  if (km < 1) {
    return `Cách ${targetLabel} ${Math.round(km * 1000)}m`;
  }
  return `Cách ${targetLabel} ${km.toFixed(1)} km`;
}

// Sub-component for optimized Leaflet markers preventing recreation shifts
interface RoomMarkerProps {
  room: MapRoomItem;
  active: boolean;
  hovered: boolean;
  distanceLabel?: string;
  onClick: () => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}

function RoomMarker({
  room,
  active,
  hovered,
  distanceLabel,
  onClick,
  onMouseEnter,
  onMouseLeave,
}: RoomMarkerProps) {
  const markerRef = useRef<L.Marker>(null);

  // Render initial static icon structure on mount
  const icon = useMemo(() => {
    return roomIcon(room.images[0], active || hovered, room.price);
  }, [room]);

  // Performance Optimization: directly update container class list and z-index offset
  const isActiveOrHovered = active || hovered;
  useEffect(() => {
    const marker = markerRef.current;
    if (!marker) return;
    const element = marker.getElement();
    if (!element) return;

    const container = element.querySelector(".room-marker-container");
    if (container) {
      if (isActiveOrHovered) {
        container.classList.add("room-marker--active");
        marker.setZIndexOffset(1000);
      } else {
        container.classList.remove("room-marker--active");
        marker.setZIndexOffset(0);
      }
    }
  }, [isActiveOrHovered]);

  return (
    <Marker
      ref={markerRef}
      position={[room.lat, room.lng]}
      icon={icon}
      eventHandlers={{
        click: onClick,
        mouseover: onMouseEnter,
        mouseout: onMouseLeave,
      }}
    >
      {isActiveOrHovered && (
        <Tooltip permanent direction="bottom" className="room-map-tooltip" offset={[0, 10]}>
          <div className="flex flex-col gap-0.5">
            <span className="font-semibold text-foreground line-clamp-1 max-w-[220px]">
              {room.title}
            </span>
            <div className="flex items-center gap-1.5 text-muted-foreground text-[10px]">
              <span className="text-primary font-medium">{formatVND(room.price)}/tháng</span>
              <span>•</span>
              <span>{room.district}</span>
              {room.distanceKm !== undefined && (
                <>
                  <span>•</span>
                  <span className="text-emerald-700 font-semibold">
                    {formatDistance(room.distanceKm, distanceLabel)}
                  </span>
                </>
              )}
              {room.match && (
                <>
                  <span>•</span>
                  <span className="text-emerald-600 font-semibold">{room.match}% phù hợp</span>
                </>
              )}
            </div>
          </div>
        </Tooltip>
      )}
    </Marker>
  );
}

// Helper to offset duplicate coordinates slightly so they don't overlap exactly
const getAdjustedCoords = (roomList: MapRoomItem[]) => {
  const coordCounts: Record<string, number> = {};
  return roomList.map((r) => {
    const key = `${r.lat.toFixed(5)},${r.lng.toFixed(5)}`;
    const count = coordCounts[key] || 0;
    coordCounts[key] = count + 1;

    if (count > 1) {
      // Add a tiny spiral/jitter offset (approx 20-30 meters)
      const angle = ((count - 1) * 2 * Math.PI) / 8;
      const radius = 0.00022 * (count - 1);
      return {
        ...r,
        lat: r.lat + Math.sin(angle) * radius,
        lng: r.lng + Math.cos(angle) * radius,
      };
    }
    return r;
  });
};

// Map flight panning component
function FlyTo({ coords }: { coords: [number, number] | null }) {
  const map = useMap();
  const prevCoordsRef = useRef<[number, number] | null>(null);

  useEffect(() => {
    if (coords) {
      const [lat, lng] = coords;
      const prev = prevCoordsRef.current;
      if (!prev || prev[0] !== lat || prev[1] !== lng) {
        prevCoordsRef.current = coords;
        map.flyTo(coords, 14, { duration: 0.8 });
      }
    }
  }, [coords, map]);
  return null;
}

function MapResizeTrigger({ isSidebarOpen }: { isSidebarOpen: boolean }) {
  const map = useMap();
  useEffect(() => {
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 350);
    return () => clearTimeout(timer);
  }, [isSidebarOpen, map]);
  return null;
}

export default function MapView() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const targetRoomId = searchParams.get("roomId");
  const [mapRooms, setMapRooms] = useState<MapRoomItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [panTarget, setPanTarget] = useState<[number, number] | null>(null);
  const [useOsmFallback, setUseOsmFallback] = useState(false);
  const cardRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  // Tìm kiếm Trường ĐH / Công ty / Địa điểm trên bản đồ
  const [placeQuery, setPlaceQuery] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [selectedLandmark, setSelectedLandmark] = useState<{
    name: string;
    shortName: string;
    district?: string;
    lat: number;
    lng: number;
  } | null>(null);
  const geocodeCacheRef = useRef<Map<string, { lat: number; lng: number; address: string }>>(
    new Map()
  );

  const localLandmarkSuggestions = useMemo(
    () => searchLocalLandmarks(placeQuery, 6),
    [placeQuery]
  );

  // Cấu hình Goong Map Tile Key nếu có (chỉ dùng Map Tile Key phía client, tự động fallback sang OpenStreetMap)
  const rawGoongKey = ((import.meta as any).env?.VITE_GOONG_MAP_KEY || "").trim();
  const hasGoongTileKey = Boolean(rawGoongKey && !rawGoongKey.startsWith("your_") && !useOsmFallback);
  const tileUrl = hasGoongTileKey
    ? `https://tiles.goong.io/assets/tiles/{z}/{x}/{y}.png?api_key=${rawGoongKey}`
    : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
  const attribution = hasGoongTileKey
    ? '&copy; <a href="https://www.goong.io/">Goong Maps</a>'
    : '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';

  const loadRooms = async (
    searchLat = 10.776,
    searchLng = 106.667,
    radiusKm = 30,
    currentUserLoc?: [number, number] | null
  ) => {
    setLoading(true);
    const effectiveUserLoc = currentUserLoc !== undefined ? currentUserLoc : userLocation;
    try {
      // 1. Lấy danh sách phòng từ endpoint PostGIS theo bán kính
      let fetchedRooms: any[] = [];
      try {
        const pinData = await roomsApi.getRoomsOnMap({
          lat: searchLat,
          lng: searchLng,
          radiusKm,
        });
        if (Array.isArray(pinData) && pinData.length > 0) {
          fetchedRooms = pinData;
        }
      } catch {
        // Fallback sang API danh sách phòng đầy đủ
      }

      // 2. Nếu ghim PostGIS chưa đủ hoặc cần fallback
      if (fetchedRooms.length === 0) {
        const res = await roomsApi.getRooms({ limit: 50, sort: "createdAt,desc" } as any);
        if (res && res.content && res.content.length > 0) {
          fetchedRooms = res.content;
        }
      }

      if (fetchedRooms.length > 0) {
        const mapped: MapRoomItem[] = fetchedRooms
          .filter((item) => {
            const lat = Number(item.latitude ?? item.lat);
            const lng = Number(item.longitude ?? item.lng);
            return !isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0;
          })
          .map((item, i) => {
            const rawLat = Number(item.latitude ?? item.lat ?? 10.776);
            const rawLng = Number(item.longitude ?? item.lng ?? 106.667);
            const image =
              item.primaryImageUrl ||
              (item.images && (typeof item.images[0] === "string" ? item.images[0] : item.images[0]?.imageUrl)) ||
              item.image ||
              roomImages[i % roomImages.length];

            const dist = effectiveUserLoc
              ? calculateDistanceKm(effectiveUserLoc[0], effectiveUserLoc[1], rawLat, rawLng)
              : undefined;
            const rawRoomType = item.roomType || item.type || "";
            const typeLabel = ROOM_TYPE_LABELS[rawRoomType] || rawRoomType || "Phòng trọ";

            return {
              id: String(item.id),
              title: item.title || `Phòng trọ #${i + 1}`,
              price: Number(item.price) || 2500000,
              lat: rawLat,
              lng: rawLng,
              district: item.district || "TP.HCM",
              addressStreet: item.addressStreet || item.address || undefined,
              type: typeLabel,
              area: Number(item.areaSqm ?? item.area ?? 20),
              images: [image],
              distanceKm: dist,
            };
          });

        if (effectiveUserLoc) {
          mapped.sort((a, b) => (a.distanceKm ?? 999) - (b.distanceKm ?? 999));
        }

        setMapRooms(mapped);
        if (mapped.length > 0) {
          const requestedTarget = targetRoomId
            ? mapped.find((r) => r.id === targetRoomId)
            : undefined;
          const focusRoom = requestedTarget || mapped[0];
          setActiveId(focusRoom.id);
          if (!currentUserLoc || requestedTarget) {
            setPanTarget([focusRoom.lat, focusRoom.lng]);
          }
        }
      } else {
        setMapRooms([]);
        setActiveId(null);
      }
    } catch (err) {
      console.error("Lỗi khi tải phòng trên bản đồ:", err);
      setMapRooms([]);
      setActiveId(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRooms();
  }, []);

  // Chọn một trường đại học / công ty từ từ điển nội bộ (0 request API)
  const handleSelectLandmark = (lm: LandmarkLocation) => {
    setUserLocation(null);
    setSelectedLandmark({
      name: lm.name,
      shortName: lm.shortName,
      district: lm.district,
      lat: lm.lat,
      lng: lm.lng,
    });
    setPlaceQuery(lm.shortName);
    setIsSearchFocused(false);
    setPanTarget([lm.lat, lm.lng]);

    // Tự động chọn phòng gần trường đó nhất
    if (mapRooms.length > 0) {
      const nearest = [...mapRooms].sort(
        (a, b) =>
          calculateDistanceKm(lm.lat, lm.lng, a.lat, a.lng) -
          calculateDistanceKm(lm.lat, lm.lng, b.lat, b.lng)
      )[0];
      if (nearest) setActiveId(nearest.id);
    }
  };

  // Tìm vị trí bất kỳ khi người dùng nhấn Enter (ưu tiên tra từ điển nội bộ độ chính xác cao -> cache -> geocode)
  const handleSearchPlaceSubmit = async (rawQuery?: string) => {
    const q = (rawQuery ?? placeQuery).trim();
    if (!q) return;

    // 1. Ưu tiên khớp chính xác trường ĐH / Làng Đại học / Khu công nghệ nội bộ (0 tốn API)
    const matchedLocal = resolveLandmarkFromQuery(q);
    if (matchedLocal) {
      handleSelectLandmark(matchedLocal);
      return;
    }

    // 2. Kiểm tra cache phiên làm việc
    const cacheKey = q.toLowerCase();
    const cached = geocodeCacheRef.current.get(cacheKey);
    if (cached) {
      setUserLocation(null);
      setSelectedLandmark({
        name: cached.address,
        shortName: q,
        lat: cached.lat,
        lng: cached.lng,
      });
      setIsSearchFocused(false);
      setPanTarget([cached.lat, cached.lng]);
      return;
    }

    // 3. Gọi geocode (đã tự động mở rộng "ĐH" -> "Trường Đại học" trong locationsApi)
    setIsGeocoding(true);
    try {
      const geo = await locationsApi.geocode(q);
      const lat = Number(geo.latitude ?? geo.lat ?? 0);
      const lng = Number(geo.longitude ?? geo.lng ?? 0);
      if (lat && lng) {
        const formatted = geo.formattedAddress || geo.address || q;
        geocodeCacheRef.current.set(cacheKey, { lat, lng, address: formatted });
        setUserLocation(null);
        setSelectedLandmark({
          name: formatted,
          shortName: q,
          lat,
          lng,
        });
        setIsSearchFocused(false);
        setPanTarget([lat, lng]);
        if (mapRooms.length > 0) {
          const nearest = [...mapRooms].sort(
            (a, b) =>
              calculateDistanceKm(lat, lng, a.lat, a.lng) -
              calculateDistanceKm(lat, lng, b.lat, b.lng)
          )[0];
          if (nearest) setActiveId(nearest.id);
        }
      } else {
        toast.error("Không tìm thấy tọa độ cho địa điểm này.");
      }
    } catch {
      toast.error("Không tìm thấy địa điểm. Hãy thử nhập tên trường đại học hoặc tên đường tại TP.HCM.");
    } finally {
      setIsGeocoding(false);
    }
  };

  const handleClearLandmark = () => {
    setSelectedLandmark(null);
    setPlaceQuery("");
  };

  // Xử lý lấy vị trí GPS hiện tại của người dùng qua trình duyệt
  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Trình duyệt của bạn không hỗ trợ định vị GPS.");
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const uLat = pos.coords.latitude;
        const uLng = pos.coords.longitude;
        setSelectedLandmark(null);
        setPlaceQuery("");
        setUserLocation([uLat, uLng]);
        setPanTarget([uLat, uLng]);
        setActiveId(null);
        setIsLocating(false);
        toast.success("Đã định vị thành công! Đang quét các phòng trọ xung quanh vị trí của bạn...");
        await loadRooms(uLat, uLng, 15, [uLat, uLng]);
      },
      (err) => {
        setIsLocating(false);
        console.warn("Geolocation warning:", err.message);
        toast.error("Không thể lấy vị trí hiện tại. Vui lòng cho phép quyền truy cập vị trí trên trình duyệt!");
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
    );
  };

  // Tính khoảng cách thực tế tới Điểm mốc đang chọn (Trường ĐH/Công ty) hoặc GPS của người dùng
  const referencePoint = useMemo<[number, number] | null>(() => {
    if (selectedLandmark) return [selectedLandmark.lat, selectedLandmark.lng];
    if (userLocation) return userLocation;
    return null;
  }, [selectedLandmark, userLocation]);

  const distanceTargetLabel = selectedLandmark ? selectedLandmark.shortName : "bạn";

  const roomsWithDynamicDistance = useMemo(() => {
    if (!referencePoint) return mapRooms;
    const [refLat, refLng] = referencePoint;
    return [...mapRooms]
      .map((r) => ({
        ...r,
        distanceKm: calculateDistanceKm(refLat, refLng, r.lat, r.lng),
      }))
      .sort((a, b) => (a.distanceKm ?? 999) - (b.distanceKm ?? 999));
  }, [mapRooms, referencePoint]);

  // Điều chỉnh tọa độ trùng khớp để không bị đè ghim
  const adjustedRooms = useMemo(
    () => getAdjustedCoords(roomsWithDynamicDistance),
    [roomsWithDynamicDistance]
  );

  const activeRoom = useMemo(
    () => adjustedRooms.find((r) => r.id === activeId),
    [adjustedRooms, activeId]
  );
  const center: [number, number] = [10.776, 106.667]; // Tâm bản đồ mặc định tại trung tâm TP.HCM

  // Tự động cuộn thẻ phòng vào khung nhìn khi chọn ghim
  useEffect(() => {
    if (activeId && cardRefs.current[activeId]) {
      cardRefs.current[activeId]?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [activeId]);

  return (
    <div className="relative flex h-[calc(100dvh-4rem)] w-full overflow-hidden">
      {/* ===== BÊN TRÁI: DANH SÁCH PHÒNG & TÌM KIẾM ĐỊA ĐIỂM ===== */}
      <div
        className={cn(
          "flex flex-col overflow-hidden border-r border-border bg-background transition-all duration-300 ease-in-out z-10 shrink-0 h-full",
          isSidebarOpen ? "w-full lg:w-[420px]" : "w-full lg:w-0 border-r-0 lg:border-r-0"
        )}
      >
        <div className="border-b border-border p-4 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h1 className="brand text-xl text-foreground font-bold">Bản đồ phòng</h1>
              <p className="text-xs text-muted-foreground">
                {loading
                  ? "Đang tải dữ liệu..."
                  : selectedLandmark
                  ? ` Sắp xếp theo khoảng cách gần ${selectedLandmark.shortName}`
                  : userLocation
                  ? `${mapRooms.length} phòng xung quanh bạn`
                  : `${mapRooms.length} phòng thực tế tại TP.HCM`}
              </p>
            </div>
            <div data-tour="map-gps-controls" className="flex items-center gap-1.5">
              <Button
                variant={userLocation ? "default" : "outline"}
                size="sm"
                className={cn(
                  "gap-1.5 text-xs h-8 cursor-pointer",
                  userLocation && "bg-blue-600 hover:bg-blue-700 text-white"
                )}
                onClick={handleGetLocation}
                disabled={isLocating}
                title="Định vị GPS vị trí của bạn"
              >
                {isLocating ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Compass className="size-3.5" />
                )}
                <span className="hidden sm:inline">{userLocation ? "Quanh tôi" : "Gần tôi"}</span>
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="size-8 cursor-pointer text-muted-foreground hover:text-foreground"
                onClick={() => {
                  setUserLocation(null);
                  handleClearLandmark();
                  loadRooms(10.776, 106.667, 30, null);
                }}
                disabled={loading}
                title="Làm mới danh sách (TP.HCM)"
              >
                <RefreshCw className={cn("size-3.5", loading && "animate-spin")} />
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-1 text-xs h-8"
                onClick={() => navigate("/discover")}
              >
                <List className="size-3.5" /> Vuốt
              </Button>
            </div>
          </div>

          {/* Thanh tìm kiếm Trường ĐH / Công ty / Tuyến đường để bay bản đồ tới xem phòng quanh đó */}
          <div data-tour="map-landmark-search" className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
            <Input
              value={placeQuery}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setTimeout(() => setIsSearchFocused(false), 180)}
              onChange={(e) => {
                setPlaceQuery(e.target.value);
                setIsSearchFocused(true);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleSearchPlaceSubmit();
                }
              }}
              placeholder="Tìm trường ĐH, công ty, đường phố để xem trọ gần đó..."
              className="pl-8 pr-16 h-9 text-xs bg-slate-50/70 focus:bg-background"
            />
            {placeQuery && (
              <button
                type="button"
                onClick={handleClearLandmark}
                aria-label="Xóa điểm tìm kiếm"
                className="absolute right-12 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1 cursor-pointer"
              >
                <X className="size-3.5" />
              </button>
            )}
            <button
              type="button"
              onClick={() => handleSearchPlaceSubmit()}
              disabled={isGeocoding || !placeQuery.trim()}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded bg-primary px-2 py-1 text-[11px] font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-40 cursor-pointer transition-colors"
            >
              {isGeocoding ? "..." : "Tìm"}
            </button>

            {/* Dropdown gợi ý Trường ĐH / Khu công nghệ (0 tốn API) */}
            {isSearchFocused && (
              <div className="absolute left-0 right-0 top-full mt-1 z-30 rounded-lg border border-border bg-popover shadow-lg overflow-hidden">
                <div className="px-2.5 py-1.5 bg-muted/50 border-b border-border/60 flex items-center justify-between">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Trường ĐH & Khu làm việc phổ biến
                  </span>
                  <span className="text-[10px] text-muted-foreground">Chọn để bay tới</span>
                </div>
                <div className="max-h-52 overflow-y-auto divide-y divide-border/40">
                  {localLandmarkSuggestions.map((lm) => (
                    <button
                      key={lm.name}
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        handleSelectLandmark(lm);
                      }}
                      className="w-full px-3 py-2 text-left hover:bg-accent/60 transition-colors flex items-center justify-between gap-2 cursor-pointer"
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-foreground truncate">
                          {lm.shortName}
                        </p>
                        <p className="text-[11px] text-muted-foreground truncate">{lm.name}</p>
                      </div>
                      <span className="shrink-0 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-700">
                        {lm.district}
                      </span>
                    </button>
                  ))}

                  {placeQuery.trim().length >= 2 && (
                    <button
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        handleSearchPlaceSubmit(placeQuery);
                      }}
                      className="w-full px-3 py-2 text-left bg-slate-50/70 hover:bg-mint/30 text-xs font-medium text-primary flex items-center justify-between cursor-pointer"
                    >
                      <span className="truncate">
                        Tìm vị trí "{placeQuery.trim()}" trên bản đồ
                      </span>
                      <span className="text-[10px] text-muted-foreground shrink-0 ml-2">
                        Nhấn Enter
                      </span>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Quick School Chips hoặc Điểm mốc đang chọn */}
          {selectedLandmark ? (
            <div className="flex items-center justify-between gap-2 rounded-lg bg-emerald-50/90 border border-emerald-200 px-2.5 py-1.5 text-xs text-emerald-950">
              <div className="min-w-0 truncate">
                <span className="text-muted-foreground">Đang xem quanh: </span>
                <strong className="font-semibold">{selectedLandmark.shortName}</strong>
                {selectedLandmark.district && (
                  <span className="text-muted-foreground"> ({selectedLandmark.district})</span>
                )}
              </div>
              <button
                type="button"
                onClick={handleClearLandmark}
                className="text-[11px] font-semibold text-emerald-800 hover:underline shrink-0 cursor-pointer"
              >
                Bỏ chọn
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1 overflow-x-auto pb-0.5 no-scrollbar">
              <span className="text-[11px] text-muted-foreground shrink-0 mr-0.5">Xem nhanh:</span>
              {QUICK_LANDMARKS.map((lm) => (
                <button
                  key={lm.shortName}
                  type="button"
                  onClick={() => handleSelectLandmark(lm)}
                  className="shrink-0 rounded-md border border-border/80 bg-background px-2 py-0.5 text-[11px] text-muted-foreground hover:border-primary/50 hover:text-foreground transition-colors cursor-pointer"
                >
                  {lm.shortName}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Trạng thái đang tải */}
        {loading && (
          <div className="flex-1 p-4 space-y-3 overflow-y-auto">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="flex gap-3 rounded-xl p-2.5 bg-card border animate-pulse">
                <div className="size-24 rounded-lg bg-muted shrink-0" />
                <div className="flex-1 space-y-2 py-1">
                  <div className="h-4 bg-muted rounded-md w-3/4" />
                  <div className="h-3.5 bg-muted rounded-md w-1/2" />
                  <div className="h-3 bg-muted rounded-md w-1/3" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Trạng thái không có phòng */}
        {!loading && mapRooms.length === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-muted-foreground gap-3">
            <div className="grid size-12 place-items-center rounded-full bg-muted">
              <MapPin className="size-6 text-muted-foreground" />
            </div>
            <div>
              <p className="font-semibold text-foreground text-sm">Chưa có phòng trọ trên bản đồ</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {userLocation
                  ? "Không tìm thấy phòng trọ nào trong bán kính 15km quanh vị trí hiện tại của bạn."
                  : "Các phòng trọ mới đăng tải sẽ tự động hiển thị ghim tại đây."}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setUserLocation(null);
                handleClearLandmark();
                loadRooms(10.776, 106.667, 30, null);
              }}
              className="text-xs gap-1.5 mt-2"
            >
              <RefreshCw className="size-3.5" /> Xem toàn bộ TP.HCM
            </Button>
          </div>
        )}

        {/* Danh sách phòng thực tế từ Database */}
        {!loading && adjustedRooms.length > 0 && (
          <div data-tour="map-room-list" className="flex-1 space-y-2.5 overflow-y-auto p-4">
            {adjustedRooms.map((r) => (
              <button
                key={r.id}
                ref={(el) => {
                  cardRefs.current[r.id] = el;
                }}
                onMouseEnter={() => setHoveredId(r.id)}
                onMouseLeave={() => setHoveredId(null)}
                onClick={() => {
                  if (activeId === r.id) {
                    navigate(`/rooms/${r.id}`);
                  } else {
                    setActiveId(r.id);
                    setPanTarget([r.lat, r.lng]);
                  }
                }}
                className={cn(
                  "flex w-full cursor-pointer gap-3 rounded-xl p-2.5 text-left ring-1 transition bg-card",
                  activeId === r.id
                    ? "ring-primary shadow-sm bg-accent/30"
                    : "ring-border/80 hover:ring-primary/40"
                )}
              >
                <ImageWithFallback
                  src={r.images[0]}
                  alt={r.title}
                  className="size-22 shrink-0 rounded-lg object-cover"
                />
                <div className="min-w-0 flex-1 py-0.5">
                  <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                    {r.type && (
                      <span className="inline-block rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-700">
                        {r.type}
                      </span>
                    )}
                    {r.distanceKm !== undefined && (
                      <span className="inline-block rounded bg-emerald-50 border border-emerald-200/70 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-800 tabular-nums">
                        {formatDistance(r.distanceKm, distanceTargetLabel)}
                      </span>
                    )}
                  </div>
                  <h3 className="line-clamp-1 text-sm font-semibold text-foreground">{r.title}</h3>
                  <p className="text-primary font-bold text-sm tabular-nums mt-0.5">
                    {formatVND(r.price)}
                    <span className="text-xs text-muted-foreground font-normal">/tháng</span>
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5 truncate tabular-nums">
                    {r.addressStreet ? `${r.addressStreet}, ` : ""}
                    {r.district} • {r.area} m²
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ===== BÊN PHẢI: BẢN ĐỒ LEAFLET / GOONG MAPS ===== */}
      <div className="relative hidden lg:block flex-1 h-full w-full z-0">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="absolute top-4 left-4 z-[1000] size-10 rounded-full bg-background border border-border shadow-md transition-all hover:bg-accent press-active hover:scale-105"
          title={isSidebarOpen ? "Ẩn danh sách" : "Hiện danh sách"}
        >
          {isSidebarOpen ? <ChevronLeft className="size-5" /> : <ChevronRight className="size-5" />}
        </Button>

        {/* Nút định vị GPS trực tiếp trên bản đồ */}
        <div className="absolute top-4 right-4 z-[1000] flex items-center gap-2">
          <Button
            variant={userLocation ? "default" : "outline"}
            size="sm"
            onClick={handleGetLocation}
            disabled={isLocating}
            className={cn(
              "rounded-full shadow-md text-xs font-medium gap-2 transition-all hover:scale-105 h-9 px-3.5 cursor-pointer",
              userLocation
                ? "bg-blue-600 hover:bg-blue-700 text-white border-blue-600"
                : "bg-background/95 backdrop-blur border border-border text-foreground hover:bg-accent"
            )}
            title="Xác định vị trí hiện tại để tìm phòng xung quanh bạn"
          >
            {isLocating ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Compass className="size-3.5 text-blue-500" />
            )}
            <span>{userLocation ? "Đang định vị bạn" : "Vị trí của tôi"}</span>
          </Button>
        </div>

        <MapContainer center={center} zoom={12} className="h-full w-full" zoomControl={false}>
          <MapResizeTrigger isSidebarOpen={isSidebarOpen} />
          {/* Tile layer sạch, tự động fallback sang OpenStreetMap nếu Goong tile key báo lỗi */}
          <TileLayer
            attribution={attribution}
            url={tileUrl}
            maxZoom={19}
            eventHandlers={{
              tileerror: () => {
                if (hasGoongTileKey) {
                  setUseOsmFallback(true);
                }
              },
            }}
          />
          {panTarget && <FlyTo coords={panTarget} />}

          {/* Marker Điểm mốc Trường ĐH / Công ty đang tìm kiếm */}
          {selectedLandmark && (
            <Marker
              position={[selectedLandmark.lat, selectedLandmark.lng]}
              icon={landmarkLocationIcon()}
            >
              <Tooltip permanent direction="top" offset={[0, -12]}>
                <div className="text-xs font-semibold text-slate-900">
                  Điểm mốc: {selectedLandmark.shortName}
                </div>
              </Tooltip>
            </Marker>
          )}

          {/* Marker vị trí hiện tại của người dùng */}
          {userLocation && (
            <Marker position={userLocation} icon={userLocationIcon()}>
              <Tooltip permanent direction="top" offset={[0, -10]}>
                <span className="font-semibold text-xs text-blue-700">Vị trí hiện tại của bạn</span>
              </Tooltip>
            </Marker>
          )}

          {adjustedRooms.map((r) => (
            <RoomMarker
              key={r.id}
              room={r}
              active={r.id === activeId}
              hovered={r.id === hoveredId}
              distanceLabel={distanceTargetLabel}
              onClick={() => {
                if (activeId === r.id) {
                  navigate(`/rooms/${r.id}`);
                } else {
                  setActiveId(r.id);
                  setPanTarget([r.lat, r.lng]);
                }
              }}
              onMouseEnter={() => setHoveredId(r.id)}
              onMouseLeave={() => setHoveredId(null)}
            />
          ))}
        </MapContainer>

        {/* Pop-up thông tin nhanh phòng đang hoạt động */}
        {activeRoom && (
          <div className="absolute bottom-5 left-1/2 z-[1000] w-[340px] -translate-x-1/2">
            <div className="card-surface flex gap-3 rounded-xl p-3 bg-card border border-border shadow-lg">
              <ImageWithFallback
                src={activeRoom.images[0]}
                alt=""
                className="h-20 w-24 shrink-0 rounded-lg object-cover"
              />
              <div className="min-w-0 flex-1">
                <h3 className="line-clamp-1 text-sm font-semibold text-foreground">{activeRoom.title}</h3>
                <p className="text-primary font-semibold text-sm tabular-nums">
                  {formatVND(activeRoom.price)}
                  <span className="text-xs text-muted-foreground font-normal">/tháng</span>
                </p>
                <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1 flex-wrap tabular-nums">
                  <span>{activeRoom.district} • {activeRoom.area} m²</span>
                  {activeRoom.distanceKm !== undefined && (
                    <>
                      <span>•</span>
                      <span className="text-emerald-700 font-semibold">
                        {formatDistance(activeRoom.distanceKm, distanceTargetLabel)}
                      </span>
                    </>
                  )}
                </p>
                <button
                  onClick={() => navigate(`/rooms/${activeRoom.id}`)}
                  className="mt-1.5 inline-block text-xs font-semibold text-primary hover:underline cursor-pointer"
                >
                  Xem chi tiết →
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
