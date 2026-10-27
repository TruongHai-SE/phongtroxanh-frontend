import { Link, useNavigate, NavLink, useLocation } from "react-router";
import { useState, useEffect, useMemo, useRef } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  Search,
  MapPin,
  ShieldCheck,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  CheckCircle2,
  Users,
  Building2,
  Scale,
  Heart,
  Maximize2,
  CalendarCheck,
  Repeat,
  AlertTriangle,
  Star,
  SlidersHorizontal,
  Layers,
  Wallet,
  Lock,
  FileCheck2,
  RotateCcw,
  CircleHelp,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Footer } from "@/components/layouts/MainLayout";
import { ImageWithFallback } from "@/components/shared/ImageWithFallback";
import { useAuth } from "@/app/context/AuthContext";
import { AuthPromptModal } from "@/features/auth/components/AuthPromptModal";
import { PageTransition } from "@/components/layouts/PageTransition";
import { useRooms } from "@/features/rooms/hooks/useRooms";
import { roomImages, districts, normalizeAmenitiesList } from "@/lib/constants";
import { api } from "@/lib/api";

interface LandingStats {
  availableRoomsCount: number;
  matchedPairsCount: number;
  activeUsersCount: number;
  positiveReviewRate: number;
}

interface SystemFeedbackItem {
  id: string;
  userId?: string;
  userName: string;
  userRole: "TENANT" | "LANDLORD" | "ADMIN" | string;
  rating: number;
  category?: string;
  comment: string;
  createdAt?: string;
}

const ROOM_TYPE_LABELS: Record<string, string> = {
  PHONG_KHEP_KIN: "Phòng khép kín",
  PHONG_TRO: "Phòng trọ",
  STUDIO: "Studio",
  CAN_HO_MINI: "Căn hộ mini",
  CHUNG_CU_MINI: "Căn hộ mini",
  KTX_SLEEPBOX: "Ở ghép / Sleepbox",
  SLEEPBOX: "Sleepbox",
  KY_TUC_XA: "Ký túc xá",
  O_GHEP: "Ở ghép",
};

const PRICE_OPTIONS = [
  { value: "ALL", label: "Tất cả mức giá", minPrice: undefined, maxPrice: undefined },
  { value: "UNDER_30", label: "Dưới 3,0 triệu/tháng", minPrice: undefined, maxPrice: 3_000_000 },
  { value: "UNDER_35", label: "Dưới 3,5 triệu/tháng", minPrice: undefined, maxPrice: 3_500_000 },
  { value: "FROM_35_TO_45", label: "Từ 3,5 – 4,5 triệu/tháng", minPrice: 3_500_000, maxPrice: 4_500_000 },
  { value: "OVER_45", label: "Trên 4,5 triệu/tháng", minPrice: 4_500_001, maxPrice: undefined },
] as const;

/**
 * Real Backend roomType filters (100% mapped to RoomRepository SQL parameters).
 * Compact 1-row layout alongside "+8 bộ lọc khác" unlock pill.
 */
const QUICK_FILTERS = [
  { id: "all", label: "Tất cả", roomType: undefined, icon: Layers },
  { id: "khep_kin", label: "Phòng khép kín", roomType: "Phòng khép kín", icon: Building2 },
  { id: "studio", label: "Studio", roomType: "Studio", icon: Building2 },
  { id: "can_ho", label: "Căn hộ mini", roomType: "Căn hộ mini", icon: Building2 },
] as const;

type QuickFilterId = (typeof QUICK_FILTERS)[number]["id"];

function matchesQuickRoomType(room: any, targetLabel?: string): boolean {
  if (!targetLabel) return true;
  const raw = String(room?.roomType || room?.type || "").trim();
  const mapped = ROOM_TYPE_LABELS[raw] || raw;
  if (targetLabel === "Phòng khép kín") {
    return (
      mapped === "Phòng khép kín" ||
      mapped === "Phòng trọ" ||
      raw === "PHONG_KHEP_KIN" ||
      raw === "PHONG_TRO"
    );
  }
  if (targetLabel === "Studio") {
    return mapped === "Studio" || raw === "STUDIO";
  }
  if (targetLabel === "Căn hộ mini") {
    return (
      mapped === "Căn hộ mini" ||
      raw === "CHUNG_CU_MINI" ||
      raw === "CAN_HO_MINI"
    );
  }
  return mapped.toLowerCase() === targetLabel.toLowerCase();
}

function extractRoomImages(room: any, fallbackSeed = 0): string[] {
  const raw = Array.isArray(room?.images) ? room.images : [];
  const extracted = raw
    .map((img: any) => (typeof img === "string" ? img : img?.imageUrl || img?.url))
    .filter((u: any): u is string => typeof u === "string" && u.trim().length > 0);

  if (
    room?.primaryImageUrl &&
    typeof room.primaryImageUrl === "string" &&
    !extracted.includes(room.primaryImageUrl)
  ) {
    extracted.unshift(room.primaryImageUrl);
  }

  if (extracted.length === 0) {
    return [
      roomImages[fallbackSeed % roomImages.length],
      roomImages[(fallbackSeed + 1) % roomImages.length],
      roomImages[(fallbackSeed + 2) % roomImages.length],
    ];
  }
  return extracted;
}

function formatPriceVND(price: number | string | undefined): string {
  const num = Number(price || 0);
  if (!num || Number.isNaN(num)) return "Thỏa thuận";
  return new Intl.NumberFormat("vi-VN").format(num) + " đ/tháng";
}

function formatShortVND(price: number | string | undefined): string {
  const num = Number(price || 0);
  if (!num || Number.isNaN(num)) return "Thỏa thuận";
  if (num >= 1_000_000) {
    const millions = num / 1_000_000;
    return `${Number.isInteger(millions) ? millions : millions.toFixed(1).replace(".", ",")} triệu/tháng`;
  }
  return new Intl.NumberFormat("vi-VN").format(num) + " đ/tháng";
}

const EASE_OUT_CURVE: [number, number, number, number] = [0.23, 1, 0.32, 1];
const HERO_ROTATION_MS = 4000;
const HERO_MANUAL_HOLD_MS = 25000;

/* ── Custom 60fps Smooth Scroll Engine (Bypasses Windows OS reduced-motion instant jump) ── */
let activeScrollRafId: number | null = null;
let cleanupScrollInterrupt: (() => void) | null = null;

function cancelActiveSmoothScroll() {
  if (activeScrollRafId !== null) {
    window.cancelAnimationFrame(activeScrollRafId);
    activeScrollRafId = null;
  }
  if (cleanupScrollInterrupt) {
    cleanupScrollInterrupt();
    cleanupScrollInterrupt = null;
  }
}

function easeInOutCubicQuart(t: number): number {
  return t < 0.5
    ? 4 * t * t * t
    : 1 - Math.pow(-2 * t + 2, 4) / 2;
}

function smoothScrollToY(targetY: number, customDuration?: number) {
  cancelActiveSmoothScroll();

  const startY = window.scrollY || window.pageYOffset || 0;
  const maxScrollY = Math.max(
    0,
    document.documentElement.scrollHeight - window.innerHeight
  );
  const clampedTargetY = Math.max(0, Math.min(targetY, maxScrollY));
  const deltaY = clampedTargetY - startY;

  if (Math.abs(deltaY) < 2) {
    window.scrollTo(0, clampedTargetY);
    return;
  }

  // Dynamic duration scaled by distance (480ms for short hops -> 820ms for full-page glides)
  const duration =
    customDuration ??
    Math.min(820, Math.max(480, Math.round(Math.abs(deltaY) * 0.42)));
  const startTime = performance.now();

  const onUserInterrupt = () => {
    cancelActiveSmoothScroll();
  };

  window.addEventListener("wheel", onUserInterrupt, { passive: true, once: true });
  window.addEventListener("touchstart", onUserInterrupt, { passive: true, once: true });
  cleanupScrollInterrupt = () => {
    window.removeEventListener("wheel", onUserInterrupt);
    window.removeEventListener("touchstart", onUserInterrupt);
  };

  const step = (now: number) => {
    const elapsed = now - startTime;
    const progress = Math.min(1, Math.max(0, elapsed / duration));
    const eased = easeInOutCubicQuart(progress);

    window.scrollTo(0, Math.round(startY + deltaY * eased));

    if (progress < 1) {
      activeScrollRafId = window.requestAnimationFrame(step);
    } else {
      cancelActiveSmoothScroll();
    }
  };

  activeScrollRafId = window.requestAnimationFrame(step);
}

