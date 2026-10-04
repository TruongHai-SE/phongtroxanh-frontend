import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router";
import {
  ChevronRight, ChevronLeft, Heart, Share2, MapPin, Maximize2, Layers, ShieldCheck,
  ShieldAlert, MessageCircle, Star, Check, X, Eye, Flag, AlertTriangle, MessageSquarePlus,
  KeyRound, Calendar, ArrowLeftRight,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { ImageWithFallback } from "@/components/shared/ImageWithFallback";
import { AmenityPill, StarRating } from "@/components/shared/primitives-compat";
import { formatVND, getInitials, cn } from "@/lib/utils";
import { roomImages } from "@/lib/constants";
import { RoomDetailSkeleton } from "@/components/ui/skeleton-loaders";
import { toast } from "sonner";
import type { Room } from "@/types/room";
import { useRoomDetail } from "../hooks/useRoomDetail";
import { reportsApi } from "@/features/reports/api/reportsApi";
import { reviewsApi } from "@/features/reviews/api/reviewsApi";
import { rentalsApi } from "@/features/rentals/api/rentalsApi";
import { useAuth } from "@/app/context/AuthContext";

const reviewTagOptions = [
  "Đúng mô tả",
  "Sạch sẽ",
  "An ninh tốt",
  "Chủ thân thiện",
  "Vị trí thuận tiện",
  "Giờ giấc tự do",
  "Không đúng ảnh",
  "Tường ẩm mốc",
  "Chi phí phát sinh",
  "Đòi cọc vô lý",
  "Chủ trọ khó tính"
];

export default function RoomDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { room: detailRoom, reviews: roomReviews, isLoading, isError, toggleSave } = useRoomDetail(id);
  const [isSaved, setIsSaved] = useState(false);

  // Local reviews list so new reviews show immediately
  const [localReviews, setLocalReviews] = useState<any[]>([]);

  // Reporting modal state (Admin channel)
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [reportType, setReportType] = useState("TIN_GIA");
  const [reportDetail, setReportDetail] = useState("");
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);

  // Public Review modal state (Community channel)
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewTags, setReviewTags] = useState<string[]>(["Đúng mô tả"]);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  // Rental registration modal state (Connect to 'Phòng của tôi')
  const [isRentModalOpen, setIsRentModalOpen] = useState(false);
  const [rentStartDate, setRentStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split("T")[0];
  });
  const [rentEndDate, setRentEndDate] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 6);
    return d.toISOString().split("T")[0];
  });
  const [rentMessage, setRentMessage] = useState("");
  const [isSubmittingRent, setIsSubmittingRent] = useState(false);

  // Image Lightbox Zoom Modal
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  useEffect(() => {
    if (detailRoom?.isSaved !== undefined) {
      setIsSaved(detailRoom.isSaved);
    }
  }, [detailRoom]);

  useEffect(() => {
    if (Array.isArray(roomReviews)) {
      setLocalReviews(roomReviews);
    }
  }, [roomReviews]);

  const toggleReviewTag = (tag: string) => {
    setReviewTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const rawImages = detailRoom?.images || [];
  const displayImages: string[] = rawImages
    .map((img: any) => (typeof img === "string" ? img : img?.imageUrl))
    .filter(Boolean);
  const images = displayImages.length > 0 ? displayImages : roomImages;

  const ROOM_TYPE_LABELS: Record<string, string> = {
    PHONG_KHEP_KIN: "Phòng khép kín",
    PHONG_TRO: "Phòng trọ",
    STUDIO: "Studio",
    CAN_HO_MINI: "Căn hộ mini",
    KTX_SLEEPBOX: "KTX / Sleepbox",
    SLEEPBOX: "Sleepbox",
    KY_TUC_XA: "Ký túc xá",
  };

  const rawAmenities = (detailRoom as any)?.amenities;
  const amenities: string[] = Array.isArray(rawAmenities) && rawAmenities.length > 0
    ? rawAmenities
    : [];

  const rawFees = detailRoom?.fees || [];
  const fees = [
    { label: "Tiền thuê", value: `${Number(detailRoom?.price || 0).toLocaleString("vi-VN")}đ/tháng` },
    ...(detailRoom?.depositAmount
      ? [{ label: "Đặt cọc", value: `${Number(detailRoom.depositAmount).toLocaleString("vi-VN")}đ` }]
      : []),
    ...rawFees.map((f: any) => ({
      label: f.feeLabel || f.feeName || f.label || "Chi phí",
      value: f.feeValue || (f.amount ? `${Number(f.amount).toLocaleString("vi-VN")}đ` : (f.value || "Theo thỏa thuận")),
    })),
  ];

  const landlord = {
    name: detailRoom?.landlord?.fullName || "Chủ phòng trọ",
    verified: Boolean(detailRoom?.landlord?.isVerified),
    avatar: detailRoom?.landlord?.avatarUrl || "",
    rating: detailRoom?.landlord?.trustScore ? (detailRoom.landlord.trustScore / 20).toFixed(1) : "5.0",
  };

  const title = detailRoom?.title || "Phòng trọ";
  const district = detailRoom?.district || "Hồ Chí Minh";
  const price = detailRoom?.price ? Number(detailRoom.price) : 0;
  const area = detailRoom?.areaSqm ? Number(detailRoom.areaSqm) : 0;
  const floor = detailRoom?.floorNumber || 1;
  const rawType = detailRoom?.roomType || "";
  const type = ROOM_TYPE_LABELS[rawType] || (rawType ? rawType.replace(/_/g, " ") : "Phòng trọ");
  const description = detailRoom?.description || "Chưa có mô tả chi tiết cho phòng này.";

  const handleToggleSave = async () => {
    try {
      await toggleSave(isSaved);
      setIsSaved(!isSaved);
      toast.success(!isSaved ? "Đã lưu phòng vào danh sách yêu thích" : "Đã bỏ lưu phòng");
    } catch {
      setIsSaved(!isSaved);
    }
  };

  const handleSendReport = async () => {
    if (!reportDetail.trim()) {
      toast.error("Vui lòng mô tả chi tiết hành vi vi phạm");
      return;
    }
    if (!id) return;

    setIsSubmittingReport(true);
    try {
      await reportsApi.submitReport({
        targetType: "ROOM",
        targetId: id,
        reportType,
        detail: reportDetail.trim(),
        severity: "HIGH",
      });
      toast.success("Báo cáo vi phạm đã được gửi tới Ban quản trị kiểm duyệt.");
      setIsReportOpen(false);
      setReportDetail("");
    } catch (err: any) {
      const msg = err?.response?.data?.detail || err?.response?.data?.message || "Không thể gửi báo cáo";
      toast.error(msg);
    } finally {
      setIsSubmittingReport(false);
    }
  };

  const handleOpenReviewModal = async () => {
    if (!user) {
      toast.error("Vui lòng đăng nhập để viết đánh giá phòng này.");
      navigate("/login");
      return;
    }
    if (user.role === "landlord") {
      toast.error("Tài khoản chủ trọ không thể tự viết đánh giá cho phòng trọ.");
      return;
    }
    try {
      const tenantRentals = await rentalsApi.getMyTenantRentals();
      const list = Array.isArray(tenantRentals) ? tenantRentals : (tenantRentals as any)?.content || [];
      const eligibleRental = list.find(
        (r: any) =>
          r.roomId === id &&
          (r.status === "CHECKED_IN" || r.checkInAt || (r.status === "TERMINATED" && r.checkInAt))
      );
      if (!eligibleRental) {
        toast.error("Chỉ người thuê đã hoàn tất nhận phòng thực tế (Check-in) mới có thể gửi đánh giá phòng này.");
        return;
      }
      setIsReviewOpen(true);
    } catch {
      toast.error("Chỉ người thuê có hợp đồng và đã check-in thực tế mới có thể đánh giá phòng này.");
    }
  };

  const handleSendPublicReview = async () => {
    if (!reviewComment.trim()) {
      toast.error("Vui lòng nhập nội dung đánh giá của bạn");
      return;
    }
    if (!id) return;

    setIsSubmittingReview(true);
    try {
      const res = await reviewsApi.createReview({
        roomId: id,
        rating: reviewRating,
        comment: reviewComment.trim(),
        tags: reviewTags,
      });

      toast.success("Đã đăng đánh giá công khai cho phòng trọ này!");
      const newReview = {
        id: res?.id || "rv-" + Date.now(),
        reviewerName: user?.fullName || "Bạn (Người thuê)",
        reviewerAvatar: user?.avatarUrl || "",
        rating: reviewRating,
        comment: reviewComment.trim(),
        tags: reviewTags,
        isVerifiedStay: true,
        createdAt: new Date().toISOString(),
      };
      setLocalReviews((prev) => [newReview, ...prev]);
      setIsReviewOpen(false);
      setReviewComment("");
    } catch (err: any) {
      const msg = err?.response?.data?.detail || err?.response?.data?.message || "Không thể gửi đánh giá";
      toast.error(msg);
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const handleOpenRentModal = () => {
    if (!user) {
      toast.error("Vui lòng đăng nhập để gửi yêu cầu thuê phòng.");
      navigate("/login");
      return;
    }
    if (user.role === "landlord") {
      toast.error("Tài khoản chủ trọ không thể đăng ký thuê phòng.");
      return;
    }
    setIsRentModalOpen(true);
  };

  const handleConfirmRent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setIsSubmittingRent(true);
    try {
      await rentalsApi.createRental({
        roomId: id,
        startDate: rentStartDate,
        endDate: rentEndDate,
        message: rentMessage || "Tôi muốn đăng ký thuê phòng này.",
      });
      toast.success("Đăng ký thuê phòng thành công! Phòng đã được thêm vào mục 'Phòng của tôi'.");
      setIsRentModalOpen(false);
      navigate("/rentals/me");
    } catch (err: any) {
      toast.error(err.message || "Không thể gửi yêu cầu thuê phòng.");
    } finally {
      setIsSubmittingRent(false);
    }
  };

  if (isLoading) {
    return <RoomDetailSkeleton />;
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-6">
      {/* Breadcrumb */}
      <div className="mb-4 flex items-center gap-2 text-xs text-muted-foreground">
        <Link to="/discover" className="hover:text-foreground">Khám phá</Link>
        <ChevronRight className="size-3" />
        <span>{district}</span>
        <ChevronRight className="size-3" />
        <span className="truncate max-w-[200px] text-foreground">{title}</span>
      </div>

      {/* Gallery with Zoom on Click */}
      <div className="relative grid grid-cols-1 gap-2 md:grid-cols-4 md:grid-rows-2 h-[380px] rounded-2xl overflow-hidden mb-6 group/gallery">
        <div 
          onClick={() => setLightboxIndex(0)}
          className="md:col-span-2 md:row-span-2 relative h-full cursor-zoom-in group overflow-hidden"
        >
          <ImageWithFallback src={images[0]} alt="" className="size-full object-cover transition-transform duration-300 group-hover:scale-103" />
          <div className="absolute inset-0 bg-black/25 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <span className="bg-black/70 text-white text-xs px-3.5 py-1.5 rounded-full flex items-center gap-1.5 backdrop-blur-xs font-medium">
              <Maximize2 className="size-3.5" /> Phóng to ảnh
            </span>
          </div>
        </div>
        {images.slice(1, 5).map((img, i) => (
          <div 
            key={i} 
            onClick={() => setLightboxIndex(i + 1)}
            className="relative h-full hidden md:block cursor-zoom-in group overflow-hidden"
          >
            <ImageWithFallback src={img} alt="" className="size-full object-cover transition-transform duration-300 group-hover:scale-103" />
            <div className="absolute inset-0 bg-black/25 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <span className="bg-black/70 text-white text-[11px] p-2 rounded-full backdrop-blur-xs">
                <Maximize2 className="size-3.5 text-white" />
              </span>
            </div>
          </div>
        ))}

        {/* View all photos button */}
        <button
          type="button"
          onClick={() => setLightboxIndex(0)}
          className="absolute right-3.5 bottom-3.5 z-10 rounded-xl bg-card/90 hover:bg-card px-3.5 py-1.5 text-xs font-semibold text-foreground shadow-md backdrop-blur-md flex items-center gap-1.5 transition-all hover:scale-102 cursor-pointer border border-border/80"
        >
          <Maximize2 className="size-3.5 text-primary" /> Xem tất cả {images.length} ảnh
        </button>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        {/* Main Details */}
        <div className="space-y-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="secondary">{type}</Badge>
              <Badge variant="outline">Tầng {floor}</Badge>
              <Badge variant="outline">{area} m²</Badge>
            </div>
            <h1 className="text-2xl font-bold text-charcoal">{title}</h1>
            <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
              <MapPin className="size-4 text-primary" /> {district}, TP. Hồ Chí Minh
            </p>
          </div>

          <Separator />

          <Section title="Mô tả phòng">
            <p className="whitespace-pre-line text-sm text-slate-700 leading-relaxed">{description}</p>
          </Section>

          <Separator />

          <Section title="Tiện nghi & Dịch vụ">
            {amenities.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {amenities.map((am) => (
                  <Badge key={am} variant="secondary" className="px-3 py-1 font-normal text-xs bg-slate-100 text-slate-700">
                    <Check className="size-3 text-primary mr-1" /> {am}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">Tiện nghi cơ bản (liên hệ chủ trọ để biết thêm chi tiết).</p>
            )}
          </Section>

          <Separator />

          <Section title="Bảng chi phí dự kiến">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {fees.map((f, i) => (
                <div key={i} className="rounded-xl border border-border bg-slate-50 p-3">
                  <p className="text-xs text-muted-foreground">{f.label}</p>
                  <p className="text-sm font-semibold text-charcoal mt-0.5">{f.value}</p>
                </div>
              ))}
            </div>
          </Section>

          <Separator />

          {/* Public Reviews section */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-charcoal">Đánh giá công khai ({localReviews.length})</h2>
                <p className="text-xs text-muted-foreground">
                  Phản hồi xác thực từ người thuê đã nhận phòng và ở thực tế
                </p>
              </div>
              <Button
                variant="default"
                size="sm"
                className="gap-1.5 text-xs bg-emerald-brand hover:bg-emerald-deep text-white cursor-pointer"
                onClick={handleOpenReviewModal}
              >
                <MessageSquarePlus className="size-3.5" /> Viết đánh giá phòng này
              </Button>
            </div>

            <div className="space-y-3">
              {localReviews.length > 0 ? (
                localReviews.map((rv: any, idx: number) => {
                  const reviewerName = rv.reviewerName || rv.userName || "Người thuê phòng";
                  const reviewerAvatar = rv.reviewerAvatar || rv.userAvatar || "";
                  const rvDate = rv.createdAt ? new Date(rv.createdAt).toLocaleDateString("vi-VN") : "Gần đây";

                  return (
                    <div key={rv.id || idx} className="rounded-xl ring-1 ring-border p-4 bg-card shadow-xs">
                      <div className="flex items-center gap-3">
                        <Avatar className="size-9">
                          <AvatarImage src={reviewerAvatar || undefined} />
                          <AvatarFallback className="bg-emerald-100 text-emerald-800 text-xs font-semibold">
                            {getInitials(reviewerName)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-sm font-semibold text-slate-800">{reviewerName}</p>
                            <Badge variant="secondary" className="gap-1 bg-emerald-50 text-emerald-700 border-emerald-200 text-[11px]">
                              <Check className="size-3" /> Đã ở thực tế
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">{rvDate}</p>
                        </div>
                        <StarRating value={rv.rating || 5} />
                      </div>

                      {rv.tags && Array.isArray(rv.tags) && rv.tags.length > 0 && (
                        <div className="mt-2.5 flex flex-wrap gap-1.5">
                          {rv.tags.map((t: string) => (
                            <Badge key={t} variant="outline" className="text-[11px] font-normal">
                              {t}
                            </Badge>
                          ))}
                        </div>
                      )}

                      <p className="mt-2.5 text-sm text-slate-700 leading-relaxed">{rv.comment}</p>

                      {rv.replyComment && (
                        <div className="mt-3 rounded-lg bg-slate-50 p-2.5 border-l-2 border-primary text-xs text-slate-600">
                          <span className="font-semibold text-slate-800">Chủ trọ phản hồi: </span>
                          {rv.replyComment}
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">
                  Chưa có đánh giá nào cho phòng này từ người thuê đã nhận phòng thực tế.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4 lg:sticky lg:top-20 lg:self-start">
          <div className="rounded-2xl bg-card p-5 shadow-xs ring-1 ring-border">
            <p className="text-primary font-bold">
              <span className="text-2xl">{formatVND(price)}</span>
              <span className="text-sm text-muted-foreground font-normal">/tháng</span>
            </p>

            <Button
              className="mt-4 w-full gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold cursor-pointer shadow-sm hover-lift"
              onClick={handleOpenRentModal}
            >
              <KeyRound className="size-4" /> Đăng ký thuê phòng này
            </Button>

            <Button
              variant="outline"
              className="mt-2 w-full gap-2 cursor-pointer font-medium"
              onClick={() => {
                if (!user) {
                  toast.error("Vui lòng đăng nhập để nhắn tin với chủ trọ.");
                  navigate("/login");
                  return;
                }
                const pId = (detailRoom as any)?.landlordId || (detailRoom as any)?.landlord?.id || (landlord as any)?.id;
                navigate(`/chat?room=${id}${pId ? `&partnerId=${pId}` : ""}`);
              }}
            >
              <MessageCircle className="size-4 text-emerald-600" /> Liên hệ chủ trọ
            </Button>

            <Button
              variant="outline"
              className={`mt-2 w-full gap-2 cursor-pointer ${isSaved ? "text-destructive border-destructive" : ""}`}
              onClick={handleToggleSave}
            >
              <Heart className={`size-4 ${isSaved ? "fill-destructive text-destructive" : ""}`} />
              {isSaved ? "Đã lưu phòng" : "Lưu phòng"}
            </Button>

            <Button
              variant="outline"
              className="mt-2 w-full gap-2 cursor-pointer border-border hover:border-primary/50 text-foreground hover:bg-slate-50 text-sm font-medium"
              onClick={() => navigate(`/compare?ids=${id}`)}
            >
              <ArrowLeftRight className="size-4 text-primary" /> So sánh với phòng khác
            </Button>

            <Separator className="my-3" />

            {/* Direct Report Button to Admin */}
            <Button
              variant="ghost"
              className="w-full gap-1.5 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 cursor-pointer"
              onClick={() => setIsReportOpen(true)}
            >
              <ShieldAlert className="size-3.5" /> Báo cáo phòng vi phạm / lừa đảo
            </Button>
          </div>

          {/* Landlord Card */}
          <div className="rounded-2xl bg-card p-5 ring-1 ring-border shadow-xs">
            <p className="mb-3 text-xs text-muted-foreground font-medium uppercase tracking-wider">Thông tin chủ trọ</p>
            <div className="flex items-center gap-3">
              <Avatar className="size-12">
                <AvatarImage src={landlord.avatar || undefined} />
                <AvatarFallback className="bg-emerald-100 text-emerald-800 font-bold">
                  {getInitials(landlord.name)}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="flex items-center gap-1 font-semibold text-charcoal">
                  {landlord.name}
                  {landlord.verified && <ShieldCheck className="size-4 text-primary" />}
                </p>
                <p className="inline-flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                  <Star className="size-3 fill-amber-400 text-amber-400" /> Điểm uy tín: {landlord.rating}/5.0
                </p>
              </div>
            </div>
            <Separator className="my-4" />
            <Button variant="outline" className="w-full text-xs" onClick={() => navigate(`/chat?room=${id}`)}>
              Nhắn tin trực tiếp
            </Button>
          </div>
        </div>
      </div>

      {/* 1. Public Review Modal (Community Channel) */}
      <Dialog open={isReviewOpen} onOpenChange={setIsReviewOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-charcoal">
              <Star className="size-5 text-amber-400 fill-amber-400" /> Đánh giá phòng trọ (Người thuê thực tế)
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Đánh giá của bạn dựa trên hợp đồng thuê đã nhận phòng thực tế, giúp đảm bảo tính minh bạch và khách quan.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <p className="text-xs font-semibold text-slate-700 mb-1.5">Chấm điểm thực tế</p>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setReviewRating(s)}
                    className="cursor-pointer transition-transform hover:scale-110"
                  >
                    <Star
                      className={cn(
                        "size-7",
                        s <= reviewRating
                          ? "fill-amber-400 text-amber-400"
                          : "fill-slate-200 text-slate-200"
                      )}
                    />
                  </button>
                ))}
                <span className="text-sm font-bold text-slate-700 ml-2">
                  {reviewRating === 5 && "Rất tốt (5 sao)"}
                  {reviewRating === 4 && "Tốt (4 sao)"}
                  {reviewRating === 3 && "Bình thường (3 sao)"}
                  {reviewRating === 2 && "Kém (2 sao)"}
                  {reviewRating === 1 && "Rất tệ (1 sao)"}
                </span>
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-slate-700 mb-1.5">Đặc điểm nhận xét nhanh</p>
              <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto">
                {reviewTagOptions.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleReviewTag(tag)}
                    className={cn(
                      "rounded-full border px-2.5 py-1 text-xs transition cursor-pointer font-medium",
                      reviewTags.includes(tag)
                        ? "border-primary bg-mint text-primary"
                        : "border-border text-muted-foreground hover:border-slate-300"
                    )}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-slate-700 mb-1.5">Chia sẻ chi tiết trải nghiệm</p>
              <Textarea
                className="text-sm resize-none"
                rows={4}
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                placeholder="Chia sẻ trải nghiệm khi đến xem phòng hoặc thời gian ở (ví dụ: phòng đúng như hình, chủ trọ nhiệt tình, hay có chi phí phát sinh bất thường...)"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setIsReviewOpen(false)}>
              Hủy
            </Button>
            <Button
              className="bg-emerald-brand hover:bg-emerald-deep text-white"
              onClick={handleSendPublicReview}
              disabled={isSubmittingReview}
            >
              {isSubmittingReview ? "Đang gửi..." : "Đăng đánh giá công khai"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 2. Community Report Modal (Admin Moderation Channel) */}
      <Dialog open={isReportOpen} onOpenChange={setIsReportOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-rose-600">
              <AlertTriangle className="size-5" /> Báo cáo phòng trọ vi phạm
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              PhongTroXanh cam kết xử lý nghiêm minh các tin đăng lừa đảo, giả mạo để bảo vệ quyền lợi sinh viên và người tìm trọ.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <label className="text-xs font-semibold text-slate-700">Lý do báo cáo</label>
              <select
                className="mt-1.5 w-full rounded-lg border border-border bg-background p-2 text-sm text-foreground"
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
              >
                <option value="TIN_GIA">Tin giả / Không có thật hoặc địa chỉ ảo</option>
                <option value="LUA_COC">Đòi cọc bất thường / Có dấu hiệu lừa đảo tiền</option>
                <option value="KHAC_ANH">Phòng bẩn, xuống cấp khác xa với hình ảnh đăng</option>
                <option value="QUAY_ROI">Chủ trọ có thái độ bất lịch sự, đe dọa hoặc quấy rối</option>
                <option value="VI_PHAM_KHAC">Hành vi vi phạm quy chuẩn khác</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700">Mô tả chi tiết sự việc</label>
              <Textarea
                className="mt-1.5 text-sm resize-none"
                rows={4}
                value={reportDetail}
                onChange={(e) => setReportDetail(e.target.value)}
                placeholder="Vui lòng nêu rõ chi tiết bạn gặp phải (ví dụ: đến xem thì báo giá khác, yêu cầu chuyển cọc trước khi xem phòng...)"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setIsReportOpen(false)}>
              Hủy
            </Button>
            <Button
              className="bg-rose-600 hover:bg-rose-700 text-white gap-1.5"
              onClick={handleSendReport}
              disabled={isSubmittingReport}
            >
              {isSubmittingReport ? "Đang gửi..." : "Gửi báo cáo"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 3. Rent Booking Modal (Connects room to 'Phòng của tôi') */}
      <Dialog open={isRentModalOpen} onOpenChange={setIsRentModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-foreground">
              <KeyRound className="size-5 text-emerald-600" />
              Đăng ký thuê phòng
            </DialogTitle>
            <DialogDescription>
              Gửi yêu cầu thuê phòng tới chủ trọ. Khi gửi thành công, phòng sẽ được lưu vào mục <strong>Phòng của tôi</strong> để bạn theo dõi hợp đồng và thanh toán cọc.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleConfirmRent} className="space-y-4 py-2">
            <div className="rounded-xl border border-border bg-slate-50/70 p-3 space-y-1">
              <p className="text-sm font-semibold text-slate-800 line-clamp-1">{title}</p>
              <p className="text-xs text-muted-foreground">{district}, TP.HCM</p>
              <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 mt-1">
                <span className="text-xs text-slate-600">Giá thuê:</span>
                <span className="text-sm font-bold text-emerald-600">{formatVND(price)}/tháng</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-700">Ngày bắt đầu ở</label>
                <input
                  type="date"
                  required
                  className="mt-1 w-full rounded-lg border border-border bg-background p-2 text-sm text-foreground"
                  value={rentStartDate}
                  onChange={(e) => setRentStartDate(e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700">Thời hạn dự kiến</label>
                <input
                  type="date"
                  required
                  className="mt-1 w-full rounded-lg border border-border bg-background p-2 text-sm text-foreground"
                  value={rentEndDate}
                  onChange={(e) => setRentEndDate(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700">Lời nhắn gửi chủ trọ</label>
              <Textarea
                className="mt-1.5 text-sm resize-none"
                rows={3}
                value={rentMessage}
                onChange={(e) => setRentMessage(e.target.value)}
                placeholder="Ví dụ: Em là sinh viên năm 3, dự kiến chuyển vào đầu tháng sau..."
              />
            </div>

            <DialogFooter className="gap-2 sm:gap-0 pt-2">
              <Button type="button" variant="outline" onClick={() => setIsRentModalOpen(false)}>
                Hủy
              </Button>
              <Button
                type="submit"
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold cursor-pointer"
                disabled={isSubmittingRent}
              >
                {isSubmittingRent ? "Đang gửi..." : "Xác nhận gửi yêu cầu"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Interactive Image Lightbox Zoom Modal */}
      {lightboxIndex !== null && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-150"
          onClick={() => setLightboxIndex(null)}
        >
          <button
            type="button"
            onClick={() => setLightboxIndex(null)}
            className="absolute right-5 top-5 z-50 rounded-full bg-white/10 hover:bg-white/20 p-2.5 text-white transition cursor-pointer"
            title="Đóng (Esc)"
          >
            <X className="size-6" />
          </button>

          {/* Prev Button */}
          {images.length > 1 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setLightboxIndex((prev) => (prev !== null ? (prev - 1 + images.length) % images.length : 0));
              }}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-50 rounded-full bg-white/10 hover:bg-white/25 p-3 text-white transition cursor-pointer"
              title="Ảnh trước"
            >
              <ChevronLeft className="size-6" />
            </button>
          )}

          {/* Next Button */}
          {images.length > 1 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setLightboxIndex((prev) => (prev !== null ? (prev + 1) % images.length : 0));
              }}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-50 rounded-full bg-white/10 hover:bg-white/25 p-3 text-white transition cursor-pointer"
              title="Ảnh tiếp theo"
            >
              <ChevronRight className="size-6" />
            </button>
          )}

          {/* Central Image Container */}
          <div 
            className="flex flex-col items-center justify-center max-w-5xl max-h-[90vh] w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={images[lightboxIndex]}
              alt={`Phòng trọ ảnh ${lightboxIndex + 1}`}
              className="max-h-[75vh] max-w-full rounded-2xl object-contain shadow-2xl transition-all select-none"
            />
            <div className="mt-3 flex items-center gap-3 text-white/90 text-xs font-semibold">
              <span>Ảnh {lightboxIndex + 1} / {images.length}</span>
            </div>

            {/* Bottom Thumbnails */}
            {images.length > 1 && (
              <div className="mt-3 flex gap-2 overflow-x-auto max-w-full py-1.5 px-2">
                {images.map((thumb, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setLightboxIndex(idx)}
                    className={cn(
                      "size-12 rounded-lg overflow-hidden border-2 transition shrink-0 cursor-pointer",
                      idx === lightboxIndex ? "border-primary scale-105 shadow-md" : "border-white/20 opacity-60 hover:opacity-100"
                    )}
                  >
                    <img src={thumb} alt="" className="size-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="mb-3 text-base font-bold text-charcoal">{title}</h2>
      {children}
    </div>
  );
}
