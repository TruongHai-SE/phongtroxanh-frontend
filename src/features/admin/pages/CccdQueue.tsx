import { useState, useEffect, useMemo } from "react";
import {
  Check, X, Eye, ZoomIn, ShieldCheck, ShieldX, Calendar,
  Loader2, RefreshCw, FileText, AlertCircle, Mail, Phone,
  Search, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ImageWithFallback } from "@/components/shared/ImageWithFallback";
import { ImageZoomOverlay } from "@/components/shared/ImageZoomOverlay";
import { Dialog, DialogContent } from "@/components/ui/dialog";
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
    <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 bg-muted/20 border-t border-border text-sm">
      <span className="text-muted-foreground text-xs font-medium">
        Hiển thị <strong className="text-foreground">{from}–{to}</strong> trong tổng số <strong className="text-foreground">{total}</strong> hồ sơ chờ duyệt
      </span>
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon" className="size-8 cursor-pointer active:scale-95" disabled={page === 1} onClick={() => onPage(1)}>
          <ChevronsLeft className="size-4" />
        </Button>
        <Button variant="ghost" size="icon" className="size-8 cursor-pointer active:scale-95" disabled={page === 1} onClick={() => onPage(page - 1)}>
          <ChevronLeft className="size-4" />
        </Button>
        {pages.map((p, i) => p === "…"
          ? <span key={`d${i}`} className="px-1 text-muted-foreground text-xs">…</span>
          : (
            <Button
              key={p}
              variant={page === p ? "default" : "ghost"}
              size="icon"
              className={cn(
                "size-8 text-xs font-semibold cursor-pointer active:scale-95",
                page === p && "bg-primary text-primary-foreground shadow-2xs"
              )}
              onClick={() => onPage(p as number)}
            >
              {p}
            </Button>
          )
        )}
        <Button variant="ghost" size="icon" className="size-8 cursor-pointer active:scale-95" disabled={page === totalPages} onClick={() => onPage(page + 1)}>
          <ChevronRight className="size-4" />
        </Button>
        <Button variant="ghost" size="icon" className="size-8 cursor-pointer active:scale-95" disabled={page === totalPages} onClick={() => onPage(totalPages)}>
          <ChevronsRight className="size-4" />
        </Button>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-muted-foreground text-xs">Đến trang</span>
        <Input
          className="w-12 h-7 text-center text-xs bg-background"
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

