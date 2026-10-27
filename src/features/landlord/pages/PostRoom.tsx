import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Rocket,
  Loader2,
  MapPin,
  Search,
  CheckCircle2,
  Sparkles,
  Eye,
  Maximize2,
  ShieldCheck,
  Navigation,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { roomTypes, districts, LANDLORD_AMENITY_OPTIONS } from "@/lib/constants";
import { cn, formatVND } from "@/lib/utils";
import { api } from "@/lib/api";
import { roomsApi } from "@/features/rooms/api/roomsApi";
import { locationsApi } from "@/features/locations/api/locationsApi";
import type { LocationSuggestionResponse } from "@/features/locations/types/location.types";
import {
  MoneyInput, FeeFields, ImagePicker, feesToState, stateToFees, type FeeState, type PickedImage,
} from "../components/roomForm";

const steps = ["Thông tin", "Giá & phí", "Hình ảnh", "Vị trí", "Xem trước"];

export const AMENITY_OPTIONS = LANDLORD_AMENITY_OPTIONS;

function matchHcmDistrict(text: string): string | undefined {
  const lower = text.toLowerCase();
  if (lower.includes("thủ đức") || lower.includes("quận 2")) {
    return "Thủ Đức";
  }
  // Sort by length descending so "Quận 10", "Quận 11", "Quận 12" match before "Quận 1"
  const sorted = [...districts].sort((a, b) => b.length - a.length);
  return sorted.find((d) => lower.includes(d.toLowerCase()));
}

