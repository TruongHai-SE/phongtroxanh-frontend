import { useEffect, useRef, useState } from "react";
import { GraduationCap, Loader2, MapPin, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { locationsApi } from "@/features/locations/api/locationsApi";
import type { LocationSuggestionResponse } from "@/features/locations/types/location.types";
import {
  expandPlaceQueryForMap,
  inferDistrictFromSchoolOrPlace,
  popularSchoolsAndWorkplaces,
  SCHOOL_ACRONYM_MAP,
} from "@/lib/constants";
import { cn } from "@/lib/utils";

function stripVietnameseAccents(str: string): string {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase();
}

interface SchoolOrWorkplaceInputProps {
  value: string;
  onChange: (val: string) => void;
  onDistrictDetected?: (district: string) => void;
  placeholder?: string;
  className?: string;
}

export function SchoolOrWorkplaceInput({
  value,
  onChange,
  onDistrictDetected,
  placeholder = "Nhập tên trường học hoặc nơi làm việc của bạn...",
  className,
}: SchoolOrWorkplaceInputProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mapResults, setMapResults] = useState<LocationSuggestionResponse[]>([]);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const expandedQuery = expandPlaceQueryForMap(value);
  const queryNorm = stripVietnameseAccents(expandedQuery);
  const rawNorm = stripVietnameseAccents(value.trim());

  const matchedPopular = popularSchoolsAndWorkplaces.filter((item) => {
    if (!rawNorm) return true;
    const itemNorm = stripVietnameseAccents(item);
    if (itemNorm.includes(rawNorm) || itemNorm.includes(queryNorm)) return true;
    return Object.entries(SCHOOL_ACRONYM_MAP).some(
      ([acronym, targetSchool]) =>
        targetSchool === item && acronym.includes(rawNorm)
    );
  });

  const handleInputChange = (nextVal: string) => {
    onChange(nextVal);
    setOpen(true);

    const detected =
      inferDistrictFromSchoolOrPlace(nextVal) ||
      inferDistrictFromSchoolOrPlace(expandPlaceQueryForMap(nextVal));
    if (detected) {
      onDistrictDetected?.(detected);
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (nextVal.trim().length < 2) {
      setMapResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const mapQuery = expandPlaceQueryForMap(nextVal.trim());
        const res = await locationsApi.autocomplete(mapQuery);
        setMapResults(Array.isArray(res) ? res.slice(0, 6) : []);
      } catch {
        setMapResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);
  };

  const selectPopular = (label: string) => {
    onChange(label);
    setOpen(false);
    const dist = inferDistrictFromSchoolOrPlace(label);
    if (dist) onDistrictDetected?.(dist);
  };

  const selectMapItem = (item: LocationSuggestionResponse) => {
    const label = item.mainText || item.description;
    onChange(label);
    setOpen(false);
    const dist =
      inferDistrictFromSchoolOrPlace(item.description) ||
      inferDistrictFromSchoolOrPlace(item.secondaryText) ||
      inferDistrictFromSchoolOrPlace(item.mainText);
    if (dist) onDistrictDetected?.(dist);
  };

  const showDropdown = open && (matchedPopular.length > 0 || mapResults.length > 0);

  return (
    <div ref={wrapperRef} className={cn("relative", className)}>
      <div className="relative">
        <Input
          value={value}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          className="pr-9"
          maxLength={100}
        />
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
          {loading ? (
            <Loader2 className="size-4 animate-spin text-primary" />
          ) : (
            <Search className="size-4" />
          )}
        </span>
      </div>

      {showDropdown && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-64 overflow-y-auto rounded-xl border border-border bg-popover text-popover-foreground shadow-lg">
          {mapResults.length > 0 && (
            <div className="border-b border-border/50 py-1">
              <p className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Địa điểm gợi ý trên bản đồ
              </p>
              {mapResults.map((item, idx) => {
                const dist =
                  inferDistrictFromSchoolOrPlace(item.description) ||
                  inferDistrictFromSchoolOrPlace(item.secondaryText);
                return (
                  <button
                    key={item.placeId || `map-${idx}`}
                    type="button"
                    onClick={() => selectMapItem(item)}
                    className="flex w-full items-start gap-2.5 px-3 py-2 text-left text-xs transition hover:bg-mint/40 cursor-pointer"
                  >
                    <MapPin className="mt-0.5 size-3.5 shrink-0 text-emerald-600" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-foreground">
                        {item.mainText || item.description}
                      </p>
                      {item.secondaryText && (
                        <p className="truncate text-[11px] text-muted-foreground">
                          {item.secondaryText}
                        </p>
                      )}
                    </div>
                    {dist && (
                      <span className="shrink-0 rounded-full bg-mint px-2 py-0.5 text-[10px] font-medium text-primary">
                        {dist}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {matchedPopular.length > 0 && (
            <div className="py-1">
              <p className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Trường học & Nơi làm việc phổ biến
              </p>
              {matchedPopular.map((school) => {
                const dist = inferDistrictFromSchoolOrPlace(school);
                return (
                  <button
                    key={school}
                    type="button"
                    onClick={() => selectPopular(school)}
                    className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-xs transition hover:bg-mint/40 cursor-pointer"
                  >
                    <span className="flex items-center gap-2 min-w-0">
                      <GraduationCap className="size-3.5 shrink-0 text-primary" />
                      <span className="truncate font-medium text-foreground">{school}</span>
                    </span>
                    {dist && (
                      <span className="shrink-0 rounded-full bg-secondary px-2 py-0.5 text-[10px] text-muted-foreground">
                        {dist}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
