import { useNavigate } from "react-router";
import { LogIn, UserPlus, Sparkles, ShieldCheck, Home, MapPin } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface AuthPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AuthPromptModal({ isOpen, onClose }: AuthPromptModalProps) {
  const navigate = useNavigate();

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
              <Sparkles className="size-4 text-emerald-brand shrink-0 mt-0.5" />
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
              onClick={() => handleAction("/login?mode=register")}
              className="w-full bg-emerald-brand hover:bg-emerald-deep text-white font-medium py-5 rounded-2xl gap-2 shadow-lg shadow-emerald-500/10 transition-transform active:scale-[0.98]"
            >
              <UserPlus className="size-4" /> Đăng ký tài khoản mới
            </Button>
            
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                onClick={() => handleAction("/login")}
                className="border-slate-200 hover:bg-slate-50 text-slate-700 font-medium py-5 rounded-2xl gap-1.5"
              >
                <LogIn className="size-4 text-slate-400" /> Đăng nhập
              </Button>
              
              <Button
                variant="outline"
                onClick={() => handleAction("/login")}
                className="border-slate-200 hover:bg-slate-50 text-slate-700 font-medium py-5 rounded-2xl gap-1.5"
              >
                {/* Google Icon SVG */}
                <svg className="size-4 text-slate-400" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
                </svg>
                Google
              </Button>
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
