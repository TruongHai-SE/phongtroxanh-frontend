import { useState, useEffect } from "react";
import { Check, X, ArrowLeftRight, AlertTriangle, ShieldCheck, UserCheck, FileText, Download, Clock } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ImageWithFallback } from "@/components/shared/ImageWithFallback";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { StarRating } from "@/components/shared/primitives-compat";
import { cn, getInitials } from "@/lib/utils";
import { api } from "@/lib/api";

export default function Swaps() {
  const [requests, setRequests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterTab, setFilterTab] = useState<"pending" | "history">("pending");

  useEffect(() => {
    async function loadLandlordRequests() {
      setIsLoading(true);
      try {
        const data = await api.get<any[]>("/swaps/landlord/requests");
        if (Array.isArray(data)) {
          const mapped = data.map((req: any, idx: number) => ({
            id: String(req.id || `req-${idx + 1}`),
            room: req.title || `Phòng ${idx + 1}`,
            rent: req.targetBudgetMax ? Number(req.targetBudgetMax) : 3500000,
            date: req.createdAt ? new Date(req.createdAt).toLocaleDateString("vi-VN") : "Gần đây",
            status: req.status?.toLowerCase() === "approved" ? "approved" : (req.status?.toLowerCase() === "declined" ? "declined" : "pending"),
            outgoingTenant: {
              name: req.authorName || "Người đi",
              avatar: req.authorAvatar || "",
              trustScore: req.authorTrustScore ?? req.trustScore ?? 50,
              role: req.isLeaseholder ? "Chủ hợp đồng" : "Người thuê",
              note: req.reason || "Cần chuyển phòng",
            },
            incomingTenant: {
              name: req.matchedTenantName || (req.matchedTenantId ? "Ứng viên đã chọn" : "Chưa ghép đôi"),
              avatar: req.matchedTenantAvatar || "",
              trustScore: req.matchedTenantTrustScore ?? 50,
              school: req.matchedTenantSchool || "Sinh viên / Người đi làm",
              verifiedCCCD: Boolean(req.matchedTenantVerified),
              note: req.habits?.join(", ") || "Đã đồng ý nhận chuyển giao hợp đồng",
            },
            effectiveDate: req.targetMoveInDate ? new Date(req.targetMoveInDate).toLocaleDateString("vi-VN") : "Sắp tới",
          }));
          setRequests(mapped);
        }
      } catch (err) {
        console.warn("Could not load /swaps/landlord/requests:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadLandlordRequests();
  }, []);

  const handleApprove = async (id: string) => {
    try {
      await api.put(`/swaps/landlord/${id}/approve`);
      setRequests(prev => prev.map(r => r.id === id ? { ...r, status: "approved" } : r));
      toast.success("Phê duyệt hoán đổi hợp đồng thành công! Phụ lục hợp đồng mới đã được ký điện tử.");
    } catch (err: any) {
      toast.error(err.message || "Không thể phê duyệt yêu cầu hoán đổi hợp đồng");
    }
  };

  const handleDecline = async (id: string) => {
    try {
      await api.put(`/swaps/landlord/${id}/decline`);
      setRequests(prev => prev.map(r => r.id === id ? { ...r, status: "declined" } : r));
      toast.info("Đã từ chối yêu cầu hoán đổi hợp đồng.");
    } catch (err: any) {
      toast.error(err.message || "Không thể từ chối yêu cầu hoán đổi");
    }
  };

  const pendingRequests = requests.filter(r => r.status === "pending");
  const historyRequests = requests.filter(r => r.status !== "pending");

  const activeList = filterTab === "pending" ? pendingRequests : historyRequests;

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-6 sm:px-6">
      {/* Header */}
      <div>
        <h1 className="brand text-3xl text-foreground flex items-center gap-2">
          <ArrowLeftRight className="size-8 text-primary" /> Phê duyệt hoán đổi hợp đồng
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Duyệt yêu cầu chuyển giao nghĩa vụ hợp đồng thuê phòng giữa người đi và người đến (Leaseholder Swaps).
        </p>
      </div>

      {/* Info Warning Banner */}
      <div className="flex items-start gap-3 rounded-2xl border border-warning/30 bg-warning/5 p-4 text-sm text-amber-800">
        <AlertTriangle className="mt-0.5 size-5 text-warning shrink-0" />
        <div>
          <span className="font-semibold block">Quy định chuyển quyền thuê phòng:</span>
          <span className="text-xs text-muted-foreground">
            Khi phê duyệt hoán đổi này, hệ thống sẽ tự động vô hiệu hóa hợp đồng của người đi và khởi tạo phụ lục hợp đồng mới cho người đến với cùng giá thuê và các điều khoản cũ. Người đến phải có CCCD đã được hệ thống xác thực.
          </span>
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="flex border-b border-border gap-2">
        <button
          onClick={() => setFilterTab("pending")}
          className={cn(
            "relative pb-3 px-4 text-sm font-semibold transition-all",
            filterTab === "pending" ? "text-primary border-b-2 border-primary" : "text-muted-foreground hover:text-foreground"
          )}
        >
          Yêu cầu chờ duyệt ({pendingRequests.length})
        </button>
        <button
          onClick={() => setFilterTab("history")}
          className={cn(
            "relative pb-3 px-4 text-sm font-semibold transition-all",
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
                  <p className="text-xs text-muted-foreground mt-1">Yêu cầu tạo ngày: {req.date} | Giá thuê phòng: {req.rent.toLocaleString("vi-VN")}đ/tháng</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground font-medium">Hiệu lực: <strong className="text-foreground">{req.effectiveDate}</strong></span>
                  {req.status !== "pending" && (
                    <Badge className={cn(
                      "text-xs px-2.5 py-0.5",
                      req.status === "approved" ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-50" : "bg-red-50 text-red-700 hover:bg-red-50"
                    )}>
                      {req.status === "approved" ? "Đã duyệt" : "Đã từ chối"}
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
                    <p className="flex justify-between"><span>Tín nhiệm:</span> <span className="font-medium text-foreground">{req.outgoingTenant.trustScore}/100</span></p>
                    <p className="flex justify-between"><span>Đóng tiền trọ:</span> <span className="font-medium text-emerald-600">Đúng hạn 100%</span></p>
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
                <div className="rounded-xl border border-primary/20 bg-mint/5 p-4 space-y-3">
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
                    <p className="flex justify-between"><span>Tín nhiệm:</span> <span className="font-medium text-foreground">{req.incomingTenant.trustScore}/100</span></p>
                    <p className="flex justify-between"><span>CCCD xác thực:</span> <span className="font-medium text-primary">Đã duyệt ✓</span></p>
                    <p className="mt-2 text-[11px] italic bg-card p-2 rounded border border-border/40">
                      &ldquo;{req.incomingTenant.note}&rdquo;
                    </p>
                  </div>
                </div>

              </div>

              {/* Document actions & buttons */}
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-t border-border pt-4">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <FileText className="size-4 text-muted-foreground" />
                  <span>Dự thảo phụ lục hợp đồng thay thế thế chấp cọc phòng.pdf</span>
                  <button className="text-primary hover:underline font-semibold flex items-center gap-0.5 ml-2" onClick={() => toast.info("Đang tải xuống tài liệu dự thảo...")}>
                    <Download className="size-3" /> Tải xuống
                  </button>
                </div>

                {req.status === "pending" && (
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="gap-1.5 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200" 
                      onClick={() => handleDecline(req.id)}
                    >
                      <X className="size-4" /> Từ chối
                    </Button>
                    <Button 
                      size="sm" 
                      className="gap-1.5 text-xs bg-primary text-primary-foreground font-semibold" 
                      onClick={() => handleApprove(req.id)}
                    >
                      <Check className="size-4" /> Phê duyệt Swap
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
            <p className="text-xs text-muted-foreground mt-1">Các yêu cầu xin chuyển hợp đồng của tenant sẽ hiển thị ở đây.</p>
          </div>
        )}
      </div>
    </div>
  );
}
