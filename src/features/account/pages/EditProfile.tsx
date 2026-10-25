import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import { Upload, Camera, ShieldCheck, Loader2, Plus, Trash2, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  interestOptions,
  districts,
  roomTypes,
  validateSchoolOrCompany,
  inferDistrictFromSchoolOrPlace,
} from "@/lib/constants";
import { SchoolOrWorkplaceInput } from "@/components/shared/SchoolOrWorkplaceInput";
import { cn, getInitials } from "@/lib/utils";
import { useAuth } from "@/app/context/AuthContext";
import { accountApi } from "../api/accountApi";

export default function EditProfile() {
  const navigate = useNavigate();
  const { user, refreshProfile } = useAuth();
  const isLandlord = user?.role === "landlord";
  const fileInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  // Form states
  const [fullName, setFullName] = useState(user?.fullName || "");
  const [birthDate, setBirthDate] = useState("2003-05-12");
  const [gender, setGender] = useState("female");
  const [schoolOrCompany, setSchoolOrCompany] = useState("");
  const [address, setAddress] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || "");
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [isUploadingGallery, setIsUploadingGallery] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [preferredRoomType, setPreferredRoomType] = useState<string>(roomTypes[1] || "Phòng khép kín");
  const [proximitySchool, setProximitySchool] = useState(true);
  const [proximityWork, setProximityWork] = useState(true);
  const [proximityMarket, setProximityMarket] = useState(false);
  const [proximityBus, setProximityBus] = useState(true);

  // Lifestyle states
  const [earlySleeper, setEarlySleeper] = useState(true);
  const [isNeat, setIsNeat] = useState(true);
  const [allowGuests, setAllowGuests] = useState(false);
  const [nonSmoking, setNonSmoking] = useState(true);
  const [noiseTolerance, setNoiseTolerance] = useState(40);

  // Preferences states
  const [interests, setInterests] = useState<string[]>(["Nấu ăn", "Đọc sách", "Du lịch"]);
  const [selDistricts, setSelDistricts] = useState<string[]>([]);
  const [detectedSchoolDistrict, setDetectedSchoolDistrict] = useState<string | null>(null);
  const [budget, setBudget] = useState([1500000, 3500000]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    accountApi.getProfile()
      .then((u) => {
        if (u) {
          if (u.fullName) setFullName(u.fullName);
          if (u.birthDate) setBirthDate(u.birthDate);
          if (u.gender) setGender(String(u.gender).toLowerCase());
          if (u.schoolOrCompany || u.school) {
            const sc = u.schoolOrCompany || u.school || "";
            setSchoolOrCompany(sc);
            const inferred = inferDistrictFromSchoolOrPlace(sc);
            if (inferred) setDetectedSchoolDistrict(inferred);
          }
          if (u.address) setAddress(u.address);
          if (u.bio !== undefined && u.bio !== null) setBio(u.bio);
          if (u.avatarUrl) setAvatarUrl(u.avatarUrl);
          if (Array.isArray(u.galleryImages)) setGalleryImages(u.galleryImages);
          if (u.kycStatus === "APPROVED" || u.isVerified) setIsVerified(true);
          if (u.interests?.length) setInterests(u.interests);
          if (u.budgetMin != null && u.budgetMax != null) setBudget([Number(u.budgetMin), Number(u.budgetMax)]);
          if (u.preferredDistricts?.length) setSelDistricts(u.preferredDistricts);
          else if (u.targetDistricts?.length) setSelDistricts(u.targetDistricts);
          if (u.preferredRoomType) setPreferredRoomType(u.preferredRoomType);
          if (typeof u.earlySleeper === "boolean") setEarlySleeper(u.earlySleeper);
          if (typeof u.isNeat === "boolean") setIsNeat(u.isNeat);
          if (typeof u.allowGuests === "boolean") setAllowGuests(u.allowGuests);
          if (typeof u.nonSmoking === "boolean") setNonSmoking(u.nonSmoking);
          if (typeof u.noiseTolerance === "number") setNoiseTolerance(u.noiseTolerance);
          if (typeof u.proximitySchool === "boolean") setProximitySchool(u.proximitySchool);
          if (typeof u.proximityWork === "boolean") setProximityWork(u.proximityWork);
          if (typeof u.proximityMarket === "boolean") setProximityMarket(u.proximityMarket);
          if (typeof u.proximityBus === "boolean") setProximityBus(u.proximityBus);
        }
      })
      .catch(() => {});

    if (!isLandlord) {
      accountApi.getPreferences()
        .then((pref) => {
          if (pref) {
            const d = pref?.data || pref;
            if (d.budgetMin != null && d.budgetMax != null) setBudget([Number(d.budgetMin), Number(d.budgetMax)]);
            if (d.preferredDistricts?.length) setSelDistricts(d.preferredDistricts);
            if (d.interests?.length) setInterests(d.interests);
            if (typeof d.earlySleeper === "boolean") setEarlySleeper(d.earlySleeper);
            if (typeof d.isNeat === "boolean") setIsNeat(d.isNeat);
            if (typeof d.allowGuests === "boolean") setAllowGuests(d.allowGuests);
            if (typeof d.nonSmoking === "boolean") setNonSmoking(d.nonSmoking);
            if (typeof d.noiseTolerance === "number") setNoiseTolerance(d.noiseTolerance);
          }
        })
        .catch(() => {});
    }
  }, [isLandlord]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
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

    const localPreview = URL.createObjectURL(file);
    setAvatarUrl(localPreview);

    try {
      const res = await accountApi.uploadAvatar(file);
      if (res?.avatarUrl) {
        setAvatarUrl(res.avatarUrl);
        await refreshProfile();
        toast.success("Đã cập nhật ảnh đại diện");
      }
    } catch (err: any) {
      console.error("Lỗi cập nhật avatar:", err);
      toast.error(err.message || "Tải ảnh đại diện thất bại, vui lòng thử lại");
    }
  };

  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    if (galleryImages.length >= 6) {
      toast.error("Bạn chỉ có thể tải lên tối đa 6 ảnh giới thiệu");
      return;
    }
    if (!file.type.startsWith("image/")) {
      toast.error("Vui lòng chọn tệp hình ảnh hợp lệ (.jpg, .png, .webp)");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Kích thước mỗi ảnh không vượt quá 5MB");
      return;
    }

    setIsUploadingGallery(true);
    try {
      const res = await accountApi.uploadGalleryImage(file);
      if (Array.isArray(res?.galleryImages)) {
        setGalleryImages(res.galleryImages);
        await refreshProfile();
        toast.success("Đã thêm ảnh vào hồ sơ của bạn");
      }
    } catch (err: any) {
      toast.error(err?.message || "Không thể tải ảnh lên, vui lòng thử lại");
    } finally {
      setIsUploadingGallery(false);
    }
  };

  const handleDeleteGalleryImage = async (imgUrl: string) => {
    try {
      const res = await accountApi.deleteGalleryImage(imgUrl);
      if (Array.isArray(res?.galleryImages)) {
        setGalleryImages(res.galleryImages);
      } else {
        setGalleryImages((prev) => prev.filter((item) => item !== imgUrl));
      }
      await refreshProfile();
      toast.success("Đã xóa ảnh khỏi hồ sơ");
    } catch (err: any) {
      toast.error(err?.message || "Không thể xóa ảnh, vui lòng thử lại");
    }
  };

  const handleSave = async () => {
    if (!fullName.trim()) {
      toast.error("Vui lòng nhập họ và tên");
      return;
    }
    if (!isLandlord && schoolOrCompany.trim()) {
      const schoolErr = validateSchoolOrCompany(schoolOrCompany);
      if (schoolErr) {
        toast.error(schoolErr);
        return;
      }
    }

    setSaving(true);
    try {
      await accountApi.updateProfile({
        fullName: fullName.trim(),
        birthDate: birthDate || undefined,
        gender: gender ? (gender.toUpperCase() as any) : undefined,
        schoolOrCompany: isLandlord ? undefined : schoolOrCompany.trim(),
        address: isLandlord ? address.trim() : undefined,
        preferredDistricts: selDistricts,
        bio: bio.trim(),
      });

      if (!isLandlord) {
        await accountApi.updatePreferences({
          budgetMin: budget[0],
          budgetMax: budget[1],
          preferredDistricts: selDistricts,
          preferredRoomType,
          interests,
          earlySleeper,
          isNeat,
          allowGuests,
          nonSmoking,
          noiseTolerance,
          proximitySchool,
          proximityWork,
          proximityMarket,
          proximityBus,
        });
      }

      await refreshProfile();
      toast.success("Đã lưu thay đổi hồ sơ");
      navigate("/profile");
    } catch (err: any) {
      toast.error(err?.message || "Không thể lưu thay đổi, vui lòng kiểm tra lại thông tin");
    } finally {
      setSaving(false);
    }
  };

  const toggle = (v: string) => setInterests((s) => (s.includes(v) ? s.filter((x) => x !== v) : [...s, v]));
  const toggleDist = (v: string) => setSelDistricts((s) => (s.includes(v) ? s.filter((x) => x !== v) : [...s, v]));

  return (
    <div className="mx-auto max-w-3xl px-6 py-8">
      <h1 className="brand text-2xl text-foreground">Chỉnh sửa hồ sơ</h1>
      <p className="text-sm text-muted-foreground">
        {isLandlord
          ? "Cập nhật thông tin liên hệ và giới thiệu khu trọ để tạo uy tín với người thuê"
          : "Cập nhật đầy đủ thông tin để tăng điểm uy tín và tìm bạn cùng phòng hợp gu hơn"}
      </p>

      <div className="mt-6 space-y-6">
        {/* AVATAR & GALLERY */}
        <Section title="Ảnh đại diện & Hình ảnh giới thiệu">
          <div className="flex items-center gap-4">
            <Avatar className="size-20 ring-2 ring-primary/20 shadow-sm">
              {avatarUrl ? <AvatarImage src={avatarUrl} className="object-cover" /> : null}
              <AvatarFallback className="bg-mint text-primary font-bold text-xl">
                {getInitials(fullName || user?.fullName) || <Camera className="size-6" />}
              </AvatarFallback>
            </Avatar>
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleAvatarUpload} />
            <div className="space-y-1">
              <Button variant="outline" size="sm" className="gap-2 cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                <Upload className="size-4" /> Đổi ảnh đại diện
              </Button>
              <p className="text-xs text-muted-foreground">Ảnh rõ mặt giúp tăng thiện cảm khi kết nối</p>
            </div>
          </div>

          <div className="pt-4 border-t border-border/60">
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                  <ImageIcon className="size-4 text-primary" />
                  Hình ảnh giới thiệu thêm ({galleryImages.length}/6)
                </p>
                <p className="text-xs text-muted-foreground">
                  {isLandlord
                    ? "Thêm ảnh không gian chung, mặt tiền hoặc khuôn viên nhà trọ của bạn"
                    : "Chia sẻ thêm ảnh cá nhân, góc học tập hoặc sở thích thường ngày để dễ kết bạn ở ghép"}
                </p>
              </div>
              <input
                type="file"
                ref={galleryInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleGalleryUpload}
              />
              {galleryImages.length < 6 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={isUploadingGallery}
                  onClick={() => galleryInputRef.current?.click()}
                  className="gap-1.5 shrink-0"
                >
                  {isUploadingGallery ? <Loader2 className="size-3.5 animate-spin" /> : <Plus className="size-3.5" />}
                  Thêm ảnh
                </Button>
              )}
            </div>

            <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-3">
              {galleryImages.map((imgUrl, idx) => (
                <div
                  key={`${imgUrl}-${idx}`}
                  className="group relative aspect-[4/3] overflow-hidden rounded-xl border border-border bg-slate-100"
                >
                  <img src={imgUrl} alt={`Ảnh giới thiệu ${idx + 1}`} className="size-full object-cover" />
                  <button
                    type="button"
                    onClick={() => handleDeleteGalleryImage(imgUrl)}
                    className="absolute right-2 top-2 rounded-full bg-black/65 p-1.5 text-white opacity-90 hover:bg-rose-600 transition"
                    title="Xóa ảnh này"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              ))}
              {galleryImages.length < 6 && (
                <button
                  type="button"
                  disabled={isUploadingGallery}
                  onClick={() => galleryInputRef.current?.click()}
                  className="flex aspect-[4/3] flex-col items-center justify-center rounded-xl border-2 border-dashed border-border/80 bg-secondary/20 text-muted-foreground transition hover:border-primary hover:text-primary cursor-pointer"
                >
                  {isUploadingGallery ? (
                    <Loader2 className="size-5 animate-spin text-primary" />
                  ) : (
                    <>
                      <Plus className="size-5" />
                      <span className="mt-1 text-xs font-medium">Tải ảnh lên</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </Section>

        {/* PERSONAL INFO */}
        <Section title={isLandlord ? "Thông tin chủ trọ" : "Thông tin cá nhân"}>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Họ và tên">
              <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Ví dụ: Nguyễn Văn An" />
            </Field>
            <Field label="Ngày sinh">
              <DatePicker value={birthDate} defaultValue={birthDate} onChange={(d) => setBirthDate(d || "")} isBirthDate maxDate={new Date()} placeholder="dd/mm/yyyy" />
            </Field>
            <Field label="Giới tính">
              <Select value={gender} onValueChange={setGender}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="female">Nữ</SelectItem>
                  <SelectItem value="male">Nam</SelectItem>
                  <SelectItem value="other">Khác</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            {isLandlord ? (
              <Field label="Địa chỉ liên hệ (+10đ uy tín)">
                <Input
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Ví dụ: 123 Tô Hiến Thành, Quận 10, TP.HCM"
                />
              </Field>
            ) : (
              <Field label="Trường học / Nơi làm việc (+10đ uy tín)">
                <SchoolOrWorkplaceInput
                  value={schoolOrCompany}
                  onChange={(val) => {
                    setSchoolOrCompany(val);
                    const inferred = inferDistrictFromSchoolOrPlace(val);
                    if (inferred) {
                      setDetectedSchoolDistrict(inferred);
                    }
                  }}
                  onDistrictDetected={(dist) => {
                    setDetectedSchoolDistrict(dist);
                    if ((proximitySchool || proximityWork) && !selDistricts.includes(dist)) {
                      setSelDistricts((prev) => [...prev, dist]);
                    }
                  }}
                />
              </Field>
            )}
          </div>
          <Field label={isLandlord ? "Giới thiệu khu trọ & nguyên tắc chung (+10đ uy tín)" : "Giới thiệu bản thân (+10đ uy tín)"}>
            <Textarea
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder={
                isLandlord
                  ? "Giới thiệu về hệ thống phòng trọ của bạn, giờ giấc, an ninh, tiện ích nổi bật..."
                  : "Chia sẻ đôi nét về tính cách, thói quen sinh hoạt hoặc mong muốn tìm bạn cùng phòng..."
              }
            />
          </Field>
        </Section>

        {isLandlord ? (
          <Section title="Khu vực cho thuê chính (+10đ uy tín)">
            <p className="text-xs text-muted-foreground">Chọn các quận/huyện nơi bạn đang có phòng cho thuê</p>
            <div className="flex flex-wrap gap-2">
              {districts.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => toggleDist(d)}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xs active:translate-y-0",
                    selDistricts.includes(d)
                      ? "border-primary bg-mint text-primary font-medium shadow-2xs"
                      : "border-border text-muted-foreground hover:border-primary/50 hover:bg-mint/40 hover:text-foreground"
                  )}
                >
                  {d}
                </button>
              ))}
            </div>
          </Section>
        ) : (
          <>
            {/* INTERESTS */}
            <Section title="Sở thích">
              <div className="flex flex-wrap gap-2">
                {interestOptions.map((o) => (
                  <button
                    key={o}
                    type="button"
                    onClick={() => toggle(o)}
                    className={cn(
                      "rounded-full border px-3 py-1.5 text-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xs active:translate-y-0",
                      interests.includes(o)
                        ? "border-primary bg-mint text-primary font-medium shadow-2xs"
                        : "border-border text-muted-foreground hover:border-primary/50 hover:bg-mint/40 hover:text-foreground"
                    )}
                  >
                    {o}
                  </button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Đã chọn {interests.length} sở thích</p>
            </Section>

            {/* LIFESTYLE */}
            <Section title="Lối sống & Giờ giấc">
              <div className="space-y-3.5">
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
                          <div className={cn("size-3.5 rounded-full border flex items-center justify-center transition-all", earlySleeper ? "border-primary bg-primary" : "border-muted-foreground/30")}>
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
                          <div className={cn("size-3.5 rounded-full border flex items-center justify-center transition-all", !earlySleeper ? "border-primary bg-primary" : "border-muted-foreground/30")}>
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
                          <div className={cn("size-3.5 rounded-full border flex items-center justify-center transition-all", isNeat ? "border-primary bg-primary" : "border-muted-foreground/30")}>
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
                          <div className={cn("size-3.5 rounded-full border flex items-center justify-center transition-all", !isNeat ? "border-primary bg-primary" : "border-muted-foreground/30")}>
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
                          <div className={cn("size-3.5 rounded-full border flex items-center justify-center transition-all", allowGuests ? "border-primary bg-primary" : "border-muted-foreground/30")}>
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
                          <div className={cn("size-3.5 rounded-full border flex items-center justify-center transition-all", !allowGuests ? "border-primary bg-primary" : "border-muted-foreground/30")}>
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
                          <div className={cn("size-3.5 rounded-full border flex items-center justify-center transition-all", nonSmoking ? "border-primary bg-primary" : "border-muted-foreground/30")}>
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
                          <div className={cn("size-3.5 rounded-full border flex items-center justify-center transition-all", !nonSmoking ? "border-primary bg-primary" : "border-muted-foreground/30")}>
                            {!nonSmoking && <div className="size-1.5 rounded-full bg-white" />}
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
            </Section>

            {/* HOUSING PREFERENCES */}
            <Section title="Nhu cầu tìm phòng (+10đ uy tín)">
              <Field label={`Ngân sách: ${(budget[0] / 1e6).toFixed(1)} - ${(budget[1] / 1e6).toFixed(1)} triệu/tháng`}>
                <Slider value={budget} onValueChange={setBudget} min={500000} max={8000000} step={100000} className="py-2" />
              </Field>
              <Field label="Khu vực mong muốn">
                <div className="flex flex-wrap gap-2">
                  {districts.map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => toggleDist(d)}
                      className={cn(
                        "rounded-full border px-3 py-1.5 text-sm transition",
                        selDistricts.includes(d)
                          ? "border-primary bg-mint text-primary font-medium"
                          : "border-border text-muted-foreground hover:border-primary/40"
                      )}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </Field>
              <Field label="Loại phòng">
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
                    <input
                      type="checkbox"
                      checked={proximitySchool}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setProximitySchool(checked);
                        const dist = detectedSchoolDistrict || inferDistrictFromSchoolOrPlace(schoolOrCompany);
                        if (checked && dist && !selDistricts.includes(dist)) {
                          setSelDistricts((prev) => [...prev, dist]);
                          toast.info(`Đã tự động thêm ${dist} (khu vực trường của bạn) vào Khu vực mong muốn`);
                        }
                      }}
                      className="accent-primary"
                    />
                    <span className="truncate">
                      Gần trường học
                      {(detectedSchoolDistrict || inferDistrictFromSchoolOrPlace(schoolOrCompany))
                        ? ` (${detectedSchoolDistrict || inferDistrictFromSchoolOrPlace(schoolOrCompany)})`
                        : ""}
                    </span>
                  </label>
                  <label className="flex items-center gap-2 rounded-lg bg-secondary/50 px-3 py-2 text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      checked={proximityWork}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setProximityWork(checked);
                        const dist = detectedSchoolDistrict || inferDistrictFromSchoolOrPlace(schoolOrCompany);
                        if (checked && dist && !selDistricts.includes(dist)) {
                          setSelDistricts((prev) => [...prev, dist]);
                          toast.info(`Đã tự động thêm ${dist} (khu vực nơi làm việc) vào Khu vực mong muốn`);
                        }
                      }}
                      className="accent-primary"
                    />
                    <span className="truncate">
                      Gần chỗ làm
                      {(detectedSchoolDistrict || inferDistrictFromSchoolOrPlace(schoolOrCompany))
                        ? ` (${detectedSchoolDistrict || inferDistrictFromSchoolOrPlace(schoolOrCompany)})`
                        : ""}
                    </span>
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
                { (proximitySchool || proximityWork) && (
                  <div className="mt-2 rounded-xl border border-primary/20 bg-mint/30 p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                      <span className="font-semibold text-primary">
                        Địa điểm trường học / nơi làm việc dùng để ưu tiên vị trí:
                      </span>
                      {(detectedSchoolDistrict || inferDistrictFromSchoolOrPlace(schoolOrCompany)) && (
                        <span className="rounded-full bg-primary/15 px-2.5 py-0.5 text-[11px] font-semibold text-primary">
                          Khu vực nhận diện: {detectedSchoolDistrict || inferDistrictFromSchoolOrPlace(schoolOrCompany)}
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      {schoolOrCompany
                        ? `Đang lấy mốc từ "${schoolOrCompany}". Khi bạn chọn trường/công ty ở mục Thông tin cá nhân phía trên, hệ thống sẽ tự động thêm Quận tương ứng vào Khu vực mong muốn.`
                        : "Bạn chưa nhập Trường học / Nơi làm việc ở mục Thông tin cá nhân phía trên."}
                    </p>
                  </div>
                )}
              </Field>
            </Section>
          </>
        )}

        {/* ACCOUNT VERIFICATION STATUS */}
        <Section title="Xác thực tài khoản">
          <div className="flex items-center gap-3 rounded-xl bg-mint/50 p-4">
            <ShieldCheck className="size-5 text-primary shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium">Trạng thái: {isVerified ? "Đã xác thực Căn cước" : "Chưa xác thực Căn cước"}</p>
              <p className="text-xs text-muted-foreground">
                {isVerified
                  ? "Hồ sơ của bạn đã được xác thực danh tính thành công"
                  : "Xác thực Căn cước để nhận dấu tích xanh và cộng thêm 25 điểm uy tín"}
              </p>
            </div>
            {!isVerified && (
              <Button size="sm" variant="outline" onClick={() => navigate("/verify-account")}>
                Xác thực ngay
              </Button>
            )}
          </div>
        </Section>

        <div className="sticky bottom-3 z-20 flex items-center justify-end gap-2 rounded-2xl border border-border bg-card/95 p-3.5 shadow-sm backdrop-blur">
          <Button variant="ghost" onClick={() => navigate("/profile")}>Hủy</Button>
          <Button disabled={saving} onClick={handleSave} className="gap-2">
            {saving && <Loader2 className="size-4 animate-spin" />}
            Lưu thay đổi
          </Button>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return <div className="space-y-4 rounded-2xl bg-card p-5 ring-1 ring-border"><h2 className="text-lg font-semibold">{title}</h2>{children}</div>;
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-2"><Label>{label}</Label>{children}</div>;
}
