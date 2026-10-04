import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import {
  Users, Home, Star, TrendingUp, AlertCircle,
  MessageSquare, Activity, RefreshCw, ShieldCheck,
  DollarSign, Building2, UserCheck, CheckCircle2,
  Calendar, CreditCard, ChevronRight, Shield, ArrowUpRight
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatVND, cn } from "@/lib/utils";
import { useNavigate } from "react-router";

type DashboardStats = {
  totalUsers: number;
  totalLandlords: number;
  totalTenants: number;
  totalRooms: number;
  activeRooms: number;
  totalMatches: number;
  totalRentals: number;
  activeRentals: number;
  pendingKycCount: number;
  pendingDisputesCount: number;
  totalRevenue: number;
  totalReviews: number;
  averageRating: number;
  verifiedUsersCount: number;
  monthlyStats: Array<{
    month: string;
    newUsers: number;
    newRentals: number;
    revenue: number;
  }>;
  trustScoreDistribution: Array<{
    range: string;
    count: number;
    percentage: number;
  }>;
  ratingDistribution: Array<{
    star: number;
    count: number;
    percentage: number;
  }>;
  recentReviews: Array<{
    id: string;
    reviewerName: string;
    reviewerRole: string;
    rating: number;
    comment: string;
    roomTitle: string;
    createdAt: string;
  }>;
  packageStats: Array<{
    planId: string;
    planName: string;
    revenue: number;
    count: number;
  }>;
  roomTypeDistribution: Array<{
    name: string;
    count: number;
    percentage: number;
  }>;
  districtDistribution: Array<{
    name: string;
    count: number;
    percentage: number;
  }>;
  roomStatusDistribution: Array<{
    name: string;
    count: number;
    percentage: number;
  }>;
  kycOverview: {
    pendingCount: number;
    approvedCount: number;
    rejectedCount: number;
    approvalRate: number;
  } | null;
};

