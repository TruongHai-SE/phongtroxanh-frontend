import { useState, useEffect } from "react";
import { Star, MessageSquareHeart, CheckCircle2, X, RefreshCw } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useAuth } from "@/app/context/AuthContext";
import { cn } from "@/lib/utils";

import { reviewsApi } from "@/features/reviews/api/reviewsApi";

interface AppFeedbackModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AppFeedbackModal({ open, onOpenChange }: AppFeedbackModalProps) {
  const { user } = useAuth();
  const isLandlord = user?.role === "LANDLORD";
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [category, setCategory] = useState<string>("app_experience");
  const [comment, setComment] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitted, setSubmitted] = useState<boolean>(false);
  const [hasExisting, setHasExisting] = useState<boolean>(false);
  const [isLoadingExisting, setIsLoadingExisting] = useState<boolean>(false);

  const tenantCategories = [
    {
      id: "app_experience",
      label: "Tìm phòng & Bản đồ",
      placeholder:
        "Chia sẻ cảm nhận của bạn về bộ lọc tìm phòng, bản đồ trực quan, bảng so sánh phòng hoặc tốc độ tải trang...",
    },
    {
      id: "matching_feature",
      label: "Tính năng ghép bạn trọ",
      placeholder:
        "Chia sẻ đánh giá về độ chính xác khi gợi ý bạn cùng phòng, bộ lọc lối sống và trò chuyện sau khi ghép đôi...",
    },
    {
      id: "booking_swap",
      label: "Đặt lịch xem & Nhận phòng",
      placeholder:
        "Chia sẻ trải nghiệm khi đặt lịch hẹn xem phòng, theo dõi hợp đồng thuê và xác nhận nhận bàn giao phòng...",
    },
    {
      id: "payment_system",
      label: "Thanh toán PayOS & Gói VIP",
      placeholder:
        "Chia sẻ trải nghiệm khi nâng cấp gói Hội viên qua cổng thanh toán PayOS và tốc độ kích hoạt quyền lợi...",
    },
    {
      id: "landlord_quality",
      label: "Chất lượng tin đăng & Chủ trọ",
      placeholder:
        "Chia sẻ nhận xét về độ xác thực của hình ảnh phòng trọ, thông tin chi phí điện nước và sự hỗ trợ của chủ trọ...",
    },
    {
      id: "other",
      label: "Góp ý khác",
      placeholder:
        "Nhập đề xuất tính năng mới hoặc bất kỳ góp ý nào để Phòng Trọ Xanh phục vụ người thuê tốt hơn...",
    },
  ];

  const landlordCategories = [
    {
      id: "app_experience",
      label: "Bảng điều khiển & Giao diện",
      placeholder:
        "Chia sẻ cảm nhận về bố cục bảng điều khiển Chủ trọ, biểu đồ thống kê lượt xem 7 ngày và tốc độ thao tác...",
    },
    {
      id: "room_management",
      label: "Đăng tin & Quản lý phòng",
      placeholder:
        "Chia sẻ góp ý về quy trình 4 bước đăng phòng mới, tải ảnh thực tế, tạm ẩn/hiện tin hoặc cập nhật giá phòng...",
    },
    {
      id: "tenant_management",
      label: "Quản lý người thuê & Hợp đồng",
      placeholder:
        "Chia sẻ trải nghiệm khi duyệt lịch hẹn xem phòng, xác nhận bàn giao hợp đồng thuê hoặc nhắn tin với khách...",
    },
    {
      id: "service_package",
      label: "Gói dịch vụ & Đẩy Top phòng",
      placeholder:
        "Chia sẻ đánh giá về hiệu quả tiếp cận khách thuê khi Đẩy Top phòng và quyền lợi các gói Hội viên Chủ trọ...",
    },
    {
      id: "payment_system",
      label: "Thanh toán PayOS",
      placeholder:
        "Chia sẻ trải nghiệm khi quét mã QR thanh toán qua cổng PayOS, tốc độ cộng lượt đẩy tin và kích hoạt gói dịch vụ...",
    },
    {
      id: "other",
      label: "Góp ý khác",
      placeholder:
        "Nhập đề xuất công cụ mới hoặc bất kỳ góp ý nào để Phòng Trọ Xanh hỗ trợ chủ trọ quản lý hiệu quả hơn...",
    },
  ];

  const categories = isLandlord ? landlordCategories : tenantCategories;
  const activeCategoryObj = categories.find((c) => c.id === category) ?? categories[0];

  const ratingDescriptions: Record<number, string> = {
    1: "Rất không hài lòng (1 sao)",
    2: "Chưa tốt (2 sao)",
    3: "Bình thường (3 sao)",
    4: "Hài lòng & Tiện lợi (4 sao)",
    5: "Tuyệt vời, rất ấn tượng! (5 sao)",
  };

  useEffect(() => {
    if (open && user) {
      setIsLoadingExisting(true);
      reviewsApi
        .getMySystemFeedback()
        .then((fb) => {
          if (fb && fb.rating) {
            setRating(fb.rating);
            if (fb.category) setCategory(fb.category);
            if (fb.comment) setComment(fb.comment);
            setHasExisting(true);
          }
        })
        .catch(() => {
          setHasExisting(false);
        })
        .finally(() => {
          setIsLoadingExisting(false);
        });
    } else if (!open) {
      setSubmitted(false);
    }
  }, [open, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!comment.trim()) {
      toast.error("Vui lòng nhập nội dung nhận xét chi tiết kèm theo số sao đánh giá.");
      return;
    }

    if (comment.trim().length < 10) {
      toast.error("Nội dung nhận xét tối thiểu 10 ký tự để hệ thống ghi nhận chất lượng.");
      return;
    }

    setIsSubmitting(true);

    try {
      await reviewsApi.createSystemFeedback({
        rating,
        category,
        comment: comment.trim(),
      });

      setSubmitted(true);
      setHasExisting(true);
      toast.success(
        hasExisting
          ? `Đã cập nhật thành công đánh giá ${rating} sao của bạn!`
          : `Cảm ơn bạn đã gửi đánh giá ${rating} sao và góp ý cho Phòng Trọ Xanh!`
      );

      setTimeout(() => {
        setSubmitted(false);
        onOpenChange(false);
      }, 1800);
    } catch {
      toast.error("Có lỗi xảy ra khi gửi góp ý. Vui lòng thử lại.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="size-8 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center shrink-0">
              <MessageSquareHeart className="size-4" />
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <DialogTitle className="text-base font-bold text-foreground">
                {hasExisting
                  ? "Chỉnh sửa đánh giá nền tảng"
                  : isLandlord
                  ? "Đánh giá nền tảng Quản lý Trọ"
                  : "Đánh giá ứng dụng Phòng Trọ Xanh"}
              </DialogTitle>
              <Badge
                variant="outline"
                className={cn(
                  "text-[10px] px-2 py-0 font-semibold",
                  isLandlord
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : "bg-blue-50 text-blue-700 border-blue-200"
                )}
              >
                {isLandlord ? "Chủ trọ" : "Người thuê"}
              </Badge>
            </div>
          </div>
          <DialogDescription className="text-xs text-muted-foreground">
            {isLandlord
              ? "Phản hồi của bạn giúp Phòng Trọ Xanh tối ưu công cụ đăng tin, quản lý khách thuê, hợp đồng và thanh toán qua cổng PayOS."
              : "Phản hồi thực tế của bạn giúp Phòng Trọ Xanh nâng cấp trải nghiệm tìm phòng, ghép bạn ở ghép và chất lượng dịch vụ trên nền tảng."}
          </DialogDescription>
        </DialogHeader>

        {submitted ? (
          <div className="py-8 flex flex-col items-center justify-center text-center space-y-3">
            <div className="size-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center animate-bounce">
              <CheckCircle2 className="size-6" />
            </div>
            <div>
              <h4 className="font-bold text-base text-foreground">
                {hasExisting ? "Đã cập nhật đánh giá thành công!" : "Đã ghi nhận đánh giá thành công!"}
              </h4>
              <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                Hệ thống đã lưu nhận xét {rating} sao của bạn. Ý kiến đóng góp sẽ được ban quản trị phân tích để hoàn thiện nền tảng.
              </p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 py-1">
            {hasExisting && (
              <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 text-[11px] font-medium border border-emerald-200 dark:border-emerald-800">
                <CheckCircle2 className="size-3.5 shrink-0 text-emerald-600" />
                <span>Bạn đã gửi đánh giá trước đó. Có thể điều chỉnh số sao và lời nhận xét để cập nhật.</span>
              </div>
            )}
            {/* Chấm điểm sao */}
            <div className="space-y-1.5 p-3 rounded-xl bg-amber-50/40 dark:bg-amber-950/20 border border-amber-200/50">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-foreground">Chọn mức điểm đánh giá</span>
                <span className="text-xs font-bold text-amber-600">
                  {ratingDescriptions[hoverRating || rating]}
                </span>
              </div>
              <div className="flex items-center gap-2 pt-1">
                {[1, 2, 3, 4, 5].map((star) => {
                  const active = star <= (hoverRating || rating);
                  return (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      className="p-1 rounded-lg hover:bg-amber-100/60 transition cursor-pointer"
                    >
                      <Star
                        className={cn(
                          "size-7 transition-all duration-150",
                          active
                            ? "fill-amber-400 text-amber-400 scale-110"
                            : "fill-muted text-muted-foreground/30"
                        )}
                      />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Chủ đề đánh giá */}
            <div className="space-y-1.5">
              <span className="text-xs font-semibold text-foreground">Chủ đề đánh giá</span>
              <div className="flex flex-wrap gap-1.5">
                {categories.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setCategory(c.id)}
                    className={cn(
                      "px-2.5 py-1 rounded-full text-xs font-medium border transition cursor-pointer",
                      category === c.id
                        ? "bg-primary text-white border-primary"
                        : "bg-muted/40 text-muted-foreground hover:bg-muted"
                    )}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Nội dung nhận xét bắt buộc */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-foreground">
                  Nội dung nhận xét & góp ý <span className="text-destructive">*</span>
                </span>
                <span className="text-[11px] text-muted-foreground">Bắt buộc kèm comment</span>
              </div>
              <Textarea
                rows={4}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder={activeCategoryObj.placeholder}
                className="text-xs resize-none"
              />
            </div>

            <DialogFooter className="flex flex-row items-center justify-end gap-3 pt-3 sm:space-x-0">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onOpenChange(false)}
                className="text-xs cursor-pointer px-4"
              >
                Đóng
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isSubmitting || isLoadingExisting}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs cursor-pointer gap-1.5 px-4 shadow-xs"
              >
                {isSubmitting
                  ? "Đang xử lý..."
                  : hasExisting
                  ? "Cập nhật đánh giá & Nhận xét"
                  : "Gửi đánh giá & Nhận xét"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
