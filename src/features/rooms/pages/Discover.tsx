import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  Heart,
  MapPin,
  Maximize2,
  Map as MapIcon,
  Activity,
  ShieldCheck,
  Users,
  AlertCircle,
  RefreshCw,
  ArrowRight,
  ArrowUpRight,
  Eye,
  Layers,
  X,
  BellRing,
  CheckCircle2,
  SlidersHorizontal,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ImageWithFallback } from "@/components/shared/ImageWithFallback";
import { SwipeStage } from "@/components/shared/SwipeStage";
import { FilterSidebar, type RoomFilterState } from "@/features/rooms/components/FilterSidebar";
import { MatchBadge } from "@/components/shared/primitives-compat";
import { formatVND, cn } from "@/lib/utils";
import { inferDistrictFromSchoolOrPlace, normalizeAmenitiesList } from "@/lib/constants";
import type { Room } from "../types/room.types";
import { useRooms } from "../hooks/useRooms";
import { roomsApi } from "../api/roomsApi";
import { accountApi } from "@/features/account/api/accountApi";
import { useNotifications } from "@/features/notifications/hooks/useNotifications";
import { useAuth } from "@/app/context/AuthContext";
import { useMonetization } from "@/app/context/MonetizationContext";
import { SwipeStageSkeleton } from "@/components/ui/skeleton-loaders";

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

function formatFilterBadges(criteria?: RoomFilterState | null, amenities?: string[]): string[] {
  if (!criteria && (!amenities || amenities.length === 0)) return [];
  const badges: string[] = [];
  if (criteria?.district) {
    badges.push(`Khu vực: ${criteria.district}`);
  }
  if (criteria?.roomType) {
    badges.push(`Loại phòng: ${ROOM_TYPE_LABELS[criteria.roomType] || criteria.roomType}`);
  }
  if (criteria?.minPrice != null || criteria?.maxPrice != null) {
    const minM = criteria.minPrice ? (criteria.minPrice / 1_000_000).toFixed(1).replace(".0", "") : "0";
    const maxM = criteria.maxPrice ? (criteria.maxPrice / 1_000_000).toFixed(1).replace(".0", "") : "";
    if (criteria.minPrice && criteria.maxPrice) {
      badges.push(`Ngân sách: ${minM} – ${maxM} triệu/tháng`);
    } else if (criteria.maxPrice) {
      badges.push(`Ngân sách: ≤ ${maxM} triệu/tháng`);
    } else if (criteria.minPrice) {
      badges.push(`Ngân sách: Từ ${minM} triệu/tháng`);
    }
  }
  if (criteria?.keyword) {
    badges.push(`Từ khóa: "${criteria.keyword}"`);
  }
  const allAmenities = amenities && amenities.length > 0 ? amenities : criteria?.amenities || [];
  for (const a of allAmenities) {
    badges.push(`Tiện ích: ${a}`);
  }
  return badges;
}

