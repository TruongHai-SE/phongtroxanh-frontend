import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router";
import {
  ArrowLeft, ArrowRight, Check, Upload, ShieldCheck, Camera, PartyPopper, Sparkles, Loader2,
  LogOut, X, AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { interestOptions, districts, roomTypes } from "@/lib/constants";
import { ImageWithFallback } from "@/components/shared/ImageWithFallback";
import { cn, getInitials } from "@/lib/utils";
import { PageTransition } from "@/components/layouts/PageTransition";
import { AnimatePresence, motion } from "motion/react";
import { useAuth } from "@/app/context/AuthContext";
import { authApi } from "@/features/auth/api/authApi";
import { accountApi } from "@/features/account/api/accountApi";
import { toast } from "sonner";

const steps = ["Hồ sơ", "Sở thích", "Lối sống", "Nhu cầu ở", "Xác minh", "Hoàn tất"];

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

export default function Onboarding() {
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
  const [birthDate, setBirthDate] = useState("");
  const [gender, setGender] = useState<string>("female");
  const [schoolOrCompany, setSchoolOrCompany] = useState("");

  // Tự động điền thông tin người dùng khi đã load xong từ hệ thống
  useEffect(() => {
    if (user) {
      if (!fullName && user.fullName) setFullName(user.fullName);
      if (!avatarUrl && user.avatarUrl) setAvatarUrl(user.avatarUrl);
    }
  }, [user]);

  const [interests, setInterests] = useState<string[]>([]);

  const [earlySleeper, setEarlySleeper] = useState(true);
  const [isNeat, setIsNeat] = useState(true);
  const [allowGuests, setAllowGuests] = useState(false);
  const [nonSmoking, setNonSmoking] = useState(true);
  const [noiseTolerance, setNoiseTolerance] = useState(40);

  const [budget, setBudget] = useState([1500000, 3500000]);
  const [selDistricts, setSelDistricts] = useState<string[]>([]);
  const [preferredRoomType, setPreferredRoomType] = useState<string>(roomTypes[1] || "PHONG_KHEP_KIN");
  const [proximitySchool, setProximitySchool] = useState(true);
  const [proximityWork, setProximityWork] = useState(true);
  const [proximityMarket, setProximityMarket] = useState(false);
  const [proximityBus, setProximityBus] = useState(true);
  const [isPublic, setIsPublic] = useState(true);

  // CCCD state
  const [frontCccd, setFrontCccd] = useState<File | null>(null);
  const [frontPreview, setFrontPreview] = useState<string | null>(null);
  const [backCccd, setBackCccd] = useState<File | null>(null);
  const [backPreview, setBackPreview] = useState<string | null>(null);
  const [isKycSkipped, setIsKycSkipped] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const toggle = (arr: string[], set: (v: string[]) => void, v: string) =>
    set(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);

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
      console.error("Lỗi tải ảnh đại diện:", err);
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
        newErrors.fullName = "Vui lòng nhập họ và tên";
      } else if (/^\d+$/.test(trimmedName)) {
        newErrors.fullName = "Họ và tên không thể chỉ toàn chữ số";
      }

      if (!birthDate) {
        newErrors.birthDate = "Vui lòng chọn ngày sinh";
      } else {
        const birth = new Date(birthDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (birth > today) {
          newErrors.birthDate = "Ngày sinh phải là ngày trong quá khứ";
        } else {
          let age = today.getFullYear() - birth.getFullYear();
          const m = today.getMonth() - birth.getMonth();
          if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
            age--;
          }
          if (age < 15 || age > 100) {
            newErrors.birthDate = "Độ tuổi người thuê trọ hợp lệ từ 15 đến 100 tuổi";
          }
        }
      }

      const trimmedSchool = schoolOrCompany.trim();
      if (!trimmedSchool) {
        newErrors.schoolOrCompany = "Vui lòng nhập trường học hoặc nơi làm việc";
      } else if (/^\d+$/.test(trimmedSchool)) {
        newErrors.schoolOrCompany = "Tên trường học hoặc nơi làm việc không thể chỉ toàn chữ số";
      }
    } else if (currentStep === 1) {
      if (interests.length < 3) {
        newErrors.interests = `Vui lòng chọn thêm ít nhất ${3 - interests.length} sở thích (tối thiểu 3 sở thích)`;
      }
    } else if (currentStep === 3) {
      if (selDistricts.length < 1) {
        newErrors.districts = "Vui lòng chọn ít nhất 1 khu vực mong muốn";
      }
      if (budget[0] > budget[1]) {
        newErrors.budget = "Ngân sách tối thiểu không thể lớn hơn ngân sách tối đa";
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
      await authApi.tenantOnboarding({
        fullName: fullName.trim(),
        schoolOrCompany: schoolOrCompany.trim(),
        birthDate,
        gender: gender.toUpperCase() as any,
        interests,
        earlySleeper,
        isNeat,
        allowGuests,
        nonSmoking,
        noiseTolerance,
        budgetMin: budget[0],
        budgetMax: budget[1],
        preferredDistricts: selDistricts,
        preferredRoomType,
        proximitySchool,
        proximityWork,
        proximityMarket,
        proximityBus,
        isPublic,
      });
      setOnboarded(true);
      await refreshProfile();
      toast.success("Khảo sát và hoàn tất hồ sơ thành công! Bắt đầu khám phá ngay.");
      navigate("/discover");
    } catch (err: any) {
      console.error("Onboarding error:", err);
      toast.error(err.message || "Không thể lưu thông tin hồ sơ, vui lòng kiểm tra lại");
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
      <div className="min-h-screen bg-gradient-to-b from-mint/40 to-background flex flex-col justify-center py-4 px-4 sm:py-6">
        <div className="mx-auto w-full max-w-3xl">
          {/* Top Bar: Emergency Escape & Logout */}
          <div className="mb-3 flex items-center justify-between">
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
              className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white/80 px-2.5 py-0.5 text-xs font-medium text-slate-600 shadow-xs transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
              title="Đăng xuất khỏi tài khoản hiện tại"
            >
              <LogOut className="size-3" />
              <span>Đổi tài khoản / Đăng xuất</span>
            </button>
          </div>

          {/* Stepper */}
          <div className="mb-4">
            <div className="flex items-center justify-between text-xs">
              {steps.map((s, i) => (
                <span key={s} className={cn("flex items-center gap-1.5", i <= step ? "text-primary font-medium" : "text-muted-foreground")}>
                  <span className={cn("grid size-5 place-items-center rounded-full text-[10px]", i < step ? "bg-primary text-primary-foreground" : i === step ? "bg-mint ring-2 ring-primary text-primary font-bold" : "bg-muted")}>
                    {i < step ? <Check className="size-2.5" strokeWidth={3} /> : i + 1}
                  </span>
                  <span className="hidden sm:inline">{s}</span>
                </span>
              ))}
            </div>
            <Progress value={((step + 1) / steps.length) * 100} className="mt-2 h-1" />
          </div>

          <div className="rounded-2xl bg-card p-5 sm:p-6 shadow-sm ring-1 ring-border overflow-hidden">
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
                {/* STEP 0: BASIC PROFILE */}
                {step === 0 && (
                  <div className="space-y-5">
                    <Header title="Hồ sơ cơ bản" sub="Cho mọi người biết một chút về bạn (bắt buộc)" />
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
                      <Field label="Họ và tên *" error={errors.fullName}>
                        <Input
                          value={fullName}
                          onChange={(e) => {
                            setFullName(e.target.value);
                            if (errors.fullName) setErrors(prev => ({ ...prev, fullName: "" }));
                          }}
                          placeholder="Ví dụ: Nguyễn Văn An"
                        />
                      </Field>
                      <Field label="Ngày sinh *" error={errors.birthDate}>
                        <DatePicker
                          value={birthDate}
                          onChange={(val) => {
                            setBirthDate(val);
                            if (errors.birthDate) setErrors(prev => ({ ...prev, birthDate: "" }));
                          }}
                          maxDate={new Date()}
                          isBirthDate
                          placeholder="dd/mm/yyyy (hoặc bấm lịch)"
                        />
                      </Field>
                      <Field label="Giới tính *">
                        <Select value={gender} onValueChange={setGender}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="female">Nữ</SelectItem>
                            <SelectItem value="male">Nam</SelectItem>
                            <SelectItem value="other">Khác</SelectItem>
                          </SelectContent>
                        </Select>
                      </Field>
                      <Field label="Trường / Nơi làm việc *" error={errors.schoolOrCompany}>
                        <Input
                          value={schoolOrCompany}
                          onChange={(e) => {
                            setSchoolOrCompany(e.target.value);
                            if (errors.schoolOrCompany) setErrors(prev => ({ ...prev, schoolOrCompany: "" }));
                          }}
                          placeholder="Ví dụ: ĐH Kinh tế TP.HCM hoặc Công ty VNG"
                        />
                      </Field>
                    </div>
                  </div>
                )}

                {/* STEP 1: INTERESTS */}
                {step === 1 && (
                  <div className="space-y-5">
                    <Header title="Sở thích của bạn" sub="Chọn ít nhất 3 sở thích để ghép bạn ở hợp gu" />
                    <div className="flex flex-wrap gap-2.5">
                      {interestOptions.map((opt) => {
                        const on = interests.includes(opt);
                        return (
                          <button
                            key={opt}
                            type="button"
                            onClick={() => {
                              toggle(interests, setInterests, opt);
                              if (errors.interests) setErrors(prev => ({ ...prev, interests: "" }));
                            }}
                            className={cn(
                              "rounded-full border px-4 py-2 text-sm transition",
                              on ? "border-primary bg-mint text-primary font-medium shadow-sm" : "border-border text-muted-foreground hover:border-primary/40",
                            )}
                          >
                            {opt}
                          </button>
                        );
                      })}
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <p className={cn("text-xs font-medium", interests.length >= 3 ? "text-emerald-600" : "text-amber-600")}>
                        Đã chọn {interests.length} / tối thiểu 3 sở thích
                      </p>
                      {errors.interests && (
                        <p className="text-xs text-red-500 font-medium flex items-center gap-1">
                          <AlertCircle className="size-3.5" /> {errors.interests}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* STEP 2: LIFESTYLE */}
                {step === 2 && (
                  <div className="space-y-3.5">
                    <Header title="Lối sống & nhịp sinh hoạt" sub="Chọn thói quen thực tế của bạn để hệ thống gợi ý bạn cùng phòng phù hợp" />
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3">
                      {/* 1. Giờ đi ngủ */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-foreground">Giờ giấc sinh hoạt</label>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => setEarlySleeper(true)}
                            className={cn(
                              "flex flex-col items-start px-3 py-2 rounded-xl border text-left transition-all cursor-pointer",
                              earlySleeper 
                                ? "border-primary bg-primary/[0.04] ring-1 ring-primary/20 shadow-xs" 
                                : "border-border/80 bg-card hover:border-border hover:bg-muted/30"
                            )}
                          >
                            <div className="flex items-center justify-between w-full">
                              <span className="text-xs font-semibold text-foreground">Ngủ sớm</span>
                              <div className={cn(
                                "size-3.5 rounded-full border flex items-center justify-center transition-all",
                                earlySleeper ? "border-primary bg-primary" : "border-muted-foreground/30"
                              )}>
                                {earlySleeper && <div className="size-1 rounded-full bg-white" />}
                              </div>
                            </div>
                            <span className="text-[11px] text-muted-foreground mt-0.5">Trước 23:00</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setEarlySleeper(false)}
                            className={cn(
                              "flex flex-col items-start px-3 py-2 rounded-xl border text-left transition-all cursor-pointer",
                              !earlySleeper 
                                ? "border-primary bg-primary/[0.04] ring-1 ring-primary/20 shadow-xs" 
                                : "border-border/80 bg-card hover:border-border hover:bg-muted/30"
                            )}
                          >
                            <div className="flex items-center justify-between w-full">
                              <span className="text-xs font-semibold text-foreground">Thức khuya</span>
                              <div className={cn(
                                "size-3.5 rounded-full border flex items-center justify-center transition-all",
                                !earlySleeper ? "border-primary bg-primary" : "border-muted-foreground/30"
                              )}>
                                {!earlySleeper && <div className="size-1 rounded-full bg-white" />}
                              </div>
                            </div>
                            <span className="text-[11px] text-muted-foreground mt-0.5">Sau 23:00</span>
                          </button>
                        </div>
                      </div>

                      {/* 2. Mức độ gọn gàng */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-foreground">Thói quen gọn gàng</label>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => setIsNeat(true)}
                            className={cn(
                              "flex flex-col items-start px-3 py-2 rounded-xl border text-left transition-all cursor-pointer",
                              isNeat 
                                ? "border-primary bg-primary/[0.04] ring-1 ring-primary/20 shadow-xs" 
                                : "border-border/80 bg-card hover:border-border hover:bg-muted/30"
                            )}
                          >
                            <div className="flex items-center justify-between w-full">
                              <span className="text-xs font-semibold text-foreground">Rất ngăn nắp</span>
                              <div className={cn(
                                "size-3.5 rounded-full border flex items-center justify-center transition-all",
                                isNeat ? "border-primary bg-primary" : "border-muted-foreground/30"
                              )}>
                                {isNeat && <div className="size-1 rounded-full bg-white" />}
                              </div>
                            </div>
                            <span className="text-[11px] text-muted-foreground mt-0.5">Dọn dẹp ngay</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setIsNeat(false)}
                            className={cn(
                              "flex flex-col items-start px-3 py-2 rounded-xl border text-left transition-all cursor-pointer",
                              !isNeat 
                                ? "border-primary bg-primary/[0.04] ring-1 ring-primary/20 shadow-xs" 
                                : "border-border/80 bg-card hover:border-border hover:bg-muted/30"
                            )}
                          >
                            <div className="flex items-center justify-between w-full">
                              <span className="text-xs font-semibold text-foreground">Thoải mái</span>
                              <div className={cn(
                                "size-3.5 rounded-full border flex items-center justify-center transition-all",
                                !isNeat ? "border-primary bg-primary" : "border-muted-foreground/30"
                              )}>
                                {!isNeat && <div className="size-1 rounded-full bg-white" />}
                              </div>
                            </div>
                            <span className="text-[11px] text-muted-foreground mt-0.5">Dọn định kỳ</span>
                          </button>
                        </div>
                      </div>

                      {/* 3. Dẫn bạn về phòng */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-foreground">Mời bạn bè đến phòng</label>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => setAllowGuests(true)}
                            className={cn(
                              "flex flex-col items-start px-3 py-2 rounded-xl border text-left transition-all cursor-pointer",
                              allowGuests 
                                ? "border-primary bg-primary/[0.04] ring-1 ring-primary/20 shadow-xs" 
                                : "border-border/80 bg-card hover:border-border hover:bg-muted/30"
                            )}
                          >
                            <div className="flex items-center justify-between w-full">
                              <span className="text-xs font-semibold text-foreground">Thoải mái đón bạn</span>
                              <div className={cn(
                                "size-3.5 rounded-full border flex items-center justify-center transition-all",
                                allowGuests ? "border-primary bg-primary" : "border-muted-foreground/30"
                              )}>
                                {allowGuests && <div className="size-1 rounded-full bg-white" />}
                              </div>
                            </div>
                            <span className="text-[11px] text-muted-foreground mt-0.5">Được phép mời bạn</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setAllowGuests(false)}
                            className={cn(
                              "flex flex-col items-start px-3 py-2 rounded-xl border text-left transition-all cursor-pointer",
                              !allowGuests 
                                ? "border-primary bg-primary/[0.04] ring-1 ring-primary/20 shadow-xs" 
                                : "border-border/80 bg-card hover:border-border hover:bg-muted/30"
                            )}
                          >
                            <div className="flex items-center justify-between w-full">
                              <span className="text-xs font-semibold text-foreground">Hạn chế</span>
                              <div className={cn(
                                "size-3.5 rounded-full border flex items-center justify-center transition-all",
                                !allowGuests ? "border-primary bg-primary" : "border-muted-foreground/30"
                              )}>
                                {!allowGuests && <div className="size-1 rounded-full bg-white" />}
                              </div>
                            </div>
                            <span className="text-[11px] text-muted-foreground mt-0.5">Ưu tiên riêng tư</span>
                          </button>
                        </div>
                      </div>

                      {/* 4. Hút thuốc */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-foreground">Môi trường sống & khói thuốc</label>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => setNonSmoking(true)}
                            className={cn(
                              "flex flex-col items-start px-3 py-2 rounded-xl border text-left transition-all cursor-pointer",
                              nonSmoking 
                                ? "border-primary bg-primary/[0.04] ring-1 ring-primary/20 shadow-xs" 
                                : "border-border/80 bg-card hover:border-border hover:bg-muted/30"
                            )}
                          >
                            <div className="flex items-center justify-between w-full">
                              <span className="text-xs font-semibold text-foreground">Không hút thuốc</span>
                              <div className={cn(
                                "size-3.5 rounded-full border flex items-center justify-center transition-all",
                                nonSmoking ? "border-primary bg-primary" : "border-muted-foreground/30"
                              )}>
                                {nonSmoking && <div className="size-1 rounded-full bg-white" />}
                              </div>
                            </div>
                            <span className="text-[11px] text-muted-foreground mt-0.5">Hoàn toàn không khói</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setNonSmoking(false)}
                            className={cn(
                              "flex flex-col items-start px-3 py-2 rounded-xl border text-left transition-all cursor-pointer",
                              !nonSmoking 
                                ? "border-primary bg-primary/[0.04] ring-1 ring-primary/20 shadow-xs" 
                                : "border-border/80 bg-card hover:border-border hover:bg-muted/30"
                            )}
                          >
                            <div className="flex items-center justify-between w-full">
                              <span className="text-xs font-semibold text-foreground">Có thể hút thuốc</span>
                              <div className={cn(
                                "size-3.5 rounded-full border flex items-center justify-center transition-all",
                                !nonSmoking ? "border-primary bg-primary" : "border-muted-foreground/30"
                              )}>
                                {!nonSmoking && <div className="size-1 rounded-full bg-white" />}
                              </div>
                            </div>
                            <span className="text-[11px] text-muted-foreground mt-0.5">Chấp nhận ban công</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* 5. Mức độ chịu tiếng ồn */}
                    <div className="space-y-2 rounded-xl border border-border/80 bg-card p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs font-semibold text-foreground">Khả năng thích ứng tiếng ồn</p>
                          <p className="text-[11px] text-muted-foreground">Mức độ nhạy cảm của bạn với âm thanh sinh hoạt xung quanh</p>
                        </div>
                        <span className="text-xs font-semibold text-primary px-2.5 py-0.5 rounded-md bg-primary/10">
                          {noiseTolerance <= 30 ? "Cần yên tĩnh" : noiseTolerance <= 70 ? "Mức độ vừa phải" : "Thoải mái, không ngại ồn"}
                        </span>
                      </div>

                      <Slider 
                        value={[noiseTolerance]} 
                        onValueChange={(val) => setNoiseTolerance(val[0])} 
                        max={100} 
                        step={1} 
                        className="py-1" 
                      />

                      <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                        <span>Rất nhạy cảm</span>
                        <span>Vừa phải</span>
                        <span>Không bận tâm</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 3: ROOM PREFERENCES */}
                {step === 3 && (
                  <div className="space-y-6">
                    <Header title="Nhu cầu ở (bắt buộc)" sub="Bộ lọc này cần hoàn tất trước khi vuốt phòng" />

                    <Field label="Mục đích tìm kiếm chính">
                      <div className="grid gap-2.5 sm:grid-cols-2">
                        <button
                          type="button"
                          onClick={() => setIsPublic(true)}
                          className={cn(
                            "flex flex-col items-start p-3 rounded-xl border text-left transition-all cursor-pointer",
                            isPublic
                              ? "border-primary bg-primary/[0.04] ring-1 ring-primary/20 shadow-xs"
                              : "border-border/80 bg-card hover:border-border hover:bg-muted/30"
                          )}
                        >
                          <div className="flex items-center justify-between w-full">
                            <span className="text-xs font-semibold text-foreground">Tìm phòng & Ở ghép</span>
                            <div className={cn(
                              "size-4 rounded-full border flex items-center justify-center transition-all",
                              isPublic ? "border-primary bg-primary" : "border-muted-foreground/30"
                            )}>
                              {isPublic && <div className="size-1.5 rounded-full bg-white" />}
                            </div>
                          </div>
                          <span className="text-[11px] text-muted-foreground mt-1">
                            Công khai hồ sơ tìm bạn để ghép đôi với người có cùng thói quen
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setIsPublic(false)}
                          className={cn(
                            "flex flex-col items-start p-3 rounded-xl border text-left transition-all cursor-pointer",
                            !isPublic
                              ? "border-primary bg-primary/[0.04] ring-1 ring-primary/20 shadow-xs"
                              : "border-border/80 bg-card hover:border-border hover:bg-muted/30"
                          )}
                        >
                          <div className="flex items-center justify-between w-full">
                            <span className="text-xs font-semibold text-foreground">Chỉ tìm phòng ở riêng</span>
                            <div className={cn(
                              "size-4 rounded-full border flex items-center justify-center transition-all",
                              !isPublic ? "border-primary bg-primary" : "border-muted-foreground/30"
                            )}>
                              {!isPublic && <div className="size-1.5 rounded-full bg-white" />}
                            </div>
                          </div>
                          <span className="text-[11px] text-muted-foreground mt-1">
                            Ở một mình, ẩn hồ sơ khỏi mục tìm bạn cùng phòng
                          </span>
                        </button>
                      </div>
                    </Field>

                    <Field label={`Ngân sách dự kiến: ${(budget[0] / 1e6).toFixed(1)} - ${(budget[1] / 1e6).toFixed(1)} triệu/tháng`}>
                      <Slider value={budget} onValueChange={setBudget} min={500000} max={8000000} step={100000} className="py-2" />
                    </Field>
                    <Field label="Khu vực mong muốn *" error={errors.districts}>
                      <div className="flex flex-wrap gap-2">
                        {districts.map((d) => {
                          const on = selDistricts.includes(d);
                          return (
                            <button
                              key={d}
                              type="button"
                              onClick={() => {
                                toggle(selDistricts, setSelDistricts, d);
                                if (errors.districts) setErrors(prev => ({ ...prev, districts: "" }));
                              }}
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
                      {selDistricts.length === 0 && (
                        <p className="text-xs text-amber-600 mt-1">Vui lòng chọn ít nhất 1 quận/huyện bạn muốn ở</p>
                      )}
                    </Field>
                    <Field label="Loại phòng ưu tiên">
                      <Select value={preferredRoomType} onValueChange={setPreferredRoomType}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {roomTypes.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </Field>
                    <Field label="Ưu tiên vị trí gần">
                      <div className="grid gap-2 sm:grid-cols-2">
                        <label className="flex items-center gap-2 rounded-lg bg-secondary/50 px-3 py-2 text-sm cursor-pointer">
                          <input type="checkbox" checked={proximitySchool} onChange={(e) => setProximitySchool(e.target.checked)} className="accent-primary" />
                          Gần trường học
                        </label>
                        <label className="flex items-center gap-2 rounded-lg bg-secondary/50 px-3 py-2 text-sm cursor-pointer">
                          <input type="checkbox" checked={proximityWork} onChange={(e) => setProximityWork(e.target.checked)} className="accent-primary" />
                          Gần chỗ làm
                        </label>
                        <label className="flex items-center gap-2 rounded-lg bg-secondary/50 px-3 py-2 text-sm cursor-pointer">
                          <input type="checkbox" checked={proximityMarket} onChange={(e) => setProximityMarket(e.target.checked)} className="accent-primary" />
                          Gần chợ / siêu thị
                        </label>
                        <label className="flex items-center gap-2 rounded-lg bg-secondary/50 px-3 py-2 text-sm cursor-pointer">
                          <input type="checkbox" checked={proximityBus} onChange={(e) => setProximityBus(e.target.checked)} className="accent-primary" />
                          Gần trạm xe buýt
                        </label>
                      </div>
                    </Field>
                  </div>
                )}

                {/* STEP 4: REAL CCCD UPLOAD & VERIFICATION */}
                {step === 4 && (
                  <div className="space-y-5">
                    <Header title="Xác minh danh tính (CCCD)" sub="Tải ảnh CCCD thật để nhận huy hiệu đã xác minh và tăng điểm TrustScore" />
                    <div className="rounded-xl bg-mint/50 p-4">
                      <ul className="space-y-2 text-sm">
                        {["Huy hiệu tích xanh đã xác minh trên hồ sơ", "Được ưu tiên hiển thị khi tìm phòng và ghép bạn", "Bảo vệ thông tin an toàn, mã hóa bảo mật"].map((b) => (
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
                        setStepState([5, 1]);
                      }}
                    >
                      Bỏ qua bước này (Tôi sẽ xác minh sau)
                    </Button>
                  </div>
                )}

                {/* STEP 5: COMPLETION & SUMMARY */}
                {step === 5 && (
                  <div className="space-y-5 text-center">
                    <div className="mx-auto grid size-16 place-items-center rounded-full bg-mint text-primary">
                      <PartyPopper className="size-8" />
                    </div>
                    <Header title="Hồ sơ hoàn tất!" sub="Bạn đã sẵn sàng khám phá phòng trọ và tìm bạn ở ghép ưng ý" center />
                    
                    <div className="mx-auto flex max-w-sm items-center gap-3 rounded-xl bg-secondary/50 p-4 text-left">
                      <Avatar className="size-12 ring-2 ring-primary/20 shrink-0">
                        {avatarUrl ? (
                          <AvatarImage src={avatarUrl} alt="avatar" className="object-cover" />
                        ) : null}
                        <AvatarFallback className="bg-emerald-100 text-emerald-800 font-bold text-sm">
                          {getInitials(fullName || user?.fullName || "PT")}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-sm font-semibold truncate">{fullName || user?.fullName || "Thành viên mới"}</p>
                          {frontPreview && backPreview && !isKycSkipped ? (
                            <span title="Đã tải CCCD"><ShieldCheck className="size-4 text-primary shrink-0" /></span>
                          ) : (
                            <span className="rounded-md bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-700 shrink-0">
                              Chưa KYC
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {interests.length} sở thích • {selDistricts.length} khu vực ({schoolOrCompany})
                        </p>
                      </div>
                    </div>

                    {isKycSkipped || (!frontPreview || !backPreview) ? (
                      <div className="mx-auto max-w-sm rounded-xl bg-amber-500/10 p-3.5 text-xs text-amber-800 border border-amber-200 text-left">
                        💡 <strong>Lưu ý:</strong> Bạn đã chọn bỏ qua bước CCCD. Bạn có thể gửi ảnh xác minh bất cứ lúc nào trong mục <strong>Cài đặt hồ sơ</strong> để được cấp tích xanh và nâng cao điểm uy tín TrustScore.
                      </div>
                    ) : (
                      <div className="mx-auto max-w-sm rounded-xl bg-mint/50 p-3.5 text-xs text-emerald-800 border border-emerald-200 text-left">
                        ✓ <strong>Đã tiếp nhận ảnh CCCD:</strong> Hình ảnh thẻ CCCD đã sẵn sàng để gửi tới ban quản trị kiểm duyệt cấp tích xanh.
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

            <div className="mt-4 flex items-center justify-between border-t border-border/60 pt-3.5">
              <Button variant="ghost" onClick={back} className="gap-1"><ArrowLeft className="size-4" /> Quay lại</Button>
              <Button onClick={next} disabled={isSubmitting} className="gap-1">
                {isSubmitting ? (
                  <>
                    <Loader2 className="size-4 animate-spin" /> Đang lưu hồ sơ...
                  </>
                ) : step === steps.length - 1 ? (
                  <>
                    Bắt đầu khám phá <Sparkles className="size-4" />
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
      <h1 className="brand text-xl sm:text-2xl">{title}</h1>
      <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>
    </div>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col space-y-1.5">
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
