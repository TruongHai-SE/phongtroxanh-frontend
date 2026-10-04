import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import {
  MessageCircle, Users, Search, Trash2, AlertCircle, RefreshCw,
  Sparkles, Award, Shield, CheckCircle2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { matchingApi } from "../api/matchingApi";
import { useProfile } from "@/features/account/hooks/useProfile";
import { getInitials, formatDate, formatVND } from "@/lib/utils";

interface MatchItem {
  matchId: string;
  matchedScore: number;
  partnerId: string;
  partnerName: string;
  partnerAvatar?: string;
  partnerSchool?: string;
  partnerTrustScore?: number;
  conversationId?: string;
  matchedAt?: string;
}

export default function Matches() {
  const navigate = useNavigate();
  const { profile } = useProfile();
  const [matches, setMatches] = useState<MatchItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMatches = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await matchingApi.getMatches();
      if (Array.isArray(data) && data.length > 0) {
        setMatches(
          data.map((m: any) => ({
            matchId: String(m.matchId || m.id),
            matchedScore: m.matchedScore || m.compatibilityScore || 0,
            partnerId: String(m.partnerId || m.user?.id || m.targetUserId),
            partnerName: m.partnerName || m.user?.name || m.user?.fullName || "Bạn cùng phòng",
            partnerAvatar: m.partnerAvatar || m.user?.avatar || m.user?.avatarUrl,
            partnerSchool: m.partnerSchool || m.user?.school || m.user?.schoolOrCompany,
            partnerTrustScore: m.partnerTrustScore ?? m.user?.trustScore ?? 50,
            conversationId: m.conversationId ? String(m.conversationId) : undefined,
            matchedAt: m.matchedAt,
          }))
        );
      } else {
        setMatches([]);
      }
    } catch (err: any) {
      console.warn("Could not load /matching/matches:", err);
      setError(err.message || "Không thể tải danh sách người đã ghép đôi");
      setMatches([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMatches();
  }, []);

  const handleUnmatch = async (matchId: string) => {
    if (!confirm("Bạn có chắc chắn muốn hủy ghép đôi với người này?")) return;
    try {
      await matchingApi.unmatch(matchId);
      setMatches((prev) => prev.filter((m) => m.matchId !== matchId));
    } catch (err: any) {
      alert("Hủy ghép đôi thất bại: " + (err.message || "Vui lòng thử lại"));
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-6 py-8">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6 border-b">
        <div>
          <h1 className="brand text-3xl font-bold text-foreground">Lượt ghép bạn ở</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Danh sách bạn cùng phòng đã ghép đôi hai chiều thành công dựa trên sự tương thích về lối sống và ngân sách.
          </p>
        </div>
        <div>
          <Button
            className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
            onClick={() => navigate("/roommates")}
          >
            <Sparkles className="size-4" /> Quẹt tìm bạn ở ({profile?.swipesLeft ?? 0} lượt còn lại)
          </Button>
        </div>
      </div>

      {/* Main 12-Column Desktop Grid */}
      <div className="mt-8 grid gap-8 lg:grid-cols-12">
        {/* Left / Main Section (8 cols) */}
        <div className="space-y-6 lg:col-span-8">
          {isLoading ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {[1, 2, 3, 4].map((k) => (
                <div key={k} className="rounded-2xl border bg-card p-5 shadow-xs animate-pulse space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="size-14 rounded-full bg-slate-200" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-32 rounded bg-slate-200" />
                      <div className="h-3 w-20 rounded bg-slate-200" />
                    </div>
                  </div>
                  <div className="h-3 w-full rounded bg-slate-200" />
                  <div className="h-8 w-full rounded bg-slate-200" />
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="rounded-2xl border bg-card p-8 text-center shadow-xs">
              <div className="mx-auto grid size-14 place-items-center rounded-full bg-rose-50 text-rose-500">
                <AlertCircle className="size-7" />
              </div>
              <h3 className="mt-3 text-base font-bold text-slate-900">Không thể tải danh sách ghép đôi</h3>
              <p className="mt-1 text-xs text-muted-foreground">{error}</p>
              <Button className="mt-4 gap-2" size="sm" onClick={fetchMatches}>
                <RefreshCw className="size-4" /> Tải lại dữ liệu
              </Button>
            </div>
          ) : matches.length > 0 ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-charcoal">Danh sách người đã ghép đôi ({matches.length})</h2>
                <span className="text-xs text-muted-foreground">Có thể gửi tin nhắn ngay</span>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {matches.map((p) => (
                  <div
                    key={p.matchId}
                    className="flex flex-col justify-between rounded-2xl border bg-card p-5 shadow-xs hover:border-emerald-500/40 hover:shadow-md transition-all"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <Avatar className="size-14 ring-2 ring-emerald-500/20 shrink-0">
                            {p.partnerAvatar ? (
                              <AvatarImage src={p.partnerAvatar} alt={p.partnerName} className="object-cover" />
                            ) : null}
                            <AvatarFallback className="bg-emerald-100 text-emerald-800 font-bold text-base">
                              {getInitials(p.partnerName)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <h3 className="font-bold text-slate-900 truncate text-base">{p.partnerName}</h3>
                            <p className="text-xs text-muted-foreground truncate">
                              {p.partnerSchool || "Chưa cập nhật trường/công ty"}
                            </p>
                            <div className="mt-1 flex items-center gap-2">
                              <Badge variant="secondary" className="text-[11px] bg-emerald-50 text-emerald-800 border-emerald-200">
                                <Award className="size-3 mr-1 text-emerald-600" /> Uy tín: {p.partnerTrustScore ?? 50}
                              </Badge>
                            </div>
                          </div>
                        </div>

                        <Button
                          size="icon"
                          variant="ghost"
                          className="text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                          title="Hủy ghép đôi"
                          onClick={() => handleUnmatch(p.matchId)}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>

                      <div className="mt-4 pt-3 border-t text-xs space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Tương thích:</span>
                          <span className="font-bold text-emerald-700">{p.matchedScore}%</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Thời gian kết nối:</span>
                          <span className="text-slate-700">{p.matchedAt ? formatDate(p.matchedAt) : "Gần đây"}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Trạng thái:</span>
                          <span className={p.conversationId ? "text-emerald-600 font-medium" : "text-slate-500 italic"}>
                            {p.conversationId ? "Đã có đoạn chat" : "Chưa nhắn tin"}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t">
                      <Button
                        className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold"
                        onClick={() => navigate(p.conversationId ? `/chat?cid=${p.conversationId}` : "/chat")}
                      >
                        <MessageCircle className="size-4" /> Nhắn tin ngay
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* Clean Minimal Desktop Empty State - No mock/pseudo candidate cards */
            <div className="rounded-2xl border border-dashed border-slate-200 bg-card p-12 text-center shadow-xs">
              <div className="mx-auto grid size-16 place-items-center rounded-2xl bg-emerald-50 text-emerald-600">
                <Users className="size-8" />
              </div>
              <h3 className="mt-4 text-lg font-bold text-slate-900">Chưa có lượt ghép nào</h3>
              <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground leading-relaxed">
                Khi bạn và một người khác cùng nhấn thích hồ sơ của nhau, danh sách ghép đôi sẽ xuất hiện tại đây để bắt đầu trò chuyện.
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <Button
                  className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
                  onClick={() => navigate("/roommates")}
                >
                  <Search className="size-4" /> Khám phá hồ sơ bạn ở
                </Button>
                <Button variant="outline" onClick={() => navigate("/edit-profile")}>
                  Hoàn thiện hồ sơ tìm bạn
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Right Sidebar (4 cols): User Criteria & Safety Guidelines */}
        <div className="space-y-6 lg:col-span-4">
          {/* Box 1: Matching Criteria Summary */}
          <div className="rounded-2xl border bg-card p-5 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Tiêu chí tìm bạn của bạn</h3>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs text-emerald-600 px-2"
                onClick={() => navigate("/edit-profile")}
              >
                Cập nhật
              </Button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="rounded-lg bg-slate-50 p-2.5 border">
                <span className="text-muted-foreground block text-[11px]">Ngân sách dự kiến:</span>
                <span className="font-bold text-slate-800 text-xs mt-0.5 block">
                  {profile?.budgetMin && profile?.budgetMax
                    ? `${formatVND(profile.budgetMin)} - ${formatVND(profile.budgetMax)}/tháng`
                    : profile?.budgetMax
                    ? `Đến ${formatVND(profile.budgetMax)}/tháng`
                    : "Chưa đặt ngân sách"}
                </span>
              </div>

              <div className="rounded-lg bg-slate-50 p-2.5 border">
                <span className="text-muted-foreground block text-[11px]">Khu vực ưu tiên:</span>
                <span className="font-bold text-slate-800 text-xs mt-0.5 block truncate">
                  {profile?.preferredDistricts?.length
                    ? profile.preferredDistricts.join(", ")
                    : "Chưa chọn quận ưu tiên"}
                </span>
              </div>

              <div className="rounded-lg bg-slate-50 p-2.5 border space-y-1.5">
                <span className="text-muted-foreground block text-[11px]">Thói quen sinh hoạt:</span>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Giờ giấc:</span>
                  <span className="font-medium text-slate-800">
                    {profile?.earlySleeper === true ? "Ngủ sớm" : profile?.earlySleeper === false ? "Thức khuya" : "Chưa cập nhật"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Vệ sinh:</span>
                  <span className="font-medium text-slate-800">
                    {profile?.isNeat === true ? "Gọn gàng" : profile?.isNeat === false ? "Linh hoạt" : "Chưa cập nhật"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Hút thuốc:</span>
                  <span className="font-medium text-slate-800">
                    {profile?.nonSmoking === true ? "Không hút thuốc" : profile?.nonSmoking === false ? "Có hút thuốc" : "Chưa cập nhật"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Box 2: Safety Advice */}
          <div className="rounded-2xl border bg-card p-5 shadow-xs space-y-3">
            <div className="flex items-center gap-2">
              <Shield className="size-4 text-emerald-600" />
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Lưu ý khi tìm bạn ở ghép</h3>
            </div>
            <ul className="space-y-2.5 text-xs text-slate-600 leading-relaxed">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="size-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <span>Nhắn tin trao đổi trước về thói quen sinh hoạt và chi phí sinh hoạt chung.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="size-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <span>Ưu tiên người dùng có huy hiệu <b>Đã xác minh</b> và điểm uy tín cao.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="size-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <span>Hẹn gặp trực tiếp tại địa điểm công cộng hoặc tại phòng trước khi quyết định ở chung.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