function BigRoomCard({
  room,
  saved,
  onToggleSave,
  onOpenDetail,
}: {
  room: any;
  saved?: boolean;
  onToggleSave?: (room: any) => void;
  onOpenDetail?: (room: any) => void;
}) {
  const pointerStartRef = useRef<{ x: number; y: number } | null>(null);

  const rawImages = room.images || [];
  const displayImages: string[] = rawImages
    .map((img: any) => (typeof img === "string" ? img : img?.imageUrl))
    .filter(Boolean);

  const images =
    displayImages.length > 0
      ? displayImages
      : room?.primaryImageUrl
      ? [room.primaryImageUrl]
      : [
          "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&auto=format&fit=crop&q=80",
          "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&auto=format&fit=crop&q=80",
        ];

  const priceVal = room.price ? Number(room.price) : 0;
  const depositVal = room.depositAmount ? Number(room.depositAmount) : 0;
  const titleVal = room.title || "Phòng trọ";
  const districtVal = room.district || "";
  const addressStreet = room.addressStreet || "";
  const areaVal = room.areaSqm ?? room.area ?? 0;
  const floorVal = room.floorNumber ?? room.floor;
  const rawType = room.roomType ?? room.type ?? "";
  const typeLabel = ROOM_TYPE_LABELS[rawType] || rawType || "Phòng trọ";
  const maxOccupants = room.maxOccupants ?? 2;
  const isVerified = Boolean(room.isVerified);
  const matchVal = typeof room.match === "number" && room.match > 0 ? room.match : null;
  const normalizedAmenities = normalizeAmenitiesList(room?.amenities);
  const amenitiesList: string[] =
    normalizedAmenities.length > 0
      ? normalizedAmenities
      : ["Wi-Fi", "Giờ tự do", "An ninh 24/7"];

  const handleGalleryPointerDown = (e: React.PointerEvent) => {
    pointerStartRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleGalleryClick = (e: React.MouseEvent) => {
    if (pointerStartRef.current) {
      const dist = Math.hypot(
        e.clientX - pointerStartRef.current.x,
        e.clientY - pointerStartRef.current.y
      );
      if (dist > 6) return;
    }
    onOpenDetail?.(room);
  };

  return (
    <div className="group flex h-full flex-col overflow-hidden rounded-3xl bg-card shadow-xl ring-1 ring-border hover-lift select-none">
      {/* Top 55%: Photo Gallery (hover shows 1 clean detail cue, 1-click opens room detail, drag swipes card) */}
      <div
        onPointerDown={handleGalleryPointerDown}
        onClick={handleGalleryClick}
        className="group/gallery relative grid h-[55%] grid-cols-3 grid-rows-2 gap-1 overflow-hidden shrink-0 bg-slate-100 cursor-pointer active:cursor-grabbing"
      >
        <div className="relative col-span-2 row-span-2 overflow-hidden">
          <ImageWithFallback
            src={images[0]}
            alt={titleVal}
            className="size-full object-cover transition-transform duration-500 ease-out group-hover/gallery:scale-[1.03]"
          />
        </div>

        <div className="relative overflow-hidden">
          <ImageWithFallback
            src={images[1] || images[0]}
            alt=""
            className="size-full object-cover transition-transform duration-500 ease-out group-hover/gallery:scale-[1.03]"
          />
        </div>

        <div className="relative overflow-hidden">
          <ImageWithFallback
            src={images[2] || images[0]}
            alt=""
            className="size-full object-cover transition-transform duration-500 ease-out group-hover/gallery:scale-[1.03]"
          />
          {images.length > 3 && (
            <span className="pointer-events-none absolute bottom-2.5 right-2.5 rounded-md bg-slate-950/70 px-2 py-0.5 text-[11px] font-semibold text-white backdrop-blur-xs">
              +{images.length - 3} ảnh
            </span>
          )}
        </div>

        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/55 via-black/15 to-transparent opacity-0 transition-opacity duration-200 group-hover/gallery:opacity-100" />

        {/* Single clean hover cue on gallery */}
        <div className="pointer-events-none absolute bottom-3 left-3.5 z-20 inline-flex items-center gap-1.5 rounded-full bg-slate-950/80 px-3.5 py-1.5 text-xs font-semibold text-white shadow-md ring-1 ring-white/15 backdrop-blur-md opacity-0 translate-y-1 transition-all duration-200 ease-out group-hover/gallery:opacity-100 group-hover/gallery:translate-y-0">
          <Eye className="size-3.5 text-emerald-300" />
          <span>Xem chi tiết phòng</span>
          <ArrowUpRight className="size-3.5 text-white/80" />
        </div>

        {saved && (
          <span className="pointer-events-none absolute left-3.5 top-3.5 z-20 inline-flex items-center gap-1 rounded-full bg-rose-600 text-white px-2.5 py-1 text-[11px] font-bold shadow-md backdrop-blur animate-fade-in">
            <Heart className="size-3 fill-white" /> Đã lưu
          </span>
        )}

        <button
          type="button"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onToggleSave?.(room);
          }}
          className={cn(
            "absolute right-3.5 top-3.5 grid size-10 place-items-center rounded-full shadow-md backdrop-blur transition-all duration-200 press-active hover:scale-105 active:scale-95 z-30 cursor-pointer",
            saved
              ? "bg-rose-50 text-rose-600 ring-2 ring-rose-500/40"
              : "bg-white/95 text-muted-foreground hover:bg-white hover:text-rose-500"
          )}
          title={saved ? "Bỏ lưu phòng" : "Lưu phòng vào danh sách yêu thích"}
        >
          <Heart className={cn("size-5 transition-colors", saved ? "fill-rose-500 text-rose-500" : "")} />
        </button>

        {matchVal != null && <MatchBadge value={matchVal} className="absolute bottom-3 right-3.5 z-20" />}
      </div>

      {/* Bottom 45%: Clean 3-tier hierarchy (Identity + Price -> Inline Specs -> Amenities) */}
      <div className="flex flex-1 flex-col justify-between p-3.5 sm:px-5 sm:py-3 min-w-0 min-h-0">
        {/* Tier 1: Title & Location on Left | Price & Deposit on Right */}
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-mint text-emerald-brand uppercase tracking-wider">
                {typeLabel}
              </span>
              {isVerified && (
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                  <ShieldCheck className="size-3" /> Đã xác thực
                </span>
              )}
            </div>
            <h3 className="text-base sm:text-lg font-bold text-foreground transition-colors duration-200 group-hover:text-primary line-clamp-1 leading-snug">
              {titleVal}
            </h3>
            <p className="inline-flex items-center gap-1.5 text-xs sm:text-sm text-muted-foreground max-w-full">
              <MapPin className="size-3.5 text-primary shrink-0" />
              <span className="truncate">
                {addressStreet ? `${addressStreet}, ` : ""}
                {districtVal || "TP.HCM"}
              </span>
            </p>
          </div>

          <div className="shrink-0 text-right pt-0.5">
            <p className="text-primary leading-none">
              <span className="text-xl sm:text-2xl font-extrabold tabular-nums">
                {formatVND(priceVal)}
              </span>
              <span className="text-xs font-normal text-muted-foreground">/tháng</span>
            </p>
            {depositVal > 0 && (
              <p className="mt-1.5 text-xs text-muted-foreground tabular-nums">
                Cọc: <span className="font-semibold text-foreground">{formatVND(depositVal)}</span>
              </p>
            )}
          </div>
        </div>

        {/* Tier 2: Clean Inline Spec Strip (No nested boxes) */}
        <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-xs sm:text-sm text-slate-600">
          {areaVal > 0 && (
            <span className="inline-flex items-center gap-1.5 font-medium">
              <Maximize2 className="size-3.5 text-primary" />
              <span className="tabular-nums">{areaVal} m²</span>
            </span>
          )}
          {floorVal != null && floorVal > 0 && (
            <span className="inline-flex items-center gap-1.5 font-medium">
              <Layers className="size-3.5 text-primary" />
              <span>Tầng {floorVal}</span>
            </span>
          )}
          {maxOccupants > 0 && (
            <span className="inline-flex items-center gap-1.5 font-medium">
              <Users className="size-3.5 text-primary" />
              <span>Tối đa {maxOccupants} người</span>
            </span>
          )}
        </div>

        {/* Tier 3: Amenities Footer */}
        <div className="flex items-center justify-between gap-2 pt-2.5 border-t border-border/60">
          <div className="flex flex-wrap items-center gap-1.5 min-w-0">
            {amenitiesList.slice(0, 4).map((a: string) => (
              <span
                key={a}
                className="rounded-md bg-mint/80 px-2.5 py-0.5 text-xs font-medium text-emerald-800"
              >
                {a}
              </span>
            ))}
            {amenitiesList.length > 4 && (
              <span className="text-xs text-muted-foreground">
                +{amenitiesList.length - 4}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

interface PendingRoomPreview {
  id: string;
  title: string;
  price: number;
  district: string;
  area?: number;
  type?: string;
  typeLabel?: string;
  image?: string;
  imageUrl?: string;
  isVerified?: boolean;
}

export default function Discover() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const urlDistrict = searchParams.get("district")?.trim() || undefined;
  const urlRoomType = searchParams.get("roomType")?.trim() || undefined;
  const urlKeyword = searchParams.get("keyword")?.trim() || undefined;
  const hasUrlFilters = Boolean(urlDistrict || urlRoomType || urlKeyword);

  const shouldReduceMotion = useReducedMotion();
  const { user } = useAuth();
  const { loaded, swipesLeft, maxSwipes, decrementSwipes, openPricing, tier } = useMonetization();
  const [pendingRoom, setPendingRoom] = useState<PendingRoomPreview | null>(null);
  const [showPendingRoomModal, setShowPendingRoomModal] = useState(false);

  // Check if the user selected a specific room on the Landing Page before logging in / registering
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("ptx_pending_room");
      if (!raw) return;
      const parsed = JSON.parse(raw) as PendingRoomPreview;
      if (!parsed || !parsed.id) return;
      setPendingRoom(parsed);
      const timer = window.setTimeout(() => {
        setShowPendingRoomModal(true);
      }, 350);
      return () => window.clearTimeout(timer);
    } catch {
      // ignore invalid session payload
    }
  }, []);

  const handleDismissPendingRoom = () => {
    setShowPendingRoomModal(false);
    try {
      sessionStorage.removeItem("ptx_pending_room");
    } catch {
      // ignore
    }
  };

  const handleConfirmPendingRoom = () => {
    if (!pendingRoom?.id) return;
    const targetId = pendingRoom.id;
    setShowPendingRoomModal(false);
    try {
      sessionStorage.removeItem("ptx_pending_room");
    } catch {
      // ignore
    }
    navigate(`/rooms/${targetId}`);
  };

  // Pre-calculate initial filters from URL query params first, or logged-in user profile
  const initialPrefFilters = hasUrlFilters
    ? {
        district: urlDistrict,
        roomType: urlRoomType,
        keyword: urlKeyword,
        excludeSwiped: false,
      }
    : {
        district: user?.preferredDistricts?.[0],
        roomType: user?.preferredRoomType,
        minPrice: user?.budgetMin,
        maxPrice: user?.budgetMax,
        excludeSwiped: true,
      };

  const { rooms, isLoading, isError, isEmpty, errorMessage, updateFilters, refetch } = useRooms(
    initialPrefFilters
  );
  const { notifications, isLoading: notifsLoading } = useNotifications();
  const [savedIds, setSavedIds] = useState<Set<string>>(() => {
    try {
      const cached = localStorage.getItem("ptx_saved_room_ids");
      return cached ? new Set(JSON.parse(cached)) : new Set();
    } catch {
      return new Set();
    }
  });

  const [sidebarResetKey, setSidebarResetKey] = useState(0);

  // Track rooms swiped in prior navigation so they aren't re-shown on remount,
  // while keeping activeRooms stable during active swipes so SwipeStage index & Undo work without flickering.
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(() => {
    try {
      const cached = sessionStorage.getItem("ptx_dismissed_room_ids");
      return cached ? new Set(JSON.parse(cached)) : new Set();
    } catch {
      return new Set();
    }
  });
  const swipedSessionRef = useRef<Set<string>>(new Set(dismissedIds));
  const [hasSwipedInSession, setHasSwipedInSession] = useState<boolean>(dismissedIds.size > 0);
  const [initialFilters, setInitialFilters] = useState<RoomFilterState | undefined>(
    hasUrlFilters
      ? {
          district: urlDistrict,
          roomType: urlRoomType,
          keyword: urlKeyword,
        }
      : user && (user.preferredDistricts?.length || user.preferredRoomType || user.budgetMin)
      ? {
          district: user.preferredDistricts?.[0],
          roomType: user.preferredRoomType,
          minPrice: user.budgetMin,
          maxPrice: user.budgetMax,
        }
      : undefined
  );

  // Sync URL query params (?district=...&roomType=...&keyword=...) when navigating from RoomDetail breadcrumb
  useEffect(() => {
    if (!urlDistrict && !urlRoomType && !urlKeyword) return;
    const urlInit: RoomFilterState = {
      district: urlDistrict,
      roomType: urlRoomType,
      keyword: urlKeyword,
    };
    setInitialFilters(urlInit);
    try {
      sessionStorage.setItem("ptx_discover_filters", JSON.stringify(urlInit));
    } catch {
      // ignore
    }
    updateFilters(
      {
        district: urlDistrict,
        roomType: urlRoomType,
        keyword: urlKeyword,
        excludeSwiped: false,
      },
      true
    );
  }, [urlDistrict, urlRoomType, urlKeyword]);

  // Load user's saved onboarding criteria to pre-fill search filters (only when no explicit URL filter is active)
  useEffect(() => {
    if (!user || hasUrlFilters) return;
    const hasInitialUserPrefs = Boolean(
      user.preferredDistricts?.length || user.preferredRoomType || user.budgetMin || user.budgetMax
    );
    if (hasInitialUserPrefs) {
      const init: RoomFilterState = {
        district: user.preferredDistricts?.[0],
        roomType: user.preferredRoomType,
        minPrice: user.budgetMin ? Number(user.budgetMin) : undefined,
        maxPrice: user.budgetMax ? Number(user.budgetMax) : undefined,
      };
      setInitialFilters(init);
      try {
        sessionStorage.setItem("ptx_discover_filters", JSON.stringify(init));
      } catch {
        // ignore
      }
      return;
    }
    async function loadTenantCriteria() {
      try {
        const profile = await accountApi.getProfile();
        if (profile) {
          const fallbackSchoolDistrict =
            (profile.proximitySchool !== false || profile.proximityWork !== false) &&
            (profile.schoolOrCompany || profile.school)
              ? inferDistrictFromSchoolOrPlace(profile.schoolOrCompany || profile.school) || undefined
              : undefined;
          const prefDistrict =
            profile.preferredDistricts && profile.preferredDistricts.length > 0
              ? profile.preferredDistricts[0]
              : fallbackSchoolDistrict;
          const prefRoomType = profile.preferredRoomType || undefined;
          const minP = profile.budgetMin ? Number(profile.budgetMin) : undefined;
          const maxP = profile.budgetMax ? Number(profile.budgetMax) : undefined;

          const init: RoomFilterState = {
            district: prefDistrict,
            roomType: prefRoomType,
            minPrice: minP,
            maxPrice: maxP,
          };
          setInitialFilters(init);

          if (prefDistrict || prefRoomType || minP || maxP) {
            try {
              sessionStorage.setItem("ptx_discover_filters", JSON.stringify(init));
            } catch {
              // ignore
            }
            updateFilters({
              district: prefDistrict,
              roomType: prefRoomType,
              minPrice: minP,
              maxPrice: maxP,
              excludeSwiped: true,
            }, true);
          }
        }
      } catch {
        // quiet fallback
      }
    }
    loadTenantCriteria();
  }, [user?.id, hasUrlFilters]);

  // Load user's saved rooms to sync bookmark states
  useEffect(() => {
    async function loadSaved() {
      try {
        const savedList = await roomsApi.getSavedRooms();
        if (Array.isArray(savedList)) {
          const idSet = new Set(savedList.map((r) => String(r.id)));
          setSavedIds(idSet);
          localStorage.setItem("ptx_saved_room_ids", JSON.stringify(Array.from(idSet)));
        }
      } catch {
        // quiet fallback
      }
    }
    loadSaved();
  }, [user]);

  const [selectedAmenitiesFilter, setSelectedAmenitiesFilter] = useState<string[]>([]);
  const [activeFilterCriteria, setActiveFilterCriteria] = useState<RoomFilterState | undefined>(
    initialFilters
  );
  const [unmatchedCriteria, setUnmatchedCriteria] = useState<RoomFilterState | null>(null);
  const [showCriteriaAlertModal, setShowCriteriaAlertModal] = useState(false);
  const [isSubscribingAlert, setIsSubscribingAlert] = useState(false);
  const [isAlertSubscribed, setIsAlertSubscribed] = useState(false);
  const lastAlertSignatureRef = useRef<string>("");

  useEffect(() => {
    if (initialFilters) {
      setActiveFilterCriteria(initialFilters);
    }
  }, [initialFilters]);

  const handleApplyFilters = (newFilters: RoomFilterState) => {
    setSelectedAmenitiesFilter(newFilters.amenities || []);
    const inferredSchoolDist = newFilters.keyword
      ? inferDistrictFromSchoolOrPlace(newFilters.keyword)
      : undefined;
    const effectiveDistrict = newFilters.district || inferredSchoolDist;
    const effectiveKeyword = inferredSchoolDist && !newFilters.district ? undefined : newFilters.keyword;

    const normalizedCriteria: RoomFilterState = {
      ...newFilters,
      district: effectiveDistrict,
    };
    setActiveFilterCriteria(normalizedCriteria);
    setUnmatchedCriteria(normalizedCriteria);
    setIsAlertSubscribed(false);
    lastAlertSignatureRef.current = "";

    const nextParams: Record<string, string> = {};
    if (effectiveDistrict) nextParams.district = effectiveDistrict;
    if (newFilters.roomType) nextParams.roomType = newFilters.roomType;
    if (newFilters.keyword) nextParams.keyword = newFilters.keyword;
    setSearchParams(nextParams, { replace: true });
    try {
      sessionStorage.setItem("ptx_discover_filters", JSON.stringify(newFilters));
    } catch {
      // ignore
    }
    updateFilters({
      district: effectiveDistrict,
      roomType: newFilters.roomType,
      minPrice: newFilters.minPrice,
      maxPrice: newFilters.maxPrice,
      keyword: effectiveKeyword,
      excludeSwiped: true,
    }, true);
    toast.info("Đã áp dụng bộ lọc");
  };

  const handleResetFilters = async () => {
    setSelectedAmenitiesFilter([]);
    setSidebarResetKey((prev) => prev + 1);
    setInitialFilters(undefined);
    setActiveFilterCriteria(undefined);
    setUnmatchedCriteria(null);
    setShowCriteriaAlertModal(false);
    setSearchParams({}, { replace: true });
    setDismissedIds(new Set());
    swipedSessionRef.current = new Set();
    setHasSwipedInSession(false);
    sessionStorage.removeItem("ptx_dismissed_room_ids");
    sessionStorage.removeItem("ptx_discover_filters");
    try {
      await roomsApi.resetSwipes();
    } catch {
      // quiet fallback
    }
    updateFilters({ excludeSwiped: true }, true);
    toast.info("Đã đặt lại bộ lọc & làm mới danh sách phòng");
  };

  const handleSubscribeRoomAlert = async (browseOtherRoomsAfter = false) => {
    const target = unmatchedCriteria || activeFilterCriteria || initialFilters;
    if (!user) {
      toast.error("Vui lòng đăng nhập để bật thông báo khi có phòng phù hợp!", {
        action: {
          label: "Đăng nhập ngay",
          onClick: () => navigate("/login"),
        },
      });
      return;
    }

    setIsSubscribingAlert(true);
    try {
      // 1. Enable room_recommend in local notification preferences
      try {
        const rawPrefs = localStorage.getItem("ptx_notification_prefs_tenant");
        const parsedPrefs = rawPrefs ? JSON.parse(rawPrefs) : {};
        parsedPrefs.room_recommend = true;
        localStorage.setItem("ptx_notification_prefs_tenant", JSON.stringify(parsedPrefs));
      } catch {
        // ignore storage errors
      }

      // 2. Save matching criteria to Backend UserProfile so RoomService.notifyMatchingTenants dispatches alerts
      if (target) {
        const minP = target.minPrice != null ? Number(target.minPrice) : undefined;
        const maxP =
          target.maxPrice != null
            ? Number(target.maxPrice)
            : minP != null
            ? Math.max(minP * 1.5, 6_000_000)
            : undefined;

        await accountApi
          .updatePreferences({
            preferredDistricts: target.district ? [target.district] : undefined,
            preferredRoomType: target.roomType || undefined,
            budgetMin: minP,
            budgetMax: maxP,
          })
          .catch(() => {});
      }

      // 3. Request Browser Notification permission if supported
      if (
        typeof window !== "undefined" &&
        "Notification" in window &&
        window.Notification.permission === "default"
      ) {
        window.Notification.requestPermission().catch(() => {});
      }

      setIsAlertSubscribed(true);
      toast.success("Đã bật thông báo khi có phòng phù hợp!", {
        description:
          "Hệ thống sẽ gửi thông báo ngay khi có chủ trọ đăng phòng khớp với yêu cầu của bạn.",
      });

      if (browseOtherRoomsAfter) {
        setShowCriteriaAlertModal(false);
        setSelectedAmenitiesFilter([]);
        setInitialFilters(undefined);
        setActiveFilterCriteria(undefined);
        setSidebarResetKey((prev) => prev + 1);
        setSearchParams({}, { replace: true });
        sessionStorage.removeItem("ptx_discover_filters");
        updateFilters({ excludeSwiped: true }, true);
      }
    } finally {
      setIsSubscribingAlert(false);
    }
  };

  const handleToggleSave = async (r: Room) => {
    if (!user) {
      toast.error("Vui lòng đăng nhập để lưu phòng vào danh sách yêu thích!", {
        action: {
          label: "Đăng nhập ngay",
          onClick: () => navigate("/login"),
        },
      });
      return;
    }

    const isAlreadySaved = savedIds.has(String(r.id));
    if (isAlreadySaved) {
      setSavedIds((prev) => {
        const next = new Set(prev);
        next.delete(String(r.id));
        localStorage.setItem("ptx_saved_room_ids", JSON.stringify(Array.from(next)));
        return next;
      });
      toast.info("Đã bỏ lưu phòng khỏi danh sách");
      try {
        await roomsApi.unsaveRoom(r.id);
      } catch {
        // quiet fallback
      }
    } else {
      setSavedIds((prev) => {
        const next = new Set(prev).add(String(r.id));
        localStorage.setItem("ptx_saved_room_ids", JSON.stringify(Array.from(next)));
        return next;
      });
      localStorage.setItem("ptx_sample_room_id", String(r.id));
      window.dispatchEvent(
        new CustomEvent("ptx:flow-hint", {
          detail: { type: "ROOM_LIKED", roomId: String(r.id), roomTitle: r.title || "Phòng trọ" },
        })
      );
      toast.success("Đã lưu phòng vào danh sách yêu thích", { description: r.title });
      try {
        await roomsApi.saveRoom(r.id);
      } catch {
        // quiet fallback
      }
    }
  };

  const handleLike = async (r: Room) => {
    if (!user) {
      toast.error("Vui lòng đăng nhập để lưu phòng vào danh sách yêu thích!", {
        action: {
          label: "Đăng nhập ngay",
          onClick: () => navigate("/login"),
        },
      });
      return;
    }

    const success = decrementSwipes();
    if (success) {
      const idStr = String(r.id);
      setSavedIds((prev) => {
        const next = new Set(prev).add(idStr);
        localStorage.setItem("ptx_saved_room_ids", JSON.stringify(Array.from(next)));
        return next;
      });
      swipedSessionRef.current.add(idStr);
      setHasSwipedInSession(true);
      try {
        sessionStorage.setItem(
          "ptx_dismissed_room_ids",
          JSON.stringify(Array.from(swipedSessionRef.current))
        );
      } catch {
        // ignore
      }
      localStorage.setItem("ptx_sample_room_id", idStr);
      window.dispatchEvent(
        new CustomEvent("ptx:flow-hint", {
          detail: { type: "ROOM_LIKED", roomId: idStr, roomTitle: r.title || "Phòng trọ" },
        })
      );
      toast.success("Đã thích & lưu phòng", { description: r.title });
      try {
        await roomsApi.swipeRoom(r.id, "LIKE");
      } catch {
        // Fallback to saveRoom if swipe endpoint unauthenticated
        roomsApi.saveRoom(r.id).catch(() => {});
      }
    }
  };

  const handleSkip = (r?: Room) => {
    decrementSwipes();
    if (r?.id) {
      const idStr = String(r.id);
      swipedSessionRef.current.add(idStr);
      setHasSwipedInSession(true);
      try {
        sessionStorage.setItem(
          "ptx_dismissed_room_ids",
          JSON.stringify(Array.from(swipedSessionRef.current))
        );
      } catch {
        // ignore
      }
      roomsApi.swipeRoom(r.id, "PASS").catch(() => {});
    }
  };

  const handleResetSession = async () => {
    setDismissedIds(new Set());
    swipedSessionRef.current = new Set();
    setHasSwipedInSession(false);
    setSidebarResetKey((prev) => prev + 1);
    sessionStorage.removeItem("ptx_dismissed_room_ids");
    try {
      await roomsApi.resetSwipes();
    } catch {
      // quiet fallback
    }
    toast.info("Đã làm mới danh sách phòng");
    refetch();
  };

  const activeRooms = rooms.filter((r) => {
    if (!hasUrlFilters && dismissedIds.has(String(r.id))) return false;
    if (selectedAmenitiesFilter.length > 0) {
      const roomAmenities: string[] = normalizeAmenitiesList(r.amenities);
      const hasAll = selectedAmenitiesFilter.every((a) =>
        roomAmenities.some((item) => item.toLowerCase().trim() === a.toLowerCase().trim())
      );
      if (!hasAll) return false;
    }
    return true;
  });

  const activeFilterBadges = formatFilterBadges(
    unmatchedCriteria || activeFilterCriteria || initialFilters,
    selectedAmenitiesFilter
  );

  const isFilterZeroResults =
    !isLoading &&
    !isError &&
    (isEmpty || (activeRooms.length === 0 && !hasSwipedInSession)) &&
    activeFilterBadges.length > 0;

  // Trigger the centered empty-criteria alert popup once per distinct filter combination
  useEffect(() => {
    if (!isFilterZeroResults) return;
    const sig = activeFilterBadges.join("|");
    if (!sig || lastAlertSignatureRef.current === sig) return;
    lastAlertSignatureRef.current = sig;
    if (!unmatchedCriteria && (activeFilterCriteria || initialFilters)) {
      setUnmatchedCriteria(activeFilterCriteria || initialFilters || null);
    }
    setShowCriteriaAlertModal(true);
  }, [isFilterZeroResults, activeFilterBadges, unmatchedCriteria, activeFilterCriteria, initialFilters]);

  useEffect(() => {
    if (rooms.length > 0 && rooms[0]?.id) {
      try {
        if (!localStorage.getItem("ptx_sample_room_id")) {
          localStorage.setItem("ptx_sample_room_id", String(rooms[0].id));
        }
      } catch {
        // ignore
      }
    }
  }, [rooms]);

  return (
    <div className="mx-auto w-full max-w-[1440px] px-6 pt-1.5 md:pt-2 pb-2">
      <div className="mb-1.5 md:mb-2 flex items-end justify-between flex-wrap gap-2 animate-fade-in">
        <div>
          <h1 className="brand text-2xl md:text-[26px] text-foreground leading-tight">Khám phá phòng trọ</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Vuốt phải để lưu, vuốt trái để bỏ qua theo tiêu chí của bạn
          </p>
        </div>
        <div data-tour="discover-view-switcher" className="flex items-center gap-2">
          <Button
            data-tour="discover-btn-compare"
            variant="outline"
            className="gap-2 hover-lift press-active hover:border-primary/40 hover:bg-mint text-sm cursor-pointer"
            onClick={() => navigate("/compare")}
          >
            <Layers className="size-4 text-primary" />
            <span>So sánh{savedIds.size > 0 ? ` (${savedIds.size})` : ""}</span>
          </Button>
          <Button
            data-tour="discover-btn-map"
            variant="outline"
            className="gap-2 hover-lift press-active hover:border-primary/40 hover:bg-mint text-sm cursor-pointer"
            onClick={() => navigate("/map")}
          >
            <MapIcon className="size-4" /> Xem bản đồ
          </Button>
        </div>
      </div>

      <div className="grid w-full gap-4 md:gap-6 lg:grid-cols-[240px_1fr_240px]">
        {/* Real Filter Sidebar with active criteria */}
        <div className="hidden lg:block">
          <FilterSidebar
            variant="room"
            initialFilters={initialFilters}
            onApply={handleApplyFilters}
            onReset={handleResetFilters}
            isLoading={isLoading}
            resetKey={sidebarResetKey}
          />
        </div>

        {/* Center Swipe / Results */}
        {isLoading ? (
          <div className="flex flex-col -mt-4 md:-mt-8 items-center w-full animate-fade-in">
            <SwipeStageSkeleton variant="room" />
          </div>
        ) : isError ? (
          <div className="flex h-[400px] flex-col items-center justify-center rounded-3xl bg-card border border-destructive/20 p-8 text-center shadow-xs">
            <AlertCircle className="size-12 text-destructive mb-3" />
            <h3 className="text-lg font-bold text-foreground">Không thể tải danh sách phòng</h3>
            <p className="mt-1 text-sm text-muted-foreground max-w-sm">
              {errorMessage || "Đã có lỗi xảy ra khi kết nối máy chủ. Vui lòng thử lại."}
            </p>
            <Button onClick={() => refetch()} className="mt-4 gap-2 cursor-pointer" variant="outline">
              <RefreshCw className="size-4" /> Thử lại
            </Button>
          </div>
        ) : loaded && swipesLeft <= 0 ? (
          <div data-tour="discover-center-stage" className="flex h-[450px] flex-col items-center justify-center rounded-3xl bg-white border border-slate-200 p-8 text-center shadow-sm">
            <div className="relative mb-5 flex size-20 items-center justify-center rounded-full bg-red-50 text-red-500">
              <AlertCircle className="size-9 text-red-500" />
            </div>
            <h3 className="text-xl font-bold text-slate-800">Đã hết lượt vuốt hôm nay!</h3>
            <p className="mt-2 text-sm text-slate-500 max-w-sm">
              Bạn đã dùng hết {maxSwipes} lượt vuốt hôm nay. Lượt sẽ được làm mới vào ngày mai.
            </p>
            {tier === "free" && (
              <Button
                onClick={openPricing}
                className="mt-6 w-full max-w-[280px] bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl shadow-md cursor-pointer"
              >
                Xem gói tăng lượt vuốt
              </Button>
            )}
          </div>
        ) : isEmpty || isFilterZeroResults ? (
          <div
            data-tour="discover-center-stage"
            className="flex min-h-[clamp(380px,calc(100dvh-235px),545px)] flex-col items-center justify-center rounded-3xl bg-card border border-border p-6 sm:p-8 text-center shadow-xs animate-fade-in"
          >
            <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-200/70 mb-4">
              <BellRing className="size-7" />
            </div>

            <h3 className="text-lg sm:text-xl font-bold text-foreground">
              Chưa có phòng trọ phù hợp với yêu cầu hiện tại
            </h3>
            <p className="mt-1.5 text-xs sm:text-sm text-muted-foreground max-w-md leading-relaxed">
              Hệ thống hiện chưa có phòng đang mở khớp với bộ tiêu chí này. Bạn có muốn{" "}
              <strong className="font-semibold text-foreground">
                nhận thông báo ngay khi có chủ trọ đăng phòng phù hợp
              </strong>{" "}
              không?
            </p>

            {activeFilterBadges.length > 0 && (
              <div className="mt-4 flex flex-wrap items-center justify-center gap-1.5 max-w-md">
                {activeFilterBadges.map((badge) => (
                  <span
                    key={badge}
                    className="inline-flex items-center gap-1 rounded-full bg-mint/90 border border-primary/20 px-3 py-1 text-xs font-semibold text-emerald-900"
                  >
                    {badge}
                  </span>
                ))}
              </div>
            )}

            <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-2.5 w-full max-w-md">
              {isAlertSubscribed ? (
                <div className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-2.5 text-xs sm:text-sm font-semibold text-emerald-800">
                  <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
                  <span>Đã bật thông báo cho tiêu chí này</span>
                </div>
              ) : (
                <Button
                  type="button"
                  disabled={isSubscribingAlert}
                  onClick={() => handleSubscribeRoomAlert(false)}
                  className="w-full sm:w-auto gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold cursor-pointer"
                >
                  <BellRing className="size-4" />
                  <span>
                    {isSubscribingAlert
                      ? "Đang lưu tiêu chí..."
                      : "Nhận thông báo khi có phòng phù hợp"}
                  </span>
                </Button>
              )}

              <Button
                type="button"
                variant="outline"
                className="w-full sm:w-auto gap-1.5 rounded-xl cursor-pointer"
                onClick={handleResetFilters}
              >
                <RefreshCw className="size-3.5" />
                <span>Xem tất cả phòng hiện có</span>
              </Button>
            </div>
          </div>
        ) : (
          <div data-tour="discover-center-stage" className="flex flex-col -mt-3 md:-mt-6">
            {loaded && swipesLeft > 0 && (
              <div className="mb-1.5 md:mb-2 flex flex-wrap items-center justify-center gap-2">
                {hasUrlFilters && (
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-800 bg-mint px-3 py-1 rounded-full border border-primary/25 shadow-2xs animate-fade-in">
                    <MapPin className="size-3.5 text-primary" />
                    <span>
                      Đang lọc:{" "}
                      {[urlDistrict, urlRoomType && (ROOM_TYPE_LABELS[urlRoomType] || urlRoomType), urlKeyword]
                        .filter(Boolean)
                        .join(" • ")}
                    </span>
                    <button
                      type="button"
                      onClick={handleResetFilters}
                      className="ml-1 inline-flex items-center justify-center rounded-full p-0.5 hover:bg-primary/15 text-emerald-900 cursor-pointer"
                      title="Bỏ lọc và xem tất cả phòng"
                    >
                      <X className="size-3" />
                    </button>
                  </span>
                )}
                <span className="inline-flex items-center gap-1.5 text-xs text-slate-600 bg-slate-50 px-4 py-1 rounded-full border border-slate-200/60 shadow-sm animate-fade-in">
                  Bạn còn <strong className="text-slate-900 font-extrabold tabular-nums">{swipesLeft}/{maxSwipes}</strong> lượt vuốt hôm nay.{" "}
                  {tier === "free" && (
                    <button onClick={openPricing} className="text-emerald-600 font-black hover:underline cursor-pointer ml-1">
                      Tăng lượt
                    </button>
                  )}
                </span>
              </div>
            )}
            <SwipeStage
              resetKey={sidebarResetKey}
              items={activeRooms}
              renderCard={(r) => (
                <BigRoomCard
                  room={r}
                  saved={savedIds.has(String(r.id))}
                  onToggleSave={handleToggleSave}
                  onOpenDetail={(targetRoom) => navigate(`/rooms/${targetRoom.id}`)}
                />
              )}
              onLike={handleLike}
              onSkip={handleSkip}
              onInfo={(r) => navigate(`/rooms/${r.id}`)}
              emptyState={
                <div className="text-center">
                  <div className="mx-auto grid size-16 place-items-center rounded-full bg-mint text-primary">
                    <MapIcon className="size-8" />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold">Đã xem hết phòng phù hợp</h3>
                  <p className="mt-1 text-sm text-muted-foreground max-w-sm">
                    {hasSwipedInSession
                      ? "Bạn đã xem hết danh sách phòng trong phiên này. Bạn có thể xem lại từ đầu hoặc mở rộng bộ lọc."
                      : "Thử điều chỉnh hoặc mở rộng bộ lọc để xem thêm phòng"}
                  </p>
                  <div className="mt-4 flex items-center justify-center gap-2">
                    <Button variant="outline" className="cursor-pointer gap-1.5" onClick={handleResetSession}>
                      <RefreshCw className="size-4" /> Xem lại từ đầu
                    </Button>
                    <Button className="cursor-pointer" onClick={handleResetFilters}>
                      Đặt lại bộ lọc
                    </Button>
                  </div>
                </div>
              }
            />
          </div>
        )}

        {/* Right Sidebar: Real Notifications / Activity + Recommendations */}
        <div data-tour="discover-right-sidebar" className="hidden space-y-4 lg:block">
          <div className="rounded-2xl bg-card p-5 ring-1 ring-border shadow-xs">
            <h3 className="flex items-center gap-2 font-semibold text-sm">
              <Activity className="size-4 text-primary" /> Hoạt động gần đây
            </h3>

            {notifsLoading ? (
              <p className="mt-3 text-xs text-muted-foreground text-center py-2">
                Đang tải hoạt động...
              </p>
            ) : notifications.length === 0 ? (
              <div className="mt-3 text-center py-4">
                <p className="text-xs font-medium text-foreground">Chưa có hoạt động mới</p>
                <p className="text-[11px] text-muted-foreground mt-1">
                  Thông báo về phòng và bạn ở ghép sẽ xuất hiện tại đây.
                </p>
              </div>
            ) : (
              <ul className="mt-3 space-y-3">
                {notifications.slice(0, 4).map((n) => (
                  <li
                    key={n.id}
                    className="text-xs border-b border-border/50 pb-2.5 last:border-0 last:pb-0"
                  >
                    <p className="font-medium text-foreground line-clamp-2 leading-snug">
                      {n.title || n.message}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{n.time}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="rounded-2xl bg-mint/50 p-5 border border-primary/10">
            <h3 className="font-semibold text-emerald-deep text-sm">Gợi ý cho bạn</h3>
            <p className="mt-1 text-xs text-emerald-dark/80">
              Hoàn tất xác minh tài khoản để mở khoá liên hệ trực tiếp với chủ trọ và nâng cao điểm uy tín.
            </p>
            <Button
              size="sm"
              className="mt-3 hover-lift press-active hover-glow w-full cursor-pointer text-xs"
              onClick={() => navigate("/verify-account")}
            >
              Xác minh tài khoản
            </Button>
          </div>
        </div>
      </div>

      {/* Animated Resume Pending Room Popup (from Landing Page) */}
      <AnimatePresence>
        {showPendingRoomModal && pendingRoom && (
          <motion.div
            key="pending-room-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 backdrop-blur-[3px] p-4"
            onClick={handleDismissPendingRoom}
          >
            <motion.div
              key="pending-room-dialog"
              initial={{ opacity: 0, scale: 0.92, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-[440px] rounded-2xl bg-card border border-border p-6 shadow-2xl"
              role="dialog"
              aria-modal="true"
              aria-labelledby="pending-room-title"
            >
              <button
                type="button"
                onClick={handleDismissPendingRoom}
                aria-label="Đóng thông báo"
                className="absolute right-4 top-4 grid size-8 place-items-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
              >
                <X className="size-4" />
              </button>

              <div className="pr-8">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-mint px-2.5 py-0.5 text-[11px] font-semibold text-emerald-brand">
                  Phòng bạn đã chọn trước đó
                </span>
                <h2 id="pending-room-title" className="mt-2 text-lg font-bold text-foreground leading-snug">
                  Tiếp tục xem phòng bạn đang quan tâm?
                </h2>
                <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                  Trước khi đăng nhập, bạn đã chọn xem phòng trọ này ở trang chủ. Bạn có muốn mở chi tiết phòng ngay bây giờ không?
                </p>
              </div>

              {/* Compact Room Summary Card */}
              <div className="mt-4 flex items-center gap-3.5 rounded-xl border border-border bg-muted/40 p-3">
                <div className="relative size-20 shrink-0 overflow-hidden rounded-lg bg-muted">
                  <ImageWithFallback
                    src={
                      pendingRoom.image ||
                      pendingRoom.imageUrl ||
                      "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400&auto=format&fit=crop&q=80"
                    }
                    alt={pendingRoom.title}
                    className="size-full object-cover"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {(pendingRoom.typeLabel || pendingRoom.type) && (
                      <span className="rounded bg-mint px-1.5 py-0.5 text-[10px] font-semibold text-emerald-brand">
                        {pendingRoom.typeLabel || pendingRoom.type}
                      </span>
                    )}
                    {pendingRoom.isVerified && (
                      <span className="inline-flex items-center gap-1 rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700">
                        <ShieldCheck className="size-3" /> Đã xác minh CCCD
                      </span>
                    )}
                  </div>
                  <h3 className="mt-1 text-sm font-semibold text-foreground line-clamp-1">
                    {pendingRoom.title}
                  </h3>
                  <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground truncate">
                    <MapPin className="size-3 text-primary shrink-0" />
                    <span className="truncate">{pendingRoom.district}</span>
                    {pendingRoom.area ? <span>• {pendingRoom.area} m²</span> : null}
                  </p>
                  <p className="mt-1 text-sm font-bold text-primary tabular-nums">
                    {formatVND(pendingRoom.price)}
                    <span className="text-[11px] font-normal text-muted-foreground">/tháng</span>
                  </p>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-2.5">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleDismissPendingRoom}
                  className="w-full rounded-xl h-10 text-xs font-semibold cursor-pointer"
                >
                  Tiếp tục khám phá
                </Button>
                <Button
                  type="button"
                  onClick={handleConfirmPendingRoom}
                  className="w-full rounded-xl h-10 text-xs font-semibold gap-1.5 cursor-pointer"
                >
                  Xem chi tiết phòng
                  <ArrowRight className="size-3.5" />
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {showCriteriaAlertModal && activeFilterBadges.length > 0 && (
          <motion.div
            key="criteria-alert-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 backdrop-blur-[3px] p-4"
            onClick={() => setShowCriteriaAlertModal(false)}
          >
            <motion.div
              key="criteria-alert-dialog"
              initial={{ opacity: 0, scale: 0.92, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-[460px] rounded-2xl bg-card border border-border p-6 shadow-2xl"
              role="dialog"
              aria-modal="true"
              aria-labelledby="criteria-alert-title"
            >
              <button
                type="button"
                onClick={() => setShowCriteriaAlertModal(false)}
                aria-label="Đóng thông báo"
                className="absolute right-4 top-4 grid size-8 place-items-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
              >
                <X className="size-4" />
              </button>

              <div className="flex items-start gap-3.5 pr-6">
                <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                  <BellRing className="size-5" />
                </div>
                <div>
                  <h2
                    id="criteria-alert-title"
                    className="text-base sm:text-lg font-bold text-foreground leading-snug"
                  >
                    Chưa có phòng phù hợp với nhu cầu hiện tại
                  </h2>
                  <p className="mt-1 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                    Hiện chưa có phòng trọ nào khớp với bộ lọc bạn đang chọn. Bạn có muốn hệ thống{" "}
                    <strong className="font-semibold text-foreground">
                      gửi thông báo ngay khi có chủ trọ đăng phòng phù hợp
                    </strong>{" "}
                    không?
                  </p>
                </div>
              </div>

              <div className="mt-4 rounded-xl border border-border bg-muted/35 p-3.5">
                <p className="text-[11px] font-semibold text-muted-foreground mb-2">
                  Tiêu chí tìm phòng của bạn:
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {activeFilterBadges.map((badge) => (
                    <span
                      key={badge}
                      className="inline-flex items-center rounded-full bg-mint px-2.5 py-0.5 text-xs font-semibold text-emerald-900 border border-primary/20"
                    >
                      {badge}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-5 flex flex-col gap-2">
                <Button
                  type="button"
                  disabled={isSubscribingAlert}
                  onClick={() => handleSubscribeRoomAlert(true)}
                  className="w-full rounded-xl h-10 text-xs sm:text-sm font-semibold gap-2 bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer"
                >
                  <BellRing className="size-4" />
                  <span>
                    {isSubscribingAlert
                      ? "Đang lưu tiêu chí..."
                      : "Bật thông báo & Xem tạm các phòng khác"}
                  </span>
                </Button>

                <div className="grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={isSubscribingAlert}
                    onClick={() => {
                      handleSubscribeRoomAlert(false);
                      setShowCriteriaAlertModal(false);
                    }}
                    className="w-full rounded-xl h-9 text-xs font-semibold cursor-pointer"
                  >
                    Chỉ bật thông báo
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleResetFilters}
                    className="w-full rounded-xl h-9 text-xs font-semibold cursor-pointer"
                  >
                    Xem tất cả phòng
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
