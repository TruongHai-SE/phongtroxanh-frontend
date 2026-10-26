import { useState, useEffect, useMemo, useRef } from "react";
import { useSearchParams, useNavigate, Link } from "react-router";
import {
  Check,
  X,
  ArrowLeft,
  AlertCircle,
  Plus,
  Trash2,
  ArrowLeftRight,
  ShieldCheck,
  MapPin,
  KeyRound,
  Sparkles,
  Search,
  RotateCcw,
  Star,
  ChevronDown,
} from "lucide-react";
import { ImageWithFallback } from "@/components/shared/ImageWithFallback";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { formatVND, cn } from "@/lib/utils";
import {
  roomImages,
  districts,
  inferDistrictFromSchoolOrPlace,
  resolveLandmarkFromQuery,
  calculateDistanceKm,
  normalizeAmenitiesList,
} from "@/lib/constants";
import { roomsApi } from "../api/roomsApi";
import { accountApi } from "@/features/account/api/accountApi";
import { useAuth } from "@/app/context/AuthContext";
import type { Room } from "@/types/room";

const MIN_BUDGET = 500000;
const MAX_BUDGET = 15000000;

const allAmenities = [
  "Máy lạnh",
  "Wi-Fi",
  "WC riêng",
  "Giờ tự do",
  "Bãi xe",
  "Bếp riêng",
  "Ban công",
  "Thang máy",
];

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

function formatRoomTypeLabel(rawType?: string): string {
  if (!rawType) return "Phòng khép kín";
  return ROOM_TYPE_LABELS[rawType] || rawType.replace(/_/g, " ");
}

function normalizeRoomTypeCategory(rawType?: string): string {
  if (!rawType) return "";
  const upper = rawType.toUpperCase().trim();
  if (upper === "STUDIO" || rawType === "Studio") return "Studio";
  if (upper === "PHONG_KHEP_KIN" || rawType === "Phòng khép kín") return "Phòng khép kín";
  if (upper === "PHONG_TRO" || rawType === "Phòng trọ") return "Phòng trọ";
  if (upper === "CAN_HO_MINI" || upper === "CHUNG_CU_MINI" || rawType === "Căn hộ mini") {
    return "Căn hộ mini";
  }
  if (
    upper === "KTX_SLEEPBOX" ||
    upper === "O_GHEP" ||
    upper === "SLEEPBOX" ||
    upper === "KY_TUC_XA" ||
    rawType === "Ở ghép"
  ) {
    return "Ở ghép";
  }
  return formatRoomTypeLabel(rawType);
}

interface CompareRoomItem extends Room {
  rawRoomType?: string;
  depositAmount: number;
  trustScore: number;
}

function mapApiRoomToCompareItem(r: any, fallbackIdx = 0): CompareRoomItem {
  const rawImgs = Array.isArray(r?.images)
    ? r.images
        .map((img: any) => (typeof img === "string" ? img : img?.imageUrl))
        .filter((u: any) => typeof u === "string" && u.trim().length > 0)
    : [];

  const images =
    rawImgs.length > 0
      ? rawImgs
      : r?.primaryImageUrl
      ? [r.primaryImageUrl]
      : [roomImages[fallbackIdx % roomImages.length]];

  const price = Number(r?.price || 0);
  const depositAmount =
    r?.depositAmount != null && !Number.isNaN(Number(r.depositAmount))
      ? Number(r.depositAmount)
      : price;

  const rawRoomType = r?.roomType || r?.type || "PHONG_KHEP_KIN";
  const typeLabel = formatRoomTypeLabel(rawRoomType);

  const trustScore =
    r?.landlord?.trustScore != null && !Number.isNaN(Number(r.landlord.trustScore))
      ? Number(r.landlord.trustScore)
      : 70;
  const ratingFromTrust = Number((trustScore / 20).toFixed(1));

  const landlordName =
    r?.landlord?.fullName ||
    r?.landlord?.name ||
    r?.landlordName ||
    "Chủ phòng trọ";
  const landlordVerified = Boolean(
    r?.landlord?.isVerified ?? r?.landlord?.verified ?? r?.isVerified
  );

  const rawFees = Array.isArray(r?.fees) ? r.fees : [];
  const fees = rawFees.map((f: any) => ({
    label: f.feeLabel || f.feeName || f.label || "Chi phí",
    value:
      f.feeValue ||
      (f.amount ? `${Number(f.amount).toLocaleString("vi-VN")}đ` : f.value || "Theo thỏa thuận"),
  }));

  return {
    id: String(r.id),
    title: r.title || "Phòng trọ",
    price,
    depositAmount,
    district: r.district || "TP.HCM",
    address: r.addressStreet || r.address || "",
    area: Number(r.areaSqm ?? r.area ?? 25),
    floor: Number(r.floorNumber ?? r.floor ?? 1),
    maxOccupants: Number(r.maxOccupants || 2),
    type: typeLabel,
    rawRoomType,
    amenities: normalizeAmenitiesList(r?.amenities),
    images,
    landlord: {
      id: r?.landlord?.id ? String(r.landlord.id) : undefined,
      name: landlordName,
      verified: landlordVerified,
      avatar: r?.landlord?.avatarUrl || r?.landlord?.avatar || "",
      rating: ratingFromTrust,
      trustScore,
    },
    description: r.description || "",
    fees,
    rating: ratingFromTrust,
    reviews: Number(r?.reviewCount || 0),
    trustScore,
    lat: Number(r?.latitude ?? r?.lat ?? 10.776),
    lng: Number(r?.longitude ?? r?.lng ?? 106.667),
  };
}

interface OnboardingCriteria {
  districts: string[];
  roomType?: string;
  minPrice?: number;
  maxPrice?: number;
  schoolOrCompany?: string;
}

interface DiscoverSavedFilters {
  district?: string;
  roomType?: string;
  minPrice?: number;
  maxPrice?: number;
  keyword?: string;
  amenities?: string[];
}

type ModalSourceTab = "all" | "profile" | "discover" | "saved";

