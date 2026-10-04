import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router";
import {
  ArrowLeft, ArrowRight, Check, Upload, ShieldCheck, Camera, PartyPopper,
  Building2, MapPin, Phone, Sparkles, Loader2, LogOut, X, AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { districts, roomTypes } from "@/lib/constants";
import { ImageWithFallback } from "@/components/shared/ImageWithFallback";
import { cn, getInitials } from "@/lib/utils";
import { PageTransition } from "@/components/layouts/PageTransition";
import { useAuth } from "@/app/context/AuthContext";
import { AnimatePresence, motion } from "motion/react";
import { authApi } from "@/features/auth/api/authApi";
import { accountApi } from "@/features/account/api/accountApi";
import { toast } from "sonner";

const steps = ["Hồ sơ", "Phòng trọ", "Xác minh", "Hoàn tất"];

const stepVariants = {
  enter: (dir: number) => ({
    x: dir > 0 ? 30 : -30,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (dir: number) => ({
    x: dir > 0 ? -30 : 30,
    opacity: 0,
  }),
};

export default function LandlordOnboarding() {
  const navigate = useNavigate();
  const { user, logout, setOnboarded, refreshProfile } = useAuth();
  const [[step, direction], setStepState] = useState([0, 1]);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  // Chuyển hướng về đăng nhập nếu phiên hết hạn hoặc chưa đăng nhập
  useEffect(() => {
    if (!user && !localStorage.getItem("ptx_access_token")) {
      toast.error("Vui lòng đăng nhập để thực hiện khảo sát onboarding");
      navigate("/login");
    }
  }, [user, navigate]);

  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || "");
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [fullName, setFullName] = useState(user?.fullName || "");
  const [phoneNumber, setPhoneNumber] = useState(user?.phone || user?.phoneNumber || "");
  const [address, setAddress] = useState("");
  const [bio, setBio] = useState("");

  // Tự động điền dữ liệu người dùng khi đã load xong từ hệ thống
  useEffect(() => {
    if (user) {
      if (!fullName && user.fullName) setFullName(user.fullName);
      if (!avatarUrl && user.avatarUrl) setAvatarUrl(user.avatarUrl);
      const userPhone = user.phone || user.phoneNumber || "";
      if (!phoneNumber && userPhone) setPhoneNumber(userPhone);
    }
  }, [user]);

  const [roomCountRange, setRoomCountRange] = useState("1-5");
  const [primaryRoomType, setPrimaryRoomType] = useState<string>(roomTypes[0] || "PHONG_KHEP_KIN");
  const [primaryDistricts, setPrimaryDistricts] = useState<string[]>([]);

  // CCCD Upload state
  const [frontCccd, setFrontCccd] = useState<File | null>(null);
  const [frontPreview, setFrontPreview] = useState<string | null>(null);
  const [backCccd, setBackCccd] = useState<File | null>(null);
  const [backPreview, setBackPreview] = useState<string | null>(null);
  const [isKycSkipped, setIsKycSkipped] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const toggleDistrict = (d: string) => {
    setPrimaryDistricts((prev) =>
      prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]
    );
    if (errors.districts) setErrors(prev => ({ ...prev, districts: "" }));
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Vui lòng chọn tệp định dạng hình ảnh (.jpg, .png, .webp)");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Kích thước ảnh không được vượt quá 5MB");
      return;
    }

    // Xem trước ảnh ngay lập tức
    const localPreview = URL.createObjectURL(file);
    setAvatarUrl(localPreview);

    setIsUploadingAvatar(true);
    try {
      const res = await accountApi.uploadAvatar(file);
      if (res?.avatarUrl) {
        setAvatarUrl(res.avatarUrl);
        await refreshProfile();
        toast.success("Tải ảnh đại diện thành công!");
      }
    } catch (err: any) {
      console.error("Lỗi tải ảnh đại diện chủ trọ:", err);
      toast.error(err.message || "Tải ảnh đại diện thất bại, vui lòng thử lại");
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleFrontSelect = (file: File) => {
    setFrontCccd(file);
    setFrontPreview(URL.createObjectURL(file));
    setIsKycSkipped(false);
  };

  const handleBackSelect = (file: File) => {
    setBackCccd(file);
    setBackPreview(URL.createObjectURL(file));
    setIsKycSkipped(false);
  };

  const validateStep = (currentStep: number): boolean => {
    const newErrors: Record<string, string> = {};
    if (currentStep === 0) {
      const trimmedName = fullName.trim();
      if (!trimmedName) {
        newErrors.fullName = "Vui lòng nhập họ và tên chủ trọ";
      } else if (/^\d+$/.test(trimmedName)) {
        newErrors.fullName = "Họ và tên không thể chỉ toàn chữ số";
      }
      const cleanPhone = phoneNumber.replace(/[\s.-]+/g, "");
      if (!cleanPhone) {
        newErrors.phoneNumber = "Vui lòng nhập số điện thoại liên hệ";
      } else if (!/^(0[3|5|7|8|9])[0-9]{8}$/.test(cleanPhone)) {
        newErrors.phoneNumber = "Số điện thoại không hợp lệ (10 chữ số, đầu 03/05/07/08/09)";
      }
      if (!address.trim()) newErrors.address = "Vui lòng nhập địa chỉ liên hệ hoặc địa chỉ nhà trọ";
    } else if (currentStep === 1) {
      if (primaryDistricts.length < 1) {
        newErrors.districts = "Vui lòng chọn ít nhất 1 khu vực hoạt động chính";
      }
    }

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      toast.error("Vui lòng điền đầy đủ các thông tin bắt buộc còn thiếu");
      return false;
    }
    return true;
  };

  const handleFinish = async () => {
    setIsSubmitting(true);
    try {
      const roomNum = roomCountRange === "0" ? 0 : roomCountRange === "1-5" ? 3 : roomCountRange === "6-10" ? 8 : 12;
      const cleanPhone = phoneNumber.replace(/[\s.-]+/g, "");
      await authApi.landlordOnboarding({
        fullName: fullName.trim(),
        phoneNumber: cleanPhone,
        address: address.trim(),
        estimatedRoomCount: roomNum,
        primaryDistricts,
      });
      setOnboarded(true);
      await refreshProfile();
      toast.success("Khảo sát và thiết lập hồ sơ chủ trọ thành công!");
      navigate("/landlord");
    } catch (err: any) {
      console.error("Landlord onboarding error:", err);
      if (err?.code === "PHONE_EXISTS" || err?.message?.toLowerCase().includes("số điện thoại")) {
        setStepState([0, -1]);
        setErrors({ phoneNumber: err.message || "Số điện thoại này đã được sử dụng bởi một tài khoản khác" });
        toast.error(err.message || "Số điện thoại đã tồn tại, vui lòng đổi số khác");
        return;
      }
      toast.error(err.message || "Không thể lưu thông tin, vui lòng kiểm tra lại");
    } finally {
      setIsSubmitting(false);
    }
  };

  const next = () => {
    if (!validateStep(step)) return;
    if (step < steps.length - 1) {
      setStepState([step + 1, 1]);
    } else {
      handleFinish();
    }
  };

  const back = () => (step > 0 ? setStepState([step - 1, -1]) : navigate("/onboarding/role"));

  return (
    <PageTransition>
      <div className="min-h-screen bg-gradient-to-b from-mint/40 to-background">
        <div className="mx-auto max-w-3xl px-6 py-8">
          {/* Top Bar: Emergency Escape & Logout */}
          <div className="mb-6 flex items-center justify-between">
            <button
              onClick={() => navigate("/")}
              className="inline-flex items-center gap-1 text-xs text-muted-foreground transition hover:text-foreground"
            >
              <span className="font-semibold text-emerald-brand">← Về trang chủ</span>
            </button>
            <button
              type="button"
              onClick={async () => {
                await logout();
                navigate("/login");
              }}
              className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white/80 px-3 py-1 text-xs font-medium text-slate-600 shadow-sm transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
              title="Đăng xuất khỏi tài khoản hiện tại"
            >
              <LogOut className="size-3.5" />
              <span>Đổi tài khoản / Đăng xuất</span>
            </button>
          </div>

          {/* Stepper */}
          <div className="mb-8">
            <div className="flex items-center justify-between text-xs">
              {steps.map((s, i) => (
                <span key={s} className={cn("flex items-center gap-1.5", i <= step ? "text-primary font-medium" : "text-muted-foreground")}>
                  <span className={cn("grid size-6 place-items-center rounded-full text-[11px]", i < step ? "bg-primary text-primary-foreground" : i === step ? "bg-mint ring-2 ring-primary text-primary" : "bg-muted")}>
                    {i < step ? <Check className="size-3" strokeWidth={3} /> : i + 1}
                  </span>
                  <span className="hidden sm:inline">{s}</span>
                </span>
              ))}
            </div>
            <Progress value={((step + 1) / steps.length) * 100} className="mt-3 h-1.5" />
          </div>

          <div className="rounded-2xl bg-card p-8 shadow-sm ring-1 ring-border overflow-hidden">
            <AnimatePresence custom={direction} mode="wait">
              <motion.div
                key={step}
                custom={direction}
                variants={stepVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.2, ease: "easeInOut" }}
              >
                {/* STEP 0: Basic Profile */}
                {step === 0 && (
                  <div className="space-y-5">
                    <Header title="Thông tin chủ trọ" sub="Cung cấp thông tin liên hệ chính xác để khách thuê kết nối" />
                    <input
                      type="file"
                      ref={avatarInputRef}
                      accept="image/*"
                      className="hidden"
                      onChange={handleAvatarChange}
                    />
                    <div className="flex items-center gap-4">
                      <Avatar className="size-20 ring-2 ring-primary/20 shadow-sm">
                        {avatarUrl ? (
                          <AvatarImage src={avatarUrl} alt={fullName} className="object-cover" />
                        ) : null}
                        <AvatarFallback className="bg-mint text-primary font-bold text-xl">
                          {getInitials(fullName || user?.fullName) || <Camera className="size-6" />}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col gap-1">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={isUploadingAvatar}
                          onClick={() => avatarInputRef.current?.click()}
                          className="gap-2 w-fit"
                        >
                          {isUploadingAvatar ? (
                            <Loader2 className="size-4 animate-spin text-primary" />
                          ) : (
                            <Upload className="size-4" />
                          )}
                          {avatarUrl ? "Đổi ảnh đại diện" : "Tải ảnh đại diện"}
                        </Button>
                        <p className="text-[11px] text-muted-foreground">PNG, JPG hoặc WEBP (tối đa 5MB)</p>
                      </div>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Field label="Họ và tên chủ trọ *" error={errors.fullName}>
                        <Input
                          value={fullName}
                          onChange={(e) => {
                            setFullName(e.target.value);
                            if (errors.fullName) setErrors(prev => ({ ...prev, fullName: "" }));
                          }}
                          placeholder="Ví dụ: Phạm Văn Minh"
                        />
                      </Field>
                      <Field label="Số điện thoại *" error={errors.phoneNumber}>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                          <Input
                            value={phoneNumber}
                            onChange={(e) => {
                              setPhoneNumber(e.target.value);
                              if (errors.phoneNumber) setErrors(prev => ({ ...prev, phoneNumber: "" }));
                            }}
                            placeholder="Ví dụ: 0912345678"
                            className="pl-10"
                          />
                        </div>
                      </Field>
                      <Field label="Địa chỉ liên hệ chính *" error={errors.address} className="sm:col-span-2">
                        <Input
                          value={address}
                          onChange={(e) => {
                            setAddress(e.target.value);
                            if (errors.address) setErrors(prev => ({ ...prev, address: "" }));
                          }}
                          placeholder="Ví dụ: 123 Tô Hiến Thành, Phường 13, Quận 10"
                        />
                      </Field>
                    </div>
                    <Field label="Giới thiệu về bạn hoặc dãy phòng (tuỳ chọn)">
                      <Textarea
                        rows={3}
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        placeholder="Ví dụ: Tôi cho thuê phòng trọ khu vực Quận 10, phòng sạch sẽ, an ninh, camera 24/7..."
                      />
                    </Field>
                  </div>
                )}

                {/* STEP 1: Room Info */}
                {step === 1 && (
                  <div className="space-y-5">
                    <Header title="Quy mô phòng trọ" sub="Thông tin về số lượng và khu vực phòng cho thuê của bạn" />
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Field label="Số lượng phòng hiện có">
                        <Select value={roomCountRange} onValueChange={setRoomCountRange}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="0">Chưa có phòng (chuẩn bị mở)</SelectItem>
                            <SelectItem value="1-5">1 – 5 phòng</SelectItem>
                            <SelectItem value="6-10">6 – 10 phòng</SelectItem>
                            <SelectItem value="10+">Trên 10 phòng</SelectItem>
                          </SelectContent>
                        </Select>
                      </Field>
                      <Field label="Loại phòng chủ yếu">
                        <Select value={primaryRoomType} onValueChange={setPrimaryRoomType}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {roomTypes.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </Field>
                    </div>
                    <Field label="Khu vực phòng trọ hoạt động chính *" error={errors.districts}>
                      <div className="flex flex-wrap gap-2">
                        {districts.map((d) => {
                          const on = primaryDistricts.includes(d);
                          return (
                            <button
                              key={d}
                              type="button"
                              onClick={() => toggleDistrict(d)}
                              className={cn(
                                "rounded-full border px-3 py-1.5 text-sm transition",
                                on ? "border-primary bg-mint text-primary font-medium shadow-sm" : "border-border text-muted-foreground hover:border-primary/40",
                              )}
                            >
                              {d}
                            </button>
                          );
                        })}
                      </div>
                      <p className={cn("text-xs mt-1", primaryDistricts.length > 0 ? "text-emerald-600 font-medium" : "text-amber-600")}>
                        Đã chọn {primaryDistricts.length} khu vực hoạt động
                      </p>
                    </Field>
                  </div>
                )}

                {/* STEP 2: CCCD Verification */}
                {step === 2 && (
                  <div className="space-y-5">
                    <Header title="Xác minh danh tính chủ trọ" sub="Hồ sơ được xác minh sẽ nhận huy hiệu uy tín và tăng tỷ lệ khách thuê tin cậy" />
                    <div className="rounded-xl bg-mint/50 p-4">
                      <ul className="space-y-2 text-sm">
                        {[
                          "Huy hiệu Chủ trọ đã xác minh tăng uy tín 100%",
                          "Phòng trọ được ưu tiên hiển thị trên danh mục tìm kiếm",
                          "Tăng gấp đôi số lượt khách thuê gửi yêu cầu xem phòng",
                        ].map((b) => (
                          <li key={b} className="flex items-center gap-2"><Check className="size-4 text-primary" /> {b}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <CccdUploadBox
                        label="Mặt trước CCCD"
                        file={frontCccd}
                        preview={frontPreview}
                        onSelect={handleFrontSelect}
                        onRemove={() => {
                          setFrontCccd(null);
                          setFrontPreview(null);
                        }}
                      />
                      <CccdUploadBox
                        label="Mặt sau CCCD"
                        file={backCccd}
                        preview={backPreview}
                        onSelect={handleBackSelect}
                        onRemove={() => {
                          setBackCccd(null);
                          setBackPreview(null);
                        }}
                      />
                    </div>
                    <Button
                      variant="ghost"
                      type="button"
                      className="w-full text-muted-foreground hover:text-foreground"
                      onClick={() => {
                        setIsKycSkipped(true);
                        setStepState([3, 1]);
                      }}
                    >
                      Bỏ qua bước này (Tôi sẽ xác minh sau)
                    </Button>
                  </div>
                )}

                {/* STEP 3: Complete */}
                {step === 3 && (
                  <div className="space-y-5 text-center">
                    <div className="mx-auto grid size-16 place-items-center rounded-full bg-mint text-primary">
                      <PartyPopper className="size-8" />
                    </div>
                    <Header title="Hồ sơ chủ trọ hoàn tất!" sub="Bạn đã sẵn sàng đăng tin phòng và quản lý cho thuê an toàn" center />
                    
                    <div className="mx-auto flex max-w-sm items-center gap-3 rounded-xl bg-secondary/50 p-4 text-left">
                      <Avatar className="size-12 ring-2 ring-primary/20 shrink-0">
                        {avatarUrl ? (
                          <AvatarImage src={avatarUrl} alt="avatar" className="object-cover" />
                        ) : null}
                        <AvatarFallback className="bg-emerald-100 text-emerald-800 font-bold text-sm">
                          {getInitials(fullName || user?.fullName || "CT")}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-sm font-semibold truncate">{fullName || user?.fullName || "Chủ trọ mới"}</p>
                          {frontPreview && backPreview && !isKycSkipped ? (
                            <span title="Đã gửi ảnh CCCD"><ShieldCheck className="size-4 text-primary shrink-0" /></span>
                          ) : (
                            <span className="rounded-md bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-700 shrink-0">
                              Chưa KYC
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">
                          Chủ trọ • {primaryDistricts.length > 0 ? primaryDistricts.join(", ") : address || "TP.HCM"}
                        </p>
                      </div>
                    </div>

                    {isKycSkipped || (!frontPreview || !backPreview) ? (
                      <div className="mx-auto max-w-sm rounded-xl bg-amber-500/10 p-3.5 text-xs text-amber-800 border border-amber-200 text-left">
                        💡 <strong>Lưu ý:</strong> Bạn đã chọn bỏ qua bước CCCD. Bạn vẫn có thể đăng phòng bình thường và cập nhật CCCD sau trong <strong>Cài đặt</strong> để nhận huy hiệu xác minh.
                      </div>
                    ) : (
                      <div className="mx-auto max-w-sm rounded-xl bg-mint/50 p-3.5 text-xs text-emerald-800 border border-emerald-200 text-left">
                        ✓ <strong>Đã nhận ảnh CCCD:</strong> Hình ảnh thẻ CCCD đã sẵn sàng để gửi tới ban quản trị kiểm duyệt cấp tích xanh.
                      </div>
                    )}

                    <div className="mx-auto max-w-sm rounded-xl bg-mint/50 p-4 text-left">
                      <p className="text-sm font-semibold text-emerald-deep mb-2">Bước tiếp theo:</p>
                      <ul className="space-y-1.5 text-xs text-muted-foreground">
                        <li className="flex items-center gap-2"><MapPin className="size-3.5 text-primary shrink-0" /> Đăng phòng trọ đầu tiên của bạn</li>
                        <li className="flex items-center gap-2"><ShieldCheck className="size-3.5 text-primary shrink-0" /> Hoàn tất xác minh CCCD (nếu chưa)</li>
                        <li className="flex items-center gap-2"><Building2 className="size-3.5 text-primary shrink-0" /> Quản lý khách thuê và hợp đồng tiện lợi</li>
                      </ul>
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

            {/* Navigation buttons */}
            <div className="mt-8 flex items-center justify-between border-t border-border/60 pt-6">
              <Button variant="ghost" onClick={back} className="gap-1"><ArrowLeft className="size-4" /> Quay lại</Button>
              <Button onClick={next} disabled={isSubmitting} className="gap-1">
                {isSubmitting ? (
                  <>
                    <Loader2 className="size-4 animate-spin" /> Đang thiết lập...
                  </>
                ) : step === steps.length - 1 ? (
                  <>
                    Vào bảng quản lý <Sparkles className="size-4" />
                  </>
                ) : (
                  <>
                    Tiếp tục <ArrowRight className="size-4" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}

function Header({ title, sub, center }: { title: string; sub: string; center?: boolean }) {
  return (
    <div className={center ? "text-center" : ""}>
      <h1 className="brand text-2xl">{title}</h1>
      <p className="mt-1 text-sm text-muted-foreground">{sub}</p>
    </div>
  );
}

function Field({
  label,
  error,
  children,
  className,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col space-y-1.5", className)}>
      <Label className="text-sm font-medium text-foreground min-h-[20px] flex items-center">
        {label}
      </Label>
      <div
        className={cn(
          "relative transition-all",
          error &&
            "[&_input]:border-destructive [&_input]:ring-1 [&_input]:ring-destructive/30 [&_button]:border-destructive [&_button]:ring-1 [&_button]:ring-destructive/30"
        )}
      >
        {children}
      </div>
      {error && (
        <p className="text-xs text-destructive font-medium flex items-center gap-1 mt-0.5 leading-tight animate-fade-in">
          <AlertCircle className="size-3.5 shrink-0" />
          <span>{error}</span>
        </p>
      )}
    </div>
  );
}

function CccdUploadBox({
  label,
  file,
  preview,
  onSelect,
  onRemove,
}: {
  label: string;
  file: File | null;
  preview: string | null;
  onSelect: (f: File) => void;
  onRemove: () => void;
}) {
  return (
    <div className="relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-primary/40 bg-secondary/20 p-4 transition-all hover:border-primary">
      {preview ? (
        <div className="relative w-full aspect-[3/2] overflow-hidden rounded-lg bg-black/5">
          <img src={preview} alt={label} className="size-full object-cover" />
          <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={onRemove}
              className="rounded-full bg-red-600 p-2 text-white shadow hover:bg-red-700 transition"
              title="Xóa và chọn lại ảnh"
            >
              <X className="size-4" />
            </button>
          </div>
          <span className="absolute bottom-2 left-2 rounded-md bg-black/60 px-2 py-0.5 text-[11px] text-white backdrop-blur">
            {file?.name || label}
          </span>
        </div>
      ) : (
        <label
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            if (e.dataTransfer.files?.[0]) onSelect(e.dataTransfer.files[0]);
          }}
          className="flex aspect-[3/2] w-full cursor-pointer flex-col items-center justify-center text-center"
        >
          <Upload className="mx-auto size-7 text-primary" />
          <p className="mt-2 text-sm font-medium text-foreground">{label}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">Kéo thả hoặc nhấn chọn ảnh</p>
          <span className="mt-2 inline-flex items-center rounded-full bg-mint px-2.5 py-0.5 text-[11px] font-medium text-emerald-brand">
            Tải tệp JPG, PNG
          </span>
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              if (e.target.files?.[0]) onSelect(e.target.files[0]);
            }}
          />
        </label>
      )}
    </div>
  );
}
