import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router";
import { Mail, Lock, Eye, EyeOff, CheckCircle2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { AuthShell } from "./Login";
import { motion, AnimatePresence } from "motion/react";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";

import { api } from "@/lib/api";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Form states
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [tempToken, setTempToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  // UI states
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState(60);

  // OTP Countdown Timer
  useEffect(() => {
    if (step !== 2 || countdown <= 0) return;
    const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    return () => clearTimeout(timer);
  }, [step, countdown]);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error("Vui lòng nhập email");
      return;
    }
    setIsLoading(true);
    try {
      await api.post("/auth/send-otp", { email, type: "RESET_PASSWORD" });
      toast.success(`Mã OTP đã được gửi đến email ${email}`);
      setCountdown(60);
      setStep(2);
    } catch (err: any) {
      toast.error(err.message || "Gửi OTP thất bại, vui lòng thử lại");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length < 6) {
      toast.error("Vui lòng nhập đủ mã OTP 6 chữ số");
      return;
    }
    setIsLoading(true);
    try {
      const res = await api.post<any>("/auth/verify-otp", { email, otp });
      const token = res?.tempToken || res?.data?.tempToken || "";
      setTempToken(token);
      toast.success("Xác minh mã OTP thành công");
      setStep(3);
    } catch (err: any) {
      toast.error(err.message || "Mã OTP không chính xác hoặc đã hết hạn");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      toast.error("Mật khẩu mới phải có ít nhất 6 ký tự");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Mật khẩu xác nhận không khớp");
      return;
    }
    setIsLoading(true);
    try {
      await api.post("/auth/reset-password", { tempToken, newPassword });
      toast.success("Đổi mật khẩu thành công!");
      setStep(4);
    } catch (err: any) {
      toast.error(err.message || "Đổi mật khẩu thất bại");
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-redirect on success screen
  useEffect(() => {
    if (step === 4) {
      const timer = setTimeout(() => {
        navigate("/login");
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [step, navigate]);

  return (
    <AuthShell>
      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="space-y-4"
          >
            <div>
              <h1 className="brand text-2xl text-foreground">Quên mật khẩu?</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Nhập email của bạn để nhận mã OTP khôi phục mật khẩu.
              </p>
            </div>

            <form onSubmit={handleSendOtp} className="space-y-4 mt-4">
              <div className="space-y-1.5">
                <Label htmlFor="email">Email đăng ký</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    required
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-9 h-10"
                  />
                </div>
              </div>

              <Button type="submit" className="w-full h-10" disabled={isLoading}>
                {isLoading ? "Đang gửi mã..." : "Gửi mã OTP"}
              </Button>
            </form>

            <div className="text-center pt-2">
              <Link
                to="/login"
                className="inline-flex items-center gap-1 text-sm text-emerald-brand hover:underline font-medium"
              >
                <ArrowLeft className="size-3.5" /> Quay lại đăng nhập
              </Link>
            </div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="space-y-4"
          >
            <div>
              <h1 className="brand text-2xl text-foreground">Nhập mã OTP</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Mã OTP 6 chữ số đã được gửi về email <strong className="text-foreground">{email}</strong>.
              </p>
              <div className="mt-2 rounded-lg bg-emerald-50/80 p-2.5 text-xs text-emerald-800 border border-emerald-200/60">
                💡 <strong>Chế độ phát triển (Dev Mode)</strong>: Mã OTP được in trực tiếp tại <strong>Backend Console Log</strong> và lưu trong Redis.
              </div>
            </div>

            <form onSubmit={handleVerifyOtp} className="space-y-5 mt-4 flex flex-col items-center">
              <div className="space-y-2 w-full flex flex-col items-center">
                <Label className="self-start">Mã xác minh</Label>
                <InputOTP maxLength={6} value={otp} onChange={setOtp}>
                  <InputOTPGroup>
                    <InputOTPSlot index={0} className="w-11 h-11 text-base" />
                    <InputOTPSlot index={1} className="w-11 h-11 text-base" />
                    <InputOTPSlot index={2} className="w-11 h-11 text-base" />
                    <InputOTPSlot index={3} className="w-11 h-11 text-base" />
                    <InputOTPSlot index={4} className="w-11 h-11 text-base" />
                    <InputOTPSlot index={5} className="w-11 h-11 text-base" />
                  </InputOTPGroup>
                </InputOTP>
              </div>

              <Button type="submit" className="w-full h-10" disabled={isLoading || otp.length < 6}>
                {isLoading ? "Đang xác minh..." : "Xác minh OTP"}
              </Button>
            </form>

            <div className="flex flex-col items-center gap-2 pt-2 text-sm">
              {countdown > 0 ? (
                <span className="text-muted-foreground">
                  Gửi lại mã sau <strong className="text-emerald-deep font-semibold">{countdown}s</strong>
                </span>
              ) : (
                <button
                  onClick={handleSendOtp}
                  className="text-emerald-brand hover:underline font-semibold cursor-pointer"
                >
                  Gửi lại mã OTP
                </button>
              )}
              <button
                onClick={() => setStep(1)}
                className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-emerald-brand hover:underline cursor-pointer"
              >
                Thay đổi địa chỉ email
              </button>
            </div>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="space-y-4"
          >
            <div>
              <h1 className="brand text-2xl text-foreground">Đặt mật khẩu mới</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Mật khẩu mới phải dài tối thiểu 6 ký tự để bảo mật.
              </p>
            </div>

            <form onSubmit={handleResetPassword} className="space-y-4 mt-4">
              <div className="space-y-1.5">
                <Label htmlFor="newPassword">Mật khẩu mới</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="newPassword"
                    type={showNewPassword ? "text" : "password"}
                    required
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="pl-9 pr-9 h-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    {showNewPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="confirmPassword">Xác nhận mật khẩu</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    required
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-9 pr-9 h-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    {showConfirmPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>

              <Button type="submit" className="w-full h-10" disabled={isLoading}>
                {isLoading ? "Đang lưu..." : "Cập nhật mật khẩu"}
              </Button>
            </form>
          </motion.div>
        )}

        {step === 4 && (
          <motion.div
            key="step4"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="text-center space-y-5 py-4"
          >
            <div className="mx-auto grid size-16 place-items-center rounded-full bg-mint text-primary">
              <CheckCircle2 className="size-10" />
            </div>
            <div className="space-y-2">
              <h1 className="brand text-2xl text-emerald-deep font-bold">Thành công!</h1>
              <p className="text-sm text-muted-foreground">
                Mật khẩu của bạn đã được cập nhật thành công. Hệ thống tự động chuyển hướng về trang đăng nhập...
                </p>
            </div>
            <Button onClick={() => navigate("/login")} className="w-full h-10">
              Đăng nhập ngay
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </AuthShell>
  );
}
