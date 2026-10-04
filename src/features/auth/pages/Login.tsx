import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router";
import {
  ArrowLeft,
  Mail,
  Lock,
  User,
  Phone,
  Shield,
  Home,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useAuth } from "@/app/context/AuthContext";
import { api, tokenStorage } from "@/lib/api";
import { authApi } from "../api/authApi";
import { cn } from "@/lib/utils";
import { PageTransition } from "@/components/layouts/PageTransition";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import AuthBackgroundCanvas from "../components/AuthBackgroundCanvas";

/* ── Scale-to-fit wrapper (kept from original) ── */
function ScaleToFitWrapper({ children }: { children: React.ReactNode }) {
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 700) {
        setScale(1);
        return;
      }
      const targetWidth = 780;
      const targetHeight = 560;
      const padding = 24;
      const availableWidth = window.innerWidth - padding;
      const availableHeight = window.innerHeight - padding;
      const scaleX = availableWidth / targetWidth;
      const scaleY = availableHeight / targetHeight;
      const newScale = Math.min(scaleX, scaleY, 1.0);
      setScale(newScale);
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    if (window.visualViewport) {
      window.visualViewport.addEventListener("resize", handleResize);
    }
    return () => {
      window.removeEventListener("resize", handleResize);
      if (window.visualViewport) {
        window.visualViewport.removeEventListener("resize", handleResize);
      }
    };
  }, []);

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center bg-gradient-to-b from-mint/15 via-background to-background overflow-x-hidden overflow-y-auto py-6 px-4">
      {/* Aurora background blobs */}
      <div className="aurora left-[-15%] top-[-10%] h-[350px] w-[350px] bg-sage/40" />
      <div className="aurora right-[-10%] bottom-[5%] h-[320px] w-[320px] bg-emerald-100/30" />

      {/* Three.js Background Canvas */}
      <AuthBackgroundCanvas />

      <div
        className="relative z-10 flex flex-col items-center justify-center origin-center my-auto"
        style={{ transform: `scale(${scale})` }}
      >
        {children}
      </div>
    </div>
  );
}

/* ── AuthShell — exported for RoleSelect.tsx compatibility ── */
function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <PageTransition>
      <ScaleToFitWrapper>
        <div
          className="w-full flex flex-col"
          style={{ width: 440, maxWidth: "94vw" }}
        >
          <div className="mb-3 flex justify-start">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-[10px] font-semibold text-charcoal shadow-xs ring-1 ring-border transition hover:bg-slate-50"
            >
              <ArrowLeft className="size-3 text-emerald-brand" />
              Quay lại trang chủ
            </Link>
          </div>
          <Link
            to="/"
            className="brand mb-3 block text-center text-xl text-emerald-deep font-bold"
          >
            Phòng Trọ Xanh
          </Link>
          <div className="rounded-2xl bg-card p-5 shadow-xl ring-1 ring-border">
            {children}
          </div>
        </div>
      </ScaleToFitWrapper>
    </PageTransition>
  );
}

