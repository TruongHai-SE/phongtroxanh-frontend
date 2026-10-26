import { useState, useMemo } from "react";
import { useNavigate } from "react-router";
import {
  Heart,
  Search,
  AlertCircle,
  RefreshCw,
  Map as MapIcon,
  SlidersHorizontal,
  Building2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RoomCard } from "@/components/shared/RoomCard";
import { RoomCardSkeleton } from "@/components/ui/skeleton-loaders";
import { toast } from "sonner";
import type { Room } from "@/types/room";
import { useSavedRooms } from "../hooks/useSavedRooms";

type SortMode = "recent" | "price-asc" | "price-desc" | "area-desc";

export default function Saved() {
  const navigate = useNavigate();
  const { savedRooms, isLoading, isError, isEmpty, errorMessage, refetch, removeSaved } =
    useSavedRooms();
  const [sortBy, setSortBy] = useState<SortMode>("recent");
  const [selectedDistrict, setSelectedDistrict] = useState<string>("ALL");

  const toggle = async (id: string) => {
    try {
      await removeSaved(id);
      toast.info("Đã xóa khỏi danh sách đã lưu");
    } catch {
      toast.error("Không thể xóa phòng khỏi danh sách đã lưu");
    }
  };

  const availableDistricts = useMemo(() => {
    const set = new Set<string>();
    for (const r of savedRooms) {
      if (r.district && r.district.trim()) {
        set.add(r.district.trim());
      }
    }
    return Array.from(set);
  }, [savedRooms]);

  const displayedRooms = useMemo(() => {
    const list = savedRooms.filter((r) => {
      if (selectedDistrict !== "ALL" && r.district !== selectedDistrict) return false;
      return true;
    });

    if (sortBy === "price-asc") {
      return [...list].sort((a, b) => Number(a.price || 0) - Number(b.price || 0));
    }
    if (sortBy === "price-desc") {
      return [...list].sort((a, b) => Number(b.price || 0) - Number(a.price || 0));
    }
    if (sortBy === "area-desc") {
      return [...list].sort(
        (a: any, b: any) => Number(b.areaSqm ?? b.area ?? 0) - Number(a.areaSqm ?? a.area ?? 0)
      );
    }
    return list;
  }, [savedRooms, selectedDistrict, sortBy]);

  return (
    <div className="mx-auto w-full max-w-[1440px] px-6 pt-2 md:pt-3 pb-12">
      {/* Top Header Bar aligned with /discover and /roommates */}
      <div data-tour="saved-header-toolbar" className="mb-4 md:mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between animate-fade-in">
        <div>
          <h1 className="brand text-3xl text-foreground">Phòng đã lưu</h1>
          <p className="text-sm text-muted-foreground">
            {savedRooms.length} phòng trong danh sách yêu thích của bạn
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={isLoading}
          className="gap-2 hover-lift press-active cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw className={`size-4 ${isLoading ? "animate-spin" : ""}`} /> Làm mới
        </Button>
      </div>

      {/* Filter & Sort Toolbar when rooms exist */}
      {!isLoading && !isError && !isEmpty && (
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-card p-3.5 ring-1 ring-border shadow-2xs">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-muted-foreground">
              <Building2 className="size-3.5 text-primary" /> Khu vực:
            </span>
            <button
              type="button"
              onClick={() => setSelectedDistrict("ALL")}
              className={`rounded-xl px-3 py-1.5 text-xs font-semibold tabular-nums transition-all duration-150 active:scale-[0.97] cursor-pointer ${
                selectedDistrict === "ALL"
                  ? "bg-primary text-primary-foreground shadow-2xs"
                  : "bg-slate-100 text-slate-600 hover:bg-mint/60 hover:text-emerald-deep"
              }`}
            >
              Tất cả ({savedRooms.length})
            </button>
            {availableDistricts.map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setSelectedDistrict(d)}
                className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-all duration-150 active:scale-[0.97] cursor-pointer ${
                  selectedDistrict === d
                    ? "bg-primary text-primary-foreground shadow-2xs"
                    : "bg-slate-100 text-slate-600 hover:bg-mint/60 hover:text-emerald-deep"
                }`}
              >
                {d}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground shrink-0">
              <SlidersHorizontal className="size-3.5 text-primary" /> Sắp xếp:
            </span>
            <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortMode)}>
              <SelectTrigger
                size="sm"
                aria-label="Sắp xếp phòng đã lưu"
                className="w-[176px] rounded-xl border-border bg-background text-xs font-semibold text-foreground shadow-2xs hover:border-primary/40"
              >
                <SelectValue placeholder="Mới lưu gần đây" />
              </SelectTrigger>
              <SelectContent align="end">
                <SelectItem value="recent" className="text-xs font-medium cursor-pointer">
                  Mới lưu gần đây
                </SelectItem>
                <SelectItem value="price-asc" className="text-xs font-medium cursor-pointer">
                  Giá thấp đến cao
                </SelectItem>
                <SelectItem value="price-desc" className="text-xs font-medium cursor-pointer">
                  Giá cao đến thấp
                </SelectItem>
                <SelectItem value="area-desc" className="text-xs font-medium cursor-pointer">
                  Diện tích lớn nhất
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <div className="h-[380px]">
            <RoomCardSkeleton />
          </div>
          <div className="h-[380px]">
            <RoomCardSkeleton />
          </div>
          <div className="h-[380px]">
            <RoomCardSkeleton />
          </div>
          <div className="h-[380px]">
            <RoomCardSkeleton />
          </div>
        </div>
      ) : isError ? (
        <div className="flex min-h-[360px] flex-col items-center justify-center rounded-3xl bg-card border border-border p-8 text-center shadow-xs">
          <div className="mx-auto grid size-16 place-items-center rounded-2xl bg-red-50 text-red-500">
            <AlertCircle className="size-8" />
          </div>
          <h3 className="mt-4 text-lg font-bold text-foreground">
            {errorMessage || "Không thể tải danh sách phòng đã lưu"}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground max-w-md">
            Đã có sự cố khi đồng bộ danh sách phòng yêu thích của bạn. Vui lòng làm mới để thử lại.
          </p>
          <Button className="mt-5 gap-2 cursor-pointer" onClick={() => refetch()}>
            <RefreshCw className="size-4" /> Thử lại ngay
          </Button>
        </div>
      ) : isEmpty ? (
        <div data-tour="saved-rooms-grid" className="flex min-h-[420px] flex-col items-center justify-center rounded-3xl bg-card ring-1 ring-border px-6 py-14 text-center shadow-2xs animate-fade-in">
          <div className="mx-auto grid size-16 place-items-center rounded-2xl bg-mint text-primary">
            <Heart className="size-7" />
          </div>
          <h2 className="mt-5 text-xl sm:text-2xl font-bold text-foreground">
            Chưa có phòng nào được lưu
          </h2>
          <p className="mt-2 max-w-md text-sm text-muted-foreground leading-relaxed">
            Vuốt sang phải ở trang Khám phá hoặc nhấn biểu tượng trái tim trên từng thẻ phòng để lưu lại những phòng bạn quan tâm.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Button
              className="gap-2 rounded-xl hover-lift press-active cursor-pointer"
              onClick={() => navigate("/discover")}
            >
              <Search className="size-4" /> Khám phá phòng
            </Button>
            <Button
              variant="outline"
              className="gap-2 rounded-xl hover-lift press-active cursor-pointer"
              onClick={() => navigate("/map")}
            >
              <MapIcon className="size-4" /> Xem bản đồ
            </Button>
          </div>
        </div>
      ) : (
        <div data-tour="saved-rooms-grid" className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {displayedRooms.map((r) => (
            <RoomCard key={r.id} room={r as unknown as Room} saved onToggleSave={toggle} />
          ))}
        </div>
      )}
    </div>
  );
}
