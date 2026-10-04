import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import {
  Heart,
  MapPin,
  Maximize2,
  Map as MapIcon,
  Activity,
  ShieldCheck,
  Flame,
  Users,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ImageWithFallback } from "@/components/shared/ImageWithFallback";
import { SwipeStage } from "@/components/shared/SwipeStage";
import { FilterSidebar, type RoomFilterState } from "@/features/rooms/components/FilterSidebar";
import { MatchBadge } from "@/components/shared/primitives-compat";
import { formatVND, cn } from "@/lib/utils";
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
  KTX_SLEEPBOX: "KTX / Sleepbox",
  SLEEPBOX: "Sleepbox",
  KY_TUC_XA: "Ký túc xá",
};

function BigRoomCard({
  room,
  saved,
  onToggleSave,
}: {
  room: any;
  saved?: boolean;
  onToggleSave?: (room: any) => void;
}) {
  const rawImages = room.images || [];
  const displayImages: string[] = rawImages
    .map((img: any) => (typeof img === "string" ? img : img?.imageUrl))
    .filter(Boolean);

  const images = displayImages.length > 0
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
  const maxOccupants = room.maxOccupants ?? 0;
  const isVerified = Boolean(room.isVerified);
  const isBoosted = Boolean(room.isBoosted);
  const matchVal = typeof room.match === "number" && room.match > 0 ? room.match : null;

  return (
    <div className="group flex h-full flex-col overflow-hidden rounded-3xl bg-card shadow-xl ring-1 ring-border hover-lift select-none">
      <div className="relative grid grid-cols-3 grid-rows-2 gap-1 overflow-hidden shrink-0" style={{ height: 230 }}>
        <ImageWithFallback
          src={images[0]}
          alt={titleVal}
          className="col-span-2 row-span-2 size-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.025]"
        />
        <ImageWithFallback
          src={images[1] || images[0]}
          alt=""
          className="size-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.025]"
        />
        <ImageWithFallback
          src={images[2] || images[0]}
          alt=""
          className="size-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.025]"
        />
        <button
          type="button"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onToggleSave?.(room);
          }}
          className={cn(
            "absolute right-3 top-3 grid size-10 place-items-center rounded-full shadow-md backdrop-blur transition-all duration-200 press-active hover:scale-110 active:scale-95 z-30 cursor-pointer",
            saved
              ? "bg-rose-50 text-rose-600 ring-2 ring-rose-500/40"
              : "bg-white/95 text-muted-foreground hover:bg-white hover:text-rose-500"
          )}
          title={saved ? "Bỏ lưu phòng" : "Lưu phòng vào danh sách yêu thích"}
        >
          <Heart className={cn("size-5 transition-colors", saved ? "fill-rose-500 text-rose-500" : "")} />
        </button>

        {saved && (
          <span className="absolute left-3 bottom-3 inline-flex items-center gap-1 rounded-full bg-rose-600 text-white px-2.5 py-1 text-[11px] font-bold shadow-md backdrop-blur animate-fade-in">
            ❤️ Đã lưu yêu thích
          </span>
        )}

        {isBoosted && !saved && (
          <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-amber-500/90 text-white px-2.5 py-1 text-[11px] font-bold shadow-md backdrop-blur">
            <Flame className="size-3" /> Nổi bật
          </span>
        )}

        {matchVal != null && <MatchBadge value={matchVal} className="absolute bottom-3 right-3" />}
      </div>

      <div className="flex flex-1 flex-col justify-between p-4 sm:p-5 min-w-0">
        <div className="space-y-1.5 sm:space-y-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] sm:text-xs font-semibold px-2 py-0.5 rounded bg-mint text-emerald-brand uppercase tracking-wider">
              {typeLabel}
            </span>
            {isVerified && (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                <ShieldCheck className="size-3" /> Đã xác thực
              </span>
            )}
          </div>

          <div>
            <h3 className="text-base sm:text-lg font-semibold transition-colors duration-200 group-hover:text-primary line-clamp-2 leading-snug">
              {titleVal}
            </h3>
            <p className="mt-0.5 inline-flex items-center gap-1 text-xs sm:text-sm text-muted-foreground">
              <MapPin className="size-3.5 text-primary shrink-0" />
              <span className="truncate">{addressStreet ? `${addressStreet}, ` : ""}{districtVal}</span>
            </p>
          </div>

          <p className="text-primary">
            <span className="text-xl sm:text-2xl font-bold">{formatVND(priceVal)}</span>
            <span className="text-xs text-muted-foreground">/tháng</span>
          </p>

          <div className="flex items-center gap-4 text-xs sm:text-sm text-muted-foreground">
            {areaVal > 0 && (
              <span className="inline-flex items-center gap-1">
                <Maximize2 className="size-4" />
                {areaVal} m²
              </span>
            )}
            {floorVal != null && floorVal > 0 && (
              <span className="inline-flex items-center gap-1">
                Tầng {floorVal}
              </span>
            )}
            {maxOccupants > 0 && (
              <span className="inline-flex items-center gap-1">
                <Users className="size-3.5" />
                Tối đa {maxOccupants} người
              </span>
            )}
          </div>

          {/* Amenities tags */}
          {Array.isArray(room?.amenities) && room.amenities.length > 0 && (
            <div className="flex flex-wrap gap-1 pt-1">
              {room.amenities.slice(0, 4).map((a: string) => (
                <span key={a} className="rounded-md bg-mint/90 px-2 py-0.5 text-[11px] font-medium text-emerald-800">
                  {a}
                </span>
              ))}
              {room.amenities.length > 4 && (
                <span className="text-[11px] text-muted-foreground self-center">
                  +{room.amenities.length - 4}
                </span>
              )}
            </div>
          )}
        </div>

        {depositVal > 0 && (
          <div className="mt-2.5 pt-2 border-t border-border/50 text-xs text-muted-foreground flex items-center justify-between">
            <span>Tiền cọc:</span>
            <span className="font-semibold text-foreground">{formatVND(depositVal)}</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Discover() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { loaded, swipesLeft, maxSwipes, decrementSwipes, openPricing, tier } = useMonetization();

  // Pre-calculate initial filters from logged-in user profile to prevent un-filtered first call in F12
  const initialPrefFilters = {
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

  // Track rooms swiped in this session so they aren't repeatedly presented
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(() => {
    try {
      const cached = sessionStorage.getItem("ptx_dismissed_room_ids");
      return cached ? new Set(JSON.parse(cached)) : new Set();
    } catch {
      return new Set();
    }
  });
  const [initialFilters, setInitialFilters] = useState<RoomFilterState | undefined>(
    user && (user.preferredDistricts?.length || user.preferredRoomType || user.budgetMin)
      ? {
          district: user.preferredDistricts?.[0],
          roomType: user.preferredRoomType,
          minPrice: user.budgetMin,
          maxPrice: user.budgetMax,
        }
      : undefined
  );

  // Load user's saved onboarding criteria to pre-fill search filters
  useEffect(() => {
    if (!user) return;
    async function loadTenantCriteria() {
      try {
        const profile = await accountApi.getProfile();
        if (profile) {
          const prefDistrict = profile.preferredDistricts && profile.preferredDistricts.length > 0
            ? profile.preferredDistricts[0]
            : undefined;
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
  }, [user]);

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

  const handleApplyFilters = (newFilters: RoomFilterState) => {
    setSelectedAmenitiesFilter(newFilters.amenities || []);
    updateFilters({
      district: newFilters.district,
      roomType: newFilters.roomType,
      minPrice: newFilters.minPrice,
      maxPrice: newFilters.maxPrice,
      keyword: newFilters.keyword,
      excludeSwiped: true,
    }, true);
    toast.info("Đã áp dụng bộ lọc");
  };

  const handleResetFilters = () => {
    setSelectedAmenitiesFilter([]);
    setSidebarResetKey((prev) => prev + 1);
    setInitialFilters(undefined);
    setDismissedIds(new Set());
    sessionStorage.removeItem("ptx_dismissed_room_ids");
    updateFilters({ excludeSwiped: true }, true);
    toast.info("Đã đặt lại bộ lọc");
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
      toast.success("Đã lưu phòng vào danh sách yêu thích ❤️", { description: r.title });
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
      setDismissedIds((prev) => {
        const next = new Set(prev).add(idStr);
        sessionStorage.setItem("ptx_dismissed_room_ids", JSON.stringify(Array.from(next)));
        return next;
      });
      toast.success("Đã thích & lưu phòng ❤️", { description: r.title });
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
      setDismissedIds((prev) => {
        const next = new Set(prev).add(idStr);
        sessionStorage.setItem("ptx_dismissed_room_ids", JSON.stringify(Array.from(next)));
        return next;
      });
      roomsApi.swipeRoom(r.id, "PASS").catch(() => {});
    }
  };

  const handleResetSession = async () => {
    setDismissedIds(new Set());
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
    if (dismissedIds.has(String(r.id))) return false;
    if (selectedAmenitiesFilter.length > 0) {
      const roomAmenities: string[] = Array.isArray(r.amenities) ? r.amenities : [];
      const hasAll = selectedAmenitiesFilter.every((a) =>
        roomAmenities.some((item) => item.toLowerCase().trim() === a.toLowerCase().trim())
      );
      if (!hasAll) return false;
    }
    return true;
  });

  return (
    <div className="mx-auto w-full max-w-[1440px] px-6 pt-2 md:pt-3 pb-6">
      <div className="mb-2 md:mb-3 flex items-end justify-between flex-wrap gap-2 animate-fade-in">
        <div>
          <h1 className="brand text-3xl text-foreground">Khám phá phòng trọ</h1>
          <p className="text-sm text-muted-foreground">
            Vuốt phải để lưu, vuốt trái để bỏ qua theo tiêu chí của bạn
          </p>
        </div>
        <div className="flex gap-2">
          <Button
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
          <div className="flex h-[450px] flex-col items-center justify-center rounded-3xl bg-white border border-slate-200 p-8 text-center shadow-sm">
            <div className="relative mb-5 flex size-20 items-center justify-center rounded-full bg-red-50 text-red-500">
              <span className="text-3xl text-red-500">🔋</span>
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
        ) : isEmpty ? (
          <div className="flex h-[450px] flex-col items-center justify-center rounded-3xl bg-card border border-border p-8 text-center shadow-xs">
            <div className="mx-auto grid size-16 place-items-center rounded-full bg-mint text-primary mb-4">
              <MapIcon className="size-8" />
            </div>
            <h3 className="text-lg font-bold text-foreground">Không tìm thấy phòng phù hợp</h3>
            <p className="mt-1 text-sm text-muted-foreground max-w-sm">
              Không có phòng trọ nào khớp với tiêu chí tìm kiếm hiện tại. Hãy thử mở rộng phạm vi giá hoặc chọn quận khác.
            </p>
            <Button className="mt-5 cursor-pointer" onClick={handleResetFilters}>
              Đặt lại bộ lọc
            </Button>
          </div>
        ) : (
          <div className="flex flex-col -mt-4 md:-mt-8">
            {loaded && swipesLeft > 0 && (
              <div className="mb-2 md:mb-3 flex justify-center">
                <span className="inline-flex items-center gap-2 text-xs text-slate-600 bg-slate-50 px-4 py-1.5 rounded-full border border-slate-200/60 shadow-sm animate-fade-in">
                  <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  Bạn còn <strong className="text-slate-900 font-extrabold">{swipesLeft}/{maxSwipes}</strong> lượt vuốt hôm nay.{" "}
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
                    {dismissedIds.size > 0
                      ? "Bạn đã xem hết danh sách phòng trong phiên này. Bạn có thể xem lại từ đầu hoặc mở rộng bộ lọc."
                      : "Thử điều chỉnh hoặc mở rộng bộ lọc để xem thêm phòng"}
                  </p>
                  <div className="mt-4 flex items-center justify-center gap-2">
                    {dismissedIds.size > 0 && (
                      <Button variant="outline" className="cursor-pointer gap-1.5" onClick={handleResetSession}>
                        <RefreshCw className="size-4" /> Xem lại từ đầu
                      </Button>
                    )}
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
        <div className="hidden space-y-4 lg:block">
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
    </div>
  );
}