export default function PostRoom() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [form, setForm] = useState({
    title: "",
    roomType: "",
    areaSqm: "",
    maxOccupants: "2",
    description: "",
    price: 0,
    depositAmount: 0,
    addressStreet: "",
    district: "",
    city: "Hồ Chí Minh",
    latitude: undefined as number | undefined,
    longitude: undefined as number | undefined,
  });
  const [fees, setFees] = useState<FeeState>(feesToState());
  const [amenities, setAmenities] = useState<string[]>([]);
  const [images, setImages] = useState<PickedImage[]>([]);
  const [boostsLeft, setBoostsLeft] = useState<number | null>(null);
  const [boost, setBoost] = useState(false);

  // Autocomplete & Geocode state (Goong.io)
  const [suggestions, setSuggestions] = useState<LocationSuggestionResponse[]>([]);
  const [isSearchingLocation, setIsSearchingLocation] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchDebounceRef = useRef<any>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleAddressChange = (val: string) => {
    const inferredDistrict = matchHcmDistrict(val);
    setForm((p) => ({
      ...p,
      addressStreet: val,
      district: inferredDistrict || p.district,
      latitude: undefined,
      longitude: undefined,
    }));

    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    if (!val || val.trim().length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setIsSearchingLocation(true);
    searchDebounceRef.current = setTimeout(async () => {
      try {
        const query = form.district ? `${val.trim()}, ${form.district}` : val.trim();
        const results = await locationsApi.autocomplete(query);
        setSuggestions(results);
        setShowSuggestions(results.length > 0);
      } catch (err) {
        console.warn("Location autocomplete error:", err);
      } finally {
        setIsSearchingLocation(false);
      }
    }, 280);
  };

  const handleSelectSuggestion = async (item: LocationSuggestionResponse) => {
    setShowSuggestions(false);

    const fullText = `${item.description || ""} ${item.secondaryText || ""}`;
    const matchedDistrict = matchHcmDistrict(fullText);
    const streetName = item.mainText || item.description;

    let lat = item.lat;
    let lng = item.lng;

    if (!lat || !lng) {
      setIsGeocoding(true);
      try {
        const geo = await locationsApi.geocode(item.description || streetName);
        const resolvedLat = geo?.latitude ?? geo?.lat;
        const resolvedLng = geo?.longitude ?? geo?.lng;
        if (resolvedLat && resolvedLng) {
          lat = resolvedLat;
          lng = resolvedLng;
        }
      } catch (err) {
        console.warn("Geocode error for selected suggestion:", err);
      } finally {
        setIsGeocoding(false);
      }
    }

    setForm((prev) => ({
      ...prev,
      addressStreet: streetName,
      district: matchedDistrict || prev.district,
      latitude: lat,
      longitude: lng,
    }));

    if (lat && lng) {
      toast.success("Đã xác thực tọa độ Goong Maps!", {
        description: `${streetName}${matchedDistrict ? ", " + matchedDistrict : ""}`,
      });
    }
  };

  const handleManualGeocode = async () => {
    if (!form.addressStreet.trim()) {
      return toast.error("Vui lòng nhập địa chỉ cụ thể trước khi định vị");
    }
    setIsGeocoding(true);
    try {
      const fullQuery = `${form.addressStreet.trim()}${form.district ? `, ${form.district}` : ""}, ${form.city}`;
      const geo = await locationsApi.geocode(fullQuery);
      const lat = geo?.latitude ?? geo?.lat;
      const lng = geo?.longitude ?? geo?.lng;
      const matchedDistrict = matchHcmDistrict(geo?.formattedAddress || fullQuery);
      if (lat && lng) {
        setForm((prev) => ({
          ...prev,
          district: prev.district || matchedDistrict || "",
          latitude: lat,
          longitude: lng,
        }));
        toast.success("Đã xác định tọa độ GPS trên bản đồ Goong Maps!");
      } else {
        toast.error("Chưa tìm thấy tọa độ cho địa chỉ này, vui lòng chọn từ danh sách gợi ý.");
      }
    } catch {
      toast.error("Không thể định vị địa chỉ này, vui lòng chọn từ gợi ý Goong Maps.");
    } finally {
      setIsGeocoding(false);
    }
  };

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
  const toggleAmenity = (amenity: string) => {
    setAmenities((prev) =>
      prev.includes(amenity) ? prev.filter((x) => x !== amenity) : [...prev, amenity]
    );
  };
  const feeList = stateToFees(fees, amenities);

  const validate = (s: number): string | null => {
    if (s === 0) {
      if (!form.title.trim()) return "Vui lòng nhập tiêu đề tin đăng";
      if (!form.roomType) return "Vui lòng chọn loại phòng";
      if (!(Number(form.areaSqm) > 0)) return "Diện tích phải lớn hơn 0";
      const occ = Number(form.maxOccupants);
      if (!Number.isInteger(occ) || occ < 1 || occ > 20) return "Số người ở tối đa phải là số nguyên từ 1 đến 20 người";
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

  const handleNext = async () => {
    const err = validate(step);
    if (err) return toast.error(err);
    // Auto-geocode when leaving Step 3 if user typed address manually without selecting a suggestion
    if (step === 3 && (!form.latitude || !form.longitude)) {
      setIsGeocoding(true);
      try {
        const fullQuery = `${form.addressStreet.trim()}, ${form.district}, ${form.city}`;
        const geo = await locationsApi.geocode(fullQuery);
        const lat = geo?.latitude ?? geo?.lat;
        const lng = geo?.longitude ?? geo?.lng;
        if (lat && lng) {
          setForm((prev) => ({ ...prev, latitude: lat, longitude: lng }));
        }
      } catch {
        // Backend createRoom will also fallback to geocoding
      } finally {
        setIsGeocoding(false);
      }
    }
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
        maxOccupants: Math.max(1, Math.min(20, Math.round(Number(form.maxOccupants) || 2))),
        addressStreet: form.addressStreet.trim(),
        district: form.district,
        city: form.city,
        latitude: form.latitude,
        longitude: form.longitude,
        amenities,
        fees: feeList,
      });

      try {
        await roomsApi.uploadRoomImages(room.id, images.map((i) => i.file!));
      } catch (e) {
        await roomsApi.deleteRoom(room.id).catch(() => {});
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

  const checklist = [
    { label: "Thông tin & Tiện nghi", done: Boolean(form.title.trim() && form.roomType && Number(form.areaSqm) > 0 && form.description.trim()) },
    { label: "Giá thuê & Chi phí", done: form.price > 0 },
    { label: "Hình ảnh thực tế", done: images.length > 0 },
    { label: "Địa chỉ & Định vị Goong Maps", done: Boolean(form.addressStreet.trim() && form.district) },
  ];

  return (
    <div className="w-full space-y-4">
      {/* Header + Compact Step Bar */}
      <div data-tour="landlord-post-stepper" className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-2xl bg-card px-5 py-3.5 ring-1 ring-border shadow-2xs">
        <div>
          <h1 className="brand text-xl sm:text-2xl text-foreground">Đăng phòng mới</h1>
          <p className="text-xs text-muted-foreground">
            Bước {step + 1}/{steps.length}: <strong className="text-foreground">{steps[step]}</strong>
          </p>
        </div>

        <div className="flex-1 max-w-xl">
          <div className="flex items-center justify-between text-xs gap-1">
            {steps.map((s, i) => (
              <button
                key={s}
                type="button"
                onClick={() => {
                  if (i < step) setStep(i);
                  else if (i === step + 1) handleNext();
                }}
                className={cn(
                  "flex items-center gap-1.5 px-2 py-1 rounded-lg transition-all",
                  i === step
                    ? "bg-mint/70 text-primary font-semibold cursor-pointer"
                    : i < step
                    ? "text-primary font-medium hover:bg-mint/40 cursor-pointer"
                    : "text-muted-foreground cursor-default"
                )}
              >
                <span
                  className={cn(
                    "grid size-5 place-items-center rounded-full text-[11px] font-bold transition-all shrink-0",
                    i < step
                      ? "bg-primary text-primary-foreground"
                      : i === step
                      ? "bg-primary text-primary-foreground ring-2 ring-primary/25"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {i < step ? <Check className="size-3" strokeWidth={3} /> : i + 1}
                </span>
                <span className="hidden md:inline">{s}</span>
              </button>
            ))}
          </div>
          <Progress value={((step + 1) / steps.length) * 100} className="mt-2 h-1.5" />
        </div>
      </div>

      {/* Responsive 12-Column Split Layout: Left Form + Right Live Preview */}
      <div data-tour="landlord-post-form" className="grid gap-5 lg:grid-cols-12 items-start w-full">
        {/* LEFT COLUMN: Active Step Form (hugs content naturally, no artificial min-height) */}
        <div className="lg:col-span-7 xl:col-span-8 rounded-2xl bg-card p-5 ring-1 ring-border shadow-2xs flex flex-col justify-between">
          <div>
            {step === 0 && (
              <div className="grid gap-3.5 w-full">
                <Field label="Tiêu đề tin đăng">
                  <Input
                    value={form.title}
                    maxLength={255}
                    onChange={(e) => update("title", e.target.value)}
                    placeholder="VD: Studio ban công thoáng mát gần ĐH Bách Khoa, giờ tự do"
                  />
                </Field>

                <div className="grid gap-3.5 sm:grid-cols-3 w-full">
                  <Field label="Loại phòng">
                    <Select value={form.roomType} onValueChange={(v) => update("roomType", v)}>
                      <SelectTrigger className="w-full"><SelectValue placeholder="Chọn loại phòng" /></SelectTrigger>
                      <SelectContent>
                        {roomTypes.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </Field>

                  <Field label="Diện tích (m²)">
                    <div className="space-y-1.5">
                      <Input
                        type="number"
                        min={1}
                        inputMode="decimal"
                        className="tabular-nums"
                        value={form.areaSqm}
                        onChange={(e) => update("areaSqm", e.target.value)}
                        placeholder="VD: 25"
                      />
                      <div className="flex flex-wrap gap-1">
                        {[18, 22, 25, 30, 35].map((sqm) => (
                          <button
                            key={sqm}
                            type="button"
                            onClick={() => update("areaSqm", String(sqm))}
                            className={cn(
                              "rounded-md border px-2 py-0.5 text-[11px] font-medium tabular-nums transition-transform duration-150 active:scale-[0.97] cursor-pointer",
                              Number(form.areaSqm) === sqm
                                ? "border-primary bg-mint text-primary"
                                : "border-border/70 text-muted-foreground hover:text-foreground hover:bg-muted/50"
                            )}
                          >
                            {sqm}m²
                          </button>
                        ))}
                      </div>
                    </div>
                  </Field>

                  <Field label="Số người ở tối đa">
                    <div className="space-y-1.5">
                      <Input
                        type="number"
                        min={1}
                        max={20}
                        inputMode="numeric"
                        className="tabular-nums"
                        value={form.maxOccupants}
                        onChange={(e) => {
                          const raw = e.target.value.replace(/[^\d]/g, "");
                          update("maxOccupants", raw);
                        }}
                        placeholder="VD: 2"
                      />
                      <div className="flex flex-wrap gap-1">
                        {[1, 2, 3, 4].map((occ) => (
                          <button
                            key={occ}
                            type="button"
                            onClick={() => update("maxOccupants", String(occ))}
                            className={cn(
                              "rounded-md border px-2 py-0.5 text-[11px] font-medium tabular-nums transition-transform duration-150 active:scale-[0.97] cursor-pointer",
                              Number(form.maxOccupants) === occ
                                ? "border-primary bg-mint text-primary"
                                : "border-border/70 text-muted-foreground hover:text-foreground hover:bg-muted/50"
                            )}
                          >
                            {occ} người
                          </button>
                        ))}
                      </div>
                    </div>
                  </Field>
                </div>

                <Field label="Mô tả chi tiết">
                  <Textarea
                    rows={3}
                    value={form.description}
                    onChange={(e) => update("description", e.target.value)}
                    placeholder="Mô tả không gian, nội thất sẵn có, cửa sổ, tiện ích xung quanh, giờ giấc..."
                  />
                </Field>

                <Field label="Tiện nghi chuẩn của phòng (Đồng bộ với Bộ lọc tìm phòng của người thuê)">
                  <AmenityPicker value={amenities} onChange={setAmenities} />
                  <p className="text-[11px] text-muted-foreground pt-1">
                    Chọn từ 10 tiện nghi cốt lõi (chọn <strong>Wi-Fi</strong> hoặc <strong>Bãi xe</strong> sẽ mở ô nhập phí ở bước sau). Các nội thất riêng lẻ khác (tủ lạnh, máy giặt, bàn học...) vui lòng ghi trong phần <strong>Mô tả chi tiết</strong> ở trên.
                  </p>
                </Field>
              </div>
            )}

            {step === 1 && (
              <div className="grid gap-4 sm:grid-cols-2 w-full">
                <Field label="Tiền thuê / tháng">
                  <div className="space-y-1.5">
                    <MoneyInput value={form.price} onChange={(v) => update("price", v)} suffix="đ" placeholder="VD: 3.500.000" />
                    <div className="flex flex-wrap gap-1">
                      {[2500000, 3200000, 4000000, 5000000].map((p) => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => update("price", p)}
                          className={cn(
                            "rounded-md border px-2 py-0.5 text-[11px] font-medium transition cursor-pointer",
                            form.price === p
                              ? "border-primary bg-mint text-primary"
                              : "border-border/70 text-muted-foreground hover:text-foreground hover:bg-muted/50"
                          )}
                        >
                          {(p / 1e6).toFixed(1)}tr
                        </button>
                      ))}
                    </div>
                  </div>
                </Field>

                <Field label="Tiền đặt cọc">
                  <div className="space-y-1.5">
                    <MoneyInput value={form.depositAmount} onChange={(v) => update("depositAmount", v)} suffix="đ" placeholder="0 nếu không cọc" />
                    <div className="flex flex-wrap gap-1">
                      {form.price > 0 && (
                        <>
                          <button
                            type="button"
                            onClick={() => update("depositAmount", form.price)}
                            className={cn(
                              "rounded-md border px-2 py-0.5 text-[11px] font-medium transition cursor-pointer",
                              form.depositAmount === form.price
                                ? "border-primary bg-mint text-primary"
                                : "border-border/70 text-muted-foreground hover:text-foreground hover:bg-muted/50"
                            )}
                          >
                            Cọc 1 tháng ({formatVND(form.price)})
                          </button>
                          <button
                            type="button"
                            onClick={() => update("depositAmount", Math.round(form.price / 2))}
                            className="rounded-md border border-border/70 px-2 py-0.5 text-[11px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition cursor-pointer"
                          >
                            Cọc nửa tháng
                          </button>
                        </>
                      )}
                      <button
                        type="button"
                        onClick={() => update("depositAmount", 0)}
                        className={cn(
                          "rounded-md border px-2 py-0.5 text-[11px] font-medium transition cursor-pointer",
                          form.depositAmount === 0
                            ? "border-primary bg-mint text-primary"
                            : "border-border/70 text-muted-foreground hover:text-foreground hover:bg-muted/50"
                        )}
                      >
                        Miễn cọc (0đ)
                      </button>
                    </div>
                  </div>
                </Field>

                <FeeFields
                  value={fees}
                  onChange={setFees}
                  amenities={amenities}
                  onToggleAmenity={toggleAmenity}
                />

                <p className="sm:col-span-2 text-[11px] text-muted-foreground">
                  Hệ thống chỉ hiển thị khoản phí của các tiện ích bạn đã chọn. Để trống số tiền nếu muốn ẩn khoản phí đó.
                </p>
              </div>
            )}

            {step === 2 && (
              <div className="w-full space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-semibold">Hình ảnh phòng thực tế ({images.length}/10)</Label>
                  <span className="text-[11px] text-muted-foreground">Nên tải từ 3 ảnh trở lên (Phòng chính, WC, Ban công/Bếp)</span>
                </div>
                <ImagePicker value={images} onChange={setImages} />
              </div>
            )}

            {step === 3 && (
              <div className="grid gap-4 sm:grid-cols-2 w-full">
                <div className="sm:col-span-2 relative" ref={wrapperRef}>
                  <Field label="Địa chỉ cụ thể (Goong.io Maps Autocomplete)">
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Input
                          value={form.addressStreet}
                          maxLength={255}
                          onChange={(e) => handleAddressChange(e.target.value)}
                          onFocus={() => {
                            if (suggestions.length > 0) setShowSuggestions(true);
                          }}
                          placeholder="Gõ số nhà, tên đường hoặc trường học: VD: 123 Tô Hiến Thành, ĐH Bách Khoa..."
                          className="pr-10"
                        />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground">
                          {isSearchingLocation || isGeocoding ? (
                            <Loader2 className="size-4 animate-spin text-primary" />
                          ) : (
                            <Search className="size-4" />
                          )}
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={isGeocoding || !form.addressStreet.trim()}
                        onClick={handleManualGeocode}
                        className="h-9 shrink-0 gap-1.5 text-xs border-primary/30 text-primary hover:bg-mint/50 cursor-pointer"
                        title="Xác định tọa độ GPS từ địa chỉ đã nhập"
                      >
                        {isGeocoding ? <Loader2 className="size-3.5 animate-spin" /> : <Navigation className="size-3.5" />}
                        Định vị GPS
                      </Button>
                    </div>
                  </Field>

                  {/* Goong.io Suggestions Dropdown */}
                  {showSuggestions && suggestions.length > 0 && (
                    <div className="absolute z-50 left-0 right-0 top-full mt-1 bg-popover text-popover-foreground border border-border rounded-xl shadow-xl overflow-hidden max-h-60 overflow-y-auto">
                      <div className="px-3 py-1.5 bg-mint/40 border-b border-border/60 flex items-center justify-between text-[11px] font-medium text-primary">
                        <span>Gợi ý địa chỉ từ Goong Maps Việt Nam</span>
                        <span>Bấm để chọn & ghim tọa độ</span>
                      </div>
                      {suggestions.map((item, idx) => (
                        <button
                          key={item.placeId || idx}
                          type="button"
                          className="w-full text-left px-3.5 py-2.5 hover:bg-mint/40 transition-colors flex items-start gap-2.5 border-b last:border-b-0 border-border/40 cursor-pointer"
                          onClick={() => handleSelectSuggestion(item)}
                        >
                          <MapPin className="size-4 text-emerald-600 shrink-0 mt-0.5" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-foreground truncate">
                              {item.mainText || item.description}
                            </p>
                            {item.secondaryText && (
                              <p className="text-[11px] text-muted-foreground truncate">
                                {item.secondaryText}
                              </p>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <Field label="Quận / Huyện">
                  <Select value={form.district} onValueChange={(v) => update("district", v)}>
                    <SelectTrigger className="w-full"><SelectValue placeholder="Chọn quận/huyện" /></SelectTrigger>
                    <SelectContent>
                      {districts.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </Field>

                <Field label="Thành phố">
                  <Input value={form.city} disabled className="bg-muted text-muted-foreground" />
                </Field>

                {/* GPS coordinates status & Map Preview */}
                <div className="sm:col-span-2 space-y-2.5">
                  {form.latitude && form.longitude ? (
                    <div className="rounded-xl bg-emerald-50/90 border border-emerald-200 p-3 space-y-2">
                      <div className="flex items-center justify-between gap-2 text-xs text-emerald-900">
                        <span className="flex items-center gap-1.5 font-semibold">
                          <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
                          Đã ghim tọa độ GPS chuẩn xác ({form.latitude.toFixed(5)}, {form.longitude.toFixed(5)})
                        </span>
                        <Badge className="bg-emerald-600 text-white text-[10px]">Hiển thị trên Bản đồ</Badge>
                      </div>
                      <div className="overflow-hidden rounded-lg border border-emerald-200/80 h-36 w-full bg-slate-100">
                        <iframe
                          title="Xem trước vị trí ghim phòng"
                          width="100%"
                          height="100%"
                          loading="lazy"
                          src={`https://www.openstreetmap.org/export/embed.html?bbox=${form.longitude - 0.004}%2C${form.latitude - 0.0025}%2C${form.longitude + 0.004}%2C${form.latitude + 0.0025}&layer=mapnik&marker=${form.latitude}%2C${form.longitude}`}
                          className="border-0 w-full h-full"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between gap-2 rounded-xl border border-dashed border-border bg-muted/30 p-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-2">
                        <MapPin className="size-4 text-primary shrink-0" />
                        Gõ địa chỉ để chọn từ gợi ý Goong Maps hoặc bấm <strong>Định vị GPS</strong> để ghim vị trí trên bản đồ.
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-4 w-full">
                {/* Compact Horizontal Split Preview so it never overflows the screen vertically */}
                <div className="grid sm:grid-cols-[220px_1fr] gap-4 rounded-xl ring-1 ring-border bg-secondary/20 p-3.5 w-full">
                  <div className="space-y-2">
                    {images[0] ? (
                      <img
                        src={images[0].url}
                        alt={form.title}
                        className="aspect-[4/3] w-full rounded-lg object-cover ring-1 ring-border"
                      />
                    ) : (
                      <div className="aspect-[4/3] w-full rounded-lg bg-muted grid place-items-center text-xs text-muted-foreground">
                        Chưa có ảnh
                      </div>
                    )}
                    {images.length > 1 && (
                      <div className="grid grid-cols-4 gap-1.5">
                        {images.slice(1, 5).map((img, idx) => (
                          <img
                            key={img.url || idx}
                            src={img.url}
                            alt=""
                            className="aspect-square w-full rounded-md object-cover ring-1 ring-border"
                          />
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="space-y-2 min-w-0 flex flex-col justify-between">
                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-mint text-primary">
                          {form.roomType || "Phòng trọ"}
                        </span>
                        <span className="text-xs text-muted-foreground truncate">
                          {form.addressStreet}, {form.district} • {form.areaSqm} m² • Tối đa {form.maxOccupants || 2} người
                        </span>
                      </div>
                      <h3 className="font-bold text-base text-foreground line-clamp-1">{form.title}</h3>
                      <p className="text-primary font-bold text-lg">
                        {formatVND(form.price)}
                        <span className="text-xs text-muted-foreground font-normal">/tháng</span>
                        <span className="ml-2 text-xs text-muted-foreground font-normal">
                          • {form.depositAmount > 0 ? `Cọc ${formatVND(form.depositAmount)}` : "Miễn đặt cọc"}
                        </span>
                      </p>

                      {feeList.length > 0 && (
                        <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground pt-0.5">
                          {feeList.map((f) => (
                            <span key={f.feeLabel} className="rounded bg-card px-2 py-0.5 ring-1 ring-border/70">
                              {f.feeLabel}: <b className="text-foreground">{f.feeValue}</b>
                            </span>
                          ))}
                        </div>
                      )}

                      <p className="text-xs text-muted-foreground line-clamp-2 pt-0.5">{form.description}</p>
                    </div>

                    {amenities.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-2 border-t border-border/50">
                        {amenities.map((a) => (
                          <span key={a} className="rounded-full bg-mint px-2.5 py-0.5 text-[11px] text-primary font-medium">
                            {a}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Boost Option */}
                <label
                  className={cn(
                    "flex items-center gap-3 rounded-xl bg-mint/50 p-3.5 ring-1 ring-primary/20 w-full transition",
                    boostsLeft ? "cursor-pointer hover:bg-mint/70" : "opacity-75"
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
                    Đẩy tin lên đầu kết quả tìm kiếm 7 ngày (dùng 1 lượt)
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {boostsLeft === null ? "…" : boostsLeft > 0 ? (
                      <Badge variant="secondary" className="bg-emerald-100 text-emerald-800">
                        Còn {boostsLeft} lượt
                      </Badge>
                    ) : (
                      <button
                        type="button"
                        className="text-primary font-semibold underline cursor-pointer"
                        onClick={() => navigate("/landlord?tab=packages")}
                      >
                        Hết lượt — mua gói
                      </button>
                    )}
                  </span>
                </label>
              </div>
            )}
          </div>

          {/* Action Bar inside Form Card */}
          <div className="mt-5 pt-3.5 flex items-center justify-between border-t border-border/60 w-full">
            <Button
              type="button"
              variant="ghost"
              className="gap-1 cursor-pointer text-xs sm:text-sm"
              onClick={() => (step > 0 ? setStep(step - 1) : navigate("/landlord"))}
              disabled={isSubmitting}
            >
              <ArrowLeft className="size-4" /> Quay lại
            </Button>

            <div className="flex items-center gap-2">
              {step < steps.length - 1 && (
                <span className="hidden sm:inline text-[11px] text-muted-foreground mr-1">
                   Tiếp theo: {steps[step + 1]}
                </span>
              )}
              <Button
                type="button"
                className="gap-1.5 cursor-pointer text-xs sm:text-sm font-semibold px-5"
                onClick={() => (step < steps.length - 1 ? handleNext() : finish())}
                disabled={isSubmitting || isGeocoding}
              >
                {isSubmitting ? (
                  <><Loader2 className="size-4 animate-spin" /> Đang đăng...</>
                ) : step === steps.length - 1 ? (
                  <>Đăng tin ngay <Check className="size-4" /></>
                ) : (
                  <>Tiếp tục <ArrowRight className="size-4" /></>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Live Card Preview & Checklist (fills desktop horizontal space purposefully) */}
        <div className="lg:col-span-5 xl:col-span-4 space-y-4 lg:sticky lg:top-20">
          <div className="rounded-2xl bg-card p-4 ring-1 ring-border shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
                <Eye className="size-3.5" /> Xem trước thẻ phòng trực tiếp
              </span>
              <Badge variant="outline" className="text-[10px]">Live Preview</Badge>
            </div>

            {/* Live Room Card */}
            <div className="overflow-hidden rounded-2xl bg-background ring-1 ring-border shadow-xs">
              <div className="relative aspect-[16/10] w-full bg-slate-100 overflow-hidden">
                {images[0] ? (
                  <img src={images[0].url} alt="Preview" className="size-full object-cover" />
                ) : (
                  <div className="size-full flex flex-col items-center justify-center text-muted-foreground/60 p-4 text-center">
                    <Sparkles className="size-6 mb-1 text-primary/50" />
                    <span className="text-xs font-medium">Ảnh bìa sẽ hiển thị tại đây</span>
                    <span className="text-[11px]">Tải ảnh lên ở Bước 3</span>
                  </div>
                )}
                <span className="absolute left-2.5 top-2.5 rounded-md bg-emerald-600/95 px-2 py-0.5 text-[10px] font-semibold text-white shadow-xs">
                  {form.roomType || "Loại phòng"}
                </span>
                {boost && (
                  <span className="absolute right-2.5 top-2.5 inline-flex items-center gap-1 rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-bold text-white shadow-xs">
                    <Rocket className="size-2.5" /> Nổi bật
                  </span>
                )}
              </div>

              <div className="p-3.5 space-y-2">
                <h3 className="font-semibold text-sm text-foreground line-clamp-1">
                  {form.title.trim() || "Tiêu đề phòng trọ của bạn..."}
                </h3>
                <p className="text-xs text-muted-foreground flex items-center gap-1 truncate">
                  <MapPin className="size-3.5 text-primary shrink-0" />
                  <span className="truncate">
                    {form.addressStreet.trim() || "Địa chỉ đường"}
                    {form.district ? `, ${form.district}` : ", Quận/Huyện"}
                  </span>
                </p>

                <div className="flex items-baseline justify-between pt-0.5">
                  <p className="text-primary font-bold text-base">
                    {form.price > 0 ? formatVND(form.price) : "0đ"}
                    <span className="text-[11px] text-muted-foreground font-normal">/tháng</span>
                  </p>
                  <div className="flex items-center gap-2.5 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <Maximize2 className="size-3" /> {form.areaSqm || "0"} m²
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Users className="size-3" /> Tối đa {form.maxOccupants || "2"} người
                    </span>
                  </div>
                </div>

                {feeList.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-1 border-t border-border/50 text-[11px] text-muted-foreground">
                    {feeList.map((f) => (
                      <span key={f.feeLabel} className="bg-muted/60 px-1.5 py-0.5 rounded">
                        {f.feeLabel}: <strong className="text-foreground">{f.feeValue}</strong>
                      </span>
                    ))}
                  </div>
                )}

                {amenities.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-1">
                    {amenities.slice(0, 5).map((a) => (
                      <span key={a} className="rounded-md bg-mint/90 px-2 py-0.5 text-[10px] font-medium text-emerald-800">
                        {a}
                      </span>
                    ))}
                    {amenities.length > 5 && (
                      <span className="text-[10px] text-muted-foreground self-center">
                        +{amenities.length - 5}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Progress Checklist */}
            <div className="pt-2 border-t border-border/60 space-y-1.5">
              <p className="text-[11px] font-semibold text-muted-foreground">Mức độ hoàn thiện tin đăng</p>
              <div className="grid grid-cols-2 gap-1.5">
                {checklist.map((item, idx) => (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => setStep(idx)}
                    className={cn(
                      "flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-left text-[11px] transition cursor-pointer border",
                      item.done
                        ? "bg-emerald-50/70 border-emerald-200 text-emerald-900 font-medium"
                        : step === idx
                        ? "bg-mint/40 border-primary/40 text-foreground font-medium"
                        : "bg-muted/30 border-transparent text-muted-foreground hover:bg-muted/60"
                    )}
                  >
                    <ShieldCheck
                      className={cn("size-3.5 shrink-0", item.done ? "text-emerald-600" : "text-muted-foreground/50")}
                    />
                    <span className="truncate">{item.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
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
              "rounded-full border px-3 py-1.5 text-xs font-medium transition-all active:scale-95 cursor-pointer select-none",
              on ? "border-primary bg-mint text-primary shadow-2xs" : "border-border text-muted-foreground hover:text-foreground hover:bg-muted/40"
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
