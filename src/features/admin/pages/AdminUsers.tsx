import { useState, useEffect } from "react";
import {
  Search, ShieldCheck, ShieldOff, MoreHorizontal, Ban, Mail, KeyRound,
  AlertTriangle, Unlock, User, Calendar, Star, Phone,
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Loader2,
  CheckCircle2, XCircle, Info, Sparkles,
} from "lucide-react";
import { api } from "@/lib/api";
import { adminApi } from "../api/adminApi";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { cn, getInitials } from "@/lib/utils";

type UserStatus = "active" | "locked" | "warned";
type ActionType = "lock" | "unlock" | "warn" | "reset_password" | "revoke_verify" | "grant_verify" | null;

type AdminUser = {
  id: string;
  name: string;
  avatar: string;
  email: string;
  phone: string;
  role: string;
  verified: boolean;
  status: UserStatus;
  trustScore: number;
  joined: string;
  reportCount: number;
};

const statusCls: Record<UserStatus, string> = {
  active: "bg-emerald-50 text-emerald-700 border-emerald-200/80 font-medium",
  locked: "bg-rose-50 text-rose-700 border-rose-200/80 font-medium",
  warned: "bg-amber-50 text-amber-700 border-amber-200/80 font-medium",
};
const statusLabel: Record<UserStatus, string> = { active: "Hoạt động", locked: "Bị khóa", warned: "Cảnh cáo" };

const roleCls: Record<string, string> = {
  "Người thuê": "bg-sky-50 text-sky-700 border-sky-200/80 font-medium",
  "Chủ trọ": "bg-indigo-50 text-indigo-700 border-indigo-200/80 font-medium",
};

const PAGE_SIZE = 8;

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
    <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-t text-sm bg-muted/20">
      <span className="text-muted-foreground text-xs">{from}–{to} trong {total} tài khoản</span>
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon" className="size-8" disabled={page === 1} onClick={() => onPage(1)}><ChevronsLeft className="size-4" /></Button>
        <Button variant="ghost" size="icon" className="size-8" disabled={page === 1} onClick={() => onPage(page - 1)}><ChevronLeft className="size-4" /></Button>
        {pages.map((p, i) => p === "…"
          ? <span key={`d${i}`} className="px-1 text-muted-foreground text-xs">…</span>
          : <Button key={p} variant={page === p ? "default" : "ghost"} size="icon" className="size-8 text-xs" onClick={() => onPage(p as number)}>{p}</Button>
        )}
        <Button variant="ghost" size="icon" className="size-8" disabled={page === totalPages} onClick={() => onPage(page + 1)}><ChevronRight className="size-4" /></Button>
        <Button variant="ghost" size="icon" className="size-8" disabled={page === totalPages} onClick={() => onPage(totalPages)}><ChevronsRight className="size-4" /></Button>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-muted-foreground text-xs">Đến trang</span>
        <Input className="w-12 h-8 text-center text-xs" value={gotoVal}
          onChange={(e) => setGotoVal(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { const p = parseInt(gotoVal); if (!isNaN(p) && p >= 1 && p <= totalPages) { onPage(p); setGotoVal(""); } } }}
          placeholder={String(page)} />
        <span className="text-muted-foreground text-xs">/ {totalPages}</span>
      </div>
    </div>
  );
}

const actionDialogConfig: Record<NonNullable<ActionType>, { title: string; desc: (n: string, e?: string) => string; confirmLabel: string; destructive?: boolean; needsReason?: boolean }> = {
  lock: { title: "Khóa tài khoản", desc: (n) => `Tài khoản ${n} sẽ bị tạm khóa, lập tức bị đăng xuất và không thể truy cập hệ thống.`, confirmLabel: "Xác nhận khóa", destructive: true, needsReason: true },
  unlock: { title: "Mở khóa tài khoản", desc: (n) => `Mở khóa và cho phép ${n} đăng nhập hoạt động bình thường.`, confirmLabel: "Xác nhận mở khóa" },
  warn: { title: "Gửi cảnh cáo vi phạm", desc: (n) => `Hệ thống sẽ gửi thông báo cảnh cáo chính thức đến ${n} và cập nhật trạng thái hồ sơ.`, confirmLabel: "Gửi cảnh cáo", destructive: true, needsReason: true },
  reset_password: {
    title: "Đặt lại mật khẩu & Gửi Email",
    desc: (n, e) => `Hệ thống sẽ tạo mật khẩu ngẫu nhiên an toàn và gửi trực tiếp qua email đăng ký của ${n} (${e || "email tài khoản"}). Mật khẩu KHÔNG hiển thị trên màn hình quản trị để đảm bảo bảo mật và quyền riêng tư tuyệt đối cho người dùng.`,
    confirmLabel: "Tạo & Gửi mật khẩu qua email",
  },
  revoke_verify: { title: "Thu hồi xác minh", desc: (n) => `Thu hồi huy hiệu tích xanh xác minh danh tính của ${n}.`, confirmLabel: "Xác nhận thu hồi", destructive: true },
  grant_verify: { title: "Cấp tích xanh xác minh", desc: (n) => `Cấp huy hiệu xác minh chính thức cho ${n} và cộng +30 điểm uy tín.`, confirmLabel: "Xác nhận cấp" },
};

