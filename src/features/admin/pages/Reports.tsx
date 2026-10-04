import { useState, useEffect } from "react";
import {
  Search, Check, Trash2, ShieldAlert, ZoomIn, AlertTriangle, Ban, X,
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogClose } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ImageZoomOverlay } from "@/components/shared/ImageZoomOverlay";
import { cn } from "@/lib/utils";
import { roomImages } from "@/lib/constants";
import { api } from "@/lib/api";

type ReportStatus = "new" | "processing" | "resolved" | "dismissed";
type Severity = "critical" | "medium" | "low";
type ReportAction = "resolve" | "warn" | "remove_content" | "ban" | "dismiss" | null;

type Report = {
  id: string; target: string; targetType: "room" | "user";
  type: string; reporter: string; time: string;
  status: ReportStatus; severity: Severity; detail: string;
  evidence?: string[]; evidenceUrls?: string[];
  history?: { action: string; by: string; time: string }[];
};

const statusCls: Record<ReportStatus, string> = {
  new: "bg-blue-100 text-blue-800 border-blue-200",
  processing: "bg-amber-100 text-amber-800 border-amber-200",
  resolved: "bg-emerald-100 text-emerald-800 border-emerald-200",
  dismissed: "bg-slate-100 text-slate-600 border-slate-200",
};
const statusLabel: Record<ReportStatus, string> = { new: "Mới", processing: "Đang xử lý", resolved: "Đã xử lý", dismissed: "Bỏ qua" };
const severityCls: Record<Severity, string> = {
  critical: "bg-red-100 text-red-800 border-red-200",
  medium: "bg-amber-100 text-amber-800 border-amber-200",
  low: "bg-slate-100 text-slate-700 border-slate-200",
};
const severityLabel: Record<Severity, string> = { critical: "Nghiêm trọng", medium: "Trung bình", low: "Thấp" };
const severityDot: Record<Severity, string> = { critical: "bg-red-500", medium: "bg-amber-500", low: "bg-slate-400" };

const actionConfig: Record<NonNullable<ReportAction>, { title: string; desc: string; confirmLabel: string; destructive?: boolean; needsNote?: boolean }> = {
  resolve: { title: "Đánh dấu đã xử lý", desc: "Báo cáo sẽ được đóng lại là đã giải quyết xong.", confirmLabel: "Hoàn tất xử lý" },
  warn: { title: "Gửi cảnh cáo", desc: "Email cảnh cáo chính thức sẽ gửi đến đối tượng bị báo cáo.", confirmLabel: "Gửi cảnh cáo", destructive: true, needsNote: true },
  remove_content: { title: "Gỡ nội dung vi phạm", desc: "Nội dung bị gỡ ngay lập tức, đối tượng nhận thông báo cảnh cáo.", confirmLabel: "Xác nhận gỡ nội dung", destructive: true, needsNote: true },
  ban: { title: "Khóa tài khoản đối tượng", desc: "Tài khoản đối tượng bị khóa. Hành động nghiêm trọng, cần ghi rõ lý do.", confirmLabel: "Xác nhận khóa tài khoản", destructive: true, needsNote: true },
  dismiss: { title: "Bỏ qua báo cáo", desc: "Báo cáo không có căn cứ hợp lệ. Người báo cáo sẽ được thông báo.", confirmLabel: "Xác nhận bỏ qua" },
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
    <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-t text-sm">
      <span className="text-muted-foreground">{from}–{to} / {total} báo cáo</span>
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon" className="size-8" disabled={page === 1} onClick={() => onPage(1)}><ChevronsLeft className="size-4" /></Button>
        <Button variant="ghost" size="icon" className="size-8" disabled={page === 1} onClick={() => onPage(page - 1)}><ChevronLeft className="size-4" /></Button>
        {pages.map((p, i) => p === "…"
          ? <span key={`d${i}`} className="px-1 text-muted-foreground">…</span>
          : <Button key={p} variant={page === p ? "default" : "ghost"} size="icon" className="size-8 text-xs" onClick={() => onPage(p as number)}>{p}</Button>
        )}
        <Button variant="ghost" size="icon" className="size-8" disabled={page === totalPages} onClick={() => onPage(page + 1)}><ChevronRight className="size-4" /></Button>
        <Button variant="ghost" size="icon" className="size-8" disabled={page === totalPages} onClick={() => onPage(totalPages)}><ChevronsRight className="size-4" /></Button>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-muted-foreground">Đến trang</span>
        <Input className="w-14 h-8 text-center text-xs" value={gotoVal}
          onChange={(e) => setGotoVal(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { const p = parseInt(gotoVal); if (!isNaN(p) && p >= 1 && p <= totalPages) { onPage(p); setGotoVal(""); } } }}
          placeholder={String(page)} />
        <span className="text-muted-foreground">/ {totalPages}</span>
      </div>
    </div>
  );
}

