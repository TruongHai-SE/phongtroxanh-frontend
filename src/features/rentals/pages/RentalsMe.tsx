import { Link } from "react-router";
import { useRentals } from "../hooks/useRentals";
import { formatVND, formatDate } from "@/lib/utils";
import {
  FileText,
  Calendar,
  Home,
  UserCheck,
  CheckCircle2,
  Clock,
  ArrowRight,
  RefreshCw,
  AlertCircle,
  Repeat,
  Star,
  Phone,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { rentalsApi } from "../api/rentalsApi";

export default function RentalsMe() {
  const { rentals, isLoading, isError, isEmpty, errorMessage, refetch } = useRentals();

  const handleConfirmReceipt = async (rentalId: string) => {
    try {
      await rentalsApi.verifyCheckIn(rentalId, { checkInCode: "CONFIRM" });
      toast.success("Xác nhận nhận phòng thành công! Đã cộng +10 điểm TrustScore.");
      refetch();
    } catch (err: any) {
      toast.error(err.message || "Không thể xác nhận nhận phòng.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20 pt-6">
      <div className="mx-auto max-w-5xl px-4">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Hợp đồng thuê của tôi
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Quản lý hợp đồng đang hiệu lực, lịch sử thuê phòng và biên bản nhận phòng
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isLoading}
            className="flex items-center gap-2 self-start sm:self-auto"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            Làm mới
          </Button>
        </div>

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
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center shadow-sm">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
              <Home className="h-8 w-8" />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-slate-900">Bạn chưa có hợp đồng thuê nào</h3>
            <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
              Tìm kiếm phòng trọ ưng ý, kết nối trực tiếp với chủ trọ uy tín và ký hợp đồng minh bạch trên Phòng Trọ Xanh.
            </p>
            <div className="mt-6 flex justify-center gap-3">
              <Link to="/discover">
                <Button className="bg-emerald-600 hover:bg-emerald-700">Khám phá phòng trọ</Button>
              </Link>
            </div>
          </div>
        )}

        {/* 4. Success State */}
        {!isLoading && !isError && !isEmpty && (
          <div className="space-y-6">
            {rentals.map((rental) => (
              <div
                key={rental.id}
                className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all hover:shadow-md"
              >
                <div className="border-b border-slate-100 bg-slate-50/70 px-6 py-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-emerald-600" />
                      <span className="font-semibold text-slate-800">Mã HĐ: #{rental.id.slice(-8).toUpperCase()}</span>
                    </div>
                    <div>
                      {(rental.status === "CHECKED_IN" || (rental.status as any) === "ACTIVE") && (
                        <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
                          <CheckCircle2 className="mr-1 h-3.5 w-3.5" /> Đang hiệu lực
                        </Badge>
                      )}
                      {(rental.status === "PENDING_CHECKIN" || (rental.status as any) === "PENDING") && (
                        <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">
                          <Clock className="mr-1 h-3.5 w-3.5" /> Chờ nhận phòng
                        </Badge>
                      )}
                      {rental.status === "TERMINATED" && (
                        <Badge variant="destructive">Đã kết thúc hợp đồng</Badge>
                      )}
                      {rental.status === "CANCELLED" && (
                        <Badge variant="secondary">Đã hủy</Badge>
                      )}
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                    {/* Column 1: Room Details */}
                    <div className="space-y-2 md:col-span-2">
                      <h2 className="text-lg font-bold text-slate-900">
                        <Link to={`/rooms/${rental.roomId}`} className="hover:text-emerald-600">
                          {rental.roomTitle}
                        </Link>
                      </h2>
                      <p className="text-sm text-slate-600 flex items-center gap-1.5">
                        <Home className="h-4 w-4 text-slate-400 shrink-0" />
                        {rental.roomAddress || rental.roomDistrict || "Địa chỉ cập nhật theo hợp đồng"}
                      </p>

                      <div className="mt-4 grid grid-cols-2 gap-4 rounded-xl bg-slate-50 p-4 sm:grid-cols-3">
                        <div>
                          <p className="text-xs text-slate-500">Tiền thuê hàng tháng</p>
                          <p className="font-bold text-emerald-600">{formatVND(rental.monthlyRent)}/tháng</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500">Tiền đặt cọc</p>
                          <p className="font-semibold text-slate-800">{formatVND(rental.depositAmount)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500">Thời hạn</p>
                          <p className="font-medium text-slate-700">
                            {formatDate(rental.startDate)} → {rental.endDate ? formatDate(rental.endDate) : "Dài hạn"}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Column 2: Landlord & Actions */}
                    <div className="flex flex-col justify-between space-y-4 rounded-xl border border-slate-100 bg-slate-50/50 p-4">
                      <div>
                        <p className="text-xs font-medium uppercase tracking-wider text-slate-400">Chủ trọ phụ trách</p>
                        <p className="mt-1 font-semibold text-slate-800">{rental.landlordName}</p>
                        {rental.landlordPhone && (
                          <p className="mt-0.5 text-xs text-slate-600 flex items-center gap-1">
                            <Phone className="h-3 w-3 text-slate-400" />
                            {rental.landlordPhone}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        {rental.status === "CHECKED_IN" || (rental as any).checkedIn || !!(rental as any).checkInAt ? (
                          <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 bg-emerald-50 p-2.5 rounded-xl border border-emerald-200">
                            <CheckCircle2 className="h-4 w-4" /> Đã bàn giao & nhận phòng
                          </div>
                        ) : (
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-1.5 text-xs text-amber-700 bg-amber-50 p-2 rounded-lg border border-amber-200">
                              <Clock className="h-3.5 w-3.5 text-amber-600 shrink-0" /> Chờ nhận phòng từ chủ trọ
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleConfirmReceipt(rental.id)}
                              className="w-full text-xs font-semibold border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 cursor-pointer"
                            >
                              <CheckCircle2 className="mr-1.5 h-3.5 w-3.5 text-emerald-600" />
                              Xác nhận đã nhận phòng (+10 TrustScore)
                            </Button>
                          </div>
                        )}

                        <div className="flex gap-2">
                          <Link to="/swap" className="flex-1">
                            <Button size="sm" variant="outline" className="w-full text-xs">
                              <Repeat className="mr-1.5 h-3.5 w-3.5 text-slate-500" /> Pass/Đổi phòng
                            </Button>
                          </Link>
                          <Link to={`/reviews?rentalId=${rental.id}&roomId=${rental.roomId}`} className="flex-1">
                            <Button size="sm" variant="outline" className="w-full text-xs cursor-pointer">
                              <Star className="mr-1.5 h-3.5 w-3.5 text-amber-500" /> Đánh giá
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
