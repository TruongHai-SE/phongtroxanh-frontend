import { useState, useEffect } from "react";
import {
  Zap, Plus, Pencil, Trash2, Loader2, Sparkles, CheckCircle2, AlertTriangle, Info, BellRing,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { formatVND, cn } from "@/lib/utils";
import { paymentApi, parseFeatures } from "@/features/monetization/api/paymentApi";
import type { PackagePlan } from "@/features/monetization/types/payment.types";
import { toast } from "sonner";

export default function AdminPackages() {
  const [plans, setPlans] = useState<PackagePlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [roleTab, setRoleTab] = useState<"ALL" | "TENANT" | "LANDLORD">("ALL");

  // Form modal state
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form fields
  const [formId, setFormId] = useState("");
  const [formName, setFormName] = useState("");
  const [formRole, setFormRole] = useState<"TENANT" | "LANDLORD">("TENANT");
  const [formMonthly, setFormMonthly] = useState<number>(0);
  const [formYearly, setFormYearly] = useState<number>(0);
  const [formSwipes, setFormSwipes] = useState<number>(15);
  const [formBoosts, setFormBoosts] = useState<number>(0);

  // Delete modal state
  const [deleteTarget, setDeleteTarget] = useState<PackagePlan | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadPlans = async () => {
    setIsLoading(true);
    try {
      const data = await paymentApi.getPlans();
      setPlans(Array.isArray(data) ? data : []);
    } catch (err: any) {
      toast.error("Không tải được danh sách gói dịch vụ", { description: err?.message });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPlans();
  }, []);

  const openCreate = () => {
    setIsEditing(false);
    setFormId("");
    setFormName("");
    setFormRole("TENANT");
    setFormMonthly(49000);
    setFormYearly(490000);
    setFormSwipes(30);
    setFormBoosts(2);
    setIsDialogOpen(true);
  };

  const openEdit = (p: PackagePlan) => {
    setIsEditing(true);
    setFormId(p.id);
    setFormName(p.name);
    setFormRole(p.targetRole as "TENANT" | "LANDLORD");
    setFormMonthly(Number(p.priceMonthly) || 0);
    setFormYearly(Number(p.priceYearly) || 0);

    const f = parseFeatures(p);
    setFormSwipes(f.swipes_per_day ?? 0);
    setFormBoosts(f.boosts ?? 0);
    setIsDialogOpen(true);
  };

  const savePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return toast.error("Vui lòng nhập tên gói dịch vụ");

    const autoSlug = formName
      .trim()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/gi, "d")
      .replace(/[^a-zA-Z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "")
      .toUpperCase();
    const resolvedId = isEditing ? formId : (formId.trim().toUpperCase() || autoSlug || `PLAN_${Date.now()}`);

    const featuresJson = JSON.stringify({
      swipes_per_day: formRole === "TENANT" ? formSwipes : 0,
      boosts: formBoosts,
    });

    const payload = {
      id: resolvedId,
      name: formName.trim(),
      targetRole: formRole,
      priceMonthly: formMonthly,
      priceYearly: formYearly,
      features: featuresJson,
    };

    setSaving(true);
    try {
      if (isEditing) {
        await paymentApi.adminUpdatePlan(formId, payload);
        toast.success("Đã cập nhật gói dịch vụ thành công!", {
          description: "Thông báo điều chỉnh giá & quyền lợi đã được tự động gửi tới người dùng.",
        });
      } else {
        await paymentApi.adminCreatePlan(payload);
        toast.success("Đã tạo gói dịch vụ mới thành công!", {
          description: "Thông báo ra mắt gói mới đã được tự động gửi tới người dùng.",
        });
      }
      setIsDialogOpen(false);
      loadPlans();
    } catch (err: any) {
      toast.error("Không thể lưu gói dịch vụ", { description: err?.message });
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await paymentApi.adminDeletePlan(deleteTarget.id);
      toast.success(`Đã xóa gói dịch vụ ${deleteTarget.name}`);
      setDeleteTarget(null);
      loadPlans();
    } catch (err: any) {
      toast.error("Không thể xóa gói dịch vụ", { description: err?.message });
    } finally {
      setDeleting(false);
    }
  };

  const filteredPlans = plans.filter((p) => {
    if (roleTab === "ALL") return true;
    return p.targetRole === roleTab;
  });

  const tenantPlansCount = plans.filter((p) => p.targetRole === "TENANT").length;
  const landlordPlansCount = plans.filter((p) => p.targetRole === "LANDLORD").length;

  return (
    <div className="space-y-3">
      {/* ── COMPACT HEADER ── */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">Quản lý Gói dịch vụ</h1>
            <Badge className="bg-mint text-emerald-deep border-primary/20 font-semibold text-xs px-2.5 py-0.5">
              {plans.length} gói đang mở
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Thiết lập mức phí và quyền lợi các gói thành viên dành cho Người thuê &amp; Chủ trọ
          </p>
        </div>
        <Button onClick={openCreate} size="sm" className="h-9 px-3.5 gap-1.5 cursor-pointer rounded-xl active:scale-95">
          <Plus className="size-4" /> Tạo gói dịch vụ mới
        </Button>
      </div>

      {/* ── ROLE FILTER TABS (Đồng bộ kích thước với Chủ trọ) ── */}
      <div className="flex flex-wrap border-b border-border gap-1">
        {[
          { id: "ALL" as const, label: `Tất cả gói dịch vụ (${plans.length})` },
          { id: "TENANT" as const, label: `Dành cho Người thuê (${tenantPlansCount})` },
          { id: "LANDLORD" as const, label: `Dành cho Chủ trọ (${landlordPlansCount})` },
        ].map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setRoleTab(item.id)}
            className={cn(
              "pb-2.5 px-3.5 text-sm font-semibold transition-all cursor-pointer border-b-2",
              roleTab === item.id
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
          <Loader2 className="size-7 animate-spin text-primary" />
        </div>
      ) : filteredPlans.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center">
          <Zap className="mx-auto size-10 text-muted-foreground/40" />
          <h3 className="mt-3 text-base font-semibold text-foreground">Chưa có gói dịch vụ nào trong mục này</h3>
          <Button onClick={openCreate} size="sm" className="mt-4 gap-2 cursor-pointer">
            <Plus className="size-4" /> Tạo gói dịch vụ mới
          </Button>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl bg-card ring-1 ring-border shadow-2xs">
          <Table>
            <TableHeader>
              <TableRow className="bg-secondary/50 hover:bg-secondary/50">
                <TableHead className="py-2.5 text-xs font-semibold">Tên gói dịch vụ</TableHead>
                <TableHead className="py-2.5 text-xs font-semibold">Nhóm người dùng</TableHead>
                <TableHead className="py-2.5 text-xs font-semibold">Phí theo tháng</TableHead>
                <TableHead className="py-2.5 text-xs font-semibold">Phí theo năm</TableHead>
                <TableHead className="py-2.5 text-xs font-semibold">Quyền lợi đi kèm</TableHead>
                <TableHead className="text-right pr-4 py-2.5 text-xs font-semibold">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPlans.map((p) => {
                const f = parseFeatures(p);
                const isFree = Number(p.priceMonthly) === 0 && Number(p.priceYearly) === 0;
                return (
                  <TableRow key={p.id} className="hover:bg-mint/35 transition-colors">
                    <TableCell className="py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-foreground">{p.name}</span>
                        {isFree && (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-muted/60 text-muted-foreground">
                            Mặc định
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="py-3">
                      {p.targetRole === "LANDLORD" ? (
                        <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200/80 font-medium text-xs">
                          Chủ trọ
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-sky-50 text-sky-700 border-sky-200/80 font-medium text-xs">
                          Người thuê
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="py-3 font-medium text-sm">
                      {isFree ? (
                        <span className="text-emerald-600 font-semibold">Miễn phí</span>
                      ) : (
                        formatVND(Number(p.priceMonthly) || 0)
                      )}
                    </TableCell>
                    <TableCell className="py-3 font-medium text-sm">
                      {isFree ? (
                        <span className="text-emerald-600 font-semibold">Miễn phí</span>
                      ) : (
                        formatVND(Number(p.priceYearly) || 0)
                      )}
                    </TableCell>
                    <TableCell className="py-3">
                      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                        {p.targetRole === "TENANT" && (
                          <span className="inline-flex items-center gap-1 bg-sky-50/70 text-sky-800 px-2 py-0.5 rounded-md border border-sky-200/60">
                            <Sparkles className="size-3 text-sky-600" />
                            Lượt xem &amp; ghép: <strong>{f.swipes_per_day >= 999 ? "Không giới hạn" : `${f.swipes_per_day} lượt/ngày`}</strong>
                          </span>
                        )}
                        <span className="inline-flex items-center gap-1 bg-emerald-50/70 text-emerald-800 px-2 py-0.5 rounded-md border border-emerald-200/60">
                          <CheckCircle2 className="size-3 text-emerald-600" />
                          Đẩy tin nổi bật: <strong>{f.boosts} lượt</strong>
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right pr-4 py-3 whitespace-nowrap">
                      <div className="inline-flex items-center gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 px-2.5 text-xs gap-1 cursor-pointer active:scale-95"
                          onClick={() => openEdit(p)}
                        >
                          <Pencil className="size-3.5" /> Chỉnh sửa
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="size-8 cursor-pointer active:scale-95"
                          title={p.id === "FREE" ? "Gói mặc định của hệ thống (không thể xóa)" : "Xóa gói dịch vụ"}
                          disabled={p.id === "FREE"}
                          onClick={() => setDeleteTarget(p)}
                        >
                          <Trash2 className="size-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Dialog Thêm / Chỉnh sửa */}
      <Dialog open={isDialogOpen} onOpenChange={(o) => !o && !saving && setIsDialogOpen(false)}>
        <DialogContent className="sm:max-w-lg p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-primary">
              {isEditing ? "Chỉnh sửa gói dịch vụ" : "Tạo gói dịch vụ mới"}
            </DialogTitle>
            <DialogDescription>
              {isEditing
                ? "Thay đổi mức phí hoặc quyền lợi sẽ tự động gửi thông báo cập nhật đến người dùng."
                : "Thiết lập tên gói, đối tượng sử dụng và quyền lợi đi kèm."}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={savePlan} className="space-y-4 pt-2">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5 sm:col-span-2">
                <Label className="text-xs font-semibold">Tên gói dịch vụ</Label>
                <Input
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Ví dụ: Gói VIP Sinh Viên / Gói Chủ Trọ Chuyên Nghiệp"
                  maxLength={100}
                  required
                />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <Label className="text-xs font-semibold">Nhóm người dùng áp dụng</Label>
                <Select
                  value={formRole}
                  onValueChange={(v: "TENANT" | "LANDLORD") => setFormRole(v)}
                >
                  <SelectTrigger className="w-full cursor-pointer">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TENANT" className="cursor-pointer">Người thuê phòng</SelectItem>
                    <SelectItem value="LANDLORD" className="cursor-pointer">Chủ nhà trọ</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Phí theo tháng (VNĐ)</Label>
                <Input
                  type="number"
                  min={0}
                  step={1000}
                  value={formMonthly}
                  onChange={(e) => setFormMonthly(Number(e.target.value) || 0)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Phí theo năm (VNĐ)</Label>
                <Input
                  type="number"
                  min={0}
                  step={1000}
                  value={formYearly}
                  onChange={(e) => setFormYearly(Number(e.target.value) || 0)}
                  required
                />
              </div>

              {formRole === "TENANT" && (
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Lượt xem &amp; ghép bạn mỗi ngày</Label>
                  <Input
                    type="number"
                    min={0}
                    value={formSwipes}
                    onChange={(e) => setFormSwipes(Number(e.target.value) || 0)}
                    required
                  />
                </div>
              )}

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Số lượt đẩy tin nổi bật</Label>
                <Input
                  type="number"
                  min={0}
                  value={formBoosts}
                  onChange={(e) => setFormBoosts(Number(e.target.value) || 0)}
                  required
                />
              </div>
            </div>

            <div className="rounded-xl bg-amber-500/10 p-3 text-xs text-amber-800 flex items-start gap-2">
              <Info className="size-4 shrink-0 mt-0.5 text-amber-600" />
              <span>Khi bấm lưu, hệ thống sẽ tự động gửi thông báo về gói dịch vụ này tới người dùng.</span>
            </div>

            <DialogFooter className="pt-2 gap-2">
              <Button type="button" variant="outline" disabled={saving} onClick={() => setIsDialogOpen(false)} className="cursor-pointer">
                Hủy
              </Button>
              <Button type="submit" disabled={saving} className="gap-2 cursor-pointer">
                {saving && <Loader2 className="size-4 animate-spin" />}
                {isEditing ? "Lưu thay đổi" : "Tạo gói dịch vụ"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* AlertDialog Xóa gói */}
      <AlertDialog open={deleteTarget !== null} onOpenChange={(o) => !o && !deleting && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="size-5" /> Xác nhận xóa gói dịch vụ
            </AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa gói <strong>{deleteTarget?.name}</strong>? Thao tác này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting} className="cursor-pointer">Hủy</AlertDialogCancel>
            <AlertDialogAction
              disabled={deleting}
              onClick={confirmDelete}
              className="bg-destructive hover:bg-destructive/90 gap-2 cursor-pointer"
            >
              {deleting && <Loader2 className="size-4 animate-spin" />} Xóa gói
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