export default function AdminOverview() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await api.get<any>("/admin/dashboard");
      const d = res?.data || res;
      setStats({
        totalUsers: d.totalUsers ?? 0,
        totalLandlords: d.totalLandlords ?? 0,
        totalTenants: d.totalTenants ?? 0,
        totalRooms: d.totalRooms ?? 0,
        activeRooms: d.activeRooms ?? 0,
        totalMatches: d.totalMatches ?? 0,
        totalRentals: d.totalRentals ?? 0,
        activeRentals: d.activeRentals ?? 0,
        pendingKycCount: d.pendingKycCount ?? 0,
        pendingDisputesCount: d.pendingDisputesCount ?? 0,
        totalRevenue: d.totalRevenue ?? 0,
        totalReviews: d.totalReviews ?? 0,
        averageRating: d.averageRating ?? 0,
        verifiedUsersCount: d.verifiedUsersCount ?? 0,
        monthlyStats: d.monthlyStats || [],
        trustScoreDistribution: d.trustScoreDistribution || [],
        ratingDistribution: d.ratingDistribution || [],
        recentReviews: d.recentReviews || [],
        packageStats: d.packageStats || [],
        roomTypeDistribution: d.roomTypeDistribution || [],
        districtDistribution: d.districtDistribution || [],
        roomStatusDistribution: d.roomStatusDistribution || [],
        kycOverview: d.kycOverview || null,
      });
    } catch {
      // In case of network error, initialize empty real container
      setStats({
        totalUsers: 0,
        totalLandlords: 0,
        totalTenants: 0,
        totalRooms: 0,
        activeRooms: 0,
        totalMatches: 0,
        totalRentals: 0,
        activeRentals: 0,
        pendingKycCount: 0,
        pendingDisputesCount: 0,
        totalRevenue: 0,
        totalReviews: 0,
        averageRating: 0,
        verifiedUsersCount: 0,
        monthlyStats: [],
        trustScoreDistribution: [],
        ratingDistribution: [],
        recentReviews: [],
        packageStats: [],
        roomTypeDistribution: [],
        districtDistribution: [],
        roomStatusDistribution: [],
        kycOverview: null,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  // Compute maximum monthly users to scale SVG bars properly
  const maxMonthlyUsers = Math.max(
    ...(stats?.monthlyStats?.map((m) => m.newUsers) || [1]),
    10
  );

  return (
    <div className="space-y-6">
      {/* ──────────────── HEADER ──────────────── */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="brand text-2xl font-bold tracking-tight text-foreground">Tổng quan Quản trị</h1>
            <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs gap-1.5 font-medium">
              <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" /> Dữ liệu thời gian thực
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            Thống kê thời gian thực từ cơ sở dữ liệu về người dùng, phòng trọ, xác minh danh tính và đánh giá chất lượng
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 cursor-pointer text-xs"
            onClick={fetchStats}
            disabled={loading}
          >
            <RefreshCw className={cn("size-3.5", loading && "animate-spin")} /> Cập nhật dữ liệu
          </Button>
        </div>
      </div>

      {/* ──────────────── TOP 4 KPI CARDS ──────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Users */}
        <div
          onClick={() => navigate("/admin/users")}
          className="group rounded-2xl bg-card p-5 border shadow-xs hover:border-emerald-300 hover:shadow-md transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Người dùng hệ thống</span>
            <div className="size-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center">
              <Users className="size-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-foreground mt-3 tracking-tight">
            {stats ? stats.totalUsers.toLocaleString() : "--"}
          </p>
          <div className="flex items-center justify-between mt-2 pt-2 border-t text-xs text-muted-foreground">
            <span>{stats?.totalTenants ?? 0} người thuê</span>
            <span className="font-medium text-emerald-600">{stats?.totalLandlords ?? 0} chủ trọ</span>
          </div>
        </div>

        {/* Card 2: Rooms */}
        <div className="rounded-2xl bg-card p-5 border shadow-xs hover:border-blue-300 hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Nguồn cung phòng trọ</span>
            <div className="size-9 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 flex items-center justify-center">
              <Home className="size-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-foreground mt-3 tracking-tight">
            {stats ? stats.totalRooms.toLocaleString() : "--"}
          </p>
          <div className="flex items-center justify-between mt-2 pt-2 border-t text-xs text-muted-foreground">
            <span>{stats?.activeRooms ?? 0} phòng sẵn sàng</span>
            <span className="font-medium text-blue-600">{stats?.totalRentals ?? 0} hợp đồng</span>
          </div>
        </div>

        {/* Card 3: Verification */}
        <div
          onClick={() => navigate("/admin/kyc")}
          className="group rounded-2xl bg-card p-5 border shadow-xs hover:border-amber-300 hover:shadow-md transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Xác minh CCCD</span>
            <div className="size-9 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 flex items-center justify-center">
              <ShieldCheck className="size-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-foreground mt-3 tracking-tight">
            {stats ? stats.verifiedUsersCount.toLocaleString() : "--"}
          </p>
          <div className="flex items-center justify-between mt-2 pt-2 border-t text-xs text-muted-foreground">
            <span>Đã cấp tích xanh</span>
            <span className={cn("font-medium", (stats?.pendingKycCount ?? 0) > 0 ? "text-amber-600 font-semibold" : "text-emerald-600")}>
              {stats?.pendingKycCount ?? 0} hồ sơ chờ duyệt
            </span>
          </div>
        </div>

        {/* Card 4: Revenue */}
        <div className="rounded-2xl bg-card p-5 border shadow-xs hover:border-purple-300 hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Doanh thu hệ thống</span>
            <div className="size-9 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 flex items-center justify-center">
              <DollarSign className="size-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-foreground mt-3 tracking-tight">
            {stats ? formatVND(stats.totalRevenue) : "--"}
          </p>
          <div className="flex items-center justify-between mt-2 pt-2 border-t text-xs text-muted-foreground">
            <span>{stats?.activeRentals ?? 0} hợp đồng active</span>
            <span className="font-medium text-purple-600">Thanh toán tự động</span>
          </div>
        </div>
      </div>

      {/* ──────────────── 3 CHỦ ĐỀ CHUYÊN SÂU TABS ──────────────── */}
      <Tabs defaultValue="system" className="space-y-6">
        <TabsList className="bg-muted/60 p-1 rounded-xl border w-full sm:w-auto grid grid-cols-3">
          <TabsTrigger value="system" className="gap-2 text-xs sm:text-sm">
            <Activity className="size-3.5 sm:size-4" />
            <span>Tổng quan hệ thống</span>
          </TabsTrigger>
          <TabsTrigger value="tenants" className="gap-2 text-xs sm:text-sm">
            <UserCheck className="size-3.5 sm:size-4" />
            <span>Người thuê & Ghép đôi</span>
          </TabsTrigger>
          <TabsTrigger value="landlords" className="gap-2 text-xs sm:text-sm">
            <Building2 className="size-3.5 sm:size-4" />
            <span>Chủ trọ & Nguồn cung</span>
          </TabsTrigger>
        </TabsList>

        {/* ───────────── TAB 1: TỔNG QUAN HỆ THỐNG ───────────── */}
        <TabsContent value="system" className="space-y-6 m-0">
          {/* Biểu đồ tăng trưởng 6 tháng gần nhất */}
          <div className="rounded-2xl bg-card p-6 border shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-foreground">Tăng trưởng Người dùng & Hợp đồng thuê</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Dữ liệu ghi nhận từ hệ thống qua 6 tháng gần nhất</p>
              </div>
              <div className="flex items-center gap-4 text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="size-3 rounded-sm bg-emerald-500" />
                  <span className="text-muted-foreground">Người dùng mới</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="size-3 rounded-sm bg-blue-500" />
                  <span className="text-muted-foreground">Hợp đồng thuê mới</span>
                </div>
              </div>
            </div>

            {/* Visual Bar Chart */}
            <div className="pt-4 pb-2">
              <div className="grid grid-cols-6 gap-2 sm:gap-4 items-end h-48 border-b pb-2">
                {stats?.monthlyStats?.map((m, idx) => {
                  const userHeight = Math.max(Math.round((m.newUsers / maxMonthlyUsers) * 100), 6);
                  const rentalHeight = Math.max(Math.round((m.newRentals / maxMonthlyUsers) * 100), 4);
                  return (
                    <div key={idx} className="flex flex-col items-center gap-2 h-full justify-end group">
                      <div className="w-full flex items-end justify-center gap-1 sm:gap-1.5 h-full">
                        {/* Users bar */}
                        <div
                          className="w-1/2 max-w-[28px] bg-emerald-500 hover:bg-emerald-600 rounded-t-md transition-all duration-300 relative"
                          style={{ height: `${userHeight}%` }}
                          title={`${m.month}: ${m.newUsers} người dùng mới`}
                        >
                          {m.newUsers > 0 && (
                            <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] font-bold text-foreground opacity-0 group-hover:opacity-100 transition whitespace-nowrap">
                              {m.newUsers}
                            </span>
                          )}
                        </div>
                        {/* Rentals bar */}
                        <div
                          className="w-1/2 max-w-[28px] bg-blue-500 hover:bg-blue-600 rounded-t-md transition-all duration-300 relative"
                          style={{ height: `${rentalHeight}%` }}
                          title={`${m.month}: ${m.newRentals} hợp đồng mới`}
                        >
                          {m.newRentals > 0 && (
                            <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] font-bold text-blue-600 opacity-0 group-hover:opacity-100 transition whitespace-nowrap">
                              {m.newRentals}
                            </span>
                          )}
                        </div>
                      </div>
                      <span className="text-xs font-semibold text-muted-foreground group-hover:text-foreground">
                        {m.month}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Biểu đồ Doanh thu & Gói dịch vụ đã đăng ký */}
          {stats?.packageStats && stats.packageStats.length > 0 && (
            <div className="rounded-2xl bg-card p-6 border shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-foreground">Doanh thu & Đăng ký gói dịch vụ</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Thống kê dòng tiền từ các gói đẩy tin, gói thành viên ưu tiên của người dùng và chủ trọ
                  </p>
                </div>
                <div className="size-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                  <DollarSign className="size-4" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
                {stats.packageStats.map((pkg, idx) => {
                  const colors = ["border-purple-200 bg-purple-50/30", "border-blue-200 bg-blue-50/30", "border-emerald-200 bg-emerald-50/30"];
                  return (
                    <div key={idx} className={cn("p-4 rounded-xl border space-y-3", colors[idx % colors.length])}>
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-xs text-foreground truncate">{pkg.planName}</span>
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-bold bg-white">
                          {pkg.count} lượt mua
                        </Badge>
                      </div>
                      <div>
                        <span className="text-lg font-bold text-foreground">{formatVND(pkg.revenue)}</span>
                        <span className="text-[10px] text-muted-foreground block">Tổng doanh thu gói</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ĐÁNH GIÁ & MỨC ĐỘ HÀI LÒNG CỦA NGƯỜI DÙNG */}
          <div className="rounded-2xl bg-card p-6 border shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-4">
              <div>
                <h3 className="text-base font-bold text-foreground">Đánh giá & Mức độ hài lòng của người dùng</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Tổng hợp {stats?.totalReviews ?? 0} lượt phản hồi trực tiếp từ người thuê và chủ nhà
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-amber-500">{stats?.averageRating ? stats.averageRating.toFixed(1) : "5.0"}</span>
                <div className="flex items-center">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} className="size-4 fill-amber-500 text-amber-500" />
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Phân bố sao đánh giá */}
              <div className="space-y-3 p-4 rounded-xl bg-muted/20 border">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-3">
                  Phân bố sao đánh giá
                </span>
                {stats?.ratingDistribution?.map((r) => (
                  <div key={r.star} className="flex items-center gap-2 text-xs">
                    <span className="w-10 font-medium text-muted-foreground flex items-center gap-1">
                      {r.star} <Star className="size-3 fill-amber-500 text-amber-500 inline" />
                    </span>
                    <div className="h-2 flex-1 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full bg-emerald-500 transition-all duration-300"
                        style={{ width: `${r.percentage}%` }}
                      />
                    </div>
                    <span className="w-14 text-right font-mono text-muted-foreground">
                      {r.count} ({r.percentage}%)
                    </span>
                  </div>
                ))}
              </div>

              {/* Danh sách đánh giá mới nhất */}
              <div className="lg:col-span-2 space-y-3">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block">
                  Đánh giá gần đây nhất
                </span>

                {(!stats?.recentReviews || stats.recentReviews.length === 0) ? (
                  <div className="py-8 text-center text-xs text-muted-foreground border rounded-xl bg-muted/10">
                    Chưa có đánh giá nào được ghi nhận.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {stats.recentReviews.map((rev) => (
                      <div key={rev.id} className="p-4 rounded-xl border bg-background text-xs space-y-2.5 shadow-2xs hover:border-emerald-200 transition">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5 font-semibold text-foreground truncate max-w-[170px]" title={rev.reviewerName}>
                            <span className="size-2 rounded-full bg-emerald-500 shrink-0" />
                            <span className="truncate">{rev.reviewerName}</span>
                          </div>
                          <div className="flex items-center gap-0.5 text-amber-500 shrink-0">
                            {Array.from({ length: rev.rating }).map((_, i) => (
                              <Star key={i} className="size-3 fill-amber-500 text-amber-500" />
                            ))}
                          </div>
                        </div>

                        <p className="text-muted-foreground italic line-clamp-3 leading-relaxed">
                          "{rev.comment || "Đánh giá chất lượng phòng trọ tốt, trải nghiệm ở thoải mái và an tâm."}"
                        </p>

                        <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1.5 border-t">
                          <span className="truncate max-w-[140px]" title={rev.roomTitle}>{rev.roomTitle || "Phòng trọ"}</span>
                          <Badge variant="outline" className="text-[10px] px-1 py-0 bg-muted/60">
                            {rev.reviewerRole}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </TabsContent>

        {/* ───────────── TAB 2: NGƯỜI THUÊ & GHÉP ĐÔI ───────────── */}
        <TabsContent value="tenants" className="space-y-6 m-0">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Phân bố điểm uy tín (TrustScore) */}
            <div className="rounded-2xl bg-card p-6 border shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-foreground">Phân bố Điểm uy tín (TrustScore)</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Hệ thống tính điểm minh bạch dựa trên xác minh CCCD, lịch sử thanh toán và đánh giá cộng đồng
                  </p>
                </div>
                <div className="size-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <ShieldCheck className="size-4" />
                </div>
              </div>

              <div className="space-y-3 pt-2">
                {stats?.trustScoreDistribution?.map((ts, idx) => {
                  const colors = [
                    "bg-rose-500",
                    "bg-amber-500",
                    "bg-blue-500",
                    "bg-emerald-500"
                  ];
                  return (
                    <div key={idx} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-foreground">{ts.range}</span>
                        <span className="font-mono text-muted-foreground">
                          {ts.count} người ({ts.percentage}%)
                        </span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                        <div
                          className={cn("h-full rounded-full transition-all duration-300", colors[idx % colors.length])}
                          style={{ width: `${ts.percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Chỉ số hồ sơ người thuê & Ghép đôi */}
            <div className="rounded-2xl bg-card p-6 border shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-foreground">Quy trình Ghép đôi bạn cùng phòng</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Thuật toán so khớp lối sống 8 tiêu chí giúp người thuê tìm bạn trọ phù hợp nhất
                  </p>
                </div>
                <div className="size-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <UserCheck className="size-4" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 text-xs">
                <div className="p-3.5 rounded-xl bg-muted/30 border">
                  <span className="text-muted-foreground block text-[11px]">Tổng người thuê</span>
                  <span className="font-bold text-foreground text-lg mt-0.5 block">{stats?.totalTenants ?? 0}</span>
                  <span className="text-[10px] text-muted-foreground">Tài khoản đang hoạt động</span>
                </div>
                <div className="p-3.5 rounded-xl bg-muted/30 border">
                  <span className="text-muted-foreground block text-[11px]">Đã xác thực CCCD</span>
                  <span className="font-bold text-emerald-600 text-lg mt-0.5 block">{stats?.verifiedUsersCount ?? 0}</span>
                  <span className="text-[10px] text-muted-foreground">Hồ sơ chính chủ</span>
                </div>
                <div className="p-3.5 rounded-xl bg-muted/30 border">
                  <span className="text-muted-foreground block text-[11px]">Hợp đồng đang thuê</span>
                  <span className="font-bold text-blue-600 text-lg mt-0.5 block">{stats?.activeRentals ?? 0}</span>
                  <span className="text-[10px] text-muted-foreground">Phòng đang có khách</span>
                </div>
                <div className="p-3.5 rounded-xl bg-muted/30 border">
                  <span className="text-muted-foreground block text-[11px]">Lượt ghép đôi thành công</span>
                  <span className="font-bold text-purple-600 text-lg mt-0.5 block">{stats?.totalMatches ?? 0}</span>
                  <span className="text-[10px] text-muted-foreground">Cặp đôi kết nối</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/60 text-xs text-emerald-800 dark:text-emerald-300">
                <span className="font-semibold block mb-0.5">Tiêu chuẩn ghép đôi thông minh:</span>
                Tương thích dựa trên: Giờ giấc sinh hoạt, Ngân sách, Mức độ ồn ào, Thú cưng, Hút thuốc, Nấu ăn, Dọn dẹp và Khoảng cách trường/công ty.
              </div>
            </div>

            {/* Thống kê duyệt định danh CCCD */}
            {stats?.kycOverview && (
              <div className="rounded-2xl bg-card p-6 border shadow-xs space-y-4 lg:col-span-2">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-bold text-foreground">Hiệu suất Kiểm duyệt CCCD & Cấp tích xanh</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Tỷ lệ hồ sơ được duyệt và cấp huy hiệu chính chủ trên toàn hệ thống
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate("/admin/kyc")}
                    className="cursor-pointer text-xs gap-1"
                  >
                    Xem hàng đợi duyệt <ChevronRight className="size-3" />
                  </Button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-1">
                  <div className="p-3.5 rounded-xl border bg-muted/20">
                    <span className="text-muted-foreground block text-[11px]">Tỷ lệ phê duyệt</span>
                    <span className="font-bold text-emerald-600 text-xl mt-0.5 block">{stats.kycOverview.approvalRate}%</span>
                    <span className="text-[10px] text-muted-foreground">Hồ sơ hợp lệ</span>
                  </div>
                  <div className="p-3.5 rounded-xl border bg-emerald-50/40 border-emerald-200/60">
                    <span className="text-emerald-700 block text-[11px] font-medium">Đã phê duyệt (+30đ)</span>
                    <span className="font-bold text-emerald-800 text-xl mt-0.5 block">{stats.kycOverview.approvedCount}</span>
                    <span className="text-[10px] text-emerald-600">Đã cấp tích xanh</span>
                  </div>
                  <div className="p-3.5 rounded-xl border bg-amber-50/40 border-amber-200/60">
                    <span className="text-amber-700 block text-[11px] font-medium">Đang chờ duyệt</span>
                    <span className="font-bold text-amber-800 text-xl mt-0.5 block">{stats.kycOverview.pendingCount}</span>
                    <span className="text-[10px] text-amber-600">Cần admin xử lý</span>
                  </div>
                  <div className="p-3.5 rounded-xl border bg-rose-50/40 border-rose-200/60">
                    <span className="text-rose-700 block text-[11px] font-medium">Đã từ chối</span>
                    <span className="font-bold text-rose-800 text-xl mt-0.5 block">{stats.kycOverview.rejectedCount}</span>
                    <span className="text-[10px] text-rose-600">Ảnh mờ / Sai thông tin</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </TabsContent>

        {/* ───────────── TAB 3: CHỦ TRỌ & NGUỒN CUNG ───────────── */}
        <TabsContent value="landlords" className="space-y-6 m-0">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Tỷ lệ lấp đầy & Nguồn cung phòng */}
            <div className="rounded-2xl bg-card p-6 border shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-foreground">Tỷ lệ lấp đầy & Trạng thái phòng trọ</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Quản lý danh sách phòng cho thuê trên toàn địa bàn TP.HCM
                  </p>
                </div>
                <div className="size-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Home className="size-4" />
                </div>
              </div>

              {(() => {
                const total = stats?.totalRooms ?? 0;
                const active = stats?.activeRooms ?? 0;
                const rented = total - active;
                const occupancyRate = total > 0 ? Math.round((rented / total) * 100) : 0;

                return (
                  <div className="space-y-4 pt-1">
                    <div className="p-4 rounded-xl bg-muted/20 border flex items-center justify-between">
                      <div>
                        <span className="text-xs text-muted-foreground block">Tỷ lệ lấp đầy phòng</span>
                        <span className="text-2xl font-bold text-foreground mt-0.5 block">{occupancyRate}%</span>
                      </div>
                      <div className="h-3 w-36 rounded-full bg-muted overflow-hidden">
                        <div className="h-full bg-blue-600 rounded-full" style={{ width: `${occupancyRate}%` }} />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="p-3.5 rounded-xl border bg-background">
                        <span className="text-muted-foreground block text-[11px]">Tổng số phòng đã đăng</span>
                        <span className="font-bold text-foreground text-lg mt-0.5 block">{total}</span>
                        <span className="text-[10px] text-muted-foreground">Toàn hệ thống</span>
                      </div>
                      <div className="p-3.5 rounded-xl border bg-emerald-50/40 border-emerald-200/60">
                        <span className="text-emerald-700 block text-[11px] font-medium">Phòng sẵn sàng đón khách</span>
                        <span className="font-bold text-emerald-800 text-lg mt-0.5 block">{active}</span>
                        <span className="text-[10px] text-emerald-600">Đang hiển thị tìm kiếm</span>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Cơ cấu Loại hình phòng trọ */}
            <div className="rounded-2xl bg-card p-6 border shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-foreground">Cơ cấu Loại hình phòng trọ</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Phân bố tỷ lệ nguồn cung theo từng mô hình nhà trọ
                  </p>
                </div>
                <div className="size-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Building2 className="size-4" />
                </div>
              </div>

              <div className="space-y-3 pt-2">
                {stats?.roomTypeDistribution?.map((rt, idx) => {
                  const colors = ["bg-emerald-500", "bg-blue-500", "bg-purple-500", "bg-amber-500", "bg-indigo-500"];
                  return (
                    <div key={idx} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-foreground">{rt.name}</span>
                        <span className="font-mono text-muted-foreground">
                          {rt.count} phòng ({rt.percentage}%)
                        </span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                        <div
                          className={cn("h-full rounded-full transition-all duration-300", colors[idx % colors.length])}
                          style={{ width: `${rt.percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Nguồn cung phòng theo Quận/Huyện */}
            <div className="rounded-2xl bg-card p-6 border shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-foreground">Nguồn cung theo Khu vực (TP.HCM)</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Top các Quận/Huyện có mật độ phòng trọ đăng tuyển cao nhất
                  </p>
                </div>
                <div className="size-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Home className="size-4" />
                </div>
              </div>

              <div className="space-y-3 pt-2">
                {stats?.districtDistribution?.map((dist, idx) => {
                  return (
                    <div key={idx} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-foreground">{dist.name}</span>
                        <span className="font-mono text-muted-foreground">
                          {dist.count} phòng ({dist.percentage}%)
                        </span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full bg-blue-500 transition-all duration-300"
                          style={{ width: `${Math.max(dist.percentage, 5)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Chỉ số kiểm soát chất lượng & Vận hành */}
            <div className="rounded-2xl bg-card p-6 border shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-foreground">Kiểm soát chất lượng & Vận hành</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Tiêu chuẩn kiểm duyệt thông tin và bảo vệ quyền lợi hai bên
                  </p>
                </div>
                <div className="size-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                  <Shield className="size-4" />
                </div>
              </div>

              <div className="space-y-2.5 pt-1 text-xs">
                <div className="flex items-center justify-between p-3 rounded-xl bg-background border">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
                    <span className="text-foreground font-medium">Kiểm duyệt hình ảnh phòng trọ</span>
                  </div>
                  <span className="text-emerald-600 font-semibold">Tự động đối soát</span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-background border">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
                    <span className="text-foreground font-medium">Thanh toán cọc & Tiền thuê trực tuyến</span>
                  </div>
                  <span className="text-emerald-600 font-semibold">Tự động 100%</span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-background border">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="size-4 text-amber-600 shrink-0" />
                    <span className="text-foreground font-medium">Khiếu nại đánh giá chờ giải quyết</span>
                  </div>
                  <span className={cn("font-semibold", (stats?.pendingDisputesCount ?? 0) > 0 ? "text-amber-600" : "text-emerald-600")}>
                    {stats?.pendingDisputesCount ?? 0} vụ việc
                  </span>
                </div>
              </div>

              {/* Nút hành động nhanh cho Admin */}
              <div className="pt-2 flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate("/admin/kyc")}
                  className="cursor-pointer text-xs gap-1"
                >
                  Duyệt CCCD ({stats?.pendingKycCount ?? 0}) <ChevronRight className="size-3" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate("/admin/users")}
                  className="cursor-pointer text-xs gap-1"
                >
                  Quản lý người dùng <ChevronRight className="size-3" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate("/admin/packages")}
                  className="cursor-pointer text-xs gap-1"
                >
                  Quản lý gói dịch vụ <ChevronRight className="size-3" />
                </Button>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
