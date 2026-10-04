import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { Star, Check, Users, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { rentalsApi } from "@/features/rentals/api/rentalsApi";
import { reviewsApi } from "@/features/reviews/api/reviewsApi";
import { cn, getInitials } from "@/lib/utils";

interface LandlordRentalItem {
  id: string; // rentalContractId
  name: string;
  avatar: string;
  room: string;
  checkedIn: boolean;
  reviewed: boolean;
  tenantId: string;
  roomId?: string;
}

interface ExistingReviewItem {
  id: string;
  tenant: string;
  avatar: string;
  rating: number;
  tags: string[];
  text: string;
  date: string;
}

const reviewTags = [
  "Đúng hẹn",
  "Gọn gàng",
  "Thân thiện",
  "Trả tiền đúng hạn",
  "Giữ gìn tài sản",
  "Tôn trọng hàng xóm",
];

export default function LandlordReviews() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<"write" | "history">("write");
  const [rentals, setRentals] = useState<LandlordRentalItem[]>([]);
  const [reviewsList, setReviewsList] = useState<ExistingReviewItem[]>([]);
  const [selectedRentalId, setSelectedRentalId] = useState<string | null>(null);
  const [rating, setRating] = useState(5);
  const [pickedTags, setPickedTags] = useState<string[]>([]);
  const [comment, setComment] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toggleTag = (t: string) =>
    setPickedTags((p) => (p.includes(t) ? p.filter((x) => x !== t) : [...p, t]));

  // 1. Fetch real rental contracts from Swagger API #56
  const loadData = async () => {
    setIsLoading(true);
    try {
      const data = await rentalsApi.getMyLandlordRentals();
      if (Array.isArray(data) && data.length > 0) {
        const mapped: LandlordRentalItem[] = data.map((r: any, idx: number) => ({
          id: r.id,
          name: r.tenantName || `Khách thuê #${idx + 1}`,
          avatar: r.tenantAvatar || "",
          room: r.roomTitle || r.roomAddress || "Phòng trọ",
          checkedIn: r.status === "CHECKED_IN",
          reviewed: false,
          tenantId: r.tenantId,
          roomId: r.roomId,
        }));
        setRentals(mapped);

        // Pre-select first eligible tenant
        const firstCheckedIn = mapped.find((m) => m.checkedIn);
        if (firstCheckedIn) {
          setSelectedRentalId(firstCheckedIn.id);
        }

        // Fetch room reviews if available
        const roomIds = Array.from(new Set(mapped.map((m) => m.roomId).filter(Boolean)));
        let fetchedReviews: ExistingReviewItem[] = [];
        for (const roomId of roomIds) {
          try {
            const revs = await reviewsApi.getRoomReviews(roomId as string);
            if (Array.isArray(revs)) {
              for (const rv of revs) {
                fetchedReviews.push({
                  id: rv.id,
                  tenant: rv.reviewerName || "Khách thuê",
                  avatar: rv.reviewerAvatar || "",
                  rating: rv.rating,
                  tags: rv.tags || ["Đúng hẹn", "Gọn gàng"],
                  text: rv.comment || "",
                  date: rv.createdAt
                    ? new Date(rv.createdAt).toLocaleDateString("vi-VN")
                    : "Gần đây",
                });
              }
            }
          } catch {
            // continue
          }
        }
        if (fetchedReviews.length > 0) {
          setReviewsList(fetchedReviews);
        }
      }
    } catch (err) {
      console.warn("Could not load /rentals/landlord/me:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const eligibleRentals = rentals.filter((t) => t.checkedIn);

  // 2. Submit real review to Swagger API #60 POST /api/v1/reviews
  const handleSubmitReview = async () => {
    if (!selectedRentalId) {
      toast.error("Vui lòng chọn người thuê cần đánh giá");
      return;
    }
    if (!comment.trim()) {
      toast.error("Vui lòng nhập lời nhận xét");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        rentalId: selectedRentalId,
        rating: rating,
        cleanlinessRating: rating,
        accuracyRating: rating,
        communicationRating: rating,
        tags: pickedTags,
        comment: comment.trim(),
      };

      await reviewsApi.createReview(payload);
      toast.success("Đã gửi đánh giá thành công lên hệ thống!");

      // Reset form
      setComment("");
      setPickedTags([]);

      // Reload real data
      await loadData();
      setTab("history");
    } catch (err: any) {
      toast.error(err.message || "Gửi đánh giá thất bại. Vui lòng thử lại.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="brand text-2xl text-foreground flex items-center gap-2">
            Đánh giá người thuê
          </h1>
          <p className="text-sm text-muted-foreground">
            Đánh giá 2 chiều minh bạch và xác thực trực tiếp giữa chủ trọ và người thuê
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setTab("write")}
            className={cn(
              "rounded-xl px-4 py-2.5 text-sm font-medium transition cursor-pointer",
              tab === "write"
                ? "bg-mint text-primary font-bold shadow-2xs"
                : "text-muted-foreground hover:bg-secondary"
            )}
          >
            Viết đánh giá
          </button>
          <button
            onClick={() => setTab("history")}
            className={cn(
              "rounded-xl px-4 py-2.5 text-sm font-medium transition cursor-pointer",
              tab === "history"
                ? "bg-mint text-primary font-bold shadow-2xs"
                : "text-muted-foreground hover:bg-secondary"
            )}
          >
            Đã đánh giá ({reviewsList.length})
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="size-8 animate-spin text-primary" />
          <span className="ml-2 text-sm text-muted-foreground">Đang tải danh sách từ máy chủ...</span>
        </div>
      ) : tab === "write" ? (
        <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
          <div className="space-y-4">
            <div className="rounded-2xl bg-card p-5 ring-1 ring-border">
              <h2 className="flex items-center gap-2 text-lg font-semibold">
                <Users className="size-5 text-primary" /> Chọn người thuê từ hợp đồng
              </h2>

              {rentals.length === 0 ? (
                <div className="mt-4 p-6 text-center rounded-xl bg-slate-50 border border-dashed border-slate-200">
                  <p className="text-sm text-muted-foreground">
                    Chưa có hợp đồng thuê phòng nào được ghi nhận cho tài khoản của bạn.
                  </p>
                  <Button
                    variant="outline"
                    className="mt-3"
                    onClick={() => navigate("/landlord?tab=post-room")}
                  >
                    Đăng thêm phòng mới
                  </Button>
                </div>
              ) : (
                <div className="mt-3 space-y-2">
                  {eligibleRentals.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setSelectedRentalId(t.id)}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-xl border-2 p-3 text-left transition cursor-pointer",
                        selectedRentalId === t.id
                          ? "border-primary bg-emerald-50/60 shadow-2xs"
                          : "border-border hover:border-primary/40 bg-card"
                      )}
                    >
                      <Avatar className="size-10 ring-1 ring-border">
                        <AvatarImage src={t.avatar || undefined} />
                        <AvatarFallback className="bg-emerald-100 text-emerald-800 text-xs font-semibold">{getInitials(t.name)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-foreground">{t.name}</p>
                        <p className="text-xs text-muted-foreground line-clamp-1">{t.room}</p>
                      </div>
                      <Badge variant="secondary" className="gap-1 bg-emerald-100/60 text-emerald-800">
                        <Check className="size-3" /> Đã nhận phòng
                      </Badge>
                    </button>
                  ))}

                  {rentals
                    .filter((t) => !t.checkedIn)
                    .map((t) => (
                      <div
                        key={t.id}
                        className="flex items-center gap-3 rounded-xl border border-border p-3 opacity-60 bg-muted/20"
                      >
                        <Avatar className="size-10">
                          <AvatarImage src={t.avatar} />
                          <AvatarFallback>{t.name[0]}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="text-sm font-medium">{t.name}</p>
                          <p className="text-xs text-muted-foreground line-clamp-1">{t.room}</p>
                        </div>
                        <Badge variant="outline" className="text-amber-700 border-amber-300">
                          Chờ bàn giao
                        </Badge>
                      </div>
                    ))}
                </div>
              )}
            </div>

            {selectedRentalId && (
              <div className="rounded-2xl bg-card p-5 ring-1 ring-border space-y-4">
                <h2 className="text-lg font-semibold">Nội dung đánh giá</h2>

                <div>
                  <p className="mb-2 text-sm text-muted-foreground font-medium">Chấm điểm sao</p>
                  <div className="flex gap-1.5">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setRating(i)}
                        className="cursor-pointer hover:scale-110 transition-transform p-1"
                      >
                        <Star
                          className={cn(
                            "size-7",
                            i <= rating
                              ? "fill-amber-400 text-amber-400"
                              : "fill-muted text-muted"
                          )}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="mb-2 text-sm text-muted-foreground font-medium">Điểm nổi bật</p>
                  <div className="flex flex-wrap gap-2">
                    {reviewTags.map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => toggleTag(t)}
                        className={cn(
                          "rounded-full border px-3 py-1.5 text-xs font-medium transition cursor-pointer",
                          pickedTags.includes(t)
                            ? "border-primary bg-primary text-white shadow-2xs"
                            : "border-border text-muted-foreground hover:border-primary/50 hover:bg-muted"
                        )}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="mb-2 text-sm text-muted-foreground font-medium">Nhận xét chi tiết</p>
                  <Textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Nhận xét về lối sống, sự trung thực, thanh toán và giữ gìn phòng của người thuê..."
                    rows={4}
                    className="rounded-xl border-border"
                  />
                </div>

                <Button
                  onClick={handleSubmitReview}
                  disabled={isSubmitting}
                  className="w-full gap-2 rounded-xl py-2.5 font-bold cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Đang đồng bộ API...
                    </>
                  ) : (
                    <>
                      <Sparkles className="size-4" />
                      Gửi đánh giá lên máy chủ
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>

          <div className="space-y-4 lg:sticky lg:top-20 lg:self-start">
            <div className="rounded-2xl bg-emerald-50/50 border border-emerald-100 p-5">
              <h3 className="font-semibold text-emerald-900 flex items-center gap-1.5">
                <Sparkles className="size-4 text-emerald-600" /> Lưu ý khi đánh giá
              </h3>
              <ul className="mt-3 space-y-2 text-xs text-emerald-800/90 leading-relaxed">
                <li>• Chủ trọ đánh giá người thuê đang hoặc đã thuê phòng của mình.</li>
                <li>• Đánh giá trung thực giúp cộng đồng tin cậy hơn và tạo uy tín cao.</li>
                <li>• Điểm đánh giá sẽ trực tiếp tính vào thuật toán TrustScore của người thuê.</li>
              </ul>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {reviewsList.length === 0 ? (
            <div className="p-12 text-center rounded-2xl bg-card border border-dashed border-border">
              <p className="text-muted-foreground">Chưa có đánh giá nào được gửi trước đó.</p>
            </div>
          ) : (
            reviewsList.map((rv) => (
              <div key={rv.id} className="rounded-2xl bg-card p-5 ring-1 ring-border shadow-2xs">
                <div className="flex items-center gap-3">
                  <Avatar className="size-10 ring-1 ring-border">
                    <AvatarImage src={rv.avatar || undefined} />
                    <AvatarFallback className="bg-emerald-100 text-emerald-800 text-xs font-semibold">{getInitials(rv.tenant)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="text-sm font-semibold">{rv.tenant}</p>
                    <p className="text-xs text-muted-foreground">{rv.date}</p>
                  </div>
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Star
                        key={i}
                        className={cn(
                          "size-4",
                          i <= rv.rating
                            ? "fill-amber-400 text-amber-400"
                            : "fill-muted text-muted"
                        )}
                      />
                    ))}
                  </div>
                </div>
                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  {rv.tags.map((t) => (
                    <Badge key={t} variant="outline" className="text-[11px] font-normal">
                      {t}
                    </Badge>
                  ))}
                </div>
                <p className="mt-2.5 text-sm text-foreground/90 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                  {rv.text}
                </p>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
