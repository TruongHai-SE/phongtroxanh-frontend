import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router";
import { GraduationCap, Users, MessageCircle, Sparkles, X, CigaretteOff, Cigarette, Moon, ZapOff } from "lucide-react";
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
import { toast } from "sonner";

function BigPersonCard({ person }: { person: Roommate }) {
  const isNonSmoking = person.nonSmoking !== undefined
    ? person.nonSmoking
    : person.lifestyle?.some((l) => l.label === "Hút thuốc" && l.value === "Không") ?? true;

  const isEarlySleeper = person.earlySleeper !== undefined
    ? person.earlySleeper
    : person.lifestyle?.some((l) => (l.label === "Giờ ngủ" || l.label === "Giờ giấc") && (l.value.includes("23h") || l.value.includes("Sớm"))) ?? false;

  const isNeat = person.isNeat !== undefined
    ? person.isNeat
    : person.lifestyle?.some((l) => l.label === "Vệ sinh" || l.value.toLowerCase().includes("sạch")) ?? true;

  return (
    <div className="group relative h-full flex flex-col overflow-hidden rounded-3xl bg-card shadow-xl ring-1 ring-border hover-lift">
      <div className="relative w-full overflow-hidden shrink-0" style={{ height: 215 }}>
        <ImageWithFallback src={person.avatar} alt={person.name} className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.025]" />
      </div>
      <MatchBadge value={person.match} className="absolute right-4 top-4" />
      <div className="flex flex-1 flex-col justify-between p-4 sm:p-5 min-w-0">
        <div className="space-y-1 sm:space-y-1.5">
          <div>
            <h3 className="text-base sm:text-lg font-semibold transition-colors duration-200 group-hover:text-primary leading-snug">{person.name}, {person.age}</h3>
            <p className="mt-0.5 inline-flex items-center gap-1 text-xs sm:text-sm text-muted-foreground">
              <GraduationCap className="size-3.5 text-primary" /> {person.school}
            </p>
          </div>
          <p className="line-clamp-2 text-xs sm:text-sm text-muted-foreground leading-relaxed">{person.bio}</p>
        </div>

        {/* Clean, minimalist lifestyle badges - NO emoji */}
        <div className="flex flex-wrap items-center gap-1.5 mt-2 pt-2 border-t border-border/60">
          <span
            className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-medium border ${
              isNonSmoking
                ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                : "bg-amber-50 text-amber-800 border-amber-200"
            }`}
          >
            {isNonSmoking ? <CigaretteOff className="size-3 text-emerald-600" /> : <Cigarette className="size-3 text-amber-600" />}
            {isNonSmoking ? "Không hút thuốc" : "Có hút thuốc"}
          </span>

          <span className="inline-flex items-center gap-1 rounded-md bg-slate-50 text-slate-700 border border-slate-200 px-2 py-0.5 text-[11px] font-medium">
            <Moon className="size-3 text-slate-500" />
            {isEarlySleeper ? "Ngủ trước 23h" : "Giờ giấc tự do"}
          </span>

          {isNeat && (
            <span className="inline-flex items-center gap-1 rounded-md bg-slate-50 text-slate-700 border border-slate-200 px-2 py-0.5 text-[11px] font-medium">
              <Sparkles className="size-3 text-slate-500" />
              Gọn gàng
            </span>
          )}
        </div>

        <div className="flex flex-wrap gap-1 mt-1.5">
          {person.interests.slice(0, 3).map((i) => <AmenityPill key={i} label={i} />)}
          {person.interests.length > 3 && (
            <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-1 rounded-full font-medium">+{person.interests.length - 3}</span>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Roommates() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [match, setMatch] = useState<Roommate | null>(null);
  const { loaded, swipesLeft, maxSwipes, decrementSwipes, openPricing, tier } = useMonetization();
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
          const prefDistrict = profile.preferredDistricts && profile.preferredDistricts.length > 0
            ? profile.preferredDistricts[0]
            : undefined;
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
          setInitialFilters(init);
          setActiveFilters(init);
        }
      } catch {
        // quiet fallback
      }
    }
    loadTenantCriteria();
  }, [user]);

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
              nonSmoking: dto.nonSmoking ?? true,
              earlySleeper: dto.earlySleeper ?? false,
              isNeat: dto.isNeat ?? true,
              allowGuests: dto.allowGuests ?? false,
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
      </div>

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
          <div className="flex flex-col -mt-4 md:-mt-8">
            {loaded && swipesLeft > 0 && (
              <div className="mb-2 md:mb-3 flex justify-center">
                <span className="inline-flex items-center gap-2 text-xs text-muted-foreground bg-card px-4 py-1.5 rounded-full border border-border shadow-xs animate-fade-in">
                  <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse" />
                  Bạn còn <strong className="text-foreground font-extrabold">{swipesLeft}/{maxSwipes}</strong> lượt ghép hôm nay.{" "}
                  {tier === "free" && (
                    <button onClick={openPricing} className="text-primary font-bold hover:underline cursor-pointer ml-1">
                      Tăng lượt
                    </button>
                  )}
                </span>
              </div>
            )}
            <SwipeStage
              resetKey={sidebarResetKey}
              items={filteredFeed}
              renderCard={(p) => <BigPersonCard person={p} />}
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
            <Sparkles className="size-6 text-primary" />
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
              className="mt-3 w-full hover-lift press-active hover:bg-mint hover:border-primary/30"
              onClick={() => navigate("/roommate-editor")}
            >
              Cập nhật hồ sơ ghép
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
            <h2 className="brand text-3xl text-primary">Ghép thành công! 🎉</h2>
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
