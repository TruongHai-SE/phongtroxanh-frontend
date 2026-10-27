import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router";
import { useRentals } from "../hooks/useRentals";
import { formatVND, formatDate, getInitials } from "@/lib/utils";
import {
  FileText,
  Calendar,
  Home,
  CheckCircle2,
  Clock,
  RefreshCw,
  AlertCircle,
  Repeat,
  Star,
  Phone,
  Mail,
  MessageCircle,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  XCircle,
  LogOut,
  Flag,
  Scale,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { rentalsApi } from "../api/rentalsApi";
import { chatApi } from "@/features/chat/api/chatApi";
import { reportsApi } from "@/features/reports/api/reportsApi";
import type { RentalResponse } from "../types/rental.types";

export default function RentalsMe() {
  const navigate = useNavigate();
  const { rentals, isLoading, isError, isEmpty, errorMessage, refetch } = useRentals();

  // Cancel pending request modal
  const [cancelTarget, setCancelTarget] = useState<RentalResponse | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [isCancelling, setIsCancelling] = useState(false);

  // Tenant checkout / contract liquidation modal
  const [checkoutTarget, setCheckoutTarget] = useState<RentalResponse | null>(null);
  const [checkoutReason, setCheckoutReason] = useState("");
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  // Report Landlord deposit fraud / contract violation modal
  const [reportTarget, setReportTarget] = useState<RentalResponse | null>(null);
  const [reportType, setReportType] = useState("LUA_COC");
  const [reportDetail, setReportDetail] = useState("");
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);

  // Post-booking workflow guide banner when user just submitted a room viewing request
  const [justBookedInfo, setJustBookedInfo] = useState<{
    roomId?: string;
    roomTitle?: string;
    landlordName?: string;
    viewingDate?: string;
    rentStartDate?: string;
  } | null>(null);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("ptx_just_booked_room");
      if (raw) {
        setJustBookedInfo(JSON.parse(raw));
        sessionStorage.removeItem("ptx_just_booked_room");
      }
    } catch {
      // ignore
    }
  }, []);

  const handleConfirmReceipt = async (rental: RentalResponse) => {
    const isApproved = rental.approvalStatus === "APPROVED" || rental.checkInCode === "APPROVED";
    if (!isApproved) {
      toast.error("Chủ trọ chưa duyệt yêu cầu thuê phòng. Vui lòng chờ chủ trọ duyệt hồ sơ & ngày vào ở hoặc nhắn tin trao đổi trước!");
      return;
    }
    try {
      await rentalsApi.verifyCheckIn(rental.id, { checkInCode: "CONFIRM" });
      toast.success("Xác nhận nhận phòng thành công! Bạn đã được cộng +10 điểm TrustScore.");
      refetch();
    } catch (err: any) {
      const msg = err?.response?.data?.detail || err?.response?.data?.message || err?.message;
      toast.error(msg || "Không thể xác nhận nhận phòng.");
    }
  };

  const handleOpenChatWithLandlord = async (rental: RentalResponse) => {
    try {
      const conv = await chatApi.createConversation({
        partnerId: rental.landlordId,
        roomId: rental.roomId,
        type: "ROOM",
        initialMessage: `Chào anh/chị ${rental.landlordName}, mình liên hệ về yêu cầu thuê phòng "${rental.roomTitle}" (Dự kiến vào ở: ${formatDate(rental.startDate)}).`,
      });
      navigate(`/chat?cid=${conv.id}`);
    } catch {
      navigate(`/chat?partnerId=${rental.landlordId}`);
    }
  };

  const handleCancelRequest = async () => {
    if (!cancelTarget) return;
    setIsCancelling(true);
    try {
      await rentalsApi.cancelRental(cancelTarget.id, cancelReason.trim() || "Người thuê chủ động rút yêu cầu thuê phòng");
      toast.success("Đã hủy yêu cầu thuê phòng.");
      setCancelTarget(null);
      setCancelReason("");
      refetch();
    } catch (err: any) {
      const msg = err?.response?.data?.detail || err?.response?.data?.message || err?.message;
      toast.error(msg || "Không thể hủy yêu cầu thuê phòng.");
    } finally {
      setIsCancelling(false);
    }
  };

  const handleTenantCheckout = async () => {
    if (!checkoutTarget) return;
    if (checkoutReason.trim().length < 10) {
      toast.error("Vui lòng nhập ghi chú bàn giao trả phòng & tình trạng hoàn cọc (tối thiểu 10 ký tự).");
      return;
    }
    setIsCheckingOut(true);
    try {
      await rentalsApi.terminateRental(checkoutTarget.id, {
        reason: checkoutReason.trim(),
        terminationType: "TENANT_CHECKOUT",
      });
      toast.success("Đã lập biên bản trả phòng & thanh lý hợp đồng. Thông tin chủ trọ vẫn được lưu vĩnh viễn để bảo vệ quyền lợi của bạn.");
      setCheckoutTarget(null);
      setCheckoutReason("");
      refetch();
    } catch (err: any) {
      const msg = err?.response?.data?.detail || err?.response?.data?.message || err?.message;
      toast.error(msg || "Không thể thanh lý hợp đồng.");
    } finally {
      setIsCheckingOut(false);
    }
  };

  const handleReportLandlord = async () => {
    if (!reportTarget) return;
    if (reportDetail.trim().length < 15) {
      toast.error("Vui lòng mô tả chi tiết sự việc (tối thiểu 15 ký tự) để Admin xử lý và khóa tài khoản chủ trọ vi phạm.");
      return;
    }
    setIsSubmittingReport(true);
    try {
      await reportsApi.submitReport({
        targetType: "ROOM",
        targetId: reportTarget.roomId,
        reportType,
        detail: `[Khiếu nại HĐ #${reportTarget.id.slice(-8).toUpperCase()} - Chủ trọ: ${reportTarget.landlordName} (${reportTarget.landlordPhone || "Không rõ SĐT"}) - Tiền cọc: ${formatVND(reportTarget.depositAmount)}] ${reportDetail.trim()}`,
        severity: "CRITICAL",
      });
      toast.success("Đã gửi biên bản tố cáo khẩn cấp tới Ban Quản Trị! Hồ sơ định danh CCCD & SĐT của chủ trọ đã được khóa để điều tra.");
      setReportTarget(null);
      setReportDetail("");
    } catch (err: any) {
      const msg = err?.response?.data?.detail || err?.response?.data?.message || err?.message;
      toast.error(msg || "Không thể gửi báo cáo vi phạm.");
    } finally {
      setIsSubmittingReport(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20 pt-6">
      <div className="mx-auto max-w-5xl px-4">
        {/* Header */}
        <div data-tour="rentals-header-bar" className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Phòng của tôi — Yêu cầu xem & thuê phòng
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Theo dõi lịch hẹn xem phòng, trạng thái chủ trọ duyệt yêu cầu thời gian thực và xác nhận nhận phòng
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isLoading}
            className="flex items-center gap-2 self-start sm:self-auto cursor-pointer"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            Làm mới
          </Button>
        </div>

        {/* Post-Booking Next-Step Guide Banner (Triggered right after submitting a viewing request) */}
        {justBookedInfo && (
          <div className="mb-6 rounded-2xl border-2 border-emerald-500/40 bg-emerald-50/90 p-5 shadow-md animate-fade-in">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-emerald-600 text-white shadow-xs">
                  <CheckCircle2 className="size-5" />
                </span>
                <div>
                  <h2 className="text-base font-extrabold text-emerald-950">
                    Bạn đã gửi đơn hẹn xem phòng thành công! Vui lòng chờ Chủ trọ phản hồi
                  </h2>
                  <p className="mt-0.5 text-xs font-medium text-emerald-800">
                    Phòng: <strong>{justBookedInfo.roomTitle || "Phòng trọ"}</strong> • Chủ trọ:{" "}
                    <strong>{justBookedInfo.landlordName || "Chủ phòng trọ"}</strong>
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setJustBookedInfo(null)}
                className="h-7 px-2 text-xs text-emerald-800 hover:bg-emerald-100 cursor-pointer"
              >
                Đóng
              </Button>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl bg-white p-3 border border-emerald-200/80">
                <p className="text-xs font-bold text-emerald-900">1. Theo dõi tại Phòng của tôi</p>
                <p className="mt-1 text-[11px] leading-relaxed text-slate-600">
                  Đơn đang ở <strong>Bước 1/3 (Chờ duyệt)</strong>. Khi Chủ trọ duyệt, chuông thông báo sẽ báo ngay và mở khóa nút <strong>Xác nhận đã nhận phòng</strong>.
                </p>
              </div>
              <div className="rounded-xl bg-white p-3 border border-emerald-200/80">
                <p className="text-xs font-bold text-emerald-900">2. Chủ động nhắn tin Chủ trọ</p>
                <p className="mt-1 text-[11px] leading-relaxed text-slate-600">
                  Qua tab <strong>Tin nhắn</strong> để trao đổi giờ đến xem phòng thực tế và hỏi kỹ các chi tiết trước khi đặt cọc.
                </p>
              </div>
              <div className="rounded-xl bg-white p-3 border border-emerald-200/80">
                <p className="text-xs font-bold text-emerald-900">3. Nhận phòng & Đánh giá (+10đ)</p>
                <p className="mt-1 text-[11px] leading-relaxed text-slate-600">
                  Sau khi nhận chìa khóa và bấm xác nhận nhận phòng, bạn được <strong>+10 điểm Uy tín</strong> và mở khóa quyền <strong>Đánh giá Chủ trọ</strong>.
                </p>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2.5">
              <Button
                size="sm"
                onClick={() => navigate("/rentals/me?tour=1")}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold cursor-pointer"
              >
                Xem hướng dẫn chi tiết màn hình này
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => navigate("/chat")}
                className="border-emerald-400 bg-white text-emerald-800 hover:bg-emerald-100 text-xs font-bold cursor-pointer gap-1.5"
              >
                <MessageCircle className="size-3.5" /> Qua tab Tin nhắn theo dõi & trao đổi →
              </Button>
            </div>
          </div>
        )}

        {/* 1. Loading State */}
        {isLoading && (
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="animate-pulse rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="space-y-3">
                    <div className="h-6 w-48 rounded-md bg-slate-200" />
                    <div className="h-4 w-72 rounded-md bg-slate-100" />
                  </div>
                  <div className="h-10 w-32 rounded-xl bg-slate-200" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 2. Error State */}
        {!isLoading && isError && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50/50 p-8 text-center">
            <AlertCircle className="mx-auto h-12 w-12 text-rose-500" />
            <h3 className="mt-4 text-base font-semibold text-rose-900">Không thể tải dữ liệu hợp đồng</h3>
            <p className="mt-2 text-sm text-rose-600">{errorMessage || "Đã xảy ra sự cố trong quá trình kết nối."}</p>
            <Button onClick={() => refetch()} className="mt-6 bg-rose-600 hover:bg-rose-700">
              Thử lại
            </Button>
          </div>
        )}

        {/* 3. Empty State */}
        {!isLoading && !isError && isEmpty && (
          <div data-tour="rentals-list-area" className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center shadow-sm">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
              <Home className="h-8 w-8" />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-slate-900">Bạn chưa có yêu cầu hoặc hợp đồng thuê nào</h3>
            <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
              Tìm kiếm phòng trọ ưng ý, gửi yêu cầu thuê để chủ trọ duyệt hồ sơ và ký hợp đồng minh bạch trên Phòng Trọ Xanh.
            </p>
            <div className="mt-6 flex justify-center gap-3">
              <Link to="/discover">
                <Button className="bg-emerald-600 hover:bg-emerald-700 cursor-pointer">Khám phá phòng trọ</Button>
              </Link>
            </div>
          </div>
        )}

        {/* 4. Success State */}
        {!isLoading && !isError && !isEmpty && (
          <div data-tour="rentals-list-area" className="space-y-6">
            {rentals.map((rental, rentalIdx) => {
              const isPendingApproval =
                rental.status === "PENDING_CHECKIN" &&
                rental.approvalStatus !== "APPROVED" &&
                rental.checkInCode !== "APPROVED";
              const isApprovedWaitingCheckin =
                rental.status === "PENDING_CHECKIN" &&
                (rental.approvalStatus === "APPROVED" || rental.checkInCode === "APPROVED");
              const isCheckedIn = rental.status === "CHECKED_IN";
              const isTerminated = rental.status === "TERMINATED";
              const isCancelled = rental.status === "CANCELLED";
              const isEarlyLandlordTermination =
                isTerminated &&
                rental.tenantMessage &&
                rental.tenantMessage.includes("EARLY_LANDLORD");

              return (
                <div
                  key={rental.id}
                  className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all hover:shadow-md"
                >
                  {/* Top Bar */}
                  <div className="border-b border-slate-100 bg-slate-50/70 px-6 py-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <FileText className="h-5 w-5 text-emerald-600" />
                        <span className="font-semibold text-slate-800">
                          Mã HĐ: #{rental.id.slice(-8).toUpperCase()}
                        </span>
                        {rental.createdAt && (
                          <span className="text-xs text-slate-400">
                            • Tạo ngày {formatDate(rental.createdAt)}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {isPendingApproval && (
                          <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100 border border-amber-200">
                            <Clock className="mr-1 h-3.5 w-3.5" /> Bước 1/3: Chờ chủ trọ duyệt hồ sơ & ngày vào ở
                          </Badge>
                        )}
                        {isApprovedWaitingCheckin && (
                          <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100 border border-blue-200">
                            <CheckCircle2 className="mr-1 h-3.5 w-3.5" /> Bước 2/3: Chủ trọ ĐÃ DUYỆT — Chờ nhận phòng
                          </Badge>
                        )}
                        {isCheckedIn && (
                          <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 border border-emerald-200">
                            <CheckCircle2 className="mr-1 h-3.5 w-3.5" /> Đang hiệu lực (Đã nhận phòng)
                          </Badge>
                        )}
                        {isTerminated && (
                          <Badge variant="destructive">
                            Đã thanh lý / Kết thúc hợp đồng
                          </Badge>
                        )}
                        {isCancelled && (
                          <Badge variant="secondary" className="bg-slate-200 text-slate-700">
                            Đã từ chối / Đã rút yêu cầu
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* 4-Stage Visual Progress Bar */}
                    {!isCancelled && (
                      <div
                        data-tour={rentalIdx === 0 ? "rentals-progress-bar" : undefined}
                        className="mt-4 grid grid-cols-3 gap-2 pt-2 border-t border-slate-200/60 text-xs"
                      >
                        <div className="flex items-center gap-2 text-emerald-700 font-semibold">
                          <span className="flex size-5 items-center justify-center rounded-full bg-emerald-600 text-white text-[10px]">
                            ✓
                          </span>
                          <span>1. Gửi yêu cầu & Ngày vào ở</span>
                        </div>
                        <div
                          className={`flex items-center gap-2 font-semibold ${
                            isApprovedWaitingCheckin || isCheckedIn || isTerminated
                              ? "text-emerald-700"
                              : "text-amber-700"
                          }`}
                        >
                          <span
                            className={`flex size-5 items-center justify-center rounded-full text-[10px] ${
                              isApprovedWaitingCheckin || isCheckedIn || isTerminated
                                ? "bg-emerald-600 text-white"
                                : "bg-amber-500 text-white animate-pulse"
                            }`}
                          >
                            {isApprovedWaitingCheckin || isCheckedIn || isTerminated ? "✓" : "2"}
                          </span>
                          <span>
                            {isApprovedWaitingCheckin || isCheckedIn || isTerminated
                              ? "2. Chủ trọ đã duyệt hồ sơ"
                              : "2. Chờ chủ trọ duyệt hồ sơ"}
                          </span>
                        </div>
                        <div
                          className={`flex items-center gap-2 font-semibold ${
                            isCheckedIn || isTerminated ? "text-emerald-700" : "text-slate-400"
                          }`}
                        >
                          <span
                            className={`flex size-5 items-center justify-center rounded-full text-[10px] ${
                              isCheckedIn || isTerminated
                                ? "bg-emerald-600 text-white"
                                : "bg-slate-200 text-slate-600"
                            }`}
                          >
                            {isCheckedIn || isTerminated ? "✓" : "3"}
                          </span>
                          <span>3. Bàn giao & Nhận phòng (+10đ)</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Real-time status banner */}
                  {isPendingApproval && (
                    <div className="bg-amber-50/90 border-b border-amber-200/70 px-6 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs text-amber-900">
                      <div className="flex items-center gap-2">
                        <Clock className="size-4 text-amber-600 shrink-0" />
                        <span>
                          <strong>Đang chờ chủ trọ xét duyệt:</strong> Chủ trọ đang xem hồ sơ cá nhân của bạn và kiểm tra ngày dự kiến vào ở ({formatDate(rental.startDate)}). Bạn có thể chủ động nhắn tin trao đổi với chủ trọ!
                        </span>
                      </div>
                    </div>
                  )}

                  {isApprovedWaitingCheckin && (
                    <div className="bg-emerald-50 border-b border-emerald-200 px-6 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs text-emerald-900">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
                        <span>
                          <strong>Chủ trọ đã DUYỆT yêu cầu thuê phòng của bạn!</strong> Hãy liên hệ chủ trọ để kiểm tra phòng thực tế, nhận chìa khóa và bấm <strong>"Xác nhận đã nhận phòng"</strong> bên dưới.
                        </span>
                      </div>
                    </div>
                  )}

                  {isEarlyLandlordTermination && (
                    <div className="bg-rose-50 border-b border-rose-200 px-6 py-3.5 text-xs text-rose-900 space-y-1">
                      <div className="flex items-center gap-2 font-bold text-rose-800">
                        <Scale className="size-4 text-rose-600 shrink-0" />
                        CẢNH BÁO PHÁP LÝ: Chủ trọ đơn phương chấm dứt hợp đồng trước hạn (Điều 428 Bộ luật Dân sự 2015)
                      </div>
                      <p className="text-rose-700 leading-relaxed">
                        Hệ thống đã tự động <strong>trừ -15 điểm TrustScore</strong> của chủ trọ và <strong>lưu trữ vĩnh viễn hồ sơ định danh CCCD, SĐT, địa chỉ của chủ trọ</strong> tại đây. Chủ trọ có nghĩa vụ hoàn trả 100% tiền cọc ({formatVND(rental.depositAmount)}) và bồi thường tương ứng giá trị tiền cọc. Nếu chủ trọ trốn tránh hoặc giữ cọc trái phép, hãy bấm nút <strong>"Khiếu nại Chủ trọ giữ cọc"</strong> ngay bên dưới!
                      </p>
                    </div>
                  )}

                  <div className="p-6">
                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                      {/* Column 1: Room & Contract Details */}
                      <div className="space-y-3 lg:col-span-2">
                        <h2 className="text-lg font-bold text-slate-900">
                          <Link to={`/rooms/${rental.roomId}`} className="hover:text-emerald-600">
                            {rental.roomTitle}
                          </Link>
                        </h2>
                        <p className="text-sm text-slate-600 flex items-center gap-1.5">
                          <Home className="h-4 w-4 text-slate-400 shrink-0" />
                          {rental.roomAddress || rental.roomDistrict || "Địa chỉ cập nhật theo hợp đồng"}
                        </p>

                        <div className="mt-4 grid grid-cols-2 gap-4 rounded-xl bg-slate-50 p-4 sm:grid-cols-4 border border-slate-100">
                          <div>
                            <p className="text-xs text-slate-500">Tiền thuê hàng tháng</p>
                            <p className="font-bold text-emerald-600">{formatVND(rental.monthlyRent)}/tháng</p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-500">Tiền cọc tham khảo</p>
                            <p className="font-semibold text-slate-800">{formatVND(rental.depositAmount)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-500">Ngày hẹn gặp xem phòng</p>
                            <p className="font-semibold text-emerald-700">
                              {formatDate(rental.viewingDate || rental.startDate)}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-500">Dự kiến dọn vào ở</p>
                            <p className="font-medium text-slate-700">
                              {formatDate(rental.startDate)}
                            </p>
                          </div>
                        </div>

                        {/* Audit Note / Message / Liquidation Record */}
                        {rental.tenantMessage && (
                          <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3.5 text-xs text-slate-700 space-y-1">
                            <p className="font-semibold text-slate-800 flex items-center gap-1.5">
                              <FileText className="size-3.5 text-emerald-600" />
                              Nhật ký yêu cầu / Biên bản thanh lý lưu trữ trên hệ thống:
                            </p>
                            <p className="leading-relaxed whitespace-pre-wrap text-slate-600">
                              {rental.tenantMessage}
                            </p>
                          </div>
                        )}

                        {/* Permanent Landlord Identity & Deposit Protection Record */}
                        <div
                          data-tour={rentalIdx === 0 ? "rentals-landlord-record" : undefined}
                          className="rounded-xl border border-emerald-200/80 bg-emerald-50/30 p-4"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
                            <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
                              <ShieldCheck className="size-4 text-emerald-600" />
                              Hồ sơ định danh Chủ trọ (Lưu trữ vĩnh viễn chống trốn cọc)
                            </span>
                            {rental.landlordVerified !== false ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-800">
                                <ShieldCheck className="size-3" /> CCCD đã xác thực
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-semibold text-amber-800">
                                Chưa xác thực CCCD
                              </span>
                            )}
                          </div>

                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <Avatar className="size-11 border border-emerald-200">
                                <AvatarImage src={rental.landlordAvatar || ""} className="object-cover" />
                                <AvatarFallback className="bg-emerald-100 text-emerald-800 font-bold text-xs">
                                  {getInitials(rental.landlordName || "CT")}
                                </AvatarFallback>
                              </Avatar>
                              <div className="space-y-0.5">
                                <div className="flex items-center gap-2">
                                  <p className="font-bold text-sm text-slate-900">{rental.landlordName}</p>
                                  {rental.landlordTrustScore !== undefined && (
                                    <span className="rounded-md bg-white px-2 py-0.5 text-[11px] font-semibold text-emerald-700 border border-emerald-200">
                                      TrustScore: {rental.landlordTrustScore}
                                    </span>
                                  )}
                                </div>
                                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600">
                                  {rental.landlordPhone && (
                                    <a
                                      href={`tel:${rental.landlordPhone}`}
                                      className="inline-flex items-center gap-1 font-medium text-emerald-700 hover:underline"
                                    >
                                      <Phone className="size-3" /> {rental.landlordPhone}
                                    </a>
                                  )}
                                  {rental.landlordEmail && (
                                    <span className="inline-flex items-center gap-1">
                                      <Mail className="size-3 text-slate-400" /> {rental.landlordEmail}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="flex flex-wrap gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleOpenChatWithLandlord(rental)}
                                className="text-xs h-8 gap-1.5 border-emerald-300 text-emerald-800 hover:bg-emerald-50 cursor-pointer"
                              >
                                <MessageCircle className="size-3.5" /> Nhắn tin Chủ trọ
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setReportTarget(rental);
                                  setReportType("LUA_COC");
                                  setReportDetail("");
                                }}
                                className="text-xs h-8 gap-1.5 border-rose-200 text-rose-700 hover:bg-rose-50 cursor-pointer"
                              >
                                <Flag className="size-3.5" /> Khiếu nại Giữ cọc / Vi phạm
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Column 2: Stage Actions */}
                      <div
                        data-tour={rentalIdx === 0 ? "rentals-stage-actions" : undefined}
                        className="flex flex-col justify-between space-y-4 rounded-xl border border-slate-200 bg-slate-50/70 p-4"
                      >
                        <div className="space-y-2">
                          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                            Thao tác hợp đồng
                          </p>

                          {/* Stage 1: Waiting for Landlord Approval */}
                          {isPendingApproval && (
                            <div className="space-y-2.5 pt-1">
                              <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800 space-y-1">
                                <div className="flex items-center gap-1.5 font-semibold">
                                  <Lock className="size-3.5 text-amber-600 shrink-0" />
                                  Chờ chủ trọ duyệt yêu cầu
                                </div>
                                <p className="text-[11px] text-amber-700 leading-relaxed">
                                  Nút <strong>Xác nhận nhận phòng</strong> sẽ tự động mở khóa ngay khi chủ trọ xem hồ sơ và bấm Duyệt.
                                </p>
                              </div>

                              <Button
                                size="sm"
                                onClick={() => handleOpenChatWithLandlord(rental)}
                                className="w-full text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer"
                              >
                                <MessageCircle className="mr-1.5 h-3.5 w-3.5" />
                                Nhắn tin trao đổi với Chủ trọ
                              </Button>

                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setCancelTarget(rental);
                                  setCancelReason("");
                                }}
                                className="w-full text-xs text-rose-600 border-rose-200 hover:bg-rose-50 cursor-pointer"
                              >
                                <XCircle className="mr-1.5 h-3.5 w-3.5" />
                                Rút yêu cầu thuê phòng
                              </Button>
                            </div>
                          )}

                          {/* Stage 2: Approved by Landlord -> Ready to Check-in */}
                          {isApprovedWaitingCheckin && (
                            <div className="space-y-2.5 pt-1">
                              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800">
                                <p className="font-semibold flex items-center gap-1.5">
                                  <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
                                  Đã được chủ trọ duyệt!
                                </p>
                                <p className="mt-1 text-[11px] text-emerald-700">
                                  Chỉ bấm nút dưới đây sau khi bạn đã kiểm tra phòng thực tế và nhận chìa khóa bàn giao.
                                </p>
                              </div>

                              <Button
                                size="sm"
                                onClick={() => handleConfirmReceipt(rental)}
                                className="w-full text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm cursor-pointer"
                              >
                                <CheckCircle2 className="mr-1.5 h-4 w-4" />
                                Xác nhận đã nhận phòng (+10 TrustScore)
                              </Button>

                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setCancelTarget(rental);
                                  setCancelReason("");
                                }}
                                className="w-full text-xs text-slate-600 hover:text-rose-600 cursor-pointer"
                              >
                                Hủy trước khi nhận phòng
                              </Button>
                            </div>
                          )}

                          {/* Stage 3: Active Contract (CHECKED_IN) */}
                          {isCheckedIn && (
                            <div className="space-y-2.5 pt-1">
                              <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 p-2.5 rounded-xl border border-emerald-200">
                                <CheckCircle2 className="h-4 w-4 shrink-0" />
                                <span>
                                  Đã bàn giao & nhận phòng
                                  {rental.checkInAt ? ` (${formatDate(rental.checkInAt)})` : ""}
                                </span>
                              </div>

                              <div>
                                <Link to={`/reviews?rentalId=${rental.id}&roomId=${rental.roomId}`}>
                                  <Button size="sm" variant="outline" className="w-full text-xs cursor-pointer">
                                    <Star className="mr-1.5 h-3.5 w-3.5 text-amber-500" /> Viết đánh giá phòng & chủ trọ
                                  </Button>
                                </Link>
                              </div>

                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setCheckoutTarget(rental);
                                  setCheckoutReason("");
                                }}
                                className="w-full text-xs text-rose-700 border-rose-200 hover:bg-rose-50 cursor-pointer"
                              >
                                <LogOut className="mr-1.5 h-3.5 w-3.5" />
                                Yêu cầu trả phòng / Thanh lý HĐ
                              </Button>
                            </div>
                          )}

                          {/* Stage 4: Terminated or Cancelled */}
                          {(isTerminated || isCancelled) && (
                            <div className="space-y-2.5 pt-1">
                              <div className="rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-600">
                                {isTerminated ? (
                                  <p>
                                    Hợp đồng đã kết thúc. Bạn vẫn có thể <strong>viết đánh giá cảnh báo công khai</strong> hoặc <strong>gửi khiếu nại lên Admin</strong> nếu chủ trọ chưa hoàn trả cọc đúng thỏa thuận.
                                  </p>
                                ) : (
                                  <p>Yêu cầu thuê phòng này đã được đóng trước khi bàn giao.</p>
                                )}
                              </div>

                              {isTerminated && (
                                <Link to={`/reviews?rentalId=${rental.id}&roomId=${rental.roomId}`} className="block">
                                  <Button size="sm" variant="outline" className="w-full text-xs border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100 cursor-pointer">
                                    <Star className="mr-1.5 h-3.5 w-3.5 text-amber-600" />
                                    Đánh giá Chủ trọ & Phòng trọ
                                  </Button>
                                </Link>
                              )}
                            </div>
                          )}
                        </div>

                        <div className="border-t border-slate-200/70 pt-3 text-[11px] text-slate-500 flex items-center gap-1.5">
                          <ShieldCheck className="size-3.5 text-emerald-600 shrink-0" />
                          Bảo vệ bởi cơ chế Hợp đồng Minh bạch Phòng Trọ Xanh
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal 1: Cancel Pending Request */}
      <Dialog open={!!cancelTarget} onOpenChange={(open) => !open && setCancelTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-slate-900">
              <XCircle className="size-5 text-rose-600" />
              Xác nhận rút yêu cầu thuê phòng
            </DialogTitle>
            <DialogDescription>
              Bạn đang rút yêu cầu thuê phòng <strong>{cancelTarget?.roomTitle}</strong> trước khi bàn giao nhận phòng. Phòng sẽ được mở lại cho người thuê khác.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <label className="text-xs font-semibold text-slate-700">Lý do hủy yêu cầu (tùy chọn)</label>
            <Textarea
              rows={3}
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Ví dụ: Em đã tìm được phòng khác gần trường hơn / Thay đổi kế hoạch chuyển trọ..."
              className="text-sm resize-none"
            />
          </div>
          <DialogFooter className="flex flex-row justify-end gap-2">
            <Button variant="outline" onClick={() => setCancelTarget(null)}>
              Đóng
            </Button>
            <Button
              onClick={handleCancelRequest}
              disabled={isCancelling}
              className="bg-rose-600 hover:bg-rose-700 text-white cursor-pointer"
            >
              {isCancelling ? "Đang xử lý..." : "Xác nhận rút yêu cầu"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal 2: Tenant Checkout / Liquidation */}
      <Dialog open={!!checkoutTarget} onOpenChange={(open) => !open && setCheckoutTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-slate-900">
              <LogOut className="size-5 text-emerald-600" />
              Biên bản trả phòng & Thanh lý hợp đồng
            </DialogTitle>
            <DialogDescription>
              Ghi nhận việc bàn giao trả lại phòng <strong>{checkoutTarget?.roomTitle}</strong>. Hồ sơ định danh của chủ trọ và biên bản này vẫn được lưu vĩnh viễn trong tài khoản của bạn.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900 space-y-1">
              <p className="font-semibold">Lưu ý bảo vệ tiền đặt cọc ({formatVND(checkoutTarget?.depositAmount || 0)}):</p>
              <p>Hãy ghi rõ tình trạng hoàn trả tiền cọc và đồng hồ điện/nước khi bàn giao để làm bằng chứng đối chiếu nếu phát sinh tranh chấp.</p>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700">
                Ghi chú bàn giao & Tình trạng nhận lại tiền cọc (Bắt buộc)
              </label>
              <Textarea
                rows={4}
                value={checkoutReason}
                onChange={(e) => setCheckoutReason(e.target.value)}
                placeholder="Ví dụ: Đã bàn giao phòng sạch sẽ ngày hôm nay, chủ trọ đã hoàn trả đủ 100% tiền cọc 3.500.000đ qua chuyển khoản..."
                className="mt-1.5 text-sm resize-none"
              />
            </div>
          </div>
          <DialogFooter className="flex flex-row justify-end gap-2">
            <Button variant="outline" onClick={() => setCheckoutTarget(null)}>
              Hủy
            </Button>
            <Button
              onClick={handleTenantCheckout}
              disabled={isCheckingOut}
              className="bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer"
            >
              {isCheckingOut ? "Đang lưu biên bản..." : "Xác nhận trả phòng & Thanh lý"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal 3: Report Landlord Deposit Fraud / Contract Breach */}
      <Dialog open={!!reportTarget} onOpenChange={(open) => !open && setReportTarget(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-rose-700">
              <AlertTriangle className="size-5 text-rose-600" />
              Tố cáo Chủ trọ giữ cọc trái phép / Vi phạm hợp đồng
            </DialogTitle>
            <DialogDescription>
              Hệ thống đã trích xuất hồ sơ định danh CCCD & SĐT của chủ trọ <strong>{reportTarget?.landlordName}</strong> ({reportTarget?.landlordPhone || "Đã lưu trên hệ thống"}) để gửi trực tiếp tới Ban Quản Trị.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="rounded-xl border border-rose-200 bg-rose-50/70 p-3 text-xs text-rose-900 space-y-1">
              <p className="font-bold">Cam kết bảo vệ Người thuê trên Phòng Trọ Xanh:</p>
              <p>• Chủ trọ không thể xóa dấu vết hợp đồng hoặc ẩn thông tin cá nhân sau khi đã giao dịch.</p>
              <p>• Nếu xác minh chủ trọ tự ý hủy hợp đồng không đền bù hoặc chiếm đoạt tiền cọc ({formatVND(reportTarget?.depositAmount || 0)}), Admin sẽ khóa vĩnh viễn tài khoản & toàn bộ tin đăng của chủ trọ, đồng thời cung cấp hồ sơ định danh để hỗ trợ pháp lý.</p>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700">Hành vi vi phạm của chủ trọ</label>
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white p-2.5 text-sm text-slate-800"
              >
                <option value="LUA_COC">Chiếm đoạt tiền cọc / Đơn phương hủy hợp đồng không hoàn cọc & đền bù</option>
                <option value="SAI_GIA">Tự ý tăng giá thuê / Thu phụ phí trái thỏa thuận hợp đồng</option>
                <option value="TIN_GIA">Phòng bàn giao không đúng mô tả thực tế</option>
                <option value="KHAC">Hành vi vi phạm khác</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700">
                Mô tả chi tiết sự việc & Số tiền cọc bị thiệt hại (Bắt buộc)
              </label>
              <Textarea
                rows={4}
                value={reportDetail}
                onChange={(e) => setReportDetail(e.target.value)}
                placeholder="Nêu rõ ngày chuyển cọc, số tiền, việc chủ trọ tự ý hủy hợp đồng hoặc không liên lạc được..."
                className="mt-1.5 text-sm resize-none"
              />
            </div>
          </div>
          <DialogFooter className="flex flex-row justify-end gap-2">
            <Button variant="outline" onClick={() => setReportTarget(null)}>
              Hủy
            </Button>
            <Button
              onClick={handleReportLandlord}
              disabled={isSubmittingReport}
              className="bg-rose-600 hover:bg-rose-700 text-white cursor-pointer"
            >
              {isSubmittingReport ? "Đang gửi khẩn cấp..." : "Gửi hồ sơ tố cáo lên Admin"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
