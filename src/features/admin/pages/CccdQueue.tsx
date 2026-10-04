import { useState, useEffect, useMemo } from "react";
import {
  Check, X, Eye, ZoomIn, ShieldCheck, ShieldX, Calendar,
  User, Loader2, RefreshCw, FileText, AlertCircle, Building2, CreditCard,
  Search, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ImageWithFallback } from "@/components/shared/ImageWithFallback";
import { ImageZoomOverlay } from "@/components/shared/ImageZoomOverlay";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials, cn } from "@/lib/utils";
import { api } from "@/lib/api";

type QueueItem = {
  id: string;
  name: string;
  avatar: string;
  email?: string;
  phone?: string;
  role: string;
  submitted: string;
  frontUrl?: string;
  backUrl?: string;
};

const PAGE_SIZE = 5;

function PaginationBar({
  page, totalPages, total, onPage,
}: {
  page: number; totalPages: number; total: number; onPage: (p: number) => void;
}) {
  const [gotoVal, setGotoVal] = useState("");
  const from = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const to = Math.min(page * PAGE_SIZE, total);

  const pages: (number | "…")[] = [];
  if (totalPages <= 6) { for (let i = 1; i <= totalPages; i++) pages.push(i); }
  else {
    pages.push(1);
    if (page > 3) pages.push("…");
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) pages.push(i);
    if (page < totalPages - 2) pages.push("…");
    pages.push(totalPages);
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 rounded-2xl bg-card border text-sm shadow-xs">
      <span className="text-muted-foreground text-xs">{from}–{to} trong {total} hồ sơ chờ duyệt</span>
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon" className="size-8 cursor-pointer" disabled={page === 1} onClick={() => onPage(1)}>
          <ChevronsLeft className="size-4" />
        </Button>
        <Button variant="ghost" size="icon" className="size-8 cursor-pointer" disabled={page === 1} onClick={() => onPage(page - 1)}>
          <ChevronLeft className="size-4" />
        </Button>
        {pages.map((p, i) => p === "…"
          ? <span key={`d${i}`} className="px-1 text-muted-foreground text-xs">…</span>
          : <Button key={p} variant={page === p ? "default" : "ghost"} size="icon" className="size-8 text-xs cursor-pointer" onClick={() => onPage(p as number)}>{p}</Button>
        )}
        <Button variant="ghost" size="icon" className="size-8 cursor-pointer" disabled={page === totalPages} onClick={() => onPage(page + 1)}>
          <ChevronRight className="size-4" />
        </Button>
        <Button variant="ghost" size="icon" className="size-8 cursor-pointer" disabled={page === totalPages} onClick={() => onPage(totalPages)}>
          <ChevronsRight className="size-4" />
        </Button>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-muted-foreground text-xs">Đến trang</span>
        <Input
          className="w-12 h-8 text-center text-xs"
          value={gotoVal}
          onChange={(e) => setGotoVal(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              const p = parseInt(gotoVal);
              if (!isNaN(p) && p >= 1 && p <= totalPages) {
                onPage(p);
                setGotoVal("");
              }
            }
          }}
          placeholder={String(page)}
        />
        <span className="text-muted-foreground text-xs">/ {totalPages}</span>
      </div>
    </div>
  );
}

// Clean SVG illustration for ID card placeholder instead of room images
function IdCardPlaceholder({ side }: { side: "front" | "back" }) {
  return (
    <div className="size-full flex flex-col items-center justify-center bg-slate-100 dark:bg-slate-800 text-slate-400 p-2 text-center select-none">
      <FileText className="size-6 text-slate-400 mb-1" />
      <span className="text-[11px] font-medium text-slate-600 dark:text-slate-300">
        {side === "front" ? "Mặt trước CCCD" : "Mặt sau CCCD"}
      </span>
      <span className="text-[9px] text-slate-400">Chưa có ảnh tải lên</span>
    </div>
  );
}

