import { useState } from "react";
import { Star, MessageSquareHeart, CheckCircle2, X } from "lucide-react";
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
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [category, setCategory] = useState<string>("app_experience");
  const [comment, setComment] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitted, setSubmitted] = useState<boolean>(false);

  const categories = [
    { id: "app_experience", label: "Trải nghiệm ứng dụng" },
    { id: "landlord_quality", label: "Đánh giá chất lượng chủ trọ" },
    { id: "matching_feature", label: "Tính năng ghép bạn trọ" },
    { id: "payment_system", label: "Thanh toán VietQR & Cọc" },
    { id: "other", label: "Góp ý khác" },
  ];

  const ratingDescriptions: Record<number, string> = {
    1: "Rất không hài lòng (1 sao)",
    2: "Chưa tốt (2 sao)",
    3: "Bình thường (3 sao)",
    4: "Hài lòng & Tiện lợi (4 sao)",
    5: "Tuyệt vời, rất ấn tượng! (5 sao)",
  };

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
      toast.success(`Cảm ơn bạn đã gửi đánh giá ${rating} sao và góp ý cho Phòng Trọ Xanh!`);

      setTimeout(() => {
        setSubmitted(false);
        setComment("");
        setRating(5);
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
            <div className="size-8 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center">
              <MessageSquareHeart className="size-4" />
            </div>
            <DialogTitle className="text-base font-bold text-foreground">
              Đánh giá ứng dụng & Chủ trọ
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-muted-foreground">
            Phản hồi thực tế của bạn giúp Phòng Trọ Xanh nâng cấp chất lượng phục vụ và kiểm soát độ uy tín của chủ trọ.
          </DialogDescription>
        </DialogHeader>

        {submitted ? (
          <div className="py-8 flex flex-col items-center justify-center text-center space-y-3">
            <div className="size-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center animate-bounce">
              <CheckCircle2 className="size-6" />
            </div>
            <div>
              <h4 className="font-bold text-base text-foreground">Đã ghi nhận đánh giá thành công!</h4>
              <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                Hệ thống đã lưu nhận xét {rating} sao của bạn. Ý kiến đóng góp sẽ được ban quản trị phân tích để hoàn thiện nền tảng.
              </p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 py-1">
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
                placeholder="Nhập cảm nhận của bạn về trải nghiệm sử dụng, thái độ của chủ trọ, tốc độ tìm phòng hoặc các tính năng mong muốn bổ sung..."
                className="text-xs resize-none"
              />
            </div>

            <DialogFooter className="gap-2 sm:gap-0 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onOpenChange(false)}
                className="text-xs cursor-pointer"
              >
                Đóng
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isSubmitting}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs cursor-pointer gap-1.5"
              >
                {isSubmitting ? "Đang gửi..." : "Gửi đánh giá & Nhận xét"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
