import { useRef } from "react";
import { ImagePlus, Star, X } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

/* ---------- Money ---------- */

const toDigits = (s: string) => Number(s.replace(/\D/g, "").slice(0, 12)) || 0;
const fmt = (n: number) => (n ? n.toLocaleString("vi-VN") : "");

export function MoneyInput({
  value, onChange, suffix, placeholder, disabled, className,
}: {
  value: number;
  onChange: (v: number) => void;
  suffix?: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("relative", className)}>
      <Input
        inputMode="numeric"
        value={fmt(value)}
        disabled={disabled}
        placeholder={placeholder}
        onChange={(e) => onChange(toDigits(e.target.value))}
        className={cn("w-full", suffix && "pr-8")}
      />
      {suffix && (
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">{suffix}</span>
      )}
    </div>
  );
}

/* ---------- Fees (amount + unit) ---------- */

type Unit = { label: string; amount: boolean };
export const FEES: { label: string; requiredAmenity?: string; units: Unit[] }[] = [
  { label: "Tiền điện", units: [{ label: "đ/kWh", amount: true }, { label: "Theo giá nhà nước", amount: false }, { label: "Miễn phí", amount: false }] },
  { label: "Tiền nước", units: [{ label: "đ/người/tháng", amount: true }, { label: "đ/m³", amount: true }, { label: "Miễn phí", amount: false }] },
  { label: "Wi-Fi", requiredAmenity: "Wi-Fi", units: [{ label: "đ/phòng/tháng", amount: true }, { label: "Miễn phí", amount: false }] },
  { label: "Phí giữ xe", requiredAmenity: "Bãi xe", units: [{ label: "đ/xe/tháng", amount: true }, { label: "Miễn phí", amount: false }] },
];

export type FeeState = Record<string, { unit: string; amount: number }>;
export type RoomFee = { feeLabel: string; feeValue: string };

const needsAmount = (label: string, unit: string) =>
  !!FEES.find((f) => f.label === label)?.units.find((u) => u.label === unit)?.amount;

/** Parses stored fees ("3.500đ/kWh", "Miễn phí") back into form state. */
export function feesToState(fees: RoomFee[] = []): FeeState {
  return Object.fromEntries(
    FEES.map((f) => {
      const v = fees.find((x) => x.feeLabel === f.label)?.feeValue ?? "";
      const m = v.match(/^([\d.]+)(đ\/.+)$/);
      if (m && f.units.some((u) => u.label === m[2])) return [f.label, { unit: m[2], amount: toDigits(m[1]) }];
      if (f.units.some((u) => u.label === v)) return [f.label, { unit: v, amount: 0 }];
      return [f.label, { unit: f.units[0].label, amount: 0 }];
    })
  );
}

/** Form state -> API fees; amount-based fees left empty or unselected amenity fees are omitted. */
export function stateToFees(state: FeeState, amenities?: string[]): RoomFee[] {
  return FEES.flatMap((f) => {
    if (f.requiredAmenity && amenities && !amenities.includes(f.requiredAmenity)) {
      return [];
    }
    const entry = state[f.label];
    if (!entry) return [];
    const { unit, amount } = entry;
    if (needsAmount(f.label, unit)) {
      return amount ? [{ feeLabel: f.label, feeValue: `${amount.toLocaleString("vi-VN")}${unit}` }] : [];
    }
    return [{ feeLabel: f.label, feeValue: unit }];
  });
}

