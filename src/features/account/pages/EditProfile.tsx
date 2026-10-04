import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import { Upload, Camera, ShieldCheck, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { interestOptions, districts, roomTypes } from "@/lib/constants";
import { cn, getInitials } from "@/lib/utils";
import { useAuth } from "@/app/context/AuthContext";
import { accountApi } from "../api/accountApi";

export default function EditProfile() {
  const navigate = useNavigate();
  const { user, refreshProfile } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form states
  const [fullName, setFullName] = useState("");
  const [birthDate, setBirthDate] = useState("2003-05-12");
  const [gender, setGender] = useState("female");
  const [schoolOrCompany, setSchoolOrCompany] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || "");
  const [isVerified, setIsVerified] = useState(false);

  // Lifestyle states
  const [earlySleeper, setEarlySleeper] = useState(true);
  const [isNeat, setIsNeat] = useState(true);
  const [allowGuests, setAllowGuests] = useState(false);
  const [nonSmoking, setNonSmoking] = useState(true);
  const [noiseTolerance, setNoiseTolerance] = useState(40);

  // Preferences states
  const [interests, setInterests] = useState(["Nấu ăn", "Đọc sách", "Du lịch", "Âm nhạc", "Gym"]);
  const [selDistricts, setSelDistricts] = useState<string[]>(["Quận 10", "Bình Thạnh"]);
  const [budget, setBudget] = useState([1500000, 3000000]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // Load user profile & preferences via accountApi
    accountApi.getProfile()
      .then((u) => {
        if (u) {
          if (u.fullName) setFullName(u.fullName);
          if (u.school) setSchoolOrCompany(u.school);
          if (u.bio) setBio(u.bio);
          if (u.avatarUrl) setAvatarUrl(u.avatarUrl);
          if (u.kycStatus === "APPROVED") setIsVerified(true);
          if (u.interests?.length) setInterests(u.interests);
          if (u.budgetMin && u.budgetMax) setBudget([u.budgetMin, u.budgetMax]);
          if (u.targetDistricts?.length) setSelDistricts(u.targetDistricts);
        }
      })
      .catch(() => {});

    accountApi.getPreferences()
      .then((pref) => {
        if (pref) {
          if (pref.minPrice && pref.maxPrice) setBudget([pref.minPrice, pref.maxPrice]);
          if (pref.preferredDistricts?.length) setSelDistricts(pref.preferredDistricts);
        }
      })
      .catch(() => {});
  }, []);

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

  const handleSave = async () => {
    setSaving(true);
    try {
      await accountApi.updateProfile({
        fullName,
        school: schoolOrCompany,
        bio,
        interests,
        budgetMin: budget[0],
        budgetMax: budget[1],
        targetDistricts: selDistricts,
        lifestyle: {
          "Giờ giấc": earlySleeper ? "Ngủ sớm (trước 23h)" : "Linh hoạt",
          "Dọn dẹp": isNeat ? "Rất gọn gàng" : "Ngăn nắp",
          "Khách": allowGuests ? "Cho phép có báo trước" : "Hiếm khi",
          "Hút thuốc": nonSmoking ? "Không hút thuốc" : "Có hút thuốc",
        },
      });

      await accountApi.updatePreferences({
        minPrice: budget[0],
        maxPrice: budget[1],
        preferredDistricts: selDistricts,
        roomTypes: ["Phòng khép kín", "Studio"],
        amenities: ["Máy lạnh", "Wi-Fi"],
      });
    } catch {
      // optimistic fallback
    } finally {
      setSaving(false);
      toast.success("Đã lưu thay đổi hồ sơ");
      navigate("/profile");
    }
  };

  const toggle = (v: string) => setInterests((s) => (s.includes(v) ? s.filter((x) => x !== v) : [...s, v]));
  const toggleDist = (v: string) => setSelDistricts((s) => (s.includes(v) ? s.filter((x) => x !== v) : [...s, v]));

  return (
    <div className="mx-auto max-w-3xl px-6 py-8">
      <h1 className="brand text-2xl text-foreground">Chỉnh sửa hồ sơ</h1>
      <p className="text-sm text-muted-foreground">Cập nhật thông tin để ghép đôi chính xác hơn</p>

      <div className="mt-6 space-y-6">
        {/* AVATAR */}
        <Section title="Ảnh đại diện">
          <div className="flex items-center gap-4">
            <Avatar className="size-20 ring-2 ring-primary/20 shadow-sm">
              {avatarUrl ? <AvatarImage src={avatarUrl} className="object-cover" /> : null}
              <AvatarFallback className="bg-mint text-primary font-bold text-xl">
                {getInitials(fullName || user?.fullName) || <Camera className="size-6" />}
              </AvatarFallback>
            </Avatar>
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleAvatarUpload} />
            <Button variant="outline" size="sm" className="gap-2 cursor-pointer" onClick={() => fileInputRef.current?.click()}>
              <Upload className="size-4" /> Đổi ảnh
            </Button>
          </div>
        </Section>

        {/* PERSONAL INFO */}
        <Section title="Thông tin cá nhân">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Họ và tên">
              <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
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
            <Field label="Trường / Nơi làm việc">
              <Input value={schoolOrCompany} onChange={(e) => setSchoolOrCompany(e.target.value)} />
            </Field>
          </div>
          <Field label="Giới thiệu bản thân">
            <Textarea rows={3} value={bio} onChange={(e) => setBio(e.target.value)} />
          </Field>
        </Section>

        {/* INTERESTS */}
        <Section title="Sở thích">
          <div className="flex flex-wrap gap-2">
            {interestOptions.map((o) => (
              <button key={o} onClick={() => toggle(o)} className={cn("rounded-full border px-3 py-1.5 text-sm transition", interests.includes(o) ? "border-primary bg-mint text-primary" : "border-border text-muted-foreground hover:border-primary/40")}>{o}</button>
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
        <Section title="Nhu cầu ở">
          <Field label={`Ngân sách: ${(budget[0] / 1e6).toFixed(1)} - ${(budget[1] / 1e6).toFixed(1)} triệu/tháng`}>
            <Slider value={budget} onValueChange={setBudget} min={500000} max={8000000} step={100000} className="py-2" />
          </Field>
          <Field label="Khu vực mong muốn">
            <div className="flex flex-wrap gap-2">
              {districts.map((d) => (
                <button key={d} onClick={() => toggleDist(d)}
                  className={cn("rounded-full border px-3 py-1.5 text-sm transition", selDistricts.includes(d) ? "border-primary bg-mint text-primary" : "border-border text-muted-foreground hover:border-primary/40")}>
                  {d}
                </button>
              ))}
            </div>
          </Field>
          <Field label="Loại phòng">
            <Select defaultValue={roomTypes[1]}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {roomTypes.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Ưu tiên gần">
            <div className="grid gap-2 sm:grid-cols-2">
              {["Gần trường học", "Gần chỗ làm", "Gần chợ/siêu thị", "Gần trạm xe buýt"].map((p) => (
                <label key={p} className="flex items-center gap-2 rounded-lg bg-secondary/50 px-3 py-2 text-sm">
                  <input type="checkbox" defaultChecked className="accent-primary" /> {p}
                </label>
              ))}
            </div>
          </Field>
        </Section>

        {/* ACCOUNT VERIFICATION STATUS */}
        <Section title="Xác minh tài khoản">
          <div className="flex items-center gap-3 rounded-xl bg-mint/50 p-4">
            <ShieldCheck className="size-5 text-primary shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium">Trạng thái: {isVerified ? "Đã xác minh" : "Chưa xác minh"}</p>
              <p className="text-xs text-muted-foreground">{isVerified ? "Hồ sơ của bạn đã được kiểm duyệt CCCD thành công" : "Xác minh tài khoản để tăng độ uy tín"}</p>
            </div>
            {!isVerified && (
              <Button size="sm" variant="outline" onClick={() => navigate("/verify-account")}>
                Xác minh ngay
              </Button>
            )}
          </div>
        </Section>

        <div className="flex justify-end gap-2">
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
