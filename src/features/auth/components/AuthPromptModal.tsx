import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { LogIn, UserPlus, Users, ShieldCheck, Home, MapPin } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/app/context/AuthContext";
import { authApi } from "../api/authApi";
import { cn } from "@/lib/utils";

interface AuthPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AuthPromptModal({ isOpen, onClose }: AuthPromptModalProps) {
  const navigate = useNavigate();
  const { loginWithGoogle } = useAuth();
  const googleBtnRef = useRef<HTMLDivElement>(null);

  const [googleClientId, setGoogleClientId] = useState<string>(() => {
    const envId = (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID;
    if (envId && typeof envId === "string" && envId.trim()) return envId.trim();
    try {
      const cached = sessionStorage.getItem("GOOGLE_CLIENT_ID");
      if (cached && cached.trim()) return cached.trim();
    } catch {
      // ignore
    }
    return "";
  });

  useEffect(() => {
    if (!googleClientId) {
      authApi.getGoogleClientId().then((id) => {
        if (id) setGoogleClientId(id);
      });
    }
  }, [googleClientId]);

  const cleanupGoogleBridge = () => {
    (window as any).__ptxGooglePopupBridgeActive = false;
    const bridge = document.getElementById("ptx-google-gsi-bridge");
    if (bridge) bridge.remove();
  };

  const handleGoogleCredentialResponse = async (response: any) => {
    cleanupGoogleBridge();
    const idToken = response?.credential;
    if (!idToken) {
      toast.error("Không nhận được mã xác thực từ Google");
      return;
    }
    try {
      const { user: authUser, isNewUser, isOnboarded } = await loginWithGoogle(idToken);
      onClose();
      const isLandlord = authUser.role === "landlord";
      const shouldOnboard =
        authUser.role !== "admin" &&
        (isNewUser ? true : isLandlord ? false : !isOnboarded || !authUser.isOnboarded);
      if (shouldOnboard) {
        toast.success(
          `Chào mừng ${authUser.fullName || authUser.name}! Vui lòng trả lời một số câu hỏi để hoàn tất hồ sơ.`
        );
        navigate(isLandlord ? "/onboarding/landlord" : "/onboarding/role");
      } else {
        toast.success(`Đăng nhập Google thành công: ${authUser.fullName || authUser.name}`);
        navigate(isLandlord ? "/landlord" : authUser.role === "admin" ? "/admin" : "/discover");
      }
    } catch (err: any) {
      toast.error(err.message || "Đăng nhập Google thất bại");
    }
  };

  useEffect(() => {
    if (!isOpen || !googleClientId) return;

    const initGsi = () => {
      if ((window as any).google?.accounts?.id && googleBtnRef.current) {
        try {
          (window as any).google.accounts.id.initialize({
            client_id: googleClientId,
            callback: handleGoogleCredentialResponse,
            auto_select: false,
            cancel_on_tap_outside: true,
          });
          googleBtnRef.current.innerHTML = "";
          (window as any).google.accounts.id.renderButton(googleBtnRef.current, {
            theme: "outline",
            size: "large",
            type: "standard",
            shape: "rectangular",
            text: "signin_with",
            logo_alignment: "left",
            width: 220,
          });
          return true;
        } catch (err) {
          console.warn("Could not render Google GSI button in AuthPromptModal:", err);
        }
      }
      return false;
    };

    const timeout = window.setTimeout(() => {
      if (!initGsi()) {
        const interval = window.setInterval(() => {
          if (initGsi()) window.clearInterval(interval);
        }, 200);
        window.setTimeout(() => window.clearInterval(interval), 4000);
      }
    }, 50);

    // Detect when the user clicks the Google iframe inside AuthPromptModal:
    // keep the iframe alive in document.body so window.opener for the Google popup stays intact,
    // while simultaneously transitioning the main window to /login!
    const handleWindowBlur = () => {
      const container = googleBtnRef.current;
      if (!container) return;
      const activeEl = document.activeElement;
      if (activeEl && (activeEl === container || container.contains(activeEl))) {
        window.setTimeout(() => {
          cleanupGoogleBridge();
          const bridge = document.createElement("div");
          bridge.id = "ptx-google-gsi-bridge";
          bridge.style.cssText =
            "position:fixed;left:-9999px;top:-9999px;width:1px;height:1px;opacity:0;pointer-events:none;z-index:-1;";
          while (container.firstChild) {
            bridge.appendChild(container.firstChild);
          }
          document.body.appendChild(bridge);
          (window as any).__ptxGooglePopupBridgeActive = true;
          window.setTimeout(cleanupGoogleBridge, 60000);
          onClose();
          navigate("/login?google=1");
        }, 180);
      }
    };

    window.addEventListener("blur", handleWindowBlur);
    return () => {
      window.clearTimeout(timeout);
      window.removeEventListener("blur", handleWindowBlur);
    };
  }, [isOpen, googleClientId]);

  const handleAction = (path: string) => {
    onClose();
    navigate(path);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()} modal={true}>
      <DialogContent className="sm:max-w-[460px] p-0 overflow-hidden rounded-3xl border-slate-100 shadow-2xl bg-white/95 backdrop-blur-md">

        {/* Header Visual */}
        <div className="relative h-32 bg-gradient-to-br from-emerald-500/10 via-mint/30 to-teal-500/5 p-6 flex flex-col justify-end overflow-hidden">
          <div className="absolute right-6 top-6 size-24 rounded-full bg-primary/5 blur-xl pointer-events-none" />
          <div className="absolute left-1/3 top-[-10%] size-28 rounded-full bg-mint/40 blur-2xl pointer-events-none" />
          
          <div className="relative flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-brand text-white shadow-lg shadow-emerald-500/20">
              <svg width="20" height="20" viewBox="0 0 32 32" fill="currentColor">
                <path d="M16 6l8 6v12h-5v-7h-6v7H8V12l8-6z" />
              </svg>
            </span>
            <div>
              <span className="text-xs font-semibold text-emerald-brand uppercase tracking-wider">Phòng Trọ Xanh</span>
              <h3 className="font-display text-lg font-bold text-emerald-deep">Khám Phá Chi Tiết</h3>
            </div>
          </div>
        </div>

        <div className="p-6 pt-5 space-y-6">
          <DialogHeader className="text-left space-y-2">
            <DialogTitle className="font-display text-xl font-bold text-slate-800 leading-tight">
              Bạn muốn xem thông tin phòng đầy đủ?
            </DialogTitle>
            <DialogDescription className="text-sm text-slate-500 leading-relaxed">
              Hãy đăng nhập hoặc tạo tài khoản để xem chi tiết phòng trọ, độ tương thích phong cách sống và kết nối trực tiếp với chủ nhà/bạn ở ghép.
            </DialogDescription>
          </DialogHeader>

          {/* Premium Value Props List */}
          <div className="grid grid-cols-2 gap-3 text-xs text-slate-600 bg-slate-50/70 p-3.5 rounded-2xl border border-slate-100">
            <div className="flex items-start gap-2">
              <Users className="size-4 text-emerald-brand shrink-0 mt-0.5" />
              <span>Độ tương thích lối sống</span>
            </div>
            <div className="flex items-start gap-2">
              <ShieldCheck className="size-4 text-emerald-brand shrink-0 mt-0.5" />
              <span>Định danh CCCD thật</span>
            </div>
            <div className="flex items-start gap-2">
              <Home className="size-4 text-emerald-brand shrink-0 mt-0.5" />
              <span>Hợp đồng & Đánh giá thật</span>
            </div>
            <div className="flex items-start gap-2">
              <MapPin className="size-4 text-emerald-brand shrink-0 mt-0.5" />
              <span>Khoảng cách trường học</span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col gap-2.5">
            <Button
              type="button"
              onClick={() => handleAction("/login?mode=register")}
              className="group w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-5 rounded-2xl gap-2 shadow-[0_8px_20px_-6px_rgba(5,150,105,0.4)] hover:shadow-[0_12px_26px_-6px_rgba(5,150,105,0.55)] hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] transition-all duration-150 ease-[cubic-bezier(0.22,1,0.36,1)] cursor-pointer"
            >
              <UserPlus className="size-4 transition-transform duration-150 group-hover:scale-110" />
              Đăng ký tài khoản mới
            </Button>
            
            <div className="grid grid-cols-2 gap-2.5">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleAction("/login")}
                className="group border-slate-200/90 bg-white text-slate-700 font-semibold py-5 rounded-2xl gap-1.5 hover:border-emerald-500/50 hover:bg-emerald-50/70 hover:text-emerald-800 hover:shadow-[0_6px_16px_-6px_rgba(6,95,70,0.14)] hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] transition-all duration-150 ease-[cubic-bezier(0.22,1,0.36,1)] cursor-pointer"
              >
                <LogIn className="size-4 text-slate-400 transition-colors duration-150 group-hover:text-emerald-600" />
                Đăng nhập
              </Button>
              
