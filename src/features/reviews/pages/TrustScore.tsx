import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import {
  ShieldCheck, Star, Home, UserCheck, Award, Check, ShieldAlert,
  ArrowRight, History, CircleDot
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
  const [strikeCount, setStrikeCount] = useState<number>(0);
  const [penaltyScore, setPenaltyScore] = useState<number>(0);
  const [isVerified, setIsVerified] = useState<boolean>(false);
  const [userBadges, setUserBadges] = useState<string[]>([]);
  const [history, setHistory] = useState<TrustScoreLogItem[]>([]);
  const [profileData, setProfileData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadTrustScore() {
      setIsLoading(true);
      try {
        const [data, me] = await Promise.all([
          api.get<any>("/users/me/trust-score"),
          api.get<any>("/users/me").catch(() => null),
        ]);
        if (me) setProfileData(me);
        if (data) {
          if (typeof data.currentScore === "number") setScore(data.currentScore);
          if (typeof data.kycScore === "number") setKycScore(data.kycScore);
          if (typeof data.reviewScore === "number") setReviewScore(data.reviewScore);
          if (typeof data.rentalDurationScore === "number") setRentalScore(data.rentalDurationScore);
          if (typeof data.responseRateScore === "number") setResponseScore(data.responseRateScore);
          if (typeof data.strikeCount === "number") setStrikeCount(data.strikeCount);
          if (typeof data.penaltyScore === "number") setPenaltyScore(data.penaltyScore);
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

  const hasPhoto = Boolean(
    profileData?.avatarUrl ||
    user?.avatarUrl ||
    (Array.isArray(profileData?.galleryImages) && profileData.galleryImages.length > 0)
  );
  const hasBio = Boolean(profileData?.bio && String(profileData.bio).trim());
  const hasSchoolOrAddress = isLandlord
    ? Boolean(profileData?.address && String(profileData.address).trim())
    : Boolean((profileData?.schoolOrCompany || user?.schoolOrCompany) && String(profileData?.schoolOrCompany || user?.schoolOrCompany).trim());
  const hasPrefs = isLandlord
    ? Boolean(Array.isArray(profileData?.preferredDistricts) && profileData.preferredDistricts.length > 0)
    : Boolean(
        profileData?.budgetMin != null &&
        profileData?.budgetMax != null &&
        Array.isArray(profileData?.preferredDistricts) &&
        profileData.preferredDistricts.length > 0
      );

  const profileChecklist = [
    {
      label: isLandlord ? "Địa chỉ liên hệ khu trọ (+10đ)" : "Trường học hoặc nơi làm việc (+10đ)",
      done: hasSchoolOrAddress,
    },
    {
      label: isLandlord ? "Giới thiệu khu trọ (+10đ)" : "Lời giới thiệu bản thân (+10đ)",
      done: hasBio,
    },
    {
      label: isLandlord ? "Khu vực cho thuê chính (+10đ)" : "Khu vực & ngân sách tìm phòng (+10đ)",
      done: hasPrefs,
    },
    {
      label: "Ảnh đại diện hoặc hình ảnh giới thiệu (+5đ)",
      done: hasPhoto,
    },
  ];

  const breakdown = [
    {
      label: "Xác thực tài khoản",
      value: kycScore,
      max: 35,
      icon: ShieldCheck,
      desc: "Bao gồm thông tin liên hệ hợp lệ (+10 điểm) và xác thực Căn cước công dân (+25 điểm).",
    },
    {
      label: "Thông tin hồ sơ",
      value: responseScore,
      max: 35,
      icon: UserCheck,
      desc: isLandlord
        ? "Hoàn thiện địa chỉ liên hệ, lời giới thiệu khu trọ, khu vực cho thuê và hình ảnh."
        : "Hoàn thiện trường học/nơi làm việc, lời giới thiệu bản thân, nhu cầu tìm phòng và hình ảnh.",
      checklist: profileChecklist,
    },
    {
      label: "Đánh giá & Tuân thủ cộng đồng",
      value: reviewScore,
      max: 15,
      icon: Star,
      desc: isLandlord
        ? "Duy trì hồ sơ hoạt động tốt không vi phạm (+5 điểm) và nhận đánh giá tích cực từ người thuê (+10 điểm)."
        : "Duy trì hồ sơ văn minh không vi phạm (+5 điểm) và nhận đánh giá tốt từ chủ trọ, bạn cùng phòng (+10 điểm).",
    },
    {
      label: isLandlord ? "Hoạt động & Cho thuê phòng" : "Hoạt động & Thuê phòng",
      value: rentalScore,
      max: 15,
      icon: Home,
      desc: isLandlord
        ? "Hoạt động thường xuyên (+5 điểm) và có phòng bàn giao cho khách thuê thành công (+10 điểm)."
        : "Hoạt động thường xuyên (+5 điểm) và có hợp đồng nhận phòng thực tế (+10 điểm).",
    },
  ];

  const badges = [
    {
      label: "Đã xác minh",
      desc: isVerified ? "Căn cước đã được xác thực" : "Chưa xác thực Căn cước",
      on: Boolean(isVerified || userBadges.includes("ĐÃ_XÁC_MINH_CCCD") || userBadges.includes("VERIFIED")),
    },
    {
      label: isLandlord ? "Chủ trọ uy tín" : "Thành viên uy tín",
      desc: "Đạt mốc điểm uy tín từ 80 trở lên",
      on: Boolean(score >= 80 || userBadges.includes("NGƯỜI_DÙNG_UY_TÍN_CAO") || userBadges.includes("RELIABLE_TENANT")),
    },
    {
      label: "Hồ sơ đầy đủ",
      desc: "Cung cấp đầy đủ thông tin giới thiệu và nhu cầu",
      on: Boolean(responseScore >= 30 || userBadges.includes("FAST_RESPONDER")),
    },
    {
      label: isLandlord ? "Chủ trọ tích cực" : "Người thuê tích cực",
      desc: isLandlord ? "Đã bàn giao phòng cho khách thuê" : "Đã có giao dịch thuê phòng thực tế",
      on: Boolean(rentalScore >= 15 || userBadges.includes("LONG_TERM")),
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
            Thước đo độ tin cậy của hồ sơ giúp bạn dễ dàng kết nối với chủ trọ và bạn cùng phòng phù hợp.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => navigate("/edit-profile")}>
            Chỉnh sửa hồ sơ
          </Button>
          {!isVerified && (
            <Button
              size="sm"
              className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={() => navigate("/verify-account")}
            >
              <ShieldCheck className="size-4" /> Xác thực Căn cước
            </Button>
          )}
        </div>
      </div>

      {/* Violation Notice if any */}
      {strikeCount > 0 && (
        <div className="mt-6 flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50/90 p-4 shadow-xs">
          <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-rose-100 text-rose-700">
            <ShieldAlert className="size-5" />
          </div>
          <div>
            <p className="text-sm font-bold text-rose-900">
              Tài khoản đang có {strikeCount}/3 lần nhắc nhở vi phạm quy định cộng đồng
            </p>
            <p className="text-xs text-rose-700 mt-0.5">
              Điểm uy tín hiện bị trừ <b>{penaltyScore} điểm</b>. Vui lòng đảm bảo thông tin đăng tải trung thực và tuân thủ quy định chung để tránh bị tạm ngừng tài khoản khi chạm mức 3/3.
            </p>
          </div>
        </div>
      )}

      {/* KYC Alert Banner */}
      {!isVerified ? (
        <div className="mt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-amber-200 bg-amber-50/80 p-4 shadow-xs">
          <div className="flex items-start sm:items-center gap-3">
            <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-amber-100 text-amber-700">
              <ShieldAlert className="size-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-amber-900">Tài khoản chưa xác thực Căn cước</p>
              <p className="text-xs text-amber-700 mt-0.5">
                Xác thực Căn cước 2 mặt để nhận huy hiệu <b>Đã xác minh</b> và cộng ngay <b>+25 điểm uy tín</b>.
              </p>
            </div>
          </div>
          <Button
            size="sm"
            className="shrink-0 gap-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs"
            onClick={() => navigate("/verify-account")}
          >
            Xác thực ngay <ArrowRight className="size-4" />
          </Button>
        </div>
      ) : (
        <div className="mt-6 flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50/80 p-4 shadow-xs">
          <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-emerald-100 text-emerald-700">
            <ShieldCheck className="size-5" />
          </div>
          <div>
            <p className="text-sm font-bold text-emerald-900">Tài khoản đã xác thực Căn cước</p>
            <p className="text-xs text-emerald-700 mt-0.5">
              Hồ sơ của bạn hiển thị dấu tích xanh và được ưu tiên khi kết nối trên hệ thống.
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
                <Award className="size-3.5" /> {score >= 80 ? "Uy tín xuất sắc" : score >= 70 ? "Uy tín cao" : "Đang hoàn thiện"}
              </Badge>
            </div>

            <p className="mt-4 text-xs text-slate-600 leading-relaxed border-t pt-4">
              {score >= 70
                ? "Hồ sơ có độ tin cậy cao, tạo sự yên tâm khi liên hệ thuê phòng và tìm bạn ở ghép."
                : "Bổ sung lời giới thiệu, hình ảnh cá nhân và xác thực Căn cước để đạt mức Uy tín cao (75+ điểm)."}
            </p>
          </div>

          {/* Badges Box */}
          <div className="rounded-2xl bg-card p-6 ring-1 ring-border shadow-xs">
            <h2 className="text-base font-bold text-charcoal mb-3">Danh hiệu đạt được</h2>
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
                <h2 className="text-base font-bold text-charcoal">Chi tiết điểm uy tín</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Hoàn thành các mục bên dưới để nâng cao điểm uy tín của bạn</p>
              </div>
              <Badge variant="outline" className="text-xs font-medium">
                Tổng điểm: {score}/100
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

                    {b.checklist && (
                      <div className="mt-3 grid gap-1.5 sm:grid-cols-2 border-t border-slate-200/70 pt-2.5">
                        {b.checklist.map((item) => (
                          <div
                            key={item.label}
                            className={`flex items-center gap-1.5 text-xs ${
                              item.done ? "text-emerald-700 font-medium" : "text-slate-500"
                            }`}
                          >
                            {item.done ? (
                              <Check className="size-3.5 text-emerald-600 shrink-0" />
                            ) : (
                              <CircleDot className="size-3.5 text-amber-500 shrink-0" />
                            )}
                            <span>{item.label}</span>
                          </div>
                        ))}
                      </div>
                    )}
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
                <h2 className="text-base font-bold text-charcoal">Lịch sử thay đổi điểm</h2>
              </div>
              <span className="text-xs text-muted-foreground">Cập nhật tự động</span>
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
                        Điểm sau cập nhật: <b className="text-slate-800">{item.finalScore}</b>
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-6 text-center">
                <p className="text-xs text-slate-500">Chưa có biến động điểm bổ sung nào.</p>
                <p className="text-[11px] text-muted-foreground mt-1">
                  Các thay đổi khi bạn xác thực Căn cước, nhận đánh giá mới hoặc hoàn tất hợp đồng sẽ hiển thị tại đây.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
