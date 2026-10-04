import { useState, useEffect } from "react";
import { useSearchParams, useNavigate, Link } from "react-router";
import {
  Check, X, ArrowLeft, RefreshCw, AlertCircle, Plus, Trash2,
  ArrowLeftRight, ShieldCheck, MapPin, KeyRound, Sparkles,
} from "lucide-react";
import { ImageWithFallback } from "@/components/shared/ImageWithFallback";
import { StarRating } from "@/components/shared/primitives-compat";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { formatVND, cn } from "@/lib/utils";
import { roomImages } from "@/lib/constants";
import { roomsApi } from "../api/roomsApi";
import type { Room } from "@/types/room";

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

export default function Compare() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const idsParam = searchParams.get("ids");

  const [compared, setCompared] = useState<Room[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Add room modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [availableRooms, setAvailableRooms] = useState<any[]>([]);
  const [isLoadingAvailable, setIsLoadingAvailable] = useState(false);

  const fetchCompareData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      let idList = idsParam ? idsParam.split(",").filter(Boolean) : [];

      // If user came with 1 room, auto-fetch 1-2 other rooms to compare against
      if (idList.length === 1) {
        try {
          const mainRoomRes = await roomsApi.getRoomById(idList[0]);
          const allRoomsRes = await roomsApi.getRooms({ page: 0, size: 6 });
          const candidateList = (allRoomsRes?.content || []).filter(
            (r: any) => String(r.id) !== idList[0]
          );

          const mainRoomMapped: Room = {
            id: String(mainRoomRes.id),
            title: mainRoomRes.title || "Phòng đang xem",
            price: Number(mainRoomRes.price || 0),
            district: mainRoomRes.district || "TP.HCM",
            area: Number(mainRoomRes.areaSqm || mainRoomRes.area || 25),
            floor: Number(mainRoomRes.floorNumber || 1),
            type: mainRoomRes.roomType || "Phòng khép kín",
            match: 95,
            amenities: mainRoomRes.amenities || ["Máy lạnh", "Wi-Fi", "WC riêng"],
            images: mainRoomRes.images && mainRoomRes.images.length > 0
              ? mainRoomRes.images.map((img: any) => typeof img === "string" ? img : img?.imageUrl)
              : [mainRoomRes.primaryImageUrl || roomImages[0]],
            landlord: {
              name: (mainRoomRes as any)?.landlord?.name || "Chủ trọ",
              verified: Boolean((mainRoomRes as any)?.landlord?.verified),
              avatar: "",
              rating: (mainRoomRes as any)?.landlord?.rating || 4.8,
            },
            description: mainRoomRes.description || "",
            fees: [],
            rating: (mainRoomRes as any)?.avgRating || 4.8,
            reviews: (mainRoomRes as any)?.reviewCount || 5,
            lat: 10.77,
            lng: 106.65,
          };

          const otherRoomsMapped: Room[] = candidateList.slice(0, 2).map((r: any, idx: number) => ({
            id: String(r.id),
            title: r.title || `Phòng tham khảo #${idx + 1}`,
            price: Number(r.price || 0),
            district: r.district || "TP.HCM",
            area: Number(r.areaSqm || r.area || 25),
            floor: Number(r.floorNumber || 1),
            type: r.roomType || "Phòng khép kín",
            match: 88 - idx * 4,
            amenities: r.amenities || ["Máy lạnh", "Wi-Fi"],
            images: r.images && r.images.length > 0 ? r.images : [r.primaryImageUrl || roomImages[(idx + 1) % roomImages.length]],
            landlord: {
              name: r.landlordName || "Chủ trọ",
              verified: true,
              avatar: "",
              rating: 4.8,
            },
            description: "",
            fees: [],
            rating: 4.8,
            reviews: 6,
            lat: 10.77,
            lng: 106.65,
          }));

          setCompared([mainRoomMapped, ...otherRoomsMapped]);
          return;
        } catch (fetchSingleErr) {
          console.warn("Could not load single room with suggestions:", fetchSingleErr);
        }
      }

      // If 2 or more rooms, call compare API
      if (idList.length >= 2) {
        try {
          const res = await roomsApi.compareRooms({ ids: idList.slice(0, 4) });
          const rawList = res?.rooms || [];
          if (rawList.length > 0) {
            const mapped: Room[] = rawList.map((r: any, idx: number) => ({
              id: String(r.id || idList[idx]),
              title: r.title || `Phòng trọ #${r.id || idx + 1}`,
              price: Number(r.price || 0),
              district: r.district || "Quận 10",
              area: Number(r.areaSqm || r.area || 25),
              floor: Number(r.floorNumber || r.floor || 1),
              type: r.roomType || "Phòng khép kín",
              match: r.match || (92 - idx * 3),
              amenities: r.amenities || ["Máy lạnh", "Wi-Fi", "WC riêng"],
              images: r.images && r.images.length > 0 ? r.images : [roomImages[idx % roomImages.length]],
              landlord: {
                name: r.landlordName || "Chủ trọ",
                verified: true,
                avatar: "",
                rating: r.avgRating || 4.8,
              },
              description: "",
              fees: [],
              rating: r.avgRating || 4.8,
              reviews: r.reviewCount || 10,
              lat: 10.77,
              lng: 106.65,
            }));
            setCompared(mapped);
            return;
          }
        } catch (errCompare) {
          console.warn("compareRooms endpoint error, fallback to getRooms:", errCompare);
        }
      }

      // Fallback: fetch top 3 rooms to compare
      const res = await roomsApi.getRooms({ page: 0, size: 3 });
      const list = res?.content || [];
      const mapped: Room[] = list.map((r: any, idx: number) => ({
        id: String(r.id),
        title: r.title || `Phòng trọ #${r.id}`,
        price: Number(r.price || 0),
        district: r.district || "Quận 10",
        area: Number(r.areaSqm || r.area || 25),
        floor: Number(r.floorNumber || 1),
        type: r.roomType || "Phòng khép kín",
        match: 92 - idx * 4,
        amenities: r.amenities || ["Máy lạnh", "Wi-Fi", "WC riêng"],
        images: r.images && r.images.length > 0 ? r.images : [r.primaryImageUrl || roomImages[idx % roomImages.length]],
        landlord: {
          name: r.landlordName || "Chủ trọ",
          verified: true,
          avatar: "",
          rating: 4.8,
        },
        description: "",
        fees: [],
        rating: 4.8,
        reviews: 12,
        lat: 10.77,
        lng: 106.65,
      }));
      setCompared(mapped);
    } catch (err: any) {
      console.warn("Backend compare rooms error:", err);
      setError(err.message || "Không thể tải dữ liệu so sánh.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCompareData();
  }, [idsParam]);

  const handleOpenAddModal = async () => {
    setIsAddModalOpen(true);
    setIsLoadingAvailable(true);
    try {
      const res = await roomsApi.getRooms({ page: 0, size: 10 });
      const existingIds = new Set(compared.map((r) => r.id));
      const filtered = (res?.content || []).filter((r: any) => !existingIds.has(String(r.id)));
      setAvailableRooms(filtered);
    } catch {
      setAvailableRooms([]);
    } finally {
      setIsLoadingAvailable(false);
    }
  };

  const handleAddRoom = (roomItem: any) => {
    if (compared.length >= 4) {
      return;
    }
    const newRoom: Room = {
      id: String(roomItem.id),
      title: roomItem.title || "Phòng trọ",
      price: Number(roomItem.price || 0),
      district: roomItem.district || "TP.HCM",
      area: Number(roomItem.areaSqm || roomItem.area || 25),
      floor: Number(roomItem.floorNumber || 1),
      type: roomItem.roomType || "Phòng khép kín",
      match: 88,
      amenities: roomItem.amenities || ["Máy lạnh", "Wi-Fi"],
      images: roomItem.images && roomItem.images.length > 0 ? roomItem.images : [roomItem.primaryImageUrl || roomImages[0]],
      landlord: {
        name: roomItem.landlordName || "Chủ trọ",
        verified: true,
        avatar: "",
        rating: 4.8,
      },
      description: "",
      fees: [],
      rating: 4.8,
      reviews: 8,
      lat: 10.77,
      lng: 106.65,
    };
    const nextList = [...compared, newRoom];
    setCompared(nextList);
    setSearchParams({ ids: nextList.map((r) => r.id).join(",") });
    setIsAddModalOpen(false);
  };

  const handleRemoveRoom = (roomId: string) => {
    if (compared.length <= 2) {
      return;
    }
    const nextList = compared.filter((r) => r.id !== roomId);
    setCompared(nextList);
    setSearchParams({ ids: nextList.map((r) => r.id).join(",") });
  };

  // Find highlights
  const minPrice = compared.length > 0 ? Math.min(...compared.map((r) => r.price).filter((p) => p > 0)) : 0;
  const maxArea = compared.length > 0 ? Math.max(...compared.map((r) => r.area).filter((a) => a > 0)) : 0;

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-6 sm:py-8 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="brand text-2xl sm:text-3xl text-foreground flex items-center gap-2">
              <ArrowLeftRight className="size-6 text-primary" />
              So sánh phòng trọ
            </h1>
            <Badge variant="outline" className="text-emerald-700 bg-emerald-50 border-emerald-200">
              {compared.length} phòng đang so sánh
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Đặt các phòng cạnh nhau để chọn nơi ở tối ưu nhất về ngân sách, diện tích và tiện nghi
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {compared.length < 4 && (
            <Button
              size="sm"
              onClick={handleOpenAddModal}
              className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer text-xs font-semibold"
            >
              <Plus className="size-3.5" /> Thêm phòng so sánh
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={() => navigate("/discover")} className="gap-1.5 text-xs">
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
      ) : compared.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border bg-card p-12 text-center shadow-xs">
          <div className="mx-auto grid size-16 place-items-center rounded-2xl bg-emerald-50 text-emerald-600 mb-3">
            <AlertCircle className="size-8" />
          </div>
          <h3 className="text-lg font-bold text-foreground">Chưa có phòng để so sánh</h3>
          <p className="mt-1 text-sm text-muted-foreground max-w-md mx-auto">
            Vui lòng chọn phòng từ trang Khám phá hoặc bấm nút bên dưới để chọn các phòng ưng ý.
          </p>
          <Button className="mt-5 bg-emerald-600 hover:bg-emerald-700 cursor-pointer" onClick={() => navigate("/discover")}>
            Khám phá phòng ngay
          </Button>
        </div>
      ) : (
        /* Modern Comparison Card Container */
        <div className="rounded-3xl border border-border bg-card shadow-sm ring-1 ring-border/50 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] border-collapse">
              <thead>
                <tr className="bg-slate-50/70 border-b border-border">
                  <th className="w-48 p-4 text-left font-bold text-xs uppercase tracking-wider text-muted-foreground align-top">
                    Thông số so sánh
                  </th>
                  {compared.map((r) => {
                    const isBestPrice = r.price > 0 && r.price === minPrice;
                    const isLargest = r.area > 0 && r.area === maxArea;

                    return (
                      <th key={r.id} className="p-4 text-left align-top min-w-[220px]">
                        <div className="relative rounded-2xl overflow-hidden aspect-[16/10] bg-muted mb-3 group">
                          <ImageWithFallback
                            src={r.images[0]}
                            alt={r.title}
                            className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                          {compared.length > 2 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveRoom(r.id)}
                              className="absolute top-2 right-2 size-7 rounded-full bg-black/60 hover:bg-rose-600 text-white grid place-items-center transition cursor-pointer"
                              title="Bỏ phòng này"
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

                        <Link to={`/rooms/${r.id}`} className="hover:text-primary transition-colors">
                          <h3 className="font-semibold text-sm line-clamp-2 text-foreground mb-1 leading-snug">
                            {r.title}
                          </h3>
                        </Link>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <MapPin className="size-3 text-primary shrink-0" />
                          {r.district}
                        </p>

                        <div className="mt-3 flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1 text-xs h-8 cursor-pointer"
                            onClick={() => navigate(`/rooms/${r.id}`)}
                          >
                            Chi tiết
                          </Button>
                          <Button
                            size="sm"
                            className="flex-1 text-xs h-8 bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer font-semibold gap-1"
                            onClick={() => navigate(`/rooms/${r.id}`)}
                          >
                            <KeyRound className="size-3" /> Thuê
                          </Button>
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>

              <tbody className="text-sm divide-y divide-border">
                {/* Giá thuê */}
                <tr className="hover:bg-slate-50/50 transition">
                  <td className="py-3.5 px-4 font-semibold text-xs uppercase tracking-wider text-slate-500 bg-slate-50/40">
                    Giá thuê
                  </td>
                  {compared.map((r) => {
                    const isBestPrice = r.price > 0 && r.price === minPrice;
                    return (
                      <td key={r.id} className="py-3.5 px-4">
                        <span className={cn("text-base font-bold", isBestPrice ? "text-emerald-600" : "text-foreground")}>
                          {formatVND(r.price)}
                        </span>
                        <span className="text-xs text-muted-foreground">/tháng</span>
                      </td>
                    );
                  })}
                </tr>

                {/* Tiền đặt cọc */}
                <tr className="hover:bg-slate-50/50 transition">
                  <td className="py-3.5 px-4 font-semibold text-xs uppercase tracking-wider text-slate-500 bg-slate-50/40">
                    Đặt cọc
                  </td>
                  {compared.map((r) => (
                    <td key={r.id} className="py-3.5 px-4 text-slate-700 font-medium">
                      {formatVND(r.price)} (1 tháng)
                    </td>
                  ))}
                </tr>

                {/* Khu vực */}
                <tr className="hover:bg-slate-50/50 transition">
                  <td className="py-3.5 px-4 font-semibold text-xs uppercase tracking-wider text-slate-500 bg-slate-50/40">
                    Khu vực
                  </td>
                  {compared.map((r) => (
                    <td key={r.id} className="py-3.5 px-4 text-slate-800 font-medium">
                      {r.district}, TP.HCM
                    </td>
                  ))}
                </tr>

                {/* Diện tích */}
                <tr className="hover:bg-slate-50/50 transition">
                  <td className="py-3.5 px-4 font-semibold text-xs uppercase tracking-wider text-slate-500 bg-slate-50/40">
                    Diện tích
                  </td>
                  {compared.map((r) => {
                    const isLargest = r.area > 0 && r.area === maxArea;
                    return (
                      <td key={r.id} className="py-3.5 px-4">
                        <span className={cn("font-semibold", isLargest ? "text-blue-600 font-bold" : "text-slate-800")}>
                          {r.area} m²
                        </span>
                      </td>
                    );
                  })}
                </tr>

                {/* Tầng & Loại phòng */}
                <tr className="hover:bg-slate-50/50 transition">
                  <td className="py-3.5 px-4 font-semibold text-xs uppercase tracking-wider text-slate-500 bg-slate-50/40">
                    Loại phòng
                  </td>
                  {compared.map((r) => (
                    <td key={r.id} className="py-3.5 px-4 text-slate-700">
                      <Badge variant="secondary" className="text-xs font-normal">
                        {r.type} • Tầng {r.floor}
                      </Badge>
                    </td>
                  ))}
                </tr>

                {/* Điểm uy tín & Đánh giá */}
                <tr className="hover:bg-slate-50/50 transition">
                  <td className="py-3.5 px-4 font-semibold text-xs uppercase tracking-wider text-slate-500 bg-slate-50/40">
                    Chủ trọ & Uy tín
                  </td>
                  {compared.map((r) => (
                    <td key={r.id} className="py-3.5 px-4">
                      <div className="space-y-1">
                        <p className="font-semibold text-xs text-foreground flex items-center gap-1">
                          {r.landlord.name}
                          {r.landlord.verified && <ShieldCheck className="size-3.5 text-primary" />}
                        </p>
                        <div className="flex items-center gap-1.5">
                          <StarRating value={r.rating || 4.8} />
                          <span className="text-xs text-muted-foreground">({r.reviews} lượt)</span>
                        </div>
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
                      const hasAmenity = Array.isArray(r.amenities) && r.amenities.includes(a);
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

      {/* Add Room Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-foreground">
              <Plus className="size-5 text-primary" /> Thêm phòng vào so sánh
            </DialogTitle>
            <DialogDescription>
              Chọn một phòng từ danh sách để đặt cạnh các phòng hiện tại
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 max-h-[60vh] overflow-y-auto">
            {isLoadingAvailable ? (
              <div className="space-y-2 py-4">
                <Skeleton className="h-14 w-full rounded-xl" />
                <Skeleton className="h-14 w-full rounded-xl" />
                <Skeleton className="h-14 w-full rounded-xl" />
              </div>
            ) : availableRooms.length === 0 ? (
              <p className="text-center py-6 text-sm text-muted-foreground">
                Không còn phòng nào khác để thêm.
              </p>
            ) : (
              availableRooms.map((rm) => (
                <div
                  key={rm.id}
                  className="flex items-center justify-between p-3 rounded-xl border border-border hover:border-primary/50 bg-card transition gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={rm.primaryImageUrl || rm.images?.[0] || roomImages[0]}
                      alt=""
                      className="size-12 rounded-lg object-cover shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="font-semibold text-xs text-foreground truncate">{rm.title}</p>
                      <p className="text-[11px] text-muted-foreground">{rm.district} • {formatVND(rm.price)}/tháng</p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleAddRoom(rm)}
                    className="text-xs h-8 bg-emerald-600 hover:bg-emerald-700 text-white shrink-0 cursor-pointer"
                  >
                    Thêm
                  </Button>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