/* ── Main Login/Register double-slider page ── */
export default function Login() {
  const navigate = useNavigate();
  const { login, loginWithGoogle, register, loginAs } = useAuth();

  const [isRegister, setIsRegister] = useState(
    new URLSearchParams(window.location.search).get("mode") === "register",
  );
  const [googleClientId, setGoogleClientId] = useState<string>(() => {
    // 1. Priority 1: Frontend env (0ms)
    const envId = (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID;
    if (envId && typeof envId === "string" && envId.trim()) return envId.trim();
    // 2. Priority 2: Session storage cache (0ms)
    try {
      const cached = sessionStorage.getItem("GOOGLE_CLIENT_ID");
      if (cached && cached.trim()) return cached.trim();
    } catch {
      // ignore
    }
    return "";
  });

  useEffect(() => {
    // If not already resolved by env or session cache, fetch from BE
    if (!googleClientId) {
      authApi.getGoogleClientId().then((id) => {
        if (id) {
          setGoogleClientId(id);
        }
      });
    }
  }, [googleClientId]);

  // Form fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [isMobile, setIsMobile] = useState(false);

  // Google GSI Button Container Refs
  const googleBtnLoginRef = useRef<HTMLDivElement>(null);
  const googleBtnRegRef = useRef<HTMLDivElement>(null);

  // Password matching shake validation hooks
  const [shouldShakeConfirm, setShouldShakeConfirm] = useState(false);
  const shakeTimeoutRef = useRef<any>(null);
  const debounceTimeoutRef = useRef<any>(null);

  const triggerShake = () => {
    setShouldShakeConfirm(true);
    if (shakeTimeoutRef.current) clearTimeout(shakeTimeoutRef.current);
    shakeTimeoutRef.current = setTimeout(() => {
      setShouldShakeConfirm(false);
    }, 400);
  };

  const handleConfirmPasswordChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const val = e.target.value;
    setConfirmPassword(val);
    if (debounceTimeoutRef.current) clearTimeout(debounceTimeoutRef.current);
    if (val !== "" && val !== password) {
      debounceTimeoutRef.current = setTimeout(() => {
        triggerShake();
      }, 800);
    }
  };

  const handleConfirmPasswordBlur = () => {
    if (confirmPassword !== "" && confirmPassword !== password) {
      triggerShake();
    }
  };

  useEffect(() => {
    return () => {
      if (shakeTimeoutRef.current) clearTimeout(shakeTimeoutRef.current);
      if (debounceTimeoutRef.current) clearTimeout(debounceTimeoutRef.current);
    };
  }, []);


  // 2FA Dialog State
  const [show2FAModal, setShow2FAModal] = useState(false);
  const [otpValue, setOtpValue] = useState("");
  const [otpError, setOtpError] = useState("");
  const [resendCountdown, setResendCountdown] = useState(60);
  const [pendingAction, setPendingAction] = useState<{
    type: "login" | "register";
    role: "tenant" | "landlord" | "admin";
    credentials?: { email: string; name?: string; phone?: string };
  } | null>(null);

  useEffect(() => {
    if (!show2FAModal || resendCountdown <= 0) return;
    const timer = setTimeout(() => setResendCountdown((prev) => prev - 1), 1000);
    return () => clearTimeout(timer);
  }, [show2FAModal, resendCountdown]);

  const handleResendOtp = async () => {
    try {
      await api.post("/auth/send-otp", { email, type: "REGISTER" });
      setResendCountdown(60);
      toast.success(`Đã gửi lại mã OTP về ${email}`);
    } catch (err: any) {
      toast.error(err.message || "Gửi lại OTP thất bại");
    }
  };

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleEmailLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    const inputEmail = ((formData.get("email") as string) || email || "").trim();
    const inputPassword = ((formData.get("password") as string) || password || "").trim();

    if (!inputEmail || !inputPassword) {
      setError("Vui lòng nhập đầy đủ email và mật khẩu");
      return;
    }

    // Sync back to state in case autofill filled it
    setEmail(inputEmail);
    setPassword(inputPassword);

    setIsSubmitting(true);
    setError("");
    try {
      const loggedUser = await login(inputEmail, inputPassword);
      if (loggedUser.role === "admin") {
        toast.success(`Đăng nhập thành công: ${loggedUser.fullName || loggedUser.name}`);
        navigate("/admin");
      } else if (loggedUser.role === "landlord") {
        toast.success(`Đăng nhập thành công: ${loggedUser.fullName || loggedUser.name}`);
        navigate("/landlord");
      } else if (!loggedUser.isOnboarded) {
        toast.success(`Đăng nhập thành công: ${loggedUser.fullName || loggedUser.name}`, {
          description: "Vui lòng hoàn tất khảo sát hồ sơ để tiếp tục trải nghiệm.",
        });
        navigate("/onboarding/role");
      } else {
        toast.success(`Đăng nhập thành công: ${loggedUser.fullName || loggedUser.name}`);
        navigate("/discover");
      }
    } catch (err: any) {
      setError(err.message || "Email hoặc mật khẩu không chính xác");
      toast.error(err.message || "Đăng nhập thất bại");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const cleanName = name.trim();
    const cleanPhone = phone.trim();
    const cleanEmail = email.trim();

    if (!cleanName || !cleanPhone || !cleanEmail || !password || !confirmPassword) {
      setError("Vui lòng điền đầy đủ tất cả các trường");
      return;
    }

    // Họ và tên: Tối thiểu 2 từ, chỉ gồm chữ cái và khoảng trắng
    const nameWords = cleanName.split(/\s+/).filter(Boolean);
    if (nameWords.length < 2) {
      setError("Vui lòng nhập đầy đủ cả họ và tên (tối thiểu 2 từ, ví dụ: Nguyễn Văn An)");
      return;
    }
    const nameRegex = /^[\p{L}\s'-]+$/u;
    if (!nameRegex.test(cleanName)) {
      setError("Họ và tên chỉ được chứa chữ cái, không được chứa số hoặc ký hiệu lạ");
      return;
    }

    // Số điện thoại di động Việt Nam chuẩn (10 chữ số, đầu 03, 05, 07, 08, 09 hoặc +84)
    const phoneRegex = /^(?:0|\+84)(3[2-9]|5[2689]|7[06-9]|8[1-9]|9\d)\d{7}$/;
    if (!phoneRegex.test(cleanPhone)) {
      setError("Số điện thoại không hợp lệ (yêu cầu 10 số thuộc nhà mạng VN: 03x, 05x, 07x, 08x, 09x)");
      return;
    }

    // Email format chuẩn
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      setError("Định dạng email không hợp lệ (ví dụ: vidu@gmail.com)");
      return;
    }

    if (password.length < 6) {
      setError("Mật khẩu phải chứa ít nhất 6 ký tự");
      return;
    }

    if (password !== confirmPassword) {
      setError("Mật khẩu xác nhận không trùng khớp");
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post("/auth/send-otp", { email: cleanEmail, type: "REGISTER" });
      toast.success(`Mã OTP đã được gửi về Gmail: ${cleanEmail}`);
      setOtpValue("");
      setOtpError("");
      setResendCountdown(60);
      setShow2FAModal(true);
      setPendingAction({
        type: "register",
        role: "tenant",
        credentials: { email: cleanEmail, name: cleanName, phone: cleanPhone },
      });
    } catch (err: any) {
      setError(err.message || "Gửi mã OTP thất bại. Email hoặc số điện thoại có thể đã được sử dụng.");
      toast.error(err.message || "Đăng ký thất bại");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleCredentialResponse = async (response: any) => {
    const idToken = response.credential;
    if (!idToken) {
      toast.error("Không nhận được mã xác thực từ Google");
      return;
    }
    setIsSubmitting(true);
    try {
      const { user: authUser, isNewUser, isOnboarded } = await loginWithGoogle(idToken, isRegister ? "TENANT" : undefined);
      const isLandlord = authUser.role === "landlord";
      const shouldOnboard = authUser.role !== "admin" && (isNewUser ? true : (isLandlord ? false : (!isOnboarded || !authUser.isOnboarded)));
      if (shouldOnboard) {
        toast.success(`Chào mừng ${authUser.fullName || authUser.name}! Vui lòng trả lời một số câu hỏi để hoàn tất hồ sơ.`);
        navigate(isLandlord ? "/onboarding/landlord" : "/onboarding/role");
      } else {
        toast.success(`Đăng nhập Google thành công: ${authUser.fullName || authUser.name}`);
        navigate(isLandlord ? "/landlord" : authUser.role === "admin" ? "/admin" : "/discover");
      }
    } catch (err: any) {
      toast.error(err.message || "Đăng nhập Google thất bại");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Initialize Google Identity Services SDK and render native buttons
  useEffect(() => {
    if (!googleClientId) return;

    const initGsi = () => {
      if ((window as any).google?.accounts?.id) {
        try {
          (window as any).google.accounts.id.initialize({
            client_id: googleClientId,
            callback: handleGoogleCredentialResponse,
            auto_select: false,
            cancel_on_tap_outside: true,
          });

          if (googleBtnLoginRef.current) {
            googleBtnLoginRef.current.innerHTML = "";
            (window as any).google.accounts.id.renderButton(googleBtnLoginRef.current, {
              theme: "outline",
              size: "large",
              type: "standard",
              shape: "rectangular",
              text: "signin_with",
              logo_alignment: "left",
              width: 340,
            });
          }

          if (googleBtnRegRef.current) {
            googleBtnRegRef.current.innerHTML = "";
            (window as any).google.accounts.id.renderButton(googleBtnRegRef.current, {
              theme: "outline",
              size: "medium",
              type: "standard",
              shape: "rectangular",
              text: "signup_with",
              logo_alignment: "left",
              width: 340,
            });
          }
        } catch (err) {
          console.warn("Could not render Google GSI button:", err);
        }
      }
    };

    initGsi();
    const interval = setInterval(() => {
      if ((window as any).google?.accounts?.id) {
        initGsi();
        clearInterval(interval);
      }
    }, 250);

    return () => clearInterval(interval);
  }, [googleClientId, isRegister]);

  const triggerGoogleLogin = () => {
    if (googleClientId && (window as any).google?.accounts?.id) {
      try {
        (window as any).google.accounts.id.prompt();
        return;
      } catch (err) {
        console.warn("Could not launch Google One Tap prompt", err);
      }
    }
    toast.error("Hệ thống chưa cấu hình VITE_GOOGLE_CLIENT_ID hoặc trình duyệt chặn Google One-Tap. Vui lòng đăng nhập bằng Email và Mật khẩu.");
  };

  const handleVerify2FA = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (otpValue.length < 6) {
      setOtpError("Vui lòng nhập đủ mã OTP 6 chữ số");
      return;
    }

    setIsSubmitting(true);
    setOtpError("");
    try {
      const regEmail = pendingAction?.credentials?.email || email.trim();
      const regName = pendingAction?.credentials?.name || name.trim();
      const regPhone = pendingAction?.credentials?.phone || phone.trim();

      await api.post("/auth/verify-otp", { email: regEmail, otp: otpValue });
      await register({
        email: regEmail,
        password,
        fullName: regName,
        phoneNumber: regPhone,
        role: "TENANT",
      });
      await login(regEmail, password);
      setShow2FAModal(false);
      toast.success(`Đăng ký & xác thực tài khoản thành công! Vui lòng hoàn tất câu hỏi khảo sát.`);
      navigate("/onboarding/role");
    } catch (err: any) {
      setOtpError(err.message || "Mã OTP không chính xác hoặc đã hết hạn");
      toast.error(err.message || "Xác thực OTP thất bại");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Auto-submit OTP when length is 6
  useEffect(() => {
    if (otpValue.length === 6 && show2FAModal) {
      handleVerify2FA();
    }
  }, [otpValue, show2FAModal]);

  const switchMode = () => {
    setIsRegister((prev) => !prev);
    setError("");
  };

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 700);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const loginFormRef = useRef<HTMLDivElement>(null);
  const registerFormRef = useRef<HTMLDivElement>(null);

  return (
    <PageTransition>
      <ScaleToFitWrapper>
        {/* Back link */}
        <div
          className="mb-3 flex justify-start"
          style={{ width: "100%", maxWidth: "clamp(340px, 85vw, 760px)" }}
        >
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-[10px] font-semibold text-charcoal shadow-xs ring-1 ring-border transition hover:bg-slate-50"
          >
            <ArrowLeft className="size-3 text-emerald-brand" />
            Quay lại trang chủ
          </Link>
        </div>

        {/* ── Double Slider Container ── */}
        <div
          className={`auth-slider ${isRegister ? "auth-slider--register" : ""}`}
        >
          {/* ──── LEFT COLUMN: Sign In Form ──── */}
          <div
            ref={loginFormRef}
            className="auth-slider__form-panel"
            {...(isRegister ? { inert: "" as unknown as boolean } : {})}
            aria-hidden={isRegister}
          >
            <Link
              to="/"
              className="brand mb-2 block text-center text-lg text-emerald-deep font-bold"
            >
              Phòng Trọ Xanh
            </Link>
            <h2 className="text-center text-base font-bold text-charcoal mb-1">
              Đăng nhập
            </h2>
            <p className="text-center text-[11px] text-muted-foreground mb-4">
              Đăng nhập để tìm phòng trọ phù hợp với bạn
            </p>

            {!isRegister && error && (
              <p className="mb-3 text-xs text-destructive font-medium text-center">
                {error}
              </p>
            )}

            <form onSubmit={handleEmailLogin} className="space-y-3">
              <div className="space-y-1">
                <Label htmlFor="login-email" className="text-xs">
                  Email đăng nhập
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="login-email"
                    name="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="pl-9 h-9 text-xs"
                    required
                    autoComplete="username"
                    tabIndex={isRegister ? -1 : 0}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <Label htmlFor="login-password" className="text-xs">
                    Mật khẩu
                  </Label>
                  <Link
                    to="/forgot-password"
                    className="text-[10px] text-primary font-medium hover:underline cursor-pointer"
                    tabIndex={isRegister ? -1 : 0}
                  >
                    Quên mật khẩu?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="login-password"
                    name="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="pl-9 h-9 text-xs"
                    required
                    autoComplete="current-password"
                    tabIndex={isRegister ? -1 : 0}
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-9 text-xs mt-1 bg-emerald-brand hover:bg-emerald-deep text-white flex items-center justify-center gap-1.5"
                tabIndex={isRegister ? -1 : 0}
              >
                {isSubmitting && <Loader2 className="size-3.5 animate-spin" />}
                {isSubmitting ? "Đang xử lý..." : "Đăng nhập"}
              </Button>

              <div className="relative my-3">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-white px-2 text-[10px] text-muted-foreground">
                    Hoặc tiếp tục với
                  </span>
                </div>
              </div>

              <div className="mt-1">
                <div className="group relative h-9 rounded-md overflow-hidden flex items-center justify-center">
                  <div
                    ref={googleBtnLoginRef}
                    onClick={triggerGoogleLogin}
                    className={cn(
                      "absolute inset-0 z-10 opacity-0 cursor-pointer overflow-hidden flex items-center justify-center [&>div]:w-full [&>iframe]:w-full [&>iframe]:scale-125",
                      !googleClientId && "pointer-events-none"
                    )}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full gap-2 h-9 text-xs font-medium text-charcoal border-slate-200 bg-white group-hover:bg-slate-100 group-hover:border-slate-300 group-hover:shadow-sm group-hover:text-black group-hover:scale-[1.005] group-active:scale-[0.99] transition-all duration-200"
                    onClick={triggerGoogleLogin}
                    tabIndex={isRegister ? -1 : 0}
                  >
                    <svg className="size-4 group-hover:scale-110 transition-transform duration-200" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                    Đăng nhập bằng Google
                  </Button>
                </div>
              </div>
            </form>



            {/* Mobile-only toggle */}
            {isMobile && (
              <button
                onClick={switchMode}
                className="mt-4 w-full text-center text-xs text-emerald-brand font-semibold hover:underline"
              >
                Chưa có tài khoản?{" "}
                <span className="underline">Đăng ký ngay</span>
              </button>
            )}

            <p className="mt-3 text-center text-[10px] text-muted-foreground">
              Bằng việc tiếp tục, bạn đồng ý với Điều khoản và Chính sách bảo
              mật.
            </p>
          </div>

          {/* ──── RIGHT COLUMN: Register Form ──── */}
          <div
            ref={registerFormRef}
            className="auth-slider__form-panel"
            {...(!isRegister ? { inert: "" as unknown as boolean } : {})}
            aria-hidden={!isRegister}
          >
            <Link
              to="/"
              className="brand mb-1 block text-center text-lg text-emerald-deep font-bold"
            >
              Phòng Trọ Xanh
            </Link>
            <h2 className="text-center text-sm font-bold text-charcoal mb-0.5">
              Tạo tài khoản
            </h2>
            <p className="text-center text-[10px] text-muted-foreground mb-2.5">
              Đăng ký để bắt đầu tìm phòng trọ và bạn ở ghép
            </p>

            {isRegister && error && (
              <p className="mb-2 text-xs text-destructive font-medium text-center">
                {error}
              </p>
            )}

            <form onSubmit={handleRegister} className="space-y-2">
              <div className="space-y-0.5">
                <Label htmlFor="reg-name" className="text-[11px] leading-tight">
                  Họ và tên
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="reg-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Nguyễn Văn A"
                    className="pl-9 h-[34px] text-xs"
                    required
                    tabIndex={!isRegister ? -1 : 0}
                  />
                </div>
              </div>

              <div className="space-y-0.5">
                <Label
                  htmlFor="reg-phone"
                  className="text-[11px] leading-tight"
                >
                  Số điện thoại
                </Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="reg-phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="0912345678"
                    className="pl-9 h-[34px] text-xs"
                    required
                    tabIndex={!isRegister ? -1 : 0}
                  />
                </div>
              </div>

              <div className="space-y-0.5">
                <Label
                  htmlFor="reg-email"
                  className="text-[11px] leading-tight"
                >
                  Email
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="reg-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="email@example.com"
                    className="pl-9 h-[34px] text-xs"
                    required
                    tabIndex={!isRegister ? -1 : 0}
                  />
                </div>
              </div>

              <div className="space-y-0.5">
                <Label htmlFor="reg-pass" className="text-[11px] leading-tight">
                  Mật khẩu
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="reg-pass"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Tối thiểu 6 ký tự"
                    className="pl-9 h-[34px] text-xs"
                    required
                    tabIndex={!isRegister ? -1 : 0}
                  />
                </div>
              </div>

              {/* Shakeable, validated Confirm Password field */}
              <div
                className={`space-y-0.5 transition-all duration-200 ${shouldShakeConfirm ? "animate-shake" : ""}`}
              >
                <Label
                  htmlFor="reg-confirm-pass"
                  className="text-[11px] leading-tight"
                >
                  Xác nhận mật khẩu
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="reg-confirm-pass"
                    type="password"
                    value={confirmPassword}
                    onChange={handleConfirmPasswordChange}
                    onBlur={handleConfirmPasswordBlur}
                    placeholder="Xác nhận lại mật khẩu"
                    className={`pl-9 h-[34px] text-xs transition-colors duration-200 ${
                      confirmPassword !== "" && confirmPassword !== password
                        ? "border-destructive focus-visible:ring-destructive focus-visible:border-destructive"
                        : ""
                    }`}
                    required
                    tabIndex={!isRegister ? -1 : 0}
                    aria-invalid={
                      confirmPassword !== "" && confirmPassword !== password
                        ? "true"
                        : undefined
                    }
                  />
                </div>
                {confirmPassword !== "" && confirmPassword !== password && (
                  <p className="text-[10px] text-destructive font-medium mt-0.5 animate-fade-in">
                    Mật khẩu xác nhận không trùng khớp
                  </p>
                )}
              </div>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-[34px] text-xs mt-1.5 bg-emerald-brand hover:bg-emerald-deep text-white flex items-center justify-center gap-1.5"
                tabIndex={!isRegister ? -1 : 0}
              >
                {isSubmitting && <Loader2 className="size-3.5 animate-spin" />}
                {isSubmitting ? "Đang xử lý..." : "Đăng ký tài khoản"}
              </Button>

              <div className="relative my-1.5">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-white px-2 text-[9px] text-muted-foreground">
                    Hoặc đăng ký nhanh bằng
                  </span>
                </div>
              </div>

              <div className="mt-0.5">
                <div className="group relative h-[34px] rounded-md overflow-hidden flex items-center justify-center">
                  <div
                    ref={googleBtnRegRef}
                    onClick={triggerGoogleLogin}
                    className={cn(
                      "absolute inset-0 z-10 opacity-0 cursor-pointer overflow-hidden flex items-center justify-center [&>div]:w-full [&>iframe]:w-full [&>iframe]:scale-125",
                      !googleClientId && "pointer-events-none"
                    )}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full gap-2 h-[34px] text-xs font-medium text-charcoal border-slate-200 bg-white group-hover:bg-slate-100 group-hover:border-slate-300 group-hover:shadow-sm group-hover:text-black group-hover:scale-[1.005] group-active:scale-[0.99] transition-all duration-200"
                    onClick={triggerGoogleLogin}
                    tabIndex={!isRegister ? -1 : 0}
                  >
                    <svg className="size-4 group-hover:scale-110 transition-transform duration-200" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                    Đăng ký nhanh bằng Google
                  </Button>
                </div>
              </div>
            </form>

            {/* Mobile-only toggle */}
            {isMobile && (
              <button
                onClick={switchMode}
                className="mt-4 w-full text-center text-xs text-emerald-brand font-semibold hover:underline"
              >
                Đã có tài khoản? <span className="underline">Đăng nhập</span>
              </button>
            )}

            <p className="mt-3 text-center text-[10px] text-muted-foreground">
              Bằng việc tiếp tục, bạn đồng ý với Điều khoản và Chính sách bảo
              mật.
            </p>
          </div>

          {/* ──── OVERLAY PANEL (Desktop only) ──── */}
          <div className="auth-slider__overlay" aria-hidden="true">
            <div className="auth-slider__gif-track" />
            <div className="auth-slider__overlay-content">
              {isRegister ? (
                <>
                  <h2 className="brand" style={{ color: "#fff" }}>
                    Đã có tài khoản?
                  </h2>
                  <p>
                    Đăng nhập để tiếp tục tìm phòng trọ và quản lý tài khoản của
                    bạn trên Phòng Trọ Xanh.
                  </p>
                  <button
                    className="auth-slider__overlay-btn"
                    onClick={switchMode}
                    type="button"
                  >
                    Đăng nhập
                  </button>
                </>
              ) : (
                <>
                  <h2 className="brand" style={{ color: "#fff" }}>
                    Chưa có tài khoản?
                  </h2>
                  <p>
                    Đăng ký miễn phí để tìm phòng trọ, kết nối bạn ở ghép và
                    nhận ưu đãi từ Phòng Trọ Xanh.
                  </p>
                  <button
                    className="auth-slider__overlay-btn"
                    onClick={switchMode}
                    type="button"
                  >
                    Đăng ký ngay
                  </button>
                </>
              )}
            </div>
          </div>
        </div>


        {/* ── 2FA / REGISTER OTP MODAL ── */}
        <Dialog open={show2FAModal} onOpenChange={setShow2FAModal}>
          <DialogContent className="sm:max-w-[400px] rounded-2xl p-6">
            <DialogHeader className="space-y-2 flex flex-col items-center text-center">
              <div className="bg-emerald-50 p-2.5 rounded-full mb-1">
                <Shield className="size-6 text-emerald-brand" />
              </div>
              <DialogTitle className="text-base font-bold text-charcoal">
                Xác thực mã OTP qua Email
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground text-center max-w-[300px]">
                Mã xác thực OTP gồm 6 chữ số đã được gửi đến email <strong className="text-foreground">{email}</strong>.
              </DialogDescription>
            </DialogHeader>

            <form
              onSubmit={handleVerify2FA}
              className="space-y-4 pt-2 flex flex-col items-center"
            >
              <div className="space-y-1.5 flex flex-col items-center w-full">
                <Label className="text-xs text-muted-foreground">
                  Nhập mã OTP 6 số
                </Label>
                <div className="py-2">
                  <InputOTP
                    maxLength={6}
                    value={otpValue}
                    onChange={setOtpValue}
                  >
                    <InputOTPGroup>
                      <InputOTPSlot
                        index={0}
                        className="w-10 h-10 text-sm font-semibold"
                      />
                      <InputOTPSlot
                        index={1}
                        className="w-10 h-10 text-sm font-semibold"
                      />
                      <InputOTPSlot
                        index={2}
                        className="w-10 h-10 text-sm font-semibold"
                      />
                      <InputOTPSlot
                        index={3}
                        className="w-10 h-10 text-sm font-semibold"
                      />
                      <InputOTPSlot
                        index={4}
                        className="w-10 h-10 text-sm font-semibold"
                      />
                      <InputOTPSlot
                        index={5}
                        className="w-10 h-10 text-sm font-semibold"
                      />
                    </InputOTPGroup>
                  </InputOTP>
                </div>
                {otpError && (
                  <p className="text-[11px] text-destructive font-medium text-center">
                    {otpError}
                  </p>
                )}

                <div className="flex flex-col items-center gap-1 pt-1 text-xs">
                  {resendCountdown > 0 ? (
                    <span className="text-muted-foreground">
                      Gửi lại mã sau <strong className="text-emerald-deep font-semibold">{resendCountdown}s</strong>
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleResendOtp}
                      className="text-emerald-brand hover:underline font-semibold cursor-pointer"
                    >
                      Gửi lại mã OTP
                    </button>
                  )}
                </div>
              </div>

              <div className="flex gap-2 w-full pt-2">
                <Button
                  type="button"
                  variant="outline"
                  className="w-1/2 h-9 text-xs"
                  onClick={() => setShow2FAModal(false)}
                >
                  Hủy bỏ
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting || otpValue.length < 6}
                  className="w-1/2 h-9 text-xs bg-emerald-brand hover:bg-emerald-deep text-white"
                >
                  {isSubmitting ? "Đang xác thực..." : "Xác nhận"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </ScaleToFitWrapper>
    </PageTransition>
  );
}

export { AuthShell };
