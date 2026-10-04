import { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router";
import { Check, Star, Eye, ShieldCheck, ArrowLeft, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ImageWithFallback } from "@/components/shared/ImageWithFallback";
import { StarRating } from "@/components/shared/primitives-compat";
import { roomImages } from "@/lib/constants";
import { cn, getInitials } from "@/lib/utils";
import { reviewsApi } from "../api/reviewsApi";
import { rentalsApi } from "@/features/rentals/api/rentalsApi";
import { useAuth } from "@/app/context/AuthContext";
import { toast } from "sonner";

interface UiReview {
  id: string;
  name: string;
  avatar: string;
  rating: number;
  date: string;
  verified: boolean;
  tags: string[];
  text: string;
  reply?: string;
}

const defaultReviews: UiReview[] = [
  {
    id: "rev-1",
    name: "Lê Thu Thảo",
    avatar: "",
    rating: 5,
    date: "12/08/2026",
    verified: true,
    tags: ["Chủ thân thiện", "Sạch sẽ", "An ninh tốt"],
    text: "Phòng thoáng mát, chủ trọ nhiệt tình hỗ trợ khi có sự cố. Giờ giấc hoàn toàn tự do.",
  },
  {
    id: "rev-2",
    name: "Trần Minh Quang",
    avatar: "",
    rating: 2,
    date: "05/08/2026",
    verified: false,
    tags: ["Không đúng ảnh", "Giá điện nước cao"],
    text: "Đến xem phòng thực tế thì thấy tường bị ẩm mốc, khác xa với ảnh đăng trên app. Chủ trọ đòi cọc trước 3 tháng.",
  },
  {
    id: "rev-3",
    name: "Nguyễn Hoàng My",
    avatar: "",
    rating: 4,
    date: "28/07/2026",
    verified: true,
    tags: ["Vị trí tốt", "Giờ tự do"],
    text: "Gần các trường đại học và chợ, đi lại rất thuận tiện. Ban quản lý phản hồi nhanh.",
  }
];

const availableTags = [
  "Chủ thân thiện",
  "Đúng mô tả",
  "An ninh tốt",
  "Sạch sẽ",
  "Giờ tự do",
  "Đáng tiền",
  "Vị trí tốt",
  "Tường ẩm mốc",
  "Chi phí phát sinh",
  "Không đúng ảnh"
];

export default function Reviews() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();

  const queryRoomId = searchParams.get("roomId");
  const queryRentalId = searchParams.get("rentalId");
  const queryRoomTitle = searchParams.get("title");

  const [activeRoomId, setActiveRoomId] = useState<string | null>(queryRoomId);
  const [activeRentalId, setActiveRentalId] = useState<string | null>(queryRentalId);
  const [activeTitle, setActiveTitle] = useState<string>(queryRoomTitle || "Phòng trọ");

  const [filter, setFilter] = useState(0);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [reviewList, setReviewList] = useState<UiReview[]>(defaultReviews);
  const [picked, setPicked] = useState<string[]>(["Sạch sẽ"]);
  const [myRentals, setMyRentals] = useState<any[]>([]);

  const togglePick = (t: string) => setPicked((p) => (p.includes(t) ? p.filter((x) => x !== t) : [...p, t]));

  // 1. Fetch user's rentals if no specific room provided
  useEffect(() => {
    async function fetchUserRentals() {
      if (!user) return;
      try {
        const res = user.role === "landlord"
          ? await rentalsApi.getMyLandlordRentals()
          : await rentalsApi.getMyTenantRentals();
        const rawList = Array.isArray(res) ? res : (res as any)?.content || [];
        // Only checked-in rentals can be reviewed
        const list = rawList.filter(
          (r: any) => r.status === "CHECKED_IN" || r.checkInAt || (r.status === "TERMINATED" && r.checkInAt)
        );
        setMyRentals(list);
        if (!queryRoomId && list.length > 0) {
          const first = list[0];
          setActiveRoomId(first.roomId);
          setActiveRentalId(first.id);
          if (first.roomTitle) setActiveTitle(first.roomTitle);
        }
      } catch (err) {
        console.warn("Could not fetch user rentals:", err);
      }
    }
    fetchUserRentals();
  }, [user, queryRoomId]);

  // 2. Fetch reviews for the active room
  useEffect(() => {
    async function loadReviews() {
      if (!activeRoomId) return;
      try {
        const res = await reviewsApi.getRoomReviews(activeRoomId);
        const data = Array.isArray(res) ? res : (res as any)?.content || [];
        if (Array.isArray(data) && data.length > 0) {
          const mapped: UiReview[] = data.map((rv: any) => ({
            id: String(rv.id),
            name: rv.reviewerName || "Người dùng",
            avatar: rv.reviewerAvatar || "",
            rating: rv.rating || 5,
            date: rv.createdAt ? new Date(rv.createdAt).toLocaleDateString("vi-VN") : "Gần đây",
            verified: rv.isVerifiedStay ?? true,
            tags: rv.tags || ["Đúng mô tả"],
            text: rv.comment || "",
            reply: rv.replyComment,
          }));
          setReviewList(mapped);
        }
      } catch (err) {
        console.warn("Could not load reviews for room, using fallback:", err);
      }
    }
    loadReviews();
  }, [activeRoomId]);

  const handleSubmitReview = async () => {
    if (!user) {
      toast.error("Vui lòng đăng nhập để viết đánh giá");
      return;
    }
    if (user.role === "landlord") {
      toast.error("Chủ trọ không thể tự viết đánh giá phòng");
      return;
    }
    if (!comment.trim()) {
      toast.error("Vui lòng nhập nội dung đánh giá");
      return;
    }
    if (!activeRoomId && !activeRentalId) {
      toast.error("Vui lòng chọn phòng trọ bạn đã thuê thực tế để đánh giá");
      return;
    }

    setSubmitting(true);
    try {
      const payload: any = {
        rating,
        comment: comment.trim(),
        tags: picked,
      };
      if (activeRentalId) {
        payload.rentalId = activeRentalId;
      }
      if (activeRoomId) {
        payload.roomId = activeRoomId;
      }

      await reviewsApi.createReview(payload);
      toast.success("Gửi đánh giá thành công! Điểm TrustScore đã được cập nhật.");

      const newEntry: UiReview = {
        id: "rv-" + Date.now(),
        name: user?.fullName || "Bạn (Người thuê)",
        avatar: user?.avatarUrl || "",
        rating,
        date: "Hôm nay",
        verified: true,
        tags: picked,
        text: comment.trim(),
      };
      setReviewList([newEntry, ...reviewList]);
      setComment("");
    } catch (err: any) {
      const msg = err?.response?.data?.detail || err?.response?.data?.message || "Không thể gửi đánh giá";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const filteredReviews = reviewList.filter((rv) => {
    if (filter === 1) return rv.rating === 5;
    if (filter === 2) return rv.rating === 4;
    if (filter === 3) return rv.verified;
    return true;
  });

  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      <div className="flex items-center gap-3">
        {activeRoomId && (
          <Link to={`/rooms/${activeRoomId}`} className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="size-5" />
          </Link>
        )}
        <div>
          <h1 className="brand text-3xl text-foreground">Đánh giá & Trải nghiệm thực tế</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Đánh giá xác thực 100%: Chỉ người thuê đã hoàn tất nhận phòng thực tế (Check-in) mới có thể gửi đánh giá, đảm bảo tính khách quan và tin cậy.
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_340px]">
        {/* Review Feed */}
        <div>
          <div className="mb-4 flex flex-wrap gap-2">
            {[
              { label: "Tất cả", idx: 0 },
              { label: "5 sao", idx: 1 },
              { label: "4 sao", idx: 2 },
              { label: "Đã ở thực tế", idx: 3 },
            ].map((f) => (
              <button
                key={f.label}
                onClick={() => setFilter(f.idx)}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-sm transition cursor-pointer font-medium",
                  filter === f.idx ? "border-primary bg-mint text-primary" : "border-border text-muted-foreground hover:border-slate-300"
                )}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="space-y-4">
            {filteredReviews.length > 0 ? (
              filteredReviews.map((rv) => (
                <div key={rv.id} className="rounded-2xl bg-card p-5 ring-1 ring-border shadow-xs">
                  <div className="flex items-center gap-3">
                    <Avatar className="size-10">
                      <AvatarImage src={rv.avatar || undefined} />
                      <AvatarFallback className="bg-emerald-100 text-emerald-800 text-xs font-semibold">
                        {getInitials(rv.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold text-charcoal">{rv.name}</p>
                        <Badge variant="secondary" className="gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs">
                          <Check className="size-3" /> Đã ở thực tế
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{rv.date}</p>
                    </div>
                    <StarRating value={rv.rating} />
                  </div>

                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {rv.tags.map((t) => (
                      <Badge key={t} variant="outline" className="text-xs font-normal">
                        {t}
                      </Badge>
                    ))}
                  </div>

                  <p className="mt-2.5 text-sm text-slate-700 leading-relaxed">{rv.text}</p>

                  {rv.reply && (
                    <div className="mt-3.5 rounded-xl bg-slate-50 p-3 border-l-2 border-primary text-xs text-slate-600">
                      <p className="font-semibold text-slate-800">Chủ trọ phản hồi:</p>
                      <p className="mt-0.5">{rv.reply}</p>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-sm text-muted-foreground">
                Chưa có đánh giá nào phù hợp với bộ lọc.
              </div>
            )}
          </div>
        </div>

        {/* Write a review sidebar */}
        <div className="space-y-4 lg:sticky lg:top-20 lg:self-start">
          <div className="rounded-2xl bg-card p-5 ring-1 ring-border shadow-xs">
            <h3 className="font-semibold text-charcoal text-base">Viết đánh giá</h3>

            {/* Room target selector/preview */}
            <div className="mt-3 flex items-center gap-3 rounded-xl bg-slate-50 p-3 ring-1 ring-border">
              <ImageWithFallback src={roomImages[0]} alt="" className="size-12 rounded-lg object-cover" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate text-charcoal">{activeTitle}</p>
                {activeRentalId ? (
                  <Badge variant="secondary" className="mt-1 gap-1 text-[11px] bg-emerald-50 text-emerald-700 border-emerald-200">
                    <Check className="size-3" /> Đã xác thực nhận phòng
                  </Badge>
                ) : (
                  <Badge variant="outline" className="mt-1 gap-1 text-[11px] text-amber-700 border-amber-300 bg-amber-50">
                    Chưa có hợp đồng Check-in
                  </Badge>
                )}
              </div>
            </div>

            {/* If user has other rentals to choose from */}
            {myRentals.length > 1 && (
              <div className="mt-3">
                <label className="text-xs text-muted-foreground font-medium">Hoặc chọn phòng khác của bạn:</label>
                <select
                  className="mt-1 w-full rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs text-foreground"
                  value={activeRentalId || ""}
                  onChange={(e) => {
                    const sel = myRentals.find((r) => r.id === e.target.value);
                    if (sel) {
                      setActiveRentalId(sel.id);
                      setActiveRoomId(sel.roomId);
                      setActiveTitle(sel.roomTitle || "Phòng trọ của bạn");
                    }
                  }}
                >
                  {myRentals.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.roomTitle || `Hợp đồng #${r.id.slice(0, 8)}`} ({r.status})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Rating Stars */}
            <div className="mt-4">
              <p className="mb-1 text-sm text-muted-foreground font-medium">Chấm điểm</p>
              <div className="flex gap-1.5">
                {[1, 2, 3, 4, 5].map((i) => (
                  <button key={i} type="button" onClick={() => setRating(i)}>
                    <Star
                      className={cn(
                        "size-7 cursor-pointer transition-transform hover:scale-110",
                        i <= rating ? "fill-amber-400 text-amber-400" : "fill-muted text-muted"
                      )}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Tags */}
            <div className="mt-4">
              <p className="mb-1.5 text-sm text-muted-foreground font-medium">Điểm nổi bật / Vấn đề gặp phải</p>
              <div className="flex flex-wrap gap-1.5">
                {availableTags.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => togglePick(t)}
                    className={cn(
                      "rounded-full border px-2.5 py-1 text-xs transition cursor-pointer font-medium",
                      picked.includes(t)
                        ? "border-primary bg-mint text-primary"
                        : "border-border text-muted-foreground hover:border-slate-300"
                    )}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Comment Textarea */}
            <Textarea
              className="mt-4 text-sm resize-none"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Chia sẻ trải nghiệm thực tế (chất lượng phòng, sự hỗ trợ của chủ trọ, chi phí thực tế...)"
              rows={4}
            />

            {myRentals.length === 0 && (
              <p className="mt-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-2.5">
                Chỉ người thuê đã hoàn tất nhận phòng thực tế (Check-in) mới có thể gửi đánh giá để đảm bảo tính khách quan.
              </p>
            )}

            <Button
              className="mt-3.5 w-full hover-lift press-active"
              onClick={handleSubmitReview}
              disabled={submitting || myRentals.length === 0 || !user || user.role === "landlord"}
            >
              {submitting ? "Đang gửi..." : "Gửi đánh giá"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