export default function CccdQueue() {
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<QueueItem | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectTarget, setRejectTarget] = useState<QueueItem | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [zoomSrc, setZoomSrc] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | "TENANT" | "LANDLORD">("all");
  const [page, setPage] = useState(1);

  const loadQueue = async () => {
    setLoading(true);
    try {
      const res = await api.get<any>("/admin/kyc/pending");
      const data = res?.content || res;
      if (Array.isArray(data) && data.length > 0) {
        setQueue(data.map((item: any, i: number) => ({
          id: item.verificationId || String(i),
          name: item.userFullName || `Người dùng ${i + 1}`,
          avatar: item.avatarUrl || item.userAvatar || "",
          email: item.userEmail || "",
          phone: item.userPhone || "",
          role: item.userRole === "LANDLORD" ? "Chủ trọ" : "Người thuê",
          submitted: item.createdAt ? new Date(item.createdAt).toLocaleDateString("vi-VN") : "Hôm nay",
          frontUrl: item.idCardFrontUrl || "",
          backUrl: item.idCardBackUrl || "",
        })));
      } else {
        setQueue([]);
      }
    } catch {
      setQueue([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQueue();
  }, []);

  const approve = async (item: QueueItem) => {
    setProcessingId(item.id);
    try {
      await api.put(`/admin/kyc/${item.id}/approve`);
      setQueue((p) => p.filter((q) => q.id !== item.id));
      setModalOpen(false);
      toast.success(`Đã duyệt xác minh CCCD cho ${item.name}`);
    } catch {
      toast.error("Không thể duyệt hồ sơ, vui lòng thử lại.");
    } finally {
      setProcessingId(null);
    }
  };

  const openReject = (item: QueueItem) => {
    setRejectTarget(item);
    setRejectReason("");
    setRejectOpen(true);
  };

  const confirmReject = async () => {
    if (!rejectTarget) return;
    setProcessingId(rejectTarget.id);
    try {
      await api.put(`/admin/kyc/${rejectTarget.id}/reject`, {
        reason: rejectReason.trim() || "Ảnh chụp không rõ ràng hoặc thông tin CCCD không trùng khớp",
      });
      setQueue((p) => p.filter((q) => q.id !== rejectTarget.id));
      setModalOpen(false);
      setRejectOpen(false);
      toast.success(`Đã từ chối hồ sơ của ${rejectTarget.name}`);
      setRejectTarget(null);
    } catch {
      toast.error("Không thể từ chối hồ sơ, vui lòng thử lại.");
    } finally {
      setProcessingId(null);
    }
  };

  const filtered = useMemo(() => {
    return queue.filter((item) => {
      if (roleFilter === "TENANT" && item.role !== "Người thuê") return false;
      if (roleFilter === "LANDLORD" && item.role !== "Chủ trọ") return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = item.name.toLowerCase().includes(q);
        const matchesEmail = (item.email || "").toLowerCase().includes(q);
        const matchesPhone = (item.phone || "").includes(q);
        if (!matchesName && !matchesEmail && !matchesPhone) return false;
      }
      return true;
    });
  }, [queue, roleFilter, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginated = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, currentPage]);

  const tenantCount = queue.filter((q) => q.role === "Người thuê").length;
  const landlordCount = queue.filter((q) => q.role === "Chủ trọ").length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="brand text-2xl font-bold tracking-tight text-foreground">Duyệt xác minh CCCD</h1>
          <p className="text-sm text-muted-foreground">
            {queue.length} hồ sơ đang chờ kiểm duyệt danh tính
            <span className="ml-2 text-xs text-muted-foreground/70">· Kích hoạt tích xanh chính chủ và điểm TrustScore</span>
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 cursor-pointer text-xs"
          onClick={loadQueue}
          disabled={loading}
        >
          <RefreshCw className={cn("size-3.5", loading && "animate-spin")} /> Làm mới
        </Button>
      </div>

      {/* ── TOOLBAR: SEARCH & ROLE FILTER TABS ── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
            placeholder="Tìm theo họ tên, email, số điện thoại..."
            className="pl-9 h-9 text-xs rounded-xl"
          />
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery("");
                setPage(1);
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground p-1 cursor-pointer"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>

        <Tabs
          value={roleFilter}
          onValueChange={(v: any) => {
            setRoleFilter(v);
            setPage(1);
          }}
          className="w-full sm:w-auto"
        >
          <TabsList className="h-9 rounded-xl bg-muted/60 p-1">
            <TabsTrigger value="all" className="text-xs cursor-pointer">
              Tất cả ({queue.length})
            </TabsTrigger>
            <TabsTrigger value="TENANT" className="text-xs cursor-pointer">
              Người thuê ({tenantCount})
            </TabsTrigger>
            <TabsTrigger value="LANDLORD" className="text-xs cursor-pointer">
              Chủ trọ ({landlordCount})
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {loading && (
        <div className="flex flex-col items-center justify-center py-20 gap-3 rounded-2xl bg-card border">
          <Loader2 className="size-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Đang tải danh sách hồ sơ CCCD...</p>
        </div>
      )}

      {!loading && queue.length === 0 && (
        <div className="flex flex-col items-center py-20 gap-3 rounded-2xl bg-card border text-center shadow-xs">
          <div className="grid size-14 place-items-center rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40">
            <ShieldCheck className="size-7" />
          </div>
          <div>
            <p className="font-semibold text-foreground text-base">Hàng đợi trống!</p>
            <p className="text-sm text-muted-foreground max-w-sm mt-0.5">
              Tất cả các hồ sơ CCCD đã được duyệt hoặc chưa có yêu cầu xác minh mới nào.
            </p>
          </div>
        </div>
      )}

      {!loading && queue.length > 0 && filtered.length === 0 && (
        <div className="flex flex-col items-center py-16 gap-3 rounded-2xl bg-card border text-center shadow-xs">
          <p className="font-semibold text-foreground text-sm">Không tìm thấy hồ sơ phù hợp</p>
          <p className="text-xs text-muted-foreground">
            Không có kết quả khớp với từ khóa "{searchQuery}" trong bộ lọc hiện tại.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSearchQuery("");
              setRoleFilter("all");
              setPage(1);
            }}
            className="text-xs mt-1 cursor-pointer"
          >
            Đặt lại bộ lọc
          </Button>
        </div>
      )}

      {/* FIXED-COLUMN UNIFORM ROWS */}
      {!loading && paginated.length > 0 && (
        <div className="space-y-3">
          {paginated.map((u) => {
            const isProcessing = processingId === u.id;
            return (
              <div
                key={u.id}
                className={cn(
                  "flex flex-col lg:flex-row lg:items-center justify-between gap-4 rounded-2xl bg-card p-4 border shadow-xs transition-all duration-150",
                  "hover:bg-emerald-50/40 dark:hover:bg-emerald-950/20 hover:border-emerald-200"
                )}
              >
                {/* Cột 1: Thông tin người dùng (Chiều rộng cố định 260px) */}
                <div className="w-full lg:w-[260px] shrink-0 flex items-center gap-3">
                  <Avatar className="size-11 ring-1 ring-border shrink-0">
                    <AvatarImage src={u.avatar || undefined} />
                    <AvatarFallback className="bg-emerald-100 text-emerald-800 text-xs font-bold">
                      {getInitials(u.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 pr-2">
                    <p className="text-sm font-semibold text-foreground truncate" title={u.name}>{u.name}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-medium bg-muted/60">
                        {u.role}
                      </Badge>
                      <span className="text-[11px] text-muted-foreground truncate">{u.submitted}</span>
                    </div>
                  </div>
                </div>

                {/* Cột 2: Thông tin giấy tờ xác minh */}
                <div className="w-full lg:w-[220px] shrink-0 bg-muted/30 px-3.5 py-2.5 rounded-xl border border-border/60">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                    <CreditCard className="size-3.5 text-emerald-600 shrink-0" />
                    <span>CCCD gắn chip (2 mặt ảnh)</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5">Gửi ngày: {u.submitted}</p>
                </div>

                {/* Cột 3: Thumbnail ảnh CCCD (Chiều rộng cố định 230px, 2 ảnh 108px x 68px) */}
                <div className="w-full lg:w-[230px] shrink-0 flex items-center gap-2">
                  {[
                    { src: u.frontUrl, label: "Mặt trước", side: "front" as const },
                    { src: u.backUrl, label: "Mặt sau", side: "back" as const },
                  ].map((card, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => card.src && setZoomSrc(card.src)}
                      className={cn(
                        "relative aspect-[3/2] w-[110px] overflow-hidden rounded-xl border bg-muted shrink-0 text-left transition group",
                        card.src ? "cursor-pointer hover:ring-2 hover:ring-emerald-500/80" : "cursor-default opacity-80"
                      )}
                    >
                      {card.src ? (
                        <>
                          <ImageWithFallback src={card.src} alt={`CCCD ${card.label}`} className="size-full object-cover" />
                          <span className="absolute bottom-1 left-1 rounded bg-black/70 px-1.5 py-0.5 text-[9px] font-medium text-white shadow-xs">
                            {card.label}
                          </span>
                          <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition grid place-items-center">
                            <ZoomIn className="size-4 text-white" />
                          </div>
                        </>
                      ) : (
                        <IdCardPlaceholder side={card.side} />
                      )}
                    </button>
                  ))}
                </div>

                {/* Cột 4: Nút hành động đồng bộ, thanh lịch */}
                <div className="flex items-center gap-2 shrink-0 ml-auto pt-2 lg:pt-0">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 px-3 text-xs gap-1.5 cursor-pointer hover:bg-muted"
                    onClick={() => { setSelected(u); setModalOpen(true); }}
                  >
                    <Eye className="size-3.5 text-muted-foreground" /> Chi tiết
                  </Button>
                  <Button
                    size="sm"
                    disabled={isProcessing}
                    className="h-8 px-3 text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer shadow-xs"
                    onClick={() => approve(u)}
                  >
                    {isProcessing ? <Loader2 className="size-3.5 animate-spin" /> : <Check className="size-3.5" />}
                    Duyệt
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={isProcessing}
                    className="h-8 px-3 text-xs gap-1.5 text-rose-700 bg-rose-50/50 border-rose-200/80 hover:bg-rose-100/70 cursor-pointer"
                    onClick={() => openReject(u)}
                  >
                    <X className="size-3.5" /> Từ chối
                  </Button>
                </div>
              </div>
            );
          })}

          {/* Phân trang */}
          <PaginationBar
            page={currentPage}
            totalPages={totalPages}
            total={filtered.length}
            onPage={setPage}
          />
        </div>
      )}

      {/* POPUP MODAL: Chi tiết hồ sơ CCCD (Centered Dialog thay thế Slide Sheet) */}
      <Dialog open={modalOpen} onOpenChange={(o) => { if (!o && !zoomSrc) setModalOpen(false); }}>
        <DialogContent className="sm:max-w-2xl p-0 overflow-hidden rounded-2xl border bg-card shadow-2xl">
          {selected && (
            <div>
              {/* Header profile */}
              <div className="p-6 bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-transparent border-b">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <Avatar className="size-14 ring-2 ring-emerald-600/20 shadow-sm shrink-0">
                      <AvatarImage src={selected.avatar || undefined} />
                      <AvatarFallback className="bg-emerald-600 text-white font-bold text-base">
                        {getInitials(selected.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-bold text-lg text-foreground leading-tight">{selected.name}</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {selected.email ? `${selected.email} ${selected.phone ? `· ${selected.phone}` : ""}` : "Hồ sơ người dùng chờ xác thực"}
                      </p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <Badge variant="outline" className="text-xs bg-muted/60">
                          {selected.role}
                        </Badge>
                        <span className="text-xs text-muted-foreground">Gửi ngày: {selected.submitted}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right shrink-0 bg-background/90 px-3.5 py-2 rounded-xl border shadow-xs">
                    <span className="text-[10px] text-muted-foreground uppercase font-semibold block">Hồ sơ thẩm định</span>
                    <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 mt-0.5 inline-block">
                      CCCD gắn chip (2 mặt)
                    </span>
                  </div>
                </div>
              </div>

              {/* Document Image Previews */}
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Ảnh chụp giấy tờ đính kèm
                  </h4>
                  <span className="text-xs text-muted-foreground">Nhấp vào ảnh để phóng to</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { src: selected.frontUrl, label: "Mặt trước CCCD", side: "front" as const },
                    { src: selected.backUrl, label: "Mặt sau CCCD", side: "back" as const },
                  ].map((card, i) => (
                    <div key={i} className="space-y-1.5">
                      <span className="text-xs font-medium text-foreground/80">{card.label}</span>
                      <button
                        type="button"
                        onClick={() => card.src && setZoomSrc(card.src)}
                        className={cn(
                          "relative aspect-[3/2] w-full overflow-hidden rounded-xl border bg-muted shadow-xs transition group",
                          card.src ? "cursor-pointer hover:ring-2 hover:ring-emerald-500/80" : "cursor-default"
                        )}
                      >
                        {card.src ? (
                          <>
                            <ImageWithFallback src={card.src} alt={card.label} className="size-full object-cover" />
                            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition grid place-items-center">
                              <ZoomIn className="size-6 text-white" />
                            </div>
                          </>
                        ) : (
                          <IdCardPlaceholder side={card.side} />
                        )}
                      </button>
                    </div>
                  ))}
                </div>

                <div className="rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/80 p-3 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2">
                  <AlertCircle className="size-4 shrink-0 mt-0.5 text-amber-600" />
                  <span>
                    Vui lòng kiểm tra kỹ ảnh chụp 2 mặt CCCD rõ nét, họ tên và khuôn mặt không bị lóa sáng hay mất góc trước khi phê duyệt tích xanh.
                  </span>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="px-6 py-4 bg-muted/20 border-t flex items-center justify-between gap-3">
                <Button variant="outline" size="sm" onClick={() => setModalOpen(false)} className="cursor-pointer text-xs">
                  Đóng
                </Button>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="cursor-pointer text-xs gap-1.5 text-rose-700 bg-rose-50/50 border-rose-200/80 hover:bg-rose-100/70"
                    onClick={() => openReject(selected)}
                  >
                    <ShieldX className="size-3.5" /> Từ chối hồ sơ
                  </Button>
                  <Button
                    size="sm"
                    className="cursor-pointer text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
                    onClick={() => approve(selected)}
                  >
                    <ShieldCheck className="size-3.5" /> Phê duyệt tích xanh
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Image Zoom Overlay */}
      <ImageZoomOverlay src={zoomSrc} onClose={() => setZoomSrc(null)} alt="CCCD" />

      {/* Confirm Reject Dialog */}
      <AlertDialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <AlertDialogContent className="rounded-2xl border shadow-xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-rose-600 text-base font-bold">Xác nhận từ chối hồ sơ CCCD</AlertDialogTitle>
            <AlertDialogDescription className="text-xs">
              Hồ sơ xác minh của <strong>{rejectTarget?.name}</strong> sẽ bị từ chối. Người dùng sẽ nhận thông báo kèm lý do và có thể nộp lại ảnh mới.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-2">
            <label className="text-xs font-medium text-muted-foreground block mb-1.5">Lý do từ chối cụ thể</label>
            <Textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Vd: Ảnh bị mờ, lóa sáng không rõ số CCCD; Ảnh mất góc; Họ tên không khớp..."
              rows={3}
              className="resize-none text-xs"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel className="cursor-pointer text-xs">Hủy</AlertDialogCancel>
            <AlertDialogAction className="bg-rose-600 hover:bg-rose-700 text-white cursor-pointer text-xs" onClick={confirmReject}>
              Xác nhận từ chối
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
