import { SlidersHorizontal, Search, RotateCcw, CigaretteOff, Moon, Sparkles, Users } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { roomTypes, districts } from "@/lib/constants";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

export const AMENITY_OPTIONS = [
  "Máy lạnh",
  "Wi-Fi",
  "WC riêng",
  "Giờ tự do",
  "Bãi xe",
  "Bếp riêng",
  "Ban công",
  "Thang máy",
] as const;

export interface RoomFilterState {
  district?: string;
  roomType?: string;
  minPrice?: number;
  maxPrice?: number;
  keyword?: string;
  amenities?: string[];
}

export interface AppliedFilterCriteria extends RoomFilterState {
  minAge?: number;
  maxAge?: number;
  nonSmoking?: boolean;
  earlySleeper?: boolean;
  isNeat?: boolean;
  allowGuests?: boolean;
}

const FILTER_ROOM_TYPES = [
  { value: "ALL", label: "Tất cả loại phòng" },
  ...roomTypes.map((t) => ({ value: t, label: t })),
] as const;

function normalizeRoomType(val?: string): string {
  if (!val || val === "ALL") return "ALL";
  if (val === "PHONG_KHEP_KIN") return "Phòng khép kín";
  if (val === "PHONG_TRO") return "Phòng trọ";
  if (val === "STUDIO") return "Studio";
  if (val === "CAN_HO_MINI") return "Căn hộ mini";
  if (val === "O_GHEP" || val === "KTX_SLEEPBOX" || val === "SLEEPBOX" || val === "KY_TUC_XA") return "Ở ghép";
  return val;
}

export interface FilterSidebarProps {
  variant?: "room" | "roommate";
  initialFilters?: AppliedFilterCriteria;
  onApply?: (filters: AppliedFilterCriteria) => void;
  onReset?: () => void;
  isLoading?: boolean;
  resetKey?: number;
}

