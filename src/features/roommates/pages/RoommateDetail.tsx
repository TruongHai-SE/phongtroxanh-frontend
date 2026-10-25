import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router";
import {
  ChevronRight,
  ChevronLeft,
  GraduationCap,
  MessageCircle,
  Heart,
  Wallet,
  MapPin,
  AlertCircle,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Moon,
  Users,
  CigaretteOff,
  Home,
  Images,
  ZoomIn,
  Flag,
  Check,
  CheckCircle2,
  Compass,
} from "lucide-react";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
} from "recharts";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { ImageWithFallback } from "@/components/shared/ImageWithFallback";
import { ImageZoomOverlay } from "@/components/shared/ImageZoomOverlay";
import { AmenityPill, MatchBadge } from "@/components/shared/primitives-compat";
import { reportsApi } from "@/features/reports/api/reportsApi";
import { cn, getInitials } from "@/lib/utils";
import type { Roommate } from "../types/roommate.types";
import { api } from "@/lib/api";

interface ExtendedRoommate extends Roommate {
  genderLabel: string;
  preferredRoomType: string;
  trustScore: number;
  isVerified: boolean;
  proximities: string[];
  matchHighlights: string[];
  hasDealbreaker: boolean;
}

const ROOM_TYPE_LABELS: Record<string, string> = {
  PHONG_KHEP_KIN: "Phòng khép kín",
  CAN_HO_MINI: "Căn hộ dịch vụ / Studio",
  STUDIO: "Căn hộ Studio",
  KY_TUC_XA: "Ký túc xá / Giường tầng",
  NHA_NGUYEN_CAN: "Nhà nguyên căn",
  PHONG_TRO: "Phòng trọ truyền thống",
  SLEEPBOX: "Sleepbox",
  O_GHEP: "Ở ghép",
};

function formatPreferredRoomType(raw?: string | null): string {
  if (!raw || !raw.trim()) return "Phòng trọ / Ở ghép";
  const key = raw.trim().toUpperCase();
  return ROOM_TYPE_LABELS[key] || raw.trim();
}

