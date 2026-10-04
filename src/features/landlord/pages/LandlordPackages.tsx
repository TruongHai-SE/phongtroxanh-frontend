import { useEffect, useState } from "react";
import { Check, Rocket, Loader2, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { formatVND } from "@/lib/utils";
import { paymentApi, parseFeatures } from "@/features/monetization/api/paymentApi";
import type { PackagePlan, ActiveSubscription } from "@/features/monetization/types/payment.types";

export default function LandlordPackages() {
  const [plans, setPlans] = useState<PackagePlan[]>([]);
  const [subs, setSubs] = useState<ActiveSubscription[]>([]);
  const [boostsLeft, setBoostsLeft] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      paymentApi.getPlans(),
      paymentApi.getMySubscriptions().catch(() => []),
      paymentApi.getMyConsumables().catch(() => null),
    ])
      .then(([p, s, c]) => {
        setPlans(p.filter((x) => x.targetRole === "LANDLORD"));
        setSubs(s);
        setBoostsLeft(c?.boostsLeft ?? 0);
      })
      .catch((e) => toast.error("Không tải được danh sách gói", { description: e?.message }))
      .finally(() => setLoading(false));
  }, []);

  const buy = async (plan: PackagePlan) => {
    setPaying(plan.id);
    try {
      await paymentApi.checkout(plan.id);
    } catch (e: any) {
      toast.error("Không thể tạo thanh toán", { description: e?.message });
      setPaying(null);
    }
  };

  if (loading) {
    return (
      <div className="grid min-h-[300px] place-items-center text-muted-foreground">
        <Loader2 className="size-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6">
      <div>
        <h1 className="brand text-2xl text-foreground">Gói dịch vụ</h1>
        <p className="text-sm text-muted-foreground mt-1">Mua lượt đẩy tin để phòng của bạn hiển thị đầu kết quả tìm kiếm.</p>
      </div>

      <div className="flex flex-wrap items-center gap-6 rounded-2xl bg-card p-5 ring-1 ring-border">
        <div className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-xl bg-mint text-primary"><Rocket className="size-5" /></span>
          <div>
            <p className="text-xs text-muted-foreground">Lượt đẩy tin còn lại</p>
            <p className="text-xl font-bold text-foreground">{boostsLeft ?? "—"}</p>
          </div>
        </div>
        <div className="text-sm">
          <p className="text-xs text-muted-foreground">Gói đang hoạt động</p>
          {subs.length === 0 ? (
            <p className="font-medium text-foreground">Chưa có gói trả phí</p>
          ) : (
            subs.map((s) => (
              <p key={s.planId} className="font-medium text-foreground">
                {s.planName} <span className="text-muted-foreground font-normal">• hết hạn {new Date(s.endDate).toLocaleDateString("vi-VN")}</span>
              </p>
            ))
          )}
        </div>
      </div>

      <div className="rounded-2xl bg-mint/40 p-4 text-xs text-muted-foreground ring-1 ring-primary/10 space-y-1">
        <p><b className="text-foreground">Cách đẩy tin hoạt động:</b> mỗi lượt đưa 1 phòng còn trống lên đầu kết quả tìm kiếm trong 7 ngày.</p>
        <p>Nhiều phòng cùng được đẩy thì phòng còn thời gian đẩy dài hơn đứng trước (thường là phòng đẩy gần nhất). Đẩy lại phòng đang được đẩy sẽ cộng thêm 7 ngày.</p>
        <p>Dùng lượt khi đăng phòng mới hoặc trong mục “Phòng của tôi”.</p>
      </div>

      {plans.length === 0 ? (
        <p className="text-center text-sm text-muted-foreground py-10">Hiện chưa có gói nào dành cho chủ trọ.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {plans.map((plan) => {
            const f = parseFeatures(plan);
            const active = subs.some((s) => s.planId === plan.id);
            return (
              <div key={plan.id} className="flex flex-col rounded-2xl bg-card p-6 ring-1 ring-border">
                <div className="flex items-center gap-2">
                  <Zap className="size-5 text-primary" />
                  <h3 className="font-semibold text-foreground">{plan.name}</h3>
                  {active && <span className="ml-auto rounded-full bg-mint px-2 py-0.5 text-[11px] font-semibold text-primary">Đang dùng</span>}
                </div>
                <p className="mt-4 text-3xl font-bold text-foreground">{formatVND(plan.priceMonthly)}</p>
                <ul className="mt-4 space-y-2 text-sm flex-1">
                  {f.boosts > 0 && (
                    <li className="flex gap-2"><Check className="size-4 text-primary shrink-0 mt-0.5" /> Cộng {f.boosts} lượt đẩy tin vào tài khoản</li>
                  )}
                  <li className="flex gap-2"><Check className="size-4 text-primary shrink-0 mt-0.5" /> Thanh toán một lần qua payOS (QR ngân hàng)</li>
                  <li className="flex gap-2"><Check className="size-4 text-primary shrink-0 mt-0.5" /> Lượt chưa dùng được giữ lại trong tài khoản</li>
                </ul>
                <Button className="mt-6 w-full gap-2" disabled={paying !== null} onClick={() => buy(plan)}>
                  {paying === plan.id ? <><Loader2 className="size-4 animate-spin" /> Đang chuyển đến payOS...</> : active ? "Mua thêm" : "Mua gói"}
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