function smoothScrollToElement(elementOrId: Element | string | null, offsetPx = 72) {
  const el =
    typeof elementOrId === "string"
      ? document.getElementById(elementOrId.replace(/^#/, "")) ||
        document.querySelector(elementOrId)
      : elementOrId;
  if (!el) return;
  const rect = el.getBoundingClientRect();
  const targetY = rect.top + (window.scrollY || window.pageYOffset || 0) - offsetPx;
  smoothScrollToY(targetY);
}

export default function Landing() {
  const navigate = useNavigate();
  const shouldReduceMotion = false;
  const { user, role } = useAuth();

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [stats, setStats] = useState<LandingStats | null>(null);
  const [feedbacks, setFeedbacks] = useState<SystemFeedbackItem[]>([]);

  // Hero & Featured Rooms Shared Filter State (District + Price + RoomType + Page + Direction)
  const [selectedDistrict, setSelectedDistrict] = useState<string>("");
  const [selectedPriceVal, setSelectedPriceVal] = useState<string>("ALL");
  const [activeFilter, setActiveFilter] = useState<QuickFilterId>("all");
  const [featuredPage, setFeaturedPage] = useState(0);
  const [pageDirection, setPageDirection] = useState<1 | -1>(1);
  const [transitionMode, setTransitionMode] = useState<"page" | "filter">("page");

  const currentQuickFilter = useMemo(
    () => QUICK_FILTERS.find((f) => f.id === activeFilter) || QUICK_FILTERS[0],
    [activeFilter]
  );

  const currentPriceOption = useMemo(
    () => PRICE_OPTIONS.find((p) => p.value === selectedPriceVal) || PRICE_OPTIONS[0],
    [selectedPriceVal]
  );

  // Fetch all open rooms from Backend API GET /api/v1/rooms once so <AnimatePresence> never unmounts
  const { rooms: showcaseRooms, isLoading } = useRooms({ size: 50 });
  const isInitialLoading = isLoading && showcaseRooms.length === 0;

  // Reset pagination smoothly when filter changes (filtering is instant in-memory on showcaseRooms)
  useEffect(() => {
    setTransitionMode("filter");
    setPageDirection(1);
    setFeaturedPage(0);
  }, [selectedDistrict, currentPriceOption, currentQuickFilter]);

  // Count rooms per district from Backend response
  const districtCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const r of showcaseRooms) {
      const d = (r.district || "").trim();
      if (d) counts[d] = (counts[d] || 0) + 1;
    }
    return counts;
  }, [showcaseRooms]);

  // Instant 0ms filtering on Backend dataset so filter/reset transitions animate smoothly like page turns
  const filteredRooms = useMemo(() => {
    return showcaseRooms.filter((r: any) => {
      if (selectedDistrict) {
        const roomDist = String(r.district || "").trim().toLowerCase();
        if (roomDist !== selectedDistrict.trim().toLowerCase()) return false;
      }
      const price = Number(r.price || 0);
      if (currentPriceOption.minPrice != null && price < currentPriceOption.minPrice) {
        return false;
      }
      if (currentPriceOption.maxPrice != null && price > currentPriceOption.maxPrice) {
        return false;
      }
      if (!matchesQuickRoomType(r, currentQuickFilter.roomType)) {
        return false;
      }
      return true;
    });
  }, [showcaseRooms, selectedDistrict, currentPriceOption, currentQuickFilter]);

  // Hero Live Multi-Room & Multi-Photo Showcase state + Fair Shuffle Seed per page visit
  const [heroRoomIdx, setHeroRoomIdx] = useState(0);
  const [heroDirection, setHeroDirection] = useState<1 | -1>(1);
  const [heroPhotoIdx, setHeroPhotoIdx] = useState(0);
  const [isHeroHovered, setIsHeroHovered] = useState(false);
  const [isManualHold, setIsManualHold] = useState(false);
  const [manualInteractionTick, setManualInteractionTick] = useState(0);
  const [mountShuffleSeed] = useState(() => Math.random());

  const isHeroPaused = isHeroHovered || isManualHold;

  const markManualHeroInteraction = () => {
    setIsManualHold(true);
    setManualInteractionTick((t) => t + 1);
  };

  // Hold auto-rotation for 10s after any manual click (<, >, photo dots, or thumbnail)
  // so the room never jumps away even if the user moves their cursor off the photo to view it unobstructed
  useEffect(() => {
    if (!isManualHold) return;
    const holdTimer = window.setTimeout(() => {
      setIsManualHold(false);
    }, HERO_MANUAL_HOLD_MS);
    return () => window.clearTimeout(holdTimer);
  }, [isManualHold, manualInteractionTick]);

  // Perspective Switcher (Tenant vs Landlord) & Policy Tabs
  const [activeRoleView, setActiveRoleView] = useState<"tenant" | "landlord">("tenant");
  const [activePolicyTab, setActivePolicyTab] = useState<"trustscore" | "workflow" | "strikes">("trustscore");
  const [openFaqIdx, setOpenFaqIdx] = useState<number | null>(0);

  // Fetch real platform stats & real user system feedbacks
  useEffect(() => {
    api
      .get<LandingStats>("/misc/landing-stats")
      .then((data) => setStats(data))
      .catch(() => {});

    api
      .get<any>("/reviews/system-feedbacks", { page: 0, limit: 6 })
      .then((res) => {
        const list = Array.isArray(res) ? res : res?.content || [];
        setFeedbacks(
          list.filter(
            (item: any) =>
              item &&
              typeof item.comment === "string" &&
              item.comment.trim().length > 0 &&
              Number(item.rating || 0) >= 4
          )
        );
      })
      .catch(() => {});
  }, []);

  // Fair rotation of all Boosted rooms on Hero Showcase (every boosted landlord gets equal exposure, no hard 4-room cap)
  const heroRooms = useMemo(() => {
    const source = showcaseRooms.length > 0 ? showcaseRooms : filteredRooms;
    if (source.length > 0) {
      const fairShuffle = <T,>(arr: T[], seedOffset: number): T[] => {
        const copy = [...arr];
        let s = Math.floor((mountShuffleSeed + seedOffset) * 2147483647) || 1;
        for (let i = copy.length - 1; i > 0; i--) {
          s = (s * 48271) % 2147483647;
          const j = s % (i + 1);
          [copy[i], copy[j]] = [copy[j], copy[i]];
        }
        return copy;
      };

      const boostedPool = fairShuffle(
        source.filter((r: any) => Boolean(r.isBoosted)),
        0.13
      );
      const regularPool = fairShuffle(
        source.filter((r: any) => !Boolean(r.isBoosted)),
        0.57
      );

      const picked: any[] = [];
      const seenDistricts = new Set<string>();

      // 1. Pick distinct districts from boosted rooms first
      for (const r of boostedPool) {
        const d = r.district || "TP. HCM";
        if (!seenDistricts.has(d)) {
          seenDistricts.add(d);
          picked.push(r);
        }
      }
      // 2. Include all remaining boosted rooms so no boosted landlord is left out
      for (const r of boostedPool) {
        if (!picked.some((p) => p.id === r.id)) {
          picked.push(r);
        }
      }
      // 3. Ensure at least 4 rooms on Hero by filling from verified/regular pool if needed
      for (const r of regularPool) {
        if (picked.length >= 8) break;
        const d = r.district || "TP. HCM";
        if (!seenDistricts.has(d) || picked.length < 4) {
          seenDistricts.add(d);
          if (!picked.some((p) => p.id === r.id)) picked.push(r);
        }
      }

      return picked.map((r: any, idx: number) => {
        const imgs = extractRoomImages(r, idx);
        const rawType = r.roomType || r.type || "PHONG_TRO";
        return {
          id: r.id,
          title: r.title || "Phòng trọ",
          district: r.district || "TP. Hồ Chí Minh",
          address: r.addressStreet
            ? `${r.addressStreet}, ${r.district || "TP. HCM"}`
            : r.district || "TP. Hồ Chí Minh",
          price: Number(r.price || 0),
          area: Number(r.areaSqm ?? r.area ?? 22),
          maxOccupants: Number(r.maxOccupants ?? 2),
          typeLabel: ROOM_TYPE_LABELS[rawType] || rawType || "Phòng khép kín",
          amenities: normalizeAmenitiesList(r.amenities).slice(0, 2),
          images: imgs,
          isVerified: Boolean(
            r.isVerified ?? r.landlord?.verified ?? r.landlord?.isVerified ?? false
          ),
          isBoosted: Boolean(r.isBoosted),
        };
      });
    }
    return [];
  }, [showcaseRooms, filteredRooms, mountShuffleSeed]);

  const activeHeroIdx = heroRooms.length > 0 ? heroRoomIdx % heroRooms.length : 0;
  const activeHeroRoom = heroRooms[activeHeroIdx] || null;
  const activeHeroImages = activeHeroRoom?.images || [roomImages[0]];
  const currentHeroImage =
    activeHeroImages[heroPhotoIdx % activeHeroImages.length] || activeHeroImages[0];

  // Windowed 4-column thumbnail slice so all Hero rooms are reachable without horizontal scroll
  const heroThumbnailEntries = useMemo(() => {
    if (heroRooms.length <= 4) {
      return heroRooms.map((item, idx) => ({ item, idx }));
    }
    const pageStart = Math.floor(activeHeroIdx / 4) * 4;
    const entries: Array<{ item: (typeof heroRooms)[number]; idx: number }> = [];
    for (let i = 0; i < 4; i++) {
      const targetIdx = (pageStart + i) % heroRooms.length;
      entries.push({ item: heroRooms[targetIdx], idx: targetIdx });
    }
    return entries;
  }, [heroRooms, activeHeroIdx]);

  // Auto-cycle Hero rooms every 3.6s so visitors immediately see live room variety across districts
  useEffect(() => {
    if (isHeroPaused || heroRooms.length <= 1) return;
    const timer = window.setInterval(() => {
      setHeroDirection(1);
      setHeroPhotoIdx(0);
      setHeroRoomIdx((prevRoom) => (prevRoom + 1) % heroRooms.length);
    }, HERO_ROTATION_MS);
    return () => window.clearInterval(timer);
  }, [isHeroPaused, heroRooms.length, activeHeroIdx]);

  // Show 6 rooms per page in the Featured section so users can see multiple rooms per district
  const PAGE_SIZE = 6;
  const totalFeaturedPages = Math.max(1, Math.ceil(filteredRooms.length / PAGE_SIZE));
  const currentSafePage = featuredPage % totalFeaturedPages;
  const visibleRooms = useMemo(() => {
    const start = currentSafePage * PAGE_SIZE;
    return filteredRooms.slice(start, start + PAGE_SIZE);
  }, [filteredRooms, currentSafePage]);

  const goToFeaturedPage = (nextPage: number, scrollGrid = false) => {
    const normalized = ((nextPage % totalFeaturedPages) + totalFeaturedPages) % totalFeaturedPages;
    if (normalized === currentSafePage) return;
    setTransitionMode("page");
    setPageDirection(normalized > currentSafePage ? 1 : -1);
    setFeaturedPage(normalized);
    if (scrollGrid) {
      smoothScrollToElement("featured-rooms-grid", 92);
    }
  };

  const handleRoomClick = (roomOrItem: any) => {
    const roomId = typeof roomOrItem === "string" ? roomOrItem : String(roomOrItem?.id || "");
    if (!user) {
      if (roomId && !roomId.startsWith("preview-")) {
        const sourceRoom =
          typeof roomOrItem === "object" && roomOrItem !== null
            ? roomOrItem
            : showcaseRooms.find((r: any) => String(r.id) === roomId);
        if (sourceRoom) {
          const imgs =
            Array.isArray(sourceRoom.images) &&
            sourceRoom.images.length > 0 &&
            typeof sourceRoom.images[0] === "string"
              ? sourceRoom.images
              : extractRoomImages(sourceRoom, 0);
          const rawType = sourceRoom.roomType || sourceRoom.type || "PHONG_TRO";
          const pendingPayload = {
            id: roomId,
            title: sourceRoom.title || "Phòng trọ",
            district: sourceRoom.district || "TP. Hồ Chí Minh",
            address:
              sourceRoom.address ||
              (sourceRoom.addressStreet
                ? `${sourceRoom.addressStreet}, ${sourceRoom.district || "TP. HCM"}`
                : sourceRoom.district || "TP. Hồ Chí Minh"),
            price: Number(sourceRoom.price || 0),
            area: Number(sourceRoom.areaSqm ?? sourceRoom.area ?? 22),
            maxOccupants: Number(sourceRoom.maxOccupants ?? 2),
            typeLabel:
              sourceRoom.typeLabel ||
              ROOM_TYPE_LABELS[rawType] ||
              rawType ||
              "Phòng khép kín",
            amenities: Array.isArray(sourceRoom.amenities)
              ? sourceRoom.amenities.slice(0, 2)
              : [],
            image: imgs[0] || roomImages[0],
            isVerified: Boolean(
              sourceRoom.isVerified ??
                sourceRoom.landlord?.verified ??
                sourceRoom.landlord?.isVerified ??
                false
            ),
            savedAt: Date.now(),
          };
          try {
            sessionStorage.setItem("ptx_pending_room", JSON.stringify(pendingPayload));
          } catch {
            // ignore storage errors
          }
        }
      }
      setIsAuthModalOpen(true);
      return;
    }
    if (roomId.startsWith("preview-")) {
      navigate("/discover");
      return;
    }
    navigate(`/rooms/${roomId}`);
  };

  const handleUnlockFullSearch = () => {
    if (!user) {
      setIsAuthModalOpen(true);
      return;
    }
    navigate("/discover");
  };

  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    smoothScrollToElement("featured-rooms", 72);
  };

  const getStartLink = () => {
    if (!user) return "/login?mode=register";
    if (role !== "admin" && user.isOnboarded === false) {
      return role === "landlord" ? "/onboarding/landlord" : "/onboarding/role";
    }
    if (role === "landlord") return "/landlord";
    if (role === "admin") return "/admin";
    return "/discover";
  };

  const hasActiveFilter =
    selectedDistrict !== "" || selectedPriceVal !== "ALL" || activeFilter !== "all";

  return (
    <PageTransition>
      <main className="relative min-h-[100dvh] overflow-x-hidden bg-[#f8faf9] text-slate-900 selection:bg-emerald-500/15 selection:text-emerald-950">
        {/* ===== UNIFORM ZERO-LAG AMBIENT BACKDROP (SYNCED WITH LOGIN AESTHETIC) ===== */}
        <LandingAmbientBackdrop />

        <div className="relative z-10">
          {/* ===== STICKY NAVBAR ===== */}
          <LandingNavbar user={user} role={role} />

          {/* ===== HERO SECTION (UNIFORM SURFACE, SYSTEM SELECTS, 1-ROW FILTERS) ===== */}
          <section className="relative overflow-hidden pt-24 pb-10 sm:pt-28 lg:pt-28 lg:pb-12">
          <div className="relative mx-auto max-w-7xl px-5 sm:px-8">
            <div className="grid items-start gap-8 lg:grid-cols-12 lg:items-center lg:gap-10">
              {/* LEFT COLUMN: Value Proposition + System Select Filters + 1-Row Quick Filters */}
              <div className="lg:col-span-6 lg:pb-2">
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-emerald-700">
                  Nền tảng tìm phòng & ghép bạn ở ghép xác thực
                </p>

                <h1 className="font-display mt-3.5 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-5xl lg:text-[3.1rem] lg:leading-[1.14]">
                  Tìm phòng phù hợp.
                  <span className="mt-1.5 block text-emerald-700">
                    Sống theo cách của bạn.
                  </span>
                </h1>

                <p className="mt-4 max-w-xl text-sm leading-relaxed text-slate-600 sm:text-base">
                  Công khai rõ giá thuê, điện, nước và sức chứa từng phòng ngay từ đầu.
                  Kết nối trực tiếp với chủ trọ và bạn ở ghép đã xác minh CCCD.
                </p>

                {/* System-Styled Search Bar using @/components/ui/select */}
                <form
                  onSubmit={handleSearchSubmit}
                  className="mt-7 w-full max-w-2xl space-y-2.5"
                >
                  <div className="flex flex-col gap-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-[0_12px_30px_-14px_rgba(6,95,70,0.12)] sm:flex-row sm:items-center">
                    {/* 1. District Select (System Select Component) */}
                    <div className="sm:flex-[1.25] min-w-0">
                      <Select
                        value={selectedDistrict || "ALL"}
                        onValueChange={(val) => {
                          const next = val === "ALL" ? "" : val;
                          setSelectedDistrict(next);
                          if (next) smoothScrollToElement("featured-rooms", 72);
                        }}
                      >
                        <SelectTrigger
                          aria-label="Chọn khu vực quận huyện"
                          className="h-10 w-full gap-1.5 rounded-xl border-slate-200/80 bg-[#f8faf9] px-2.5 text-xs sm:text-[13px] font-semibold text-slate-800 hover:border-emerald-500/40"
                        >
                          <span className="flex min-w-0 items-center gap-1.5">
                            <MapPin className="size-4 shrink-0 text-emerald-600" />
                            <SelectValue placeholder="Tất cả khu vực" />
                          </span>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ALL" className="text-xs sm:text-sm font-medium">
                            Tất cả khu vực ({showcaseRooms.length} phòng)
                          </SelectItem>
                          {districts.map((d) => (
                            <SelectItem key={d} value={d} className="text-xs sm:text-sm">
                              {d} {districtCounts[d] ? `(${districtCounts[d]} phòng)` : ""}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* 2. Max Price Select (System Select Component) */}
                    <div className="sm:flex-1 min-w-0">
                      <Select
                        value={selectedPriceVal}
                        onValueChange={(val) => {
                          setSelectedPriceVal(val);
                          if (val !== "ALL") smoothScrollToElement("featured-rooms", 72);
                        }}
                      >
                        <SelectTrigger
                          aria-label="Chọn mức giá thuê"
                          className="h-10 w-full gap-1.5 rounded-xl border-slate-200/80 bg-[#f8faf9] px-2.5 text-xs sm:text-[13px] font-semibold text-slate-800 hover:border-emerald-500/40"
                        >
                          <span className="flex min-w-0 items-center gap-1.5">
                            <Wallet className="size-4 shrink-0 text-emerald-600" />
                            <SelectValue placeholder="Tất cả mức giá" />
                          </span>
                        </SelectTrigger>
                        <SelectContent>
                          {PRICE_OPTIONS.map((p) => (
                            <SelectItem key={p.value} value={p.value} className="text-xs sm:text-sm">
                              {p.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <button
                      type="submit"
                      className="inline-flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 text-xs sm:text-[13px] font-semibold text-white transition-all duration-150 hover:bg-emerald-700 active:scale-[0.98] cursor-pointer"
                    >
                      <Search className="size-4" />
                      <span>Xem phòng</span>
                    </button>
                  </div>
                </form>

                {/* Single-Row Quick Filter Strip + "+8 bộ lọc khác" Unlock Pill */}
                <div className="mt-3.5 flex flex-wrap sm:flex-nowrap items-center gap-1.5 w-full max-w-2xl">
                  {QUICK_FILTERS.map((chip) => {
                    const Icon = chip.icon;
                    const active = activeFilter === chip.id;
                    return (
                      <button
                        key={chip.id}
                        type="button"
                        onClick={() => {
                          setActiveFilter(chip.id);
                          const el = document.getElementById("featured-rooms");
                          if (el && chip.id !== "all") {
                            el.scrollIntoView({ behavior: "smooth" });
                          }
                        }}
                        className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1.5 text-xs font-semibold whitespace-nowrap transition-all duration-150 active:scale-[0.97] cursor-pointer ${
                          active
                            ? "border-emerald-600 bg-emerald-600 text-white shadow-2xs"
                            : "border-slate-200 bg-white text-slate-700 hover:border-emerald-500/40 hover:bg-emerald-50/60 hover:text-emerald-800"
                        }`}
                      >
                        <Icon className="size-3.5 shrink-0" />
                        <span>{chip.label}</span>
                      </button>
                    );
                  })}

                  {/* Unlock Full System Filters Pill (Communicates remaining filters inside Discover) */}
                  <button
                    type="button"
                    onClick={handleUnlockFullSearch}
                    title="Đăng nhập để lọc thêm theo 8 tiện nghi (Máy lạnh, WC riêng, Giờ tự do...), diện tích, tiêu chí lối sống & Bản đồ giá"
                    className="inline-flex items-center gap-1 rounded-full border border-dashed border-emerald-600/50 bg-emerald-50/80 px-2.5 py-1.5 text-xs font-bold text-emerald-800 whitespace-nowrap transition-all duration-150 hover:border-emerald-600 hover:bg-emerald-100/80 active:scale-[0.97] cursor-pointer"
                  >
                    <SlidersHorizontal className="size-3.5 shrink-0 text-emerald-700" />
                    <span>+8 bộ lọc khác</span>
                  </button>
                </div>
              </div>

              {/* RIGHT COLUMN: Bright White + Emerald Showcase + 4-Col Grid (NO Scrollbar, NO Top Clipping) */}
              <div className="lg:col-span-6">
                <div
                  className="relative mx-auto max-w-xl lg:max-w-none"
                  onMouseEnter={() => setIsHeroHovered(true)}
                  onMouseLeave={() => setIsHeroHovered(false)}
                >
                  {!activeHeroRoom ? (
                    <div className="overflow-hidden rounded-[1.75rem] border border-emerald-900/10 bg-white p-2.5 shadow-[0_18px_44px_-18px_rgba(6,95,70,0.14)] animate-pulse">
                      <div className="aspect-[16/9] w-full rounded-[1.25rem] bg-slate-200/80" />
                      <div className="mt-2.5 flex items-center justify-between gap-3 rounded-2xl bg-[#f4faf6] border border-emerald-900/10 p-3.5">
                        <div className="space-y-2 flex-1">
                          <div className="h-3.5 w-40 rounded bg-slate-200" />
                          <div className="h-5 w-64 rounded bg-slate-200" />
                          <div className="flex gap-1.5 pt-1">
                            <div className="h-5 w-16 rounded bg-slate-200" />
                            <div className="h-5 w-24 rounded bg-slate-200" />
                          </div>
                        </div>
                        <div className="h-9 w-28 rounded-xl bg-slate-200" />
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* White + Emerald Card Frame */}
                      <div className="overflow-hidden rounded-[1.75rem] border border-emerald-900/10 bg-white p-2.5 shadow-[0_18px_44px_-18px_rgba(6,95,70,0.14)]">
                        {/* Photo Viewport (16:9 so it stays compact and never clips under navbar) */}
                        <div className="relative aspect-[16/9] w-full overflow-hidden rounded-[1.25rem] bg-slate-100">
                          <AnimatePresence mode="popLayout" initial={false} custom={heroDirection}>
                            <motion.div
                              key={`${activeHeroRoom.id}-${heroPhotoIdx}`}
                              custom={heroDirection}
                              initial={{
                                opacity: 0,
                                x: heroDirection * 42,
                                scale: 1.04,
                                filter: "blur(4px)",
                              }}
                              animate={{
                                opacity: 1,
                                x: 0,
                                scale: 1,
                                filter: "blur(0px)",
                              }}
                              exit={{
                                opacity: 0,
                                x: heroDirection * -32,
                                scale: 0.97,
                                filter: "blur(3px)",
                              }}
                              transition={{ duration: 0.42, ease: EASE_OUT_CURVE }}
                              className="absolute inset-0 cursor-pointer"
                              onClick={() => handleRoomClick(activeHeroRoom)}
                            >
                              <motion.div
                                initial={{ scale: 1 }}
                                animate={{ scale: isHeroPaused ? 1 : 1.045 }}
                                transition={{
                                  duration: HERO_ROTATION_MS / 1000,
                                  ease: "linear",
                                }}
                                className="h-full w-full"
                              >
                                <ImageWithFallback
                                  src={currentHeroImage}
                                  alt={activeHeroRoom.title}
                                  className="h-full w-full object-cover"
                                />
                              </motion.div>
                            </motion.div>
                          </AnimatePresence>

                          {/* Top Badges: Light White + Emerald Palette */}
                          <div className="absolute inset-x-3 top-3 z-10 flex items-center justify-between gap-2">
                            <AnimatePresence mode="wait" initial={false}>
                              <motion.div
                                key={activeHeroRoom.id}
                                initial={{ opacity: 0, y: -6 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 6 }}
                                transition={{ duration: 0.22, ease: EASE_OUT_CURVE }}
                                className="flex flex-wrap items-center gap-1.5"
                              >
                                <span className="rounded-full border border-emerald-900/10 bg-white/95 px-2.5 py-1 text-xs font-bold text-emerald-900 shadow-xs backdrop-blur-md">
                                  {activeHeroRoom.typeLabel}
                                </span>
                                {activeHeroRoom.isVerified && (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-600 px-2.5 py-1 text-xs font-semibold text-white shadow-xs">
                                    <ShieldCheck className="size-3.5" />
                                    Đã xác minh CCCD
                                  </span>
                                )}
                              </motion.div>
                            </AnimatePresence>

                            {/* Photo counter pills */}
                            {activeHeroImages.length > 1 && (
                              <div className="flex items-center gap-1.5 rounded-full border border-slate-200/80 bg-white/95 px-2.5 py-1 shadow-xs backdrop-blur-md">
                                {activeHeroImages.slice(0, 3).map((_, pIdx) => (
                                  <button
                                    key={pIdx}
                                    type="button"
                                    aria-label={`Ảnh ${pIdx + 1}`}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      markManualHeroInteraction();
                                      setHeroDirection(pIdx > heroPhotoIdx ? 1 : -1);
                                      setHeroPhotoIdx(pIdx);
                                    }}
                                    className={`h-1.5 rounded-full transition-all cursor-pointer ${
                                      heroPhotoIdx % activeHeroImages.length === pIdx
                                        ? "w-4 bg-emerald-600"
                                        : "w-1.5 bg-slate-300 hover:bg-slate-400"
                                    }`}
                                  />
                                ))}
                                <span className="ml-1 text-[11px] font-bold text-slate-700 tabular-nums">
                                  {(heroPhotoIdx % activeHeroImages.length) + 1}/
                                  {Math.min(activeHeroImages.length, 3)} ảnh
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Left / Right Room Switcher Arrows */}
                          <button
                            type="button"
                            aria-label="Phòng trước"
                            onClick={(e) => {
                              e.stopPropagation();
                              markManualHeroInteraction();
                              setHeroDirection(-1);
                              setHeroPhotoIdx(0);
                              setHeroRoomIdx(
                                (prev) => (prev - 1 + heroRooms.length) % heroRooms.length
                              );
                            }}
                            className="group/prev absolute inset-y-0 left-3 z-10 my-auto grid size-9 place-items-center rounded-full border border-slate-200/70 bg-white/95 text-slate-800 shadow-md backdrop-blur-xs transition-all duration-200 ease-out hover:scale-110 hover:border-emerald-600 hover:bg-emerald-600 hover:text-white hover:shadow-lg hover:ring-4 hover:ring-white/35 active:scale-95 cursor-pointer"
                          >
                            <ChevronLeft className="size-4 transition-transform duration-200 ease-out group-hover/prev:-translate-x-0.5" />
                          </button>
                          <button
                            type="button"
                            aria-label="Phòng tiếp theo"
                            onClick={(e) => {
                              e.stopPropagation();
                              markManualHeroInteraction();
                              setHeroDirection(1);
                              setHeroPhotoIdx(0);
                              setHeroRoomIdx((prev) => (prev + 1) % heroRooms.length);
                            }}
                            className="group/next absolute inset-y-0 right-3 z-10 my-auto grid size-9 place-items-center rounded-full border border-slate-200/70 bg-white/95 text-slate-800 shadow-md backdrop-blur-xs transition-all duration-200 ease-out hover:scale-110 hover:border-emerald-600 hover:bg-emerald-600 hover:text-white hover:shadow-lg hover:ring-4 hover:ring-white/35 active:scale-95 cursor-pointer"
                          >
                            <ChevronRight className="size-4 transition-transform duration-200 ease-out group-hover/next:translate-x-0.5" />
                          </button>
                        </div>

                        {/* Bright White + Emerald Info Footer inside Showcase Card (Synchronized room transition) */}
                        <div className="mt-2.5 overflow-hidden rounded-2xl bg-[#f4faf6] border border-emerald-900/10 p-3.5">
                          <AnimatePresence mode="wait" initial={false} custom={heroDirection}>
                            <motion.div
                              key={activeHeroRoom.id}
                              custom={heroDirection}
                              initial={{
                                opacity: 0,
                                x: heroDirection * 24,
                                filter: "blur(3px)",
                              }}
                              animate={{
                                opacity: 1,
                                x: 0,
                                filter: "blur(0px)",
                              }}
                              exit={{
                                opacity: 0,
                                x: heroDirection * -18,
                                filter: "blur(2px)",
                              }}
                              transition={{ duration: 0.28, ease: EASE_OUT_CURVE }}
                              className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center"
                            >
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
                                  <MapPin className="size-3.5 shrink-0" />
                                  <span className="truncate">{activeHeroRoom.address}</span>
                                </div>
                                <h2 className="mt-0.5 truncate text-base font-bold text-slate-900">
                                  {activeHeroRoom.title}
                                </h2>
                                <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                                  <span className="inline-flex items-center gap-1 rounded-md bg-white border border-slate-200/80 px-2 py-0.5 text-[11px] font-semibold text-slate-700 tabular-nums">
                                    <Maximize2 className="size-3 text-emerald-600" />
                                    {activeHeroRoom.area} m²
                                  </span>
                                  <span className="inline-flex items-center gap-1 rounded-md bg-white border border-slate-200/80 px-2 py-0.5 text-[11px] font-semibold text-slate-700 tabular-nums">
                                    <Users className="size-3 text-emerald-600" />
                                    Tối đa {activeHeroRoom.maxOccupants} người
                                  </span>
                                  {activeHeroRoom.amenities.slice(0, 2).map((am: string) => (
                                    <span
                                      key={am}
                                      className="rounded-md bg-emerald-100/70 px-2 py-0.5 text-[11px] font-medium text-emerald-900"
                                    >
                                      {am}
                                    </span>
                                  ))}
                                </div>
                              </div>

                              <div className="flex items-center justify-between gap-3 border-t border-emerald-900/10 pt-2.5 sm:flex-col sm:items-end sm:border-t-0 sm:pt-0 shrink-0">
                                <div className="text-left sm:text-right">
                                  <p className="text-[11px] font-medium text-slate-500">Giá thuê niêm yết</p>
                                  <p className="text-lg font-extrabold text-emerald-700 tabular-nums">
                                    {formatShortVND(activeHeroRoom.price)}
                                  </p>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleRoomClick(activeHeroRoom)}
                                  className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white shadow-2xs transition-colors duration-150 hover:bg-emerald-700 active:scale-95 cursor-pointer"
                                >
                                  Xem chi tiết
                                  <ArrowRight className="size-3.5" />
                                </button>
                              </div>
                            </motion.div>
                          </AnimatePresence>
                        </div>
                      </div>

                      {/* Fixed 4-Column Thumbnail Grid with Shared Layout Active Ring + Progress Fill Sweep */}
                      <div className="mt-2.5 grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {heroThumbnailEntries.map(({ item, idx }) => {
                          const isSelected = idx === activeHeroIdx;
                          return (
                            <button
                              key={`${item.id}-${idx}`}
                              type="button"
                              onClick={() => {
                                markManualHeroInteraction();
                                if (idx === activeHeroIdx) return;
                                setHeroDirection(idx > activeHeroIdx ? 1 : -1);
                                setHeroRoomIdx(idx);
                                setHeroPhotoIdx(0);
                              }}
                              className={`relative flex items-center gap-2 overflow-hidden rounded-xl border p-1.5 text-left transition-all duration-200 cursor-pointer min-w-0 ${
                                isSelected
                                  ? "border-emerald-600/40 bg-white shadow-sm opacity-100"
                                  : "border-slate-200/80 bg-white/80 opacity-80 hover:opacity-100"
                              }`}
                            >
                              {isSelected && (
                                <motion.span
                                  layoutId="hero-active-room-pill"
                                  transition={{ type: "spring", duration: 0.42, bounce: 0.16 }}
                                  className="pointer-events-none absolute inset-0 rounded-xl border-2 border-emerald-600/80 ring-2 ring-emerald-500/15"
                                />
                              )}
                              {isSelected && !isHeroPaused && (
                                <>
                                  <motion.span
                                    key={`sweep-${item.id}-${activeHeroIdx}`}
                                    initial={{ scaleX: 0 }}
                                    animate={{ scaleX: 1 }}
                                    transition={{
                                      duration: HERO_ROTATION_MS / 1000,
                                      ease: "linear",
                                    }}
                                    className="pointer-events-none absolute inset-0 origin-left bg-emerald-500/[0.09]"
                                  />
                                  <motion.span
                                    key={`bar-${item.id}-${activeHeroIdx}`}
                                    initial={{ scaleX: 0 }}
                                    animate={{ scaleX: 1 }}
                                    transition={{
                                      duration: HERO_ROTATION_MS / 1000,
                                      ease: "linear",
                                    }}
                                    className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-[3px] origin-left bg-emerald-600"
                                  />
                                </>
                              )}
                              <ImageWithFallback
                                src={item.images[0]}
                                alt={item.title}
                                className="relative z-10 size-8 rounded-lg object-cover shrink-0"
                              />
                              <div className="relative z-10 min-w-0 flex-1">
                                <p className="truncate text-xs font-bold text-slate-800">
                                  {item.district}
                                </p>
                                <p className="truncate text-[11px] font-semibold text-emerald-700 tabular-nums">
                                  {formatShortVND(item.price)}
                                </p>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* ===== REAL-TIME TRUST & METRICS BAR ===== */}
            <div className="mt-8 rounded-3xl border border-emerald-900/10 bg-white p-5 shadow-2xs sm:p-6">
              <div className="grid grid-cols-2 gap-5 lg:grid-cols-4 lg:divide-x lg:divide-slate-200/80">
                <div className="flex items-center gap-3.5 lg:px-4">
                  <div className="grid size-11 shrink-0 place-items-center rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-600/15">
                    <Building2 className="size-5" />
                  </div>
                  <div>
                    <div className="font-display text-2xl font-extrabold text-slate-900 tabular-nums">
                      {showcaseRooms.length > 0
                        ? `${showcaseRooms.length}`
                        : stats?.availableRoomsCount
                        ? `${stats.availableRoomsCount}`
                        : "..."}
                    </div>
                    <div className="text-xs font-medium text-slate-600">
                      Phòng đang mở tại các quận
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3.5 lg:px-6">
                  <div className="grid size-11 shrink-0 place-items-center rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-600/15">
                    <Users className="size-5" />
                  </div>
                  <div>
                    <div className="font-display text-2xl font-extrabold text-slate-900 tabular-nums">
                      {stats ? `${stats.activeUsersCount}` : "..."}
                    </div>
                    <div className="text-xs font-medium text-slate-600">
                      Thành viên xác thực hoạt động
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3.5 lg:px-6">
                  <div className="grid size-11 shrink-0 place-items-center rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-600/15">
                    <ShieldCheck className="size-5" />
                  </div>
                  <div>
                    <div className="font-display text-2xl font-extrabold text-slate-900 tabular-nums">
                      100%
                    </div>
                    <div className="text-xs font-medium text-slate-600">
                      Công khai giá điện, nước & sức chứa
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3.5 lg:px-6">
                  <div className="grid size-11 shrink-0 place-items-center rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-600/15">
                    <Heart className="size-5" />
                  </div>
                  <div>
                    <div className="font-display text-base font-extrabold text-slate-900 sm:text-lg">
                      Tự động cập nhật
                    </div>
                    <div className="text-xs font-medium text-slate-600">
                      Tự gỡ tin khi khách nhận phòng
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ===== FEATURED ROOMS SECTION (FULL DISTRICT + PRICE + TYPE FILTER BAR + SMOOTH PAGINATION) ===== */}
        <section
          id="featured-rooms"
          className="mx-auto max-w-7xl px-5 py-12 sm:px-8 lg:py-16"
        >
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <h2 className="font-display text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
                Khám phá phòng đang mở cho thuê
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                Tra cứu trực tiếp theo Quận/Huyện, mức giá và loại phòng — hiển thị{" "}
                <strong className="font-bold text-emerald-700 tabular-nums">
                  {filteredRooms.length}
                </strong>{" "}
                phòng phù hợp.
              </p>
            </div>

            <motion.div
              layout
              transition={{ duration: 0.22, ease: EASE_OUT_CURVE }}
              className="flex flex-wrap items-center gap-3 self-start sm:self-auto"
            >
              <AnimatePresence initial={false} mode="popLayout">
                {totalFeaturedPages > 1 && (
                  <motion.div
                    key="top-pagination-pills"
                    layout
                    initial={{ opacity: 0, scale: 0.92, filter: "blur(3px)" }}
                    animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                    exit={{ opacity: 0, scale: 0.92, filter: "blur(3px)" }}
                    transition={{ duration: 0.2, ease: EASE_OUT_CURVE }}
                    className="inline-flex items-center gap-1 rounded-full border border-slate-200/90 bg-white p-1 shadow-2xs"
                  >
                    <button
                      type="button"
                      aria-label="Trang trước"
                      onClick={() => goToFeaturedPage(currentSafePage - 1)}
                      className="grid size-7 place-items-center rounded-full text-slate-600 transition-all hover:bg-emerald-50 hover:text-emerald-700 active:scale-90 cursor-pointer"
                    >
                      <ChevronLeft className="size-4" />
                    </button>
                    {Array.from({ length: totalFeaturedPages }).map((_, pIdx) => {
                      const isActivePage = pIdx === currentSafePage;
                      return (
                        <button
                          key={pIdx}
                          type="button"
                          onClick={() => goToFeaturedPage(pIdx)}
                          className={`relative min-w-7 h-7 rounded-full px-2 text-xs font-bold tabular-nums transition-colors duration-150 active:scale-95 cursor-pointer ${
                            isActivePage
                              ? "text-white"
                              : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                          }`}
                        >
                          {isActivePage && (
                            <motion.span
                              layoutId="top-page-active-pill"
                              transition={{ duration: 0.22, ease: EASE_OUT_CURVE }}
                              className="absolute inset-0 rounded-full bg-emerald-600 shadow-2xs"
                            />
                          )}
                          <span className="relative z-10">{pIdx + 1}</span>
                        </button>
                      );
                    })}
                    <button
                      type="button"
                      aria-label="Trang tiếp"
                      onClick={() => goToFeaturedPage(currentSafePage + 1)}
                      className="grid size-7 place-items-center rounded-full text-slate-600 transition-all hover:bg-emerald-50 hover:text-emerald-700 active:scale-90 cursor-pointer"
                    >
                      <ChevronRight className="size-4" />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              <motion.button
                layout
                transition={{ duration: 0.22, ease: EASE_OUT_CURVE }}
                type="button"
                onClick={handleUnlockFullSearch}
                className="inline-flex items-center gap-1.5 text-sm font-bold text-emerald-700 hover:text-emerald-800 cursor-pointer"
              >
                Mở Bản đồ giá & Bộ lọc đầy đủ
                <ArrowRight className="size-4" />
              </motion.button>
            </motion.div>
          </div>

          {/* Complete Synchronized Filter Bar: All 11 Districts + All Price Ranges + Room Types */}
          <div className="mt-4 flex flex-col gap-2.5 rounded-2xl border border-slate-200/90 bg-white p-3 shadow-2xs lg:flex-row lg:items-center lg:justify-between">
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:flex lg:items-center lg:gap-2.5">
              {/* 1. Full District Select (All 11 Districts) */}
              <div className="w-full lg:w-64">
                <Select
                  value={selectedDistrict || "ALL"}
                  onValueChange={(val) => {
                    setTransitionMode("filter");
                    setSelectedDistrict(val === "ALL" ? "" : val);
                  }}
                >
                  <SelectTrigger
                    aria-label="Lọc theo quận huyện"
                    className="h-9 w-full gap-1.5 rounded-xl border-slate-200/90 bg-[#f8faf9] px-3 text-xs font-semibold text-slate-800 hover:border-emerald-500/40"
                  >
                    <span className="flex min-w-0 items-center gap-1.5">
                      <MapPin className="size-3.5 shrink-0 text-emerald-600" />
                      <SelectValue placeholder="Tất cả khu vực" />
                    </span>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL" className="text-xs font-medium">
                      Tất cả khu vực ({showcaseRooms.length} phòng)
                    </SelectItem>
                    {districts.map((d) => (
                      <SelectItem key={d} value={d} className="text-xs">
                        {d} {districtCounts[d] ? `(${districtCounts[d]} phòng)` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* 2. Full Price Range Select */}
              <div className="w-full lg:w-56">
                <Select
                  value={selectedPriceVal}
                  onValueChange={(val) => {
                    setTransitionMode("filter");
                    setSelectedPriceVal(val);
                  }}
                >
                  <SelectTrigger
                    aria-label="Lọc theo khoảng giá"
                    className="h-9 w-full gap-1.5 rounded-xl border-slate-200/90 bg-[#f8faf9] px-3 text-xs font-semibold text-slate-800 hover:border-emerald-500/40"
                  >
                    <span className="flex min-w-0 items-center gap-1.5">
                      <Wallet className="size-3.5 shrink-0 text-emerald-600" />
                      <SelectValue placeholder="Tất cả mức giá" />
                    </span>
                  </SelectTrigger>
                  <SelectContent>
                    {PRICE_OPTIONS.map((p) => (
                      <SelectItem key={p.value} value={p.value} className="text-xs">
                        {p.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* 3. Room Type Pills + Smoothly Animated Reset Filter Button */}
            <motion.div
              layout
              transition={{ duration: 0.22, ease: EASE_OUT_CURVE }}
              className="flex flex-wrap items-center gap-1.5"
            >
              {QUICK_FILTERS.map((chip) => {
                const Icon = chip.icon;
                const active = activeFilter === chip.id;
                return (
                  <motion.button
                    layout
                    transition={{ duration: 0.22, ease: EASE_OUT_CURVE }}
                    key={chip.id}
                    type="button"
                    onClick={() => {
                      setTransitionMode("filter");
                      setActiveFilter(chip.id);
                    }}
                    className={`relative inline-flex items-center gap-1 rounded-xl border px-3 py-1.5 text-xs font-semibold transition-colors duration-150 active:scale-95 cursor-pointer ${
                      active
                        ? "border-emerald-600 text-white"
                        : "border-slate-200 bg-[#f8faf9] text-slate-700 hover:border-emerald-500/40 hover:bg-emerald-50/60 hover:text-emerald-800"
                    }`}
                  >
                    {active && (
                      <motion.span
                        layoutId="featured-filter-active-bg"
                        transition={{ duration: 0.22, ease: EASE_OUT_CURVE }}
                        className="absolute inset-0 rounded-xl bg-emerald-600 shadow-2xs"
                      />
                    )}
                    <Icon className="relative z-10 size-3.5 shrink-0" />
                    <span className="relative z-10">{chip.label}</span>
                  </motion.button>
                );
              })}

              <AnimatePresence initial={false} mode="popLayout">
                {hasActiveFilter && (
                  <motion.button
                    key="reset-filter-btn"
                    layout
                    initial={{ opacity: 0, scale: 0.88, filter: "blur(4px)" }}
                    animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                    exit={{ opacity: 0, scale: 0.88, filter: "blur(4px)" }}
                    transition={{ duration: 0.22, ease: EASE_OUT_CURVE }}
                    type="button"
                    onClick={() => {
                      setTransitionMode("filter");
                      setSelectedDistrict("");
                      setSelectedPriceVal("ALL");
                      setActiveFilter("all");
                    }}
                    className="group inline-flex items-center gap-1.5 rounded-xl border border-emerald-300/90 bg-emerald-50/90 px-3 py-1.5 text-xs font-bold text-emerald-800 shadow-2xs transition-colors hover:bg-emerald-100 active:scale-95 cursor-pointer"
                  >
                    <RotateCcw className="size-3.5 text-emerald-700 transition-transform duration-300 group-hover:-rotate-90" />
                    <span>Đặt lại ({showcaseRooms.length} phòng)</span>
                  </motion.button>
                )}
              </AnimatePresence>
            </motion.div>
          </div>

          <div id="featured-rooms-grid" className="scroll-mt-24">
            {isInitialLoading ? (
              <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3, 4, 5, 6].map((n) => (
                  <div
                    key={n}
                    className="overflow-hidden rounded-3xl border border-slate-200/70 bg-white shadow-xs animate-pulse"
                  >
                    <div className="aspect-[16/10] w-full bg-slate-200" />
                    <div className="space-y-3 p-5">
                      <div className="h-5 w-3/4 rounded-lg bg-slate-200" />
                      <div className="h-4 w-1/2 rounded-lg bg-slate-200" />
                      <div className="flex gap-2 pt-1">
                        <div className="h-6 w-20 rounded-full bg-slate-200" />
                        <div className="h-6 w-20 rounded-full bg-slate-200" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <AnimatePresence mode="wait" initial={false}>
                {visibleRooms.length > 0 ? (
                  <motion.div
                    key={`grid-${currentSafePage}-${selectedDistrict}-${selectedPriceVal}-${activeFilter}`}
                    initial={
                      shouldReduceMotion
                        ? { opacity: 0 }
                        : transitionMode === "page"
                        ? { opacity: 0, x: pageDirection * 24 }
                        : { opacity: 0, y: 12, scale: 0.985 }
                    }
                    animate={
                      shouldReduceMotion
                        ? { opacity: 1 }
                        : { opacity: 1, x: 0, y: 0, scale: 1 }
                    }
                    exit={
                      shouldReduceMotion
                        ? { opacity: 0 }
                        : transitionMode === "page"
                        ? { opacity: 0, x: pageDirection * -18 }
                        : { opacity: 0, y: -8, scale: 0.99 }
                    }
                    transition={{ duration: 0.22, ease: EASE_OUT_CURVE }}
                  >
                    <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                      {visibleRooms.map((room: any, idx: number) => (
                        <motion.div
                          key={room.id}
                          initial={shouldReduceMotion ? false : { opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{
                            duration: 0.24,
                            delay: shouldReduceMotion ? 0 : idx * 0.035,
                            ease: EASE_OUT_CURVE,
                          }}
                        >
                          <FeaturedRoomCard
                            room={room}
                            fallbackSeed={currentSafePage * PAGE_SIZE + idx}
                            onSelect={() => handleRoomClick(room)}
                          />
                        </motion.div>
                      ))}
                    </div>

                    {/* Bottom Pagination Bar for Effortless Page Switching */}
                    {totalFeaturedPages > 1 && (
                      <div className="mt-6 flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => goToFeaturedPage(currentSafePage - 1, true)}
                          className="inline-flex h-9 items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 transition-all hover:border-emerald-500/50 hover:text-emerald-700 active:scale-95 cursor-pointer"
                        >
                          <ChevronLeft className="size-4" />
                          Trước
                        </button>
                        {Array.from({ length: totalFeaturedPages }).map((_, pIdx) => {
                          const isActivePage = pIdx === currentSafePage;
                          return (
                            <button
                              key={pIdx}
                              type="button"
                              onClick={() => goToFeaturedPage(pIdx, true)}
                              className={`size-9 rounded-xl border text-xs font-extrabold tabular-nums transition-all duration-150 active:scale-95 cursor-pointer ${
                                isActivePage
                                  ? "border-emerald-600 bg-emerald-600 text-white shadow-2xs"
                                  : "border-slate-200 bg-white text-slate-700 hover:border-emerald-500/40 hover:text-emerald-700"
                              }`}
                            >
                              {pIdx + 1}
                            </button>
                          );
                        })}
                        <button
                          type="button"
                          onClick={() => goToFeaturedPage(currentSafePage + 1, true)}
                          className="inline-flex h-9 items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 transition-all hover:border-emerald-500/50 hover:text-emerald-700 active:scale-95 cursor-pointer"
                        >
                          Tiếp
                          <ChevronRight className="size-4" />
                        </button>
                      </div>
                    )}

                    {/* Conversion Gate Bar below preview cards */}
                    <div className="mt-7 flex flex-col items-center justify-between gap-4 rounded-2xl border border-emerald-600/20 bg-[#f2f9f5] px-5 py-4 sm:flex-row">
                      <div className="flex items-center gap-3 text-center sm:text-left">
                        <span className="hidden sm:grid size-9 shrink-0 place-items-center rounded-xl bg-emerald-600 text-white">
                          <SlidersHorizontal className="size-4" />
                        </span>
                        <div>
                          <p className="text-sm font-bold text-slate-900">
                            Muốn tìm phòng theo bán kính km quanh tên đường cụ thể hoặc lọc sâu theo tiện nghi (Ban công, Bếp riêng, Giờ tự do)?
                          </p>
                          <p className="text-xs text-slate-600">
                            Đăng nhập miễn phí để mở Bản đồ giá Goong Maps định vị bán kính các con đường lân cận và đặt lịch hẹn xem phòng trực tiếp.
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleUnlockFullSearch}
                        className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-2xs transition-all hover:bg-emerald-700 active:scale-95 cursor-pointer"
                      >
                        Mở Bản đồ giá & Bộ lọc đầy đủ
                        <ArrowRight className="size-3.5" />
                      </button>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="empty-filter-state"
                    initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 12, scale: 0.985 }}
                    animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
                    exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -8, scale: 0.99 }}
                    transition={{ duration: 0.22, ease: EASE_OUT_CURVE }}
                    className="mt-6 rounded-3xl border border-slate-200/80 bg-white p-10 text-center shadow-2xs"
                  >
                    <p className="text-base font-semibold text-slate-800">
                      Chưa có phòng khớp với bộ lọc hiện tại
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      Hãy chọn lại khu vực khác hoặc đặt lại bộ lọc để xem toàn bộ {showcaseRooms.length} phòng đang mở.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setTransitionMode("filter");
                        setSelectedDistrict("");
                        setSelectedPriceVal("ALL");
                        setActiveFilter("all");
                      }}
                      className="mt-4 inline-flex items-center gap-2 rounded-full bg-emerald-600 px-5 py-2.5 text-xs font-semibold text-white hover:bg-emerald-700 active:scale-95 transition-all cursor-pointer"
                    >
                      <RotateCcw className="size-3.5" />
                      Hiển thị tất cả phòng đang mở ({showcaseRooms.length})
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            )}
          </div>
        </section>

        {/* ===== CORE PLATFORM CAPABILITIES (SWITCHABLE TENANT VS LANDLORD) ===== */}
        <section id="how" className="bg-white/60 backdrop-blur-[2px] py-14 lg:py-20 border-y border-slate-200/70">
          <div className="mx-auto max-w-7xl px-5 sm:px-8">
            <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
              <div className="max-w-2xl">
                <h2 className="font-display text-2xl font-extrabold tracking-tight text-slate-900 sm:text-4xl text-balance">
                  Giải quyết trọn vẹn bài toán thuê trọ & ở ghép{"\u00A0"}thực{"\u00A0"}tế
                </h2>
                <p className="mt-2.5 text-sm sm:text-base text-slate-600 leading-relaxed text-pretty">
                  Không chỉ là trang đăng tin rao vặt — Phòng Trọ Xanh đồng hành từ bước tìm phòng, so khớp người ở ghép, hẹn lịch xem phòng cho tới khi bàn giao nhận{"\u00A0"}phòng.
                </p>
              </div>

              {/* Role Switcher */}
              <div className="inline-flex rounded-2xl border border-slate-200 bg-slate-100/80 p-1.5 self-start shrink-0">
                <button
                  type="button"
                  onClick={() => setActiveRoleView("tenant")}
                  className={`relative flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-colors duration-150 cursor-pointer sm:text-sm ${
                    activeRoleView === "tenant"
                      ? "text-emerald-800"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {activeRoleView === "tenant" && (
                    <motion.span
                      layoutId="how-role-active-pill"
                      transition={{ duration: 0.24, ease: EASE_OUT_CURVE }}
                      className="absolute inset-0 rounded-xl bg-white shadow-xs"
                    />
                  )}
                  <Users className="relative z-10 size-4" />
                  <span className="relative z-10">Dành cho Người đi thuê</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveRoleView("landlord")}
                  className={`relative flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-colors duration-150 cursor-pointer sm:text-sm ${
                    activeRoleView === "landlord"
                      ? "text-emerald-800"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {activeRoleView === "landlord" && (
                    <motion.span
                      layoutId="how-role-active-pill"
                      transition={{ duration: 0.24, ease: EASE_OUT_CURVE }}
                      className="absolute inset-0 rounded-xl bg-white shadow-xs"
                    />
                  )}
                  <Building2 className="relative z-10 size-4" />
                  <span className="relative z-10">Dành cho Chủ nhà trọ</span>
                </button>
              </div>
            </div>

            <AnimatePresence mode="wait" initial={false}>
              {activeRoleView === "tenant" ? (
                <motion.div
                  key="role-tenant-grid"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.22, ease: EASE_OUT_CURVE }}
                  className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-4"
                >
                  {/* Step 1 */}
                  <div className="rounded-3xl border border-slate-200/85 bg-white/95 shadow-2xs p-5 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-emerald-600 text-white shadow-xs">
                          <SlidersHorizontal className="size-5" />
                        </span>
                        <span className="whitespace-nowrap rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800">
                          Bước 1 · Minh bạch phí
                        </span>
                      </div>
                      <h3 className="mt-4 min-h-[2.75rem] text-[15px] leading-snug font-bold text-slate-900">
                        Biết rõ biểu phí & sức chứa{" "}
                        <span className="inline-block">trước khi đi xem</span>
                      </h3>
                      <p className="mt-2 text-[13px] leading-relaxed text-slate-600">
                        Mỗi tin đăng đều công khai tiền thuê, tiền cọc, sức chứa tối đa và đơn giá điện, nước theo đúng mức chủ trọ niêm{"\u00A0"}yết.
                      </p>
                    </div>
                    <div className="mt-5 rounded-2xl border border-emerald-900/10 bg-[#f4faf6] p-3 text-xs space-y-2">
                      <div className="flex items-center gap-2 text-slate-700">
                        <CheckCircle2 className="size-3.5 shrink-0 text-emerald-600" />
                        <span className="truncate font-semibold text-slate-800">
                          Niêm yết rõ điện, nước & dịch vụ
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-700">
                        <CheckCircle2 className="size-3.5 shrink-0 text-emerald-600" />
                        <span className="truncate font-semibold text-emerald-800">
                          Ghi rõ số người ở tối đa mỗi phòng
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Step 2 */}
                  <div className="rounded-3xl border border-slate-200/85 bg-white/95 shadow-2xs p-5 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-emerald-600 text-white shadow-xs">
                          <Users className="size-5" />
                        </span>
                        <span className="whitespace-nowrap rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800">
                          Bước 2 · So khớp lối sống
                        </span>
                      </div>
                      <h3 className="mt-4 min-h-[2.75rem] text-[15px] leading-snug font-bold text-slate-900">
                        Ghép bạn ở ghép tương đồng{" "}
                        <span className="inline-block">theo 5 tiêu chí sống</span>
                      </h3>
                      <p className="mt-2 text-[13px] leading-relaxed text-slate-600">
                        Đối chiếu trực tiếp khảo sát của bạn với thành viên khác để gợi ý người cùng khu vực, ngân sách và thói quen{"\u00A0"}sinh{"\u00A0"}hoạt.
                      </p>
                    </div>
                    <div className="mt-5 rounded-2xl border border-emerald-900/10 bg-[#f4faf6] p-3 text-xs space-y-2">
                      <div className="flex items-center gap-2 text-slate-700">
                        <CheckCircle2 className="size-3.5 shrink-0 text-emerald-600" />
                        <span className="truncate font-semibold text-slate-800">
                          So khớp khu vực, ngân sách, giờ giấc
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-700">
                        <CheckCircle2 className="size-3.5 shrink-0 text-emerald-600" />
                        <span className="truncate font-semibold text-emerald-800">
                          Đối chiếu mức độ sạch sẽ & lối sống
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Step 3 */}
                  <div className="rounded-3xl border border-slate-200/85 bg-white/95 shadow-2xs p-5 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-emerald-600 text-white shadow-xs">
                          <CalendarCheck className="size-5" />
                        </span>
                        <span className="whitespace-nowrap rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800">
                          Bước 3 · Hẹn & Nhận phòng
                        </span>
                      </div>
                      <h3 className="mt-4 min-h-[2.75rem] text-[15px] leading-snug font-bold text-slate-900">
                        Đặt lịch hẹn xem phòng &{" "}
                        <span className="inline-block">nhận bàn giao 2 chiều</span>
                      </h3>
                      <p className="mt-2 text-[13px] leading-relaxed text-slate-600">
                        Chọn ngày hẹn xem phòng và ngày dự kiến dọn vào. Khi nhận bàn giao thành công, phòng tự động chuyển sang trạng thái Đã{"\u00A0"}thuê.
                      </p>
                    </div>
                    <div className="mt-5 rounded-2xl border border-emerald-900/10 bg-[#f4faf6] p-3 text-xs space-y-2">
                      <div className="flex items-center gap-2 text-slate-700">
                        <CheckCircle2 className="size-3.5 shrink-0 text-emerald-600" />
                        <span className="truncate font-semibold text-slate-800">
                          Cố định mức giá lúc gửi lịch hẹn
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-700">
                        <CheckCircle2 className="size-3.5 shrink-0 text-emerald-600" />
                        <span className="truncate font-semibold text-emerald-800">
                          Lưu hợp đồng tại mục Phòng của tôi
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Step 4 */}
                  <div className="rounded-3xl border border-slate-200/85 bg-white/95 shadow-2xs p-5 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-emerald-600 text-white shadow-xs">
                          <Star className="size-5" />
                        </span>
                        <span className="whitespace-nowrap rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800">
                          Bước 4 · Điểm Uy Tín
                        </span>
                      </div>
                      <h3 className="mt-4 min-h-[2.75rem] text-[15px] leading-snug font-bold text-slate-900">
                        Đánh giá thực tế hai chiều &{" "}
                        <span className="inline-block">tích lũy Điểm Uy Tín</span>
                      </h3>
                      <p className="mt-2 text-[13px] leading-relaxed text-slate-600">
                        Sau khi nhận bàn giao phòng, bạn có quyền chấm sao, viết đánh giá thực tế và tích lũy Điểm Uy Tín cho hồ sơ cá{"\u00A0"}nhân.
                      </p>
                    </div>
                    <div className="mt-5 rounded-2xl border border-emerald-900/10 bg-[#f4faf6] p-3 text-xs space-y-2">
                      <div className="flex items-center gap-2 text-slate-700">
                        <CheckCircle2 className="size-3.5 shrink-0 text-emerald-600" />
                        <span className="truncate font-semibold text-slate-800">
                          100% đánh giá từ người thuê thật
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-700">
                        <CheckCircle2 className="size-3.5 shrink-0 text-emerald-600" />
                        <span className="truncate font-semibold text-emerald-800">
                          Cộng +15đ Uy Tín lịch sử thuê trọ
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="role-landlord-grid"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.22, ease: EASE_OUT_CURVE }}
                  className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-4"
                >
                  {/* Landlord Step 1 */}
                  <div className="rounded-3xl border border-slate-200/85 bg-white/95 shadow-2xs p-5 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-emerald-700 text-white shadow-xs">
                          <Building2 className="size-5" />
                        </span>
                        <span className="whitespace-nowrap rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800">
                          Bước 1 · Đăng tin nhanh
                        </span>
                      </div>
                      <h3 className="mt-4 min-h-[2.75rem] text-[15px] leading-snug font-bold text-slate-900">
                        Đăng phòng trực quan &{" "}
                        <span className="inline-block">không lo hết hạn tin</span>
                      </h3>
                      <p className="mt-2 text-[13px] leading-relaxed text-slate-600">
                        Nhập rõ diện tích, sức chứa tối đa và biểu phí. Tin đăng luôn hiển thị cho đến khi có khách nhận phòng hoặc bạn tạm{"\u00A0"}ẩn.
                      </p>
                    </div>
                    <div className="mt-5 rounded-2xl border border-emerald-900/10 bg-[#f4faf6] p-3 text-xs space-y-2">
                      <div className="flex items-center gap-2 text-slate-700">
                        <CheckCircle2 className="size-3.5 shrink-0 text-emerald-600" />
                        <span className="truncate font-semibold text-slate-800">
                          Không tự động ẩn tin sau 30 ngày
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-700">
                        <CheckCircle2 className="size-3.5 shrink-0 text-emerald-600" />
                        <span className="truncate font-semibold text-emerald-800">
                          Tự do bật/tắt hiển thị bất kỳ lúc nào
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Landlord Step 2 */}
                  <div className="rounded-3xl border border-slate-200/85 bg-white/95 shadow-2xs p-5 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-emerald-700 text-white shadow-xs">
                          <FileCheck2 className="size-5" />
                        </span>
                        <span className="whitespace-nowrap rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800">
                          Bước 2 · Duyệt khách thuê
                        </span>
                      </div>
                      <h3 className="mt-4 min-h-[2.75rem] text-[15px] leading-snug font-bold text-slate-900">
                        Xem trước hồ sơ &{" "}
                        <span className="inline-block">Điểm Uy Tín khách thuê</span>
                      </h3>
                      <p className="mt-2 text-[13px] leading-relaxed text-slate-600">
                        Trước khi duyệt lịch hẹn xem phòng, chủ trọ nắm rõ Điểm Uy Tín, trạng thái CCCD, nơi học tập/làm việc và lời nhắn của{"\u00A0"}khách.
                      </p>
                    </div>
                    <div className="mt-5 rounded-2xl border border-emerald-900/10 bg-[#f4faf6] p-3 text-xs space-y-2">
                      <div className="flex items-center gap-2 text-slate-700">
                        <CheckCircle2 className="size-3.5 shrink-0 text-emerald-600" />
                        <span className="truncate font-semibold text-slate-800">
                          Kiểm tra rõ trạng thái xác minh CCCD
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-700">
                        <CheckCircle2 className="size-3.5 shrink-0 text-emerald-600" />
                        <span className="truncate font-semibold text-emerald-800">
                          Chủ động duyệt hoặc từ chối lịch hẹn
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Landlord Step 3 */}
                  <div className="rounded-3xl border border-slate-200/85 bg-white/95 shadow-2xs p-5 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-emerald-700 text-white shadow-xs">
                          <CheckCircle2 className="size-5" />
                        </span>
                        <span className="whitespace-nowrap rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800">
                          Bước 3 · Đẩy tin nổi bật
                        </span>
                      </div>
                      <h3 className="mt-4 min-h-[2.75rem] text-[15px] leading-snug font-bold text-slate-900">
                        Đẩy tin nổi bật minh bạch{" "}
                        <span className="inline-block">lên đầu trang tìm kiếm</span>
                      </h3>
                      <p className="mt-2 text-[13px] leading-relaxed text-slate-600">
                        Khi kích hoạt đẩy tin 7 ngày, phòng được gắn huy hiệu Nổi bật và ưu tiên hiển thị ở đầu danh sách theo thời điểm mới{"\u00A0"}nhất.
                      </p>
                    </div>
                    <div className="mt-5 rounded-2xl border border-emerald-900/10 bg-[#f4faf6] p-3 text-xs space-y-2">
                      <div className="flex items-center gap-2 text-slate-700">
                        <CheckCircle2 className="size-3.5 shrink-0 text-emerald-600" />
                        <span className="truncate font-semibold text-slate-800">
                          Ưu tiên hiển thị ngay trên trang chủ
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-700">
                        <CheckCircle2 className="size-3.5 shrink-0 text-emerald-600" />
                        <span className="truncate font-semibold text-emerald-800">
                          Tiếp cận nhanh người thuê đúng quận
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Landlord Step 4 */}
                  <div className="rounded-3xl border border-slate-200/85 bg-white/95 shadow-2xs p-5 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-emerald-700 text-white shadow-xs">
                          <ShieldCheck className="size-5" />
                        </span>
                        <span className="whitespace-nowrap rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800">
                          Bước 4 · Quản lý tự động
                        </span>
                      </div>
                      <h3 className="mt-4 min-h-[2.75rem] text-[15px] leading-snug font-bold text-slate-900">
                        Tự động khóa tin đăng{" "}
                        <span className="inline-block">ngay khi bàn giao phòng</span>
                      </h3>
                      <p className="mt-2 text-[13px] leading-relaxed text-slate-600">
                        Khi xác nhận bàn giao phòng cho khách, hệ thống tự động chuyển phòng sang Đã thuê để bạn không bị làm phiền bởi cuộc gọi hỏi{"\u00A0"}phòng.
                      </p>
                    </div>
                    <div className="mt-5 rounded-2xl border border-emerald-900/10 bg-[#f4faf6] p-3 text-xs space-y-2">
                      <div className="flex items-center gap-2 text-slate-700">
                        <CheckCircle2 className="size-3.5 shrink-0 text-emerald-600" />
                        <span className="truncate font-semibold text-slate-800">
                          Tự gỡ khỏi danh sách khi đủ khách
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-700">
                        <CheckCircle2 className="size-3.5 shrink-0 text-emerald-600" />
                        <span className="truncate font-semibold text-emerald-800">
                          Mở lại tin 1 chạm khi khách trả phòng
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </section>

        {/* ===== POLICIES, TRUSTSCORE & LEGAL PROTECTION ===== */}
        <section id="policies" className="mx-auto max-w-7xl px-5 py-14 sm:px-8 lg:py-20">
          <div className="grid gap-8 lg:grid-cols-12 lg:items-start">
            {/* Left overview + Policy Tab Selector */}
            <div className="lg:col-span-5">
              <div className="inline-flex items-center gap-2 rounded-full bg-emerald-100/80 px-3.5 py-1 text-xs font-bold text-emerald-900">
                <Scale className="size-3.5" />
                Chính sách & Cam kết bảo vệ người dùng
              </div>
              <h2 className="font-display mt-3.5 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
                Minh bạch quy định ngay từ trang chủ
              </h2>
              <p className="mt-2.5 text-sm leading-relaxed text-slate-600">
                Chúng tôi công khai rõ cách tính điểm uy tín, quy trình bàn giao phòng và chế tài xử lý vi phạm để bạn yên tâm trước khi tham gia.
              </p>

              <div className="mt-5 space-y-2.5">
                {[
                  {
                    id: "trustscore" as const,
                    title: "1. Điểm Uy Tín (0 – 100 điểm) & Xác minh CCCD",
                    desc: "4 nhóm tiêu chí đánh giá độ tin cậy của tài khoản",
                    icon: ShieldCheck,
                  },
                  {
                    id: "workflow" as const,
                    title: "2. Chính sách Hẹn xem phòng, Nhận phòng & Đánh giá",
                    desc: "Bảo vệ quyền lợi hai bên và ngăn chặn đánh giá ảo",
                    icon: CalendarCheck,
                  },
                  {
                    id: "strikes" as const,
                    title: "3. Quy định Xử lý Vi phạm 3 cấp độ & Bảo mật dữ liệu",
                    desc: "Chế tài khóa tài khoản đăng phòng ảo, thu sai phí cam kết",
                    icon: AlertTriangle,
                  },
                ].map((tab) => {
                  const Icon = tab.icon;
                  const active = activePolicyTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActivePolicyTab(tab.id)}
                      className={`w-full rounded-2xl border p-3.5 text-left transition-all duration-150 cursor-pointer flex items-start gap-3 ${
                        active
                          ? "border-emerald-600 bg-white shadow-xs ring-2 ring-emerald-500/10"
                          : "border-slate-200/80 bg-white/60 hover:bg-white hover:border-slate-300"
                      }`}
                    >
                      <span
                        className={`mt-0.5 grid size-8 shrink-0 place-items-center rounded-xl ${
                          active ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        <Icon className="size-4" />
                      </span>
                      <div>
                        <p className="text-sm font-bold text-slate-900">{tab.title}</p>
                        <p className="mt-0.5 text-xs text-slate-500">{tab.desc}</p>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="mt-5 flex items-center gap-4 text-xs font-semibold text-emerald-800">
                <Link to="/about?tab=privacy" className="hover:underline flex items-center gap-1">
                  Xem toàn văn Điều khoản & Chính sách <ArrowRight className="size-3.5" />
                </Link>
              </div>
            </div>

            {/* Right Interactive Policy Detail Card */}
            <div className="lg:col-span-7">
              <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-xs sm:p-7">
                <AnimatePresence mode="wait" initial={false}>
                  {activePolicyTab === "trustscore" && (
                    <motion.div
                      key="policy-trustscore"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.2, ease: EASE_OUT_CURVE }}
                      className="space-y-5"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-4">
                        <div>
                          <h3 className="text-lg font-extrabold text-slate-900">
                            Cơ chế Điểm Uy Tín (Thang điểm 100)
                          </h3>
                          <p className="mt-0.5 text-xs text-slate-500">
                            Hiển thị công khai trên hồ sơ Chủ trọ và Người thuê, được cộng tự động từ thông tin xác{"\u00A0"}thực:
                          </p>
                        </div>
                        <span className="rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-xs font-bold text-emerald-800 tabular-nums">
                          Tối đa 100 điểm
                        </span>
                      </div>

                      <div className="grid gap-3.5 sm:grid-cols-2">
                        <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
                          <div className="flex items-center justify-between text-sm font-bold text-slate-900">
                            <span>1. Xác thực danh tính</span>
                            <span className="text-emerald-700 tabular-nums">35 điểm</span>
                          </div>
                          <p className="mt-1.5 text-xs leading-relaxed text-slate-600">
                            Xác thực Email/Số điện thoại (+10đ) và hoàn tất đối soát CCCD được Quản trị viên duyệt (+25đ, gắn huy hiệu Đã xác minh{"\u00A0"}CCCD).
                          </p>
                        </div>

                        <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
                          <div className="flex items-center justify-between text-sm font-bold text-slate-900">
                            <span>2. Hồ sơ & Ảnh thực tế</span>
                            <span className="text-emerald-700 tabular-nums">35 điểm</span>
                          </div>
                          <p className="mt-1.5 text-xs leading-relaxed text-slate-600">
                            Có ảnh đại diện (+5đ), giới thiệu bản thân (+10đ), trường học/nơi làm việc (+10đ) và tiêu chí khu vực, ngân{"\u00A0"}sách{"\u00A0"}(+10đ).
                          </p>
                        </div>

                        <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
                          <div className="flex items-center justify-between text-sm font-bold text-slate-900">
                            <span>3. Đánh giá cộng đồng</span>
                            <span className="text-emerald-700 tabular-nums">15 điểm</span>
                          </div>
                          <p className="mt-1.5 text-xs leading-relaxed text-slate-600">
                            Điểm trung bình từ các đánh giá 2 chiều hợp lệ sau khi ở thực tế và lịch sử hoạt động văn minh, không vi phạm quy{"\u00A0"}tắc.
                          </p>
                        </div>

                        <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
                          <div className="flex items-center justify-between text-sm font-bold text-slate-900">
                            <span>4. Lịch sử nhận phòng</span>
                            <span className="text-emerald-700 tabular-nums">15 điểm</span>
                          </div>
                          <p className="mt-1.5 text-xs leading-relaxed text-slate-600">
                            Hoàn tất bàn giao nhận phòng thực tế trên hệ thống và duy trì lịch sử hợp đồng thuê trọ minh{"\u00A0"}bạch.
                          </p>
                        </div>
                      </div>

                      <div className="rounded-2xl border border-emerald-200/80 bg-emerald-50/60 p-4 text-xs leading-relaxed text-emerald-950 flex items-start gap-3">
                        <Lock className="size-4 text-emerald-700 shrink-0 mt-0.5" />
                        <div>
                          <strong>Bảo mật tuyệt đối giấy tờ tùy thân:</strong> Hình ảnh và thông tin CCCD chỉ dùng duy nhất cho việc đối soát danh tính của Quản trị viên, được bảo mật nghiêm ngặt và không hiển thị công khai cho bất kỳ người dùng nào{"\u00A0"}khác.
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {activePolicyTab === "workflow" && (
                    <motion.div
                      key="policy-workflow"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.2, ease: EASE_OUT_CURVE }}
                      className="space-y-5"
                    >
                      <div className="border-b border-slate-100 pb-4">
                        <h3 className="text-lg font-extrabold text-slate-900">
                          Quy trình Đặt lịch xem phòng, Nhận bàn giao & Bảo vệ hợp đồng
                        </h3>
                        <p className="mt-0.5 text-xs text-slate-500">
                          Mọi thao tác từ lúc gửi yêu cầu đến khi thanh lý hợp đồng đều được ghi nhận rõ ràng cho cả hai{"\u00A0"}bên:
                        </p>
                      </div>

                      <div className="space-y-3.5">
                        <div className="flex gap-3.5 rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
                          <span className="grid size-7 shrink-0 place-items-center rounded-full bg-emerald-600 text-xs font-bold text-white">
                            1
                          </span>
                          <div>
                            <h4 className="text-sm font-bold text-slate-900">
                              Đặt lịch hẹn xem phòng & cố định mức giá niêm yết
                            </h4>
                            <p className="mt-1 text-xs leading-relaxed text-slate-600">
                              Người thuê chọn ngày hẹn xem phòng trực tiếp kèm ngày dự kiến dọn vào. Hệ thống ghi nhận ngay mức giá thuê và tiền cọc tại thời điểm gửi yêu cầu để tránh việc tự ý tăng giá khi khách đến{"\u00A0"}xem.
                            </p>
                          </div>
                        </div>

                        <div className="flex gap-3.5 rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
                          <span className="grid size-7 shrink-0 place-items-center rounded-full bg-emerald-600 text-xs font-bold text-white">
                            2
                          </span>
                          <div>
                            <h4 className="text-sm font-bold text-slate-900">
                              Chủ trọ duyệt lịch hẹn → Nhận bàn giao → Tự động đóng tin phòng
                            </h4>
                            <p className="mt-1 text-xs leading-relaxed text-slate-600">
                              Khi chủ trọ duyệt yêu cầu, hệ thống báo ngay cho người thuê. Sau khi xem phòng và xác nhận bàn giao nhận phòng thực tế, hợp đồng có hiệu lực và tin phòng tự động chuyển sang trạng thái <strong>Đã{"\u00A0"}thuê</strong>.
                            </p>
                          </div>
                        </div>

                        <div className="flex gap-3.5 rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
                          <span className="grid size-7 shrink-0 place-items-center rounded-full bg-emerald-600 text-xs font-bold text-white">
                            3
                          </span>
                          <div>
                            <h4 className="text-sm font-bold text-slate-900">
                              Chỉ người đã nhận phòng thực tế mới được viết đánh giá
                            </h4>
                            <p className="mt-1 text-xs leading-relaxed text-slate-600">
                              Để ngăn chặn đánh giá ảo hoặc chơi xấu giữa các chủ trọ, chỉ người thuê có hợp đồng đã hoàn tất nhận phòng thực tế tại phòng đó mới có quyền đăng đánh giá công{"\u00A0"}khai.
                            </p>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {activePolicyTab === "strikes" && (
                    <motion.div
                      key="policy-strikes"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.2, ease: EASE_OUT_CURVE }}
                      className="space-y-5"
                    >
                    <div className="border-b border-slate-100 pb-4">
                      <h3 className="text-lg font-extrabold text-slate-900">
                        Quy định Kiểm soát Vi phạm 3 cấp độ
                      </h3>
                      <p className="mt-0.5 text-xs text-slate-500">
                        Áp dụng nghiêm ngặt đối với hành vi đăng phòng ảo, hình ảnh sai thực tế, thu sai phí cam kết hoặc quấy rối thành viên:
                      </p>
                    </div>

                    <div className="grid gap-3.5 sm:grid-cols-3">
                      <div className="rounded-2xl border border-amber-200/80 bg-amber-50/50 p-4 flex flex-col justify-between">
                        <div>
                          <span className="inline-block rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-bold text-amber-900">
                            Vi phạm lần 1
                          </span>
                          <p className="mt-2 text-sm font-bold text-slate-900">
                            Nhắc nhở & Trừ 15đ
                          </p>
                          <p className="mt-1 text-xs leading-relaxed text-slate-600">
                            Gỡ nội dung sai quy định, trừ 15 điểm uy tín và gửi cảnh báo chính thức vào tài{"\u00A0"}khoản.
                          </p>
                        </div>
                      </div>

                      <div className="rounded-2xl border border-orange-200/80 bg-orange-50/50 p-4 flex flex-col justify-between">
                        <div>
                          <span className="inline-block rounded-full bg-orange-100 px-2.5 py-0.5 text-[11px] font-bold text-orange-900">
                            Vi phạm lần 2
                          </span>
                          <p className="mt-2 text-sm font-bold text-slate-900">
                            Cảnh cáo & Trừ 25đ
                          </p>
                          <p className="mt-1 text-xs leading-relaxed text-slate-600">
                            Gỡ tin đăng sai phạm, trừ tiếp 25 điểm uy tín và hạn chế quyền ưu tiên hiển{"\u00A0"}thị.
                          </p>
                        </div>
                      </div>

                      <div className="rounded-2xl border border-red-200/80 bg-red-50/50 p-4 flex flex-col justify-between">
                        <div>
                          <span className="inline-block rounded-full bg-red-100 px-2.5 py-0.5 text-[11px] font-bold text-red-900">
                            Vi phạm lần 3
                          </span>
                          <p className="mt-2 text-sm font-bold text-slate-900">
                            Khóa vĩnh viễn (0đ)
                          </p>
                          <p className="mt-1 text-xs leading-relaxed text-slate-600">
                            Khóa tài khoản, ẩn toàn bộ phòng đang đăng và đưa điểm uy tín về 0 để bảo vệ cộng{"\u00A0"}đồng.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-xs leading-relaxed text-slate-600">
                      <strong className="text-slate-900">Căn cứ pháp lý & Điều khoản dịch vụ trả phí:</strong> Theo Điều 423, Điều 428 Bộ luật Dân sự 2015 và Nghị định 52/2013/NĐ-CP (sửa đổi bởi Nghị định 85/2021/NĐ-CP), tài khoản bị khóa do đạt mức vi phạm lần 3 sẽ không được hoàn lại phí các gói dịch vụ đẩy tin/VIP đã mua. Người dùng có quyền gửi khiếu nại kèm bằng chứng đối chất trong vòng 07{"\u00A0"}ngày.
                    </div>
                  </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </section>

        {/* ===== REAL COMMUNITY FEEDBACKS & INTERACTIVE FAQ ===== */}
        <section className="bg-white/60 backdrop-blur-[2px] py-14 lg:py-20 border-t border-slate-200/70">
          <div className="mx-auto max-w-7xl px-5 sm:px-8">
            <div className="grid gap-10 lg:grid-cols-12">
              {/* Left 6 cols: Real System Feedbacks from API */}
              <div className="lg:col-span-6">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-xs font-bold text-emerald-800">
                  <CheckCircle2 className="size-3.5 text-emerald-600" />
                  Đánh giá xác thực
                </span>
                <h2 className="font-display mt-3 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
                  Phản hồi thực tế từ thành viên
                </h2>
                <p className="mt-1.5 text-sm text-slate-600">
                  Nhận xét được trích xuất trực tiếp từ các tài khoản thật đang sử dụng nền tảng.
                </p>

                {feedbacks.length > 0 ? (
                  <div className="mt-5 space-y-3.5">
                    {feedbacks.slice(0, 3).map((fb) => (
                      <div
                        key={fb.id}
                        className="rounded-2xl border border-slate-200/80 bg-[#f8faf9] p-4 transition-colors hover:border-emerald-300"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1 text-amber-500">
                            {Array.from({ length: Math.min(5, Math.max(1, fb.rating || 5)) }).map(
                              (_, idx) => (
                                <Star key={idx} className="size-3.5 fill-current" />
                              )
                            )}
                          </div>
                          <span className="rounded-full bg-white border border-slate-200 px-2.5 py-0.5 text-[11px] font-semibold text-slate-600">
                            {fb.userRole === "LANDLORD" ? "Chủ nhà trọ" : "Người thuê trọ"}
                          </span>
                        </div>
                        <p className="mt-2.5 text-sm leading-relaxed text-slate-800">
                          "{fb.comment}"
                        </p>
                        <div className="mt-2.5 flex items-center justify-between text-xs text-slate-500">
                          <span className="font-bold text-slate-800">{fb.userName}</span>
                          {fb.createdAt && (
                            <span className="tabular-nums">
                              {new Date(fb.createdAt).toLocaleDateString("vi-VN")}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="mt-5 rounded-3xl border border-slate-200/80 bg-[#f8faf9] p-6 space-y-4">
                    <div className="flex items-start gap-3.5">
                      <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-emerald-600 text-white">
                        <ShieldCheck className="size-5" />
                      </span>
                      <div>
                        <h3 className="text-base font-bold text-slate-900">
                          Cam kết 100% không tự tạo đánh giá giả
                        </h3>
                        <p className="mt-1 text-xs leading-relaxed text-slate-600">
                          Phòng Trọ Xanh không hiển thị nhận xét mẫu tự bịa. Chỉ người thuê đã hoàn tất nhận phòng thực tế hoặc thành viên đã xác thực trên hệ thống mới có thể gửi đánh giá công khai.
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-1">
                      <div className="rounded-2xl bg-white p-3.5 border border-slate-200/70">
                        <p className="text-xs font-bold text-emerald-800">Đánh giá 2 chiều</p>
                        <p className="mt-1 text-[11px] text-slate-500 leading-relaxed">
                          Người thuê đánh giá phòng & chủ trọ; chủ trọ đánh giá ý thức người thuê.
                        </p>
                      </div>
                      <div className="rounded-2xl bg-white p-3.5 border border-slate-200/70">
                        <p className="text-xs font-bold text-emerald-800">Gắn nhãn Đã ở thực tế</p>
                        <p className="mt-1 text-[11px] text-slate-500 leading-relaxed">
                          Mọi nhận xét trên trang phòng đều đối chiếu từ hợp đồng thuê thật.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Right 6 cols: Practical FAQ Accordion */}
              <div id="faq" className="lg:col-span-6">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
                  Câu hỏi thường gặp (FAQ)
                </span>
                <h2 className="font-display mt-3 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
                  Giải đáp nhanh trước khi bắt đầu
                </h2>
                <p className="mt-1.5 text-sm text-slate-600">
                  Những câu hỏi thực tế nhất từ người thuê và chủ trọ khi sử dụng hệ thống.
                </p>

                <div className="mt-5 space-y-2.5">
                  {[
                    {
                      q: "Người đi thuê tìm phòng và ghép bạn ở ghép có mất phí không?",
                      a: "Hoàn toàn miễn phí. Bạn được tạo hồ sơ, lọc phòng theo khu vực, xem bản đồ giá, gửi yêu cầu hẹn xem phòng và quẹt tìm bạn ở ghép miễn phí mỗi ngày.",
                    },
                    {
                      q: "Làm sao biết phòng trên web còn trống thật và ở được tối đa mấy người?",
                      a: "Mỗi phòng đều hiển thị rõ Số người ở tối đa ngay trên thẻ phòng. Tin đăng chỉ hiển thị khi phòng đang thực sự mở cho thuê: ngay khi có khách xác nhận nhận bàn giao phòng (hoặc chủ trọ tạm ẩn), phòng tự động chuyển sang trạng thái Đã thuê và ẩn khỏi danh sách tìm kiếm.",
                    },
                    {
                      q: "Chủ trọ đăng phòng có bị tự động hết hạn sau 30 ngày không?",
                      a: "Không. Tin đăng của chủ trọ luôn được giữ hiển thị miễn là phòng đang ở trạng thái Còn trống, giúp chủ trọ không tốn công vào gia hạn thủ công. Khi đã đủ người thuê, hệ thống tự động đóng tin hoặc chủ trọ có thể bấm Tạm ẩn bất kỳ lúc nào.",
                    },
                    {
                      q: "Khi chủ trọ bấm duyệt yêu cầu xem & thuê phòng của tôi thì sao?",
                      a: "Tài khoản của bạn sẽ nhận được thông báo ngay lập tức. Bạn vào mục 'Phòng của tôi' để xem lịch hẹn, thông tin liên hệ chủ trọ và bấm xác nhận nhận bàn giao khi chính thức dọn vào ở.",
                    },
                    {
                      q: "Nếu nhiều chủ trọ cùng đẩy tin nổi bật thì thứ tự hiển thị thế nào?",
                      a: "Các phòng đang trong thời hạn đẩy tin 7 ngày sẽ được gắn huy hiệu Nổi bật và xếp lên đầu danh sách theo thứ tự thời điểm kích hoạt đẩy tin mới nhất, tiếp đến là điểm uy tín của chủ trọ.",
                    },
                  ].map((item, idx) => {
                    const isOpen = openFaqIdx === idx;
                    return (
                      <div
                        key={item.q}
                        className="overflow-hidden rounded-2xl border border-slate-200/90 bg-[#f8faf9] transition-colors"
                      >
                        <button
                          type="button"
                          onClick={() => setOpenFaqIdx(isOpen ? null : idx)}
                          className="flex w-full items-center justify-between gap-4 px-4 py-3.5 text-left text-sm font-bold text-slate-900 hover:bg-slate-100/70 cursor-pointer"
                        >
                          <span>{item.q}</span>
                          <ChevronDown
                            className={`size-4 shrink-0 text-slate-500 transition-transform duration-200 ${
                              isOpen ? "rotate-180 text-emerald-700" : ""
                            }`}
                          />
                        </button>
                        <AnimatePresence initial={false}>
                          {isOpen && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.2, ease: EASE_OUT_CURVE }}
                            >
                              <div className="border-t border-slate-200/60 bg-white px-4 py-3.5 text-xs leading-relaxed text-slate-600 sm:text-sm">
                                {item.a}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ===== CLEAN LIGHT ARCHITECTURAL CTA BANNER ===== */}
        <section className="mx-auto max-w-7xl px-5 py-12 sm:px-8 lg:py-16">
          <div className="rounded-[2rem] border border-emerald-600/20 bg-[#f2f9f5] p-6 sm:p-10 lg:p-12 shadow-2xs">
            <div className="flex flex-col items-start justify-between gap-6 lg:flex-row lg:items-center">
              <div className="max-w-2xl">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-600/20 bg-white px-3 py-1 text-xs font-bold text-emerald-800">
                  <ShieldCheck className="size-3.5 text-emerald-600" />
                  Hoàn toàn miễn phí khi bắt đầu
                </span>
                <h2 className="font-display mt-3 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
                  Sẵn sàng tìm phòng minh bạch hoặc đăng phòng cho thuê?
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-slate-600 sm:text-base">
                  Tạo tài khoản trong 1 phút để mở khóa bộ lọc chi tiết, xem bản đồ giá trực quan, ghép bạn cùng phòng hoặc đăng tin cho thuê hoàn toàn miễn phí.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3 shrink-0">
                <Link
                  to={getStartLink()}
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-3.5 text-sm font-bold text-white shadow-xs transition-all duration-150 hover:bg-emerald-700 active:scale-[0.98]"
                >
                  {user ? "Vào ứng dụng ngay" : "Đăng ký tài khoản ngay"}
                  <ArrowRight className="size-4" />
                </Link>
                {!user && (
                  <Link
                    to="/login"
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-6 py-3.5 text-sm font-semibold text-slate-800 transition-all duration-150 hover:border-emerald-600 hover:text-emerald-800 active:scale-[0.98]"
                  >
                    Đăng nhập
                  </Link>
                )}
              </div>
            </div>
          </div>
        </section>

          <Footer />
        </div>
        <AuthPromptModal
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
        />
      </main>
    </PageTransition>
  );
}

/* ── Zero-Lag Native 2D Canvas Particle Backdrop (Synced with Login Page Aesthetic, 0 KB Extra Bundle) ── */

interface AmbientParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  shape: "circle" | "square";
  rot: number;
  vRot: number;
  depth: number;
  phase: number;
  freq: number;
}

const PARTICLE_COLORS = ["#10b981", "#059669", "#34d399", "#0d9488", "#6ee7b7"] as const;

function drawRoundedSquare(
  ctx: CanvasRenderingContext2D,
  half: number,
  radius: number
) {
  const r = Math.min(radius, half);
  ctx.beginPath();
  ctx.moveTo(-half + r, -half);
  ctx.lineTo(half - r, -half);
  ctx.quadraticCurveTo(half, -half, half, -half + r);
  ctx.lineTo(half, half - r);
  ctx.quadraticCurveTo(half, half, half - r, half);
  ctx.lineTo(-half + r, half);
  ctx.quadraticCurveTo(-half, half, -half, half - r);
  ctx.lineTo(-half, -half + r);
  ctx.quadraticCurveTo(-half, -half, -half + r, -half);
  ctx.closePath();
  ctx.fill();
}

function LandingAmbientBackdrop() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    let width = window.innerWidth;
    let height = window.innerHeight;
    let dpr = Math.min(window.devicePixelRatio || 1, 2);

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();

    // Scale particle count smoothly by viewport width (64 on mobile -> 120 on desktop)
    const count = width < 640 ? 64 : width < 1024 ? 92 : 120;
    const particles: AmbientParticle[] = Array.from({ length: count }, (_, i) => {
      const inOuterFlank = i % 3 !== 0;
      let normX = Math.random();
      if (inOuterFlank) {
        normX = Math.random() < 0.5 ? Math.random() * 0.28 : 0.72 + Math.random() * 0.28;
      }
      const isSquare = i % 5 === 1;
      const depth = 0.45 + Math.random() * 0.85;
      const baseAlpha = inOuterFlank
        ? 0.26 + Math.random() * 0.26
        : 0.15 + Math.random() * 0.16;

      return {
        x: normX * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.55 * depth,
        vy: (-0.38 - Math.random() * 0.52) * depth,
        size: isSquare ? 6.5 + Math.random() * 5.5 : 4.0 + Math.random() * 5.5,
        color: PARTICLE_COLORS[i % PARTICLE_COLORS.length],
        alpha: baseAlpha,
        shape: isSquare ? "square" : "circle",
        rot: Math.random() * Math.PI * 2,
        vRot: (i % 2 === 0 ? 1 : -1) * (0.008 + Math.random() * 0.012),
        depth,
        phase: Math.random() * Math.PI * 2,
        freq: 0.0011 + Math.random() * 0.001,
      };
    });

    let targetMouseX = 0;
    let targetMouseY = 0;
    let currentMouseX = 0;
    let currentMouseY = 0;

    const onPointerMove = (e: PointerEvent) => {
      targetMouseX = (e.clientX / Math.max(1, width) - 0.5) * 38;
      targetMouseY = (e.clientY / Math.max(1, height) - 0.5) * 28;
    };

    let rafId = 0;
    let isRunning = false;
    let lastTime = performance.now();

    const renderFrame = (now: number) => {
      const dt = Math.min(32, Math.max(8, now - lastTime)) / 16.667;
      lastTime = now;

      ctx.clearRect(0, 0, width, height);

      currentMouseX += (targetMouseX - currentMouseX) * 0.05 * dt;
      currentMouseY += (targetMouseY - currentMouseY) * 0.05 * dt;

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        p.x += (p.vx + Math.sin(now * p.freq + p.phase) * 0.32 * p.depth) * dt;
        p.y += (p.vy + Math.cos(now * p.freq + p.phase) * 0.16 * p.depth) * dt;
        p.rot += p.vRot * dt;

        if (p.y < -28) p.y = height + 28;
        else if (p.y > height + 28) p.y = -28;
        if (p.x < -28) p.x = width + 28;
        else if (p.x > width + 28) p.x = -28;

        const drawX = p.x + currentMouseX * p.depth;
        const drawY = p.y + currentMouseY * p.depth;

        const centerDistX = Math.abs(drawX / Math.max(1, width) - 0.5) * 2;
        const centerMask = 0.65 + 0.35 * Math.min(1, centerDistX * 1.3);
        const pulse = 0.82 + 0.18 * Math.sin(now * 0.0018 + p.phase);

        ctx.globalAlpha = p.alpha * centerMask * pulse;
        ctx.fillStyle = p.color;

        if (p.shape === "circle") {
          ctx.beginPath();
          ctx.arc(drawX, drawY, p.size * 0.5, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.save();
          ctx.translate(drawX, drawY);
          ctx.rotate(p.rot);
          drawRoundedSquare(ctx, p.size * 0.5, 2.4);
          ctx.restore();
        }
      }
      ctx.globalAlpha = 1;

      if (!document.hidden) {
        rafId = window.requestAnimationFrame(renderFrame);
      } else {
        isRunning = false;
      }
    };

    const startLoop = () => {
      if (isRunning) return;
      isRunning = true;
      lastTime = performance.now();
      rafId = window.requestAnimationFrame(renderFrame);
    };

    const stopLoop = () => {
      if (rafId) window.cancelAnimationFrame(rafId);
      isRunning = false;
    };

    const onVisibilityChange = () => {
      if (document.hidden) {
        stopLoop();
      } else {
        startLoop();
      }
    };

    window.addEventListener("resize", resize, { passive: true });
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    document.addEventListener("visibilitychange", onVisibilityChange);

    startLoop();

    return () => {
      stopLoop();
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onPointerMove);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, []);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden select-none"
    >
      {/* Layer 1: Soft Ambient Emerald & Mint Mesh Pools */}
      <div
        className="absolute -top-28 -left-24 h-[28rem] w-[28rem] rounded-full opacity-55 blur-3xl"
        style={{
          background:
            "radial-gradient(circle, rgba(16,185,129,0.13) 0%, rgba(16,185,129,0) 70%)",
        }}
      />
      <div
        className="absolute top-[22%] -right-28 h-[32rem] w-[32rem] rounded-full opacity-50 blur-3xl"
        style={{
          background:
            "radial-gradient(circle, rgba(5,150,105,0.11) 0%, rgba(5,150,105,0) 70%)",
        }}
      />
      <div
        className="absolute bottom-[-8rem] left-[18%] h-[26rem] w-[36rem] rounded-full opacity-45 blur-3xl"
        style={{
          background:
            "radial-gradient(circle, rgba(20,184,166,0.1) 0%, rgba(20,184,166,0) 70%)",
        }}
      />

      {/* Layer 2: Real-time 60fps HTML5 2D Canvas Floating Emerald Circles & Rounded Squares */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 h-full w-full"
      />
    </div>
  );
}

/* ── Featured Room Card with Multi-Image Interactive Preview & Max Occupants ── */

function FeaturedRoomCard({
  room,
  fallbackSeed,
  onSelect,
}: {
  room: any;
  fallbackSeed: number;
  onSelect: () => void;
}) {
  const images = useMemo(
    () => extractRoomImages(room, fallbackSeed),
    [room, fallbackSeed]
  );
  const [imgIdx, setImgIdx] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  const rawType = room.roomType || room.type || "PHONG_TRO";
  const typeLabel = ROOM_TYPE_LABELS[rawType] || rawType || "Phòng trọ";
  const areaVal = Number(room.areaSqm ?? room.area ?? 0);
  const maxOccupants = Number(room.maxOccupants ?? 2);
  const amenities: string[] = normalizeAmenitiesList(room.amenities).slice(0, 2);
  const isVerified = Boolean(
    room.isVerified ?? room.landlord?.verified ?? room.landlord?.isVerified ?? false
  );

  return (
    <article
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onSelect}
      className="group flex flex-col overflow-hidden rounded-3xl border border-slate-200/90 bg-white shadow-[0_8px_24px_-14px_rgba(15,23,42,0.08)] transition-all duration-200 hover:-translate-y-1 hover:border-emerald-500/40 hover:shadow-[0_18px_36px_-18px_rgba(6,95,70,0.18)] cursor-pointer"
    >
      {/* Image Container with Multi-Photo Controls */}
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-100">
        <ImageWithFallback
          src={images[imgIdx % images.length]}
          alt={room.title || "Phòng trọ"}
          className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
        />

        {/* Top Badges — Light White + Emerald harmony (No flashy AI icons) */}
        <div className="absolute left-3.5 top-3.5 flex flex-wrap items-center gap-1.5">
          <span className="rounded-full border border-emerald-900/10 bg-white/95 px-2.5 py-0.5 text-[11px] font-bold text-emerald-900 shadow-2xs backdrop-blur-md">
            {typeLabel}
          </span>
        </div>

        {/* Top-right Verified badge (Strictly truthful KYC verification) */}
        <div className="absolute right-3.5 top-3.5 flex items-center gap-1.5">
          {isVerified && (
            <span
              title="Chủ trọ đã xác minh CCCD"
              className="grid size-8 place-items-center rounded-full bg-white/95 text-emerald-700 shadow-xs backdrop-blur"
            >
              <ShieldCheck className="size-4" />
            </span>
          )}
        </div>

        {/* Multi-image Prev/Next arrows on hover when room has multiple photos */}
        {images.length > 1 && isHovered && (
          <>
            <button
              type="button"
              aria-label="Ảnh trước"
              onClick={(e) => {
                e.stopPropagation();
                setImgIdx((prev) => (prev - 1 + images.length) % images.length);
              }}
              className="absolute inset-y-0 left-2.5 z-10 my-auto grid size-7 place-items-center rounded-full bg-white/95 text-slate-800 shadow-sm transition-colors duration-150 hover:bg-white active:scale-95 cursor-pointer"
            >
              <ChevronLeft className="size-3.5" />
            </button>
            <button
              type="button"
              aria-label="Ảnh tiếp"
              onClick={(e) => {
                e.stopPropagation();
                setImgIdx((prev) => (prev + 1) % images.length);
              }}
              className="absolute inset-y-0 right-2.5 z-10 my-auto grid size-7 place-items-center rounded-full bg-white/95 text-slate-800 shadow-sm transition-colors duration-150 hover:bg-white active:scale-95 cursor-pointer"
            >
              <ChevronRight className="size-3.5" />
            </button>
          </>
        )}

        {/* Bottom Price Pill + Photo Dots */}
        <div className="absolute inset-x-3.5 bottom-3 flex items-center justify-between gap-2">
          <span className="rounded-xl border border-emerald-900/10 bg-white/95 px-3 py-1 text-xs font-extrabold text-emerald-800 shadow-xs backdrop-blur tabular-nums sm:text-sm">
            {formatPriceVND(room.price)}
          </span>

          {images.length > 1 && (
            <div className="flex items-center gap-1 rounded-full bg-white/90 px-2 py-1 shadow-2xs backdrop-blur">
              {images.slice(0, 5).map((_, dotIdx) => (
                <button
                  key={dotIdx}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setImgIdx(dotIdx);
                  }}
                  className={`h-1.5 rounded-full transition-all cursor-pointer ${
                    imgIdx % images.length === dotIdx
                      ? "w-3.5 bg-emerald-600"
                      : "w-1.5 bg-slate-300"
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Card Body */}
      <div className="flex flex-1 flex-col justify-between p-5">
        <div>
          <h3 className="line-clamp-1 text-base font-bold text-slate-900 group-hover:text-emerald-800 transition-colors">
            {room.title || "Phòng trọ tiện nghi"}
          </h3>

          <p className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-slate-500">
            <MapPin className="size-3.5 shrink-0 text-emerald-600" />
            <span className="truncate">
              {room.addressStreet
                ? `${room.addressStreet}, ${room.district || "TP. HCM"}`
                : `${room.district || "TP. HCM"}, TP. HCM`}
            </span>
          </p>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3.5">
          <div className="flex flex-wrap items-center gap-1.5">
            {areaVal > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold text-slate-700 tabular-nums">
                <Maximize2 className="size-3 text-slate-500" />
                {areaVal} m²
              </span>
            )}
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold text-slate-700 tabular-nums">
              <Users className="size-3 text-emerald-600" />
              Tối đa {maxOccupants} người
            </span>
            {amenities.slice(0, 1).map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-emerald-50 border border-emerald-200/60 px-2.5 py-0.5 text-[11px] font-medium text-emerald-800"
              >
                {tag}
              </span>
            ))}
          </div>

          <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 group-hover:translate-x-0.5 transition-transform">
            Xem phòng
            <ArrowRight className="size-3.5" />
          </span>
        </div>
      </div>
    </article>
  );
}

/* ── Sticky Landing Navbar ── */

interface LandingNavbarProps {
  user: any;
  role: string | null;
}

function LandingNavbar({ user, role }: LandingNavbarProps) {
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState<string>("");
  const [pillMetrics, setPillMetrics] = useState<{
    left: number;
    width: number;
    visible: boolean;
  }>({ left: 0, width: 0, visible: false });
  const linkRefs = useRef<Record<string, HTMLAnchorElement | null>>({});
  const loc = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();

  const guestSectionLinks = [
    { label: "Tìm phòng", href: "#featured-rooms" },
    { label: "Cách hoạt động", href: "#how" },
    { label: "Chính sách & Cam kết", href: "#policies" },
    { label: "Hỏi đáp (FAQ)", href: "#faq" },
  ];

  const authLinks =
    role === "landlord"
      ? [
          { label: "Bảng quản lý", to: "/landlord" },
          { label: "Phòng trọ", to: "/landlord?tab=rooms" },
          { label: "Đăng phòng", to: "/landlord?tab=post" },
          { label: "Khách thuê", to: "/landlord?tab=tenants" },
          { label: "Tin nhắn", to: "/landlord?tab=chat" },
        ]
      : role === "admin"
      ? [
          { label: "Bảng quản trị", to: "/admin" },
          { label: "Duyệt CCCD", to: "/admin/cccd" },
          { label: "Người dùng", to: "/admin/users" },
          { label: "Báo cáo", to: "/admin/reports" },
        ]
      : [
          { label: "Tìm phòng", to: "/discover" },
          { label: "Ghép bạn", to: "/roommates" },
          { label: "Phòng của tôi", to: "/rentals/me" },
          { label: "Tin nhắn", to: "/chat" },
        ];

  useEffect(() => {
    const sectionIds = ["featured-rooms", "how", "policies", "faq"];
    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 12);

      // Do not let intermediate scroll positions override activeSection while programmatic smooth-scroll is running
      if (activeScrollRafId !== null) return;

      if (y < 260) {
        setActiveSection("");
        return;
      }

      let current = "";
      for (const id of sectionIds) {
        const el = document.getElementById(id);
        if (!el) continue;
        const rect = el.getBoundingClientRect();
        if (rect.top <= 180) {
          current = `#${id}`;
        }
      }
      setActiveSection(current);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Measure active link offsetLeft/offsetWidth relative to nav container (immune to scrollY / layoutId jitter)
  useEffect(() => {
    const updatePill = () => {
      if (!activeSection) {
        setPillMetrics((prev) => (prev.visible ? { ...prev, visible: false } : prev));
        return;
      }
      const targetEl = linkRefs.current[activeSection];
      if (!targetEl) {
        setPillMetrics((prev) => (prev.visible ? { ...prev, visible: false } : prev));
        return;
      }
      setPillMetrics({
        left: targetEl.offsetLeft,
        width: targetEl.offsetWidth,
        visible: true,
      });
    };

    updatePill();
    window.addEventListener("resize", updatePill, { passive: true });
    return () => window.removeEventListener("resize", updatePill);
  }, [activeSection]);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
        scrolled
          ? "bg-white/72 backdrop-blur-md border-b border-slate-200/75 shadow-[0_4px_20px_-12px_rgba(6,95,70,0.15)]"
          : "bg-transparent border-b border-transparent"
      }`}
    >
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-8">
        {/* Brand Logo */}
        <Link
          to="/"
          onClick={(e) => {
            if (loc.pathname === "/") {
              e.preventDefault();
              setActiveSection("");
              smoothScrollToY(0);
            }
          }}
          className="flex items-center gap-2.5 group"
        >
          <span className="grid size-9 place-items-center rounded-xl bg-emerald-600 text-white shadow-[0_6px_16px_-6px_rgba(5,150,105,0.65)] transition-transform duration-150 group-hover:scale-105">
            <svg width="18" height="18" viewBox="0 0 32 32" fill="currentColor">
              <path d="M16 6l10 7.5V26h-6.5v-7.5h-7V26H6V13.5L16 6z" />
            </svg>
          </span>
          <span className="font-display text-lg font-extrabold tracking-tight text-emerald-950 sm:text-xl">
            Phòng Trọ Xanh
          </span>
        </Link>

        {/* Center Navigation */}
        <div className="relative hidden items-center gap-1 md:flex">
          {!user && (
            <span
              aria-hidden="true"
              style={{
                transform: `translate3d(${pillMetrics.left}px, 0, 0)`,
                width: `${pillMetrics.width}px`,
                opacity: pillMetrics.visible ? 1 : 0,
              }}
              className="pointer-events-none absolute inset-y-0 left-0 rounded-full bg-emerald-100/85 border border-emerald-600/20 transition-[transform,width,opacity] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] will-change-[transform,width,opacity]"
            />
          )}
          {!user
            ? guestSectionLinks.map((item) => {
                const isActive = activeSection === item.href;
                return (
                  <a
                    key={item.label}
                    ref={(el) => {
                      linkRefs.current[item.href] = el;
                    }}
                    href={item.href}
                    onClick={(e) => {
                      e.preventDefault();
                      setActiveSection(item.href);
                      // #faq is inside a 2-column section, so use slightly larger top breathing room
                      const offset = item.href === "#faq" ? 96 : 68;
                      smoothScrollToElement(item.href, offset);
                    }}
                    className={`relative z-10 rounded-full px-4 py-2 text-sm font-semibold transition-colors duration-200 active:scale-95 ${
                      isActive
                        ? "text-emerald-800"
                        : "text-slate-600 hover:bg-emerald-50/70 hover:text-emerald-800"
                    }`}
                  >
                    <span>{item.label}</span>
                  </a>
                );
              })
            : authLinks.map((l) => (
                <NavLink
                  key={l.label}
                  to={l.to}
                  className={({ isActive }) =>
                    `rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                      isActive && loc.pathname === l.to
                        ? "text-emerald-700 bg-emerald-50"
                        : "text-slate-600 hover:text-emerald-800 hover:bg-slate-100/70"
                    }`
                  }
                >
                  {l.label}
                </NavLink>
              ))}
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2">
          {user ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  if (role !== "admin" && user.isOnboarded === false) {
                    navigate(role === "landlord" ? "/onboarding/landlord" : "/onboarding/role");
                  } else {
                    navigate(role === "landlord" ? "/landlord" : role === "admin" ? "/admin" : "/discover");
                  }
                }}
                className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-xs transition-all hover:bg-emerald-700 active:scale-95 cursor-pointer sm:text-sm"
              >
                Vào ứng dụng
                <ArrowRight className="size-3.5" />
              </button>
              <button
                type="button"
                onClick={async () => {
                  await logout();
                  navigate("/login");
                }}
                title="Đăng xuất / Đổi tài khoản"
                className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-600 cursor-pointer sm:text-sm"
              >
                <span>Đăng xuất</span>
              </button>
            </div>
          ) : (
            <>
              <button
                type="button"
                onClick={() => navigate("/login")}
                className="rounded-full border border-slate-200/90 bg-white px-4 py-2 text-xs font-bold text-slate-700 transition-all hover:border-emerald-300 hover:text-emerald-800 active:scale-95 cursor-pointer sm:text-sm"
              >
                Đăng nhập
              </button>
              <button
                type="button"
                onClick={() => navigate("/login?mode=register")}
                className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-xs transition-all hover:bg-emerald-700 active:scale-95 cursor-pointer sm:px-5 sm:text-sm"
              >
                <span>Đăng ký ngay</span>
                <ArrowRight className="size-3.5" />
              </button>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