export function FeeFields({
  value,
  onChange,
  amenities,
  onToggleAmenity,
}: {
  value: FeeState;
  onChange: (v: FeeState) => void;
  amenities?: string[];
  onToggleAmenity?: (amenity: string) => void;
}) {
  const set = (label: string, patch: Partial<FeeState[string]>) =>
    onChange({ ...value, [label]: { ...value[label], ...patch } });

  const visibleFees = FEES.filter(
    (f) => !f.requiredAmenity || !amenities || amenities.includes(f.requiredAmenity)
  );
  const hiddenAmenityFees = FEES.filter(
    (f) => f.requiredAmenity && amenities && !amenities.includes(f.requiredAmenity)
  );

  return (
    <>
      {visibleFees.map((f) => {
        const { unit, amount } = value[f.label];
        const hasAmount = needsAmount(f.label, unit);
        return (
          <div key={f.label} className="space-y-1.5 w-full">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold text-foreground">{f.label}</Label>
              {f.requiredAmenity && onToggleAmenity && (
                <button
                  type="button"
                  onClick={() => onToggleAmenity(f.requiredAmenity!)}
                  className="text-[11px] text-muted-foreground hover:text-destructive transition-colors cursor-pointer"
                  title={`Bỏ tiện ích ${f.requiredAmenity}`}
                >
                  Bỏ {f.requiredAmenity}
                </button>
              )}
            </div>
            <div className="flex gap-2">
              <MoneyInput
                value={hasAmount ? amount : 0}
                onChange={(v) => set(f.label, { amount: v })}
                disabled={!hasAmount}
                placeholder={hasAmount ? "Nhập số tiền" : "—"}
                className="flex-1 min-w-0"
              />
              <Select value={unit} onValueChange={(v) => set(f.label, { unit: v })}>
                <SelectTrigger className="w-40 shrink-0"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {f.units.map((u) => <SelectItem key={u.label} value={u.label}>{u.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        );
      })}

      {hiddenAmenityFees.length > 0 && onToggleAmenity && (
        <div className="sm:col-span-2 flex flex-wrap items-center gap-2 pt-1">
          <span className="text-[11px] text-muted-foreground">
            Chưa chọn ở bước Thông tin (không cần nhập phí):
          </span>
          {hiddenAmenityFees.map((f) => (
            <button
              key={f.label}
              type="button"
              onClick={() => onToggleAmenity(f.requiredAmenity!)}
              className="inline-flex items-center gap-1 rounded-full border border-dashed border-primary/40 bg-mint/30 px-2.5 py-1 text-[11px] font-medium text-primary hover:bg-mint/70 transition cursor-pointer"
            >
              + Thêm tiện ích {f.requiredAmenity} & nhập {f.label.toLowerCase()}
            </button>
          ))}
        </div>
      )}
    </>
  );
}

/* ---------- Images (existing URLs + new files) ---------- */

export type PickedImage = { url: string; file?: File }; // file present = not uploaded yet
export const MAX_IMAGES = 10;
const MAX_FILE_MB = 10;

export function ImagePicker({ value, onChange }: { value: PickedImage[]; onChange: (v: PickedImage[]) => void }) {
  const input = useRef<HTMLInputElement>(null);

  const add = (list: FileList | null) => {
    if (!list) return;
    const accepted: PickedImage[] = [];
    for (const file of Array.from(list)) {
      if (!file.type.startsWith("image/")) toast.error(`"${file.name}" không phải ảnh`);
      else if (file.size > MAX_FILE_MB * 1024 * 1024) toast.error(`"${file.name}" vượt quá ${MAX_FILE_MB}MB`);
      else accepted.push({ file, url: URL.createObjectURL(file) });
    }
    const room = MAX_IMAGES - value.length;
    if (accepted.length > room) toast.info(`Tối đa ${MAX_IMAGES} ảnh`);
    onChange([...value, ...accepted.slice(0, room)]);
    if (input.current) input.current.value = "";
  };

  const remove = (i: number) => {
    if (value[i].file) URL.revokeObjectURL(value[i].url);
    onChange(value.filter((_, k) => k !== i));
  };

  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground">
        Ảnh đầu tiên là ảnh bìa — bấm ★ để đổi ảnh bìa. Tối đa {MAX_IMAGES} ảnh, mỗi ảnh ≤ {MAX_FILE_MB}MB.
      </p>
      <input ref={input} type="file" accept="image/*" multiple hidden onChange={(e) => add(e.target.files)} />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 w-full">
        {value.map((img, i) => (
          <div key={img.url} className="relative aspect-[4/3] overflow-hidden rounded-xl ring-1 ring-border">
            <img src={img.url} alt="" className="size-full object-cover" />
            {i === 0 ? (
              <span className="absolute left-2 top-2 rounded-md bg-primary px-2 py-0.5 text-[11px] text-primary-foreground font-semibold">Ảnh bìa</span>
            ) : (
              <button
                type="button"
                title="Đặt làm ảnh bìa"
                onClick={() => onChange([value[i], ...value.filter((_, k) => k !== i)])}
                className="absolute left-2 top-2 grid size-7 place-items-center rounded-full bg-black/55 text-white hover:bg-primary cursor-pointer"
              >
                <Star className="size-3.5" />
              </button>
            )}
            <button
              type="button"
              title="Xoá ảnh"
              onClick={() => remove(i)}
              className="absolute right-2 top-2 grid size-7 place-items-center rounded-full bg-black/55 text-white hover:bg-destructive cursor-pointer"
            >
              <X className="size-3.5" />
            </button>
          </div>
        ))}
        {value.length < MAX_IMAGES && (
          <button
            type="button"
            onClick={() => input.current?.click()}
            className="grid aspect-[4/3] place-items-center rounded-xl border-2 border-dashed border-primary/40 text-primary hover:bg-mint/30 transition-colors cursor-pointer"
          >
            <div className="text-center">
              <ImagePlus className="mx-auto size-6" />
              <span className="text-xs font-medium mt-1 block">Tải ảnh lên</span>
            </div>
          </button>
        )}
      </div>
    </div>
  );
}
