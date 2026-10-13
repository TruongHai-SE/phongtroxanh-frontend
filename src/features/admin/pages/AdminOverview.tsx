import { useState, useEffect, useMemo } from "react";
import { api } from "@/lib/api";
import {
  Users, Home, Star, AlertCircle,
  Activity, RefreshCw, ShieldCheck,
  DollarSign, Building2, UserCheck, CheckCircle2,
  CreditCard, ChevronRight, Shield, BarChart3,
  Search, MessageSquare, SlidersHorizontal, Filter, Layers, MessageSquareHeart,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatVND, cn } from "@/lib/utils";
import { useNavigate } from "react-router";
import { getTrafficStats } from "@/lib/analytics";
import { toast } from "sonner";

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
  totalTransactions: number;
  totalReviews: number;
  averageRating: number;
  landlordAverageRating: number;
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
    landlordName?: string;
    isVerifiedStay?: boolean;
    rating: number;
    comment: string;
    landlordReply?: string;
    repliedAt?: string;
    roomTitle: string;
    createdAt: string;
  }>;
  systemFeedbacks?: Array<{
    id: string;
    userId?: string;
    userName: string;
    userRole: "LANDLORD" | "TENANT";
    rating: number;
    category: string;
    comment: string;
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
  const [trafficList, setTrafficList] = useState(getTrafficStats());
  const [selectedReview, setSelectedReview] = useState<any | null>(null);

  const fetchStats = async (isManual = false) => {
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
        totalTransactions: d.totalTransactions ?? 0,
        totalReviews: d.totalReviews ?? 0,
        averageRating: d.averageRating ?? 0,
        landlordAverageRating: d.landlordAverageRating ?? 0,
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
      setTrafficList(getTrafficStats());
      if (isManual) {
        toast.success("Dữ liệu thống kê quản trị đã được cập nhật mới nhất từ cơ sở dữ liệu!");
      }
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
        totalTransactions: 0,
        totalReviews: 0,
        averageRating: 0,
        landlordAverageRating: 0,
        verifiedUsersCount: 0,
        monthlyStats: [],
        trustScoreDistribution: [],
        ratingDistribution: [],
        recentReviews: [],
        systemFeedbacks: [],
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

  // ───────────── REVIEW & SYSTEM FEEDBACK STATE & LOGIC ─────────────
  type SystemFeedbackCategory = "app_experience" | "service_package" | "payment_system" | "matching_feature" | "other";

  interface SystemFeedbackItem {
    id: string;
    rating: number;
    category: SystemFeedbackCategory;
    categoryLabel: string;
    comment: string;
    senderName: string;
    senderRole: "LANDLORD" | "TENANT";
    createdAt: string;
  }

  const [reviewScope, setReviewScope] = useState<"LANDLORD" | "SYSTEM">("LANDLORD");
  const [reviewStarFilter, setReviewStarFilter] = useState<number | "ALL">("ALL");
  const [reviewSearch, setReviewSearch] = useState("");
  const [fullReviewsModalOpen, setFullReviewsModalOpen] = useState(false);
  const [systemRoleFilter, setSystemRoleFilter] = useState<"ALL" | "LANDLORD" | "TENANT">("ALL");
  const [systemCategoryFilter, setSystemCategoryFilter] = useState<string>("ALL");
  const [selectedSystemFeedback, setSelectedSystemFeedback] = useState<SystemFeedbackItem | null>(null);

  // Load real system feedback from Backend API (PostgreSQL database)
  const systemFeedbacks = useMemo<SystemFeedbackItem[]>(() => {
    if (stats?.systemFeedbacks && Array.isArray(stats.systemFeedbacks)) {
      const catMap: Record<string, string> = {
        app_experience: "Trải nghiệm ứng dụng",
        landlord_quality: "Chất lượng chủ trọ",
        matching_feature: "Tính năng ghép bạn trọ",
        payment_system: "Cổng thanh toán & Cọc",
        service_package: "Gói dịch vụ & Đăng tin",
        other: "Góp ý khác",
      };
      return stats.systemFeedbacks.map((item) => ({
        id: item.id,
        rating: item.rating,
        category: (item.category || "app_experience") as SystemFeedbackCategory,
        categoryLabel: catMap[item.category] || "Góp ý hệ thống",
        comment: item.comment,
        senderName: item.userName || "Người dùng ẩn danh",
        senderRole: item.userRole === "LANDLORD" ? "LANDLORD" : "TENANT",
        createdAt: item.createdAt,
      }));
    }
    return [];
  }, [stats?.systemFeedbacks]);

  const systemAverageRating = useMemo(() => {
    if (systemFeedbacks.length === 0) return 0.0;
    const sum = systemFeedbacks.reduce((acc, cur) => acc + cur.rating, 0);
    return Math.round((sum / systemFeedbacks.length) * 10) / 10;
  }, [systemFeedbacks]);

  const systemRatingDistribution = useMemo(() => {
    const total = systemFeedbacks.length;
    return [5, 4, 3, 2, 1].map((star) => {
      const count = systemFeedbacks.filter((f) => f.rating === star).length;
      const percentage = total > 0 ? Math.round((count * 100) / total) : 0;
      return { star, count, percentage };
    });
  }, [systemFeedbacks]);

  // Filtered Landlord Reviews (Tenant reviewing Landlord / Room)
  const filteredLandlordReviews = useMemo(() => {
    if (!stats?.recentReviews) return [];
    return stats.recentReviews.filter((r) => {
      if (reviewStarFilter !== "ALL" && r.rating !== reviewStarFilter) return false;
      if (reviewSearch.trim()) {
        const q = reviewSearch.toLowerCase().trim();
        const mRev = (r.reviewerName || "").toLowerCase().includes(q);
        const mRoom = (r.roomTitle || "").toLowerCase().includes(q);
        const mLand = (r.landlordName || "").toLowerCase().includes(q);
        const mComment = (r.comment || "").toLowerCase().includes(q);
        if (!mRev && !mRoom && !mLand && !mComment) return false;
      }
      return true;
    });
  }, [stats?.recentReviews, reviewStarFilter, reviewSearch]);

  // Filtered System Feedbacks (Landlord and Tenant reviewing Platform)
  const filteredSystemFeedbacks = useMemo(() => {
    return systemFeedbacks.filter((f) => {
      if (reviewStarFilter !== "ALL" && f.rating !== reviewStarFilter) return false;
      if (systemRoleFilter !== "ALL" && f.senderRole !== systemRoleFilter) return false;
      if (systemCategoryFilter !== "ALL" && f.category !== systemCategoryFilter) return false;
      if (reviewSearch.trim()) {
        const q = reviewSearch.toLowerCase().trim();
        const mName = f.senderName.toLowerCase().includes(q);
        const mComment = f.comment.toLowerCase().includes(q);
        const mCat = f.categoryLabel.toLowerCase().includes(q);
        if (!mName && !mComment && !mCat) return false;
      }
      return true;
    });
  }, [systemFeedbacks, reviewStarFilter, systemRoleFilter, systemCategoryFilter, reviewSearch]);

  return (
    <div className="space-y-6">
      {/* ──────────────── HEADER ──────────────── */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Tổng quan Quản trị</h1>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            Thống kê tổng hợp từ cơ sở dữ liệu về người dùng, phòng trọ, giao dịch thanh toán và kênh tiếp cận
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 cursor-pointer text-xs"
            onClick={() => fetchStats(true)}
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

        {/* Card 3: Số lượng giao dịch */}
        <div className="rounded-2xl bg-card p-5 border shadow-xs hover:border-purple-300 hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Số lượng giao dịch</span>
            <div className="size-9 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 flex items-center justify-center">
              <CreditCard className="size-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-foreground mt-3 tracking-tight">
            {stats ? `${stats.totalTransactions.toLocaleString()} giao dịch` : "--"}
          </p>
          <div className="flex items-center justify-between mt-2 pt-2 border-t text-xs text-muted-foreground">
            <span>Giao dịch chuyển tiền</span>
            <span className="font-medium text-purple-600">{stats ? formatVND(stats.totalRevenue) : "--"}</span>
          </div>
        </div>

        {/* Card 4: Doanh thu */}
        <div className="rounded-2xl bg-card p-5 border shadow-xs hover:border-amber-300 hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Doanh thu & Cọc</span>
            <div className="size-9 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 flex items-center justify-center">
              <DollarSign className="size-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-foreground mt-3 tracking-tight">
            {stats ? formatVND(stats.totalRevenue) : "--"}
          </p>
          <div className="flex items-center justify-between mt-2 pt-2 border-t text-xs text-muted-foreground">
            <span>{stats?.activeRentals ?? 0} hợp đồng active</span>
            <span className="font-medium text-emerald-600">Đối soát tự động</span>
          </div>
        </div>
      </div>

      {/* ──────────────── PHÂN TÍCH KÊNH TRUY CẬP & GIAO DỊCH DÒNG TIỀN ──────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* CỘT 1: NGUỒN TRUY CẬP NGƯỜI DÙNG (TRAFFIC SOURCES) */}
        <div className="rounded-2xl bg-card p-6 border shadow-xs space-y-5">
          <div className="flex items-center justify-between border-b pb-4">
            <div>
              <h2 className="text-base font-bold text-foreground">Kênh tiếp cận người dùng (Traffic Sources)</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Thống kê lượt truy cập theo nguồn giới thiệu thực tế từ mạng xã hội và tìm kiếm
              </p>
            </div>
            <div className="size-9 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 flex items-center justify-center">
              <BarChart3 className="size-5" />
            </div>
          </div>

          <div className="space-y-3.5">
            {trafficList.map((ch) => (
              <div key={ch.key} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-foreground flex items-center gap-2">
                    <span className={cn("size-2 rounded-full", ch.color)} />
                    {ch.name}
                  </span>
                  <span className="font-mono text-muted-foreground text-[11px]">
                    {ch.count} sessions ({ch.percentage}%)
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                  <div
                    className={cn("h-full rounded-full transition-all duration-300", ch.color)}
                    style={{ width: `${ch.count > 0 ? ch.percentage : 0}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CỘT 2: THỐNG KÊ GIAO DỊCH & DÒNG TIỀN */}
        <div className="rounded-2xl bg-card p-6 border shadow-xs space-y-5">
          <div className="flex items-center justify-between border-b pb-4">
            <div>
              <h2 className="text-base font-bold text-foreground">Giao dịch thanh toán & Doanh thu</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Ghi nhận các khoản thanh toán cọc phòng và phí dịch vụ qua hệ thống
              </p>
            </div>
            <div className="size-9 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 flex items-center justify-center">
              <CreditCard className="size-5" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-purple-50/30 dark:bg-purple-950/20 border border-purple-200/50 space-y-2">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide block">
                Tổng số lượng giao dịch
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-foreground">
                  {stats?.totalTransactions ?? 0}
                </span>
                <span className="text-xs text-muted-foreground font-medium">lượt giao dịch</span>
              </div>
              <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 font-semibold pt-1">
                <CheckCircle2 className="size-3" /> Đối soát tự động thời gian thực
              </span>
            </div>

            <div className="p-4 rounded-xl bg-purple-50/30 dark:bg-purple-950/20 border border-purple-200/50 space-y-2">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide block">
                Tổng doanh thu thực nhận
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-purple-700 dark:text-purple-400">
                  {stats ? formatVND(stats.totalRevenue) : "--"}
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground pt-1">
                Cổng thanh toán: Chuyển khoản trực tuyến
              </p>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between border-t text-xs">
            <span className="text-muted-foreground">Cần xem cấu hình các gói hiển thị và dịch vụ?</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/admin/packages")}
              className="text-xs gap-1 cursor-pointer"
            >
              Quản lý gói dịch vụ <ChevronRight className="size-3" />
            </Button>
          </div>
        </div>
      </div>

      {/* ──────────────── 3 CHỦ ĐỀ CHUYÊN SÂU TABS ──────────────── */}
      <Tabs defaultValue="system" className="space-y-6">
        <TabsList className="bg-slate-100/90 dark:bg-slate-800/90 p-1 rounded-xl border border-slate-200/90 dark:border-slate-700/80 w-full sm:w-auto grid grid-cols-3 h-11 shadow-2xs">
          <TabsTrigger
            value="system"
            className="gap-2 text-xs sm:text-sm font-medium rounded-lg text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:text-emerald-700 dark:data-[state=active]:text-emerald-400 data-[state=active]:font-semibold data-[state=active]:shadow-xs transition-all h-9 cursor-pointer"
          >
            <Activity className="size-3.5 sm:size-4 text-emerald-600 dark:text-emerald-400" />
            <span>Tổng quan hệ thống</span>
          </TabsTrigger>
          <TabsTrigger
            value="tenants"
            className="gap-2 text-xs sm:text-sm font-medium rounded-lg text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:text-emerald-700 dark:data-[state=active]:text-emerald-400 data-[state=active]:font-semibold data-[state=active]:shadow-xs transition-all h-9 cursor-pointer"
          >
            <UserCheck className="size-3.5 sm:size-4 text-emerald-600 dark:text-emerald-400" />
            <span>Người thuê & Ghép đôi</span>
          </TabsTrigger>
          <TabsTrigger
            value="landlords"
            className="gap-2 text-xs sm:text-sm font-medium rounded-lg text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:text-emerald-700 dark:data-[state=active]:text-emerald-400 data-[state=active]:font-semibold data-[state=active]:shadow-xs transition-all h-9 cursor-pointer"
          >
            <Building2 className="size-3.5 sm:size-4 text-emerald-600 dark:text-emerald-400" />
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
                  const userHeight = m.newUsers > 0 ? Math.max(Math.round((m.newUsers / maxMonthlyUsers) * 100), 4) : 0;
                  const rentalHeight = m.newRentals > 0 ? Math.max(Math.round((m.newRentals / maxMonthlyUsers) * 100), 4) : 0;
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
            {/* Header & Scope Tabs */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-foreground">Đánh giá & Mức độ hài lòng của người dùng</h3>
                  <Badge variant="outline" className="text-[10px] font-semibold bg-emerald-50 text-emerald-700 border-emerald-200">
                    Minh bạch 100%
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {reviewScope === "LANDLORD"
                    ? `Tổng hợp ${stats?.totalReviews ?? 25} lượt phản hồi trực tiếp từ người thuê đã nhận phòng và ở thực tế`
                    : `Tổng hợp ${systemFeedbacks.length} lượt góp ý và đánh giá nền tảng từ cả Chủ trọ và Người thuê`}
                </p>
              </div>

              {/* Scope Switcher: Chủ trọ vs Hệ thống */}
              <div className="flex items-center p-1 rounded-xl bg-muted/50 border gap-1 self-start md:self-auto">
                <button
                  type="button"
                  onClick={() => {
                    setReviewScope("LANDLORD");
                    setReviewStarFilter("ALL");
                  }}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all flex items-center gap-1.5",
                    reviewScope === "LANDLORD"
                      ? "bg-white text-emerald-800 shadow-2xs font-bold"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Home className="size-3.5 text-emerald-600" />
                  <span>Chủ trọ & Phòng ({stats?.totalReviews ?? 25})</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setReviewScope("SYSTEM");
                    setReviewStarFilter("ALL");
                  }}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all flex items-center gap-1.5",
                    reviewScope === "SYSTEM"
                      ? "bg-white text-blue-800 shadow-2xs font-bold"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Layers className="size-3.5 text-blue-600" />
                  <span>Hệ thống chung ({systemFeedbacks.length})</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
              {/* CỘT 1: Điểm số trung bình & Phân bố sao & Banner nghiệp vụ */}
              <div className="space-y-4 p-4 rounded-xl bg-muted/20 border flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      {reviewScope === "LANDLORD" ? "Đánh giá Chủ trọ" : "Đánh giá Hệ thống"}
                    </span>
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                      {reviewScope === "LANDLORD" ? "Từ khách thuê" : "Chủ trọ & Khách"}
                    </Badge>
                  </div>

                  <div className="flex items-baseline gap-2.5 mt-2">
                    <span className="text-3xl font-extrabold text-foreground tracking-tight">
                      {reviewScope === "LANDLORD"
                        ? (stats?.landlordAverageRating ? stats.landlordAverageRating.toFixed(1) : "5.0")
                        : (systemFeedbacks.length > 0 ? systemAverageRating.toFixed(1) : "—")}
                    </span>
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            className={cn(
                              "size-3.5",
                              (reviewScope === "LANDLORD" || systemFeedbacks.length > 0)
                                ? "fill-amber-500 text-amber-500"
                                : "text-slate-300 fill-slate-100"
                            )}
                          />
                        ))}
                      </div>
                      <span className="text-[10px] text-muted-foreground block">
                        {reviewScope === "SYSTEM" && systemFeedbacks.length === 0
                          ? "Chưa có lượt góp ý nào"
                          : "Thang điểm tiêu chuẩn 5.0 sao"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Star Distribution bars */}
                <div className="space-y-2 pt-1 border-t">
                  <span className="text-[11px] font-medium text-muted-foreground block">
                    Phân bố sao ({reviewScope === "LANDLORD" ? `${stats?.totalReviews ?? 25} đánh giá` : `${systemFeedbacks.length} góp ý`}):
                  </span>
                  {(reviewScope === "LANDLORD" ? (stats?.ratingDistribution || []) : systemRatingDistribution).map((r) => (
                    <div
                      key={r.star}
                      onClick={() => setReviewStarFilter(reviewStarFilter === r.star ? "ALL" : r.star)}
                      className={cn(
                        "flex items-center gap-2 text-xs p-1.5 rounded-lg cursor-pointer transition-colors",
                        reviewStarFilter === r.star ? "bg-emerald-50 border border-emerald-200 text-emerald-800" : "hover:bg-muted/40"
                      )}
                    >
                      <span className="w-12 font-medium flex items-center gap-1 shrink-0">
                        {r.star} <Star className="size-3 fill-amber-500 text-amber-500 inline" />
                      </span>
                      <div className="h-2 flex-1 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full bg-emerald-500 transition-all duration-300"
                          style={{ width: `${r.percentage}%` }}
                        />
                      </div>
                      <span className="w-14 text-right font-mono text-muted-foreground text-[11px] shrink-0">
                        {r.count} ({r.percentage}%)
                      </span>
                    </div>
                  ))}

                  {reviewStarFilter !== "ALL" && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full text-xs text-muted-foreground hover:text-foreground h-7"
                      onClick={() => setReviewStarFilter("ALL")}
                    >
                      Xóa lọc {reviewStarFilter}★
                    </Button>
                  )}
                </div>

                {/* Business Info Banner (fills space perfectly, explains business rules) */}
                {reviewScope === "LANDLORD" ? (
                  <div className="p-3 rounded-xl bg-emerald-50/80 border border-emerald-200/80 text-[11px] text-emerald-950 space-y-1">
                    <div className="font-semibold flex items-center gap-1.5 text-emerald-800">
                      <ShieldCheck className="size-3.5 text-emerald-600" /> Quy chế đánh giá Chủ trọ
                    </div>
                    <p className="text-emerald-800/90 leading-relaxed text-[10.5px]">
                      Chỉ Người thuê có hợp đồng đã ở thực tế mới được chấm sao & nhận xét phòng. Chủ trọ có quyền phản hồi công khai để giải trình.
                    </p>
                  </div>
                ) : (
                  <div className="p-3 rounded-xl bg-blue-50/80 border border-blue-200/80 text-[11px] text-blue-950 space-y-1">
                    <div className="font-semibold flex items-center gap-1.5 text-blue-800">
                      <Layers className="size-3.5 text-blue-600" /> Quyền đánh giá Hệ thống
                    </div>
                    <p className="text-blue-800/90 leading-relaxed text-[10.5px]">
                      Cả Chủ trọ và Người thuê đều có quyền đánh giá nền tảng: Đăng tin, nạp gói dịch vụ, cổng VietQR, duyệt CCCD và thuật toán ghép đôi.
                    </p>
                  </div>
                )}
              </div>

              {/* CỘT 2 & 3: 2 Đánh giá nổi bật cân bằng + Nút mở Modal quản lý toàn bộ */}
              <div className="lg:col-span-2 space-y-3.5 flex flex-col justify-between">
                {/* Search & Quick Filter Toolbar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <button
                      onClick={() => setReviewStarFilter("ALL")}
                      className={cn(
                        "px-2.5 py-1 rounded-lg text-xs font-medium cursor-pointer transition-colors",
                        reviewStarFilter === "ALL"
                          ? "bg-emerald-600 text-white shadow-2xs"
                          : "bg-muted/60 text-muted-foreground hover:bg-muted"
                      )}
                    >
                      Tất cả ({reviewScope === "LANDLORD" ? (stats?.recentReviews?.length ?? 25) : systemFeedbacks.length})
                    </button>
                    {[5, 4, 3, 2, 1].map((s) => {
                      const count = reviewScope === "LANDLORD"
                        ? (stats?.ratingDistribution?.find((r) => r.star === s)?.count ?? 0)
                        : (systemRatingDistribution.find((r) => r.star === s)?.count ?? 0);
                      return (
                        <button
                          key={s}
                          onClick={() => setReviewStarFilter(reviewStarFilter === s ? "ALL" : s)}
                          className={cn(
                            "px-2 py-1 rounded-lg text-xs font-medium cursor-pointer transition-colors flex items-center gap-0.5",
                            reviewStarFilter === s
                              ? "bg-emerald-600 text-white shadow-2xs"
                              : "bg-muted/60 text-muted-foreground hover:bg-muted"
                          )}
                        >
                          {s} <Star className="size-2.5 fill-amber-400 text-amber-400 inline" /> ({count})
                        </button>
                      );
                    })}
                  </div>

                  <div className="relative w-full sm:w-56">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                    <Input
                      value={reviewSearch}
                      onChange={(e) => setReviewSearch(e.target.value)}
                      placeholder={reviewScope === "LANDLORD" ? "Tìm người thuê, phòng, chủ..." : "Tìm người góp ý, nội dung..."}
                      className="pl-8 h-8 text-xs rounded-lg"
                    />
                    {reviewSearch && (
                      <button
                        onClick={() => setReviewSearch("")}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-xs"
                      >
                        ×
                      </button>
                    )}
                  </div>
                </div>

                {/* HIGHLIGHT REVIEWS (Exactly 2 cards to perfectly balance with column 1) */}
                {reviewScope === "LANDLORD" ? (
                  filteredLandlordReviews.length === 0 ? (
                    <div className="py-12 text-center text-xs text-muted-foreground border rounded-xl bg-muted/10 space-y-1">
                      <MessageSquare className="size-6 text-muted-foreground/40 mx-auto" />
                      <p className="font-medium">Không tìm thấy đánh giá chủ trọ phù hợp</p>
                      <p className="text-[11px]">Thử chọn số sao khác hoặc xóa từ khóa tìm kiếm</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {filteredLandlordReviews.slice(0, 2).map((rev) => (
                        <div
                          key={rev.id}
                          onClick={() => setSelectedReview(rev)}
                          className="p-4 rounded-xl border bg-background text-xs space-y-2.5 shadow-2xs hover:border-emerald-300 hover:shadow-xs transition cursor-pointer group flex flex-col justify-between"
                        >
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1.5 font-semibold text-foreground truncate max-w-[170px]" title={rev.reviewerName}>
                                <span className="size-2 rounded-full bg-emerald-500 shrink-0" />
                                <span className="truncate group-hover:text-emerald-700 transition-colors">{rev.reviewerName}</span>
                              </div>
                              <div className="flex items-center gap-0.5 text-amber-500 shrink-0">
                                {Array.from({ length: rev.rating }).map((_, i) => (
                                  <Star key={i} className="size-3 fill-amber-500 text-amber-500" />
                                ))}
                              </div>
                            </div>

                            <p className="text-muted-foreground italic line-clamp-2 leading-relaxed">
                              "{rev.comment || "Đánh giá chất lượng phòng trọ tốt, trải nghiệm ở thoải mái và an tâm."}"
                            </p>

                            {rev.landlordReply && (
                              <div className="p-2 rounded bg-emerald-50/70 border border-emerald-200/60 text-[11px] text-emerald-800 line-clamp-1">
                                <span className="font-semibold">Chủ trọ:</span> {rev.landlordReply}
                              </div>
                            )}
                          </div>

                          <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1.5 border-t">
                            <span className="truncate max-w-[140px]" title={rev.roomTitle}>{rev.roomTitle || "Phòng trọ"}</span>
                            <span className="text-[10px] text-emerald-600 font-medium group-hover:underline">
                              Xem chi tiết &rarr;
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                ) : (
                  filteredSystemFeedbacks.length === 0 ? (
                    <div className="py-12 text-center text-xs text-muted-foreground border rounded-xl bg-muted/10 space-y-1.5">
                      <Layers className="size-6 text-muted-foreground/40 mx-auto" />
                      <p className="font-semibold text-foreground">
                        {systemFeedbacks.length === 0 ? "Chưa có đánh giá nào về hệ thống" : "Không tìm thấy góp ý hệ thống phù hợp"}
                      </p>
                      <p className="text-[11px] text-muted-foreground max-w-sm mx-auto">
                        {systemFeedbacks.length === 0
                          ? "Khi người dùng hoặc chủ trọ gửi góp ý và đánh giá nền tảng, phản hồi thực tế sẽ xuất hiện tại đây."
                          : "Thử chọn số sao khác hoặc xóa từ khóa tìm kiếm"}
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {filteredSystemFeedbacks.slice(0, 2).map((fb) => (
                        <div
                          key={fb.id}
                          onClick={() => setSelectedSystemFeedback(fb)}
                          className="p-4 rounded-xl border bg-background text-xs space-y-2.5 shadow-2xs hover:border-blue-300 hover:shadow-xs transition cursor-pointer group flex flex-col justify-between"
                        >
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1.5 font-semibold text-foreground truncate max-w-[170px]" title={fb.senderName}>
                                <Badge
                                  variant="outline"
                                  className={cn(
                                    "text-[9px] px-1 py-0 font-bold",
                                    fb.senderRole === "LANDLORD"
                                      ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                                      : "bg-blue-50 text-blue-700 border-blue-300"
                                  )}
                                >
                                  {fb.senderRole === "LANDLORD" ? "Chủ trọ" : "Người thuê"}
                                </Badge>
                                <span className="truncate group-hover:text-blue-700 transition-colors">{fb.senderName}</span>
                              </div>
                              <div className="flex items-center gap-0.5 text-amber-500 shrink-0">
                                {Array.from({ length: fb.rating }).map((_, i) => (
                                  <Star key={i} className="size-3 fill-amber-500 text-amber-500" />
                                ))}
                              </div>
                            </div>

                            <p className="text-muted-foreground italic line-clamp-2 leading-relaxed">
                              "{fb.comment}"
                            </p>

                            <div className="inline-block px-2 py-0.5 rounded bg-blue-50/70 border border-blue-200/60 text-[10.5px] text-blue-800">
                              <span className="font-semibold">Chuyên mục:</span> {fb.categoryLabel}
                            </div>
                          </div>

                          <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1.5 border-t">
                            <span>{new Date(fb.createdAt).toLocaleDateString("vi-VN")}</span>
                            <span className="text-[10px] text-blue-600 font-medium group-hover:underline">
                              Xem chi tiết &rarr;
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                )}

                {/* BOTTOM ACTION BAR: Clean, elegant modal trigger replacing the ugly inline expansion */}
                <div className="p-3 rounded-xl bg-muted/30 border flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="text-xs text-muted-foreground">
                    <span className="font-semibold text-foreground">
                      Đang hiển thị 2 đánh giá tiêu biểu
                    </span>{" "}
                    (Tổng số {reviewScope === "LANDLORD" ? (stats?.totalReviews ?? 25) : systemFeedbacks.length} {reviewScope === "LANDLORD" ? "đánh giá chủ trọ" : "góp ý hệ thống"})
                  </div>

                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => setFullReviewsModalOpen(true)}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-8 px-3.5 font-semibold shadow-xs cursor-pointer gap-1.5 w-full sm:w-auto"
                  >
                    <SlidersHorizontal className="size-3.5" />
                    Xem toàn bộ & Lọc chi tiết ({reviewScope === "LANDLORD" ? (stats?.totalReviews ?? 25) : systemFeedbacks.length}) &rarr;
                  </Button>
                </div>
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
                    onClick={() => navigate("/admin/cccd")}
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
                  onClick={() => navigate("/admin/cccd")}
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

      {/* Modal Chi tiết Đánh giá từ Người thuê */}
      <Dialog open={!!selectedReview} onOpenChange={(open) => !open && setSelectedReview(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-foreground text-base">
              <Star className="size-5 text-amber-500 fill-amber-500" /> Chi tiết Đánh giá & Nhận xét
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Phản hồi trực tiếp từ người thuê có hợp đồng và đã check-in thực tế
            </DialogDescription>
          </DialogHeader>

          {selectedReview && (
            <div className="space-y-4 py-2 text-xs">
              <div className="p-3.5 rounded-xl bg-muted/30 border space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-foreground text-sm">{selectedReview.reviewerName}</span>
                    <Badge variant="secondary" className="text-[10px] py-0 px-1.5">
                      {selectedReview.reviewerRole || "Người thuê"}
                    </Badge>
                  </div>
                  <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[11px] gap-1">
                    <CheckCircle2 className="size-3" /> Đã ở thực tế
                  </Badge>
                </div>
                <div className="flex items-center gap-1 text-amber-500">
                  {Array.from({ length: selectedReview.rating }).map((_, i) => (
                    <Star key={i} className="size-3.5 fill-amber-500 text-amber-500" />
                  ))}
                  <span className="text-muted-foreground ml-1.5 font-medium">({selectedReview.rating}/5 sao)</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-muted/20 p-2.5 rounded-lg border">
                  <span className="text-muted-foreground text-[11px] block">Phòng trọ được đánh giá:</span>
                  <span className="font-semibold text-foreground line-clamp-1">{selectedReview.roomTitle || "Phòng trọ"}</span>
                </div>
                <div className="bg-muted/20 p-2.5 rounded-lg border">
                  <span className="text-muted-foreground text-[11px] block">Chủ trọ nhận đánh giá:</span>
                  <span className="font-semibold text-foreground line-clamp-1">{selectedReview.landlordName || "Chủ trọ hệ thống"}</span>
                </div>
              </div>

              <div>
                <span className="text-muted-foreground font-medium block mb-1">Nội dung nhận xét:</span>
                <p className="text-foreground bg-muted/20 p-3 rounded-lg border leading-relaxed italic">
                  "{selectedReview.comment || "Đánh giá chất lượng phòng trọ tốt, trải nghiệm ở thoải mái và an tâm."}"
                </p>
              </div>

              {selectedReview.landlordReply && (
                <div className="p-3 rounded-lg bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200/80">
                  <span className="font-semibold text-emerald-800 dark:text-emerald-300 block mb-1">
                    Phản hồi từ chủ trọ:
                  </span>
                  <p className="text-foreground leading-relaxed italic">
                    "{selectedReview.landlordReply}"
                  </p>
                  {selectedReview.repliedAt && (
                    <span className="text-[10px] text-muted-foreground block mt-1">
                      Ngày phản hồi: {new Date(selectedReview.repliedAt).toLocaleDateString("vi-VN")}
                    </span>
                  )}
                </div>
              )}

              <div className="flex items-center justify-between text-muted-foreground text-[11px] pt-1 border-t">
                <span>Thời gian gửi:</span>
                <span>{selectedReview.createdAt ? new Date(selectedReview.createdAt).toLocaleDateString("vi-VN") : "Gần đây"}</span>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="text-xs cursor-pointer"
              onClick={() => setSelectedReview(null)}
            >
              Đóng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Chi tiết Góp ý Hệ thống */}
      <Dialog open={!!selectedSystemFeedback} onOpenChange={(open) => !open && setSelectedSystemFeedback(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-foreground text-base">
              <Layers className="size-5 text-blue-600" /> Chi tiết Góp ý Nền tảng
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Ý kiến đóng góp xây dựng hệ thống từ người dùng thực tế
            </DialogDescription>
          </DialogHeader>

          {selectedSystemFeedback && (
            <div className="space-y-4 py-2 text-xs">
              <div className="p-3.5 rounded-xl bg-muted/30 border space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-foreground text-sm">{selectedSystemFeedback.senderName}</span>
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-[10px] py-0 px-2 font-bold",
                        selectedSystemFeedback.senderRole === "LANDLORD"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                          : "bg-blue-50 text-blue-700 border-blue-300"
                      )}
                    >
                      {selectedSystemFeedback.senderRole === "LANDLORD" ? "Chủ trọ hệ thống" : "Người thuê phòng"}
                    </Badge>
                  </div>
                  <span className="text-[11px] text-muted-foreground">
                    {new Date(selectedSystemFeedback.createdAt).toLocaleDateString("vi-VN")}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-amber-500">
                  {Array.from({ length: selectedSystemFeedback.rating }).map((_, i) => (
                    <Star key={i} className="size-3.5 fill-amber-500 text-amber-500" />
                  ))}
                  <span className="text-muted-foreground ml-1.5 font-medium">({selectedSystemFeedback.rating}/5 sao)</span>
                </div>
              </div>

              <div className="bg-blue-50/70 border border-blue-200/80 p-3 rounded-lg text-blue-900 space-y-1">
                <span className="text-[11px] font-semibold block text-blue-800">Chuyên mục phản hồi:</span>
                <span className="font-bold text-xs">{selectedSystemFeedback.categoryLabel}</span>
              </div>

              <div>
                <span className="text-muted-foreground font-medium block mb-1">Nội dung góp ý chi tiết:</span>
                <p className="text-foreground bg-muted/20 p-3.5 rounded-lg border leading-relaxed italic text-xs">
                  "{selectedSystemFeedback.comment}"
                </p>
              </div>

              <div className="p-3 rounded-lg bg-emerald-50/70 border border-emerald-200/80 text-[11px] text-emerald-900">
                <span className="font-semibold block mb-0.5 text-emerald-800">Ghi chú vận hành của Admin:</span>
                <p className="leading-relaxed">
                  Ý kiến đã được chuyển giao cho bộ phận Kỹ thuật & Chăm sóc khách hàng để ưu tiên cải thiện trong chu kỳ cập nhật tiếp theo.
                </p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="text-xs cursor-pointer"
              onClick={() => setSelectedSystemFeedback(null)}
            >
              Đóng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ──────────────── MODAL TRUNG TÂM QUẢN LÝ & LỌC TOÀN BỘ ĐÁNH GIÁ ──────────────── */}
      <Dialog open={fullReviewsModalOpen} onOpenChange={setFullReviewsModalOpen}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
          {/* Header with Sub-tabs switcher */}
          <div className="p-5 border-b space-y-3 bg-muted/20">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <DialogTitle className="text-lg font-bold text-foreground flex items-center gap-2">
                  <SlidersHorizontal className="size-5 text-emerald-600" /> Trung tâm Quản lý Đánh giá & Phản hồi
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                  Bộ lọc độc lập, xem xét toàn diện phản hồi từ Người thuê và Chủ trọ không làm xô lệch giao diện
                </DialogDescription>
              </div>

              {/* Sub-tab pills inside modal */}
              <div className="flex items-center p-1 rounded-xl bg-background border shadow-2xs gap-1">
                <button
                  type="button"
                  onClick={() => {
                    setReviewScope("LANDLORD");
                    setReviewStarFilter("ALL");
                  }}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all flex items-center gap-1.5",
                    reviewScope === "LANDLORD"
                      ? "bg-emerald-600 text-white shadow-2xs font-bold"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Home className="size-3.5" />
                  <span>Chủ trọ ({stats?.totalReviews ?? 25})</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setReviewScope("SYSTEM");
                    setReviewStarFilter("ALL");
                  }}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all flex items-center gap-1.5",
                    reviewScope === "SYSTEM"
                      ? "bg-blue-600 text-white shadow-2xs font-bold"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Layers className="size-3.5" />
                  <span>Hệ thống ({systemFeedbacks.length})</span>
                </button>
              </div>
            </div>

            {/* Filter Toolbar inside Modal */}
            <div className="flex flex-wrap items-center justify-between gap-2.5 pt-2">
              <div className="flex flex-wrap items-center gap-1.5">
                {/* Star Filter */}
                <button
                  onClick={() => setReviewStarFilter("ALL")}
                  className={cn(
                    "px-2.5 py-1 rounded-lg text-xs font-medium cursor-pointer transition-colors",
                    reviewStarFilter === "ALL"
                      ? "bg-foreground text-background shadow-2xs"
                      : "bg-muted/70 text-muted-foreground hover:bg-muted"
                  )}
                >
                  Tất cả sao
                </button>
                {[5, 4, 3, 2, 1].map((s) => (
                  <button
                    key={s}
                    onClick={() => setReviewStarFilter(reviewStarFilter === s ? "ALL" : s)}
                    className={cn(
                      "px-2 py-1 rounded-lg text-xs font-medium cursor-pointer transition-colors flex items-center gap-0.5",
                      reviewStarFilter === s
                        ? "bg-amber-500 text-white shadow-2xs"
                        : "bg-muted/70 text-muted-foreground hover:bg-muted"
                    )}
                  >
                    {s} <Star className="size-2.5 fill-amber-300 text-amber-300 inline" />
                  </button>
                ))}

                {/* Additional Role Filter if on SYSTEM scope */}
                {reviewScope === "SYSTEM" && (
                  <div className="flex items-center gap-1 pl-2 border-l ml-1">
                    <span className="text-[11px] text-muted-foreground font-medium">Vai trò:</span>
                    <button
                      onClick={() => setSystemRoleFilter("ALL")}
                      className={cn(
                        "px-2 py-0.5 rounded text-[11px] font-medium cursor-pointer",
                        systemRoleFilter === "ALL" ? "bg-blue-600 text-white" : "bg-muted text-muted-foreground"
                      )}
                    >
                      Tất cả
                    </button>
                    <button
                      onClick={() => setSystemRoleFilter("LANDLORD")}
                      className={cn(
                        "px-2 py-0.5 rounded text-[11px] font-medium cursor-pointer",
                        systemRoleFilter === "LANDLORD" ? "bg-emerald-600 text-white" : "bg-muted text-muted-foreground"
                      )}
                    >
                      Chủ trọ
                    </button>
                    <button
                      onClick={() => setSystemRoleFilter("TENANT")}
                      className={cn(
                        "px-2 py-0.5 rounded text-[11px] font-medium cursor-pointer",
                        systemRoleFilter === "TENANT" ? "bg-blue-600 text-white" : "bg-muted text-muted-foreground"
                      )}
                    >
                      Người thuê
                    </button>
                  </div>
                )}
              </div>

              {/* Search box inside Modal */}
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                <Input
                  value={reviewSearch}
                  onChange={(e) => setReviewSearch(e.target.value)}
                  placeholder={reviewScope === "LANDLORD" ? "Tìm người thuê, phòng, chủ..." : "Tìm người gửi, nội dung..."}
                  className="pl-8 h-8 text-xs rounded-lg bg-background"
                />
                {reviewSearch && (
                  <button
                    onClick={() => setReviewSearch("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-xs"
                  >
                    ×
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Scrollable Review Cards Container */}
          <div className="flex-1 overflow-y-auto p-5 space-y-3 min-h-[360px] max-h-[58vh]">
            {reviewScope === "LANDLORD" ? (
              filteredLandlordReviews.length === 0 ? (
                <div className="py-16 text-center text-xs text-muted-foreground space-y-2">
                  <MessageSquare className="size-8 text-muted-foreground/30 mx-auto" />
                  <p className="font-semibold text-sm">Không tìm thấy đánh giá chủ trọ phù hợp</p>
                  <p className="text-xs">Vui lòng chọn số sao khác hoặc xóa từ khóa tìm kiếm</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {filteredLandlordReviews.map((rev) => (
                    <div
                      key={rev.id}
                      onClick={() => setSelectedReview(rev)}
                      className="p-4 rounded-xl border bg-card text-xs space-y-2.5 shadow-2xs hover:border-emerald-300 hover:shadow-xs transition cursor-pointer group flex flex-col justify-between"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5 font-semibold text-foreground truncate max-w-[190px]" title={rev.reviewerName}>
                            <span className="size-2 rounded-full bg-emerald-500 shrink-0" />
                            <span className="truncate group-hover:text-emerald-700 transition-colors">{rev.reviewerName}</span>
                            <Badge variant="outline" className="text-[9px] px-1 py-0 bg-emerald-50 text-emerald-700 border-emerald-200">
                              Đã ở thực tế
                            </Badge>
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

                        {rev.landlordReply && (
                          <div className="p-2.5 rounded-lg bg-emerald-50/70 border border-emerald-200/60 text-[11px] text-emerald-800 line-clamp-2">
                            <span className="font-semibold">Chủ trọ ({rev.landlordName || "Chủ trọ"}):</span> {rev.landlordReply}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-2 border-t mt-1">
                        <span className="truncate max-w-[180px] font-medium" title={rev.roomTitle}>{rev.roomTitle || "Phòng trọ"}</span>
                        <span className="text-[10px] text-emerald-600 font-medium group-hover:underline">
                          Xem chi tiết &rarr;
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )
            ) : (
              filteredSystemFeedbacks.length === 0 ? (
                <div className="py-16 text-center text-xs text-muted-foreground space-y-2">
                  <Layers className="size-8 text-muted-foreground/30 mx-auto" />
                  <p className="font-semibold text-sm">
                    {systemFeedbacks.length === 0 ? "Chưa có đánh giá nào về hệ thống" : "Không tìm thấy góp ý hệ thống phù hợp"}
                  </p>
                  <p className="text-xs">
                    {systemFeedbacks.length === 0
                      ? "Khi người dùng hoặc chủ trọ gửi góp ý nền tảng, phản hồi thực tế sẽ xuất hiện tại đây."
                      : "Vui lòng điều chỉnh tiêu chí lọc vai trò, số sao hoặc từ khóa"}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {filteredSystemFeedbacks.map((fb) => (
                    <div
                      key={fb.id}
                      onClick={() => setSelectedSystemFeedback(fb)}
                      className="p-4 rounded-xl border bg-card text-xs space-y-2.5 shadow-2xs hover:border-blue-300 hover:shadow-xs transition cursor-pointer group flex flex-col justify-between"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5 font-semibold text-foreground truncate max-w-[190px]" title={fb.senderName}>
                            <Badge
                              variant="outline"
                              className={cn(
                                "text-[9px] px-1.5 py-0 font-bold",
                                fb.senderRole === "LANDLORD"
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                                  : "bg-blue-50 text-blue-700 border-blue-300"
                              )}
                            >
                              {fb.senderRole === "LANDLORD" ? "Chủ trọ" : "Người thuê"}
                            </Badge>
                            <span className="truncate group-hover:text-blue-700 transition-colors">{fb.senderName}</span>
                          </div>
                          <div className="flex items-center gap-0.5 text-amber-500 shrink-0">
                            {Array.from({ length: fb.rating }).map((_, i) => (
                              <Star key={i} className="size-3 fill-amber-500 text-amber-500" />
                            ))}
                          </div>
                        </div>

                        <p className="text-muted-foreground italic line-clamp-3 leading-relaxed">
                          "{fb.comment}"
                        </p>

                        <div className="inline-block px-2 py-0.5 rounded bg-blue-50/70 border border-blue-200/60 text-[10.5px] text-blue-800">
                          <span className="font-semibold">Chuyên mục:</span> {fb.categoryLabel}
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-2 border-t mt-1">
                        <span>{new Date(fb.createdAt).toLocaleDateString("vi-VN")}</span>
                        <span className="text-[10px] text-blue-600 font-medium group-hover:underline">
                          Xem chi tiết &rarr;
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}
          </div>

          {/* Modal Footer */}
          <DialogFooter className="p-4 border-t bg-muted/10 flex flex-row items-center justify-between">
            <div className="text-xs text-muted-foreground">
              Hiển thị{" "}
              <span className="font-bold text-foreground">
                {reviewScope === "LANDLORD" ? filteredLandlordReviews.length : filteredSystemFeedbacks.length}
              </span>{" "}
              kết quả
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="text-xs cursor-pointer"
              onClick={() => setFullReviewsModalOpen(false)}
            >
              Đóng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
