import { Heart, Maximize2, Layers, ShieldCheck, Eye, ArrowUpRight, Users, MapPin } from "lucide-react";
import { useNavigate } from "react-router";
import { ImageWithFallback } from "@/components/shared/ImageWithFallback";
import { MatchBadge } from "@/components/shared/MatchBadge";
import { AmenityPill } from "@/components/shared/AmenityPill";
import { formatVND, cn } from "@/lib/utils";
import { roomImages } from "@/lib/constants";
import type { Room } from "@/types/room";

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
      : ["Máy lạnh", "Wi-Fi", "Giờ giấc tự do"];

  const matchVal = typeof room.match === "number" && room.match > 0 ? room.match : null;
  const priceVal = room.price ? Number(room.price) : 3000000;
  const depositVal = (room as any)?.depositAmount ? Number((room as any).depositAmount) : 0;
  const titleVal = room.title || "Phòng trọ tiện nghi";
  const districtVal = room.district || "TP.HCM";
  const addressStreet = (room as any)?.addressStreet || "";
  const areaVal = room.area ?? (room as any)?.areaSqm ?? 25;
  const floorVal = room.floor ?? (room as any)?.floorNumber ?? 1;
  const maxOccupants = (room as any)?.maxOccupants ?? 2;
  const rawType = room.type ?? (room as any)?.roomType ?? "Phòng khép kín";
  const typeLabel = ROOM_TYPE_LABELS[rawType] || rawType || "Phòng trọ";
  const isVerified = Boolean((room as any)?.isVerified);

  return (
    <div
      onClick={() => navigate(`/rooms/${room.id}`)}
      className={cn(
        "group flex flex-col cursor-pointer overflow-hidden rounded-2xl bg-card shadow-xs ring-1 ring-border transition-all duration-200 hover:-translate-y-1 hover:shadow-xl",
        className,
      )}
    >
      {/* Top 52% Image Section */}
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-100 shrink-0">
        <ImageWithFallback
          src={firstImg}
          alt={titleVal}
          className="size-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
        />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/55 via-black/15 to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100" />

        <span className="absolute left-3 top-3 rounded-md bg-slate-950/70 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur-sm">
          {typeLabel}
        </span>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleSave?.(String(room.id));
          }}
          title={saved ? "Bỏ lưu phòng" : "Lưu phòng"}
          className={cn(
            "absolute right-3 top-3 grid size-9 place-items-center rounded-full shadow-md backdrop-blur transition-all duration-200 hover:scale-110 active:scale-95 cursor-pointer z-10",
            saved
              ? "bg-rose-50 text-rose-600 ring-2 ring-rose-500/30"
              : "bg-white/90 text-foreground hover:bg-white hover:text-rose-500"
          )}
        >
          <Heart className={cn("size-4 transition-colors", saved && "fill-rose-500 text-rose-500")} />
        </button>

        {matchVal != null && <MatchBadge value={matchVal} className="absolute bottom-3 right-3 z-10" />}

        <div className="pointer-events-none absolute bottom-3 left-3 z-10 inline-flex items-center gap-1.5 rounded-full bg-slate-950/80 px-3 py-1 text-xs font-semibold text-white shadow-md ring-1 ring-white/20 backdrop-blur-md opacity-0 translate-y-1 transition-all duration-200 ease-out group-hover:opacity-100 group-hover:translate-y-0">
          <Eye className="size-3.5 text-emerald-300" />
          <span>Xem chi tiết</span>
          <ArrowUpRight className="size-3.5 text-white/80" />
        </div>
      </div>

      {/* Bottom 48% Structured Info Section */}
      <div className="flex flex-1 flex-col justify-between p-4 gap-3">
        <div className="space-y-1.5">
          <div className="flex items-start justify-between gap-2">
            <h3 className="line-clamp-1 text-base font-bold text-foreground group-hover:text-primary transition-colors">
              {titleVal}
            </h3>
            {isVerified && (
              <span className="shrink-0 inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200/70 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                <ShieldCheck className="size-3" /> Xác thực
              </span>
            )}
          </div>

          <p className="flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="size-3.5 text-primary shrink-0" />
            <span className="truncate">
              {addressStreet ? `${addressStreet}, ` : ""}
              {districtVal}
            </span>
          </p>

          <div className="flex items-baseline justify-between pt-0.5">
            <p className="text-primary">
              <span className="text-lg font-extrabold tabular-nums">{formatVND(priceVal)}</span>
              <span className="text-xs text-muted-foreground">/tháng</span>
            </p>
            {depositVal > 0 && (
              <span className="text-[11px] text-muted-foreground tabular-nums">
                Cọc: <strong className="font-semibold text-foreground">{formatVND(depositVal)}</strong>
              </span>
            )}
          </div>
        </div>

        <div className="space-y-2.5">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600">
            <span className="inline-flex items-center gap-1 font-medium">
              <Maximize2 className="size-3.5 text-primary shrink-0" />
              <span className="tabular-nums">{areaVal} m²</span>
            </span>
            <span className="inline-flex items-center gap-1 font-medium">
              <Layers className="size-3.5 text-primary shrink-0" />
              <span>Tầng {floorVal}</span>
            </span>
            <span className="inline-flex items-center gap-1 font-medium">
              <Users className="size-3.5 text-primary shrink-0" />
              <span>Tối đa {maxOccupants} người</span>
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-border/60">
            {amenitiesList.slice(0, 3).map((a) => (
              <AmenityPill key={a} label={a} />
            ))}
            {amenitiesList.length > 3 && (
              <span className="text-[11px] font-medium text-muted-foreground">
                +{amenitiesList.length - 3}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
