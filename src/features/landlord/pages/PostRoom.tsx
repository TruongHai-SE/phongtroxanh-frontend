import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, ArrowRight, Check, Rocket, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { roomTypes, districts } from "@/lib/constants";
import { cn, formatVND } from "@/lib/utils";
import { api } from "@/lib/api";
import { roomsApi } from "@/features/rooms/api/roomsApi";
import {
  MoneyInput, FeeFields, ImagePicker, feesToState, stateToFees, type FeeState, type PickedImage,
} from "../components/roomForm";

const steps = ["Thông tin", "Giá & phí", "Hình ảnh", "Vị trí", "Xem trước"];

export const AMENITY_OPTIONS = [
  "Máy lạnh", "Wi-Fi", "WC riêng", "Giờ tự do", "Bãi xe", "Bếp riêng", "Ban công", "Thang máy",
];

export default function PostRoom() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [form, setForm] = useState({
    title: "",
    roomType: "",
    areaSqm: "",
    description: "",
    price: 0,
    depositAmount: 0,
    addressStreet: "",
    district: "",
    city: "Hồ Chí Minh",
  });
  const [fees, setFees] = useState<FeeState>(feesToState());
  const [amenities, setAmenities] = useState<string[]>([]);
  const [images, setImages] = useState<PickedImage[]>([]);
  const [boostsLeft, setBoostsLeft] = useState<number | null>(null);
  const [boost, setBoost] = useState(false);

  useEffect(() => {
    api.get<{ boostsLeft: number }>("/monetization/consumables/me")
      .then((r) => setBoostsLeft(r?.boostsLeft ?? 0))
      .catch(() => setBoostsLeft(0));
  }, []);

  // Free preview object URLs on unmount
  const imagesRef = useRef(images);
  imagesRef.current = images;
  useEffect(() => () => imagesRef.current.forEach((i) => URL.revokeObjectURL(i.url)), []);

  const update = (field: keyof typeof form, val: any) => setForm((p) => ({ ...p, [field]: val }));
  const feeList = stateToFees(fees);

  const validate = (s: number): string | null => {
    if (s === 0) {
      if (!form.title.trim()) return "Vui lòng nhập tiêu đề tin đăng";
      if (!form.roomType) return "Vui lòng chọn loại phòng";
      if (!(Number(form.areaSqm) > 0)) return "Diện tích phải lớn hơn 0";
      if (!form.description.trim()) return "Vui lòng nhập mô tả phòng";
    }
    if (s === 1 && !(form.price > 0)) return "Tiền thuê phòng phải lớn hơn 0";
    if (s === 2 && images.length === 0) return "Vui lòng thêm ít nhất 1 ảnh phòng thực tế";
    if (s === 3) {
      if (!form.addressStreet.trim()) return "Vui lòng nhập địa chỉ cụ thể";
      if (!form.district) return "Vui lòng chọn quận/huyện";
    }
    return null;
  };

  const handleNext = () => {
    const err = validate(step);
    if (err) return toast.error(err);
    setStep((s) => Math.min(s + 1, steps.length - 1));
  };

  const finish = async () => {
    setIsSubmitting(true);
    try {
      const room = await api.post<{ id: string }>("/rooms", {
        title: form.title.trim(),
        description: form.description.trim(),
        roomType: form.roomType,
        price: form.price,
        depositAmount: form.depositAmount,
        areaSqm: Number(form.areaSqm),
        addressStreet: form.addressStreet.trim(),
        district: form.district,
        city: form.city,
        amenities,
        fees: feeList,
      });

      try {
        // Order is preserved; the first file becomes the cover image
        await roomsApi.uploadRoomImages(room.id, images.map((i) => i.file!));
      } catch (e) {
        await roomsApi.deleteRoom(room.id).catch(() => {}); // don't leave an imageless listing
        throw e;
      }

      if (boost) {
        await roomsApi.boostRoom(room.id).catch((e: any) =>
          toast.warning("Đăng phòng thành công nhưng chưa đẩy tin được", { description: e?.message })
        );
      }

      toast.success("Đăng phòng thành công!");
      navigate("/landlord?tab=rooms");
    } catch (err: any) {
      toast.error("Không thể đăng phòng", { description: err?.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto">
      <h1 className="brand text-2xl text-foreground">Đăng phòng mới</h1>

      <div className="mt-4 w-full">
        <div className="flex items-center justify-between text-xs">
          {steps.map((s, i) => (
            <span
              key={s}
              className={cn("flex items-center gap-1.5", i <= step ? "text-primary font-medium" : "text-muted-foreground")}
            >
              <span
                className={cn(
                  "grid size-6 place-items-center rounded-full text-[11px] font-semibold transition-all",
                  i < step
                    ? "bg-primary text-primary-foreground"
                    : i === step
                    ? "bg-mint ring-2 ring-primary text-primary"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {i < step ? <Check className="size-3" strokeWidth={3} /> : i + 1}
              </span>
              <span className="hidden sm:inline">{s}</span>
            </span>
          ))}
        </div>
        <Progress value={((step + 1) / steps.length) * 100} className="mt-3 h-1.5" />
      </div>

      <div className="mt-6 w-full rounded-2xl bg-card p-6 ring-1 ring-border min-h-[460px] flex flex-col justify-between shadow-xs">
        <div>
          {step === 0 && (
            <div className="grid gap-4 w-full">
              <Field label="Tiêu đề tin">
                <Input
                  value={form.title}
                  maxLength={255}
                  onChange={(e) => update("title", e.target.value)}
                  placeholder="VD: Phòng khép kín gần ĐH Bách Khoa"
                />
              </Field>

              <div className="grid gap-4 sm:grid-cols-2 w-full">
                <Field label="Loại phòng">
                  <Select value={form.roomType} onValueChange={(v) => update("roomType", v)}>
                    <SelectTrigger className="w-full"><SelectValue placeholder="Chọn loại phòng" /></SelectTrigger>
                    <SelectContent>
                      {roomTypes.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </Field>

                <Field label="Diện tích (m²)">
                  <Input
                    type="number"
                    min={1}
                    inputMode="decimal"
                    value={form.areaSqm}
                    onChange={(e) => update("areaSqm", e.target.value)}
                    placeholder="VD: 25"
                  />
                </Field>
              </div>

              <Field label="Mô tả chi tiết">
                <Textarea
                  rows={4}
                  value={form.description}
                  onChange={(e) => update("description", e.target.value)}
                  placeholder="Mô tả không gian, cửa sổ, tiện ích xung quanh, giờ giấc..."
                />
              </Field>

              <Field label="Tiện nghi phòng">
                <AmenityPicker value={amenities} onChange={setAmenities} />
              </Field>
            </div>
          )}

          {step === 1 && (
            <div className="grid gap-4 sm:grid-cols-2 w-full">
              <Field label="Tiền thuê / tháng">
                <MoneyInput value={form.price} onChange={(v) => update("price", v)} suffix="đ" placeholder="VD: 3.200.000" />
              </Field>
              <Field label="Tiền đặt cọc">
                <MoneyInput value={form.depositAmount} onChange={(v) => update("depositAmount", v)} suffix="đ" placeholder="0 nếu không cọc" />
              </Field>
              <FeeFields value={fees} onChange={setFees} />
              <p className="sm:col-span-2 text-[11px] text-muted-foreground">
                Để trống số tiền nếu không muốn hiển thị khoản phí đó.
              </p>
            </div>
          )}

          {step === 2 && (
            <div className="w-full space-y-1">
              <Label className="text-sm font-medium">Hình ảnh phòng ({images.length})</Label>
              <ImagePicker value={images} onChange={setImages} />
            </div>
          )}

          {step === 3 && (
            <div className="grid gap-4 sm:grid-cols-2 w-full">
              <Field label="Địa chỉ cụ thể (số nhà, tên đường, phường)">
                <Input
                  value={form.addressStreet}
                  maxLength={255}
                  onChange={(e) => update("addressStreet", e.target.value)}
                  placeholder="VD: 123 Tô Hiến Thành, Phường 13"
                />
              </Field>
              <Field label="Quận/Huyện">
                <Select value={form.district} onValueChange={(v) => update("district", v)}>
                  <SelectTrigger className="w-full"><SelectValue placeholder="Chọn quận" /></SelectTrigger>
                  <SelectContent>
                    {districts.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
              <p className="sm:col-span-2 text-[11px] text-muted-foreground">
                Vị trí trên bản đồ được xác định tự động từ địa chỉ. Hãy nhập đúng số nhà và tên đường.
              </p>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4 w-full">
              <div className="overflow-hidden rounded-xl ring-1 ring-border bg-card w-full">
                {images[0] && <img src={images[0].url} alt={form.title} className="aspect-[16/9] w-full object-cover max-h-56" />}
                <div className="space-y-2 p-4">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-mint text-primary">{form.roomType}</span>
                    <span className="text-xs text-muted-foreground">
                      {form.addressStreet}, {form.district} • {form.areaSqm} m²
                    </span>
                  </div>
                  <h3 className="font-semibold text-base text-foreground leading-snug">{form.title}</h3>
                  <p className="text-primary font-bold text-lg">
                    {formatVND(form.price)}
                    <span className="text-xs text-muted-foreground font-normal">/tháng</span>
                    {form.depositAmount > 0 && (
                      <span className="ml-2 text-xs text-muted-foreground font-normal">• Cọc {formatVND(form.depositAmount)}</span>
                    )}
                  </p>
                  {feeList.length > 0 && (
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      {feeList.map((f) => <span key={f.feeLabel}>{f.feeLabel}: <b className="text-foreground">{f.feeValue}</b></span>)}
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground line-clamp-2">{form.description}</p>
                  {amenities.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {amenities.map((a) => (
                        <span key={a} className="rounded-full bg-mint px-2.5 py-0.5 text-xs text-primary font-medium">{a}</span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <label
                className={cn(
                  "flex items-center gap-3 rounded-xl bg-mint/50 p-4 ring-1 ring-primary/20 w-full",
                  boostsLeft ? "cursor-pointer hover:bg-mint/70" : "opacity-60"
                )}
              >
                <input
                  type="checkbox"
                  checked={boost}
                  disabled={!boostsLeft}
                  onChange={(e) => setBoost(e.target.checked)}
                  className="size-4 accent-primary rounded cursor-pointer"
                />
                <span className="flex-1 flex items-center gap-2 text-xs sm:text-sm font-medium text-foreground">
                  <Rocket className="size-4 text-primary shrink-0" />
                  Đẩy tin lên đầu 7 ngày (dùng 1 lượt)
                </span>
                <span className="text-xs text-muted-foreground">
                  {boostsLeft === null ? "…" : boostsLeft > 0 ? `Còn ${boostsLeft} lượt` : (
                    <button type="button" className="text-primary underline cursor-pointer" onClick={() => navigate("/landlord?tab=packages")}>
                      Hết lượt — mua gói
                    </button>
                  )}
                </span>
              </label>
            </div>
          )}
        </div>

        <div className="mt-8 flex items-center justify-between border-t border-border/60 pt-4 w-full">
          <Button
            type="button"
            variant="ghost"
            className="gap-1 cursor-pointer text-xs sm:text-sm"
            onClick={() => (step > 0 ? setStep(step - 1) : navigate("/landlord"))}
            disabled={isSubmitting}
          >
            <ArrowLeft className="size-4" /> Quay lại
          </Button>

          <Button
            type="button"
            className="gap-1.5 cursor-pointer text-xs sm:text-sm font-medium"
            onClick={() => (step < steps.length - 1 ? handleNext() : finish())}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <><Loader2 className="size-4 animate-spin" /> Đang đăng...</>
            ) : step === steps.length - 1 ? (
              <>Đăng tin <Check className="size-4" /></>
            ) : (
              <>Tiếp tục <ArrowRight className="size-4" /></>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5 w-full">
      <Label className="text-xs font-semibold text-foreground">{label}</Label>
      {children}
    </div>
  );
}

export function AmenityPicker({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  return (
    <div className="flex flex-wrap gap-2 pt-1 w-full">
      {AMENITY_OPTIONS.map((a) => {
        const on = value.includes(a);
        return (
          <button
            key={a}
            type="button"
            onClick={() => onChange(on ? value.filter((x) => x !== a) : [...value, a])}
            className={cn(
              "rounded-full border px-3 py-1.5 text-xs font-medium transition cursor-pointer select-none",
              on ? "border-primary bg-mint text-primary shadow-xs" : "border-border text-muted-foreground hover:text-foreground"
            )}
          >
            {on && <Check className="size-3 inline mr-1 stroke-[3]" />}
            {a}
          </button>
        );
      })}
    </div>
  );
}