export function FilterSidebar({
  variant = "room",
  initialFilters,
  onApply,
  onReset,
  isLoading = false,
  resetKey,
}: FilterSidebarProps) {
  const [budget, setBudget] = useState<number[]>([
    initialFilters?.minPrice ?? (variant === "roommate" ? 1500000 : 1500000),
    initialFilters?.maxPrice ?? (variant === "roommate" ? 5000000 : 5000000),
  ]);
  const [selectedDistrict, setSelectedDistrict] = useState<string>(initialFilters?.district || "");
  const [selectedRoomType, setSelectedRoomType] = useState<string>(
    normalizeRoomType(initialFilters?.roomType)
  );
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>(
    initialFilters?.amenities || []
  );
  const [keyword, setKeyword] = useState<string>(initialFilters?.keyword || "");
  const [age, setAge] = useState<number[]>([18, 28]);

  // Lifestyle filter states for roommates (clean badges, NO emoji)
  const [nonSmokingOnly, setNonSmokingOnly] = useState(false);
  const [earlySleeperOnly, setEarlySleeperOnly] = useState(false);
  const [neatOnly, setNeatOnly] = useState(false);
  const [allowGuestsOnly, setAllowGuestsOnly] = useState(false);

  // Sync when initialFilters change (e.g. from user profile)
  useEffect(() => {
    if (initialFilters) {
      if (initialFilters.minPrice != null && initialFilters.maxPrice != null) {
        setBudget([initialFilters.minPrice, initialFilters.maxPrice]);
      }
      if (initialFilters.district !== undefined) setSelectedDistrict(initialFilters.district);
      if (initialFilters.roomType !== undefined) {
        setSelectedRoomType(normalizeRoomType(initialFilters.roomType));
      }
      if (initialFilters.amenities !== undefined) {
        setSelectedAmenities(initialFilters.amenities);
      }
      if (initialFilters.keyword !== undefined) setKeyword(initialFilters.keyword);
      if (initialFilters.nonSmoking !== undefined) setNonSmokingOnly(Boolean(initialFilters.nonSmoking));
      if (initialFilters.earlySleeper !== undefined) setEarlySleeperOnly(Boolean(initialFilters.earlySleeper));
      if (initialFilters.isNeat !== undefined) setNeatOnly(Boolean(initialFilters.isNeat));
      if (initialFilters.allowGuests !== undefined) setAllowGuestsOnly(Boolean(initialFilters.allowGuests));
      if (initialFilters.minAge != null && initialFilters.maxAge != null) {
        setAge([initialFilters.minAge, initialFilters.maxAge]);
      }
    }
  }, [initialFilters]);

  // Sync when resetKey changes from parent (e.g. clicking reset in center empty state)
  useEffect(() => {
    if (resetKey !== undefined && resetKey > 0) {
      setBudget(variant === "roommate" ? [1500000, 5000000] : [500000, 10000000]);
      setSelectedDistrict("");
      setSelectedRoomType("ALL");
      setSelectedAmenities([]);
      setKeyword("");
      setAge([18, 28]);
      setNonSmokingOnly(false);
      setEarlySleeperOnly(false);
      setNeatOnly(false);
      setAllowGuestsOnly(false);
    }
  }, [resetKey, variant]);

  const toggleDistrict = (d: string) => {
    setSelectedDistrict((prev) => (prev === d ? "" : d));
  };

  const toggleAmenity = (a: string) => {
    setSelectedAmenities((prev) =>
      prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]
    );
  };

  const handleApply = () => {
    onApply?.({
      district: selectedDistrict ? selectedDistrict : undefined,
      roomType: selectedRoomType && selectedRoomType !== "ALL" ? selectedRoomType : undefined,
      amenities: selectedAmenities.length > 0 ? selectedAmenities : undefined,
      minPrice: budget[0],
      maxPrice: budget[1],
      keyword: keyword.trim() ? keyword.trim() : undefined,
      minAge: age[0],
      maxAge: age[1],
      nonSmoking: nonSmokingOnly ? true : undefined,
      earlySleeper: earlySleeperOnly ? true : undefined,
      isNeat: neatOnly ? true : undefined,
      allowGuests: allowGuestsOnly ? true : undefined,
    });
  };

  const handleReset = () => {
    setBudget(variant === "roommate" ? [1500000, 5000000] : [500000, 10000000]);
    setSelectedDistrict("");
    setSelectedRoomType("ALL");
    setSelectedAmenities([]);
    setKeyword("");
    setAge([18, 28]);
    setNonSmokingOnly(false);
    setEarlySleeperOnly(false);
    setNeatOnly(false);
    setAllowGuestsOnly(false);
    onReset?.();
  };

  return (
    <div className="space-y-4 rounded-2xl bg-card p-4 ring-1 ring-border shadow-xs">
      <div className="flex items-center justify-between gap-1">
        <div className="flex items-center gap-1.5 font-medium text-foreground text-sm whitespace-nowrap">
          <SlidersHorizontal className="size-3.5 text-primary shrink-0" />
          <h3 className="font-semibold text-sm">Bộ lọc tìm kiếm</h3>
        </div>
        <button
          type="button"
          onClick={handleReset}
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer whitespace-nowrap shrink-0"
          title="Xóa bộ lọc về mặc định"
        >
          <RotateCcw className="size-3" /> Đặt lại
        </button>
      </div>

      {/* 1. Keyword search (Near school, company, street) */}
      <div className="space-y-1">
        <Label htmlFor="filter-keyword" className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">
          Gần trường / Tuyến đường
        </Label>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
          <Input
            id="filter-keyword"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleApply()}
            placeholder="VD: Bách Khoa, KHTN..."
            className="pl-8 text-xs h-8"
          />
        </div>
      </div>

      {/* 2. Budget range slider */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-muted-foreground uppercase tracking-wider text-[11px] whitespace-nowrap">Khoảng giá</span>
          <span className="font-semibold text-primary text-xs whitespace-nowrap">
            {(budget[0] / 1e6).toFixed(1)} - {(budget[1] / 1e6).toFixed(1)} tr
          </span>
        </div>
        <Slider
          value={budget}
          onValueChange={setBudget}
          min={500000}
          max={15000000}
          step={100000}
          minStepsBetweenThumbs={0}
        />
        <div className="flex justify-between text-[10px] text-muted-foreground">
          <span>500k</span>
          <span>7.5tr</span>
          <span>15tr+</span>
        </div>
      </div>

      {/* 3. District selector */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <Label className="font-semibold text-muted-foreground uppercase tracking-wider text-[11px] whitespace-nowrap">Khu vực quận</Label>
          {selectedDistrict && (
            <span className="text-[11px] text-primary font-medium whitespace-nowrap truncate ml-1">
              Đã chọn: <strong>{selectedDistrict}</strong>
            </span>
          )}
        </div>
        <div className="flex flex-wrap gap-1 max-h-32 overflow-y-auto pr-0.5">
          {districts.map((d) => {
            const isSelected = selectedDistrict === d;
            return (
              <button
                key={d}
                type="button"
                onClick={() => toggleDistrict(d)}
                className={cn(
                  "rounded-full border px-2 py-0.5 text-[11px] font-medium transition cursor-pointer select-none whitespace-nowrap",
                  isSelected
                    ? "border-primary bg-primary text-primary-foreground shadow-xs"
                    : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"
                )}
              >
                {d}
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Room type dropdown matching backend & constants */}
      {variant === "room" ? (
        <>
          <div className="space-y-1">
            <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">
              Loại hình phòng trọ
            </Label>
            <Select value={selectedRoomType} onValueChange={setSelectedRoomType}>
              <SelectTrigger className="w-full text-xs h-8">
                <SelectValue placeholder="Chọn loại phòng" />
              </SelectTrigger>
              <SelectContent>
                {FILTER_ROOM_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value} className="text-xs">
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 5. Amenities selector (8 amenities matching landlord options) */}
          <div className="space-y-1.5 pt-1 border-t border-border/50">
            <div className="flex items-center justify-between text-xs">
              <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">
                Tiện nghi phòng
              </Label>
              {selectedAmenities.length > 0 && (
                <span className="text-[10px] text-primary font-semibold whitespace-nowrap">
                  Đã chọn: {selectedAmenities.length}
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-1">
              {AMENITY_OPTIONS.map((a) => {
                const isSelected = selectedAmenities.includes(a);
                return (
                  <button
                    key={a}
                    type="button"
                    onClick={() => toggleAmenity(a)}
                    className={cn(
                      "rounded-full border px-2 py-0.5 text-[11px] font-medium transition cursor-pointer select-none whitespace-nowrap",
                      isSelected
                        ? "border-primary bg-primary text-primary-foreground shadow-xs"
                        : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"
                    )}
                  >
                    {a}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      ) : (
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Độ tuổi: {age[0]} - {age[1]} tuổi
            </Label>
            <Slider value={age} onValueChange={setAge} min={18} max={40} step={1} minStepsBetweenThumbs={0} />
          </div>

          <div className="space-y-1.5 pt-2 border-t border-border/60">
            <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
              Tiêu chí lối sống
            </Label>
            <div className="flex flex-col gap-1.5">
              <button
                type="button"
                onClick={() => setNonSmokingOnly((prev) => !prev)}
                className={cn(
                  "flex items-center justify-between rounded-lg border px-2.5 py-1.5 text-xs font-medium transition cursor-pointer select-none",
                  nonSmokingOnly
                    ? "border-emerald-500 bg-emerald-50 text-emerald-800 shadow-xs"
                    : "border-border text-muted-foreground hover:border-border/80 hover:text-foreground"
                )}
              >
                <span className="flex items-center gap-1.5">
                  <CigaretteOff className={cn("size-3.5", nonSmokingOnly ? "text-emerald-600" : "text-muted-foreground")} />
                  Không hút thuốc
                </span>
                <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded", nonSmokingOnly ? "bg-emerald-200/60 text-emerald-900" : "bg-muted text-muted-foreground")}>
                  {nonSmokingOnly ? "Bắt buộc" : "Bất kỳ"}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setEarlySleeperOnly((prev) => !prev)}
                className={cn(
                  "flex items-center justify-between rounded-lg border px-2.5 py-1.5 text-xs font-medium transition cursor-pointer select-none",
                  earlySleeperOnly
                    ? "border-indigo-500 bg-indigo-50 text-indigo-800 shadow-xs"
                    : "border-border text-muted-foreground hover:border-border/80 hover:text-foreground"
                )}
              >
                <span className="flex items-center gap-1.5">
                  <Moon className={cn("size-3.5", earlySleeperOnly ? "text-indigo-600" : "text-muted-foreground")} />
                  Ngủ trước 23h
                </span>
                <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded", earlySleeperOnly ? "bg-indigo-200/60 text-indigo-900" : "bg-muted text-muted-foreground")}>
                  {earlySleeperOnly ? "Bắt buộc" : "Bất kỳ"}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setNeatOnly((prev) => !prev)}
                className={cn(
                  "flex items-center justify-between rounded-lg border px-2.5 py-1.5 text-xs font-medium transition cursor-pointer select-none",
                  neatOnly
                    ? "border-amber-500 bg-amber-50 text-amber-800 shadow-xs"
                    : "border-border text-muted-foreground hover:border-border/80 hover:text-foreground"
                )}
              >
                <span className="flex items-center gap-1.5">
                  <Sparkles className={cn("size-3.5", neatOnly ? "text-amber-600" : "text-muted-foreground")} />
                  Gọn gàng, sạch sẽ
                </span>
                <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded", neatOnly ? "bg-amber-200/60 text-amber-900" : "bg-muted text-muted-foreground")}>
                  {neatOnly ? "Bắt buộc" : "Bất kỳ"}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setAllowGuestsOnly((prev) => !prev)}
                className={cn(
                  "flex items-center justify-between rounded-lg border px-2.5 py-1.5 text-xs font-medium transition cursor-pointer select-none",
                  allowGuestsOnly
                    ? "border-primary bg-mint text-primary shadow-xs font-semibold"
                    : "border-border text-muted-foreground hover:border-border/80 hover:text-foreground"
                )}
              >
                <span className="flex items-center gap-1.5">
                  <Users className={cn("size-3.5", allowGuestsOnly ? "text-primary" : "text-muted-foreground")} />
                  Cho bạn bè tới chơi
                </span>
                <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded", allowGuestsOnly ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground")}>
                  {allowGuestsOnly ? "Bắt buộc" : "Bất kỳ"}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Apply filter button */}
      <Button
        className="w-full cursor-pointer shadow-xs gap-2 font-medium text-xs h-8 mt-1"
        onClick={handleApply}
        disabled={isLoading}
      >
        {isLoading ? "Đang tìm phòng..." : "Áp dụng bộ lọc"}
      </Button>
    </div>
  );
}
