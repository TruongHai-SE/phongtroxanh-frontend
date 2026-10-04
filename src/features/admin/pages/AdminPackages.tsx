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
import { formatVND } from "@/lib/utils";
import { paymentApi, parseFeatures } from "@/features/monetization/api/paymentApi";
import type { PackagePlan } from "@/features/monetization/types/payment.types";
import { toast } from "sonner";

export default function AdminPackages() {
  const [plans, setPlans] = useState<PackagePlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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
    if (!isEditing && !formId.trim()) return toast.error("Vui lòng nhập mã gói (ID)");

    const featuresJson = JSON.stringify({
      swipes_per_day: formRole === "TENANT" ? formSwipes : 0,
      boosts: formBoosts,
    });

    const payload = {
      id: isEditing ? formId : formId.trim().toUpperCase(),
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
          description: "Thông báo điều chỉnh giá & quyền lợi đã được tự động phát tới toàn bộ người dùng.",
        });
      } else {
        await paymentApi.adminCreatePlan(payload);
        toast.success("Đã tạo gói dịch vụ mới thành công!", {
          description: "Thông báo ra mắt gói mới đã được tự động phát tới người dùng.",
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

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="brand text-2xl font-bold text-foreground">Quản lý Gói dịch vụ</h1>
            <Badge variant="outline" className="gap-1 border-primary/30 text-primary">
              <Zap className="size-3.5 fill-primary text-primary" /> Quản lý Gói Dịch Vụ
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Cấu hình giá cước và quyền lợi gói cho Người thuê & Chủ trọ. Hệ thống tự động thông báo khi có điều chỉnh.
          </p>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <Plus className="size-4" /> Tạo gói mới
        </Button>
      </div>

      <div className="flex items-center gap-2 rounded-xl bg-primary/5 p-3.5 text-xs text-primary ring-1 ring-primary/20">
        <BellRing className="size-4 shrink-0 text-primary" />
        <span>
          <strong>Cơ chế tự động:</strong> Mỗi khi Quản trị viên cập nhật giá hoặc quyền lợi của bất kỳ gói nào, Backend sẽ tự động phát thông báo hệ thống (Notification) tới toàn bộ người dùng để cập nhật kịp thời.
        </span>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="size-8 animate-spin text-primary" />
        </div>
      ) : plans.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center">
          <Zap className="mx-auto size-12 text-muted-foreground/40" />
          <h3 className="mt-3 text-base font-semibold text-foreground">Chưa có gói dịch vụ nào</h3>
          <Button onClick={openCreate} className="mt-4 gap-2">
            <Plus className="size-4" /> Tạo gói đầu tiên
          </Button>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl bg-card ring-1 ring-border">
          <Table>
            <TableHeader>
              <TableRow className="bg-secondary/50">
                <TableHead>Mã / Tên gói</TableHead>
                <TableHead>Đối tượng</TableHead>
                <TableHead>Giá theo tháng</TableHead>
                <TableHead>Giá theo năm</TableHead>
                <TableHead>Tính năng & Quyền lợi</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {plans.map((p) => {
                const f = parseFeatures(p);
                const isFree = Number(p.priceMonthly) === 0 && Number(p.priceYearly) === 0;
                return (
                  <TableRow key={p.id}>
                    <TableCell>
                      <div>
                        <p className="font-semibold text-foreground">{p.name}</p>
                        <code className="text-xs text-muted-foreground font-mono">{p.id}</code>
                      </div>
                    </TableCell>
                    <TableCell>
                      {p.targetRole === "LANDLORD" ? (
                        <Badge variant="secondary" className="bg-violet-100 text-violet-800 dark:bg-violet-950/50 dark:text-violet-300">
                          Chủ trọ
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="bg-sky-100 text-sky-800 dark:bg-sky-950/50 dark:text-sky-300">
                          Người thuê
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">
                      {isFree ? (
                        <span className="text-emerald-600 font-semibold">Miễn phí</span>
                      ) : (
                        formatVND(Number(p.priceMonthly) || 0)
                      )}
                    </TableCell>
                    <TableCell className="font-medium">
                      {isFree ? (
                        <span className="text-emerald-600 font-semibold">Miễn phí</span>
                      ) : (
                        formatVND(Number(p.priceYearly) || 0)
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-0.5 text-xs text-muted-foreground">
                        {p.targetRole === "TENANT" && (
                          <div className="flex items-center gap-1.5">
                            <Sparkles className="size-3 text-sky-500" />
                            <span>Quẹt tìm bạn: <strong>{f.swipes_per_day} lượt/ngày</strong></span>
                          </div>
                        )}
                        <div className="flex items-center gap-1.5">
                          <CheckCircle2 className="size-3 text-emerald-500" />
                          <span>Lượt đẩy tin: <strong>{f.boosts} lượt</strong></span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right whitespace-nowrap">
                      <Button
                        size="icon"
                        variant="ghost"
                        title="Chỉnh sửa gói"
                        onClick={() => openEdit(p)}
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        title={p.id === "FREE" ? "Không thể xóa gói mặc định FREE" : "Xóa gói"}
                        disabled={p.id === "FREE"}
                        onClick={() => setDeleteTarget(p)}
                      >
                        <Trash2 className="size-4 text-destructive" />
                      </Button>
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
            <DialogTitle className="brand text-xl text-primary">
              {isEditing ? "Chỉnh sửa gói dịch vụ" : "Tạo gói dịch vụ mới"}
            </DialogTitle>
            <DialogDescription>
              {isEditing
                ? "Thay đổi giá hoặc quyền lợi sẽ phát thông báo hệ thống đến tất cả người dùng."
                : "Điền thông tin gói dịch vụ hội viên mới cho hệ thống."}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={savePlan} className="space-y-4 pt-2">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5 sm:col-span-2">
                <Label className="text-xs font-semibold">Tên gói dịch vụ</Label>
                <Input
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Ví dụ: Gói VIP Đẩy Tin Sinh Viên"
                  maxLength={100}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Mã gói (ID duy nhất)</Label>
                <Input
                  value={formId}
                  onChange={(e) => setFormId(e.target.value)}
                  placeholder="VD: PRO_VIP"
                  disabled={isEditing}
                  maxLength={50}
                  required
                />
                <span className="text-[11px] text-muted-foreground">In hoa, không dấu, dùng gạch dưới</span>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Đối tượng áp dụng</Label>
                <Select
                  value={formRole}
                  onValueChange={(v: "TENANT" | "LANDLORD") => setFormRole(v)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TENANT">Người thuê (Tenant)</SelectItem>
                    <SelectItem value="LANDLORD">Chủ trọ (Landlord)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Giá theo tháng (VND)</Label>
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
                <Label className="text-xs font-semibold">Giá theo năm (VND)</Label>
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
                  <Label className="text-xs font-semibold">Lượt quẹt phòng/ngày</Label>
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
                <Label className="text-xs font-semibold">Lượt đẩy tin (Boosts)</Label>
                <Input
                  type="number"
                  min={0}
                  value={formBoosts}
                  onChange={(e) => setFormBoosts(Number(e.target.value) || 0)}
                  required
                />
              </div>
            </div>

            <div className="rounded-lg bg-amber-500/10 p-3 text-xs text-amber-700 dark:text-amber-300 flex items-start gap-2">
              <Info className="size-4 shrink-0 mt-0.5" />
              <span>Khi bấm lưu, người dùng sẽ nhận được thông báo về các cập nhật quyền lợi của gói này.</span>
            </div>

            <DialogFooter className="pt-2 gap-2">
              <Button type="button" variant="outline" disabled={saving} onClick={() => setIsDialogOpen(false)}>
                Hủy
              </Button>
              <Button type="submit" disabled={saving} className="gap-2">
                {saving && <Loader2 className="size-4 animate-spin" />}
                {isEditing ? "Lưu thay đổi & Báo người dùng" : "Tạo gói & Thông báo"}
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
              Bạn có chắc chắn muốn xóa gói <strong>{deleteTarget?.name}</strong> ({deleteTarget?.id})? Thao tác này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Hủy</AlertDialogCancel>
            <AlertDialogAction
              disabled={deleting}
              onClick={confirmDelete}
              className="bg-destructive hover:bg-destructive/90 gap-2"
            >
              {deleting && <Loader2 className="size-4 animate-spin" />} Xóa gói
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
