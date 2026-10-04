import { Heart, Maximize2, Layers } from "lucide-react";
import { useNavigate } from "react-router";
import { ImageWithFallback } from "@/components/shared/ImageWithFallback";
import { MatchBadge } from "@/components/shared/MatchBadge";
import { AmenityPill } from "@/components/shared/AmenityPill";
import { LocationLine } from "@/components/shared/LocationLine";
import { formatVND, cn } from "@/lib/utils";
import { roomImages } from "@/lib/constants";
import type { Room } from "@/types/room";

export function RoomCard({
  room,
  saved,
  onToggleSave,
  className,
}: {
  room: Room;
  saved?: boolean;
  onToggleSave?: (id: string) => void;
  className?: string;
}) {
  const navigate = useNavigate();

  if (!room) return null;

  // Safe image extraction (handles string[], object[], primaryImageUrl, and constants fallback)
  const rawImages = room.images || [];
  const firstImg =
    (typeof rawImages[0] === "string" ? rawImages[0] : (rawImages[0] as any)?.imageUrl) ||
    (room as any)?.primaryImageUrl ||
    roomImages[0];

  // Safe amenities extraction
  const rawAmenities = (room as any)?.amenities;
  const amenitiesList: string[] =
    Array.isArray(rawAmenities) && rawAmenities.length > 0
      ? rawAmenities
      : ["Máy lạnh", "Wi-Fi", "WC riêng"];

  const matchVal = room.match ?? 92;
  const priceVal = room.price ? Number(room.price) : 3000000;
  const titleVal = room.title || "Phòng trọ tiện nghi";
  const districtVal = room.district || (room as any)?.addressStreet || "Quận 10";
  const areaVal = room.area ?? (room as any)?.areaSqm ?? 25;
  const floorVal = room.floor ?? (room as any)?.floorNumber ?? 1;
  const typeVal = room.type ?? (room as any)?.roomType ?? "Phòng khép kín";

  return (
    <div
      onClick={() => navigate(`/rooms/${room.id}`)}
      className={cn(
        "group cursor-pointer overflow-hidden rounded-2xl bg-card shadow-sm ring-1 ring-border transition-all hover:-translate-y-1 hover:shadow-xl",
        className,
      )}
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        <ImageWithFallback
          src={firstImg}
          alt={titleVal}
          className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleSave?.(room.id);
          }}
          className="absolute right-3 top-3 grid size-9 place-items-center rounded-full bg-white/90 text-foreground shadow backdrop-blur transition hover:bg-white"
        >
          <Heart className={cn("size-4", saved && "fill-destructive text-destructive")} />
        </button>
        <MatchBadge value={matchVal} className="absolute bottom-3 right-3" />
        <div className="absolute inset-0 flex items-end justify-center bg-gradient-to-t from-black/40 to-transparent pb-3 opacity-0 transition-opacity group-hover:opacity-100">
          <span className="inline-flex items-center gap-1 rounded-full bg-white/95 px-3 py-1 text-xs text-foreground shadow">
            <Maximize2 className="size-3" /> Xem chi tiết
          </span>
        </div>
      </div>
      <div className="space-y-2 p-4">
        <h3 className="line-clamp-1 text-base">{titleVal}</h3>
        <p className="text-primary">
          <span className="text-lg">{formatVND(priceVal)}</span>
          <span className="text-sm text-muted-foreground">/tháng</span>
        </p>
        <LocationLine text={`${districtVal}, TP.HCM`} />
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Maximize2 className="size-3" />
            {areaVal} m²
          </span>
          <span className="inline-flex items-center gap-1">
            <Layers className="size-3" />
            Tầng {floorVal}
          </span>
          <span>{typeVal}</span>
        </div>
        <div className="flex flex-wrap gap-1.5 pt-1">
          {amenitiesList.slice(0, 3).map((a) => (
            <AmenityPill key={a} label={a} />
          ))}
          {amenitiesList.length > 3 && (
            <span className="text-xs text-muted-foreground">+{amenitiesList.length - 3}</span>
          )}
        </div>
      </div>
    </div>
  );
}
