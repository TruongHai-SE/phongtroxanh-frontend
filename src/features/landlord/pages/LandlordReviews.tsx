import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router";
import { Star, Check, Users, Loader2, Sparkles, MessageSquare, Flag, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { rentalsApi } from "@/features/rentals/api/rentalsApi";
import { reviewsApi } from "@/features/reviews/api/reviewsApi";
import { useAuth } from "@/app/context/AuthContext";
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
  reviewerId?: string;
  isByLandlord: boolean;
  tenant: string;
  avatar: string;
  roomName?: string;
  rating: number;
  tags: string[];
  text: string;
  date: string;
  landlordReply?: string;
  repliedAt?: string;
  isDisputed?: boolean;
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
  const { user } = useAuth();
  const [tab, setTab] = useState<"write" | "history">("write");
  const [rentals, setRentals] = useState<LandlordRentalItem[]>([]);
  const [reviewsList, setReviewsList] = useState<ExistingReviewItem[]>([]);
  const [selectedRentalId, setSelectedRentalId] = useState<string | null>(null);
  const [rating, setRating] = useState(5);
  const [pickedTags, setPickedTags] = useState<string[]>([]);
  const [comment, setComment] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reply to tenant review dialog
  const [replyingReview, setReplyingReview] = useState<ExistingReviewItem | null>(null);
  const [replyText, setReplyText] = useState("");
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);

  // Dispute unfair review dialog (#63 POST /reviews/{id}/dispute)
  const [disputingReview, setDisputingReview] = useState<ExistingReviewItem | null>(null);
  const [disputeReason, setDisputeReason] = useState("");
  const [isSubmittingDispute, setIsSubmittingDispute] = useState(false);

  const toggleTag = (t: string) =>
    setPickedTags((p) => (p.includes(t) ? p.filter((x) => x !== t) : [...p, t]));

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await rentalsApi.getMyLandlordRentals();
      if (Array.isArray(data) && data.length > 0) {
        const roomMap = new Map<string, string>();
        data.forEach((r: any) => {
          if (r.roomId) roomMap.set(String(r.roomId), r.roomTitle || "Phòng trọ");
        });

        const roomIds = Array.from(new Set(data.map((m: any) => m.roomId).filter(Boolean)));
        const fetchedReviews: ExistingReviewItem[] = [];
        const landlordReviewedTenantIds = new Set<string>();

        const reviewResults = await Promise.all(
          roomIds.map(async (roomId) => {
            try {
              const revs = await reviewsApi.getRoomReviews(String(roomId));
              return { roomId, revs: Array.isArray(revs) ? revs : [] };
            } catch {
              return { roomId, revs: [] };
            }
          })
        );

        for (const { roomId, revs } of reviewResults) {
          for (const rv of revs) {
            const isByLandlord = Boolean(user?.id && String(rv.reviewerId) === String(user.id));
            if (isByLandlord && (rv as any).revieweeId) {
              landlordReviewedTenantIds.add(String((rv as any).revieweeId));
            }
            fetchedReviews.push({
              id: String(rv.id),
              reviewerId: rv.reviewerId ? String(rv.reviewerId) : undefined,
              isByLandlord,
              tenant: rv.reviewerName || (isByLandlord ? "Đánh giá của bạn" : "Khách thuê"),
              avatar: rv.reviewerAvatar || "",
              roomName: roomMap.get(String(roomId)) || "Phòng trọ",
              rating: rv.rating,
              tags: rv.tags || [],
              text: rv.comment || "",
              landlordReply: rv.replyComment || (rv as any).landlordReply,
              repliedAt: rv.repliedAt,
              isDisputed: Boolean((rv as any).isDisputed),
              date: rv.createdAt
                ? new Date(rv.createdAt).toLocaleDateString("vi-VN")
                : "Gần đây",
            });
          }
        }

        const mapped: LandlordRentalItem[] = data.map((r: any, idx: number) => ({
          id: String(r.id),
          name: r.tenantName || `Khách thuê #${idx + 1}`,
          avatar: r.tenantAvatar || "",
          room: r.roomTitle || r.roomAddress || "Phòng trọ",
          checkedIn: r.status === "CHECKED_IN" || r.status === "TERMINATED",
          reviewed: landlordReviewedTenantIds.has(String(r.tenantId)),
          tenantId: String(r.tenantId || ""),
          roomId: r.roomId ? String(r.roomId) : undefined,
        }));

        setRentals(mapped);
        setReviewsList(fetchedReviews);

        const firstEligible = mapped.find((m) => m.checkedIn && !m.reviewed) || mapped.find((m) => m.checkedIn);
        if (firstEligible && !selectedRentalId) {
          setSelectedRentalId(firstEligible.id);
        }
      } else {
        setRentals([]);
      }
    } catch (err) {
      console.warn("Could not load /rentals/landlord/me:", err);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, selectedRentalId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const eligibleRentals = rentals.filter((t) => t.checkedIn);

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
        rating,
        cleanlinessRating: rating,
        accuracyRating: rating,
        communicationRating: rating,
        tags: pickedTags,
        comment: comment.trim(),
      };

      await reviewsApi.createReview(payload);
      toast.success("Đã gửi đánh giá khách thuê thành công!");
      setComment("");
      setPickedTags([]);
      await loadData();
      setTab("history");
    } catch (err: any) {
      const msg = err?.response?.data?.detail || err?.response?.data?.message || err?.message;
      toast.error(msg || "Gửi đánh giá thất bại. Vui lòng thử lại.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendReply = async () => {
    if (!replyingReview) return;
    if (!replyText.trim()) {
      toast.error("Vui lòng nhập nội dung phản hồi");
      return;
    }

    setIsSubmittingReply(true);
    try {
      await reviewsApi.replyReview(replyingReview.id, { reply: replyText.trim() });
      toast.success("Đã gửi phản hồi công khai thành công!");
      setReplyingReview(null);
      setReplyText("");
      await loadData();
    } catch (err: any) {
      const msg = err?.response?.data?.detail || err?.response?.data?.message || err?.message;
      toast.error(msg || "Gửi phản hồi thất bại. Vui lòng thử lại.");
    } finally {
      setIsSubmittingReply(false);
    }
  };

  const handleSendDispute = async () => {
    if (!disputingReview) return;
    if (disputeReason.trim().length < 15) {
      toast.error("Vui lòng nêu rõ lý do khiếu nại đánh giá sai sự thật (tối thiểu 15 ký tự).");
      return;
    }

    setIsSubmittingDispute(true);
    try {
      await reviewsApi.submitDispute(disputingReview.id, {
        reason: disputeReason.trim(),
      });
      toast.success("Đã gửi khiếu nại đánh giá tới Ban Quản Trị để thẩm định!");
      setDisputingReview(null);
      setDisputeReason("");
      await loadData();
    } catch (err: any) {
      const msg = err?.response?.data?.detail || err?.response?.data?.message || err?.message;
      toast.error(msg || "Không thể gửi khiếu nại đánh giá.");
    } finally {
      setIsSubmittingDispute(false);
    }
  };

  return (
    <div className="space-y-6">
      <div data-tour="landlord-reviews-tabs" className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="brand text-2xl text-foreground flex items-center gap-2">
            Đánh giá 2 chiều & Phản hồi khách thuê
          </h1>
          <p className="text-sm text-muted-foreground">
            Đánh giá người thuê thực tế, phản hồi công khai nhận xét của khách và khiếu nại đánh giá sai sự thật
          </p>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
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
            type="button"
            onClick={() => setTab("history")}
            className={cn(
              "rounded-xl px-4 py-2.5 text-sm font-medium transition cursor-pointer",
              tab === "history"
                ? "bg-mint text-primary font-bold shadow-2xs"
                : "text-muted-foreground hover:bg-secondary"
            )}
          >
            Lịch sử & Phản hồi ({reviewsList.length})
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
                    className="mt-3 cursor-pointer"
                    onClick={() => navigate("/landlord?tab=post")}
                  >
                    Đăng thêm phòng mới
                  </Button>
                </div>
              ) : (
                <div className="mt-3 space-y-2">
                  {eligibleRentals.map((t) => (
                    <button
                      key={t.id}
                      type="button"
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
                        <AvatarFallback className="bg-emerald-100 text-emerald-800 text-xs font-semibold">
                          {getInitials(t.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">{t.name}</p>
                        <p className="text-xs text-muted-foreground line-clamp-1">{t.room}</p>
                      </div>
                      {t.reviewed ? (
                        <Badge variant="secondary" className="gap-1 bg-blue-100/70 text-blue-800">
                          <Check className="size-3" /> Đã đánh giá
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="gap-1 bg-emerald-100/60 text-emerald-800">
                          <Check className="size-3" /> Đủ điều kiện
                        </Badge>
                      )}
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
                          <AvatarFallback>{getInitials(t.name)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{t.name}</p>
                          <p className="text-xs text-muted-foreground line-clamp-1">{t.room}</p>
                        </div>
                        <Badge variant="outline" className="text-amber-700 border-amber-300">
                          Chờ nhận phòng
                        </Badge>
                      </div>
                    ))}
                </div>
              )}
            </div>

            {selectedRentalId && (
              <div className="rounded-2xl bg-card p-5 ring-1 ring-border space-y-4">
                <h2 className="text-lg font-semibold">Nội dung đánh giá khách thuê</h2>

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
                            i <= rating ? "fill-amber-400 text-amber-400" : "fill-muted text-muted"
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
                    placeholder="Nhận xét về lối sống, sự trung thực, thanh toán đúng hạn và giữ gìn phòng của người thuê..."
                    rows={4}
                    className="rounded-xl border-border"
                  />
                </div>

                <Button
                  type="button"
                  onClick={handleSubmitReview}
                  disabled={isSubmitting}
                  className="w-full gap-2 rounded-xl py-2.5 font-bold cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Đang gửi đánh giá...
                    </>
                  ) : (
                    <>
                      <Sparkles className="size-4" />
                      Gửi đánh giá khách thuê
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>

          <div className="space-y-4 lg:sticky lg:top-20 lg:self-start">
            <div className="rounded-2xl bg-emerald-50/50 border border-emerald-100 p-5">
              <h3 className="font-semibold text-emerald-900 flex items-center gap-1.5">
                <Sparkles className="size-4 text-emerald-600" /> Quy tắc đánh giá 2 chiều
              </h3>
              <ul className="mt-3 space-y-2 text-xs text-emerald-800/90 leading-relaxed">
                <li>• Chỉ những hợp đồng đã bàn giao nhận phòng thực tế mới được phép đánh giá.</li>
                <li>• Bạn có thể phản hồi công khai mọi nhận xét của khách thuê tại tab <strong>Lịch sử & Phản hồi</strong>.</li>
                <li>• Nếu khách thuê đánh giá sai sự thật hoặc vu khống, bạn có quyền gửi <strong>Khiếu nại đánh giá</strong> để Admin kiểm duyệt.</li>
              </ul>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {reviewsList.length === 0 ? (
            <div className="p-12 text-center rounded-2xl bg-card border border-dashed border-border">
              <p className="text-muted-foreground">Chưa có đánh giá nào trên các phòng trọ của bạn.</p>
            </div>
          ) : (
            reviewsList.map((rv) => (
              <div key={rv.id} className="rounded-2xl bg-card p-5 ring-1 ring-border shadow-2xs">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <Avatar className="size-10 ring-1 ring-border">
                      <AvatarImage src={rv.avatar || undefined} />
                      <AvatarFallback className="bg-emerald-100 text-emerald-800 text-xs font-semibold">
                        {getInitials(rv.tenant)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold">{rv.tenant}</p>
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[10px]",
                            rv.isByLandlord
                              ? "border-blue-200 bg-blue-50 text-blue-700"
                              : "border-emerald-200 bg-emerald-50 text-emerald-700"
                          )}
                        >
                          {rv.isByLandlord ? "Bạn đánh giá khách thuê" : "Khách thuê đánh giá phòng"}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {rv.roomName ? `${rv.roomName} · ` : ""}
                        {rv.date}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Star
                        key={i}
                        className={cn(
                          "size-4",
                          i <= rv.rating ? "fill-amber-400 text-amber-400" : "fill-muted text-muted"
                        )}
                      />
                    ))}
                  </div>
                </div>

                {rv.tags.length > 0 && (
                  <div className="mt-2.5 flex flex-wrap gap-1.5">
                    {rv.tags.map((t) => (
                      <Badge key={t} variant="outline" className="text-[11px] font-normal">
                        {t}
                      </Badge>
                    ))}
                  </div>
                )}

                <p className="mt-2.5 text-sm text-foreground/90 leading-relaxed bg-slate-50 dark:bg-muted/40 p-3 rounded-xl border border-slate-100 dark:border-border">
                  {rv.text}
                </p>

                {rv.landlordReply ? (
                  <div className="mt-3 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/20 p-3.5 border border-emerald-200/80 text-xs">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-emerald-800 dark:text-emerald-300">
                        Phản hồi của bạn (Chủ trọ):
                      </span>
                      {rv.repliedAt && (
                        <span className="text-[10px] text-muted-foreground">
                          {new Date(rv.repliedAt).toLocaleDateString("vi-VN")}
                        </span>
                      )}
                    </div>
                    <p className="text-foreground leading-relaxed italic">&ldquo;{rv.landlordReply}&rdquo;</p>
                  </div>
                ) : !rv.isByLandlord ? (
                  <div className="mt-3 flex flex-wrap justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs gap-1.5 cursor-pointer border-rose-200 text-rose-700 hover:bg-rose-50"
                      onClick={() => {
                        setDisputingReview(rv);
                        setDisputeReason("");
                      }}
                    >
                      <Flag className="size-3.5" />
                      Khiếu nại đánh giá sai sự thật
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs gap-1.5 cursor-pointer border-emerald-300 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800"
                      onClick={() => {
                        setReplyingReview(rv);
                        setReplyText("");
                      }}
                    >
                      <MessageSquare className="size-3.5" />
                      Phản hồi khách thuê
                    </Button>
                  </div>
                ) : null}
              </div>
            ))
          )}
        </div>
      )}

      {/* Dialog 1: Phản hồi khách thuê */}
      <Dialog open={!!replyingReview} onOpenChange={(open) => !open && setReplyingReview(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <MessageSquare className="size-4 text-emerald-600" /> Phản hồi công khai đánh giá
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Phản hồi của bạn sẽ hiển thị công khai ngay dưới đánh giá của khách thuê {replyingReview?.tenant}.
            </DialogDescription>
          </DialogHeader>

          {replyingReview && (
            <div className="space-y-3 py-2 text-xs">
              <div className="bg-muted/40 p-3 rounded-xl border space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-foreground">{replyingReview.tenant}</span>
                  <div className="flex items-center gap-0.5 text-amber-500">
                    {Array.from({ length: replyingReview.rating }).map((_, i) => (
                      <Star key={i} className="size-3 fill-amber-500 text-amber-500" />
                    ))}
                  </div>
                </div>
                <p className="text-muted-foreground italic">&ldquo;{replyingReview.text}&rdquo;</p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Nội dung phản hồi của chủ trọ <span className="text-destructive">*</span>
                </label>
                <Textarea
                  rows={4}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Gửi lời cảm ơn, giải thích rõ sự việc hoặc cam kết cải thiện chất lượng phục vụ..."
                  className="text-xs resize-none"
                />
              </div>
            </div>
          )}

          <DialogFooter className="flex flex-row items-center justify-end gap-3 pt-2 sm:space-x-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setReplyingReview(null)}
              className="text-xs cursor-pointer"
            >
              Hủy
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={isSubmittingReply}
              onClick={handleSendReply}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs cursor-pointer gap-1.5"
            >
              {isSubmittingReply ? "Đang gửi..." : "Gửi phản hồi công khai"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog 2: Khiếu nại đánh giá sai sự thật lên Admin */}
      <Dialog open={!!disputingReview} onOpenChange={(open) => !open && setDisputingReview(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2 text-rose-700">
              <ShieldAlert className="size-4 text-rose-600" /> Khiếu nại đánh giá sai sự thật
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Gửi yêu cầu thẩm định lên Ban Quản Trị nếu đánh giá của <strong>{disputingReview?.tenant}</strong> có nội dung vu khống, sai sự thật hoặc vi phạm tiêu chuẩn cộng đồng.
            </DialogDescription>
          </DialogHeader>

          {disputingReview && (
            <div className="space-y-3 py-2 text-xs">
              <div className="bg-rose-50/60 p-3 rounded-xl border border-rose-200 space-y-1">
                <span className="font-semibold text-rose-900">Nội dung đánh giá bị khiếu nại:</span>
                <p className="text-rose-800 italic">&ldquo;{disputingReview.text}&rdquo;</p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Lý do khiếu nại & Bằng chứng đối chiếu <span className="text-destructive">*</span>
                </label>
                <Textarea
                  rows={4}
                  value={disputeReason}
                  onChange={(e) => setDisputeReason(e.target.value)}
                  placeholder="Nêu rõ điểm sai sự thật trong đánh giá của khách thuê để Admin kiểm tra lịch sử hợp đồng & tin nhắn..."
                  className="text-xs resize-none"
                />
              </div>
            </div>
          )}

          <DialogFooter className="flex flex-row items-center justify-end gap-3 pt-2 sm:space-x-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setDisputingReview(null)}
              className="text-xs cursor-pointer"
            >
              Hủy
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={isSubmittingDispute}
              onClick={handleSendDispute}
              className="bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs cursor-pointer gap-1.5"
            >
              {isSubmittingDispute ? "Đang gửi..." : "Gửi khiếu nại lên Admin"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
