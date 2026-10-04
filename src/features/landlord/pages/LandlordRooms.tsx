import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { PlusCircle, Eye, Pencil, ExternalLink, Home, Loader2, Rocket, ImageOff, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { formatVND } from "@/lib/utils";
import { api } from "@/lib/api";
import { roomTypes, districts } from "@/lib/constants";
import { roomsApi } from "@/features/rooms/api/roomsApi";
import { paymentApi } from "@/features/monetization/api/paymentApi";
import { toast } from "sonner";
import {
  MoneyInput, FeeFields, ImagePicker, feesToState, stateToFees, type FeeState, type PickedImage,
} from "../components/roomForm";
import { AmenityPicker } from "./PostRoom";

type MyRoom = {
  id: string;
  title: string;
  price: number;
  district: string;
  status: string;
  viewCount: number;
  isBoosted: boolean;
  primaryImageUrl?: string;
  expiresAt?: string;
};

const STATUS_LABEL: Record<string, string> = {
  AVAILABLE: "Còn trống", RENTED: "Đã thuê", HIDDEN: "Đang ẩn", EXPIRED: "Hết hạn",
};

type EditForm = {
  title: string; roomType: string; areaSqm: string; price: number; depositAmount: number;
  addressStreet: string; district: string; description: string; amenities: string[];
};

export default function LandlordRooms() {
  const navigate = useNavigate();
  const [rooms, setRooms] = useState<MyRoom[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [boostsLeft, setBoostsLeft] = useState(0);
  const [boosting, setBoosting] = useState<string | null>(null);

  // Edit dialog
  const [editId, setEditId] = useState<string | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<EditForm | null>(null);
  const [original, setOriginal] = useState<{ addressStreet: string; district: string } | null>(null);
  const [fees, setFees] = useState<FeeState>(feesToState());
  const [images, setImages] = useState<PickedImage[]>([]);

  const load = async () => {
    setIsLoading(true);
    try {
      const [data, c] = await Promise.all([
        roomsApi.getMyRooms(),
        paymentApi.getMyConsumables().catch(() => null),
      ]);
      setRooms((Array.isArray(data) ? data : []).map((r: any) => ({
        id: String(r.id),
        title: r.title,
        price: Number(r.price) || 0,
        district: r.district || "",
        status: r.status,
        viewCount: r.viewCount || 0,
        isBoosted: !!r.isBoosted,
        primaryImageUrl: r.primaryImageUrl || undefined,
        expiresAt: r.expiresAt || undefined,
      })));
      setBoostsLeft(c?.boostsLeft ?? 0);
    } catch (err: any) {
      toast.error("Không tải được danh sách phòng", { description: err?.message });
      setRooms([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openEdit = async (id: string) => {
    setEditId(id);
    setForm(null);
    setLoadingDetail(true);
    try {
      const r: any = await roomsApi.getRoomById(id);
      setForm({
        title: r.title ?? "",
        roomType: r.roomType ?? "",
        areaSqm: r.areaSqm != null ? String(r.areaSqm) : "",
        price: Number(r.price) || 0,
        depositAmount: Number(r.depositAmount) || 0,
        addressStreet: r.addressStreet ?? "",
        district: r.district ?? "",
        description: r.description ?? "",
        amenities: Array.isArray(r.amenities) ? r.amenities : [],
      });
      setOriginal({ addressStreet: r.addressStreet ?? "", district: r.district ?? "" });
      setFees(feesToState(r.fees ?? []));
      const imgs = [...(r.images ?? [])].sort((a: any, b: any) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));
      setImages(imgs.map((i: any) => ({ url: i.imageUrl })));
    } catch (err: any) {
      toast.error("Không tải được thông tin phòng", { description: err?.message });
      setEditId(null);
    } finally {
      setLoadingDetail(false);
    }
  };

  // Open edit when coming from another page (e.g. room detail "Chỉnh sửa")
  useEffect(() => {
    const id = sessionStorage.getItem("edit_room_id");
    if (id) {
      sessionStorage.removeItem("edit_room_id");
      openEdit(id);
    }
  }, []);

  const closeEdit = () => {
    images.forEach((i) => i.file && URL.revokeObjectURL(i.url));
    setEditId(null);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editId || !form || !original) return;
    if (!form.title.trim() || !form.roomType || !(Number(form.areaSqm) > 0) || !(form.price > 0)
      || !form.addressStreet.trim() || !form.district || !form.description.trim()) {
      return toast.error("Vui lòng điền đầy đủ thông tin bắt buộc");
    }
    if (images.length === 0) return toast.error("Phòng cần ít nhất 1 ảnh");

    setSaving(true);
    try {
      // 1) Upload new files (BE appends them, in order, after existing images)
      const newFiles = images.filter((i) => i.file).map((i) => i.file!);
      const uploadedUrls: string[] = [];
      if (newFiles.length) {
        const all: any[] = await roomsApi.uploadRoomImages(editId, newFiles);
        const sorted = [...all].sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));
        uploadedUrls.push(...sorted.slice(-newFiles.length).map((i) => i.imageUrl));
      }
      // 2) Final ordered list (cover first); replaces the room's images
      let k = 0;
      const finalUrls = images.map((i) => (i.file ? uploadedUrls[k++] : i.url));

      const addressChanged = form.addressStreet.trim() !== original.addressStreet || form.district !== original.district;
      await api.put(`/rooms/${editId}`, {
        title: form.title.trim(),
        roomType: form.roomType,
        areaSqm: Number(form.areaSqm),
        price: form.price,
        depositAmount: form.depositAmount,
        description: form.description.trim(),
        amenities: form.amenities,
        fees: stateToFees(fees),
        images: finalUrls,
        // Only send address when changed: BE re-geocodes on address updates
        ...(addressChanged ? { addressStreet: form.addressStreet.trim(), district: form.district } : {}),
      });
      toast.success("Đã lưu thay đổi");
      closeEdit();
      load();
    } catch (err: any) {
      toast.error("Không thể lưu thay đổi", { description: err?.message });
    } finally {
      setSaving(false);
    }
  };

  const boost = async (id: string) => {
    setBoosting(id);
    try {
      await roomsApi.boostRoom(id);
      toast.success("Đã đẩy tin lên đầu trong 7 ngày");
      load();
    } catch (err: any) {
      toast.error("Không thể đẩy tin", { description: err?.message });
    } finally {
      setBoosting(null);
    }
  };

  const [renewing, setRenewing] = useState<string | null>(null);

  const renew = async (id: string) => {
    setRenewing(id);
    try {
      const res: any = await roomsApi.renewRoom(id);
      const newExp = res?.expiresAt ? new Date(res.expiresAt).toLocaleDateString("vi-VN") : "thêm 30 ngày";
      toast.success(`Đã gia hạn tin đăng thành công! (Hạn mới: ${newExp})`);
      load();
    } catch (err: any) {
      toast.error("Không thể gia hạn tin đăng", { description: err?.message });
    } finally {
      setRenewing(null);
    }
  };

  const set = (patch: Partial<EditForm>) => setForm((p) => (p ? { ...p, ...patch } : p));

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="brand text-2xl text-foreground">Phòng của tôi</h1>
          <p className="text-sm text-muted-foreground">
            {rooms.length} tin đăng • Còn {boostsLeft} lượt đẩy tin
          </p>
        </div>
        <Button className="gap-2" onClick={() => navigate("/landlord?tab=post")}><PlusCircle className="size-4" /> Đăng phòng</Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="size-8 animate-spin text-primary" />
        </div>
      ) : rooms.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl bg-card p-12 text-center ring-1 ring-border">
          <Home className="size-12 text-muted-foreground/50 mb-3" />
          <h3 className="text-base font-semibold text-foreground">Bạn chưa có phòng trọ nào</h3>
          <Button className="mt-5 gap-2" onClick={() => navigate("/landlord?tab=post")}>
            <PlusCircle className="size-4" /> Đăng phòng ngay
          </Button>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl bg-card ring-1 ring-border">
          <Table>
            <TableHeader>
              <TableRow className="bg-secondary/50">
                <TableHead>Phòng</TableHead>
                <TableHead>Giá</TableHead>
                <TableHead>Trạng thái & Hạn tin</TableHead>
                <TableHead>Lượt xem</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rooms.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      {r.primaryImageUrl ? (
                        <img src={r.primaryImageUrl} alt={r.title} className="size-12 rounded-lg object-cover" />
                      ) : (
                        <span className="grid size-12 place-items-center rounded-lg bg-muted text-muted-foreground"><ImageOff className="size-4" /></span>
                      )}
                      <div>
                        <p className="line-clamp-1 text-sm font-medium">{r.title}</p>
                        <p className="text-xs text-muted-foreground">{r.district}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-primary font-semibold">{formatVND(r.price)}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap items-center gap-1">
                      <Badge variant={r.status === "AVAILABLE" ? "default" : r.status === "EXPIRED" ? "destructive" : "outline"}>
                        {STATUS_LABEL[r.status] ?? r.status}
                      </Badge>
                      {r.isBoosted && <Badge variant="secondary" className="gap-1"><Rocket className="size-3" />Đang đẩy</Badge>}
                    </div>
                    {r.expiresAt && (
                      <div className="mt-1 text-xs">
                        {(() => {
                          const diff = Math.ceil((new Date(r.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                          if (diff <= 0 || r.status === "EXPIRED") {
                            return <span className="text-destructive font-medium">Hết hạn</span>;
                          }
                          if (diff <= 5) {
                            return <span className="text-amber-600 font-medium">Còn {diff} ngày</span>;
                          }
                          return <span className="text-muted-foreground">Hạn: {new Date(r.expiresAt).toLocaleDateString("vi-VN")}</span>;
                        })()}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="inline-flex items-center gap-1 text-sm text-muted-foreground"><Eye className="size-3.5" />{r.viewCount}</span>
                  </TableCell>
                  <TableCell className="text-right whitespace-nowrap">
                    <Button
                      size="icon"
                      variant="ghost"
                      title="Gia hạn tin đăng thêm 30 ngày"
                      disabled={renewing !== null}
                      onClick={() => renew(r.id)}
                    >
                      {renewing === r.id ? <Loader2 className="size-4 animate-spin text-primary" /> : <RefreshCw className="size-4 text-emerald-600" />}
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      title={
                        r.status !== "AVAILABLE" ? "Chỉ đẩy được phòng còn trống"
                          : boostsLeft === 0 ? "Hết lượt đẩy tin" : r.isBoosted ? "Đẩy thêm 7 ngày" : "Đẩy tin lên đầu 7 ngày"
                      }
                      disabled={boosting !== null || boostsLeft === 0 || r.status !== "AVAILABLE"}
                      onClick={() => boost(r.id)}
                    >
                      {boosting === r.id ? <Loader2 className="size-4 animate-spin" /> : <Rocket className="size-4" />}
                    </Button>
                    <Button size="icon" variant="ghost" title="Chỉnh sửa" onClick={() => openEdit(r.id)}><Pencil className="size-4" /></Button>
                    <Button size="icon" variant="ghost" title="Xem trang phòng" onClick={() => navigate(`/rooms/${r.id}`)}><ExternalLink className="size-4" /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={editId !== null} onOpenChange={(o) => !o && !saving && closeEdit()}>
        <DialogContent className="sm:max-w-2xl p-6">
          <DialogHeader>
            <DialogTitle className="brand text-xl text-primary">Chỉnh sửa phòng</DialogTitle>
            <DialogDescription>Thay đổi sẽ hiển thị ngay sau khi lưu.</DialogDescription>
          </DialogHeader>

          {loadingDetail || !form ? (
            <div className="grid min-h-[300px] place-items-center"><Loader2 className="size-6 animate-spin text-primary" /></div>
          ) : (
            <form onSubmit={save} className="flex flex-col">
              <div className="max-h-[60vh] overflow-y-auto pr-3 py-1 space-y-4">
                <F label="Tiêu đề tin">
                  <Input value={form.title} maxLength={255} onChange={(e) => set({ title: e.target.value })} />
                </F>
                <div className="grid gap-4 sm:grid-cols-2">
                  <F label="Loại phòng">
                    <Select value={form.roomType} onValueChange={(v) => set({ roomType: v })}>
                      <SelectTrigger className="w-full"><SelectValue placeholder="Chọn loại phòng" /></SelectTrigger>
                      <SelectContent>{roomTypes.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                    </Select>
                  </F>
                  <F label="Diện tích (m²)">
                    <Input type="number" min={1} value={form.areaSqm} onChange={(e) => set({ areaSqm: e.target.value })} />
                  </F>
                  <F label="Tiền thuê / tháng">
                    <MoneyInput value={form.price} onChange={(v) => set({ price: v })} suffix="đ" />
                  </F>
                  <F label="Tiền đặt cọc">
                    <MoneyInput value={form.depositAmount} onChange={(v) => set({ depositAmount: v })} suffix="đ" placeholder="0" />
                  </F>
                  <FeeFields value={fees} onChange={setFees} />
                  <F label="Địa chỉ cụ thể">
                    <Input value={form.addressStreet} maxLength={255} onChange={(e) => set({ addressStreet: e.target.value })} />
                  </F>
                  <F label="Quận/Huyện">
                    <Select value={form.district} onValueChange={(v) => set({ district: v })}>
                      <SelectTrigger className="w-full"><SelectValue placeholder="Chọn quận" /></SelectTrigger>
                      <SelectContent>{districts.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                    </Select>
                  </F>
                </div>
                <F label="Mô tả chi tiết">
                  <Textarea rows={3} value={form.description} onChange={(e) => set({ description: e.target.value })} />
                </F>
                <F label="Tiện nghi">
                  <AmenityPicker value={form.amenities} onChange={(v) => set({ amenities: v })} />
                </F>
                <F label={`Hình ảnh (${images.length})`}>
                  <ImagePicker value={images} onChange={setImages} />
                </F>
              </div>

              <DialogFooter className="pt-4 mt-4 border-t gap-2">
                <Button type="button" variant="outline" disabled={saving} onClick={closeEdit}>Hủy</Button>
                <Button type="submit" disabled={saving} className="gap-2">
                  {saving && <Loader2 className="size-4 animate-spin" />} Lưu thay đổi
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function F({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5 w-full">
      <Label className="text-xs font-semibold text-foreground">{label}</Label>
      {children}
    </div>
  );
}