export default function AdminUsers() {
  const [q, setQ] = useState("");
  const [tab, setTab] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [actionType, setActionType] = useState<ActionType>(null);
  const [actionTarget, setActionTarget] = useState<AdminUser | null>(null);
  const [actionReason, setActionReason] = useState("");
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [emailTarget, setEmailTarget] = useState<AdminUser | null>(null);
  const [emailContent, setEmailContent] = useState("");
  const [emailTitle, setEmailTitle] = useState("");
  const [submittingAction, setSubmittingAction] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get<any>("/admin/users", { page: 0, limit: 100 });
      const items = res?.content || res;
      if (Array.isArray(items) && items.length > 0) {
        setUsers(items.map((u: any, i: number) => ({
          id: u.id || `u-${i}`,
          name: u.fullName || u.email?.split("@")[0] || `User ${i + 1}`,
          avatar: u.avatarUrl || "",
          email: u.email || "",
          phone: u.phoneNumber || "0900000000",
          role: u.role === "LANDLORD" ? "Chủ trọ" : "Người thuê",
          verified: Boolean(u.isVerified),
          status: (u.status === "LOCKED" ? "locked" : u.status === "WARNED" ? "warned" : "active") as UserStatus,
          trustScore: u.trustScore ?? 50,
          joined: u.createdAt ? new Date(u.createdAt).toLocaleDateString("vi-VN") : "01/01/2026",
          reportCount: 0,
        })));
      }
    } catch {
      // keep fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const filtered = users.filter((u) => {
    const matchQ = u.name.toLowerCase().includes(q.toLowerCase()) || u.email.toLowerCase().includes(q.toLowerCase());
    const matchRole = roleFilter === "all" || u.role === (roleFilter === "tenant" ? "Người thuê" : "Chủ trọ");
    const matchTab = tab === "all" || (tab === "verified" && u.verified) || (tab === "unverified" && !u.verified) || (tab === "locked" && u.status === "locked");
    return matchQ && matchRole && matchTab;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const resetPage = () => setPage(1);
  const openAction = (user: AdminUser, type: ActionType) => { setActionTarget(user); setActionType(type); setActionReason(""); };

  const executeAction = async () => {
    if (!actionTarget || !actionType) return;
    setSubmittingAction(true);

    try {
      if (actionType === "lock" || actionType === "unlock" || actionType === "warn") {
        const backendStatus = actionType === "lock" ? "LOCKED" : actionType === "warn" ? "WARNED" : "ACTIVE";
        await adminApi.updateUserStatus(actionTarget.id, { status: backendStatus, reason: actionReason });
        setUsers((prev) => prev.map((u) => u.id === actionTarget.id ? { ...u, status: (actionType === "lock" ? "locked" : actionType === "warn" ? "warned" : "active") } : u));
        toast.success(actionType === "lock" ? `Đã khóa tài khoản ${actionTarget.name}` : actionType === "unlock" ? `Đã mở khóa cho ${actionTarget.name}` : `Đã gửi cảnh cáo đến ${actionTarget.name}`);
      } else if (actionType === "grant_verify") {
        await adminApi.verifyUser(actionTarget.id, true);
        setUsers((prev) => prev.map((u) => u.id === actionTarget.id ? { ...u, verified: true, trustScore: Math.min(100, u.trustScore + 30) } : u));
        toast.success(`Đã cấp tích xanh xác minh cho ${actionTarget.name}`);
      } else if (actionType === "revoke_verify") {
        await adminApi.verifyUser(actionTarget.id, false);
        setUsers((prev) => prev.map((u) => u.id === actionTarget.id ? { ...u, verified: false } : u));
        toast.success(`Đã thu hồi xác minh của ${actionTarget.name}`);
      } else if (actionType === "reset_password") {
        const res = await adminApi.resetUserPassword(actionTarget.id);
        const targetEmail = res?.maskedEmail || actionTarget.email || actionTarget.name;
        toast.success(`Đã tạo mật khẩu an toàn và gửi trực tiếp đến email ${targetEmail}`);
      }

      if (selectedUser?.id === actionTarget.id) {
        setSelectedUser((prev) => {
          if (!prev) return null;
          if (actionType === "lock") return { ...prev, status: "locked" };
          if (actionType === "unlock") return { ...prev, status: "active" };
          if (actionType === "warn") return { ...prev, status: "warned" };
          if (actionType === "grant_verify") return { ...prev, verified: true, trustScore: Math.min(100, prev.trustScore + 30) };
          if (actionType === "revoke_verify") return { ...prev, verified: false };
          return prev;
        });
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || "Thao tác không thành công, vui lòng thử lại.");
    } finally {
      setSubmittingAction(false);
      setActionType(null);
      setActionTarget(null);
    }
  };

  const handleSendNotice = async () => {
    if (!emailTarget || !emailContent.trim()) return;
    setSubmittingAction(true);
    try {
      await adminApi.notifyUser(emailTarget.id, {
        title: emailTitle.trim() || "Thông báo từ Quản Trị Viên",
        message: emailContent.trim(),
      });
      toast.success(`Đã gửi thông báo thành công đến ${emailTarget.name}`);
      setEmailDialogOpen(false);
      setEmailContent("");
      setEmailTitle("");
    } catch {
      toast.error("Không thể gửi thông báo, vui lòng thử lại.");
    } finally {
      setSubmittingAction(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="brand text-2xl font-bold tracking-tight text-foreground">Quản lý người dùng</h1>
          <p className="text-sm text-muted-foreground">Theo dõi, kiểm tra danh tính và can thiệp tài khoản hệ thống</p>
        </div>
        <div className="text-xs text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-lg border">
          Tổng cộng: <span className="font-semibold text-foreground">{users.length}</span> tài khoản
        </div>
      </div>

      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative max-w-xs flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => { setQ(e.target.value); resetPage(); }} placeholder="Tìm theo tên, email..." className="pl-9 bg-card" />
        </div>
        <Select value={roleFilter} onValueChange={(v) => { setRoleFilter(v); resetPage(); }}>
          <SelectTrigger className="w-40 bg-card cursor-pointer"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="cursor-pointer">Tất cả vai trò</SelectItem>
            <SelectItem value="tenant" className="cursor-pointer">Người thuê</SelectItem>
            <SelectItem value="landlord" className="cursor-pointer">Chủ trọ</SelectItem>
          </SelectContent>
        </Select>
        <Tabs value={tab} onValueChange={(v) => { setTab(v); resetPage(); }} className="ml-auto">
          <TabsList className="bg-muted/70 p-1">
            <TabsTrigger value="all">Tất cả</TabsTrigger>
            <TabsTrigger value="verified">Đã xác minh</TabsTrigger>
            <TabsTrigger value="unverified">Chưa xác minh</TabsTrigger>
            <TabsTrigger value="locked">Bị khóa</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="overflow-hidden rounded-2xl bg-card border shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead className="w-[320px]">Người dùng</TableHead>
              <TableHead className="w-[140px]">Vai trò</TableHead>
              <TableHead className="w-[140px]">Trạng thái</TableHead>
              <TableHead className="w-[160px]">Xác minh</TableHead>
              <TableHead className="w-[110px]">Điểm uy tín</TableHead>
              <TableHead className="text-right pr-4">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="py-16 text-center">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Loader2 className="size-6 animate-spin text-primary" />
                    <span className="text-sm text-muted-foreground">Đang tải danh sách người dùng...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : paginated.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-16 text-center text-muted-foreground">
                  Không tìm thấy người dùng phù hợp với tiêu chí lọc.
                </TableCell>
              </TableRow>
            ) : (
              paginated.map((u) => {
                const isSelected = selectedUser?.id === u.id;
                return (
                  <TableRow
                    key={u.id}
                    className={cn(
                      "cursor-pointer transition-colors duration-150 border-b",
                      "hover:bg-emerald-50/70 dark:hover:bg-emerald-950/25",
                      isSelected && "bg-emerald-50/90 dark:bg-emerald-950/40 border-l-4 border-l-emerald-600"
                    )}
                    onClick={() => { setSelectedUser(u); setModalOpen(true); }}
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="size-9 ring-1 ring-border shrink-0">
                          <AvatarImage src={u.avatar || undefined} />
                          <AvatarFallback className="bg-emerald-100 text-emerald-800 text-xs font-semibold">
                            {getInitials(u.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 pr-2">
                          <p className="text-sm font-semibold text-foreground truncate">{u.name}</p>
                          <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn("text-xs font-medium px-2 py-0.5", roleCls[u.role] ?? "")}>
                        {u.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn("text-xs font-medium px-2 py-0.5", statusCls[u.status])}>
                        {statusLabel[u.status]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {u.verified ? (
                        <Badge variant="outline" className="gap-1 bg-emerald-50 text-emerald-700 border-emerald-200/80 text-xs font-medium px-2 py-0.5">
                          <ShieldCheck className="size-3 text-emerald-600" /> Đã xác minh
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-xs text-muted-foreground px-2 py-0.5">
                          Chưa xác minh
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-sm text-emerald-600 dark:text-emerald-400">{u.trustScore}</span>
                        <span className="text-[10px] text-muted-foreground">/100</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right pr-4" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2.5 text-xs text-foreground/80 hover:text-foreground hover:bg-muted cursor-pointer"
                          onClick={() => { setSelectedUser(u); setModalOpen(true); }}
                        >
                          Hồ sơ
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="size-8 cursor-pointer text-muted-foreground hover:text-foreground">
                              <MoreHorizontal className="size-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-56 p-1.5 shadow-lg rounded-xl">
                            <DropdownMenuItem className="cursor-pointer text-xs py-2" onClick={() => { setSelectedUser(u); setModalOpen(true); }}>
                              <User className="mr-2 size-4 text-muted-foreground" /> Xem hồ sơ chi tiết
                            </DropdownMenuItem>
                            <DropdownMenuItem className="cursor-pointer text-xs py-2" onClick={() => { setEmailTarget(u); setEmailContent(""); setEmailTitle(""); setEmailDialogOpen(true); }}>
                              <Mail className="mr-2 size-4 text-muted-foreground" /> Gửi thông báo / Email
                            </DropdownMenuItem>
                            <DropdownMenuItem className="cursor-pointer text-xs py-2" onClick={() => openAction(u, "reset_password")}>
                              <KeyRound className="mr-2 size-4 text-muted-foreground" /> Reset & gửi mật khẩu qua email
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="my-1" />
                            {u.verified ? (
                              <DropdownMenuItem className="cursor-pointer text-xs py-2 text-amber-700 hover:text-amber-800" onClick={() => openAction(u, "revoke_verify")}>
                                <ShieldOff className="mr-2 size-4 text-amber-600" /> Gỡ xác minh
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem className="cursor-pointer text-xs py-2 text-emerald-700 hover:text-emerald-800" onClick={() => openAction(u, "grant_verify")}>
                                <ShieldCheck className="mr-2 size-4 text-emerald-600" /> Cấp xác minh thủ công
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem className="cursor-pointer text-xs py-2 text-amber-700 hover:text-amber-800" onClick={() => openAction(u, "warn")}>
                              <AlertTriangle className="mr-2 size-4 text-amber-600" /> Cảnh cáo tài khoản
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="my-1" />
                            {u.status === "locked" ? (
                              <DropdownMenuItem className="cursor-pointer text-xs py-2 text-emerald-700 hover:text-emerald-800 font-medium" onClick={() => openAction(u, "unlock")}>
                                <Unlock className="mr-2 size-4 text-emerald-600" /> Mở khóa tài khoản
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem className="cursor-pointer text-xs py-2 text-rose-700 hover:text-rose-800 font-medium" onClick={() => openAction(u, "lock")}>
                                <Ban className="mr-2 size-4 text-rose-600" /> Khóa tài khoản
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
        <PaginationBar page={page} totalPages={totalPages} total={filtered.length} onPage={setPage} />
      </div>

      {/* POPUP MODAL: Hồ sơ người dùng (Centered Dialog thay thế Slide Sheet) */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-xl p-0 overflow-hidden rounded-2xl border bg-card shadow-2xl">
          {selectedUser && (
            <div>
              {/* Header profile card */}
              <div className="p-6 bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-transparent border-b">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <Avatar className="size-16 ring-2 ring-emerald-600/20 shadow-sm shrink-0">
                      <AvatarImage src={selectedUser.avatar || undefined} />
                      <AvatarFallback className="bg-emerald-600 text-white font-bold text-lg">
                        {getInitials(selectedUser.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-bold text-lg text-foreground leading-tight">{selectedUser.name}</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">{selectedUser.email}</p>
                      <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                        <Badge variant="outline" className={cn("text-xs px-2 py-0.5", roleCls[selectedUser.role] ?? "")}>
                          {selectedUser.role}
                        </Badge>
                        <Badge variant="outline" className={cn("text-xs px-2 py-0.5", statusCls[selectedUser.status])}>
                          {statusLabel[selectedUser.status]}
                        </Badge>
                        {selectedUser.verified ? (
                          <Badge variant="outline" className="gap-1 bg-emerald-50 text-emerald-700 border-emerald-200/80 text-xs px-2 py-0.5">
                            <ShieldCheck className="size-3 text-emerald-600" /> Đã xác minh
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-xs text-muted-foreground px-2 py-0.5">
                            Chưa xác minh
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right shrink-0 bg-background/90 px-3 py-2 rounded-xl border shadow-xs">
                    <span className="text-[10px] text-muted-foreground uppercase font-semibold block">Điểm uy tín</span>
                    <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{selectedUser.trustScore}</span>
                    <span className="text-xs text-muted-foreground">/100</span>
                  </div>
                </div>
              </div>

              {/* Information Grid */}
              <div className="p-6 space-y-6">
                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Thông tin liên hệ & hệ thống</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/40 border">
                      <Mail className="size-4 text-emerald-600 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-[11px] text-muted-foreground">Hộp thư Email</p>
                        <p className="font-medium text-foreground truncate">{selectedUser.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/40 border">
                      <Phone className="size-4 text-emerald-600 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-[11px] text-muted-foreground">Số điện thoại</p>
                        <p className="font-medium text-foreground">{selectedUser.phone || "Chưa cập nhật"}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/40 border">
                      <Calendar className="size-4 text-emerald-600 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-[11px] text-muted-foreground">Ngày tham gia</p>
                        <p className="font-medium text-foreground">{selectedUser.joined}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/40 border">
                      <Star className="size-4 text-emerald-600 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-[11px] text-muted-foreground">Huy hiệu tín nhiệm</p>
                        <p className="font-medium text-foreground">{selectedUser.trustScore >= 80 ? "Người dùng xuất sắc" : selectedUser.trustScore >= 50 ? "Người dùng tiêu chuẩn" : "Cần theo dõi"}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Harmonious Action Suite */}
                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Hành động can thiệp tài khoản</h4>
                  <div className="space-y-2.5">
                    {/* Operational Actions */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-9 justify-center gap-1.5 cursor-pointer text-xs font-medium border-border/80 hover:bg-muted hover:text-foreground"
                        onClick={() => { setEmailTarget(selectedUser); setEmailContent(""); setEmailTitle(""); setEmailDialogOpen(true); }}
                      >
                        <Mail className="size-3.5 text-muted-foreground" /> Gửi thông báo
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-9 justify-center gap-1.5 cursor-pointer text-xs font-medium border-border/80 hover:bg-muted hover:text-foreground"
                        onClick={() => openAction(selectedUser, "reset_password")}
                      >
                        <KeyRound className="size-3.5 text-muted-foreground" /> Reset & gửi email mật khẩu
                      </Button>
                      {selectedUser.verified ? (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-9 justify-center gap-1.5 cursor-pointer text-xs font-medium text-amber-700 bg-amber-50/60 border-amber-200/80 hover:bg-amber-100/70"
                          onClick={() => openAction(selectedUser, "revoke_verify")}
                        >
                          <ShieldOff className="size-3.5" /> Gỡ xác minh
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-9 justify-center gap-1.5 cursor-pointer text-xs font-medium text-emerald-700 bg-emerald-50/60 border-emerald-200/80 hover:bg-emerald-100/70"
                          onClick={() => openAction(selectedUser, "grant_verify")}
                        >
                          <ShieldCheck className="size-3.5" /> Cấp xác minh
                        </Button>
                      )}
                    </div>

                    {/* Safety / Restrictive Actions */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-9 justify-center gap-1.5 cursor-pointer text-xs font-medium text-amber-700 bg-amber-50/40 border-amber-200/70 hover:bg-amber-100/60"
                        onClick={() => openAction(selectedUser, "warn")}
                      >
                        <AlertTriangle className="size-3.5" /> Gửi cảnh cáo tài khoản
                      </Button>
                      {selectedUser.status === "locked" ? (
                        <Button
                          size="sm"
                          className="h-9 justify-center gap-1.5 cursor-pointer text-xs font-medium bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
                          onClick={() => openAction(selectedUser, "unlock")}
                        >
                          <Unlock className="size-3.5" /> Mở khóa tài khoản
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-9 justify-center gap-1.5 cursor-pointer text-xs font-medium text-rose-700 bg-rose-50/50 border-rose-200/80 hover:bg-rose-100/70"
                          onClick={() => openAction(selectedUser, "lock")}
                        >
                          <Ban className="size-3.5" /> Khóa tài khoản
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal footer */}
              <div className="px-6 py-4 bg-muted/20 border-t flex justify-end">
                <Button variant="outline" size="sm" onClick={() => setModalOpen(false)} className="cursor-pointer text-xs">
                  Đóng hồ sơ
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog for Sensitive Actions */}
      <AlertDialog open={!!actionType} onOpenChange={(open) => !open && setActionType(null)}>
        <AlertDialogContent className="rounded-2xl border shadow-xl">
          {actionType && (
            <>
              <AlertDialogHeader>
                <AlertDialogTitle className={actionDialogConfig[actionType].destructive ? "text-rose-600" : ""}>
                  {actionDialogConfig[actionType].title}
                </AlertDialogTitle>
                <AlertDialogDescription className="text-sm">
                  {actionDialogConfig[actionType].desc(actionTarget?.name ?? "", actionTarget?.email)}
                </AlertDialogDescription>
              </AlertDialogHeader>
              {actionDialogConfig[actionType].needsReason && (
                <div className="py-2">
                  <label className="text-xs font-medium text-muted-foreground block mb-1.5">Lý do thực hiện (tùy chọn lưu log)</label>
                  <Textarea value={actionReason} onChange={(e) => setActionReason(e.target.value)} placeholder="Nhập lý do gửi đến người dùng hoặc lưu nhật ký kiểm toán..." rows={3} className="resize-none text-sm" />
                </div>
              )}
              <AlertDialogFooter>
                <AlertDialogCancel disabled={submittingAction} className="cursor-pointer text-xs">Hủy</AlertDialogCancel>
                <AlertDialogAction
                  disabled={submittingAction}
                  className={cn(
                    "cursor-pointer text-xs gap-1.5",
                    actionDialogConfig[actionType].destructive
                      ? "bg-rose-600 hover:bg-rose-700 text-white"
                      : "bg-emerald-600 hover:bg-emerald-700 text-white"
                  )}
                  onClick={executeAction}
                >
                  {submittingAction && <Loader2 className="size-3.5 animate-spin" />}
                  {actionDialogConfig[actionType].confirmLabel}
                </AlertDialogAction>
              </AlertDialogFooter>
            </>
          )}
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog Gửi Email / Thông Báo Trực Tiếp */}
      <Dialog open={emailDialogOpen} onOpenChange={setEmailDialogOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl border shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">Gửi thông báo / Email</DialogTitle>
            <DialogDescription className="text-xs">
              Gửi thông điệp trực tiếp từ ban quản trị đến tài khoản <strong>{emailTarget?.name}</strong> ({emailTarget?.email})
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Tiêu đề thông báo</label>
              <Input
                value={emailTitle}
                onChange={(e) => setEmailTitle(e.target.value)}
                placeholder="Vd: Nhắc nhở cập nhật hồ sơ, Cảnh báo vi phạm nội quy..."
                className="text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Nội dung chi tiết</label>
              <Textarea
                value={emailContent}
                onChange={(e) => setEmailContent(e.target.value)}
                placeholder="Nhập nội dung thông điệp gửi đến người dùng..."
                rows={4}
                className="resize-none text-sm"
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" size="sm" className="cursor-pointer text-xs" onClick={() => setEmailDialogOpen(false)}>
              Hủy
            </Button>
            <Button
              size="sm"
              className="cursor-pointer text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
              disabled={!emailContent.trim() || submittingAction}
              onClick={handleSendNotice}
            >
              {submittingAction && <Loader2 className="size-3.5 animate-spin" />}
              Gửi ngay
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
