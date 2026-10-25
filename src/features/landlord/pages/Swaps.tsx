import { useState, useEffect, useCallback } from "react";
import {
  Check,
  X,
  ArrowLeftRight,
  AlertTriangle,
  ShieldCheck,
  FileText,
  Download,
  Clock,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn, getInitials } from "@/lib/utils";
import { api } from "@/lib/api";

export default function Swaps() {
  const [requests, setRequests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterTab, setFilterTab] = useState<"pending" | "history">("pending");
  const [processingId, setProcessingId] = useState<string | null>(null);

  const loadLandlordRequests = useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      const data = await api.get<any[]>("/swaps/landlord/requests");
      if (Array.isArray(data)) {
        const mapped = data.map((req: any, idx: number) => {
          const rawStatus = (req.status || "OPEN").toUpperCase();
          const isApproved = rawStatus === "APPROVED" || rawStatus === "COMPLETED";
          const isDeclined = rawStatus === "DECLINED" || rawStatus === "CANCELLED";
          const hasCandidate = Boolean(req.matchedTenantId || req.matchedTenantName);

          return {
            id: String(req.id || `req-${idx + 1}`),
            room: req.title || `Phòng ${idx + 1}`,
            rent: req.targetBudgetMax ? Number(req.targetBudgetMax) : 3500000,
            date: req.createdAt ? new Date(req.createdAt).toLocaleDateString("vi-VN") : "Gần đây",
            rawStatus,
            hasCandidate,
            status: isApproved ? "approved" : isDeclined ? "declined" : "pending",
            outgoingTenant: {
              name: req.authorName || "Người thuê hiện tại",
              avatar: req.authorAvatar || "",
              trustScore: req.authorTrustScore ?? req.trustScore ?? 50,
              role: req.isLeaseholder ? "Chủ hợp đồng" : "Người thuê",
              note: req.reason || "Xin chuyển nhượng hợp đồng thuê phòng",
            },
            incomingTenant: {
              name: req.matchedTenantName || (req.matchedTenantId ? "Ứng viên nhận phòng" : "Đang tìm người nhận phòng"),
              avatar: req.matchedTenantAvatar || "",
              trustScore: req.matchedTenantTrustScore ?? 50,
              school: req.matchedTenantSchool || (hasCandidate ? "Sinh viên / Người đi làm" : "Chưa có ứng viên"),
              verifiedCCCD: Boolean(req.matchedTenantVerified),
              note:
                req.proposalMessage ||
                req.habits?.join(", ") ||
                (hasCandidate
                  ? "Đã gửi đề xuất nhận chuyển nhượng hợp đồng và tiền đặt cọc"
                  : "Người thuê đang đăng tin tìm người thế chỗ, chưa có ứng viên chốt"),
            },
            effectiveDate: req.targetMoveInDate
              ? new Date(req.targetMoveInDate).toLocaleDateString("vi-VN")
              : "Sắp tới",
          };
        });
        setRequests(mapped);
      }
    } catch (err) {
      if (!silent) console.warn("Could not load /swaps/landlord/requests:", err);
    } finally {
      if (!silent) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLandlordRequests(false);
    const interval = setInterval(() => loadLandlordRequests(true), 10000);
    return () => clearInterval(interval);
  }, [loadLandlordRequests]);

  const handleApprove = async (req: any) => {
    if (!req.hasCandidate) {
      toast.error("Yêu cầu này chưa có ứng viên nhận phòng. Chỉ có thể phê duyệt khi đã có người tiếp quản hợp đồng!");
      return;
    }
    setProcessingId(req.id);
    try {
      await api.put(`/swaps/landlord/${req.id}/approve`);
      setRequests((prev) =>
        prev.map((r) => (r.id === req.id ? { ...r, status: "approved", rawStatus: "COMPLETED" } : r))
      );
      toast.success("Phê duyệt hoán đổi hợp đồng thành công! Quyền thuê phòng đã được chuyển sang người tiếp quản mới.");
    } catch (err: any) {
      const msg = err?.response?.data?.detail || err?.response?.data?.message || err?.message;
      toast.error(msg || "Không thể phê duyệt yêu cầu hoán đổi hợp đồng");
    } finally {
      setProcessingId(null);
    }
  };

  const handleDecline = async (id: string) => {
    setProcessingId(id);
    try {
      await api.put(`/swaps/landlord/${id}/decline`);
      setRequests((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status: "declined", rawStatus: "DECLINED" } : r))
      );
      toast.info("Đã từ chối yêu cầu hoán đổi hợp đồng.");
    } catch (err: any) {
      const msg = err?.response?.data?.detail || err?.response?.data?.message || err?.message;
      toast.error(msg || "Không thể từ chối yêu cầu hoán đổi");
    } finally {
      setProcessingId(null);
    }
  };

  const handleDownloadAddendum = (req: any) => {
    const htmlContent = `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8" />
  <title>Phụ lục chuyển nhượng hợp đồng thuê phòng - ${req.room}</title>
  <style>
    body { font-family: "Times New Roman", serif; max-width: 760px; margin: 40px auto; padding: 24px; line-height: 1.6; color: #111; }
    h1, h2, h3 { text-align: center; margin: 6px 0; }
    .meta { margin: 20px 0; padding: 16px; border: 1px solid #ccc; border-radius: 8px; background: #f9fafb; }
    .signatures { display: flex; justify-content: space-between; margin-top: 48px; text-align: center; }
    .sig-box { width: 30%; }
  </style>
</head>
<body>
  <h3>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</h3>
  <h4>Độc lập - Tự do - Hạnh phúc</h4>
  <hr style="width: 200px; margin-bottom: 24px;" />
  <h2>PHỤ LỤC CHUYỂN NHƯỢNG HỢP ĐỒNG THUÊ PHÒNG & TIỀN ĐẶT CỌC</h2>
  <p style="text-align:center;">(Mã yêu cầu: #${req.id.slice(-8).toUpperCase()} — Hệ thống Phòng Trọ Xanh)</p>

  <div class="meta">
    <p><strong>Phòng trọ chuyển nhượng:</strong> ${req.room}</p>
    <p><strong>Giá thuê giữ nguyên theo HĐ gốc:</strong> ${req.rent.toLocaleString("vi-VN")} VNĐ/tháng</p>
    <p><strong>Ngày bắt đầu chuyển giao nghĩa vụ:</strong> ${req.effectiveDate}</p>
  </div>

  <p><strong>1. BÊN CHUYỂN NHƯỢNG (Người thuê cũ):</strong> ${req.outgoingTenant.name} (TrustScore: ${req.outgoingTenant.trustScore}/100)</p>
  <p>Lý do chuyển nhượng: ${req.outgoingTenant.note}</p>

  <p><strong>2. BÊN NHẬN CHUYỂN NHƯỢNG (Người thuê mới):</strong> ${req.incomingTenant.name} (${req.incomingTenant.school})</p>
  <p>Trạng thái định danh CCCD: ${req.incomingTenant.verifiedCCCD ? "Đã xác thực trên hệ thống Phòng Trọ Xanh" : "Đang bổ sung xác thực"} — TrustScore: ${req.incomingTenant.trustScore}/100</p>

  <p><strong>3. NỘI DUNG THỎA THUẬN BA BÊN:</strong></p>
  <ul>
    <li>Kể từ ngày ${req.effectiveDate}, Bên Nhận Chuyển Nhượng kế thừa toàn bộ quyền và nghĩa vụ thuê phòng, bao gồm khoản tiền đặt cọc đang lưu tại Chủ trọ.</li>
    <li>Chủ trọ xác nhận giữ nguyên mức giá thuê, tiền đặt cọc và thời hạn hợp đồng theo thỏa thuận ban đầu.</li>
    <li>Hợp đồng cũ của Bên Chuyển Nhượng tự động chấm dứt hiệu lực mà không phát sinh phạt cọc đơn phương.</li>
  </ul>

  <div class="signatures">
    <div class="sig-box">
      <strong>CHỦ TRỌ PHÊ DUYỆT</strong><br/>
      <em>(Ký xác nhận điện tử)</em>
    </div>
    <div class="sig-box">
      <strong>NGƯỜI CHUYỂN ĐI</strong><br/>
      <p style="margin-top:40px;">${req.outgoingTenant.name}</p>
    </div>
    <div class="sig-box">
      <strong>NGƯỜI TIẾP QUẢN</strong><br/>
      <p style="margin-top:40px;">${req.incomingTenant.name}</p>
    </div>
  </div>
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Phu-luc-chuyen-nhuong-HD-${req.id.slice(-6).toUpperCase()}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success("Đã tải xuống Dự thảo phụ lục chuyển nhượng hợp đồng!");
  };

  const pendingRequests = requests.filter((r) => r.status === "pending");
  const historyRequests = requests.filter((r) => r.status !== "pending");
  const activeList = filterTab === "pending" ? pendingRequests : historyRequests;

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-6 sm:px-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="brand text-3xl text-foreground flex items-center gap-2">
            <ArrowLeftRight className="size-8 text-primary" /> Phê duyệt hoán đổi hợp đồng
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Duyệt yêu cầu chuyển giao nghĩa vụ hợp đồng thuê phòng giữa người đi và người đến (Leaseholder Swaps).
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => loadLandlordRequests(false)}
          disabled={isLoading}
          className="self-start sm:self-auto gap-1.5 cursor-pointer"
        >
          <RefreshCw className={cn("size-4", isLoading && "animate-spin")} />
          Làm mới
        </Button>
      </div>

      {/* Info Warning Banner */}
      <div className="flex items-start gap-3 rounded-2xl border border-warning/30 bg-warning/5 p-4 text-sm text-amber-800">
        <AlertTriangle className="mt-0.5 size-5 text-warning shrink-0" />
        <div>
          <span className="font-semibold block">Quy định chuyển quyền thuê phòng:</span>
          <span className="text-xs text-muted-foreground">
            Khi phê duyệt hoán đổi này, hệ thống sẽ tự động thanh lý hợp đồng của người đi và khởi tạo hợp đồng mới cho người đến với cùng giá thuê và tiền đặt cọc. Bạn chỉ có thể phê duyệt khi đã có <strong>Người tiếp quản</strong> ứng tuyển.
          </span>
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="flex border-b border-border gap-2">
        <button
          type="button"
          onClick={() => setFilterTab("pending")}
          className={cn(
            "relative pb-3 px-4 text-sm font-semibold transition-all cursor-pointer",
            filterTab === "pending" ? "text-primary border-b-2 border-primary" : "text-muted-foreground hover:text-foreground"
          )}
        >
          Yêu cầu chờ duyệt ({pendingRequests.length})
        </button>
        <button
          type="button"
          onClick={() => setFilterTab("history")}
          className={cn(
            "relative pb-3 px-4 text-sm font-semibold transition-all cursor-pointer",
            filterTab === "history" ? "text-primary border-b-2 border-primary" : "text-muted-foreground hover:text-foreground"
          )}
        >
          Lịch sử xử lý ({historyRequests.length})
        </button>
      </div>

      {/* Requests List */}
      <div className="space-y-6">
        {activeList.length > 0 ? (
          activeList.map((req) => (
            <div key={req.id} className="rounded-2xl bg-card p-6 ring-1 ring-border shadow-sm space-y-6">
              {/* Top Meta info */}
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-4">
                <div>
                  <Badge variant="outline" className="text-primary font-semibold text-xs border-primary/20 bg-mint/5">
                    {req.room}
                  </Badge>
                  <p className="text-xs text-muted-foreground mt-1">
                    Yêu cầu tạo ngày: {req.date} | Giá thuê phòng: {req.rent.toLocaleString("vi-VN")}đ/tháng
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground font-medium">
                    Hiệu lực dự kiến: <strong className="text-foreground">{req.effectiveDate}</strong>
                  </span>
                  {req.status === "pending" ? (
                    <Badge
                      className={cn(
                        "text-xs px-2.5 py-0.5",
                        req.hasCandidate
                          ? "bg-blue-50 text-blue-700 hover:bg-blue-50"
                          : "bg-amber-50 text-amber-700 hover:bg-amber-50"
                      )}
                    >
                      {req.hasCandidate ? "Đã có người nhận — Chờ duyệt" : "Đang tìm người nhận"}
                    </Badge>
                  ) : (
                    <Badge
                      className={cn(
                        "text-xs px-2.5 py-0.5",
                        req.status === "approved"
                          ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-50"
                          : "bg-red-50 text-red-700 hover:bg-red-50"
                      )}
                    >
                      {req.status === "approved" ? "Đã duyệt & Chuyển giao HĐ" : "Đã từ chối"}
                    </Badge>
                  )}
                </div>
              </div>

              {/* Comparison Section (Outgoing vs Incoming) */}
              <div className="grid gap-6 md:grid-cols-[1fr_auto_1fr] items-center">
                {/* Outgoing Tenant */}
                <div className="rounded-xl border border-border bg-secondary/10 p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <Avatar className="size-12 ring-2 ring-border shrink-0">
                      <AvatarImage src={req.outgoingTenant.avatar || undefined} />
                      <AvatarFallback className="bg-emerald-100 text-emerald-800 text-xs font-semibold">
                        {getInitials(req.outgoingTenant.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <span className="text-[10px] font-bold text-red-600 block uppercase">Người chuyển đi</span>
                      <h4 className="font-semibold text-sm">{req.outgoingTenant.name}</h4>
                      <p className="text-[10px] text-muted-foreground">{req.outgoingTenant.role}</p>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-border/60 text-xs space-y-1 text-muted-foreground">
                    <p className="flex justify-between">
                      <span>Điểm uy tín (TrustScore):</span>
                      <span className="font-medium text-foreground">{req.outgoingTenant.trustScore}/100</span>
                    </p>
                    <p className="flex justify-between">
                      <span>Trạng thái hợp đồng:</span>
                      <span className="font-medium text-emerald-600">Đang hiệu lực</span>
                    </p>
                    <p className="mt-2 text-[11px] italic bg-card p-2 rounded border border-border/40">
                      &ldquo;{req.outgoingTenant.note}&rdquo;
                    </p>
                  </div>
                </div>

                {/* Arrow */}
                <div className="flex justify-center">
                  <div className="grid size-10 place-items-center rounded-full bg-mint text-primary">
                    <ArrowLeftRight className="size-5" />
                  </div>
                </div>

                {/* Incoming Tenant */}
                <div
                  className={cn(
                    "rounded-xl border p-4 space-y-3",
                    req.hasCandidate ? "border-primary/20 bg-mint/5" : "border-dashed border-border bg-secondary/5"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="size-12 ring-2 ring-primary/20 shrink-0">
                      <AvatarImage src={req.incomingTenant.avatar || undefined} />
                      <AvatarFallback className="bg-emerald-100 text-emerald-800 text-xs font-semibold">
                        {getInitials(req.incomingTenant.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <span className="text-[10px] font-bold text-primary block uppercase">Người tiếp quản</span>
                      <h4 className="font-semibold text-sm flex items-center gap-1">
                        {req.incomingTenant.name}
                        {req.incomingTenant.verifiedCCCD && <ShieldCheck className="size-4 text-primary shrink-0" />}
                      </h4>
                      <p className="text-[10px] text-muted-foreground">{req.incomingTenant.school}</p>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-primary/10 text-xs space-y-1 text-muted-foreground">
                    <p className="flex justify-between">
                      <span>Điểm uy tín (TrustScore):</span>
                      <span className="font-medium text-foreground">
                        {req.hasCandidate ? `${req.incomingTenant.trustScore}/100` : "—"}
                      </span>
                    </p>
                    <p className="flex justify-between">
                      <span>CCCD xác thực:</span>
                      {req.hasCandidate ? (
                        req.incomingTenant.verifiedCCCD ? (
                          <span className="font-medium text-primary">Đã xác thực ✓</span>
                        ) : (
                          <span className="font-medium text-amber-600">Chưa xác thực CCCD</span>
                        )
                      ) : (
                        <span className="text-muted-foreground">Chờ ứng viên</span>
                      )}
                    </p>
                    <p className="mt-2 text-[11px] italic bg-card p-2 rounded border border-border/40">
                      &ldquo;{req.incomingTenant.note}&rdquo;
                    </p>
                  </div>
                </div>
              </div>

              {/* Document actions & buttons */}
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-t border-border pt-4">
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <FileText className="size-4 text-muted-foreground shrink-0" />
                  <span>Dự thảo Phụ lục chuyển nhượng hợp đồng & tiền đặt cọc</span>
                  <button
                    type="button"
                    className="text-primary hover:underline font-semibold flex items-center gap-1 ml-1 cursor-pointer"
                    onClick={() => handleDownloadAddendum(req)}
                  >
                    <Download className="size-3.5" /> Tải xuống bản dự thảo (.html)
                  </button>
                </div>

                {req.status === "pending" && (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={processingId === req.id}
                      className="gap-1.5 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 cursor-pointer"
                      onClick={() => handleDecline(req.id)}
                    >
                      <X className="size-4" /> Từ chối
                    </Button>
                    <Button
                      size="sm"
                      disabled={!req.hasCandidate || processingId === req.id}
                      title={!req.hasCandidate ? "Cần có ứng viên nhận phòng trước khi phê duyệt" : undefined}
                      className="gap-1.5 text-xs bg-primary text-primary-foreground font-semibold cursor-pointer"
                      onClick={() => handleApprove(req)}
                    >
                      <Check className="size-4" />
                      {req.hasCandidate ? "Phê duyệt & Chuyển giao HĐ" : "Chờ ứng viên nhận phòng"}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12 rounded-2xl border-2 border-dashed border-border p-6 bg-card">
            <Clock className="mx-auto size-8 text-muted-foreground" />
            <p className="mt-2 text-sm font-semibold text-foreground">Không có yêu cầu hoán đổi nào</p>
            <p className="text-xs text-muted-foreground mt-1">
              Các yêu cầu xin chuyển nhượng hợp đồng của khách thuê sẽ hiển thị ở đây.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
