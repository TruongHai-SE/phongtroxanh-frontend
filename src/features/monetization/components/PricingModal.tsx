import { useEffect, useState } from "react";
import { X, Crown, Check, Loader2, Rocket } from "lucide-react";
import { toast } from "sonner";
import { useMonetization } from "@/app/context/MonetizationContext";
import { Button } from "@/components/ui/button";
import { formatVND } from "@/lib/utils";
import { api } from "@/lib/api";
import { paymentApi, parseFeatures } from "../api/paymentApi";
import type { PackagePlan, ActiveSubscription } from "../types/payment.types";

/** Tenant plans, loaded from the server and paid via payOS. */
export function PricingModal() {
  const { isPricingOpen, closePricing, swipesLeft, maxSwipes, boostsLeft, refresh } = useMonetization();
  const [plans, setPlans] = useState<PackagePlan[]>([]);
  const [subs, setSubs] = useState<ActiveSubscription[]>([]);
  const [loading, setLoading] = useState(false);
  const [paying, setPaying] = useState<string | null>(null);
  const [boosting, setBoosting] = useState(false);

  useEffect(() => {
    if (!isPricingOpen) return;
    setLoading(true);
    Promise.all([paymentApi.getPlans(), paymentApi.getMySubscriptions().catch(() => [])])
      .then(([p, s]) => {
        setPlans(p.filter((x) => x.targetRole === "TENANT"));
        setSubs(s);
      })
      .catch((e) => toast.error("Không tải được danh sách gói", { description: e?.message }))
      .finally(() => setLoading(false));
  }, [isPricingOpen]);

  if (!isPricingOpen) return null;

  const buy = async (id: string) => {
    setPaying(id);
    try {
      await paymentApi.checkout(id);
    } catch (e: any) {
      toast.error("Không thể tạo thanh toán", { description: e?.message });
      setPaying(null);
    }
  };

  const boostProfile = async () => {
    setBoosting(true);
    try {
      await api.post("/matching/boost");
      toast.success("Hồ sơ của bạn được ưu tiên hiển thị trong 24 giờ");
      await refresh();
    } catch (e: any) {
      toast.error("Không thể đẩy hồ sơ", { description: e?.message });
    } finally {
      setBoosting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-4xl overflow-hidden rounded-3xl bg-card shadow-2xl ring-1 ring-border">
        <button
          onClick={closePricing}
          className="absolute right-5 top-5 rounded-full p-2 text-muted-foreground hover:bg-muted z-10 cursor-pointer"
        >
          <X className="size-5" />
        </button>

        <div className="p-6 sm:p-8 max-h-[90vh] overflow-y-auto space-y-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-foreground">Gói dành cho người thuê</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Hôm nay còn <b className="text-foreground">{swipesLeft}/{maxSwipes}</b> lượt quẹt • {boostsLeft} lượt đẩy hồ sơ
            </p>
          </div>

          {loading ? (
            <div className="grid min-h-[200px] place-items-center"><Loader2 className="size-6 animate-spin text-primary" /></div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {plans.map((plan) => {
                const f = parseFeatures(plan);
                const free = Number(plan.priceMonthly) === 0;
                const sub = subs.find((s) => s.planId === plan.id);
                return (
                  <div key={plan.id} className="flex flex-col rounded-2xl p-6 ring-1 ring-border">
                    <div className="flex items-center gap-2">
                      {!free && <Crown className="size-4 text-amber-500" />}
                      <h3 className="font-semibold text-foreground">{plan.name}</h3>
                      {(sub || (free && subs.length === 0)) && (
                        <span className="ml-auto rounded-full bg-mint px-2 py-0.5 text-[11px] font-semibold text-primary">Đang dùng</span>
                      )}
                    </div>
                    <p className="mt-3 text-2xl font-bold text-foreground">
                      {free ? "Miễn phí" : <>{formatVND(plan.priceMonthly)}<span className="text-sm font-normal text-muted-foreground">/30 ngày</span></>}
                    </p>
                    {sub && <p className="text-xs text-muted-foreground">Hết hạn {new Date(sub.endDate).toLocaleDateString("vi-VN")}</p>}
                    <ul className="mt-4 space-y-2 text-sm flex-1">
                      <li className="flex gap-2"><Check className="size-4 text-primary shrink-0 mt-0.5" /> {f.swipes_per_day} lượt quẹt mỗi ngày</li>
                      {f.boosts > 0 && (
                        <li className="flex gap-2"><Check className="size-4 text-primary shrink-0 mt-0.5" /> Tặng {f.boosts} lượt đẩy hồ sơ (ưu tiên hiển thị 24 giờ/lượt)</li>
                      )}
                    </ul>
                    {!free && (
                      <Button className="mt-5 w-full gap-2" disabled={paying !== null} onClick={() => buy(plan.id)}>
                        {paying === plan.id ? <><Loader2 className="size-4 animate-spin" /> Đang chuyển đến payOS...</> : sub ? "Gia hạn" : "Mua gói"}
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {boostsLeft > 0 && (
            <div className="flex items-center gap-3 rounded-2xl bg-mint/50 p-4 ring-1 ring-primary/20">
              <Rocket className="size-5 text-primary shrink-0" />
              <p className="flex-1 text-sm text-foreground">Đẩy hồ sơ tìm bạn ở ghép lên đầu trong 24 giờ (dùng 1 lượt).</p>
              <Button size="sm" disabled={boosting} onClick={boostProfile}>
                {boosting ? <Loader2 className="size-4 animate-spin" /> : "Dùng ngay"}
              </Button>
            </div>
          )}

          <p className="text-center text-[11px] text-muted-foreground">Thanh toán qua payOS (QR ngân hàng). Quyền lợi được cộng sau khi ngân hàng xác nhận.</p>
        </div>
      </div>
    </div>
  );
}
