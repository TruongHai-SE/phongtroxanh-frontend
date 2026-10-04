import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import {
  ShieldCheck, Pencil, Award, Star, MapPin, Wallet, GraduationCap, Eye,
  Home, CheckCircle2, Clock, Compass, Building2, PlusCircle, ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AmenityPill } from "@/components/shared/primitives-compat";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ImageWithFallback } from "@/components/shared/ImageWithFallback";
import { getInitials, formatVND, formatDate } from "@/lib/utils";
import { useProfile } from "../hooks/useProfile";
import { useTrustScore } from "@/features/reviews/hooks/useTrustScore";
import { useAuth } from "@/app/context/AuthContext";
import { rentalsApi } from "@/features/rentals/api/rentalsApi";
import { roomsApi } from "@/features/rooms/api/roomsApi";

export default function Profile() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { profile, isLoading: isProfileLoading } = useProfile();
  const { trustScore } = useTrustScore();

  const isLandlord = profile?.role === "LANDLORD" || user?.role === "landlord";

  const [activeRental, setActiveRental] = useState<any | null>(null);
  const [landlordRooms, setLandlordRooms] = useState<any[]>([]);

  useEffect(() => {
    if (isLandlord) {
      async function loadLandlordRooms() {
        try {
          const res = await roomsApi.getMyRooms();
          if (Array.isArray(res)) setLandlordRooms(res);
        } catch {
          // quiet fallback
        }
      }
      loadLandlordRooms();
    } else {
      async function loadTenantRental() {
        try {
          const res = await rentalsApi.getMyTenantRentals();
          const list = Array.isArray(res) ? res : (res as any)?.content || [];
          const current = list.find(
            (r: any) => r.status === "CHECKED_IN" || (r.status === "TERMINATED" && r.checkInAt)
          );
          if (current) setActiveRental(current);
        } catch {
          // quiet fallback
        }
      }
      loadTenantRental();
    }
  }, [isLandlord]);

  const score = trustScore?.currentScore ?? profile?.trustScore ?? null;

  // Address and Bio separation
  const landlordAddress =
    profile?.address ||
    (profile?.bio?.startsWith("Địa chỉ: ") ? profile.bio.replace(/^Địa chỉ:\s*/, "") : null) ||
    "Chưa cập nhật địa chỉ liên hệ";

  const landlordBio =
    profile?.bio && !profile.bio.startsWith("Địa chỉ: ") ? profile.bio : "";

  const operatingDistricts = profile?.preferredDistricts || profile?.targetDistricts || [];

  const ROOM_STATUS_LABEL: Record<string, string> = {
    AVAILABLE: "Còn trống",
    RENTED: "Đã thuê",
    HIDDEN: "Đã ẩn",
    EXPIRED: "Hết hạn",
  };

  // Badges: only what the backend can prove (KYC flag, trust score threshold)
  const badges: string[] = [
    ...(profile?.kycStatus === "APPROVED" || profile?.isVerified ? ["Đã xác minh CCCD"] : []),
    ...(score != null && score >= 80 ? [isLandlord ? "Chủ trọ uy tín" : "Người thuê uy tín"] : []),
  ];

  // Tenant-only lifestyle items
  const lifestyleItems = [
    {
      label: "Giờ giấc sinh hoạt",
      value: profile?.earlySleeper === true ? "Ngủ sớm (trước 23h)" : profile?.earlySleeper === false ? "Cú đêm / Thức khuya" : "Chưa cập nhật",
      isSet: profile?.earlySleeper !== undefined && profile?.earlySleeper !== null,
    },
    {
      label: "Giữ gìn vệ sinh",
      value: profile?.isNeat === true ? "Rất gọn gàng, ngăn nắp" : profile?.isNeat === false ? "Thoải mái, linh hoạt" : "Chưa cập nhật",
      isSet: profile?.isNeat !== undefined && profile?.isNeat !== null,
    },
    {
      label: "Dẫn bạn bè/khách về",
      value: profile?.allowGuests === true ? "Được phép dẫn khách về" : profile?.allowGuests === false ? "Không dẫn khách về" : "Chưa cập nhật",
      isSet: profile?.allowGuests !== undefined && profile?.allowGuests !== null,
    },
    {
      label: "Hút thuốc lá",
      value: profile?.nonSmoking === true ? "Không hút thuốc" : profile?.nonSmoking === false ? "Có hút thuốc" : "Chưa cập nhật",
      isSet: profile?.nonSmoking !== undefined && profile?.nonSmoking !== null,
    },
    {
      label: "Độ nhạy tiếng ồn",
      value:
        profile?.noiseTolerance != null
          ? profile.noiseTolerance <= 30
            ? "Cần yên tĩnh"
            : profile.noiseTolerance <= 70
            ? "Mức độ vừa phải"
            : "Thoải mái, không ngại ồn"
          : "Chưa cập nhật",
      isSet: profile?.noiseTolerance != null,
    },
  ];

  const proximityItems = [
    { label: "Gần trường ĐH / Cao đẳng", active: Boolean(profile?.proximitySchool) },
    { label: "Gần công ty / Nơi làm việc", active: Boolean(profile?.proximityWork) },
    { label: "Gần chợ / Siêu thị", active: Boolean(profile?.proximityMarket) },
    { label: "Gần trạm xe buýt", active: Boolean(profile?.proximityBus) },
  ];

  const hasAnyProximity = proximityItems.some((p) => p.active);
  const interests = profile?.interests || [];

  return (
    <div className="mx-auto max-w-7xl px-6 py-8">
      <div className="grid gap-8 lg:grid-cols-12">
        {/* Left Column (8 cols): Main Content */}
        <div className="space-y-6 lg:col-span-8">
          {/* Header Card */}
          <div className="overflow-hidden rounded-2xl bg-card ring-1 ring-border shadow-xs">
            <div className="h-32 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700" />
            <div className="px-6 pb-6">
              <div className="-mt-14 flex flex-wrap items-end justify-between gap-4">
                <Avatar className="size-24 rounded-2xl ring-4 ring-card shadow-sm">
                  {profile?.avatarUrl ? (
                    <AvatarImage src={profile.avatarUrl} alt={profile.fullName || ""} className="rounded-2xl object-cover" />
                  ) : null}
                  <AvatarFallback className="rounded-2xl bg-emerald-100 text-emerald-800 text-2xl font-bold">
                    {getInitials(profile?.fullName || (isLandlord ? "CT" : "PT"))}
                  </AvatarFallback>
                </Avatar>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="gap-1.5" onClick={() => navigate("/public-profile")}>
                    <Eye className="size-4" /> Xem công khai
                  </Button>
                  <Button size="sm" className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => navigate("/edit-profile")}>
                    <Pencil className="size-4" /> Sửa hồ sơ
                  </Button>
                  {isLandlord && (
                    <Button size="sm" variant="secondary" className="gap-1.5 font-medium" onClick={() => navigate("/landlord")}>
                      Bảng quản lý
                    </Button>
                  )}
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-2.5">
                <h1 className="brand text-2xl font-bold text-foreground">
                  {profile?.fullName || (isLandlord ? "Chủ trọ" : "Người dùng")}
                </h1>
                {(profile?.kycStatus === "APPROVED" || profile?.isVerified) && (
                  <Badge variant="secondary" className="gap-1 bg-emerald-50 text-emerald-700 border-emerald-200">
                    <ShieldCheck className="size-3.5" /> Đã xác minh CCCD
                  </Badge>
                )}
                <Badge variant="outline" className="text-xs font-normal">
                  {isLandlord ? "Chủ trọ" : "Người thuê trọ"}
                </Badge>
              </div>

              {/* Sub-header info tailored by role */}
              {isLandlord ? (
                <div className="mt-3 flex flex-wrap items-center gap-4 text-xs sm:text-sm text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="size-4 text-emerald-600 shrink-0" />
                    {landlordAddress}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Building2 className="size-4 text-emerald-600 shrink-0" />
                    Khu vực: <strong className="text-slate-700">{operatingDistricts.length > 0 ? operatingDistricts.join(", ") : "Chưa cập nhật"}</strong>
                  </span>
                </div>
              ) : (
                <>
                  <p className="mt-1 inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                    <GraduationCap className="size-4 text-slate-400" />
                    {profile?.schoolOrCompany || profile?.school || profile?.job || "Chưa cập nhật trường học hoặc nơi làm việc"}
                  </p>
                  <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t text-sm">
                    <div className="flex items-center gap-2">
                      <Wallet className="size-4 text-emerald-600 shrink-0" />
                      <span className="text-muted-foreground">Ngân sách dự kiến:</span>
                      <span className="font-semibold text-slate-800">
                        {profile?.budgetMin && profile?.budgetMax
                          ? `${formatVND(profile.budgetMin)} - ${formatVND(profile.budgetMax)}/tháng`
                          : profile?.budgetMax
                          ? `Đến ${formatVND(profile.budgetMax)}/tháng`
                          : "Chưa đặt ngân sách"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="size-4 text-emerald-600 shrink-0" />
                      <span className="text-muted-foreground">Khu vực ưu tiên:</span>
                      <span className="font-semibold text-slate-800 truncate">
                        {operatingDistricts.length > 0 ? operatingDistricts.join(", ") : "Chưa chọn quận ưu tiên"}
                      </span>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* ROLE-SPECIFIC MAIN BLOCKS */}
          {isLandlord ? (
            <>
              {/* Landlord Card 1: Giới thiệu */}
              <div className="rounded-2xl bg-card p-6 ring-1 ring-border shadow-xs">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-base font-bold text-charcoal">Giới thiệu</h2>
                  <Button size="sm" variant="ghost" className="text-xs text-emerald-600 hover:text-emerald-700" onClick={() => navigate("/edit-profile")}>
                    Chỉnh sửa
                  </Button>
                </div>
                {landlordBio ? (
                  <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">{landlordBio}</p>
                ) : (
                  <p className="text-xs text-muted-foreground italic">Bạn chưa viết lời giới thiệu.</p>
                )}

                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-border/60 text-xs">
                  <div className="rounded-xl bg-slate-50 p-3 border border-slate-100">
                    <span className="text-muted-foreground block font-medium">Địa chỉ liên hệ:</span>
                    <span className="font-semibold text-slate-800 mt-1 block">{landlordAddress}</span>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-3 border border-slate-100">
                    <span className="text-muted-foreground block font-medium">Khu vực hoạt động:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {operatingDistricts.length > 0 ? (
                        operatingDistricts.map((d) => (
                          <span key={d} className="rounded-md bg-emerald-100/70 text-emerald-800 font-semibold px-2 py-0.5 text-[11px]">
                            {d}
                          </span>
                        ))
                      ) : (
                        <span className="text-slate-400 italic">Chưa cập nhật</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Landlord Card 3: Danh sách phòng trọ đang quản lý */}
              <div className="rounded-2xl bg-card p-6 ring-1 ring-border shadow-xs">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-base font-bold text-charcoal">Phòng trọ đang quản lý ({landlordRooms.length})</h2>
                    <p className="text-xs text-muted-foreground mt-0.5">Danh mục các phòng trọ được cập nhật trực tiếp trên hệ thống</p>
                  </div>
                  <Button size="sm" className="gap-1.5 text-xs font-medium bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => navigate("/landlord?tab=post")}>
                    <PlusCircle className="size-3.5" /> Đăng phòng mới
                  </Button>
                </div>

                {landlordRooms.length === 0 ? (
                  <div className="flex flex-col items-center justify-center rounded-xl bg-slate-50 p-8 text-center border border-dashed border-slate-200">
                    <Building2 className="size-10 text-muted-foreground/50 mb-2" />
                    <p className="text-sm font-semibold text-foreground">Bạn chưa có phòng trọ nào trên hệ thống</p>
                    <p className="text-xs text-muted-foreground mt-0.5 max-w-sm">
                      Phòng bạn đăng sẽ hiển thị tại đây.
                    </p>
                    <Button size="sm" className="mt-4 gap-1.5 text-xs" onClick={() => navigate("/landlord?tab=post")}>
                      <PlusCircle className="size-3.5" /> Đăng phòng đầu tiên
                    </Button>
                  </div>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {landlordRooms.slice(0, 4).map((r) => (
                      <div key={r.id} className="flex gap-3 rounded-xl border border-border bg-slate-50/50 p-3 hover:bg-slate-50 transition-colors">
                        <ImageWithFallback
                          src={r.primaryImageUrl}
                          alt={r.title}
                          className="size-16 rounded-lg object-cover shrink-0"
                        />
                        <div className="min-w-0 flex-1 space-y-1">
                          <h3 className="truncate text-xs font-bold text-slate-800">{r.title}</h3>
                          <p className="text-xs font-semibold text-primary">{formatVND(r.price)}/tháng</p>
                          <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1">
                            <span className="truncate">{r.district}</span>
                            <Badge variant={r.status === "AVAILABLE" ? "default" : "secondary"} className="text-[10px] px-1.5 py-0 h-4">
                              {ROOM_STATUS_LABEL[r.status] ?? r.status}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {landlordRooms.length > 4 && (
                  <div className="mt-4 text-center">
                    <Button variant="ghost" size="sm" className="text-xs text-primary gap-1" onClick={() => navigate("/landlord?tab=rooms")}>
                      Xem tất cả {landlordRooms.length} phòng trong Bảng quản lý <ArrowRight className="size-3.5" />
                    </Button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              {/* Tenant Card 1: Bio */}
              <div className="rounded-2xl bg-card p-6 ring-1 ring-border shadow-xs">
                <h2 className="mb-2 text-base font-bold text-charcoal">Giới thiệu bản thân</h2>
                {profile?.bio?.trim() ? (
                  <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">{profile.bio}</p>
                ) : (
                  <div className="flex items-center justify-between rounded-xl bg-slate-50 p-4 border border-dashed border-slate-200">
                    <p className="text-xs text-muted-foreground italic">Bạn chưa viết lời giới thiệu bản thân.</p>
                    <Button size="sm" variant="ghost" className="text-xs text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50" onClick={() => navigate("/edit-profile")}>
                      Thêm giới thiệu
                    </Button>
                  </div>
                )}
              </div>

              {/* Tenant Card 2: Living Habits */}
              <div className="rounded-2xl bg-card p-6 ring-1 ring-border shadow-xs">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-bold text-charcoal">Thói quen sinh hoạt & Lối sống</h2>
                    <p className="text-xs text-muted-foreground mt-0.5">Tiêu chí dùng để hệ thống so khớp độ tương thích bạn cùng phòng</p>
                  </div>
                  <Button size="sm" variant="outline" className="text-xs" onClick={() => navigate("/edit-profile")}>
                    Cập nhật thói quen
                  </Button>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  {lifestyleItems.map((item) => (
                    <div key={item.label} className="rounded-xl border border-border p-3.5 bg-slate-50/50">
                      <p className="text-xs text-muted-foreground font-medium">{item.label}</p>
                      <p className={`mt-1 text-sm font-semibold ${item.isSet ? "text-slate-800" : "text-slate-400 italic"}`}>
                        {item.value}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tenant Card 3: Proximity */}
              <div className="rounded-2xl bg-card p-6 ring-1 ring-border shadow-xs">
                <h2 className="mb-1 text-base font-bold text-charcoal">Vị trí & Tiện ích ưu tiên</h2>
                <p className="text-xs text-muted-foreground mb-4">Các yếu tố khoảng cách mong muốn khi tìm phòng hoặc ghép đôi</p>

                {hasAnyProximity ? (
                  <div className="flex flex-wrap gap-2">
                    {proximityItems.map((p) =>
                      p.active ? (
                        <Badge key={p.label} variant="secondary" className="gap-1.5 py-1 px-3 bg-emerald-50 text-emerald-800 border-emerald-200 text-xs">
                          <CheckCircle2 className="size-3.5 text-emerald-600" /> {p.label}
                        </Badge>
                      ) : null
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground italic">Chưa chọn tiêu chí khoảng cách ưu tiên.</p>
                )}
              </div>

              {/* Tenant Card 4: Interests */}
              <div className="rounded-2xl bg-card p-6 ring-1 ring-border shadow-xs">
                <h2 className="mb-3 text-base font-bold text-charcoal">Sở thích & Phong cách sống</h2>
                {interests.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {interests.map((i) => (
                      <AmenityPill key={i} label={i} />
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground italic">Chưa cập nhật danh mục sở thích cá nhân.</p>
                )}
              </div>
            </>
          )}
        </div>

        {/* Right Column (4 cols): TrustScore, Stay/Stats, Account Details */}
        <div className="space-y-6 lg:col-span-4">
          {/* Card 1: TrustScore Summary */}
          <div className="rounded-2xl bg-card p-6 ring-1 ring-border shadow-xs text-center">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Điểm uy tín hệ thống</p>
            <div className="my-3 flex items-baseline justify-center gap-1">
              <span className="brand text-5xl font-black text-emerald-700">{score ?? "—"}</span>
              <span className="text-sm font-medium text-slate-400">/ 100</span>
            </div>

            {score != null && (
              <Badge className={`gap-1 ${score >= 70 ? "bg-emerald-600 hover:bg-emerald-700 text-white" : "bg-sky-600 hover:bg-sky-700 text-white"}`}>
                <Award className="size-3.5" /> {score >= 80 ? "Uy tín xuất sắc" : score >= 70 ? "Uy tín cao" : "Uy tín trung bình"}
              </Badge>
            )}

            <p className="mt-3 text-xs text-slate-600 leading-relaxed">
              {isLandlord
                ? "Điểm tính toán dựa trên xác thực CCCD, số phòng đã bàn giao thành công và đánh giá 2 chiều."
                : "Điểm tính toán dựa trên xác thực CCCD, lịch sử nhận phòng thực tế và đánh giá 2 chiều."}
            </p>

            <Button variant="outline" className="mt-4 w-full text-xs font-semibold" onClick={() => navigate("/trustscore")}>
              Xem chi tiết 4 trụ cột điểm số
            </Button>
          </div>

          {/* Card 2: Property Stats (Landlord) OR Rental Stay (Tenant) */}
          {isLandlord ? (
            <div className="rounded-2xl bg-card p-5 ring-1 ring-border shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Hoạt động cho thuê</p>
                <Building2 className="size-4 text-emerald-600" />
              </div>

              <div className="grid grid-cols-3 gap-2 py-2 text-center border-y border-border/60">
                <div>
                  <p className="text-lg font-bold text-foreground">{landlordRooms.length}</p>
                  <p className="text-[11px] text-muted-foreground">Tổng phòng</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-emerald-600">
                    {landlordRooms.filter((r) => r.status === "AVAILABLE").length}
                  </p>
                  <p className="text-[11px] text-muted-foreground">Còn trống</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-amber-600">
                    {landlordRooms.filter((r) => r.status === "RENTED").length}
                  </p>
                  <p className="text-[11px] text-muted-foreground">Đã thuê</p>
                </div>
              </div>

              <Button size="sm" variant="outline" className="mt-3 w-full text-xs gap-1.5" onClick={() => navigate("/landlord")}>
                <Home className="size-3.5" /> Bảng điều khiển chủ trọ
              </Button>
            </div>
          ) : (
            <div className="rounded-2xl bg-card p-5 ring-1 ring-border shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Phòng trọ đang ở</p>
                <Home className="size-4 text-emerald-600" />
              </div>

              {activeRental ? (
                <div className="space-y-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 leading-snug">{activeRental.roomTitle}</h3>
                    <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{activeRental.roomAddress || "Địa chỉ theo hợp đồng"}</p>
                  </div>
                  <div className="flex items-center justify-between rounded-lg bg-emerald-50/70 p-2.5 text-xs">
                    <span className="text-emerald-800 font-medium">Trạng thái:</span>
                    <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 border-emerald-200 text-[11px] gap-1">
                      <CheckCircle2 className="size-3" /> Đã nhận phòng thực tế
                    </Badge>
                  </div>
                  <Button size="sm" variant="outline" className="w-full text-xs" onClick={() => navigate("/rentals/me")}>
                    Quản lý hợp đồng phòng này
                  </Button>
                </div>
              ) : (
                <div className="space-y-3 text-center py-2">
                  <p className="text-xs text-slate-500">Bạn chưa có hợp đồng thuê phòng nào đang hoạt động trên hệ thống.</p>
                  <Button size="sm" variant="outline" className="w-full text-xs gap-1.5" onClick={() => navigate("/discover")}>
                    <Compass className="size-3.5" /> Khám phá phòng trọ
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Card 3: Account Stats & Verifications */}
          <div className="rounded-2xl bg-card p-5 ring-1 ring-border shadow-xs">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Thông số tài khoản</p>
            <div className="space-y-3 text-xs">
              {!isLandlord && (
                <div className="flex items-center justify-between py-1.5 border-b border-border/60">
                  <span className="text-slate-500">Lượt quẹt tìm bạn hôm nay</span>
                  <span className="font-bold text-emerald-700">{profile?.swipesLeft ?? 0} lượt</span>
                </div>
              )}
              <div className="flex items-center justify-between py-1.5 border-b border-border/60">
                <span className="text-slate-500">Email tài khoản</span>
                <span className="font-medium text-slate-800 truncate max-w-[180px]">{profile?.email || "—"}</span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-border/60">
                <span className="text-slate-500">Số điện thoại</span>
                <span className="font-medium text-slate-800">{profile?.phoneNumber || "Chưa cập nhật"}</span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-border/60">
                <span className="text-slate-500">Xác thực CCCD (KYC)</span>
                {profile?.isVerified || profile?.kycStatus === "APPROVED" ? (
                  <span className="font-semibold text-emerald-600 flex items-center gap-1">
                    <CheckCircle2 className="size-3" /> Đã duyệt
                  </span>
                ) : profile?.kycStatus === "PENDING" ? (
                  <span className="font-semibold text-amber-600 flex items-center gap-1">
                    <Clock className="size-3" /> Chờ duyệt
                  </span>
                ) : (
                  <span className="font-semibold text-slate-400">Chưa xác thực</span>
                )}
              </div>
              <div className="flex items-center justify-between py-1.5">
                <span className="text-slate-500">Tham gia nền tảng</span>
                <span className="font-medium text-slate-700">
                  {profile?.createdAt ? formatDate(profile.createdAt) : "Gần đây"}
                </span>
              </div>
            </div>
          </div>

          {/* Card 4: Badges */}
          <div className="rounded-2xl bg-card p-5 ring-1 ring-border shadow-xs">
            <h3 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground mb-3">Huy hiệu đạt được ({badges.length})</h3>
            {badges.length > 0 ? (
              <div className="space-y-2 text-xs">
                {badges.map((b) => (
                  <div key={b} className="flex items-center gap-2 rounded-lg bg-slate-50 p-2 border border-slate-100">
                    <Star className="size-4 fill-amber-400 text-amber-400 shrink-0" />
                    <span className="font-medium text-slate-800">{b}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground italic">
                {isLandlord
                  ? "Hoàn tất xác thực CCCD và xuất bản phòng trọ để mở khóa huy hiệu chủ trọ."
                  : "Hoàn tất xác thực CCCD và check-in nhận phòng để mở khóa huy hiệu."}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

