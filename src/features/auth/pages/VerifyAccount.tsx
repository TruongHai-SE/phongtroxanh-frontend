import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { Upload, ShieldCheck, Check, ArrowLeft, CheckCircle, Mail, CreditCard, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { PageTransition } from "@/components/layouts/PageTransition";
import { useAuth } from "@/app/context/AuthContext";

import { useKyc } from "@/features/account/hooks/useKyc";
import { authApi } from "@/features/auth/api/authApi";
import { useAuthActions } from "@/features/auth/hooks/useAuthActions";

type VerifyMethod = "selection" | "cccd" | "email";

export default function VerifyAccount() {
  const navigate = useNavigate();
  const { role } = useAuth();
  const { currentUser } = useAuthActions();
  const { kycStatus, isSubmitting, submitKycCccd, errorMessage: kycError } = useKyc();
  
  // Navigation states
  const [method, setMethod] = useState<VerifyMethod>("selection");
  
  // Real CCCD File States
  const [frontFile, setFrontFile] = useState<File | null>(null);
  const [backFile, setBackFile] = useState<File | null>(null);
  const [idNumber, setIdNumber] = useState("");
  const [frontPreview, setFrontPreview] = useState<string | null>(null);
  const [backPreview, setBackPreview] = useState<string | null>(null);
  const [cccdSubmitted, setCccdSubmitted] = useState(false);

  // Email States
  const [emailSent, setEmailSent] = useState(false);
  const [otpValue, setOtpValue] = useState("");
  const [emailSubmitted, setEmailSubmitted] = useState(false);
  const [isVerifyingEmail, setIsVerifyingEmail] = useState(false);
  const [timer, setTimer] = useState(0);

  const backPath = role === "landlord" ? "/landlord" : "/discover";
  const userEmail = currentUser?.email || "nguoidung@phongtroxanh.vn";

  const handleFrontFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFrontFile(file);
      setFrontPreview(URL.createObjectURL(file));
    }
  };

  const handleBackFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setBackFile(file);
      setBackPreview(URL.createObjectURL(file));
    }
  };

  // OTP countdown timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const handleSendOtp = async () => {
    try {
      await authApi.sendOtp({ email: userEmail, type: "VERIFY_EMAIL" });
      setEmailSent(true);
      setTimer(60);
      toast.success("Mã OTP đã được gửi về email của bạn");
    } catch (err: any) {
      toast.error(err.message || "Gửi mã OTP thất bại");
    }
  };

  const handleVerifyOtp = async () => {
    if (otpValue.length !== 6) {
      toast.error("Vui lòng nhập đầy đủ mã xác thực OTP 6 chữ số");
      return;
    }
    setIsVerifyingEmail(true);
    try {
      await authApi.verifyOtp({ email: userEmail, otp: otpValue });
      setEmailSubmitted(true);
      toast.success("Xác minh tài khoản qua Email thành công!");
    } catch (err: any) {
      toast.error(err.message || "Mã OTP không hợp lệ hoặc đã hết hạn");
    } finally {
      setIsVerifyingEmail(false);
    }
  };

  const handleCccdSubmit = async () => {
    if (!frontFile || !backFile) {
      toast.error("Vui lòng tải cả mặt trước và mặt sau CCCD");
      return;
    }
    try {
      await submitKycCccd(frontFile, backFile, idNumber);
      setCccdSubmitted(true);
      toast.success("Đã gửi CCCD — đang chờ xét duyệt");
    } catch (err: any) {
      toast.error(err.message || "Không thể gửi hồ sơ xác thực CCCD");
    }
  };

  // SUCCESS SCREENS
  if (cccdSubmitted) {
    return (
      <PageTransition>
        <div className="min-h-[80vh] flex items-center justify-center">
          <div className="mx-auto max-w-md text-center space-y-5">
            <div className="mx-auto grid size-16 place-items-center rounded-full bg-mint text-primary">
              <CheckCircle className="size-8 animate-scale-in" />
            </div>
            <h1 className="brand text-2xl">Yêu cầu đã được gửi!</h1>
            <p className="text-sm text-muted-foreground">
              Tài liệu CCCD của bạn đã được tiếp nhận. Hệ thống sẽ đối chiếu tự động và phê duyệt trong vòng 24 giờ.
            </p>
            <div className="rounded-xl bg-mint/50 p-4 text-sm text-left space-y-2">
              <p className="flex items-center gap-2"><Check className="size-4 text-primary" /> Mặt trước CCCD — Đã tải</p>
              <p className="flex items-center gap-2"><Check className="size-4 text-primary" /> Mặt sau CCCD — Đã tải</p>
              <p className="flex items-center gap-2 text-muted-foreground">⏳ Trạng thái: Đang chờ duyệt</p>
            </div>
            <Button onClick={() => navigate(backPath)} className="w-full hover-lift press-active">
              Quay lại trang chủ
            </Button>
          </div>
        </div>
      </PageTransition>
    );
  }

  if (emailSubmitted) {
    return (
      <PageTransition>
        <div className="min-h-[80vh] flex items-center justify-center">
          <div className="mx-auto max-w-md text-center space-y-5">
            <div className="mx-auto grid size-16 place-items-center rounded-full bg-mint text-primary">
              <CheckCircle className="size-8 animate-scale-in" />
            </div>
            <h1 className="brand text-2xl">Xác minh thành công!</h1>
            <p className="text-sm text-muted-foreground">
              Tài khoản của bạn đã được xác thực liên kết qua Email OTP. Bây giờ bạn có thể mở khoá đầy đủ các quyền lợi.
            </p>
            <div className="rounded-xl bg-mint/50 p-4 text-sm text-left space-y-2">
              <p className="flex items-center gap-2"><Check className="size-4 text-primary" /> Email xác thực: hoai.an.student@ueh.edu.vn</p>
              <p className="flex items-center gap-2 text-primary font-medium"><Check className="size-4 text-primary" /> Trạng thái: Đã xác thực thành công</p>
            </div>
            <Button onClick={() => navigate(backPath)} className="w-full hover-lift press-active">
              Quay lại trang chủ
            </Button>
          </div>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="mx-auto max-w-2xl px-6 py-10">
        <button
          onClick={() => {
            if (method !== "selection") {
              setMethod("selection");
            } else {
              navigate(-1);
            }
          }}
          className="mb-5 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-primary"
        >
          <ArrowLeft className="size-4" /> Quay lại
        </button>

        <div className="rounded-2xl bg-card p-8 shadow-sm ring-1 ring-border">
          {/* HEADER */}
          <div className="flex items-center gap-3 mb-6">
            <div className="grid size-10 place-items-center rounded-xl bg-mint text-primary">
              <ShieldCheck className="size-5" />
            </div>
            <div>
              <h1 className="brand text-xl">Xác minh tài khoản</h1>
              <p className="text-sm text-muted-foreground">
                Tăng độ uy tín tài khoản và mở khoá các tính năng liên hệ trực tiếp
              </p>
            </div>
          </div>

          {/* CHOOSE METHOD STEP */}
          {method === "selection" && (
            <div className="space-y-6">
              <div className="rounded-xl bg-mint/50 p-4">
                <h3 className="font-semibold text-emerald-deep mb-1 text-sm">Tại sao cần xác thực tài khoản?</h3>
                <ul className="space-y-1.5 text-xs text-emerald-dark/80">
                  <li className="flex items-center gap-2"><Check className="size-3.5 text-primary shrink-0" /> Nhận huy hiệu "Đã xác minh" tăng tỷ lệ ghép đôi thành công lên 85%</li>
                  <li className="flex items-center gap-2"><Check className="size-3.5 text-primary shrink-0" /> Được phép xem trực tiếp số điện thoại và nhắn tin trực tiếp với chủ trọ</li>
                  <li className="flex items-center gap-2"><Check className="size-3.5 text-primary shrink-0" /> Đảm bảo an toàn cộng đồng, giảm thiểu tài khoản giả mạo</li>
                </ul>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {/* Method 1: CCCD */}
                <button
                  onClick={() => setMethod("cccd")}
                  className="flex flex-col text-left p-5 rounded-2xl border border-border bg-card hover:border-primary/60 hover:bg-mint/10 transition-all hover-lift group"
                >
                  <div className="grid size-10 place-items-center rounded-xl bg-emerald-50 text-primary mb-4">
                    <CreditCard className="size-5" />
                  </div>
                  <h3 className="font-semibold text-base text-slate-800 flex items-center justify-between w-full">
                    <span>Xác minh bằng CCCD</span>
                    <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-normal">Chờ duyệt</span>
                  </h3>
                  <p className="mt-2 text-xs text-muted-foreground leading-relaxed flex-grow">
                    Tải ảnh chụp hai mặt của Căn cước công dân hoặc Hộ chiếu. Thích hợp cho người dùng muốn đạt độ uy tín cao nhất.
                  </p>
                  <div className="mt-4 text-xs font-semibold text-primary inline-flex items-center gap-1">
                    Bắt đầu <span className="transition-transform group-hover:translate-x-0.5">→</span>
                  </div>
                </button>

                {/* Method 2: Email OTP */}
                <button
                  onClick={() => setMethod("email")}
                  className="flex flex-col text-left p-5 rounded-2xl border border-border bg-card hover:border-primary/60 hover:bg-mint/10 transition-all hover-lift group"
                >
                  <div className="grid size-10 place-items-center rounded-xl bg-emerald-50 text-primary mb-4">
                    <Mail className="size-5" />
                  </div>
                  <h3 className="font-semibold text-base text-slate-800 flex items-center justify-between w-full">
                    <span>Xác thực qua Email OTP</span>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-normal">Tức thì</span>
                  </h3>
                  <p className="mt-2 text-xs text-muted-foreground leading-relaxed flex-grow">
                    Nhập mã xác thực nhanh gồm 6 số gửi về địa chỉ email trường học hoặc nơi làm việc của bạn.
                  </p>
                  <div className="mt-4 text-xs font-semibold text-primary inline-flex items-center gap-1">
                    Bắt đầu <span className="transition-transform group-hover:translate-x-0.5">→</span>
                  </div>
                </button>
              </div>

              <div className="flex gap-3 justify-center text-xs text-muted-foreground pt-2">
                <span className="flex items-center gap-1">🔒 Dữ liệu của bạn được bảo mật tuyệt đối</span>
              </div>
            </div>
          )}

          {/* CCCD UPLOAD METHOD */}
          {method === "cccd" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground">PHƯƠNG THỨC: CĂN CƯỚC CÔNG DÂN</span>
                <button onClick={() => setMethod("selection")} className="text-xs font-bold text-primary hover:underline">Thay đổi</button>
              </div>

              <Progress value={frontFile && backFile ? 100 : frontFile || backFile ? 50 : 0} className="h-1.5" />

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Số Căn cước công dân (12 chữ số)
                  </label>
                  <input
                    type="text"
                    value={idNumber}
                    onChange={(e) => setIdNumber(e.target.value)}
                    placeholder="Ví dụ: 079201012345"
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                    maxLength={12}
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  {/* Front side */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Mặt trước CCCD</label>
                    <label
                      className={cn(
                        "relative flex aspect-[3/2] cursor-pointer flex-col items-center justify-center overflow-hidden rounded-xl border-2 border-dashed text-center transition-all hover-lift",
                        frontPreview
                          ? "border-emerald-500 bg-emerald-50/20"
                          : "border-slate-300 bg-slate-50/50 hover:border-emerald-500 hover:bg-emerald-50/10"
                      )}
                    >
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFrontFileChange}
                        className="hidden"
                      />
                      {frontPreview ? (
                        <img src={frontPreview} alt="Mặt trước" className="h-full w-full object-cover" />
                      ) : (
                        <div className="p-4">
                          <Upload className="mx-auto size-6 text-emerald-600" />
                          <p className="mt-2 text-sm font-medium text-slate-800">Tải mặt trước</p>
                          <p className="text-xs text-slate-400">Nhấn để chọn ảnh</p>
                        </div>
                      )}
                    </label>
                  </div>

                  {/* Back side */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Mặt sau CCCD</label>
                    <label
                      className={cn(
                        "relative flex aspect-[3/2] cursor-pointer flex-col items-center justify-center overflow-hidden rounded-xl border-2 border-dashed text-center transition-all hover-lift",
                        backPreview
                          ? "border-emerald-500 bg-emerald-50/20"
                          : "border-slate-300 bg-slate-50/50 hover:border-emerald-500 hover:bg-emerald-50/10"
                      )}
                    >
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleBackFileChange}
                        className="hidden"
                      />
                      {backPreview ? (
                        <img src={backPreview} alt="Mặt sau" className="h-full w-full object-cover" />
                      ) : (
                        <div className="p-4">
                          <Upload className="mx-auto size-6 text-emerald-600" />
                          <p className="mt-2 text-sm font-medium text-slate-800">Tải mặt sau</p>
                          <p className="text-xs text-slate-400">Nhấn để chọn ảnh</p>
                        </div>
                      )}
                    </label>
                  </div>
                </div>
              </div>

              {kycError && (
                <p className="text-xs text-rose-600 bg-rose-50 p-2.5 rounded-lg">{kycError}</p>
              )}

              <div className="flex gap-3">
                <Button variant="ghost" className="flex-1" onClick={() => setMethod("selection")} disabled={isSubmitting}>
                  Quay lại
                </Button>
                <Button
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                  disabled={!frontFile || !backFile || isSubmitting}
                  onClick={handleCccdSubmit}
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <RefreshCw className="h-4 w-4 animate-spin" /> Đang tải lên...
                    </span>
                  ) : (
                    "Gửi xác minh"
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* EMAIL OTP METHOD */}
          {method === "email" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground">PHƯƠNG THỨC: EMAIL OTP</span>
                <button onClick={() => setMethod("selection")} className="text-xs font-bold text-primary hover:underline">Thay đổi</button>
              </div>

              {!emailSent ? (
                <div className="space-y-5 text-center py-4">
                  <div className="mx-auto grid size-12 place-items-center rounded-full bg-emerald-50 text-primary">
                    <Mail className="size-6" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-semibold text-base">Xác nhận hòm thư điện tử</h3>
                    <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                      Mã OTP xác thực sẽ được gửi trực tiếp đến địa chỉ email đăng ký tài khoản của bạn:
                    </p>
                    <p className="font-semibold text-emerald-800 text-sm py-1 bg-mint/40 rounded-lg max-w-xs mx-auto mt-2">
                      {userEmail}
                    </p>
                  </div>
                  
                  <div className="pt-2 flex justify-center">
                    <Button onClick={handleSendOtp} className="w-full max-w-xs hover-lift press-active">
                      Gửi mã OTP xác nhận
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="rounded-xl bg-mint/30 p-4 border border-primary/10">
                    <p className="text-xs text-slate-600 text-center leading-relaxed">
                      Mã xác thực OTP gồm 6 chữ số đã được gửi đến email <strong className="text-slate-800">{userEmail}</strong>. Vui lòng kiểm tra hộp thư.
                    </p>
                    <p className="mt-2 text-[11px] text-emerald-800 text-center font-medium bg-white/70 py-1 px-2 rounded-lg border border-emerald-200">
                      💡 <strong>Dev Mode</strong>: Xem mã OTP tại Terminal Backend Console hoặc Redis.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-700 block text-center">NHẬP MÃ XÁC THỰC OTP</label>
                    <div className="flex justify-center gap-2">
                      <input
                        type="text"
                        maxLength={6}
                        value={otpValue}
                        onChange={(e) => setOtpValue(e.target.value.replace(/[^0-9]/g, ""))}
                        placeholder="••••••"
                        className="w-full max-w-[200px] text-center tracking-[0.5em] font-mono text-xl py-3 px-4 rounded-xl border-2 border-border focus:border-primary/80 focus:ring-0 focus:outline-none bg-card transition-all"
                      />
                    </div>
                  </div>

                  <div className="flex justify-center text-xs">
                    {timer > 0 ? (
                      <span className="text-muted-foreground">Gửi lại mã sau <strong className="text-slate-700 font-bold">{timer}s</strong></span>
                    ) : (
                      <button
                        onClick={handleSendOtp}
                        className="inline-flex items-center gap-1 font-bold text-primary hover:underline cursor-pointer"
                      >
                        <RefreshCw className="size-3 animate-spin-slow" /> Gửi lại mã OTP
                      </button>
                    )}
                  </div>

                  <div className="flex gap-3 pt-2">
                    <Button variant="ghost" className="flex-1" onClick={() => setEmailSent(false)} disabled={isVerifyingEmail}>
                      Quay lại
                    </Button>
                    <Button
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                      disabled={otpValue.length !== 6 || isVerifyingEmail}
                      onClick={handleVerifyOtp}
                    >
                      {isVerifyingEmail ? (
                        <span className="flex items-center gap-2">
                          <RefreshCw className="h-4 w-4 animate-spin" /> Đang xác minh...
                        </span>
                      ) : (
                        "Xác nhận"
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </PageTransition>
  );
}
