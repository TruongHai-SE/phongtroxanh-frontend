import { useNavigate } from "react-router";
import { Heart, Search, AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RoomCard } from "@/components/shared/RoomCard";
import { RoomCardSkeleton } from "@/components/ui/skeleton-loaders";
import { toast } from "sonner";
import type { Room } from "@/types/room";
import { useSavedRooms } from "../hooks/useSavedRooms";

export default function Saved() {
  const navigate = useNavigate();
  const { savedRooms, isLoading, isError, isEmpty, errorMessage, refetch, removeSaved } = useSavedRooms();

  const toggle = async (id: string) => {
    try {
      await removeSaved(id);
      toast.info("Đã xóa khỏi danh sách đã lưu");
    } catch {
      toast.error("Không thể xóa phòng khỏi danh sách đã lưu");
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-6 py-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="brand text-3xl text-foreground">Phòng đã lưu</h1>
          <p className="text-sm text-muted-foreground">{savedRooms.length} phòng trong danh sách của bạn</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isLoading} className="gap-2">
          <RefreshCw className={`size-4 ${isLoading ? "animate-spin" : ""}`} /> Làm mới
        </Button>
      </div>

      {isLoading ? (
        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <RoomCardSkeleton />
          <RoomCardSkeleton />
          <RoomCardSkeleton />
          <RoomCardSkeleton />
        </div>
      ) : isError ? (
        <div className="mt-16 text-center">
          <div className="mx-auto grid size-20 place-items-center rounded-full bg-red-50 text-red-500">
            <AlertCircle className="size-9" />
          </div>
          <h3 className="mt-4 text-lg font-semibold">{errorMessage || "Không thể tải danh sách phòng đã lưu"}</h3>
          <Button className="mt-4 gap-2" onClick={() => refetch()}>
            <RefreshCw className="size-4" /> Thử lại
          </Button>
        </div>
      ) : isEmpty ? (
        <div className="mt-16 text-center">
          <div className="mx-auto grid size-20 place-items-center rounded-full bg-mint text-primary">
            <Heart className="size-9" />
          </div>
          <h3 className="mt-4 text-lg">Chưa có phòng nào được lưu</h3>
          <p className="mt-1 text-sm text-muted-foreground">Vuốt phải hoặc nhấn ♡ để lưu những phòng bạn thích.</p>
          <Button className="mt-4 gap-2" onClick={() => navigate("/discover")}>
            <Search className="size-4" /> Khám phá phòng
          </Button>
        </div>
      ) : (
        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {savedRooms.map((r) => (
            <RoomCard key={r.id} room={r as unknown as Room} saved onToggleSave={toggle} />
          ))}
        </div>
      )}
    </div>
  );
}
