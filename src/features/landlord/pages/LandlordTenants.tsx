import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router";
import {
  MessageCircle,
  Star,
  ShieldCheck,
  Clock,
  Loader2,
  Users,
  CheckCircle2,
  XCircle,
  Eye,
  Calendar,
  Phone,
  Mail,
  GraduationCap,
  FileText,
  AlertTriangle,
  RefreshCw,
  KeyRound,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { rentalsApi } from "@/features/rentals/api/rentalsApi";
import { chatApi } from "@/features/chat/api/chatApi";
import { formatVND, getInitials, cn } from "@/lib/utils";
import { toast } from "sonner";

interface TenantItem {
  id: string;
  roomId: string;
  tenantId: string;
  name: string;
  avatar: string;
  room: string;
  roomAddress?: string;
  trust: number;
  verified: boolean;
  status: "PENDING_CHECKIN" | "CHECKED_IN" | "TERMINATED" | "CANCELLED";
  approvalStatus: "PENDING_APPROVAL" | "APPROVED" | "CHECKED_IN" | "TERMINATED" | "CANCELLED";
  viewingDateRaw?: string;
  startDateRaw: string;
  viewingDateFormatted: string;
  moveInDateFormatted: string;
  monthlyRent: number;
  depositAmount: number;
  phone?: string;
  email?: string;
  school?: string;
  gender?: string;
  birthYear?: number;
  bio?: string;
  message?: string;
  checkInAt?: string;
}

type FilterTab = "all" | "pending_approval" | "approved" | "active" | "closed";

export default function LandlordTenants() {
  const navigate = useNavigate();
  const [tenants, setTenants] = useState<TenantItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterTab, setFilterTab] = useState<FilterTab>("all");
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Modal 1: Xem hồ sơ người thuê & chi tiết yêu cầu thuê
  const [selectedTenant, setSelectedTenant] = useState<TenantItem | null>(null);

  // Modal 2: Từ chối yêu cầu thuê
  const [rejectTarget, setRejectTarget] = useState<TenantItem | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [isRejecting, setIsRejecting] = useState(false);

  // Modal 3: Biên bản Thanh lý hợp đồng & Cam kết hoàn cọc
  const [terminateTarget, setTerminateTarget] = useState<TenantItem | null>(null);
  const [terminationType, setTerminationType] = useState("MUTUAL_AGREEMENT");
  const [terminateReason, setTerminateReason] = useState("");
  const [agreedTerminateLegal, setAgreedTerminateLegal] = useState(false);
  const [isTerminating, setIsTerminating] = useState(false);

  const loadTenants = useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      const data = await rentalsApi.getMyLandlordRentals();
      if (Array.isArray(data) && data.length > 0) {
        const mapped: TenantItem[] = data.map((r: any, idx: number) => {
          const status = (r.status || "PENDING_CHECKIN") as TenantItem["status"];
          const approvalStatus = (r.approvalStatus ||
            (status === "CHECKED_IN"
              ? "CHECKED_IN"
              : status === "TERMINATED"
              ? "TERMINATED"
              : status === "CANCELLED"
              ? "CANCELLED"
              : "PENDING_APPROVAL")) as TenantItem["approvalStatus"];

          return {
            id: String(r.id),
            roomId: String(r.roomId || ""),
            tenantId: String(r.tenantId || ""),
            name: r.tenantName || `Khách thuê #${idx + 1}`,
            avatar: r.tenantAvatar || "",
            room: r.roomTitle || r.roomAddress || "Phòng trọ",
            roomAddress: r.roomAddress,
            trust: r.tenantTrustScore ?? 50,
            verified: Boolean(r.tenantVerified),
            status,
            approvalStatus,
            viewingDateRaw: r.viewingDate || r.endDate || r.startDate || "",
            startDateRaw: r.startDate || "",
            viewingDateFormatted:
              r.viewingDate || r.endDate || r.startDate
                ? new Date(r.viewingDate || r.endDate || r.startDate).toLocaleDateString("vi-VN")
                : "Thỏa thuận qua chat",
            moveInDateFormatted: r.startDate
              ? new Date(r.startDate).toLocaleDateString("vi-VN")
              : "Chưa cập nhật",
            monthlyRent: Number(r.monthlyRent || 0),
            depositAmount: Number(r.depositAmount || 0),
            phone: r.tenantPhone,
            email: r.tenantEmail,
            school: r.tenantSchool,
            gender: r.tenantGender,
            birthYear: r.tenantBirthYear,
            bio: r.tenantBio,
            message: r.tenantMessage,
            checkInAt: r.checkInAt,
          };
        });
        setTenants(mapped);
      } else {
        setTenants([]);
      }
    } catch (err) {
      if (!silent) {
        console.warn("Could not load /rentals/landlord/me:", err);
        setTenants([]);
      }
    } finally {
      if (!silent) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTenants(false);
    const timer = setInterval(() => loadTenants(true), 8000);
    return () => clearInterval(timer);
  }, [loadTenants]);

  const pendingApprovalCount = tenants.filter((t) => t.approvalStatus === "PENDING_APPROVAL").length;
  const approvedWaitingCount = tenants.filter((t) => t.approvalStatus === "APPROVED").length;
  const checkedInCount = tenants.filter((t) => t.status === "CHECKED_IN").length;
  const avgTrust =
    tenants.length > 0
      ? Math.round(tenants.reduce((a, t) => a + t.trust, 0) / tenants.length)
      : 0;

  const filteredTenants = tenants.filter((t) => {
    if (filterTab === "pending_approval") return t.approvalStatus === "PENDING_APPROVAL";
    if (filterTab === "approved") return t.approvalStatus === "APPROVED";
    if (filterTab === "active") return t.status === "CHECKED_IN";
    if (filterTab === "closed") return t.status === "TERMINATED" || t.status === "CANCELLED";
    return true;
  });

  // 1. Chủ trọ bấm Duyệt yêu cầu thuê
  const handleApproveRequest = async (item: TenantItem) => {
    setProcessingId(item.id);
    try {
      await rentalsApi.approveRental(item.id);
      toast.success(
        `Đã duyệt yêu cầu thuê của ${item.name}! Hệ thống đã gửi thông báo thời gian thực để người thuê vào mục 'Phòng của tôi' kiểm tra.`
      );
      await loadTenants(true);
      if (selectedTenant?.id === item.id) {
        setSelectedTenant((prev) => (prev ? { ...prev, approvalStatus: "APPROVED" } : null));
      }
    } catch (err: any) {
      toast.error(err.message || "Không thể duyệt yêu cầu thuê phòng.");
    } finally {
      setProcessingId(null);
    }
  };

  // 2. Chủ trọ bấm Từ chối yêu cầu thuê
  const handleConfirmReject = async () => {
    if (!rejectTarget) return;
    if (!rejectReason.trim()) {
      toast.error("Vui lòng nhập lý do từ chối để thông báo rõ ràng cho người thuê.");
      return;
    }
    setIsRejecting(true);
    try {
      await rentalsApi.cancelRental(rejectTarget.id, rejectReason.trim());
      toast.info(`Đã từ chối yêu cầu thuê của ${rejectTarget.name} và mở lại phòng.`);
      setRejectTarget(null);
      setRejectReason("");
      setSelectedTenant(null);
      await loadTenants(true);
    } catch (err: any) {
      toast.error(err.message || "Không thể từ chối yêu cầu thuê.");
    } finally {
      setIsRejecting(false);
    }
  };

  // 3. Chủ trọ xác nhận Bàn giao phòng
  const handleConfirmHandover = async (rentalId: string) => {
    setProcessingId(rentalId);
    try {
      await rentalsApi.verifyCheckIn(rentalId, { checkInCode: "HANDOVER" });
      toast.success("Bàn giao phòng thành công! Hợp đồng đã có hiệu lực và cộng +10 TrustScore.");
      await loadTenants(true);
      setSelectedTenant(null);
    } catch (err: any) {
      toast.error(err.message || "Không thể xác nhận bàn giao phòng.");
    } finally {
      setProcessingId(null);
    }
  };

  // 4. Mở cuộc trò chuyện trực tiếp với người thuê
  const handleOpenChatWithTenant = async (item: TenantItem) => {
    if (!item.tenantId) {
      navigate("/landlord?tab=chat");
      return;
    }
    try {
      const conv = await chatApi.createConversation({
        partnerId: item.tenantId,
        roomId: item.roomId || undefined,
        type: "ROOM",
      });
      if (conv?.id) {
        navigate(`/landlord?tab=chat&cid=${conv.id}`);
        return;
      }
    } catch {
      // Fallback to chat tab
    }
    navigate(`/landlord?tab=chat&partnerId=${item.tenantId}`);
  };

  // 5. Thanh lý hợp đồng đang hiệu lực (Có kiểm tra pháp lý & hoàn cọc)
  const handleConfirmTerminate = async () => {
    if (!terminateTarget) return;
    if (!terminateReason.trim()) {
      toast.error("Vui lòng ghi rõ nội dung biên bản thanh lý và tình trạng hoàn trả tiền cọc.");
      return;
    }
    if (!agreedTerminateLegal) {
      toast.error("Vui lòng xác nhận cam kết trách nhiệm hoàn trả tiền đặt cọc và lưu trữ biên bản hợp đồng.");
      return;
    }

    setIsTerminating(true);
    try {
      await rentalsApi.terminateRental(terminateTarget.id, {
        reason: terminateReason.trim(),
        terminationType,
      });
      toast.success("Đã lập biên bản thanh lý hợp đồng và chuyển trạng thái phòng về Còn trống.");
      setTerminateTarget(null);
      setTerminateReason("");
      setAgreedTerminateLegal(false);
      await loadTenants(true);
    } catch (err: any) {
      toast.error(err.message || "Không thể thanh lý hợp đồng.");
    } finally {
      setIsTerminating(false);
    }
  };

  const getMoveInDateAssessment = (startDateRaw: string) => {
    if (!startDateRaw) return null;
    const diffDays = Math.ceil(
      (new Date(startDateRaw).getTime() - new Date().setHours(0, 0, 0, 0)) / (1000 * 60 * 60 * 24)
    );
    if (diffDays < 0) {
      return {
        tone: "amber",
        text: `Ngày dự kiến vào ở đã qua (${Math.abs(diffDays)} ngày trước) — hãy nhắn tin chốt lại ngày vào ở với khách.`,
      };
    }
    if (diffDays <= 14) {
      return {
        tone: "emerald",
        text: `Ngày vào ở hợp lý (còn ${diffDays === 0 ? "hôm nay" : `${diffDays} ngày nữa`}) — khách có nhu cầu vào ở sớm, hạn chế trống phòng.`,
      };
    }
    return {
      tone: "blue",
      text: `Khách đặt lịch vào ở sau ${diffDays} ngày nữa — hãy trao đổi kỹ về tiền cọc giữ phòng trước khi duyệt.`,
    };
  };

  const renderStatusBadge = (t: TenantItem) => {
    if (t.status === "CHECKED_IN") {
      return (
        <Badge className="gap-1 bg-emerald-100 text-emerald-800 border-emerald-200">
          <CheckCircle2 className="size-3" /> Đang thuê thực tế
        </Badge>
      );
    }
    if (t.status === "TERMINATED") {
      return (
        <Badge variant="secondary" className="bg-slate-100 text-slate-700 border-slate-200">
          Đã thanh lý HĐ
        </Badge>
      );
    }
    if (t.status === "CANCELLED") {
      return (
        <Badge variant="outline" className="text-rose-700 border-rose-200 bg-rose-50">
          Đã từ chối / Hủy
        </Badge>
      );
    }
    if (t.approvalStatus === "PENDING_APPROVAL") {
      return (
        <Badge className="gap-1 bg-amber-100 text-amber-900 border-amber-300">
          <Clock className="size-3" /> Chờ bạn duyệt yêu cầu
        </Badge>
      );
    }
    return (
      <Badge className="gap-1 bg-sky-100 text-sky-800 border-sky-200">
        <KeyRound className="size-3" /> Đã duyệt • Chờ bàn giao
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="brand text-2xl text-foreground flex items-center gap-2">
            Quản lý Yêu cầu thuê & Người thuê
          </h1>
          <p className="text-sm text-muted-foreground">
            Xem hồ sơ người đăng ký thuê, kiểm tra ngày vào ở, nhắn tin thương lượng rồi mới duyệt và bàn giao phòng
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => loadTenants(false)}
          disabled={isLoading}
          className="gap-1.5 self-start sm:self-auto cursor-pointer"
        >
          <RefreshCw className={cn("size-3.5", isLoading && "animate-spin")} />
          Làm mới
        </Button>
      </div>

      {/* 4 Summary Metrics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl bg-card p-4 ring-1 ring-border">
          <p className="text-xs text-muted-foreground">Yêu cầu chờ bạn duyệt</p>
          <p className="text-2xl font-bold text-amber-600 mt-1">{pendingApprovalCount}</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">Cần xem hồ sơ & ngày vào ở</p>
        </div>
        <div className="rounded-2xl bg-card p-4 ring-1 ring-border">
          <p className="text-xs text-muted-foreground">Đã duyệt • Chờ nhận phòng</p>
          <p className="text-2xl font-bold text-sky-600 mt-1">{approvedWaitingCount}</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">Sẵn sàng bàn giao thực tế</p>
        </div>
        <div className="rounded-2xl bg-card p-4 ring-1 ring-border">
          <p className="text-xs text-muted-foreground">Đang thuê (Đã nhận phòng)</p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">{checkedInCount}</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">Hợp đồng đang hiệu lực</p>
        </div>
        <div className="rounded-2xl bg-card p-4 ring-1 ring-border">
          <p className="text-xs text-muted-foreground">Điểm uy tín TB / CCCD</p>
          <p className="text-2xl font-bold text-primary mt-1">
            {tenants.length > 0 ? `${avgTrust}đ` : "—"}
          </p>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            {tenants.filter((t) => t.verified).length}/{tenants.length} đã xác thực CCCD
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap border-b border-border gap-1">
        {[
          { id: "all", label: `Tất cả (${tenants.length})` },
          { id: "pending_approval", label: `Chờ duyệt yêu cầu (${pendingApprovalCount})` },
          { id: "approved", label: `Chờ bàn giao (${approvedWaitingCount})` },
          { id: "active", label: `Đang thuê (${checkedInCount})` },
          {
            id: "closed",
            label: `Đã thanh lý / Đã hủy (${
              tenants.filter((t) => t.status === "TERMINATED" || t.status === "CANCELLED").length
            })`,
          },
        ].map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setFilterTab(item.id as FilterTab)}
            className={cn(
              "pb-2.5 px-3.5 text-xs font-semibold transition-all cursor-pointer border-b-2",
              filterTab === item.id
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="size-8 animate-spin text-primary" />
          <span className="ml-2 text-sm text-muted-foreground">
            Đang tải danh sách yêu cầu thuê & hợp đồng...
          </span>
        </div>
      ) : filteredTenants.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-card ring-1 ring-border border-dashed border-border">
          <Users className="size-12 mx-auto text-muted-foreground/50 mb-3" />
          <h3 className="font-semibold text-foreground">Chưa có dữ liệu trong mục này</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Khi người thuê bấm &ldquo;Đăng ký thuê phòng&rdquo;, yêu cầu kèm hồ sơ và ngày vào ở sẽ hiển thị tại đây để bạn duyệt.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl bg-card ring-1 ring-border shadow-2xs">
          <Table>
            <TableHeader>
              <TableRow className="bg-secondary/50">
                <TableHead>Người đăng ký / Người thuê</TableHead>
                <TableHead>Phòng & Tiền cọc</TableHead>
                <TableHead>Lịch hẹn xem & Ngày vào ở</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead>TrustScore</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTenants.map((t) => (
                <TableRow key={t.id} className="hover:bg-muted/30">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="size-10 ring-1 ring-border">
                        <AvatarImage src={t.avatar || undefined} />
                        <AvatarFallback className="bg-emerald-100 text-emerald-800 text-xs font-semibold">
                          {getInitials(t.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-semibold text-foreground">{t.name}</p>
                        <div className="flex flex-wrap items-center gap-2 mt-0.5">
                          {t.verified ? (
                            <span className="inline-flex items-center gap-1 text-[11px] text-primary font-medium">
                              <ShieldCheck className="size-3" /> Đã xác thực CCCD
                            </span>
                          ) : (
                            <span className="text-[11px] text-muted-foreground">Chưa xác thực CCCD</span>
                          )}
                          {t.school && (
                            <span className="text-[11px] text-muted-foreground">• {t.school}</span>
                          )}
                        </div>
                        {t.phone && <p className="text-xs text-muted-foreground">{t.phone}</p>}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <p className="text-sm font-medium line-clamp-1">{t.room}</p>
                    <p className="text-xs text-muted-foreground">
                      Thuê: <strong className="text-emerald-700">{formatVND(t.monthlyRent)}</strong> • Cọc:{" "}
                      <strong>{formatVND(t.depositAmount)}</strong>
                    </p>
                  </TableCell>
                  <TableCell>
                    <p className="text-xs text-muted-foreground">
                      Hẹn xem: <strong className="text-foreground">{t.viewingDateFormatted}</strong>
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Dự kiến vào ở: <strong className="text-emerald-700">{t.moveInDateFormatted}</strong>
                    </p>
                    {t.message && (
                      <p className="text-[11px] text-muted-foreground line-clamp-1 max-w-[220px] italic mt-0.5">
                        &ldquo;{t.message}&rdquo;
                      </p>
                    )}
                  </TableCell>
                  <TableCell>{renderStatusBadge(t)}</TableCell>
                  <TableCell>
                    <span className="inline-flex items-center gap-1 text-sm font-semibold">
                      <Star className="size-3.5 fill-amber-400 text-amber-400" /> {t.trust}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex flex-wrap justify-end gap-1.5">
                      {/* Nút Xem hồ sơ & yêu cầu */}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedTenant(t)}
                        className="text-xs gap-1 cursor-pointer h-8"
                      >
                        <Eye className="size-3.5" /> Hồ sơ
                      </Button>

                      {/* Bước 1: Chờ chủ trọ duyệt yêu cầu */}
                      {t.status === "PENDING_CHECKIN" && t.approvalStatus === "PENDING_APPROVAL" && (
                        <>
                          <Button
                            size="sm"
                            disabled={processingId === t.id}
                            onClick={() => handleApproveRequest(t)}
                            className="text-xs font-semibold cursor-pointer bg-emerald-600 hover:bg-emerald-700 text-white h-8 gap-1"
                          >
                            {processingId === t.id ? (
                              <Loader2 className="size-3.5 animate-spin" />
                            ) : (
                              <Check className="size-3.5" />
                            )}
                            Duyệt yêu cầu
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setRejectTarget(t);
                              setRejectReason("");
                            }}
                            className="text-xs text-rose-600 border-rose-200 hover:bg-rose-50 cursor-pointer h-8"
                          >
                            Từ chối
                          </Button>
                        </>
                      )}

                      {/* Bước 2: Đã duyệt -> Chờ bàn giao phòng thực tế */}
                      {t.status === "PENDING_CHECKIN" && t.approvalStatus === "APPROVED" && (
                        <>
                          <Button
                            size="sm"
                            disabled={processingId === t.id}
                            onClick={() => handleConfirmHandover(t.id)}
                            className="text-xs font-semibold cursor-pointer bg-emerald-600 hover:bg-emerald-700 text-white h-8 gap-1"
                          >
                            {processingId === t.id ? (
                              <Loader2 className="size-3.5 animate-spin" />
                            ) : (
                              <KeyRound className="size-3.5" />
                            )}
                            Bàn giao phòng
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setRejectTarget(t);
                              setRejectReason("");
                            }}
                            className="text-xs text-rose-600 border-rose-200 hover:bg-rose-50 cursor-pointer h-8"
                          >
                            Hủy
                          </Button>
                        </>
                      )}

                      {/* Bước 3: Đang thuê thực tế -> Đánh giá hoặc Thanh lý hợp đồng */}
                      {t.status === "CHECKED_IN" && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => navigate(`/landlord?tab=reviews&rentalId=${t.id}`)}
                            className="text-xs font-semibold cursor-pointer h-8"
                          >
                            Đánh giá
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setTerminateTarget(t);
                              setTerminationType("MUTUAL_AGREEMENT");
                              setTerminateReason("");
                              setAgreedTerminateLegal(false);
                            }}
                            className="text-xs text-amber-800 border-amber-300 hover:bg-amber-50 cursor-pointer h-8"
                          >
                            Thanh lý HĐ
                          </Button>
                        </>
                      )}

                      {/* Nút nhắn tin trực tiếp với người thuê */}
                      <Button
                        size="sm"
                        variant="ghost"
                        title="Nhắn tin trao đổi với người thuê này"
                        onClick={() => handleOpenChatWithTenant(t)}
                        className="cursor-pointer h-8 px-2 text-primary hover:bg-mint/50"
                      >
                        <MessageCircle className="size-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* MODAL 1: XEM HỒ SƠ NGƯỜI MUỐN THUÊ & DUYỆT YÊU CẦU */}
      <Dialog open={!!selectedTenant} onOpenChange={(open) => !open && setSelectedTenant(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold">
              <Users className="size-5 text-primary" />
              Hồ sơ người thuê & Chi tiết yêu cầu thuê phòng
            </DialogTitle>
            <DialogDescription className="text-xs">
              Kiểm tra kỹ thông tin định danh, điểm uy tín và ngày dự kiến vào ở trước khi phê duyệt hoặc bàn giao phòng.
            </DialogDescription>
          </DialogHeader>

          {selectedTenant && (
            <div className="space-y-4 py-1 text-xs">
              {/* Khối thông tin cá nhân người thuê */}
              <div className="flex items-start gap-3.5 rounded-2xl bg-slate-50 p-4 border border-slate-200/80">
                <Avatar className="size-14 ring-2 ring-primary/20 shrink-0">
                  <AvatarImage src={selectedTenant.avatar || undefined} />
                  <AvatarFallback className="bg-emerald-100 text-emerald-800 font-bold text-sm">
                    {getInitials(selectedTenant.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-1 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-sm font-bold text-slate-900">{selectedTenant.name}</h3>
                    {selectedTenant.verified ? (
                      <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 text-[10px] gap-1">
                        <ShieldCheck className="size-3" /> Đã xác thực CCCD
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-[10px]">
                        Chưa xác thực CCCD
                      </Badge>
                    )}
                    <Badge variant="secondary" className="text-[10px] gap-1">
                      <Star className="size-3 fill-amber-400 text-amber-400" /> TrustScore: {selectedTenant.trust}/100
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1 text-slate-600">
                    {selectedTenant.phone && (
                      <p className="flex items-center gap-1.5">
                        <Phone className="size-3.5 text-primary shrink-0" /> {selectedTenant.phone}
                      </p>
                    )}
                    {selectedTenant.email && (
                      <p className="flex items-center gap-1.5 truncate">
                        <Mail className="size-3.5 text-primary shrink-0" /> {selectedTenant.email}
                      </p>
                    )}
                    {selectedTenant.school && (
                      <p className="flex items-center gap-1.5 sm:col-span-2">
                        <GraduationCap className="size-3.5 text-primary shrink-0" /> Trường / Nơi làm việc:{" "}
                        <strong className="text-slate-800">{selectedTenant.school}</strong>
                      </p>
                    )}
                    {(selectedTenant.birthYear || selectedTenant.gender) && (
                      <p className="sm:col-span-2 text-slate-600">
                        {selectedTenant.birthYear ? `Năm sinh: ${selectedTenant.birthYear}` : ""}
                        {selectedTenant.birthYear && selectedTenant.gender ? " • " : ""}
                        {selectedTenant.gender
                          ? `Giới tính: ${
                              selectedTenant.gender === "MALE"
                                ? "Nam"
                                : selectedTenant.gender === "FEMALE"
                                ? "Nữ"
                                : "Khác"
                            }`
                          : ""}
                      </p>
                    )}
                  </div>

                  {selectedTenant.bio && (
                    <p className="mt-2 rounded-lg bg-white p-2.5 border border-slate-200/70 text-slate-700 italic">
                      &ldquo;{selectedTenant.bio}&rdquo;
                    </p>
                  )}
                </div>
              </div>

              {/* Khối thông tin phòng, ngày vào ở & đánh giá lịch vào ở */}
              <div className="rounded-2xl border border-border p-4 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Phòng đăng ký thuê:</span>
                  <span className="font-bold text-slate-900">{selectedTenant.room}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Tiền thuê & Tiền đặt cọc:</span>
                  <span className="font-semibold text-emerald-700">
                    {formatVND(selectedTenant.monthlyRent)}/tháng • Cọc {formatVND(selectedTenant.depositAmount)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 flex items-center gap-1">
                    <Calendar className="size-3.5 text-primary" /> Ngày hẹn gặp xem phòng:
                  </span>
                  <span className="font-bold text-slate-900">
                    {selectedTenant.viewingDateFormatted}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 flex items-center gap-1">
                    <Calendar className="size-3.5 text-emerald-600" /> Ngày dự kiến dọn vào ở:
                  </span>
                  <span className="font-bold text-emerald-700">
                    {selectedTenant.moveInDateFormatted}
                  </span>
                </div>

                {(() => {
                  const assessment = getMoveInDateAssessment(selectedTenant.startDateRaw);
                  if (!assessment || selectedTenant.status !== "PENDING_CHECKIN") return null;
                  return (
                    <div
                      className={cn(
                        "rounded-xl p-2.5 border text-[11px] leading-relaxed",
                        assessment.tone === "emerald"
                          ? "bg-emerald-50/80 border-emerald-200 text-emerald-900"
                          : assessment.tone === "amber"
                          ? "bg-amber-50/80 border-amber-200 text-amber-900"
                          : "bg-sky-50/80 border-sky-200 text-sky-900"
                      )}
                    >
                      <strong>Đánh giá lịch vào ở:</strong> {assessment.text}
                    </div>
                  );
                })()}

                {selectedTenant.message && (
                  <div className="pt-1">
                    <p className="text-slate-500 mb-1 font-medium">Lời nhắn / Ghi chú hợp đồng:</p>
                    <div className="rounded-xl bg-slate-50 p-3 border border-slate-200 text-slate-800">
                      {selectedTenant.message}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          <DialogFooter className="flex flex-wrap items-center justify-between gap-2 sm:justify-between">
            {selectedTenant && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleOpenChatWithTenant(selectedTenant)}
                className="gap-1.5 text-xs border-primary/40 text-primary hover:bg-mint/40 cursor-pointer"
              >
                <MessageCircle className="size-3.5" /> Nhắn tin trao đổi
              </Button>
            )}
            <div className="flex items-center gap-2">
              <Button type="button" variant="ghost" size="sm" onClick={() => setSelectedTenant(null)}>
                Đóng
              </Button>
              {selectedTenant?.status === "PENDING_CHECKIN" &&
                selectedTenant.approvalStatus === "PENDING_APPROVAL" && (
                  <>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="text-xs text-rose-600 border-rose-200 hover:bg-rose-50 cursor-pointer"
                      onClick={() => {
                        setRejectTarget(selectedTenant);
                        setRejectReason("");
                      }}
                    >
                      Từ chối
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      disabled={processingId === selectedTenant.id}
                      onClick={() => handleApproveRequest(selectedTenant)}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold gap-1 cursor-pointer"
                    >
                      <Check className="size-3.5" /> Duyệt yêu cầu thuê
                    </Button>
                  </>
                )}
              {selectedTenant?.status === "PENDING_CHECKIN" &&
                selectedTenant.approvalStatus === "APPROVED" && (
                  <Button
                    type="button"
                    size="sm"
                    disabled={processingId === selectedTenant.id}
                    onClick={() => handleConfirmHandover(selectedTenant.id)}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold gap-1 cursor-pointer"
                  >
                    <KeyRound className="size-3.5" /> Xác nhận bàn giao phòng
                  </Button>
                )}
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL 2: TỪ CHỐI / HỦY YÊU CẦU THUÊ */}
      <Dialog open={!!rejectTarget} onOpenChange={(open) => !open && setRejectTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-rose-600 text-base">
              <XCircle className="size-5" /> Từ chối yêu cầu thuê phòng
            </DialogTitle>
            <DialogDescription className="text-xs">
              Gửi lý do rõ ràng cho {rejectTarget?.name}. Sau khi từ chối, phòng sẽ được mở lại để khách thuê khác đăng ký.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            <div className="flex flex-wrap gap-1.5">
              {[
                "Ngày dự kiến vào ở quá xa, mình ưu tiên khách vào ở ngay",
                "Phòng vừa nhận cọc từ khách xem trực tiếp trước đó",
                "Thời hạn thuê chưa phù hợp với quy định nhà trọ",
              ].map((sample) => (
                <button
                  key={sample}
                  type="button"
                  onClick={() => setRejectReason(sample)}
                  className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] text-slate-700 hover:border-primary/40 hover:bg-mint/30 cursor-pointer"
                >
                  {sample}
                </button>
              ))}
            </div>
            <Textarea
              rows={3}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Nhập lý do từ chối yêu cầu thuê..."
              className="text-xs"
            />
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setRejectTarget(null)}>
              Hủy
            </Button>
            <Button
              size="sm"
              disabled={isRejecting}
              onClick={handleConfirmReject}
              className="bg-rose-600 hover:bg-rose-700 text-white text-xs cursor-pointer"
            >
              {isRejecting ? "Đang xử lý..." : "Xác nhận từ chối"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL 3: BIÊN BẢN THANH LÝ HỢP ĐỒNG & CAM KẾT BẢO VỆ TIỀN CỌC */}
      <Dialog open={!!terminateTarget} onOpenChange={(open) => !open && setTerminateTarget(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-800 text-base">
              <FileText className="size-5 text-amber-600" />
              Biên bản Thanh lý Hợp đồng & Cam kết Tiền đặt cọc
            </DialogTitle>
            <DialogDescription className="text-xs">
              Hợp đồng của <strong>{terminateTarget?.name}</strong> tại <strong>{terminateTarget?.room}</strong> đang có hiệu lực.
            </DialogDescription>
          </DialogHeader>

          {terminateTarget && (
            <div className="space-y-3.5 py-1 text-xs">
              <div className="rounded-xl bg-amber-50/90 border border-amber-200 p-3.5 space-y-1.5 text-amber-950">
                <p className="font-bold flex items-center gap-1.5">
                  <AlertTriangle className="size-4 text-amber-600 shrink-0" />
                  Quy định bảo vệ người thuê & Chống đơn phương hủy hợp đồng trái phép
                </p>
                <p className="text-[11px] leading-relaxed text-amber-900">
                  • Theo <strong>Điều 428 Bộ luật Dân sự 2015</strong> và <strong>Luật Nhà ở</strong>: Nếu Chủ trọ đơn phương chấm dứt thuê phòng trước thỏa thuận mà không do lỗi của người thuê, Chủ trọ phải <strong>hoàn trả 100% tiền đặt cọc ({formatVND(terminateTarget.depositAmount)}) và bồi thường khoản tương đương tiền cọc</strong>, đồng thời bị hệ thống <strong>trừ 15 điểm TrustScore</strong>.
                </p>
                <p className="text-[11px] leading-relaxed text-amber-900">
                  • <strong>Chống xóa dấu vết:</strong> Sau khi thanh lý, toàn bộ thông tin định danh của Chủ trọ (Họ tên, SĐT, CCCD, địa chỉ phòng, tiền cọc và biên bản này) <strong>vẫn được lưu giữ vĩnh viễn</strong> trong mục <em>Phòng của tôi</em> của người thuê để làm căn cứ đối chiếu, đánh giá công khai hoặc gửi khiếu nại lên Ban quản trị.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-800">Hình thức kết thúc thuê & bàn giao</label>
                <select
                  className="w-full rounded-lg border border-border bg-background p-2 text-xs text-foreground"
                  value={terminationType}
                  onChange={(e) => setTerminationType(e.target.value)}
                >
                  <option value="MUTUAL_AGREEMENT">
                    1. Hai bên đồng thuận kết thúc thuê phòng & Đã hoàn trả tiền cọc đầy đủ
                  </option>
                  <option value="EXPIRED_NORMAL">
                    2. Hết thời gian thuê theo thỏa thuận & Đã bàn giao phòng, hoàn cọc
                  </option>
                  <option value="EARLY_LANDLORD">
                    3. Chủ trọ chấm dứt trước hạn (Cam kết hoàn 100% cọc + đền bù cọc; -15 TrustScore)
                  </option>
                  <option value="TENANT_VIOLATION">
                    4. Người thuê tự ý trả/bỏ phòng trước hạn hoặc vi phạm nội quy nghiêm trọng
                  </option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-800">
                  Nội dung biên bản bàn giao & Đối soát tiền cọc ({formatVND(terminateTarget.depositAmount)})
                </label>
                <Textarea
                  rows={3}
                  value={terminateReason}
                  onChange={(e) => setTerminateReason(e.target.value)}
                  placeholder="Ví dụ: Đã kiểm tra hiện trạng phòng tốt, khấu trừ 0đ điện nước và đã chuyển khoản hoàn trả đủ 100% tiền cọc cho người thuê..."
                  className="text-xs"
                />
              </div>

              <div className="flex items-start gap-2.5 rounded-xl bg-slate-50 p-3 border border-slate-200">
                <Checkbox
                  id="agree-terminate-legal"
                  checked={agreedTerminateLegal}
                  onCheckedChange={(v) => setAgreedTerminateLegal(Boolean(v))}
                  className="mt-0.5 cursor-pointer"
                />
                <label htmlFor="agree-terminate-legal" className="text-[11px] leading-relaxed cursor-pointer">
                  Tôi cam kết thông tin thanh lý và hoàn trả tiền đặt cọc trên là đúng sự thật. Tôi hiểu rằng người thuê có quyền gửi khiếu nại kèm biên bản này lên Quản trị viên nếu phát sinh hành vi giữ cọc trái thỏa thuận.
                </label>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setTerminateTarget(null)}>
              Hủy
            </Button>
            <Button
              size="sm"
              disabled={isTerminating || !agreedTerminateLegal}
              onClick={handleConfirmTerminate}
              className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold cursor-pointer"
            >
              {isTerminating ? "Đang lưu biên bản..." : "Xác nhận thanh lý & Mở lại phòng"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