export default function Compare() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const idsParam = searchParams.get("ids");
  const lastSyncedIdsRef = useRef<string | null>(null);

  const [compared, setCompared] = useState<CompareRoomItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Add room modal & filter states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [allCatalogRooms, setAllCatalogRooms] = useState<any[]>([]);
  const [isLoadingAvailable, setIsLoadingAvailable] = useState(false);

  // User context for smart filtering inside modal
  const [onboardingCriteria, setOnboardingCriteria] = useState<OnboardingCriteria | null>(null);
  const [discoverFilters, setDiscoverFilters] = useState<DiscoverSavedFilters | null>(null);
  const [savedRoomIds, setSavedRoomIds] = useState<Set<string>>(() => {
    try {
      const cached = localStorage.getItem("ptx_saved_room_ids");
      return cached ? new Set(JSON.parse(cached)) : new Set();
    } catch {
      return new Set();
    }
  });

  // Modal active filter controls
  const [modalTab, setModalTab] = useState<ModalSourceTab>("all");
  const [searchKeyword, setSearchKeyword] = useState("");
  const [filterDistrict, setFilterDistrict] = useState("ALL");
  const [filterRoomType, setFilterRoomType] = useState("ALL");
  const [priceRange, setPriceRange] = useState<[number, number]>([MIN_BUDGET, MAX_BUDGET]);
  const [filterAmenities, setFilterAmenities] = useState<string[]>([]);

  // Load user's onboarding profile & saved rooms & discover filters
  useEffect(() => {
    try {
      const rawDiscover = sessionStorage.getItem("ptx_discover_filters");
      if (rawDiscover) {
        const parsed = JSON.parse(rawDiscover);
        if (parsed && typeof parsed === "object") {
          setDiscoverFilters(parsed);
        }
      }
    } catch {
      // ignore
    }

    if (!user) return;

    // Seed initial onboarding criteria from AuthContext user
    const initialDistricts = Array.isArray(user.preferredDistricts)
      ? user.preferredDistricts.filter(Boolean)
      : [];
    if (initialDistricts.length > 0 || user.preferredRoomType || user.budgetMin || user.budgetMax) {
      setOnboardingCriteria({
        districts: initialDistricts,
        roomType: user.preferredRoomType,
        minPrice: user.budgetMin ? Number(user.budgetMin) : undefined,
        maxPrice: user.budgetMax ? Number(user.budgetMax) : undefined,
      });
    }

    accountApi
      .getProfile()
      .then((profile) => {
        if (!profile) return;
        const inferredDistrict =
          (profile.proximitySchool !== false || profile.proximityWork !== false) &&
          (profile.schoolOrCompany || profile.school)
            ? inferDistrictFromSchoolOrPlace(profile.schoolOrCompany || profile.school) || undefined
            : undefined;
        const pDistricts =
          Array.isArray(profile.preferredDistricts) && profile.preferredDistricts.length > 0
            ? profile.preferredDistricts.filter(Boolean)
            : inferredDistrict
            ? [inferredDistrict]
            : [];

        setOnboardingCriteria({
          districts: pDistricts,
          roomType: profile.preferredRoomType || undefined,
          minPrice: profile.budgetMin ? Number(profile.budgetMin) : undefined,
          maxPrice: profile.budgetMax ? Number(profile.budgetMax) : undefined,
          schoolOrCompany: profile.schoolOrCompany || profile.school || undefined,
        });
      })
      .catch(() => {});

    roomsApi
      .getSavedRooms()
      .then((savedList) => {
        if (Array.isArray(savedList)) {
          const nextSet = new Set(savedList.map((r) => String(r.id)));
          setSavedRoomIds(nextSet);
          localStorage.setItem("ptx_saved_room_ids", JSON.stringify(Array.from(nextSet)));
        }
      })
      .catch(() => {});
  }, [user]);

  const loadFullRoomDetailsByIds = async (targetIds: string[]): Promise<CompareRoomItem[]> => {
    const uniqueIds = Array.from(new Set(targetIds.filter(Boolean))).slice(0, 4);
    if (uniqueIds.length === 0) return [];

    if (uniqueIds.length >= 2) {
      try {
        const res = await roomsApi.compareRooms({ ids: uniqueIds });
        const rawList = res?.rooms || [];
        if (rawList.length > 0) {
          return rawList.map((r: any, idx: number) => mapApiRoomToCompareItem(r, idx));
        }
      } catch {
        // Fallback to individual getRoomById calls below
      }
    }

    const detailResults = await Promise.all(
      uniqueIds.map((id, idx) =>
        roomsApi
          .getRoomById(id)
          .then((detail) => mapApiRoomToCompareItem(detail, idx))
          .catch(() => null)
      )
    );
    return detailResults.filter((item): item is CompareRoomItem => item !== null);
  };

  const fetchCompareData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const idList = idsParam ? idsParam.split(",").filter(Boolean) : [];

      // Case 1: User navigated from a specific room (/compare?ids=room1) -> auto-pair with 2 relevant rooms
      if (idList.length === 1) {
        const mainId = idList[0];
        const [mainDetail, allRoomsRes] = await Promise.all([
          roomsApi.getRoomById(mainId).catch(() => null),
          roomsApi.getRooms({ page: 0, size: 20 }).catch(() => null),
        ]);

        const candidates = (allRoomsRes?.content || []).filter(
          (r: any) => String(r.id) !== mainId
        );

        // Score candidates by similarity to mainRoom or user profile so initial comparison is meaningful
        const targetDistrict = mainDetail?.district || user?.preferredDistricts?.[0];
        const targetPrice = Number(mainDetail?.price || user?.budgetMax || 0);
        const sortedCandidates = [...candidates].sort((a: any, b: any) => {
          const aSameDist = targetDistrict && a.district === targetDistrict ? 1 : 0;
          const bSameDist = targetDistrict && b.district === targetDistrict ? 1 : 0;
          if (aSameDist !== bSameDist) return bSameDist - aSameDist;
          if (targetPrice > 0) {
            return Math.abs(Number(a.price || 0) - targetPrice) - Math.abs(Number(b.price || 0) - targetPrice);
          }
          return 0;
        });

        const targetIds = [
          mainId,
          ...sortedCandidates.slice(0, 2).map((r: any) => String(r.id)),
        ];

        const fullItems = await loadFullRoomDetailsByIds(targetIds);
        if (fullItems.length > 0) {
          setCompared(fullItems);
          return;
        }
      }

      // Case 2: 2 to 4 room IDs in URL
      if (idList.length >= 2) {
        const fullItems = await loadFullRoomDetailsByIds(idList.slice(0, 4));
        if (fullItems.length > 0) {
          setCompared(fullItems);
          return;
        }
      }

      // Case 3: No IDs in URL -> load top 3 rooms with full details
      const res = await roomsApi.getRooms({ page: 0, size: 3 });
      const topIds = (res?.content || []).slice(0, 3).map((r: any) => String(r.id));
      const fullItems = await loadFullRoomDetailsByIds(topIds);
      setCompared(fullItems);
    } catch (err: any) {
      console.warn("Backend compare rooms error:", err);
      setError(err.message || "Không thể tải dữ liệu so sánh.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (idsParam !== null && idsParam === lastSyncedIdsRef.current) {
      return;
    }
    fetchCompareData();
  }, [idsParam]);

  const handleOpenAddModal = async () => {
    setIsAddModalOpen(true);
    if (allCatalogRooms.length > 0) return;

    setIsLoadingAvailable(true);
    try {
      const res = await roomsApi.getRooms({ page: 0, size: 60 });
      setAllCatalogRooms(res?.content || []);
    } catch {
      setAllCatalogRooms([]);
    } finally {
      setIsLoadingAvailable(false);
    }
  };

  const handleSelectModalTab = (tab: ModalSourceTab) => {
    setModalTab(tab);
    if (tab === "profile" && onboardingCriteria) {
      setFilterDistrict(onboardingCriteria.districts[0] || "ALL");
      setFilterRoomType(
        onboardingCriteria.roomType
          ? normalizeRoomTypeCategory(onboardingCriteria.roomType)
          : "ALL"
      );
      setPriceRange([
        onboardingCriteria.minPrice ? Math.max(MIN_BUDGET, onboardingCriteria.minPrice) : MIN_BUDGET,
        onboardingCriteria.maxPrice ? Math.min(MAX_BUDGET, onboardingCriteria.maxPrice) : MAX_BUDGET,
      ]);
      if (onboardingCriteria.schoolOrCompany && !searchKeyword) {
        setSearchKeyword(onboardingCriteria.schoolOrCompany);
      }
    } else if (tab === "discover") {
      if (discoverFilters) {
        setFilterDistrict(discoverFilters.district || "ALL");
        setFilterRoomType(
          discoverFilters.roomType ? normalizeRoomTypeCategory(discoverFilters.roomType) : "ALL"
        );
        setSearchKeyword(discoverFilters.keyword || "");
        setFilterAmenities(discoverFilters.amenities || []);
        setPriceRange([
          discoverFilters.minPrice ? Math.max(MIN_BUDGET, discoverFilters.minPrice) : MIN_BUDGET,
          discoverFilters.maxPrice ? Math.min(MAX_BUDGET, discoverFilters.maxPrice) : MAX_BUDGET,
        ]);
      } else if (compared[0]) {
        setFilterDistrict(compared[0].district || "ALL");
        setFilterRoomType("ALL");
        setPriceRange([MIN_BUDGET, MAX_BUDGET]);
      }
    } else if (tab === "all" || tab === "saved") {
      setSearchKeyword("");
      setFilterDistrict("ALL");
      setFilterRoomType("ALL");
      setPriceRange([MIN_BUDGET, MAX_BUDGET]);
      setFilterAmenities([]);
    }
  };

  const handleResetModalFilters = () => {
    setModalTab("all");
    setSearchKeyword("");
    setFilterDistrict("ALL");
    setFilterRoomType("ALL");
    setPriceRange([MIN_BUDGET, MAX_BUDGET]);
    setFilterAmenities([]);
  };

  const toggleModalAmenity = (amenity: string) => {
    setFilterAmenities((prev) =>
      prev.includes(amenity) ? prev.filter((a) => a !== amenity) : [...prev, amenity]
    );
  };

  // Compute filtered & scored candidate rooms for the modal
  const existingComparedIds = useMemo(
    () => new Set(compared.map((r) => String(r.id))),
    [compared]
  );

  // Resolve university/company/landmark coordinates & district from search keyword (0 external API requests)
  const resolvedLandmark = useMemo(
    () => resolveLandmarkFromQuery(searchKeyword),
    [searchKeyword]
  );
  const inferredSchoolDistrict = useMemo(
    () => inferDistrictFromSchoolOrPlace(searchKeyword),
    [searchKeyword]
  );

  const checkMatchesOnboarding = (rm: any): boolean => {
    if (!onboardingCriteria) return false;
    let matches = false;
    if (
      onboardingCriteria.districts.length > 0 &&
      onboardingCriteria.districts.some(
        (d) => d.toLowerCase() === String(rm.district || "").toLowerCase()
      )
    ) {
      matches = true;
    }
    const price = Number(rm.price || 0);
    if (
      onboardingCriteria.maxPrice &&
      price > 0 &&
      price <= onboardingCriteria.maxPrice &&
      (!onboardingCriteria.minPrice || price >= onboardingCriteria.minPrice)
    ) {
      matches = true;
    }
    return matches;
  };

  const filteredModalRooms = useMemo(() => {
    const matched = allCatalogRooms
      .filter((rm) => !existingComparedIds.has(String(rm.id)))
      .filter((rm) => {
        // 1. Saved tab filter
        if (modalTab === "saved" && !savedRoomIds.has(String(rm.id))) {
          return false;
        }

        // 2. Keyword + Spatial School/Landmark filter (title, street, district OR <= 3.8km from school OR school's district)
        if (searchKeyword.trim()) {
          const kw = searchKeyword.trim().toLowerCase();
          const title = String(rm.title || "").toLowerCase();
          const street = String(rm.addressStreet || rm.address || "").toLowerCase();
          const dist = String(rm.district || "").toLowerCase();
          const directTextMatch = title.includes(kw) || street.includes(kw) || dist.includes(kw);

          let landmarkMatch = false;
          if (resolvedLandmark) {
            const lat = Number(rm.latitude ?? rm.lat ?? 0);
            const lng = Number(rm.longitude ?? rm.lng ?? 0);
            if (lat && lng) {
              const distKm = calculateDistanceKm(resolvedLandmark.lat, resolvedLandmark.lng, lat, lng);
              if (distKm <= 3.8) landmarkMatch = true;
            }
            const landmarkDistLower = resolvedLandmark.district.toLowerCase();
            if (
              dist === landmarkDistLower ||
              (landmarkDistLower.includes("thủ đức") && (dist.includes("thủ đức") || dist === "quận 9"))
            ) {
              landmarkMatch = true;
            }
          } else if (inferredSchoolDistrict) {
            const targetDist = inferredSchoolDistrict.toLowerCase();
            if (
              dist === targetDist ||
              (targetDist.includes("thủ đức") && (dist.includes("thủ đức") || dist === "quận 9"))
            ) {
              landmarkMatch = true;
            }
          }

          if (!directTextMatch && !landmarkMatch) {
            return false;
          }
        }

        // 3. District filter
        if (filterDistrict !== "ALL") {
          const rmDist = String(rm.district || "").toLowerCase();
          const targetDist = filterDistrict.toLowerCase();
          const isThuDucMatch =
            (targetDist.includes("thủ đức") || targetDist === "quận 9") &&
            (rmDist.includes("thủ đức") || rmDist === "quận 9");
          if (rmDist !== targetDist && !isThuDucMatch) {
            return false;
          }
        }

        // 4. Room Type filter
        if (filterRoomType !== "ALL") {
          const rmTypeCat = normalizeRoomTypeCategory(rm.roomType || rm.type);
          if (rmTypeCat !== filterRoomType) {
            return false;
          }
        }

        // 5. Continuous Price Range filter
        const price = Number(rm.price || 0);
        if (price > 0) {
          if (priceRange[0] > MIN_BUDGET && price < priceRange[0]) return false;
          if (priceRange[1] < MAX_BUDGET && price > priceRange[1]) return false;
        }

        // 6. Amenities filter
        if (filterAmenities.length > 0) {
          const rmAmenities: string[] = Array.isArray(rm.amenities) ? rm.amenities : [];
          const hasAll = filterAmenities.every((targetA) =>
            rmAmenities.some((a) => a.toLowerCase().trim() === targetA.toLowerCase().trim())
          );
          if (!hasAll) return false;
        }

        return true;
      });

    // Sort by proximity to searched university/landmark when active
    if (resolvedLandmark) {
      return [...matched].sort((a, b) => {
        const aLat = Number(a.latitude ?? a.lat ?? 0);
        const aLng = Number(a.longitude ?? a.lng ?? 0);
        const bLat = Number(b.latitude ?? b.lat ?? 0);
        const bLng = Number(b.longitude ?? b.lng ?? 0);
        const aDist = aLat && aLng ? calculateDistanceKm(resolvedLandmark.lat, resolvedLandmark.lng, aLat, aLng) : 99;
        const bDist = bLat && bLng ? calculateDistanceKm(resolvedLandmark.lat, resolvedLandmark.lng, bLat, bLng) : 99;
        return aDist - bDist;
      });
    }
    return matched;
  }, [
    allCatalogRooms,
    existingComparedIds,
    modalTab,
    savedRoomIds,
    searchKeyword,
    resolvedLandmark,
    inferredSchoolDistrict,
    filterDistrict,
    filterRoomType,
    priceRange,
    filterAmenities,
  ]);

  const handleAddRoom = async (roomItem: any) => {
    if (compared.length >= 4) {
      toast.info("Chỉ có thể so sánh tối đa 4 phòng cùng lúc.");
      return;
    }

    const optimisticRoom = mapApiRoomToCompareItem(roomItem, compared.length);
    const nextList = [...compared, optimisticRoom];
    const nextIdsStr = nextList.map((r) => r.id).join(",");

    lastSyncedIdsRef.current = nextIdsStr;
    setCompared(nextList);
    setSearchParams({ ids: nextIdsStr }, { replace: true });
    setIsAddModalOpen(false);
    toast.success("Đã thêm phòng vào bảng so sánh", { description: optimisticRoom.title });

    // Enrich with full RoomDetailResponse (landlord fullName, trustScore, depositAmount, fees) in background
    try {
      const fullDetail = await roomsApi.getRoomById(String(roomItem.id));
      const enriched = mapApiRoomToCompareItem(fullDetail, nextList.length - 1);
      setCompared((prev) => prev.map((item) => (item.id === enriched.id ? enriched : item)));
    } catch {
      // Optimistic room item already has valid image, price, area, district, and amenities
    }
  };

  const handleRemoveRoom = (roomId: string) => {
    if (compared.length <= 1) {
      toast.info("Cần giữ lại ít nhất 1 phòng trên bảng so sánh.");
      return;
    }
    const nextList = compared.filter((r) => r.id !== roomId);
    const nextIdsStr = nextList.map((r) => r.id).join(",");
    lastSyncedIdsRef.current = nextIdsStr;
    setCompared(nextList);
    setSearchParams({ ids: nextIdsStr }, { replace: true });
  };

  // Find highlights (only highlight when >= 2 rooms are compared)
  const validPrices = compared.map((r) => r.price).filter((p) => p > 0);
  const minPrice = compared.length >= 2 && validPrices.length > 0 ? Math.min(...validPrices) : 0;
  const validAreas = compared.map((r) => r.area).filter((a) => a > 0);
  const maxArea = compared.length >= 2 && validAreas.length > 0 ? Math.max(...validAreas) : 0;

  const savedAvailableCount = useMemo(
    () =>
      allCatalogRooms.filter(
        (rm) => !existingComparedIds.has(String(rm.id)) && savedRoomIds.has(String(rm.id))
      ).length,
    [allCatalogRooms, existingComparedIds, savedRoomIds]
  );

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-6 sm:py-8 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="brand text-2xl sm:text-3xl text-foreground flex items-center gap-2">
              <ArrowLeftRight className="size-6 text-primary" />
              So sánh phòng trọ
            </h1>
            <Badge variant="outline" className="text-emerald-700 bg-emerald-50 border-emerald-200">
              {compared.length}/4 phòng đang so sánh
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Đặt các phòng cạnh nhau để chọn nơi ở tối ưu nhất về ngân sách, diện tích và tiện nghi thực tế
          </p>
        </div>

        <div data-tour="compare-header-actions" className="flex items-center gap-2 self-start sm:self-auto">
          {compared.length < 4 && (
            <Button
              size="sm"
              onClick={handleOpenAddModal}
              className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer text-xs font-semibold"
            >
              <Plus className="size-3.5" /> Thêm phòng so sánh
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/discover")}
            className="gap-1.5 text-xs cursor-pointer"
          >
            <ArrowLeft className="size-3.5" /> Khám phá thêm
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="rounded-3xl border border-border bg-card p-6 shadow-xs space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <Skeleton className="h-44 w-full rounded-2xl" />
            <Skeleton className="h-44 w-full rounded-2xl" />
            <Skeleton className="h-44 w-full rounded-2xl" />
          </div>
          <Skeleton className="h-10 w-full rounded-xl" />
          <Skeleton className="h-10 w-full rounded-xl" />
          <Skeleton className="h-10 w-full rounded-xl" />
        </div>
      ) : error ? (
        <div className="rounded-3xl border border-destructive/20 bg-card p-10 text-center shadow-xs">
          <AlertCircle className="size-10 text-destructive mx-auto mb-3" />
          <h3 className="text-lg font-bold text-foreground">Không thể tải dữ liệu so sánh</h3>
          <p className="mt-1 text-sm text-muted-foreground max-w-md mx-auto">{error}</p>
          <Button className="mt-4 cursor-pointer" variant="outline" onClick={fetchCompareData}>
            Thử lại
          </Button>
        </div>
      ) : compared.length === 0 ? (
        <div data-tour="compare-table-area" className="rounded-3xl border border-dashed border-border bg-card p-12 text-center shadow-xs">
          <div className="mx-auto grid size-16 place-items-center rounded-2xl bg-emerald-50 text-emerald-600 mb-3">
            <AlertCircle className="size-8" />
          </div>
          <h3 className="text-lg font-bold text-foreground">Chưa có phòng để so sánh</h3>
          <p className="mt-1 text-sm text-muted-foreground max-w-md mx-auto">
            Vui lòng chọn phòng từ trang Khám phá hoặc bấm nút bên dưới để chọn các phòng ưng ý.
          </p>
          <div className="mt-5 flex items-center justify-center gap-2">
            <Button
              className="bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer gap-1.5"
              onClick={handleOpenAddModal}
            >
              <Plus className="size-4" /> Chọn phòng để so sánh
            </Button>
            <Button variant="outline" className="cursor-pointer" onClick={() => navigate("/discover")}>
              Khám phá phòng
            </Button>
          </div>
        </div>
      ) : (
        /* Modern Comparison Card Container with fixed equal column geometry */
        <div data-tour="compare-table-area" className="rounded-3xl border border-border bg-card shadow-sm ring-1 ring-border/50 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] table-fixed border-collapse">
              <thead>
                <tr data-tour="compare-room-cards" className="bg-slate-50/70 border-b border-border">
                  <th className="w-[185px] p-4 text-left font-bold text-xs uppercase tracking-wider text-muted-foreground align-top">
                    <div className="space-y-1.5">
                      <span>Thông số so sánh</span>
                      <p className="font-normal normal-case text-[11px] text-muted-foreground leading-relaxed">
                        So sánh trực tiếp giá thuê, tiền cọc, diện tích và tiện nghi thực tế.
                      </p>
                    </div>
                  </th>
                  {compared.map((r) => {
                    const isBestPrice = minPrice > 0 && r.price === minPrice;
                    const isLargest = maxArea > 0 && r.area === maxArea;

                    return (
                      <th key={r.id} className="p-4 text-left align-top">
                        <div className="flex flex-col h-full">
                          <div className="relative rounded-2xl overflow-hidden aspect-[16/10] w-full bg-muted mb-3 group shrink-0 ring-1 ring-border/60">
                            <ImageWithFallback
                              src={r.images[0]}
                              alt={r.title}
                              className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
                            />
                            {compared.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveRoom(r.id)}
                                className="absolute top-2 right-2 size-7 rounded-full bg-black/65 hover:bg-rose-600 text-white grid place-items-center transition cursor-pointer shadow-xs"
                                title="Bỏ phòng này khỏi bảng so sánh"
                              >
                                <Trash2 className="size-3.5" />
                              </button>
                            )}
                            <div className="absolute bottom-2 left-2 flex flex-wrap gap-1">
                              {isBestPrice && (
                                <Badge className="bg-emerald-600 text-white text-[10px] px-2 py-0.5 border-none shadow-xs">
                                  <Sparkles className="size-3 mr-1" /> Tiết kiệm nhất
                                </Badge>
                              )}
                              {isLargest && (
                                <Badge className="bg-blue-600 text-white text-[10px] px-2 py-0.5 border-none shadow-xs">
                                  Rộng nhất
                                </Badge>
                              )}
                            </div>
                          </div>

                          <Link
                            to={`/rooms/${r.id}`}
                            className="hover:text-primary transition-colors block"
                          >
                            <h3 className="font-semibold text-sm line-clamp-2 min-h-[2.5rem] text-foreground mb-1 leading-snug">
                              {r.title}
                            </h3>
                          </Link>

                          <p className="text-xs text-muted-foreground flex items-center gap-1 mb-3 min-w-0">
                            <MapPin className="size-3 text-primary shrink-0" />
                            <span className="truncate">
                              {r.address ? `${r.address}, ${r.district}` : r.district}
                            </span>
                          </p>

                          <div className="mt-auto flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="flex-1 text-xs h-8.5 cursor-pointer font-medium"
                              onClick={() => navigate(`/rooms/${r.id}`)}
                            >
                              Chi tiết
                            </Button>
                            <Button
                              size="sm"
                              className="flex-1 text-xs h-8.5 bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer font-semibold gap-1"
                              onClick={() => navigate(`/rooms/${r.id}`)}
                            >
                              <KeyRound className="size-3" /> Thuê
                            </Button>
                          </div>
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>

              <tbody className="text-sm divide-y divide-border">
                {/* Giá thuê */}
                <tr data-tour="compare-price-row" className="hover:bg-slate-50/50 transition">
                  <td className="py-3.5 px-4 font-semibold text-xs uppercase tracking-wider text-slate-500 bg-slate-50/40">
                    Giá thuê
                  </td>
                  {compared.map((r) => {
                    const isBestPrice = minPrice > 0 && r.price === minPrice;
                    return (
                      <td key={r.id} className="py-3.5 px-4 tabular-nums">
                        <span
                          className={cn(
                            "text-base font-bold",
                            isBestPrice ? "text-emerald-600" : "text-foreground"
                          )}
                        >
                          {formatVND(r.price)}
                        </span>
                        <span className="text-xs text-muted-foreground">/tháng</span>
                      </td>
                    );
                  })}
                </tr>

                {/* Tiền đặt cọc thực tế */}
                <tr className="hover:bg-slate-50/50 transition">
                  <td className="py-3.5 px-4 font-semibold text-xs uppercase tracking-wider text-slate-500 bg-slate-50/40">
                    Đặt cọc
                  </td>
                  {compared.map((r) => (
                    <td key={r.id} className="py-3.5 px-4 text-slate-700 font-medium tabular-nums">
                      {r.depositAmount === 0
                        ? "Miễn cọc (0đ)"
                        : r.depositAmount === r.price
                        ? `${formatVND(r.depositAmount)} (1 tháng)`
                        : formatVND(r.depositAmount)}
                    </td>
                  ))}
                </tr>

                {/* Khu vực & Địa chỉ */}
                <tr className="hover:bg-slate-50/50 transition">
                  <td className="py-3.5 px-4 font-semibold text-xs uppercase tracking-wider text-slate-500 bg-slate-50/40">
                    Khu vực
                  </td>
                  {compared.map((r) => (
                    <td key={r.id} className="py-3.5 px-4 text-slate-800 font-medium">
                      <Link
                        to={`/discover?district=${encodeURIComponent(r.district)}`}
                        className="hover:text-primary hover:underline underline-offset-4 transition-colors"
                      >
                        {r.address ? `${r.address}, ${r.district}` : `${r.district}, TP.HCM`}
                      </Link>
                    </td>
                  ))}
                </tr>

                {/* Diện tích */}
                <tr className="hover:bg-slate-50/50 transition">
                  <td className="py-3.5 px-4 font-semibold text-xs uppercase tracking-wider text-slate-500 bg-slate-50/40">
                    Diện tích
                  </td>
                  {compared.map((r) => {
                    const isLargest = maxArea > 0 && r.area === maxArea;
                    return (
                      <td key={r.id} className="py-3.5 px-4 tabular-nums">
                        <span
                          className={cn(
                            "font-semibold",
                            isLargest ? "text-blue-600 font-bold" : "text-slate-800"
                          )}
                        >
                          {r.area} m²
                        </span>
                      </td>
                    );
                  })}
                </tr>

                {/* Tầng & Loại phòng (Đã chuẩn hóa tiếng Việt) */}
                <tr className="hover:bg-slate-50/50 transition">
                  <td className="py-3.5 px-4 font-semibold text-xs uppercase tracking-wider text-slate-500 bg-slate-50/40">
                    Loại phòng & Sức chứa
                  </td>
                  {compared.map((r) => (
                    <td key={r.id} className="py-3.5 px-4 text-slate-700">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <Badge variant="secondary" className="text-xs font-medium bg-mint/80 text-emerald-900">
                          {r.type}
                        </Badge>
                        <Badge variant="outline" className="text-xs font-normal">
                          Tầng {r.floor} • Tối đa {r.maxOccupants || 2} người
                        </Badge>
                      </div>
                    </td>
                  ))}
                </tr>

                {/* Chủ trọ & Điểm uy tín thực tế */}
                <tr className="hover:bg-slate-50/50 transition">
                  <td className="py-3.5 px-4 font-semibold text-xs uppercase tracking-wider text-slate-500 bg-slate-50/40">
                    Chủ trọ & Uy tín
                  </td>
                  {compared.map((r) => (
                    <td key={r.id} className="py-3.5 px-4">
                      <div className="space-y-1">
                        <p className="font-semibold text-xs text-foreground flex items-center gap-1.5 flex-wrap">
                          <span>{r.landlord.name}</span>
                          {r.landlord.verified && (
                            <span
                              className="inline-flex items-center gap-0.5 text-[10px] font-medium text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-full border border-emerald-200"
                              title="Chủ trọ đã xác thực CCCD"
                            >
                              <ShieldCheck className="size-3 text-emerald-600" /> Đã xác thực
                            </span>
                          )}
                        </p>
                        <p className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                          <Star className="size-3.5 fill-amber-400 text-amber-400" />
                          <span>
                            Điểm uy tín: <strong className="text-foreground">{r.rating.toFixed(1)}/5.0</strong>
                          </span>
                          <span className="text-[11px]">({r.trustScore} điểm TrustScore)</span>
                        </p>
                      </div>
                    </td>
                  ))}
                </tr>

                {/* Tiện nghi từng mục */}
                {allAmenities.map((a) => (
                  <tr key={a} className="hover:bg-slate-50/50 transition">
                    <td className="py-2.5 px-4 font-medium text-xs text-slate-600 bg-slate-50/30">
                      {a}
                    </td>
                    {compared.map((r) => {
                      const hasAmenity =
                        Array.isArray(r.amenities) &&
                        r.amenities.some((item) => item.toLowerCase().trim() === a.toLowerCase().trim());
                      return (
                        <td key={r.id} className="py-2.5 px-4">
                          {hasAmenity ? (
                            <span className="inline-flex items-center gap-1 text-emerald-700 text-xs font-medium bg-emerald-50 px-2 py-0.5 rounded-md">
                              <Check className="size-3.5 text-emerald-600" /> Có
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-slate-400 text-xs">
                              <X className="size-3.5 text-slate-300" /> Không
                            </span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Upgraded Add Room Modal with Clean Editorial Hierarchy, Shadcn Select & Budget Popover */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[88dvh] flex flex-col p-0 overflow-hidden gap-0">
          <DialogHeader className="px-6 pt-5 pb-3.5 border-b border-border/60 shrink-0 space-y-3 text-left">
            <div className="pr-6">
              <DialogTitle className="text-foreground text-base font-bold tracking-tight">
                Thêm phòng vào bảng so sánh
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                Chọn nguồn phòng bên dưới hoặc lọc theo khu vực, loại phòng và khoảng ngân sách mong muốn
              </DialogDescription>
            </div>

            {/* Clean Segmented Source Control */}
            <div className="inline-flex flex-wrap items-center gap-1 rounded-lg bg-muted/70 p-1 w-fit">
              <button
                type="button"
                onClick={() => handleSelectModalTab("all")}
                className={cn(
                  "rounded-md px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer",
                  modalTab === "all"
                    ? "bg-background text-foreground shadow-2xs font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Tất cả ({allCatalogRooms.length - existingComparedIds.size > 0 ? allCatalogRooms.length - existingComparedIds.size : 0})
              </button>

              {user && onboardingCriteria && (
                <button
                  type="button"
                  onClick={() => handleSelectModalTab("profile")}
                  className={cn(
                    "rounded-md px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer",
                    modalTab === "profile"
                      ? "bg-background text-emerald-800 shadow-2xs font-semibold"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  Gợi ý theo hồ sơ
                </button>
              )}

              <button
                type="button"
                onClick={() => handleSelectModalTab("discover")}
                className={cn(
                  "rounded-md px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer",
                  modalTab === "discover"
                    ? "bg-background text-foreground shadow-2xs font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {discoverFilters ? "Theo bộ lọc Khám phá" : "Cùng khu vực đang xem"}
              </button>

              <button
                type="button"
                onClick={() => handleSelectModalTab("saved")}
                className={cn(
                  "rounded-md px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer",
                  modalTab === "saved"
                    ? "bg-background text-rose-700 shadow-2xs font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Đã lưu ({savedAvailableCount})
              </button>
            </div>
          </DialogHeader>

          {/* Self-Explanatory 2-Row Filter Bar */}
          <div className="px-6 py-3.5 bg-slate-50/70 border-b border-border/60 space-y-3 shrink-0">
            {/* Row 1: Full-Width Search Input (Never cuts off placeholder) */}
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
              <Input
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                placeholder="Tìm theo tên phòng, tên đường hoặc trường đại học (VD: ĐH Bách Khoa, RMIT, Võ Văn Tần)..."
                className="pl-8.5 pr-8 h-9 text-xs bg-background w-full"
              />
              {searchKeyword && (
                <button
                  type="button"
                  onClick={() => setSearchKeyword("")}
                  aria-label="Xóa từ khóa"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  <X className="size-3.5" />
                </button>
              )}
            </div>

            {/* Row 2: 4 Identical Labeled Dropdowns (Khu vực, Loại phòng, Mức giá thuê, Tiện nghi) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {/* 1. Khu vực */}
              <div className="space-y-1">
                <label className="block text-[11px] font-medium text-muted-foreground">
                  Khu vực quận
                </label>
                <Select value={filterDistrict} onValueChange={setFilterDistrict}>
                  <SelectTrigger className="w-full h-9 text-xs bg-background">
                    <SelectValue placeholder="Tất cả quận" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL" className="text-xs">
                      Tất cả quận
                    </SelectItem>
                    {districts.map((d) => (
                      <SelectItem key={d} value={d} className="text-xs">
                        {d}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* 2. Loại phòng */}
              <div className="space-y-1">
                <label className="block text-[11px] font-medium text-muted-foreground">
                  Loại phòng
                </label>
                <Select value={filterRoomType} onValueChange={setFilterRoomType}>
                  <SelectTrigger className="w-full h-9 text-xs bg-background">
                    <SelectValue placeholder="Mọi loại phòng" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL" className="text-xs">
                      Mọi loại phòng
                    </SelectItem>
                    <SelectItem value="Studio" className="text-xs">
                      Studio
                    </SelectItem>
                    <SelectItem value="Phòng khép kín" className="text-xs">
                      Phòng khép kín
                    </SelectItem>
                    <SelectItem value="Căn hộ mini" className="text-xs">
                      Căn hộ mini
                    </SelectItem>
                    <SelectItem value="Ở ghép" className="text-xs">
                      Ở ghép / KTX
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* 3. Mức giá thuê (Synchronized Dropdown with Quick Presets + Custom Dual-Thumb Slider) */}
              <div className="space-y-1">
                <label className="block text-[11px] font-medium text-muted-foreground">
                  Mức giá thuê
                </label>
                <Popover>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      className={cn(
                        "border-input flex h-9 w-full cursor-pointer items-center justify-between gap-1.5 rounded-md border bg-background px-3 py-2 text-xs whitespace-nowrap transition-all duration-150 hover:border-primary/40 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 tabular-nums",
                        (priceRange[0] > MIN_BUDGET || priceRange[1] < MAX_BUDGET) &&
                          "border-primary/50 text-primary font-semibold bg-mint/20"
                      )}
                    >
                      <span className="truncate">
                        {priceRange[0] <= MIN_BUDGET && priceRange[1] >= MAX_BUDGET
                          ? "Mọi mức giá"
                          : `${(priceRange[0] / 1e6).toFixed(1)}tr – ${(priceRange[1] / 1e6).toFixed(1)}tr`}
                      </span>
                      <ChevronDown className="size-4 opacity-50 shrink-0" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent align="start" className="w-76 p-4 space-y-4">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-foreground">Khoảng giá mỗi tháng</span>
                        <span className="font-bold text-primary tabular-nums">
                          {(priceRange[0] / 1e6).toFixed(1)}tr – {(priceRange[1] / 1e6).toFixed(1)}tr
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground">
                        Kéo 2 đầu thanh trượt để tự chỉnh hoặc bấm mức giá gợi ý bên dưới
                      </p>
                    </div>

                    <div className="space-y-2 pt-1">
                      <Slider
                        value={priceRange}
                        onValueChange={(val) => setPriceRange([val[0], val[1]])}
                        min={MIN_BUDGET}
                        max={MAX_BUDGET}
                        step={100000}
                        minStepsBetweenThumbs={1}
                      />
                      <div className="flex justify-between text-[10px] text-muted-foreground tabular-nums">
                        <span>0.5 triệu</span>
                        <span>7.5 triệu</span>
                        <span>15 triệu+</span>
                      </div>
                    </div>

                    <div className="space-y-1.5 pt-2 border-t border-border/60">
                      <span className="block text-[11px] font-medium text-muted-foreground">
                        Chọn nhanh mức giá:
                      </span>
                      <div className="grid grid-cols-2 gap-1.5">
                        {[
                          { label: "Mọi mức giá", range: [MIN_BUDGET, MAX_BUDGET] as [number, number] },
                          { label: "Dưới 3 triệu", range: [MIN_BUDGET, 3000000] as [number, number] },
                          { label: "3 – 4.5 triệu", range: [3000000, 4500000] as [number, number] },
                          { label: "Trên 4.5 triệu", range: [4500000, MAX_BUDGET] as [number, number] },
                        ].map((preset) => {
                          const isActive =
                            priceRange[0] === preset.range[0] && priceRange[1] === preset.range[1];
                          return (
                            <button
                              key={preset.label}
                              type="button"
                              onClick={() => setPriceRange(preset.range)}
                              className={cn(
                                "rounded-md border px-2.5 py-1.5 text-xs font-medium transition-colors cursor-pointer text-left tabular-nums",
                                isActive
                                  ? "border-primary bg-primary text-primary-foreground font-semibold"
                                  : "border-border bg-background text-foreground hover:bg-accent"
                              )}
                            >
                              {preset.label}
                            </button>
                          );
                        })}
                        {onboardingCriteria?.maxPrice && (
                          <button
                            type="button"
                            onClick={() =>
                              setPriceRange([
                                onboardingCriteria.minPrice
                                  ? Math.max(MIN_BUDGET, onboardingCriteria.minPrice)
                                  : MIN_BUDGET,
                                Math.min(MAX_BUDGET, onboardingCriteria.maxPrice!),
                              ])
                            }
                            className="col-span-2 rounded-md border border-emerald-200 bg-mint/60 hover:bg-mint px-2.5 py-1.5 text-xs font-semibold text-emerald-900 transition-colors cursor-pointer text-left tabular-nums"
                          >
                            Theo ngân sách hồ sơ ({((onboardingCriteria.minPrice || MIN_BUDGET) / 1e6).toFixed(1)}tr –{" "}
                            {(onboardingCriteria.maxPrice / 1e6).toFixed(1)}tr)
                          </button>
                        )}
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>

              {/* 4. Tiện nghi (Synchronized Dropdown Checklist) */}
              <div className="space-y-1">
                <label className="block text-[11px] font-medium text-muted-foreground">
                  Tiện nghi có sẵn
                </label>
                <Popover>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      className={cn(
                        "border-input flex h-9 w-full cursor-pointer items-center justify-between gap-1.5 rounded-md border bg-background px-3 py-2 text-xs whitespace-nowrap transition-all duration-150 hover:border-primary/40 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
                        filterAmenities.length > 0 &&
                          "border-primary/50 text-primary font-semibold bg-mint/20"
                      )}
                    >
                      <span className="truncate">
                        {filterAmenities.length === 0
                          ? "Mọi tiện nghi"
                          : `Đã chọn ${filterAmenities.length} tiện nghi`}
                      </span>
                      <ChevronDown className="size-4 opacity-50 shrink-0" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent align="end" className="w-64 p-3 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-foreground">
                        Lọc theo tiện nghi
                      </span>
                      {filterAmenities.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setFilterAmenities([])}
                          className="text-[11px] font-medium text-primary hover:underline cursor-pointer"
                        >
                          Bỏ chọn ({filterAmenities.length})
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-1.5">
                      {allAmenities.map((am) => {
                        const active = filterAmenities.includes(am);
                        return (
                          <button
                            key={am}
                            type="button"
                            onClick={() => toggleModalAmenity(am)}
                            className={cn(
                              "flex items-center justify-between rounded-md border px-2.5 py-1.5 text-xs transition-colors cursor-pointer text-left",
                              active
                                ? "border-primary bg-mint/60 text-emerald-950 font-semibold"
                                : "border-border/80 bg-background text-foreground hover:bg-accent"
                            )}
                          >
                            <span className="truncate">{am}</span>
                            {active && <Check className="size-3.5 text-primary shrink-0 ml-1" />}
                          </button>
                        );
                      })}
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Status & Active Filter Summary Bar */}
            <div className="flex items-center justify-between gap-2 pt-0.5 text-xs">
              <div className="text-muted-foreground truncate">
                {resolvedLandmark ? (
                  <span>
                    Tìm thấy <strong className="text-foreground">{filteredModalRooms.length} phòng</strong> quanh{" "}
                    <strong className="text-emerald-800">{resolvedLandmark.shortName}</strong> ({resolvedLandmark.district})
                  </span>
                ) : (
                  <span>
                    Hiển thị <strong className="text-foreground tabular-nums">{filteredModalRooms.length}</strong> phòng có thể thêm
                  </span>
                )}
              </div>

              {(searchKeyword ||
                filterDistrict !== "ALL" ||
                filterRoomType !== "ALL" ||
                priceRange[0] > MIN_BUDGET ||
                priceRange[1] < MAX_BUDGET ||
                filterAmenities.length > 0 ||
                modalTab !== "all") && (
                <button
                  type="button"
                  onClick={handleResetModalFilters}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline cursor-pointer shrink-0"
                >
                  <RotateCcw className="size-3" /> Đặt lại bộ lọc
                </button>
              )}
            </div>
          </div>

          {/* Filtered Candidate Room List */}
          <div className="px-6 py-3 space-y-2 overflow-y-auto flex-1 min-h-[240px]">
            {isLoadingAvailable ? (
              <div className="space-y-2.5 py-2">
                <Skeleton className="h-20 w-full rounded-xl" />
                <Skeleton className="h-20 w-full rounded-xl" />
                <Skeleton className="h-20 w-full rounded-xl" />
              </div>
            ) : filteredModalRooms.length === 0 ? (
              <div className="text-center py-8 space-y-2">
                <p className="text-sm font-semibold text-foreground">
                  Không tìm thấy phòng khớp bộ lọc hiện tại
                </p>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                  Thử mở rộng mức giá thuê, đổi khu vực quận hoặc đặt lại bộ lọc để xem toàn bộ danh sách phòng.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleResetModalFilters}
                  className="mt-2 text-xs gap-1.5 cursor-pointer"
                >
                  <RotateCcw className="size-3.5" /> Xem tất cả phòng có sẵn
                </Button>
              </div>
            ) : (
              filteredModalRooms.map((rm, idx) => {
                const mappedPreview = mapApiRoomToCompareItem(rm, idx);
                const isSavedRoom = savedRoomIds.has(mappedPreview.id);
                const isProfileMatch = checkMatchesOnboarding(rm);
                const rmLat = Number(rm.latitude ?? rm.lat ?? 0);
                const rmLng = Number(rm.longitude ?? rm.lng ?? 0);
                const distanceToSchoolKm =
                  resolvedLandmark && rmLat && rmLng
                    ? calculateDistanceKm(resolvedLandmark.lat, resolvedLandmark.lng, rmLat, rmLng)
                    : undefined;

                return (
                  <div
                    key={mappedPreview.id}
                    className="flex items-center justify-between p-3 rounded-xl border border-border/80 hover:border-primary/40 bg-card hover:bg-slate-50/70 transition-colors gap-3"
                  >
                    <div className="flex items-center gap-3.5 min-w-0 flex-1">
                      <ImageWithFallback
                        src={mappedPreview.images[0]}
                        alt={mappedPreview.title}
                        className="h-16 w-22 rounded-lg object-cover shrink-0 ring-1 ring-border/50"
                      />
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-700">
                            {mappedPreview.type}
                          </span>
                          {distanceToSchoolKm !== undefined && (
                            <span className="rounded bg-emerald-50 border border-emerald-200/80 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-800 tabular-nums">
                              Cách {resolvedLandmark?.shortName}{" "}
                              {distanceToSchoolKm < 1
                                ? `${Math.round(distanceToSchoolKm * 1000)}m`
                                : `${distanceToSchoolKm.toFixed(1)} km`}
                            </span>
                          )}
                          {isProfileMatch && (
                            <span className="rounded bg-mint/70 px-1.5 py-0.5 text-[10px] font-medium text-emerald-900">
                              Khớp hồ sơ
                            </span>
                          )}
                          {isSavedRoom && (
                            <span className="rounded bg-rose-50 px-1.5 py-0.5 text-[10px] font-medium text-rose-700">
                              Đã lưu
                            </span>
                          )}
                        </div>

                        <p className="font-semibold text-xs sm:text-sm text-foreground truncate">
                          {mappedPreview.title}
                        </p>

                        <p className="text-[11px] text-muted-foreground truncate tabular-nums">
                          {mappedPreview.address
                            ? `${mappedPreview.address}, ${mappedPreview.district}`
                            : mappedPreview.district}
                          {" • "}
                          {mappedPreview.area} m²
                          {" • "}
                          Tầng {mappedPreview.floor}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      <p className="text-xs sm:text-sm font-bold text-primary tabular-nums">
                        {formatVND(mappedPreview.price)}
                        <span className="text-[10px] font-normal text-muted-foreground">/th</span>
                      </p>
                      <Button
                        size="sm"
                        onClick={() => handleAddRoom(rm)}
                        className="text-xs h-8 px-3.5 bg-primary hover:bg-primary/90 text-primary-foreground shrink-0 cursor-pointer font-semibold active:scale-[0.97] transition-transform"
                      >
                        Thêm vào bảng
                      </Button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