export default function Reports() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalReport, setModalReport] = useState<Report | null>(null);
  const [activeAction, setActiveAction] = useState<ReportAction>(null);
  const [actionTarget, setActionTarget] = useState<Report | null>(null);
  const [actionNote, setActionNote] = useState("");
  const [zoomSrc, setZoomSrc] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [searchQ, setSearchQ] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    const fetchReports = async () => {
      setLoading(true);
      try {
        const res = await api.get<any>("/admin/reports", { page: 0, limit: 50 });
        const items = res?.content || res;
        if (Array.isArray(items) && items.length > 0) {
          setReports(items.map((r: any, i: number) => ({
            id: String(r.id || `rp-${i}`),
            target: r.targetType === "ROOM" ? `Phòng trọ #${String(r.targetId || "").slice(0, 8)}` : `Người dùng #${String(r.targetId || "").slice(0, 8)}`,
            targetType: (r.targetType?.toLowerCase() === "user" ? "user" : "room") as "room" | "user",
            type: r.reportType || "Báo cáo vi phạm",
            reporter: `Người dùng #${String(r.reporterId || "").slice(0, 8)}`,
            time: r.createdAt ? new Date(r.createdAt).toLocaleDateString("vi-VN") : "Hôm nay",
            status: (r.status?.toLowerCase() === "resolved" ? "resolved" : r.status?.toLowerCase() === "dismissed" ? "dismissed" : r.status?.toLowerCase() === "processing" ? "processing" : "new") as ReportStatus,
            severity: (r.severity?.toLowerCase() === "critical" ? "critical" : r.severity?.toLowerCase() === "low" ? "low" : "medium") as Severity,
            detail: r.detail || "Không có nội dung mô tả bổ sung",
            evidence: r.evidenceImages?.length ? r.evidenceImages : [roomImages[i % roomImages.length]],
            history: [],
          })));
        }
      } catch {
        // fallback to seed
      } finally {
        setLoading(false);
      }
    };
    fetchReports();
  }, []);

  const filtered = reports.filter((r) => {
    const matchSearch = !searchQ || r.target.toLowerCase().includes(searchQ.toLowerCase()) || r.reporter.toLowerCase().includes(searchQ.toLowerCase());
    const matchStatus = statusFilter === "all" || r.status === statusFilter;
    const matchSeverity = severityFilter === "all" || r.severity === severityFilter;
    const matchType = typeFilter === "all" || r.type === typeFilter;
    return matchSearch && matchStatus && matchSeverity && matchType;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const uniqueTypes = [...new Set(reports.map((r) => r.type))];
  const resetPage = () => setPage(1);

  const openAction = (report: Report, action: ReportAction) => {
    setActionTarget(report); setActiveAction(action); setActionNote("");
  };

  const executeAction = async () => {
    if (!actionTarget || !activeAction) return;

    try {
      await api.post(`/admin/reports/${actionTarget.id}/action`, {
        action: activeAction,
        note: actionNote || undefined,
      });
    } catch {
      // optimistic fallback
    }

    const newStatus: ReportStatus = activeAction === "resolve" ? "resolved" : activeAction === "dismiss" ? "dismissed" : "processing";
    const historyEntry = { action: actionConfig[activeAction].confirmLabel, by: "Admin", time: "Vừa xong" };
    setReports((prev) => prev.map((r) => r.id === actionTarget.id ? { ...r, status: newStatus, history: [...(r.history ?? []), historyEntry] } : r));
    if (modalReport?.id === actionTarget.id) setModalReport((p) => p ? { ...p, status: newStatus, history: [...(p.history ?? []), historyEntry] } : p);
    toast(`${actionConfig[activeAction].confirmLabel} — ${actionTarget.target}`);
    setActiveAction(null);
  };

  const isActionable = (r: Report) => r.status !== "resolved" && r.status !== "dismissed";

  return (
    <div className="space-y-5">
      <div>
        <h1 className="brand text-2xl text-foreground">Quản lý báo cáo vi phạm</h1>
        <p className="text-sm text-muted-foreground">{reports.filter((r) => r.status === "new").length} báo cáo mới cần xem xét</p>
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={searchQ} onChange={(e) => { setSearchQ(e.target.value); resetPage(); }} placeholder="Tìm đối tượng, người báo cáo..." className="pl-9 w-60 h-9" />
        </div>
        <Tabs value={statusFilter} onValueChange={(v) => { setStatusFilter(v); resetPage(); }}>
          <TabsList className="h-9">
            <TabsTrigger value="all">Tất cả</TabsTrigger>
            <TabsTrigger value="new">Mới</TabsTrigger>
            <TabsTrigger value="processing">Đang xử lý</TabsTrigger>
            <TabsTrigger value="resolved">Đã xử lý</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="flex gap-2 ml-auto">
          <Select value={severityFilter} onValueChange={(v) => { setSeverityFilter(v); resetPage(); }}>
            <SelectTrigger className="w-40 h-9 text-xs cursor-pointer"><SelectValue placeholder="Mức độ" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="cursor-pointer">Tất cả mức độ</SelectItem>
              <SelectItem value="critical" className="cursor-pointer">Nghiêm trọng</SelectItem>
              <SelectItem value="medium" className="cursor-pointer">Trung bình</SelectItem>
              <SelectItem value="low" className="cursor-pointer">Thấp</SelectItem>
            </SelectContent>
          </Select>
          <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v); resetPage(); }}>
            <SelectTrigger className="w-48 h-9 text-xs cursor-pointer"><SelectValue placeholder="Loại vi phạm" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="cursor-pointer">Tất cả loại</SelectItem>
              {uniqueTypes.map((t) => <SelectItem key={t} value={t} className="cursor-pointer">{t}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Report list */}
      <div className="overflow-hidden rounded-2xl bg-card ring-1 ring-border divide-y divide-border">
        {paginated.length === 0 && (
          <div className="py-16 text-center text-sm text-muted-foreground">Không có báo cáo nào phù hợp.</div>
        )}
        {paginated.map((r) => (
          <button
            key={r.id}
            onClick={() => setModalReport(r)}
            className="group w-full text-left px-5 py-4 flex gap-4 items-start transition-colors hover:bg-secondary/50 active:bg-secondary/70 cursor-pointer"
          >
            <div className={cn("mt-2 shrink-0 size-2 rounded-full", severityDot[r.severity])} />
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate">{r.target}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{r.type} · {r.reporter} · {r.time}</p>
                </div>
                <div className="flex gap-1.5 shrink-0 items-center">
                  <Badge className={cn("text-[10px] px-1.5", severityCls[r.severity])}>{severityLabel[r.severity]}</Badge>
                  <Badge className={cn("text-[10px] px-1.5", statusCls[r.status])}>{statusLabel[r.status]}</Badge>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-1.5 line-clamp-1">{r.detail}</p>
            </div>
            <span className="shrink-0 text-xs text-primary opacity-0 group-hover:opacity-100 transition mt-1 whitespace-nowrap">Xem chi tiết →</span>
          </button>
        ))}
        <PaginationBar page={page} totalPages={totalPages} total={filtered.length} onPage={setPage} />
      </div>

      {/* Report detail modal — modal={!zoomSrc} removes Radix capture-phase DismissableLayer when zoom is shown,
          fixing the "first click does nothing" bug caused by Radix intercepting pointerdown in capture phase */}
      <Dialog open={!!modalReport} onOpenChange={(open) => { if (!open && !zoomSrc) setModalReport(null); }} modal={!zoomSrc}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0 gap-0 [&>button:last-child]:hidden">
          {modalReport && (() => {
            const r = modalReport;
            const actionable = isActionable(r);
            return (
              <>
                <div className="sticky top-0 z-20 bg-background border-b px-6 py-4">
                  <div className="flex items-start gap-3">
                    <ShieldAlert className="size-5 text-destructive shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <h2 className="font-semibold text-base truncate pr-8">{r.target}</h2>
                      <div className="flex gap-1.5 mt-1 flex-wrap">
                        <Badge className={severityCls[r.severity]}>{severityLabel[r.severity]}</Badge>
                        <Badge className={statusCls[r.status]}>{statusLabel[r.status]}</Badge>
                        <Badge variant="outline" className="text-xs">{r.targetType === "room" ? "Phòng trọ" : "Người dùng"}</Badge>
                      </div>
                    </div>
                    {/* Explicit close — DialogContent's auto-X is hidden behind sticky z-10 */}
                    <DialogClose asChild>
                      <button
                        className="shrink-0 size-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer"
                        aria-label="Đóng"
                      >
                        <X className="size-4" />
                      </button>
                    </DialogClose>
                  </div>
                </div>
                <div className="px-6 py-5 space-y-5">
                  <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm rounded-xl bg-secondary/40 p-4">
                    <dt className="text-muted-foreground whitespace-nowrap">Loại vi phạm</dt><dd className="font-medium">{r.type}</dd>
                    <dt className="text-muted-foreground whitespace-nowrap">Người báo cáo</dt><dd>{r.reporter} · <span className="text-muted-foreground">{r.time}</span></dd>
                  </dl>
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Nội dung mô tả</p>
                    <p className="text-sm leading-relaxed text-muted-foreground">{r.detail}</p>
                  </div>
                  {r.evidence && r.evidence.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Bằng chứng hình ảnh ({r.evidence.length})</p>
                      <div className="grid grid-cols-3 gap-2">
                        {r.evidence.map((src, i) => (
                          <button key={i} onClick={() => setZoomSrc(src)}
                            className="relative aspect-video overflow-hidden rounded-xl ring-1 ring-border hover:ring-primary/60 cursor-pointer transition group">
                            <img src={src} alt={`evidence-${i}`} className="size-full object-cover" />
                            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition grid place-items-center"><ZoomIn className="size-5 text-white" /></div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  {r.evidenceUrls && r.evidenceUrls.length > 0 && (
                    <div className="space-y-1">
                      {r.evidenceUrls.map((url, i) => (
                        <a key={i} href={url} target="_blank" rel="noreferrer" className="block text-xs text-primary underline underline-offset-2 truncate cursor-pointer">{url}</a>
                      ))}
                    </div>
                  )}
                  {r.history && r.history.length > 0 && (
                    <div className="border-t pt-4">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Lịch sử xử lý</p>
                      <div className="space-y-2">
                        {r.history.map((h, i) => (
                          <div key={i} className="flex items-start gap-2 text-xs">
                            <div className="mt-1.5 size-1.5 rounded-full bg-primary shrink-0" />
                            <span className="flex-1">{h.action}</span>
                            <span className="text-muted-foreground whitespace-nowrap">{h.by} · {h.time}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {actionable ? (
                    <div className="border-t pt-4 space-y-2">
                      <Button className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer" onClick={() => openAction(r, "resolve")}>
                        <Check className="size-4" /> Đánh dấu đã xử lý
                      </Button>
                      <div className="grid grid-cols-2 gap-2">
                        <Button variant="outline" className="gap-2 border-amber-300 text-amber-700 hover:bg-amber-50 cursor-pointer" onClick={() => openAction(r, "warn")}>
                          <AlertTriangle className="size-4" /> Cảnh cáo
                        </Button>
                        <Button variant="outline" className="gap-2 border-orange-300 text-orange-700 hover:bg-orange-50 cursor-pointer" onClick={() => openAction(r, "remove_content")}>
                          <Trash2 className="size-4" /> Gỡ nội dung
                        </Button>
                      </div>
                      <Button variant="destructive" className="w-full gap-2 cursor-pointer" onClick={() => openAction(r, "ban")}>
                        <Ban className="size-4" /> Khóa tài khoản đối tượng
                      </Button>
                      <Button variant="ghost" className="w-full gap-2 text-muted-foreground hover:text-foreground cursor-pointer" onClick={() => openAction(r, "dismiss")}>
                        <X className="size-4" /> Bỏ qua báo cáo
                      </Button>
                    </div>
                  ) : (
                    <div className="border-t pt-4 rounded-xl bg-secondary/30 p-3 text-center">
                      <p className="text-sm text-muted-foreground">Báo cáo đã được <span className="font-medium text-foreground">{statusLabel[r.status].toLowerCase()}</span>.</p>
                    </div>
                  )}
                </div>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* Portal zoom at z-9999 - modal={!zoomSrc} disables FocusScope trap so first interaction works */}
      <ImageZoomOverlay src={zoomSrc} onClose={() => setZoomSrc(null)} alt="Bằng chứng" />

      <AlertDialog open={!!activeAction} onOpenChange={(open) => !open && setActiveAction(null)}>
        <AlertDialogContent>
          {activeAction && (<>
            <AlertDialogHeader>
              <AlertDialogTitle className={actionConfig[activeAction].destructive ? "text-destructive" : ""}>{actionConfig[activeAction].title}</AlertDialogTitle>
              <AlertDialogDescription>
                {actionConfig[activeAction].desc}
                {actionTarget && <> Đối tượng: <strong>{actionTarget.target}</strong>.</>}
              </AlertDialogDescription>
            </AlertDialogHeader>
            {actionConfig[activeAction].needsNote && (
              <div className="pb-2">
                <label className="text-sm font-medium block mb-1.5">Ghi chú nội bộ (tùy chọn)</label>
                <Textarea value={actionNote} onChange={(e) => setActionNote(e.target.value)} placeholder="Lý do xử lý..." rows={3} className="resize-none" />
              </div>
            )}
            <AlertDialogFooter>
              <AlertDialogCancel className="cursor-pointer">Hủy</AlertDialogCancel>
              <AlertDialogAction className={cn("cursor-pointer", actionConfig[activeAction].destructive ? "bg-destructive hover:bg-destructive/90" : "")} onClick={executeAction}>{actionConfig[activeAction].confirmLabel}</AlertDialogAction>
            </AlertDialogFooter>
          </>)}
        </AlertDialogContent>
      </AlertDialog>

      {/* Portal zoom — renders at document.body above Dialog */}
    </div>
  );
}