function IdCardPlaceholder({ side }: { side: "front" | "back" }) {
  return (
    <div className="size-full flex flex-col items-center justify-center bg-slate-100 text-slate-400 p-1.5 text-center select-none">
      <FileText className="size-4 text-slate-400 mb-0.5" />
      <span className="text-[10px] font-medium text-slate-600 leading-tight">
        {side === "front" ? "Mặt trước" : "Mặt sau"}
      </span>
      <span className="text-[9px] text-slate-400">Chưa có ảnh</span>
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
    <div className="space-y-3">
      {/* ── COMPACT HEADER & UNIFIED FILTER BAR ── */}
      <div className="flex flex-col gap-2.5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              Duyệt xác minh CCCD
            </h1>
            <Badge className="bg-mint text-emerald-deep border-primary/20 font-semibold text-xs px-2.5 py-0.5">
              {queue.length} chờ duyệt
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Đối chiếu ảnh chụp Căn cước công dân 2 mặt để cấp huy hiệu xác minh và cộng 25 điểm uy tín
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 sm:w-64 sm:flex-initial">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              placeholder="Tìm tên, email, số điện thoại..."
              className="pl-9 pr-8 h-9 text-xs sm:text-sm rounded-xl bg-card"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setPage(1);
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5 cursor-pointer"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>

          <Button
            variant="outline"
            size="sm"
            className="h-9 px-3 gap-1.5 cursor-pointer text-xs sm:text-sm rounded-xl bg-card active:scale-95"
            onClick={loadQueue}
            disabled={loading}
          >
            <RefreshCw className={cn("size-3.5", loading && "animate-spin")} />
            <span>Làm mới</span>
          </Button>
        </div>
      </div>

      {/* ── ROLE FILTER TABS (Đồng bộ kích thước với Chủ trọ) ── */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border">
        <div className="flex flex-wrap gap-1">
          {[
            { id: "all" as const, label: `Tất cả hồ sơ (${queue.length})` },
            { id: "TENANT" as const, label: `Người thuê (${tenantCount})` },
            { id: "LANDLORD" as const, label: `Chủ trọ (${landlordCount})` },
          ].map((tabItem) => {
            const active = roleFilter === tabItem.id;
            return (
              <button
                key={tabItem.id}
                type="button"
                onClick={() => {
                  setRoleFilter(tabItem.id);
                  setPage(1);
                }}
                className={cn(
                  "pb-2.5 px-3.5 text-sm font-semibold transition-all cursor-pointer border-b-2",
                  active
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                {tabItem.label}
              </button>
            );
          })}
        </div>
        <span className="hidden sm:inline text-xs text-muted-foreground pb-2">
          Nhấp trực tiếp vào ảnh CCCD để phóng to kiểm tra
        </span>
      </div>

      {loading && (
        <div className="flex flex-col items-center justify-center py-16 gap-3 rounded-2xl bg-card border">
          <Loader2 className="size-7 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Đang tải danh sách hồ sơ CCCD...</p>
        </div>
      )}

      {!loading && queue.length === 0 && (
        <div className="flex flex-col items-center py-14 gap-3 rounded-2xl bg-card border text-center shadow-xs">
          <div className="grid size-12 place-items-center rounded-full bg-mint text-primary">
            <ShieldCheck className="size-6" />
          </div>
          <div>
            <p className="font-semibold text-foreground text-base">Đã duyệt hết hồ sơ!</p>
            <p className="text-sm text-muted-foreground max-w-sm mt-0.5">
              Hiện không còn yêu cầu xác minh CCCD nào đang chờ xử lý.
            </p>
          </div>
        </div>
      )}

      {!loading && queue.length > 0 && filtered.length === 0 && (
        <div className="flex flex-col items-center py-12 gap-2.5 rounded-2xl bg-card border text-center shadow-xs">
          <p className="font-semibold text-foreground text-sm">Không tìm thấy hồ sơ phù hợp</p>
          <p className="text-xs text-muted-foreground">
            Không có hồ sơ nào khớp với từ khóa &ldquo;{searchQuery}&rdquo;.
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
            Xem lại tất cả
          </Button>
        </div>
      )}

      {/* ── UNIFIED TABLE CARD CONTAINER (5 hồ sơ + Phân trang hiển thị trọn trong 1 màn hình) ── */}
      {!loading && paginated.length > 0 && (
        <div className="overflow-hidden rounded-2xl bg-card ring-1 ring-border shadow-2xs">
          {/* Desktop Column Header */}
          <div className="hidden lg:grid lg:grid-cols-[240px_1fr_140px_216px_240px] items-center gap-3 px-4 py-2.5 bg-secondary/50 border-b border-border text-xs font-semibold text-muted-foreground">
            <span>Người gửi hồ sơ</span>
            <span>Thông tin liên hệ</span>
            <span>Ngày gửi</span>
            <span>Ảnh chụp CCCD (2 mặt)</span>
            <span className="text-right pr-1">Thao tác kiểm duyệt</span>
          </div>

          <div className="divide-y divide-border/70">
            {paginated.map((u) => {
              const isProcessing = processingId === u.id;
              return (
                <div
                  key={u.id}
                  className={cn(
                    "flex flex-col lg:grid lg:grid-cols-[240px_1fr_140px_216px_240px] lg:items-center gap-3 px-4 py-2.5 transition-colors duration-150",
                    "hover:bg-mint/35"
                  )}
                >
                  {/* Cột 1: Người gửi hồ sơ */}
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar className="size-10 ring-1 ring-border shrink-0">
                      <AvatarImage src={u.avatar || undefined} />
                      <AvatarFallback className="bg-emerald-100 text-emerald-800 text-xs font-bold">
                        {getInitials(u.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate" title={u.name}>
                        {u.name}
                      </p>
                      <Badge
                        variant="outline"
                        className={cn(
                          "mt-0.5 text-[11px] px-2 py-0 font-medium",
                          u.role === "Chủ trọ"
                            ? "bg-indigo-50 text-indigo-700 border-indigo-200/80"
                            : "bg-sky-50 text-sky-700 border-sky-200/80"
                        )}
                      >
                        {u.role}
                      </Badge>
                    </div>
                  </div>

                  {/* Cột 2: Thông tin liên hệ */}
                  <div className="min-w-0 space-y-0.5 text-xs">
                    <div className="flex items-center gap-1.5 text-foreground font-medium truncate">
                      <Mail className="size-3.5 text-emerald-600 shrink-0" />
                      <span className="truncate">{u.email || "Chưa cập nhật email"}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Phone className="size-3.5 text-muted-foreground shrink-0" />
                      <span>{u.phone || "Chưa cập nhật số điện thoại"}</span>
                    </div>
                  </div>

                  {/* Cột 3: Ngày gửi */}
                  <div className="text-xs">
                    <div className="flex items-center gap-1.5 font-medium text-foreground">
                      <Calendar className="size-3.5 text-emerald-600 shrink-0" />
                      <span>{u.submitted}</span>
                    </div>
                    <span className="text-[11px] text-emerald-700 font-medium">
                      +25 điểm uy tín
                    </span>
                  </div>

                  {/* Cột 4: Ảnh chụp 2 mặt CCCD (Compact 98x58px) */}
                  <div className="flex items-center gap-2 shrink-0">
                    {[
                      { src: u.frontUrl, label: "Mặt trước", side: "front" as const },
                      { src: u.backUrl, label: "Mặt sau", side: "back" as const },
                    ].map((card, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => card.src && setZoomSrc(card.src)}
                        className={cn(
                          "relative h-[58px] w-[98px] overflow-hidden rounded-lg border bg-muted shrink-0 text-left transition-all duration-150 group",
                          card.src
                            ? "cursor-pointer hover:ring-2 hover:ring-primary/80 active:scale-[0.97]"
                            : "cursor-default opacity-80"
                        )}
                      >
                        {card.src ? (
                          <>
                            <ImageWithFallback
                              src={card.src}
                              alt={`CCCD ${card.label}`}
                              className="size-full object-cover"
                            />
                            <span className="absolute bottom-1 left-1 rounded bg-black/70 px-1.5 py-0.2 text-[9px] font-medium text-white">
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

                  {/* Cột 5: Nút hành động */}
                  <div className="flex items-center lg:justify-end gap-1.5 shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 px-2.5 text-xs gap-1 cursor-pointer hover:bg-secondary active:scale-95"
                      onClick={() => {
                        setSelected(u);
                        setModalOpen(true);
                      }}
                    >
                      <Eye className="size-3.5 text-muted-foreground" /> Chi tiết
                    </Button>
                    <Button
                      size="sm"
                      disabled={isProcessing}
                      className="h-8 px-3 text-xs gap-1 bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer shadow-2xs active:scale-95"
                      onClick={() => approve(u)}
                    >
                      {isProcessing ? <Loader2 className="size-3.5 animate-spin" /> : <Check className="size-3.5" />}
                      Duyệt
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={isProcessing}
                      className="h-8 px-2.5 text-xs gap-1 text-rose-700 bg-rose-50/50 border-rose-200/80 hover:bg-rose-100/70 cursor-pointer active:scale-95"
                      onClick={() => openReject(u)}
                    >
                      <X className="size-3.5" /> Từ chối
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Thanh phân trang tích hợp ngay đáy bảng */}
          <PaginationBar
            page={currentPage}
            totalPages={totalPages}
            total={filtered.length}
            onPage={setPage}
          />
        </div>
      )}

      {/* POPUP MODAL: Chi tiết hồ sơ CCCD */}
      <Dialog
        open={modalOpen}
        onOpenChange={(o) => {
          if (!o) {
            if (zoomSrc) {
              setZoomSrc(null);
            } else {
              setModalOpen(false);
            }
          }
        }}
      >
        <DialogContent className="sm:max-w-2xl max-h-[calc(100dvh-2rem)] p-0 overflow-hidden rounded-2xl border bg-card shadow-2xl">
          {selected && (
            <div className="flex flex-col max-h-[calc(100dvh-2rem)]">
              {/* Header profile */}
              <div className="shrink-0 p-5 sm:p-6 bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-transparent border-b">
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
              <div className="flex-1 overflow-y-auto min-h-0 p-5 sm:p-6 space-y-4">
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
              <div className="shrink-0 px-5 sm:px-6 py-3.5 bg-muted/20 border-t flex items-center justify-between gap-3">
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

              {/* Inline Zoom Overlay inside DialogContent to bypass Radix event trapping */}
              <ImageZoomOverlay
                src={zoomSrc}
                onClose={() => setZoomSrc(null)}
                alt="CCCD"
                usePortal={false}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Image Zoom Overlay for outer table thumbnail clicks */}
      {!modalOpen && (
        <ImageZoomOverlay src={zoomSrc} onClose={() => setZoomSrc(null)} alt="CCCD" />
      )}

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