              <div className="group relative rounded-2xl overflow-hidden flex items-center justify-center transition-all duration-150 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-0.5 hover:shadow-[0_6px_16px_-6px_rgba(6,95,70,0.14)] active:translate-y-0 active:scale-[0.98]">
                <div
                  ref={googleBtnRef}
                  onClick={() => handleAction("/login?google=1")}
                  className={cn(
                    "absolute inset-0 z-10 opacity-0 cursor-pointer overflow-hidden flex items-center justify-center [&>div]:w-full [&>iframe]:w-full [&>iframe]:scale-125",
                    !googleClientId && "pointer-events-none"
                  )}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleAction("/login?google=1")}
                  className="w-full border-slate-200/90 bg-white text-slate-700 font-semibold py-5 rounded-2xl gap-2 group-hover:border-emerald-500/50 group-hover:bg-emerald-50/70 group-hover:text-emerald-800 transition-colors duration-150 cursor-pointer"
                >
                  <svg className="size-4 transition-transform duration-150 group-hover:scale-110" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
                  </svg>
                  Google
                </Button>
              </div>
            </div>
          </div>

          <div className="text-center text-[10px] text-slate-400 leading-normal">
            Bằng việc nhấn vào các tùy chọn trên, bạn đồng ý với Điều khoản sử dụng và Chính sách bảo mật của Phòng Trọ Xanh.
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
