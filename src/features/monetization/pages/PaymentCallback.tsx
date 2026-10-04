import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router";
import { CheckCircle2, XCircle, Clock, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { paymentApi } from "../api/paymentApi";

type State = "checking" | "SUCCESS" | "FAILED" | "EXPIRED" | "PENDING" | "CANCELLED" | "ERROR";

const POLL_MS = 3000;
const MAX_TRIES = 10; // webhook usually lands within a few seconds

export default function PaymentCallback() {
  const [params] = useSearchParams();
  const orderCode = params.get("orderCode");
  const cancelled = params.get("cancel") === "true";
  const [state, setState] = useState<State>("checking");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!orderCode) {
      setState("ERROR");
      setError("Thiếu mã đơn hàng.");
      return;
    }
    let tries = 0;
    let timer: ReturnType<typeof setTimeout>;
    let stopped = false;

    const check = async () => {
      try {
        const res = await paymentApi.verifyPaymentReturn({ orderCode });
        const status = res?.status as State;
        if (status === "PENDING") {
          if (cancelled) return setState("CANCELLED");
          if (++tries < MAX_TRIES && !stopped) {
            timer = setTimeout(check, POLL_MS);
            return;
          }
        }
        setState(status || "ERROR");
      } catch (e: any) {
        setState("ERROR");
        setError(e?.message || "Không kiểm tra được giao dịch.");
      }
    };
    check();
    return () => { stopped = true; clearTimeout(timer); };
  }, [orderCode, cancelled]);

  const home = (localStorage.getItem("ptx_role") || "").toUpperCase().includes("LANDLORD")
    ? "/landlord?tab=packages"
    : "/discover";

  const view: Record<State, { icon: React.ReactNode; title: string; desc: string }> = {
    checking: { icon: <Loader2 className="size-10 animate-spin text-primary" />, title: "Đang kiểm tra thanh toán...", desc: "Vui lòng không đóng trang." },
    SUCCESS: { icon: <CheckCircle2 className="size-10 text-primary" />, title: "Thanh toán thành công", desc: "Quyền lợi của gói đã được cộng vào tài khoản." },
    PENDING: { icon: <Clock className="size-10 text-amber-500" />, title: "Đang chờ xác nhận", desc: "Hệ thống chưa nhận được xác nhận từ ngân hàng. Quyền lợi sẽ được cộng tự động khi thanh toán hoàn tất — bạn có thể kiểm tra lại sau ít phút." },
    CANCELLED: { icon: <XCircle className="size-10 text-muted-foreground" />, title: "Đã huỷ thanh toán", desc: "Bạn chưa bị trừ tiền." },
    FAILED: { icon: <XCircle className="size-10 text-destructive" />, title: "Thanh toán thất bại", desc: "Giao dịch không thành công. Bạn chưa nhận được quyền lợi của gói." },
    EXPIRED: { icon: <XCircle className="size-10 text-destructive" />, title: "Giao dịch đã hết hạn", desc: "Mã thanh toán đã hết hạn. Vui lòng tạo giao dịch mới." },
    ERROR: { icon: <XCircle className="size-10 text-destructive" />, title: "Không kiểm tra được giao dịch", desc: error || "Vui lòng thử lại sau." },
  };
  const v = view[state];

  return (
    <div className="min-h-[80vh] grid place-items-center px-4 py-12">
      <div className="w-full max-w-md rounded-3xl bg-card p-8 text-center ring-1 ring-border shadow-sm">
        <div className="mx-auto grid size-16 place-items-center rounded-2xl bg-muted">{v.icon}</div>
        <h1 className="mt-5 text-xl font-bold text-foreground">{v.title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{v.desc}</p>
        {orderCode && <p className="mt-4 text-xs text-muted-foreground">Mã đơn hàng: <span className="font-mono">{orderCode}</span></p>}
        {state !== "checking" && (
          <Link to={home}><Button className="mt-6 w-full">Tiếp tục</Button></Link>
        )}
      </div>
    </div>
  );
}
