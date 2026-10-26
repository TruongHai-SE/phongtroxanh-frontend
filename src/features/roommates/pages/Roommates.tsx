import { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router";
import {
  GraduationCap,
  Users,
  MessageCircle,
  X,
  CigaretteOff,
  Cigarette,
  Moon,
  ZapOff,
  EyeOff,
  ChevronLeft,
  ChevronRight,
  Images,
  Rocket,
  Loader2,
  MapPin,
  CheckCircle2,
  ShieldCheck,
  Eye,
  ArrowUpRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ImageWithFallback } from "@/components/shared/ImageWithFallback";
import { SwipeStage } from "@/components/shared/SwipeStage";
import { FilterSidebar, type AppliedFilterCriteria } from "@/features/rooms/components/FilterSidebar";
import { MatchBadge, AmenityPill } from "@/components/shared/primitives-compat";
import type { Roommate } from "../types/roommate.types";
import { useAuth } from "@/app/context/AuthContext";
import { useMonetization } from "@/app/context/MonetizationContext";
import { SwipeStageSkeleton } from "@/components/ui/skeleton-loaders";
import { matchingApi } from "../api/matchingApi";
import { accountApi } from "@/features/account/api/accountApi";
import { inferDistrictFromSchoolOrPlace } from "@/lib/constants";
import { toast } from "sonner";

function BigPersonCard({
  person,
  onOpenDetail,
}: {
  person: Roommate;
  onOpenDetail?: (person: Roommate) => void;
}) {
  const pointerStartRef = useRef<{ x: number; y: number } | null>(null);

  const photos = useMemo(() => {
    const list: string[] = [];
    if (person.avatar && person.avatar.trim()) list.push(person.avatar.trim());
    if (Array.isArray(person.galleryImages)) {
      for (const img of person.galleryImages) {
        if (img && img.trim() && !list.includes(img.trim())) {
          list.push(img.trim());
        }
      }
    }
    return list;
  }, [person.avatar, person.galleryImages]);

  const [photoIdx, setPhotoIdx] = useState(0);

  useEffect(() => {
    setPhotoIdx(0);
  }, [person.id]);

  const isNonSmoking =
    person.nonSmoking !== undefined
      ? person.nonSmoking
      : person.lifestyle?.some((l) => l.label === "Hút thuốc" && l.value === "Không") ?? true;

  const isEarlySleeper =
    person.earlySleeper !== undefined
      ? person.earlySleeper
      : person.lifestyle?.some(
          (l) =>
            (l.label === "Giờ ngủ" || l.label === "Giờ giấc" || l.label === "Ngủ sớm") &&
            (l.value.includes("23h") || l.value.includes("Sớm") || l.value === "Có")
        ) ?? false;

  const isNeat =
    person.isNeat !== undefined
      ? person.isNeat
      : person.lifestyle?.some(
          (l) =>
            (l.label === "Vệ sinh" || l.label === "Gọn gàng") &&
            (l.value === "Có" || l.value.toLowerCase().includes("sạch"))
        ) ?? true;

  const allowGuests =
    person.allowGuests !== undefined
      ? person.allowGuests
      : person.lifestyle?.some((l) => l.label === "Tiếp khách" && l.value === "Được phép") ?? false;

  const initials = (person.name || "U")
    .split(" ")
    .filter(Boolean)
    .slice(-2)
    .map((w) => w[0]?.toUpperCase())
    .join("");

  const areasText =
    person.areas && person.areas.length > 0
      ? person.areas.slice(0, 2).join(", ") + (person.areas.length > 2 ? ` +${person.areas.length - 2}` : "")
      : "Linh hoạt TP.HCM";

  const genderText =
    person.gender === "MALE"
      ? "Nam"
      : person.gender === "FEMALE"
      ? "Nữ"
      : person.gender === "OTHER"
      ? "Khác"
      : null;

  const summaryBio =
    person.bio && person.bio.trim().length > 0
      ? person.bio.trim()
      : "Mong muốn tìm bạn ở ghép thân thiện, tôn trọng không gian riêng tư và cùng giữ gìn vệ sinh chung.";

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
    onOpenDetail?.(person);
  };

  return (
    <div className="group relative flex h-full flex-col overflow-hidden rounded-3xl bg-card shadow-xl ring-1 ring-border hover-lift select-none">
      {/* Top 52%: Photo Gallery / Calm Portrait Placeholder */}
      <div
        onPointerDown={handleGalleryPointerDown}
        onClick={handleGalleryClick}
        className="group/gallery relative h-[52%] w-full overflow-hidden shrink-0 bg-slate-100 cursor-pointer active:cursor-grabbing"
      >
        {photos.length > 0 ? (
          <>
            {photos.length >= 2 ? (
              <div className="grid h-full w-full grid-cols-3 gap-1">
                <div className="relative col-span-2 h-full overflow-hidden">
                  <ImageWithFallback
                    src={photos[photoIdx] || photos[0]}
                    alt={`${person.name} - ảnh ${photoIdx + 1}`}
                    className="size-full object-cover transition-transform duration-500 ease-out group-hover/gallery:scale-[1.03]"
                  />
                </div>
                <div className="grid grid-rows-2 gap-1 h-full">
                  <div className="relative overflow-hidden">
                    <ImageWithFallback
                      src={photos[(photoIdx + 1) % photos.length]}
                      alt=""
                      className="size-full object-cover transition-transform duration-500 ease-out group-hover/gallery:scale-[1.03]"
                    />
                  </div>
                  <div className="relative overflow-hidden">
                    <ImageWithFallback
                      src={photos[(photoIdx + 2) % photos.length]}
                      alt=""
                      className="size-full object-cover transition-transform duration-500 ease-out group-hover/gallery:scale-[1.03]"
                    />
                    {photos.length > 3 && (
                      <span className="pointer-events-none absolute bottom-2.5 right-2.5 rounded-md bg-slate-950/70 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur-xs">
                        +{photos.length - 3} ảnh
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <ImageWithFallback
                src={photos[0]}
                alt={person.name}
                className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover/gallery:scale-[1.03]"
              />
            )}

            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/55 via-black/15 to-transparent opacity-0 transition-opacity duration-200 group-hover/gallery:opacity-100" />

            {photos.length > 1 && (
              <>
                <div className="absolute top-3 left-3.5 right-28 z-10 flex gap-1">
                  {photos.map((_, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onPointerDown={(e) => e.stopPropagation()}
                      onClick={(e) => {
                        e.stopPropagation();
                        setPhotoIdx(idx);
                      }}
                      className={`h-1 flex-1 rounded-full transition-all cursor-pointer ${
                        idx === photoIdx ? "bg-white shadow-sm" : "bg-white/45 hover:bg-white/70"
                      }`}
                      aria-label={`Xem ảnh ${idx + 1}`}
                    />
                  ))}
                </div>
                <button
                  type="button"
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={(e) => {
                    e.stopPropagation();
                    setPhotoIdx((prev) => (prev - 1 + photos.length) % photos.length);
                  }}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 z-20 flex size-8 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur-sm opacity-0 group-hover/gallery:opacity-100 transition hover:bg-black/70 cursor-pointer"
                  aria-label="Ảnh trước"
                >
                  <ChevronLeft className="size-4" />
                </button>
                <button
                  type="button"
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={(e) => {
                    e.stopPropagation();
                    setPhotoIdx((prev) => (prev + 1) % photos.length);
                  }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 z-20 flex size-8 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur-sm opacity-0 group-hover/gallery:opacity-100 transition hover:bg-black/70 cursor-pointer"
                  aria-label="Ảnh tiếp theo"
                >
                  <ChevronRight className="size-4" />
                </button>
                <span className="pointer-events-none absolute bottom-3 right-3.5 z-20 inline-flex items-center gap-1 rounded-full bg-black/60 px-2.5 py-0.5 text-[11px] font-semibold text-white backdrop-blur-sm">
                  <Images className="size-3" />
                  {photoIdx + 1}/{photos.length}
                </span>
              </>
            )}
          </>
        ) : (
          /* Clean, calm portrait placeholder without duplicating bottom text */
          <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-emerald-50/90 via-teal-50/50 to-slate-100 text-center">
            <div className="flex size-20 items-center justify-center rounded-full bg-white text-2xl font-bold text-emerald-800 shadow-sm ring-4 ring-white/90 transition-transform duration-300 group-hover/gallery:scale-105">
              {initials}
            </div>
            <span className="mt-2 text-xs font-medium text-slate-500">
              Chưa cập nhật ảnh cá nhân
            </span>
          </div>
        )}

        {/* Single clean hover cue on gallery */}
        <div className="pointer-events-none absolute bottom-3 left-3.5 z-20 inline-flex items-center gap-1.5 rounded-full bg-slate-950/80 px-3.5 py-1.5 text-xs font-semibold text-white shadow-md ring-1 ring-white/15 backdrop-blur-md opacity-0 translate-y-1 transition-all duration-200 ease-out group-hover/gallery:opacity-100 group-hover/gallery:translate-y-0">
          <Eye className="size-3.5 text-emerald-300" />
          <span>Xem hồ sơ chi tiết</span>
          <ArrowUpRight className="size-3.5 text-white/80" />
        </div>

        {person.isBoosted && (
          <span className="pointer-events-none absolute left-3.5 top-3.5 z-20 inline-flex items-center gap-1 rounded-full bg-amber-500/95 text-white px-2.5 py-0.5 text-[11px] font-bold shadow-md backdrop-blur">
            <Rocket className="size-3" /> Hồ sơ nổi bật
          </span>
        )}

        <MatchBadge value={person.match} className="absolute right-3.5 top-3.5 z-20" />
      </div>

      {/* Bottom 48%: Clean 3-tier hierarchy (Identity + Budget/Area -> Bio -> Lifestyle Pills) */}
      <div className="flex flex-1 flex-col justify-between p-4 sm:px-6 sm:py-4 min-w-0 min-h-0">
        {/* Tier 1: Name, Age & School on Left | Budget & Preferred Area on Right */}
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base sm:text-lg font-bold text-foreground transition-colors duration-200 group-hover:text-primary leading-snug truncate">
                {person.name}, {person.age}
              </h3>
              {genderText && (
                <span className="rounded bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                  {genderText}
                </span>
              )}
              {person.isVerified && (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
                  <ShieldCheck className="size-3" /> Đã xác thực
                </span>
              )}
            </div>
            <p className="inline-flex items-center gap-1.5 text-xs sm:text-sm text-muted-foreground max-w-full">
              <GraduationCap className="size-3.5 text-primary shrink-0" />
              <span className="truncate">{person.school}</span>
            </p>
          </div>

          <div className="shrink-0 text-right pt-0.5">
            <p className="text-base sm:text-lg font-extrabold text-primary tabular-nums leading-none">
              {person.budget}
            </p>
            <p className="mt-1.5 inline-flex items-center justify-end gap-1 text-xs text-muted-foreground max-w-[200px]">
              <MapPin className="size-3 text-primary shrink-0" />
              <span className="truncate font-medium text-foreground">{areasText}</span>
            </p>
          </div>
        </div>

        {/* Tier 2: Concise Bio / Introduction */}
        <p className="line-clamp-2 text-xs sm:text-sm text-slate-600 leading-relaxed">
          {summaryBio}
        </p>

        {/* Tier 3: Lifestyle & Interests Footer */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2.5 border-t border-border/60">
          <div className="flex flex-wrap items-center gap-1.5">
            <span
              className={`inline-flex items-center gap-1 rounded-md px-2.5 py-0.5 text-xs font-medium ${
                isNonSmoking
                  ? "bg-emerald-50 text-emerald-800"
                  : "bg-amber-50 text-amber-800"
              }`}
            >
              {isNonSmoking ? (
                <CigaretteOff className="size-3 text-emerald-600" />
              ) : (
                <Cigarette className="size-3 text-amber-600" />
              )}
              {isNonSmoking ? "Không hút thuốc" : "Có hút thuốc"}
            </span>

            <span className="inline-flex items-center gap-1 rounded-md bg-slate-100/80 text-slate-700 px-2.5 py-0.5 text-xs font-medium">
              <Moon className="size-3 text-slate-500" />
              {isEarlySleeper ? "Ngủ trước 23h" : "Giờ giấc tự do"}
            </span>

            <span className="inline-flex items-center gap-1 rounded-md bg-slate-100/80 text-slate-700 px-2.5 py-0.5 text-xs font-medium">
              <CheckCircle2 className="size-3 text-emerald-600" />
              {isNeat ? "Gọn gàng" : "Thoải mái"}
            </span>

            {allowGuests && (
              <span className="inline-flex items-center gap-1 rounded-md bg-slate-100/80 text-slate-700 px-2.5 py-0.5 text-xs font-medium">
                <Users className="size-3 text-slate-500" />
                Cho phép khách
              </span>
            )}
          </div>

          {person.interests.length > 0 && (
            <div className="hidden sm:flex items-center gap-1">
              {person.interests.slice(0, 2).map((i) => (
                <AmenityPill key={i} label={i} />
              ))}
              {person.interests.length > 2 && (
                <span className="text-xs text-muted-foreground ml-0.5">
                  +{person.interests.length - 2}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Roommates() {
  const navigate = useNavigate();
  const { user, refreshProfile } = useAuth();
  const [isPrivateProfile, setIsPrivateProfile] = useState<boolean>(false);
  const [isTogglingPublic, setIsTogglingPublic] = useState(false);
  const [match, setMatch] = useState<Roommate | null>(null);
  const { loaded, swipesLeft, maxSwipes, boostsLeft, decrementSwipes, openPricing, tier, refresh: refreshMonetization } = useMonetization();
  const [isBoostingProfile, setIsBoostingProfile] = useState(false);
  const [allCandidates, setAllCandidates] = useState<Roommate[]>([]);
  const [initialFilters, setInitialFilters] = useState<AppliedFilterCriteria | undefined>(undefined);
  const [activeFilters, setActiveFilters] = useState<{
    keyword?: string;
    minPrice?: number;
    maxPrice?: number;
    district?: string;
    minAge?: number;
    maxAge?: number;
    nonSmoking?: boolean;
    earlySleeper?: boolean;
    isNeat?: boolean;
    allowGuests?: boolean;
  }>({});
  const [sidebarResetKey, setSidebarResetKey] = useState(0);
  const [recentMatches, setRecentMatches] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Pre-fill roommate lifestyle filters based on user's onboarding profile
  useEffect(() => {
    async function loadTenantCriteria() {
      if (!user) return;
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
          const minB = profile.budgetMin ? Number(profile.budgetMin) : undefined;
          const maxB = profile.budgetMax ? Number(profile.budgetMax) : undefined;

          const init: AppliedFilterCriteria = {
            district: prefDistrict,
            minPrice: minB,
            maxPrice: maxB,
            nonSmoking: profile.nonSmoking ?? false,
            earlySleeper: profile.earlySleeper ?? false,
            isNeat: profile.isNeat ?? false,
            allowGuests: profile.allowGuests ?? false,
          };
          if (profile.isPublic !== undefined) {
            setIsPrivateProfile(!profile.isPublic);
          }
          setInitialFilters(init);
          setActiveFilters(init);
        }
      } catch {
        // quiet fallback
      }
    }
    loadTenantCriteria();
  }, [user]);

  const handleEnablePublic = async () => {
    setIsTogglingPublic(true);
    try {
      await accountApi.updateSettings({ isPublic: true });
      setIsPrivateProfile(false);
      await refreshProfile();
      toast.success("Đã bật công khai hồ sơ! Bạn đã sẵn sàng để được ghép đôi.");
    } catch {
      toast.error("Không thể cập nhật quyền riêng tư, vui lòng thử lại sau");
    } finally {
      setIsTogglingPublic(false);
    }
  };

  useEffect(() => {
    async function fetchFeed() {
      setIsLoading(true);
      try {
        const data = await matchingApi.getDeck();
        if (Array.isArray(data) && data.length > 0) {
          const mapped: Roommate[] = data.map((dto: any) => {
            const age = dto.birthDate 
              ? Math.max(18, new Date().getFullYear() - new Date(dto.birthDate).getFullYear())
              : 20;
            return {
              id: String(dto.userId || dto.id),
              name: dto.fullName || "Người dùng",
              age: age,
              school: dto.schoolOrCompany || "Đang tìm bạn ở ghép",
              bio: dto.bio || "",
              avatar: dto.avatarUrl || "",
              galleryImages: Array.isArray(dto.galleryImages) ? dto.galleryImages.filter(Boolean) : [],
              budget: dto.budgetMax 
                ? (dto.budgetMin 
                    ? `${(Number(dto.budgetMin) / 1e6).toFixed(1)} - ${(Number(dto.budgetMax) / 1e6).toFixed(1)} tr/tháng` 
                    : `≤ ${(Number(dto.budgetMax) / 1e6).toFixed(1)} tr/tháng`)
                : "Thỏa thuận",
              match: dto.compatibilityScore ?? 80,
              areas: dto.preferredDistricts && dto.preferredDistricts.length > 0 ? dto.preferredDistricts : [],
              interests: dto.interests && dto.interests.length > 0 ? dto.interests : [],
              lifestyle: [
                { label: "Ngủ sớm", value: dto.earlySleeper ? "Có" : "Không" },
                { label: "Gọn gàng", value: dto.isNeat ? "Có" : "Bình thường" },
                { label: "Hút thuốc", value: dto.nonSmoking ? "Không" : "Có" },
                { label: "Tiếp khách", value: dto.allowGuests ? "Được phép" : "Hạn chế" },
              ],
              compatibility: (dto.matchHighlights || []).map((h: string) => ({ label: h, value: 90 })),
              gender: dto.gender,
              preferredRoomType: dto.preferredRoomType,
              trustScore: dto.trustScore,
              isVerified: Boolean(dto.isVerified),
              matchHighlights: Array.isArray(dto.matchHighlights) ? dto.matchHighlights : [],
              nonSmoking: dto.nonSmoking ?? true,
              earlySleeper: dto.earlySleeper ?? false,
              isNeat: dto.isNeat ?? true,
              allowGuests: dto.allowGuests ?? false,
              isBoosted: Boolean(dto.isBoosted),
            };
          });
          setAllCandidates(mapped);
        } else {
          setAllCandidates([]);
        }
      } catch (err) {
        console.warn("Could not load /matching/deck:", err);
        setAllCandidates([]);
      } finally {
        setIsLoading(false);
      }
    }

    async function fetchRecentMatches() {
      try {
        const matchesData = await matchingApi.getMatches();
        if (Array.isArray(matchesData) && matchesData.length > 0) {
          setRecentMatches(matchesData);
        }
      } catch (err) {
        // quiet fallback
      }
    }

    fetchFeed();
    fetchRecentMatches();
  }, []);

  const handleApplyFilters = (newFilters: any) => {
    setActiveFilters(newFilters);
  };

  const handleResetFilters = () => {
    setActiveFilters({});
    setInitialFilters(undefined);
    setSidebarResetKey((prev) => prev + 1);
    toast.info("Đã đặt lại bộ lọc");
  };

  const filteredFeed = useMemo(() => {
    return allCandidates.filter((p) => {
      if (activeFilters.district && !p.areas?.some((a) => a.toLowerCase().includes(activeFilters.district!.toLowerCase()))) {
        return false;
      }
      if (activeFilters.minAge && p.age < activeFilters.minAge) {
        return false;
      }
      if (activeFilters.maxAge && p.age > activeFilters.maxAge) {
        return false;
      }
      if (activeFilters.keyword) {
        const q = activeFilters.keyword.toLowerCase();
        const matchSchool = p.school?.toLowerCase().includes(q);
        const matchBio = p.bio?.toLowerCase().includes(q);
        const matchName = p.name?.toLowerCase().includes(q);
        if (!matchSchool && !matchBio && !matchName) return false;
      }
      if (activeFilters.nonSmoking && !p.nonSmoking) {
        return false;
      }
      if (activeFilters.earlySleeper && !p.earlySleeper) {
        return false;
      }
      if (activeFilters.isNeat && !p.isNeat) {
        return false;
      }
      if (activeFilters.allowGuests && !p.allowGuests) {
        return false;
      }
      return true;
    });
  }, [allCandidates, activeFilters]);

  const handleLike = async (p: Roommate) => {
    if (!user) {
      toast.error("Vui lòng đăng nhập để lưu lượt thích và tạo ghép đôi!", {
        action: {
          label: "Đăng nhập ngay",
          onClick: () => navigate("/login"),
        },
      });
      return;
    }

    const success = decrementSwipes();
    if (success) {
      try {
        const res = await matchingApi.swipe({
          targetUserId: p.id,
          action: "LIKE",
        });
        if (res?.matched) {
          setMatch(p);
        } else if (p.match >= 88) {
          setMatch(p);
        }
      } catch {
        if (p.match >= 88) setMatch(p);
      }
    }
  };

  const handleSkip = async (p?: Roommate) => {
    if (!user) {
      toast.error("Vui lòng đăng nhập để trải nghiệm đầy đủ tính năng ghép bạn!", {
        action: {
          label: "Đăng nhập ngay",
          onClick: () => navigate("/login"),
        },
      });
      return;
    }

    decrementSwipes();
    if (p) {
      try {
        await matchingApi.swipe({
          targetUserId: p.id,
          action: "DISLIKE", // Fixed from "PASS" to "DISLIKE" for Backend enum
        });
      } catch {
        // quiet
      }
    }
  };

  return (
    <div className="mx-auto w-full max-w-[1440px] px-6 pt-2 md:pt-3 pb-6">
      <div className="mb-2 md:mb-3 flex items-end justify-between flex-wrap gap-2 animate-fade-in">
        <div>
          <h1 className="brand text-3xl text-foreground">Vuốt để ghép bạn</h1>
          <p className="text-sm text-muted-foreground">
            Tìm người ở ghép hợp gu, hợp lối sống
          </p>
        </div>
        <div data-tour="roommates-header-controls" className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/matches")}
            className="gap-1.5 text-xs font-semibold hover:border-primary/40 hover:bg-mint cursor-pointer"
          >
            <Users className="size-3.5 text-primary" />
            <span>Đã ghép ({recentMatches.length})</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/settings")}
            className="gap-1.5 text-xs font-medium cursor-pointer"
          >
            <ShieldCheck className="size-3.5 text-emerald-600" />
            <span>Quyền riêng tư</span>
          </Button>
        </div>
      </div>

      {isPrivateProfile && (
        <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-amber-300 bg-amber-50/90 p-4 text-amber-900 shadow-xs dark:border-amber-700/50 dark:bg-amber-950/30 dark:text-amber-200 animate-fade-in">
          <div className="flex items-start sm:items-center gap-3 text-xs sm:text-sm">
            <div className="grid size-8 shrink-0 place-items-center rounded-lg bg-amber-200/60 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300">
              <EyeOff className="size-4" />
            </div>
            <div>
              <p className="font-semibold text-amber-900 dark:text-amber-100">Hồ sơ tìm bạn của bạn đang ở chế độ Riêng tư (Ẩn)</p>
              <p className="text-xs text-amber-700 dark:text-amber-300/90 mt-0.5">
                Bạn vẫn có thể xem và quẹt người khác, nhưng hồ sơ của bạn sẽ không xuất hiện trên bảng tin để người khác tìm thấy bạn.
              </p>
            </div>
          </div>
          <Button
            size="sm"
            onClick={handleEnablePublic}
            disabled={isTogglingPublic}
            className="self-end sm:self-auto h-9 shrink-0 rounded-xl bg-amber-600 px-4 text-xs font-semibold text-white hover:bg-amber-700 shadow-xs cursor-pointer"
          >
            {isTogglingPublic ? "Đang xử lý..." : "Bật công khai ngay"}
          </Button>
        </div>
      )}

      <div className="grid w-full gap-4 md:gap-6 lg:grid-cols-[240px_1fr_240px]">
        <div className="hidden lg:block">
          <FilterSidebar
            variant="roommate"
            initialFilters={initialFilters}
            onApply={handleApplyFilters}
            onReset={handleResetFilters}
            resetKey={sidebarResetKey}
          />
        </div>

        {isLoading ? (
          <div className="flex flex-col -mt-4 md:-mt-8 items-center w-full animate-fade-in">
            <SwipeStageSkeleton variant="roommate" />
          </div>
        ) : loaded && swipesLeft <= 0 ? (
          <div className="flex h-[450px] flex-col items-center justify-center rounded-3xl bg-card border border-border p-8 text-center shadow-xs">
            <div className="mx-auto grid size-16 place-items-center rounded-full bg-amber-500/10 text-amber-500 mb-4">
              <ZapOff className="size-8" />
            </div>
            <h3 className="text-xl font-bold text-foreground">Đã hết lượt ghép hôm nay!</h3>
            <p className="mt-2 text-sm text-muted-foreground max-w-sm">
              Bạn đã dùng hết {maxSwipes} lượt vuốt hôm nay. Lượt sẽ được làm mới vào ngày mai.
            </p>
            {tier === "free" && (
              <Button
                onClick={openPricing}
                className="mt-6 w-full max-w-[280px] bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-2.5 rounded-xl shadow-xs cursor-pointer"
              >
                Xem gói tăng lượt vuốt
              </Button>
            )}
          </div>
        ) : (
          <div className="flex flex-col -mt-3 md:-mt-6">
            {loaded && swipesLeft > 0 && (
              <div className="mb-1.5 md:mb-2 flex justify-center">
                <span className="inline-flex items-center gap-1.5 text-xs text-slate-600 bg-slate-50 px-4 py-1 rounded-full border border-slate-200/60 shadow-sm animate-fade-in">
                  Bạn còn <strong className="text-slate-900 font-extrabold tabular-nums">{swipesLeft}/{maxSwipes}</strong> lượt ghép hôm nay.{" "}
                  {tier === "free" && (
                    <button onClick={openPricing} className="text-emerald-600 font-black hover:underline cursor-pointer ml-1">
                      Tăng lượt
                    </button>
                  )}
                </span>
              </div>
            )}
            <SwipeStage
              tourPrefix="roommates"
              resetKey={sidebarResetKey}
              items={filteredFeed}
              renderCard={(p) => (
                <BigPersonCard
                  person={p}
                  onOpenDetail={(target) => navigate(`/roommates/${target.id}`)}
                />
              )}
              onLike={handleLike}
              onSkip={handleSkip}
              onInfo={(p) => navigate(`/roommates/${p.id}`)}
              emptyState={
                <div className="text-center p-6">
                  <div className="mx-auto grid size-16 place-items-center rounded-full bg-mint text-primary">
                    <Users className="size-8" />
                  </div>
                  <h3 className="mt-4 text-lg font-bold">
                    {Object.keys(activeFilters).length > 0 ? "Không tìm thấy người phù hợp" : "Đã xem hết danh sách!"}
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground max-w-sm">
                    {Object.keys(activeFilters).length > 0
                      ? "Hãy thử điều chỉnh bộ lọc độ tuổi, đổi quận hoặc đặt lại bộ lọc để xem thêm gợi ý."
                      : "Quay lại sau hoặc mở rộng bộ lọc để xem thêm bạn ở ghép mới."}
                  </p>
                  <div className="mt-4 flex items-center justify-center gap-2">
                    <Button
                      variant="outline"
                      className="cursor-pointer"
                      onClick={handleResetFilters}
                    >
                      Đặt lại bộ lọc
                    </Button>
                    <Button
                      className="hover-lift press-active cursor-pointer"
                      onClick={() => navigate("/matches")}
                    >
                      Xem lượt ghép
                    </Button>
                  </div>
                </div>
              }
            />
          </div>
        )}

        <div className="hidden space-y-4 lg:block">
          <div className="rounded-2xl bg-mint/50 p-5 border border-primary/10">
            <ShieldCheck className="size-6 text-primary" />
            <h3 className="mt-2 font-semibold text-emerald-deep">
              Mẹo ghép đôi
            </h3>
            <p className="mt-1 text-sm text-emerald-dark/80">
              Hồ sơ có ảnh thật và mô tả lối sống rõ ràng được ghép nhiều hơn 3
              lần.
            </p>
            <Button
              size="sm"
              variant="outline"
              className="mt-3 w-full hover-lift press-active hover:bg-mint hover:border-primary/30 cursor-pointer"
              onClick={() => navigate("/roommate-editor")}
            >
              Cập nhật hồ sơ ghép
            </Button>
            <Button
              size="sm"
              disabled={isBoostingProfile}
              className="mt-2 w-full gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer"
              onClick={async () => {
                if (!user) return navigate("/login");
                if (boostsLeft <= 0) {
                  openPricing();
                  return;
                }
                setIsBoostingProfile(true);
                try {
                  await matchingApi.boostProfile();
                  toast.success("Đã đẩy hồ sơ tìm bạn lên đầu 24 giờ!");
                  await refreshMonetization();
                } catch (err: any) {
                  toast.error(err?.message || "Không thể đẩy hồ sơ");
                } finally {
                  setIsBoostingProfile(false);
                }
              }}
            >
              {isBoostingProfile ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Rocket className="size-3.5" />
              )}
              {boostsLeft > 0 ? `Đẩy hồ sơ 24h (còn ${boostsLeft})` : "Đẩy hồ sơ lên đầu (Mua lượt)"}
            </Button>
          </div>
          <div className="rounded-2xl bg-card p-5 ring-1 ring-border shadow-sm">
            <h3 className="font-semibold text-charcoal">Lượt ghép gần đây</h3>
            {recentMatches.length > 0 ? (
              <div className="mt-3 flex -space-x-2">
                {recentMatches.slice(0, 4).map((p, idx) => (
                  <ImageWithFallback
                    key={p.matchId || p.partnerId || p.id || idx}
                    src={p.partnerAvatar || p.avatar || ""}
                    alt={p.partnerName || p.name || "Match"}
                    className="size-9 rounded-full object-cover ring-2 ring-card"
                  />
                ))}
              </div>
            ) : (
              <p className="mt-2 text-xs text-muted-foreground">Chưa có lượt ghép nào gần đây.</p>
            )}
            <Button
              size="sm"
              className="mt-3 w-full hover-lift press-active"
              onClick={() => navigate("/matches")}
            >
              Xem tất cả
            </Button>
          </div>
        </div>
      </div>

      {/* Match overlay */}
      {match && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-6 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-3xl bg-card p-8 text-center shadow-2xl">
            <button
              onClick={() => setMatch(null)}
              className="absolute right-4 top-4 text-muted-foreground transition-all hover:scale-110 press-active"
            >
              <X className="size-5" />
            </button>
            <h2 className="brand text-3xl text-primary">Ghép thành công!</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Bạn và {match.name} đã thích nhau
            </p>
            <div className="my-6 flex items-center justify-center gap-4">
              <ImageWithFallback
                src={match.avatar}
                alt={match.name}
                className="size-24 rounded-full object-cover ring-4 ring-mint"
              />
              <div className="grid size-12 place-items-center rounded-full bg-primary text-primary-foreground font-bold">
                {match.match}%
              </div>
              <ImageWithFallback
                src={user?.avatarUrl || ""}
                alt="me"
                className="size-24 rounded-full object-cover ring-4 ring-mint"
              />
            </div>
            <Button
              className="w-full gap-2 hover-lift press-active hover-glow"
              onClick={() => navigate("/chat")}
            >
              <MessageCircle className="size-4" /> Nhắn tin ngay
            </Button>
            <Button
              variant="ghost"
              className="mt-2 w-full press-active"
              onClick={() => setMatch(null)}
            >
              Tiếp tục vuốt
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