export default function RoommateDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [person, setPerson] = useState<ExtendedRoommate | null>(null);
  const [photoIdx, setPhotoIdx] = useState<number>(0);
  const [zoomSrc, setZoomSrc] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [liked, setLiked] = useState(false);
  const [liking, setLiking] = useState(false);

  // Report modal state
  const [reportOpen, setReportOpen] = useState(false);
  const [reportType, setReportType] = useState("Thông tin hồ sơ không đúng thực tế");
  const [reportDetail, setReportDetail] = useState("");
  const [submittingReport, setSubmittingReport] = useState(false);

  useEffect(() => {
    if (!id) return;
    async function loadData() {
      setIsLoading(true);
      setError(null);
      try {
        const [profile, compat] = await Promise.allSettled([
          api.get<any>(`/users/${id}/public`),
          api.get<any>(`/matching/compatibility/${id}`),
        ]);

        const pData = profile.status === "fulfilled" ? profile.value : null;
        const cData = compat.status === "fulfilled" ? compat.value : null;

        if (pData) {
          const compatList = cData
            ? [
                { label: "Ngân sách (25%)", value: cData.budgetScore ?? 0 },
                { label: "Địa điểm (20%)", value: cData.locationScore ?? 0 },
                { label: "Giờ ngủ (15%)", value: cData.sleepScore ?? 0 },
                { label: "Gọn gàng (10%)", value: cData.neatScore ?? 0 },
                { label: "Tiếp khách (10%)", value: cData.guestScore ?? 0 },
                { label: "Thuốc lá (10%)", value: cData.smokeScore ?? 100 },
                { label: "Độ yên tĩnh (5%)", value: cData.noiseScore ?? 70 },
                { label: "Sở thích (5%)", value: cData.interestScore ?? 0 },
              ]
            : [];

          const age = pData.birthDate
            ? Math.max(
                18,
                new Date().getFullYear() - new Date(pData.birthDate).getFullYear()
              )
            : 21;

          const galleryImages = Array.isArray(pData.galleryImages)
            ? pData.galleryImages.filter(Boolean)
            : [];
          const primaryPhoto = pData.avatarUrl || galleryImages[0] || "";
          setPhotoIdx(0);

          const genderLabel =
            pData.gender === "MALE"
              ? "Nam"
              : pData.gender === "FEMALE"
              ? "Nữ"
              : "Khác";

          const proximities: string[] = [];
          if (pData.proximitySchool) proximities.push("Gần trường học");
          if (pData.proximityWork) proximities.push("Gần nơi làm việc");
          if (pData.proximityMarket) proximities.push("Gần chợ / siêu thị");
          if (pData.proximityBus) proximities.push("Gần trạm xe buýt");

          setPerson({
            id: String(pData.id || id),
            name: pData.fullName || "Thành viên",
            age,
            avatar: primaryPhoto,
            galleryImages,
            bio:
              pData.bio && pData.bio.trim().length > 0
                ? pData.bio.trim()
                : "Thành viên chưa viết lời giới thiệu chi tiết. Bạn có thể nhắn tin trực tiếp để trao đổi thêm về thói quen sinh hoạt và kế hoạch tìm phòng.",
            school: pData.schoolOrCompany || "Đang tìm bạn ở ghép tại TP.HCM",
            budget: pData.budgetMax
              ? pData.budgetMin
                ? `${(Number(pData.budgetMin) / 1e6).toFixed(1)} – ${(Number(pData.budgetMax) / 1e6).toFixed(1)} tr/tháng`
                : `≤ ${(Number(pData.budgetMax) / 1e6).toFixed(1)} tr/tháng`
              : "Thỏa thuận linh hoạt",
            areas:
              pData.preferredDistricts && pData.preferredDistricts.length > 0
                ? pData.preferredDistricts
                : ["Linh hoạt các quận"],
            interests:
              pData.interests && pData.interests.length > 0
                ? pData.interests
                : [],
            lifestyle: [
              {
                label: "Giờ giấc sinh hoạt",
                value: pData.earlySleeper ? "Ngủ sớm (trước 23h)" : "Linh hoạt / Cú đêm",
              },
              {
                label: "Mức độ gọn gàng",
                value: pData.isNeat ? "Ngăn nắp, sạch sẽ" : "Thoải mái, tự nhiên",
              },
              {
                label: "Thuốc lá",
                value: pData.nonSmoking !== false ? "Không hút thuốc" : "Có hút thuốc",
              },
              {
                label: "Khách đến chơi",
                value: pData.allowGuests ? "Thoải mái tiếp bạn" : "Ưu tiên yên tĩnh",
              },
            ],
            match: cData?.totalScore ?? 80,
            compatibility:
              compatList.length > 0
                ? compatList
                : [
                    { label: "Ngân sách (25%)", value: 80 },
                    { label: "Địa điểm (20%)", value: 75 },
                    { label: "Giờ ngủ (15%)", value: 85 },
                    { label: "Gọn gàng (10%)", value: 85 },
                    { label: "Tiếp khách (10%)", value: 75 },
                    { label: "Thuốc lá (10%)", value: 100 },
                    { label: "Độ yên tĩnh (5%)", value: 80 },
                    { label: "Sở thích (5%)", value: 70 },
                  ],
            nonSmoking: pData.nonSmoking ?? true,
            earlySleeper: pData.earlySleeper ?? false,
            isNeat: pData.isNeat ?? true,
            allowGuests: pData.allowGuests ?? false,
            genderLabel,
            preferredRoomType: formatPreferredRoomType(pData.preferredRoomType),
            trustScore: pData.trustScore ?? 50,
            isVerified: Boolean(pData.isVerified),
            proximities,
            matchHighlights: Array.isArray(cData?.highlights) ? cData.highlights : [],
            hasDealbreaker: Boolean(cData?.hasDealbreaker),
          });
        } else {
          setError("Không tìm thấy thông tin bạn ở ghép.");
        }
      } catch (err) {
        console.warn("Could not load user public profile:", err);
        setError("Không thể tải thông tin hồ sơ.");
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [id]);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-6xl px-6 py-20 text-center">
        <RefreshCw className="mx-auto size-8 animate-spin text-primary" />
        <p className="mt-3 text-sm text-muted-foreground">
          Đang tải hồ sơ bạn ở ghép...
        </p>
      </div>
    );
  }

  if (error || !person) {
    return (
      <div className="mx-auto max-w-md px-6 py-20 text-center">
        <AlertCircle className="mx-auto size-12 text-rose-500" />
        <h2 className="mt-4 text-lg font-bold text-foreground">
          {error || "Không tìm thấy hồ sơ"}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Hồ sơ người dùng này không tồn tại hoặc đang tạm ẩn.
        </p>
        <Button className="mt-6" onClick={() => navigate("/roommates")}>
          Quay lại danh sách
        </Button>
      </div>
    );
  }

  const p = person;
  const allPhotos = Array.from(
    new Set([p.avatar, ...(p.galleryImages || [])].filter(Boolean))
  );
  const currentPhoto = allPhotos[photoIdx] || "";
  const chartData = p.compatibility.slice(0, 6).map((c) => ({
    subject: c.label.replace(/\s*\(\d+%\)$/, ""),
    value: c.value,
  }));

  const handleLikeProfile = async () => {
    if (liked || liking) return;
    setLiking(true);
    try {
      const res = await api.post<any>("/matching/swipe", {
        targetUserId: p.id,
        action: "LIKE",
      });
      setLiked(true);
      if (res?.isMatch) {
        toast.success(`Bạn và ${p.name} đã tương thích! Hãy bắt đầu trò chuyện.`);
      } else {
        toast.success(`Đã gửi lượt quan tâm đến hồ sơ của ${p.name}`);
      }
    } catch (err: any) {
      const msg = err?.message || "";
      if (msg.includes("trước đó") || err?.status === 409) {
        setLiked(true);
        toast.info(`Bạn đã thích hồ sơ của ${p.name} trước đó`);
      } else {
        toast.error(msg || "Không thể gửi lượt thích lúc này");
      }
    } finally {
      setLiking(false);
    }
  };

  const handleSendReport = async () => {
    if (!reportDetail.trim()) {
      toast.error("Vui lòng nhập mô tả chi tiết lý do báo cáo");
      return;
    }
    setSubmittingReport(true);
    try {
      await reportsApi.submitReport({
        targetType: "USER",
        targetId: p.id,
        reportType,
        detail: reportDetail.trim(),
        severity: "MEDIUM",
      });
      toast.success("Đã gửi báo cáo. Ban quản trị sẽ kiểm tra và xử lý sớm nhất.");
      setReportOpen(false);
      setReportDetail("");
    } catch (err: any) {
      toast.error(err?.message || "Không thể gửi báo cáo, vui lòng thử lại");
    } finally {
      setSubmittingReport(false);
    }
  };

  const lifestyleIcons = [Moon, Sparkles, CigaretteOff, Users];

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-5">
      {/* Breadcrumb */}
      <nav className="mb-4 flex items-center justify-between gap-2 text-sm text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <Link
            to="/roommates"
            className="hover:text-primary transition-colors font-medium"
          >
            Ghép bạn
          </Link>
          <ChevronRight className="size-3.5" />
          <span className="text-foreground font-semibold truncate">{p.name}</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 text-xs text-muted-foreground hover:text-foreground"
          onClick={() => navigate("/roommates")}
        >
          ← Quay lại danh sách
        </Button>
      </nav>

      <div className="grid gap-6 lg:grid-cols-[360px_1fr] items-start">
        {/* LEFT COLUMN: Photo Gallery + Primary Actions + Trust Card */}
        <div className="space-y-4 lg:sticky lg:top-20">
          <div className="rounded-2xl bg-card border shadow-xs p-3.5 space-y-3">
            {/* Main Photo Viewer */}
            <div className="relative overflow-hidden rounded-xl ring-1 ring-border bg-secondary/30 group">
              {currentPhoto ? (
                <button
                  type="button"
                  onClick={() => setZoomSrc(currentPhoto)}
                  className="block w-full cursor-pointer relative"
                >
                  <ImageWithFallback
                    src={currentPhoto}
                    alt={`${p.name} - ảnh ${photoIdx + 1}`}
                    className="h-[clamp(250px,36dvh,340px)] w-full object-cover transition duration-300 group-hover:scale-[1.02]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition flex items-end justify-end p-3">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-black/65 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur-xs">
                      <ZoomIn className="size-3.5" /> Phóng to ảnh
                    </span>
                  </div>
                </button>
              ) : (
                <div className="h-[clamp(230px,32dvh,300px)] w-full bg-gradient-to-br from-emerald-600/15 via-mint/60 to-secondary flex flex-col items-center justify-center p-6 text-center">
                  <div className="size-24 rounded-full bg-emerald-600 text-white font-bold text-3xl flex items-center justify-center shadow-md ring-4 ring-white/80">
                    {getInitials(p.name)}
                  </div>
                  <p className="mt-3 text-sm font-semibold text-foreground">
                    {p.name}, {p.age} tuổi
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Chưa đăng tải ảnh bộ sưu tập cá nhân
                  </p>
                </div>
              )}

              <MatchBadge value={p.match} className="absolute right-3 top-3 shadow-sm" />

              {allPhotos.length > 0 && (
                <span className="absolute left-3 bottom-3 inline-flex items-center gap-1.5 rounded-full bg-black/65 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur-xs">
                  <Images className="size-3.5" />
                  Ảnh {photoIdx + 1}/{allPhotos.length}
                </span>
              )}

              {allPhotos.length > 1 && (
                <>
                  <button
                    type="button"
                    aria-label="Ảnh trước"
                    onClick={(e) => {
                      e.stopPropagation();
                      setPhotoIdx((prev) =>
                        prev === 0 ? allPhotos.length - 1 : prev - 1
                      );
                    }}
                    className="absolute left-2.5 top-1/2 -translate-y-1/2 size-8 rounded-full bg-black/55 text-white hover:bg-black/75 flex items-center justify-center transition cursor-pointer shadow-sm"
                  >
                    <ChevronLeft className="size-4" />
                  </button>
                  <button
                    type="button"
                    aria-label="Ảnh tiếp theo"
                    onClick={(e) => {
                      e.stopPropagation();
                      setPhotoIdx((prev) =>
                        prev === allPhotos.length - 1 ? 0 : prev + 1
                      );
                    }}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 size-8 rounded-full bg-black/55 text-white hover:bg-black/75 flex items-center justify-center transition cursor-pointer shadow-sm"
                  >
                    <ChevronRight className="size-4" />
                  </button>
                </>
              )}
            </div>

            {/* Thumbnail Strip (Multi-photo support) */}
            {allPhotos.length > 1 ? (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px] text-muted-foreground px-0.5">
                  <span className="font-medium">
                    Bộ sưu tập ảnh ({allPhotos.length})
                  </span>
                  <span>Bấm vào ảnh để xem rõ hơn</span>
                </div>
                <div className="grid grid-cols-5 gap-2">
                  {allPhotos.slice(0, 10).map((url, idx) => (
                    <button
                      key={url + idx}
                      type="button"
                      onClick={() => setPhotoIdx(idx)}
                      className={cn(
                        "aspect-square overflow-hidden rounded-xl border-2 transition cursor-pointer",
                        photoIdx === idx
                          ? "border-primary ring-2 ring-primary/25 scale-[1.02]"
                          : "border-border opacity-75 hover:opacity-100"
                      )}
                    >
                      <img
                        src={url}
                        alt={`Ảnh ${idx + 1}`}
                        className="size-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between rounded-xl bg-secondary/40 px-3 py-2 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <Images className="size-3.5 text-primary" />
                  {allPhotos.length === 1
                    ? "Đang hiển thị 1 ảnh đại diện"
                    : "Chưa có ảnh bộ sưu tập"}
                </span>
                {currentPhoto && (
                  <button
                    type="button"
                    onClick={() => setZoomSrc(currentPhoto)}
                    className="font-medium text-primary hover:underline cursor-pointer"
                  >
                    Xem ảnh lớn
                  </button>
                )}
              </div>
            )}

            {/* Primary CTA Buttons */}
            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <Button
                className="w-full gap-2"
                onClick={() => navigate(`/chat?partnerId=${p.id}`)}
              >
                <MessageCircle className="size-4" /> Nhắn tin
              </Button>
              <Button
                variant={liked ? "secondary" : "outline"}
                className={cn(
                  "w-full gap-2",
                  liked && "bg-mint text-primary border-primary/30"
                )}
                disabled={liking}
                onClick={handleLikeProfile}
              >
                {liked ? (
                  <>
                    <Check className="size-4 text-primary" /> Đã thích
                  </>
                ) : (
                  <>
                    <Heart className="size-4 text-rose-500" /> Thích hồ sơ
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Trust & Verification Summary Card */}
          <div className="rounded-2xl bg-card border shadow-xs p-4 space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="size-4 text-emerald-600" />
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Độ tin cậy hồ sơ
                </span>
              </div>
              <Badge
                variant="outline"
                className={cn(
                  "text-xs font-semibold",
                  p.isVerified
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : "bg-secondary text-muted-foreground"
                )}
              >
                {p.isVerified ? "Đã xác minh CCCD" : "Thành viên tiêu chuẩn"}
              </Badge>
            </div>

            <div>
              <div className="flex items-baseline justify-between mb-1.5">
                <span className="text-xs text-muted-foreground">
                  Điểm uy tín cộng đồng
                </span>
                <span className="text-base font-bold text-emerald-600">
                  {p.trustScore}
                  <span className="text-xs font-normal text-muted-foreground">
                    /100
                  </span>
                </span>
              </div>
              <Progress value={p.trustScore} className="h-2" />
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
              <div className="rounded-xl bg-secondary/40 p-2.5">
                <p className="text-[11px] text-muted-foreground">Giới tính</p>
                <p className="font-semibold text-foreground mt-0.5">
                  {p.genderLabel}
                </p>
              </div>
              <div className="rounded-xl bg-secondary/40 p-2.5">
                <p className="text-[11px] text-muted-foreground">Độ tuổi</p>
                <p className="font-semibold text-foreground mt-0.5">
                  {p.age} tuổi
                </p>
              </div>
            </div>

            <div className="border-t pt-2.5 flex justify-end">
              <button
                type="button"
                onClick={() => setReportOpen(true)}
                className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-rose-600 transition cursor-pointer"
              >
                <Flag className="size-3.5" /> Báo cáo hồ sơ vi phạm
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Structured Bento Grid */}
        <div className="space-y-4">
          {/* Card 1: Identity Header + 3-Column Search Criteria */}
          <div className="rounded-2xl bg-card border shadow-xs p-5 space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h1 className="brand text-2xl sm:text-3xl text-foreground">
                    {p.name}, {p.age}
                  </h1>
                  <Badge
                    variant="secondary"
                    className="bg-mint/70 text-primary border-primary/20 text-xs"
                  >
                    {p.genderLabel}
                  </Badge>
                </div>
                <p className="mt-1.5 inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                  <GraduationCap className="size-4 text-primary shrink-0" />
                  <span>{p.school}</span>
                </p>
              </div>

              <div className="rounded-xl bg-emerald-50/80 border border-emerald-200/70 px-3.5 py-2 text-right">
                <p className="text-[11px] font-medium text-emerald-800">
                  Mức độ hợp cạ
                </p>
                <p className="text-xl font-bold text-emerald-700">{p.match}%</p>
              </div>
            </div>

            {/* 3-Column Criteria Bento */}
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="flex items-start gap-3 rounded-xl bg-secondary/45 p-3.5 border border-border/60">
                <div className="rounded-lg bg-primary/10 p-2 text-primary shrink-0">
                  <Wallet className="size-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-medium text-muted-foreground">
                    Ngân sách thuê phòng
                  </p>
                  <p className="text-sm font-semibold text-foreground mt-0.5 truncate">
                    {p.budget}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-xl bg-secondary/45 p-3.5 border border-border/60">
                <div className="rounded-lg bg-primary/10 p-2 text-primary shrink-0">
                  <MapPin className="size-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-medium text-muted-foreground">
                    Khu vực ưu tiên
                  </p>
                  <p className="text-sm font-semibold text-foreground mt-0.5 line-clamp-1">
                    {p.areas.join(", ")}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-xl bg-secondary/45 p-3.5 border border-border/60">
                <div className="rounded-lg bg-primary/10 p-2 text-primary shrink-0">
                  <Home className="size-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-medium text-muted-foreground">
                    Loại phòng mong muốn
                  </p>
                  <p className="text-sm font-semibold text-foreground mt-0.5 truncate">
                    {p.preferredRoomType}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Row 2: 2-Column Bento (Bio & Interests | Lifestyle Habits) */}
          <div className="grid gap-4 md:grid-cols-2">
            {/* Bio & Interests Card */}
            <div className="rounded-2xl bg-card border shadow-xs p-5 flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                  Lời giới thiệu
                </h2>
                <p className="text-sm leading-relaxed text-foreground/90 bg-secondary/35 rounded-xl p-3.5 border border-border/50">
                  "{p.bio}"
                </p>
              </div>

              <div className="space-y-2.5 pt-1">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Sở thích & Ưu tiên vị trí
                </h3>
                {p.interests.length > 0 || p.proximities.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {p.interests.map((item) => (
                      <AmenityPill key={item} label={item} />
                    ))}
                    {p.proximities.map((prox) => (
                      <span
                        key={prox}
                        className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200/80 px-2.5 py-1 text-xs font-medium text-emerald-800"
                      >
                        <Compass className="size-3 text-emerald-600" />
                        {prox}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground italic">
                    Thành viên để ngỏ sở thích cá nhân — dễ dàng hòa nhập với bạn cùng phòng.
                  </p>
                )}
              </div>
            </div>

            {/* Lifestyle Habits Card */}
            <div className="rounded-2xl bg-card border shadow-xs p-5 space-y-3">
              <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                Thói quen sinh hoạt
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {p.lifestyle.map((l, idx) => {
                  const IconComp = lifestyleIcons[idx % lifestyleIcons.length];
                  return (
                    <div
                      key={l.label}
                      className="rounded-xl bg-secondary/35 border border-border/60 p-3 flex flex-col justify-between gap-1.5"
                    >
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <IconComp className="size-3.5 text-primary shrink-0" />
                        <span>{l.label}</span>
                      </div>
                      <p className="text-sm font-semibold text-foreground">
                        {l.value}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Card 3: Compatibility Breakdown (Radar + 6 Bars) */}
          <div className="rounded-2xl bg-card border shadow-xs p-5">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
              <div>
                <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                  Phân tích độ tương thích chi tiết
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  So sánh tự động dựa trên ngân sách, khu vực, giờ giấc và thói quen sinh hoạt của bạn và {p.name}
                </p>
              </div>
              <Badge variant="outline" className="bg-emerald-50 text-emerald-800 border-emerald-200 text-xs">
                Tổng điểm: {p.match}% phù hợp
              </Badge>
            </div>

            <div className="grid gap-6 md:grid-cols-[260px_1fr] items-center">
              <div className="h-52 w-full bg-secondary/25 rounded-xl border border-border/50 p-2">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart
                    data={chartData}
                    outerRadius="64%"
                    margin={{ top: 12, right: 28, bottom: 12, left: 28 }}
                  >
                    <PolarGrid stroke="#d1fadf" />
                    <PolarAngleAxis
                      dataKey="subject"
                      tick={{ fontSize: 11, fill: "#475569", fontWeight: 500 }}
                    />
                    <Radar
                      dataKey="value"
                      stroke="#15803d"
                      fill="#15803d"
                      fillOpacity={0.35}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>

              <div className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
                {p.compatibility.map((c) => (
                  <div key={c.label} className="space-y-1.5">
                    <div className="flex justify-between text-xs font-medium">
                      <span className="text-muted-foreground">{c.label}</span>
                      <span className="text-foreground font-semibold">
                        {c.value}%
                      </span>
                    </div>
                    <Progress value={c.value} className="h-2" />
                  </div>
                ))}
              </div>
            </div>

            {(p.matchHighlights.length > 0 || p.hasDealbreaker) && (
              <div className="mt-4 pt-3.5 border-t border-border/60 flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold text-muted-foreground mr-1">
                  Nhận xét tự động:
                </span>
                {p.matchHighlights.map((hl) => (
                  <span
                    key={hl}
                    className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200/80 px-2.5 py-0.5 text-xs font-medium text-emerald-800"
                  >
                    <CheckCircle2 className="size-3 text-emerald-600" />
                    {hl}
                  </span>
                ))}
                {p.hasDealbreaker && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 border border-rose-200 px-2.5 py-0.5 text-xs font-medium text-rose-700">
                    <AlertCircle className="size-3 text-rose-600" />
                    Khác biệt lớn về thói quen hút thuốc (giảm 50% tổng điểm)
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <ImageZoomOverlay
        src={zoomSrc}
        onClose={() => setZoomSrc(null)}
        alt={p.name}
      />

      {/* Report Profile Dialog */}
      <Dialog open={reportOpen} onOpenChange={setReportOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">
              Báo cáo hồ sơ {p.name}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Báo cáo sẽ được gửi ẩn danh tới Ban quản trị để kiểm tra và xử lý theo quy định cộng đồng.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2 text-sm">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                Lý do báo cáo
              </label>
              <div className="flex flex-wrap gap-1.5">
                {[
                  "Thông tin hồ sơ không đúng thực tế",
                  "Nội dung giới thiệu / hình ảnh phản cảm",
                  "Quấy rối hoặc spam tin nhắn",
                  "Nghi ngờ tài khoản giả mạo / lừa đảo",
                ].map((reason) => (
                  <button
                    key={reason}
                    type="button"
                    onClick={() => setReportType(reason)}
                    className={cn(
                      "rounded-lg border px-2.5 py-1.5 text-xs transition cursor-pointer text-left",
                      reportType === reason
                        ? "border-primary bg-mint/70 text-primary font-medium"
                        : "border-border hover:bg-secondary/60 text-muted-foreground"
                    )}
                  >
                    {reason}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                Mô tả chi tiết *
              </label>
              <Textarea
                rows={3}
                value={reportDetail}
                onChange={(e) => setReportDetail(e.target.value)}
                placeholder="Mô tả cụ thể dấu hiệu vi phạm để Ban quản trị đối chiếu..."
                className="resize-none text-sm"
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setReportOpen(false)}
            >
              Hủy
            </Button>
            <Button
              size="sm"
              variant="destructive"
              disabled={submittingReport}
              onClick={handleSendReport}
            >
              {submittingReport ? "Đang gửi..." : "Gửi báo cáo"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
