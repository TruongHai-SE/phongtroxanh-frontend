import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import {
  ShieldCheck, Star, Home, MessageCircle, Award, Check, ShieldAlert,
  ArrowRight, History
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/utils";

import { useAuth } from "@/app/context/AuthContext";

interface TrustScoreLogItem {
  id: string;
  delta: number;
  finalScore: number;
  reason: string;
  createdAt: string;
}

export default function TrustScore() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isLandlord = user?.role === "landlord";

  const [score, setScore] = useState<number>(0);
  const [kycScore, setKycScore] = useState<number>(0);
  const [reviewScore, setReviewScore] = useState<number>(0);
  const [rentalScore, setRentalScore] = useState<number>(0);
  const [responseScore, setResponseScore] = useState<number>(0);
  const [isVerified, setIsVerified] = useState<boolean>(false);
  const [userBadges, setUserBadges] = useState<string[]>([]);
  const [history, setHistory] = useState<TrustScoreLogItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadTrustScore() {
      setIsLoading(true);
      try {
        const data = await api.get<any>("/users/me/trust-score");
        if (data) {
          if (typeof data.currentScore === "number") setScore(data.currentScore);
          if (typeof data.kycScore === "number") setKycScore(data.kycScore);
          if (typeof data.reviewScore === "number") setReviewScore(data.reviewScore);
          if (typeof data.rentalDurationScore === "number") setRentalScore(data.rentalDurationScore);
          if (typeof data.responseRateScore === "number") setResponseScore(data.responseRateScore);
          if (typeof data.isVerified === "boolean") setIsVerified(data.isVerified);
          if (Array.isArray(data.badges)) setUserBadges(data.badges);
          if (Array.isArray(data.history)) setHistory(data.history);
        }
      } catch (err) {
        console.warn("Could not load /users/me/trust-score:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadTrustScore();
  }, []);

  const breakdown = [
    {
      label: "Xác thực danh tính CCCD",
      value: kycScore,
      max: 30,
      icon: ShieldCheck,
      desc: "Cộng 30 điểm khi hồ sơ xác thực CCCD được phê duyệt thành công.",
    },
    {
      label: "Đánh giá nhận được",
      value: reviewScore,
      max: 30,
      icon: Star,
      desc: isLandlord
        ? "Tính toán từ các lượt đánh giá nhận được từ khách thuê đã ở phòng thực tế."
        : "Tính toán từ các lượt đánh giá nhận được từ chủ trọ và bạn cùng phòng.",
    },
    {
      label: isLandlord ? "Lịch sử cho thuê phòng" : "Lịch sử thuê trọ",
      value: rentalScore,
      max: 20,
      icon: Home,
      desc: isLandlord
        ? "Tính theo số hợp đồng cho thuê phòng đã xác nhận bàn giao thành công trên hệ thống (10 điểm/hợp đồng, tối đa 20 điểm)."
        : "Tính theo số hợp đồng thuê phòng đã xác nhận bàn giao trên hệ thống (10 điểm/hợp đồng, tối đa 20 điểm).",
    },
    {
      label: "Mức độ hoàn thiện hồ sơ",
      value: responseScore,
      max: 20,
      icon: MessageCircle,
      desc: isLandlord
        ? "Cập nhật đầy đủ thông tin chủ trọ, địa chỉ liên hệ và danh mục phòng trọ."
        : "Cập nhật đầy đủ lời giới thiệu, trường học hoặc nơi làm việc, ngân sách dự kiến.",
    },
  ];
  const pillarTotal = breakdown.reduce((sum, b) => sum + b.value, 0);

  const badges = [
    {
      label: "Đã xác minh",
      desc: isVerified ? "CCCD đã được duyệt" : "Chưa hoàn tất xác thực CCCD",
      on: Boolean(isVerified || userBadges.includes("ĐÃ_XÁC_MINH_CCCD") || userBadges.includes("VERIFIED")),
    },
    {
      label: isLandlord ? "Chủ trọ uy tín" : "Người thuê uy tín",
      desc: "Đạt mốc điểm uy tín từ 80+",
      on: Boolean(score >= 80 || userBadges.includes("NGƯỜI_DÙNG_UY_TÍN_CAO") || userBadges.includes("RELIABLE_TENANT")),
    },
    {
      label: isLandlord ? "Hồ sơ chủ trọ chuẩn mực" : "Hồ sơ chuẩn mực",
      desc: isLandlord
        ? "Hoàn thiện thông tin cơ sở & tương tác thường xuyên"
        : "Hoàn thiện hồ sơ & tương tác thường xuyên",
      on: Boolean(responseScore >= 15 || userBadges.includes("FAST_RESPONDER")),
    },
    {
      label: isLandlord ? "Chủ trọ tích cực" : "Người thuê tích cực",
      desc: isLandlord ? "Có lịch sử bàn giao hợp đồng cho thuê" : "Có lịch sử hợp đồng thuê phòng",
      on: Boolean(rentalScore >= 20 || userBadges.includes("LONG_TERM")),
    },
  ];

  const r = 54;
  const c = 2 * Math.PI * r;

  return (
    <div className="mx-auto max-w-7xl px-6 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6 border-b">
        <div>
          <h1 className="brand text-3xl font-bold text-foreground">Điểm uy tín</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Điểm số đánh giá mức độ tin cậy dựa trên xác minh CCCD, lịch sử thuê phòng và đánh giá từ cộng đồng.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => navigate("/profile")}>
            Về trang cá nhân
          </Button>
          {!isVerified && (
            <Button
              size="sm"
              className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={() => navigate("/verify-account")}
            >
              <ShieldCheck className="size-4" /> Xác minh CCCD ngay
            </Button>
          )}
        </div>
      </div>

      {/* KYC Alert Banner */}
      {!isVerified ? (
        <div className="mt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-amber-200 bg-amber-50/80 p-4 shadow-xs">
          <div className="flex items-start sm:items-center gap-3">
            <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-amber-100 text-amber-700">
              <ShieldAlert className="size-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-amber-900">Tài khoản chưa xác thực CCCD</p>
              <p className="text-xs text-amber-700 mt-0.5">
                Nộp CCCD 2 mặt để nhận huy hiệu <b>Đã xác minh</b> và cộng ngay <b>+30 điểm uy tín</b>.
              </p>
            </div>
          </div>
          <Button
            size="sm"
            className="shrink-0 gap-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs"
            onClick={() => navigate("/verify-account")}
          >
            Xác minh ngay <ArrowRight className="size-4" />
          </Button>
        </div>
      ) : (
        <div className="mt-6 flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50/80 p-4 shadow-xs">
          <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-emerald-100 text-emerald-700">
            <ShieldCheck className="size-5" />
          </div>
          <div>
            <p className="text-sm font-bold text-emerald-900">Tài khoản đã xác minh CCCD</p>
            <p className="text-xs text-emerald-700 mt-0.5">
              Hồ sơ của bạn hiển thị dấu tích xanh và được ưu tiên khi tìm bạn ghép phòng.
            </p>
          </div>
        </div>
      )}

      {/* Main Grid */}
      <div className="mt-8 grid gap-8 lg:grid-cols-12">
        {/* Left Column (4 cols): Donut Score & Badges */}
        <div className="space-y-6 lg:col-span-4">
          {/* Donut Card */}
          <div className="rounded-2xl bg-card p-6 ring-1 ring-border shadow-xs text-center">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">Điểm hiện tại</p>

            <div className="relative mx-auto grid size-44 place-items-center">
              <svg className="absolute inset-0 -rotate-90 size-full" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r={r} fill="none" stroke="#f1f5f9" strokeWidth="12" />
                <circle
                  cx="60"
                  cy="60"
                  r={r}
                  fill="none"
                  stroke={score >= 70 ? "#059669" : score >= 50 ? "#0284c7" : "#d97706"}
                  strokeWidth="12"
                  strokeLinecap="round"
                  strokeDasharray={c}
                  strokeDashoffset={c - (score / 100) * c}
                />
              </svg>
              <div className="text-center z-10">
                <p className="brand text-5xl font-black text-slate-900">{isLoading ? "—" : score}</p>
                <p className="text-xs font-semibold text-muted-foreground">/ 100</p>
              </div>
            </div>

            <div className="mt-4">
              <Badge className={`gap-1 px-3 py-1 ${score >= 70 ? "bg-emerald-600 hover:bg-emerald-700 text-white" : "bg-sky-600 hover:bg-sky-700 text-white"}`}>
                <Award className="size-3.5" /> {score >= 80 ? "Uy tín xuất sắc" : score >= 70 ? "Uy tín cao" : "Uy tín trung bình"}
              </Badge>
            </div>

            <p className="mt-4 text-xs text-slate-600 leading-relaxed border-t pt-4">
              {score >= 70
                ? "Tài khoản có độ tin cậy tốt, dễ dàng tạo thiện cảm khi liên hệ chủ trọ và tìm bạn ở ghép."
                : "Hoàn tất xác thực CCCD và cập nhật hồ sơ để gia tăng độ uy tín cho tài khoản của bạn."}
            </p>
          </div>

          {/* Badges Box */}
          <div className="rounded-2xl bg-card p-6 ring-1 ring-border shadow-xs">
            <h2 className="text-base font-bold text-charcoal mb-3">Huy hiệu</h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
              {badges.map((b) => (
                <div
                  key={b.label}
                  className={`flex items-start gap-3 rounded-xl p-3 border transition-all ${
                    b.on ? "bg-emerald-50/60 border-emerald-200" : "bg-slate-50/50 border-slate-200 opacity-60"
                  }`}
                >
                  <div
                    className={`grid size-9 shrink-0 place-items-center rounded-lg ${
                      b.on ? "bg-emerald-600 text-white" : "bg-slate-200 text-slate-400"
                    }`}
                  >
                    {b.on ? <Check className="size-4" /> : <Award className="size-4" />}
                  </div>
                  <div className="min-w-0">
                    <p className={`text-xs font-bold ${b.on ? "text-emerald-950" : "text-slate-600"}`}>{b.label}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">{b.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column (8 cols): 4 Breakdown Items & History Logs */}
        <div className="space-y-6 lg:col-span-8">
          {/* Card 1: 4 Pillars of Trust Score */}
          <div className="rounded-2xl bg-card p-6 ring-1 ring-border shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-bold text-charcoal">Chi tiết điểm số</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Đánh giá trực tiếp từ dữ liệu hồ sơ, hợp đồng và đánh giá hiện có</p>
              </div>
              <Badge variant="outline" className="text-xs font-medium">
                Tổng tiêu chí: {pillarTotal}/100
              </Badge>
            </div>

            <div className="space-y-4">
              {breakdown.map((b) => {
                const percent = Math.min(100, Math.round((b.value / b.max) * 100));
                return (
                  <div key={b.label} className="rounded-xl border border-border/70 p-4 bg-slate-50/40">
                    <div className="flex items-center justify-between text-sm mb-1.5">
                      <span className="font-semibold text-slate-800 flex items-center gap-2">
                        <b.icon className="size-4 text-emerald-600" /> {b.label}
                      </span>
                      <span className="font-bold text-slate-900">
                        {b.value} <span className="text-xs text-muted-foreground font-normal">/ {b.max} điểm</span>
                      </span>
                    </div>
                    <Progress value={percent} className="h-2 mb-2" />
                    <p className="text-xs text-slate-500 leading-snug">{b.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Card 2: Trust Score Logs */}
          <div className="rounded-2xl bg-card p-6 ring-1 ring-border shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <History className="size-5 text-emerald-600" />
                <h2 className="text-base font-bold text-charcoal">Lịch sử biến động điểm uy tín</h2>
              </div>
              <span className="text-xs text-muted-foreground">Ghi nhận từ hệ thống</span>
            </div>

            {history.length > 0 ? (
              <div className="divide-y divide-border/60 overflow-hidden rounded-xl border border-border">
                {history.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-3.5 hover:bg-slate-50/60 transition-colors text-xs">
                    <div className="min-w-0 pr-4">
                      <p className="font-semibold text-slate-800 text-xs sm:text-sm">{item.reason}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        {formatDate(item.createdAt)}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className={`inline-block font-bold text-xs px-2 py-0.5 rounded ${
                        item.delta > 0
                          ? "bg-emerald-100 text-emerald-800"
                          : item.delta < 0
                          ? "bg-rose-100 text-rose-800"
                          : "bg-slate-100 text-slate-700"
                      }`}>
                        {item.delta > 0 ? `+${item.delta}` : item.delta} điểm
                      </span>
                      <p className="text-[11px] text-slate-500 mt-1">
                        Điểm sau thay đổi: <b className="text-slate-800">{item.finalScore}</b>
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-6 text-center">
                <p className="text-xs text-slate-500">Chưa ghi nhận biến động điểm số nào.</p>
                <p className="text-[11px] text-muted-foreground mt-1">
                  Điểm ban đầu mặc định là 50/100. Biến động điểm sẽ được tự động ghi nhận khi bạn xác thực CCCD, hoàn tất hợp đồng thuê hoặc nhận đánh giá.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
