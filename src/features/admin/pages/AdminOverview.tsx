import { useState, useEffect, useMemo } from "react";
import { api } from "@/lib/api";
import {
  Users, Home, Star, AlertCircle,
  Activity, RefreshCw, ShieldCheck,
  Building2, UserCheck, CheckCircle2,
  CreditCard, ChevronRight, Shield, BarChart3,
  Search, MessageSquare, SlidersHorizontal, Layers,
  Trash2, Sparkles, TrendingUp, Compass, HeartHandshake,
} from "lucide-react";
import {
  ResponsiveContainer,
  ComposedChart,
  BarChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";
import { reviewsApi } from "@/features/reviews/api/reviewsApi";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { formatVND, cn } from "@/lib/utils";
import { useNavigate } from "react-router";
import { getTrafficStats } from "@/lib/analytics";
import { toast } from "sonner";

type CategoryStat = {
  name: string;
  count: number;
  percentage: number;
};

type DistrictSupplyDemand = {
  district: string;
  supply: number;
  demand: number;
};

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
  pendingReportsCount: number;
  totalSwipes: number;
  totalSwapRequests: number;
  activeBoostedRooms: number;
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
  roomTypeDistribution: CategoryStat[];
  districtDistribution: CategoryStat[];
  roomStatusDistribution: CategoryStat[];
  lifestyleStats: CategoryStat[];
  personalizationFunnel: CategoryStat[];
  districtSupplyDemand: DistrictSupplyDemand[];
  kycOverview: {
    pendingCount: number;
    approvedCount: number;
    rejectedCount: number;
    approvalRate: number;
  } | null;
};

type AnalyticsTabKey = "growth" | "tenants" | "landlords";

const CHART_COLORS = ["#059669", "#2563eb", "#7c3aed", "#d97706", "#e11d48", "#0891b2"];
const TRUST_COLORS = ["#f43f5e", "#f59e0b", "#3b82f6", "#10b981"];

export default function AdminOverview() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [trafficList, setTrafficList] = useState(getTrafficStats());
  const [selectedReview, setSelectedReview] = useState<any | null>(null);
  const [analyticsTab, setAnalyticsTab] = useState<AnalyticsTabKey>("growth");

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
        pendingReportsCount: d.pendingReportsCount ?? 0,
        totalSwipes: d.totalSwipes ?? 0,
        totalSwapRequests: d.totalSwapRequests ?? 0,
        activeBoostedRooms: d.activeBoostedRooms ?? 0,
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
        systemFeedbacks: d.systemFeedbacks || [],
        packageStats: d.packageStats || [],
        roomTypeDistribution: d.roomTypeDistribution || [],
        districtDistribution: d.districtDistribution || [],
        roomStatusDistribution: d.roomStatusDistribution || [],
        lifestyleStats: d.lifestyleStats || [],
        personalizationFunnel: d.personalizationFunnel || [],
        districtSupplyDemand: d.districtSupplyDemand || [],
        kycOverview: d.kycOverview || null,
      });
      setTrafficList(getTrafficStats());
      if (isManual) {
        toast.success("Đã cập nhật số liệu thống kê mới nhất!");
      }
    } catch {
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
        pendingReportsCount: 0,
        totalSwipes: 0,
        totalSwapRequests: 0,
        activeBoostedRooms: 0,
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
        lifestyleStats: [],
        personalizationFunnel: [],
        districtSupplyDemand: [],
        kycOverview: null,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  // ───────────── REVIEW & SYSTEM FEEDBACK STATE & LOGIC ─────────────
  type SystemFeedbackCategory =
    | "app_experience"
    | "room_management"
    | "tenant_management"
    | "service_package"
    | "payment_system"
    | "matching_feature"
    | "booking_swap"
    | "landlord_quality"
    | "other";

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
  const [systemCategoryFilter] = useState<string>("ALL");
  const [selectedSystemFeedback, setSelectedSystemFeedback] = useState<SystemFeedbackItem | null>(null);
  const [isDeletingFeedback, setIsDeletingFeedback] = useState(false);

  const handleDeleteSystemFeedback = async (id: string) => {
    if (
      !window.confirm(
        "Bạn có chắc chắn muốn xóa góp ý này không? Thao tác này sẽ gỡ bỏ vĩnh viễn và không thể khôi phục."
      )
    ) {
      return;
    }
    setIsDeletingFeedback(true);
    try {
      await reviewsApi.deleteSystemFeedback(id);
      toast.success("Đã xóa góp ý thành công!");
      setSelectedSystemFeedback(null);
      await fetchStats(false);
    } catch {
      toast.error("Không thể xóa góp ý này. Vui lòng thử lại sau!");
    } finally {
      setIsDeletingFeedback(false);
    }
  };

  const systemFeedbacks = useMemo<SystemFeedbackItem[]>(() => {
    if (stats?.systemFeedbacks && Array.isArray(stats.systemFeedbacks)) {
      const catMap: Record<string, string> = {
        app_experience: "Trải nghiệm & Giao diện",
        room_management: "Đăng tin & Quản lý phòng",
        tenant_management: "Quản lý người thuê & Hợp đồng",
        service_package: "Gói dịch vụ & Đẩy tin nổi bật",
        payment_system: "Thanh toán PayOS",
        matching_feature: "Tính năng ghép bạn ở ghép",
        booking_swap: "Đặt lịch xem & Nhận phòng",
        landlord_quality: "Chất lượng tin đăng & Chủ trọ",
        other: "Góp ý khác",
      };
      return stats.systemFeedbacks.map((item) => ({
        id: item.id,
        rating: item.rating,
        category: (item.category || "app_experience") as SystemFeedbackCategory,
        categoryLabel: catMap[item.category] || "Góp ý ứng dụng",
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

  // ───────────── ANALYTICAL DATA TRANSFORMATIONS ─────────────
  const totalTrafficSessions = useMemo(
    () => trafficList.reduce((acc, item) => acc + item.count, 0),
    [trafficList]
  );

  const funnelData = useMemo<CategoryStat[]>(() => {
    if (stats?.personalizationFunnel && stats.personalizationFunnel.length > 0) {
      return stats.personalizationFunnel;
    }
    if (!stats) return [];
    const base = Math.max(stats.totalUsers, 1);
    return [
      {
        name: "Người thuê đăng ký",
        count: stats.totalTenants,
        percentage: Math.min(100, Math.round((stats.totalTenants * 100) / base)),
      },
      {
        name: "Đã xác minh CCCD",
        count: stats.verifiedUsersCount,
        percentage: Math.min(100, Math.round((stats.verifiedUsersCount * 100) / base)),
      },
      {
        name: "Ghép bạn thành công",
        count: stats.totalMatches,
        percentage: Math.min(100, Math.round((stats.totalMatches * 100) / Math.max(stats.totalTenants, 1))),
      },
      {
        name: "Ký hợp đồng thuê",
        count: stats.totalRentals,
        percentage: Math.min(100, Math.round((stats.totalRentals * 100) / Math.max(stats.totalTenants, 1))),
      },
    ];
  }, [stats]);

  const districtChartData = useMemo<DistrictSupplyDemand[]>(() => {
    if (stats?.districtSupplyDemand && stats.districtSupplyDemand.length > 0) {
      return stats.districtSupplyDemand;
    }
    if (stats?.districtDistribution && stats.districtDistribution.length > 0) {
      return stats.districtDistribution.map((d) => ({
        district: d.name,
        supply: d.count,
        demand: 0,
      }));
    }
    return [];
  }, [stats]);

  const hasDemandColumn = useMemo(
    () => districtChartData.some((d) => d.demand > 0),
    [districtChartData]
  );

  const pendingTotalActions =
    (stats?.pendingKycCount ?? 0) +
    (stats?.pendingDisputesCount ?? 0) +
    (stats?.pendingReportsCount ?? 0);

  const occupancyRate = useMemo(() => {
    const total = stats?.totalRooms ?? 0;
    const active = stats?.activeRooms ?? 0;
    if (total <= 0) return 0;
    return Math.round(((total - active) / total) * 100);
  }, [stats?.totalRooms, stats?.activeRooms]);

  return (
    <div className="space-y-4">
      {/* ──────────────── ROW 1: COMPACT HEADER ──────────────── */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
          <h1 className="font-display text-xl font-bold tracking-tight text-foreground">
            Tổng quan vận hành
          </h1>
          <span className="text-xs text-muted-foreground">
            Doanh thu, lưu lượng khách truy cập, đánh giá người dùng và số liệu toàn hệ thống
          </span>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-1.5 cursor-pointer text-xs font-medium px-3 rounded-xl shrink-0 active:scale-[0.98] transition-transform"
          onClick={() => fetchStats(true)}
          disabled={loading}
        >
          <RefreshCw className={cn("size-3.5", loading && "animate-spin")} />
          Làm mới số liệu
        </Button>
      </div>

      {/* ──────────────── ROW 2: UNIFIED EXECUTIVE PULSE STRIP (CLEAN, UNCLUTTERED) ──────────────── */}
      <div className="rounded-2xl bg-card ring-1 ring-border shadow-2xs grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-border/70 overflow-hidden">
        {/* Metric 1: Người dùng */}
        <button
          type="button"
          onClick={() => navigate("/admin/users")}
          className="p-3.5 text-left hover:bg-mint/20 transition-colors cursor-pointer flex items-center justify-between gap-3 group"
        >
          <div className="min-w-0">
            <span className="text-xs font-medium text-muted-foreground block">
              Người dùng hệ thống
            </span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-2xl font-bold text-foreground tracking-tight tabular-nums">
                {stats ? stats.totalUsers.toLocaleString() : "--"}
              </span>
              <span className="text-xs font-medium text-emerald-brand">
                {stats?.verifiedUsersCount ?? 0} đã xác minh
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
              {stats?.totalTenants ?? 0} người thuê &bull; {stats?.totalLandlords ?? 0} chủ trọ
            </p>
          </div>
          <div className="size-9 rounded-xl bg-mint/70 text-emerald-deep flex items-center justify-center shrink-0 group-hover:bg-mint transition-colors">
            <Users className="size-4" />
          </div>
        </button>

        {/* Metric 2: Nguồn cung phòng */}
        <div className="p-3.5 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <span className="text-xs font-medium text-muted-foreground block">
              Nguồn cung phòng trọ
            </span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-2xl font-bold text-foreground tracking-tight tabular-nums">
                {stats ? stats.totalRooms.toLocaleString() : "--"}
              </span>
              <span className="text-xs font-medium text-blue-600">
                Lấp đầy {occupancyRate}%
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
              {stats?.activeRooms ?? 0} phòng đang mở &bull; {stats?.totalRentals ?? 0} hợp đồng
            </p>
          </div>
          <div className="size-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Home className="size-4" />
          </div>
        </div>

        {/* Metric 3: Hoạt động Ghép bạn ở ghép */}
        <div className="p-3.5 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <span className="text-xs font-medium text-muted-foreground block">
              Hoạt động Ghép bạn ở ghép
            </span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-2xl font-bold text-foreground tracking-tight tabular-nums">
                {stats ? stats.totalMatches.toLocaleString() : "--"}
              </span>
              <span className="text-xs font-medium text-purple-600">
                cặp kết nối
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
              {stats?.totalSwipes ?? 0} lượt tương tác tìm bạn cùng phòng
            </p>
          </div>
          <div className="size-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
            <Sparkles className="size-4" />
          </div>
        </div>

        {/* Metric 4: Chờ kiểm duyệt */}
        <button
          type="button"
          onClick={() => navigate("/admin/cccd")}
          className="p-3.5 text-left hover:bg-amber-50/40 transition-colors cursor-pointer flex items-center justify-between gap-3 group"
        >
          <div className="min-w-0">
            <span className="text-xs font-medium text-muted-foreground block">
              Hồ sơ &amp; Báo cáo chờ duyệt
            </span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-2xl font-bold text-foreground tracking-tight tabular-nums">
                {stats ? pendingTotalActions : "--"}
              </span>
              <span className="text-xs font-medium text-amber-600">
                cần xử lý
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
              {stats?.pendingKycCount ?? 0} hồ sơ CCCD &bull; {stats?.pendingReportsCount ?? 0} báo cáo vi phạm
            </p>
          </div>
          <div className="size-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 group-hover:bg-amber-100/80 transition-colors">
            <ShieldCheck className="size-4" />
          </div>
        </button>
      </div>

      {/* ──────────────── ROW 3: THE 3 CORE PILLARS (ALWAYS VISIBLE FIRST ABOVE THE FOLD) ──────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
        {/* PILLAR 1 (4/12): DOANH THU & GÓI DỊCH VỤ */}
        <div className="lg:col-span-4 rounded-2xl bg-card p-4 ring-1 ring-border shadow-2xs flex flex-col justify-between space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h2 className="text-sm font-bold text-foreground">Doanh thu &amp; Gói dịch vụ</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Tiền cọc, tiền thuê phòng &amp; các gói dịch vụ trả phí
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/admin/packages")}
              className="h-7 px-2.5 text-xs cursor-pointer gap-1 shrink-0 rounded-lg"
            >
              Gói dịch vụ <ChevronRight className="size-3" />
            </Button>
          </div>

          {/* Primary Revenue Metric (Clean layout without heavy nested card borders) */}
          <div className="py-2.5 px-3.5 rounded-xl bg-mint/40 flex items-center justify-between">
            <div>
              <span className="text-xs text-emerald-deep font-medium block">
                Tổng doanh thu ghi nhận
              </span>
              <span className="text-2xl font-bold text-emerald-deep tracking-tight tabular-nums">
                {stats ? formatVND(stats.totalRevenue) : "--"}
              </span>
            </div>
            <div className="text-right text-xs space-y-0.5 tabular-nums">
              <div className="text-foreground font-semibold">
                {stats?.totalTransactions ?? 0} <span className="font-normal text-muted-foreground">giao dịch</span>
              </div>
              <div className="text-emerald-brand font-medium">
                {stats?.activeRentals ?? 0} <span className="font-normal text-muted-foreground">HĐ đang thuê</span>
              </div>
            </div>
          </div>

          {/* Package Revenue List */}
          <div className="flex-1 flex flex-col justify-between space-y-2 pt-1 border-t border-border/60">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-foreground flex items-center gap-1.5">
                <CreditCard className="size-3.5 text-primary" /> Doanh thu theo gói
              </span>
              <span className="text-muted-foreground tabular-nums">
                {stats?.activeBoostedRooms ?? 0} phòng đang đẩy nổi bật
              </span>
            </div>

            {stats?.packageStats && stats.packageStats.length > 0 ? (
              <div className="divide-y divide-border/50">
                {stats.packageStats.slice(0, 3).map((pkg, idx) => {
                  const maxPkgRev = Math.max(...stats.packageStats.map((p) => p.revenue), 1);
                  const pct = pkg.revenue > 0 ? Math.max(Math.round((pkg.revenue / maxPkgRev) * 100), 6) : 0;
                  return (
                    <div key={pkg.planId || idx} className="py-2 first:pt-1 last:pb-0 space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-foreground truncate max-w-[160px]" title={pkg.planName}>
                          {pkg.planName}
                        </span>
                        <div className="flex items-center gap-2 shrink-0 tabular-nums">
                          <span className="text-muted-foreground text-[11px]">{pkg.count} lượt</span>
                          <span className="font-bold text-emerald-deep">
                            {formatVND(pkg.revenue)}
                          </span>
                        </div>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-secondary overflow-hidden">
                        <div
                          className="h-full rounded-full bg-primary transition-all duration-300"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-6 text-center text-xs text-muted-foreground bg-secondary/25 rounded-xl">
                Chưa phát sinh giao dịch mua gói dịch vụ
              </div>
            )}
          </div>
        </div>

        {/* PILLAR 2 (3/12): LƯỢNG KHÁCH TRUY CẬP */}
        <div className="lg:col-span-3 rounded-2xl bg-card p-4 ring-1 ring-border shadow-2xs flex flex-col justify-between space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h2 className="text-sm font-bold text-foreground">Lượng khách truy cập</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Phân bổ lượt truy cập theo kênh
              </p>
            </div>
            <div className="size-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <Compass className="size-4" />
            </div>
          </div>

          {/* Clean Total Visits Hero */}
          <div className="py-2.5 px-3.5 rounded-xl bg-blue-50/60 flex items-baseline justify-between">
            <span className="text-xs font-medium text-blue-900">Tổng lượt truy cập</span>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold text-blue-700 tracking-tight tabular-nums">
                {totalTrafficSessions.toLocaleString()}
              </span>
              <span className="text-xs text-blue-700/80 font-medium">lượt</span>
            </div>
          </div>

          {/* Clean Channel Breakdown Bars */}
          <div className="space-y-2.5 pt-1 border-t border-border/60 flex-1 flex flex-col justify-center">
            {trafficList.map((src) => (
              <div key={src.key} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-foreground truncate max-w-[130px]" title={src.name}>
                    {src.shortName}
                  </span>
                  <span className="text-muted-foreground tabular-nums">
                    <strong className="text-foreground font-semibold">{src.count}</strong> ({src.percentage}%)
                  </span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-secondary overflow-hidden">
                  <div
                    className={cn("h-full rounded-full transition-all duration-300", src.color)}
                    style={{ width: `${Math.max(src.percentage, src.count > 0 ? 4 : 0)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* PILLAR 3 (5/12): ĐÁNH GIÁ & GÓP Ý TỪ NGƯỜI DÙNG (WITH POPUP TRIGGERS) */}
        <div className="lg:col-span-5 rounded-2xl bg-card p-4 ring-1 ring-border shadow-2xs flex flex-col justify-between space-y-3">
          {/* Header + Scope Switcher */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-bold text-foreground">Đánh giá &amp; Góp ý người dùng</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Chọn mức sao để lọc nhanh hoặc mở bảng tìm kiếm chi tiết
              </p>
            </div>

            <div className="flex items-center p-0.5 rounded-xl bg-secondary/80 border border-border/60 gap-0.5">
              <button
                type="button"
                onClick={() => {
                  setReviewScope("LANDLORD");
                  setReviewStarFilter("ALL");
                }}
                className={cn(
                  "px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-all flex items-center gap-1",
                  reviewScope === "LANDLORD"
                    ? "bg-card text-emerald-deep shadow-2xs"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Home className="size-3" />
                Chủ trọ ({stats?.totalReviews ?? 0})
              </button>
              <button
                type="button"
                onClick={() => {
                  setReviewScope("SYSTEM");
                  setReviewStarFilter("ALL");
                }}
                className={cn(
                  "px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-all flex items-center gap-1",
                  reviewScope === "SYSTEM"
                    ? "bg-card text-blue-700 shadow-2xs"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Layers className="size-3" />
                Ứng dụng ({systemFeedbacks.length})
              </button>
            </div>
          </div>

          {/* Rating Summary + Interactive Star Filter Bars */}
          <div className="grid grid-cols-12 gap-3 items-center py-2 px-3 rounded-xl bg-secondary/25">
            <div className="col-span-4 text-center border-r border-border/60 pr-2">
              <div className="text-2xl font-extrabold text-foreground leading-none tabular-nums">
                {reviewScope === "LANDLORD"
                  ? stats && stats.landlordAverageRating > 0
                    ? stats.landlordAverageRating.toFixed(1)
                    : "0.0"
                  : systemAverageRating.toFixed(1)}
              </div>
              <div className="flex items-center justify-center gap-0.5 my-1 text-amber-500">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star key={i} className="size-2.5 fill-amber-500 text-amber-500" />
                ))}
              </div>
              <span className="text-[11px] text-muted-foreground block tabular-nums">
                {reviewScope === "LANDLORD"
                  ? `${stats?.totalReviews ?? 0} đánh giá`
                  : `${systemFeedbacks.length} góp ý`}
              </span>
            </div>

            <div className="col-span-8 space-y-1">
              {(reviewScope === "LANDLORD"
                ? stats?.ratingDistribution && stats.ratingDistribution.length > 0
                  ? stats.ratingDistribution
                  : [5, 4, 3, 2, 1].map((star) => ({ star, count: 0, percentage: 0 }))
                : systemRatingDistribution
              ).map((r) => {
                const isSelected = reviewStarFilter === r.star;
                return (
                  <button
                    key={r.star}
                    type="button"
                    onClick={() => setReviewStarFilter(isSelected ? "ALL" : r.star)}
                    className={cn(
                      "w-full flex items-center gap-1.5 text-[11px] rounded-md px-1.5 py-0.5 transition cursor-pointer",
                      isSelected ? "bg-amber-500/15 font-bold" : "hover:bg-secondary"
                    )}
                  >
                    <span className="w-6 text-left font-medium text-foreground flex items-center gap-0.5 tabular-nums">
                      {r.star}
                      <Star className="size-2.5 fill-amber-400 text-amber-400" />
                    </span>
                    <div className="flex-1 h-1.5 rounded-full bg-secondary overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all",
                          reviewScope === "LANDLORD" ? "bg-amber-500" : "bg-blue-500"
                        )}
                        style={{ width: `${r.percentage}%` }}
                      />
                    </div>
                    <span className="w-7 text-right tabular-nums text-muted-foreground">{r.count}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2 Highlight Review Cards (Click to open Detail Popup) */}
          {reviewScope === "LANDLORD" ? (
            filteredLandlordReviews.length === 0 ? (
              <div className="py-4 text-center text-xs text-muted-foreground bg-secondary/20 rounded-xl">
                Chưa có đánh giá chủ trọ nào khớp bộ lọc
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {filteredLandlordReviews.slice(0, 2).map((rev) => (
                  <div
                    key={rev.id}
                    onClick={() => setSelectedReview(rev)}
                    className="p-2.5 rounded-xl bg-secondary/20 hover:bg-mint/25 ring-1 ring-border/70 hover:ring-primary/40 text-xs space-y-1 transition cursor-pointer group flex flex-col justify-between"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-semibold text-foreground truncate text-xs group-hover:text-emerald-deep">
                          {rev.reviewerName}
                        </span>
                        <span className="flex items-center gap-0.5 text-amber-500 shrink-0 text-[11px] font-bold tabular-nums">
                          {rev.rating} <Star className="size-2.5 fill-amber-500 text-amber-500" />
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground line-clamp-2 leading-snug">
                        "{rev.comment || "Trải nghiệm thuê phòng tốt."}"
                      </p>
                    </div>
                    <div className="flex items-center justify-between text-[10.5px] text-muted-foreground pt-1">
                      <span className="truncate max-w-[115px]">{rev.roomTitle || "Phòng trọ"}</span>
                      <span className="text-emerald-brand font-semibold group-hover:underline">Chi tiết &rarr;</span>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : filteredSystemFeedbacks.length === 0 ? (
            <div className="py-4 text-center text-xs text-muted-foreground bg-secondary/20 rounded-xl">
              Chưa có góp ý ứng dụng nào khớp bộ lọc
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {filteredSystemFeedbacks.slice(0, 2).map((fb) => (
                <div
                  key={fb.id}
                  onClick={() => setSelectedSystemFeedback(fb)}
                  className="p-2.5 rounded-xl bg-secondary/20 hover:bg-blue-50/50 ring-1 ring-border/70 hover:ring-blue-300 text-xs space-y-1 transition cursor-pointer group flex flex-col justify-between"
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-semibold text-foreground truncate text-xs group-hover:text-blue-700">
                        {fb.senderName}
                      </span>
                      <span className="flex items-center gap-0.5 text-amber-500 shrink-0 text-[11px] font-bold tabular-nums">
                        {fb.rating} <Star className="size-2.5 fill-amber-500 text-amber-500" />
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground line-clamp-2 leading-snug">
                      "{fb.comment}"
                    </p>
                  </div>
                  <div className="flex items-center justify-between text-[10.5px] text-muted-foreground pt-1">
                    <span className="truncate max-w-[115px] text-blue-700 font-medium">{fb.categoryLabel}</span>
                    <span className="text-blue-600 font-semibold group-hover:underline">Chi tiết &rarr;</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Footer Action: Open Full Search & Filter Popup */}
          <div className="flex items-center justify-between gap-2 pt-1 border-t border-border/60">
            {reviewStarFilter !== "ALL" ? (
              <button
                type="button"
                onClick={() => setReviewStarFilter("ALL")}
                className="text-xs text-amber-700 hover:underline font-medium cursor-pointer"
              >
                Đang lọc {reviewStarFilter} sao (Bỏ lọc)
              </button>
            ) : (
              <span className="text-xs text-muted-foreground">
                Hiển thị 2 nhận xét mới nhất
              </span>
            )}
            <Button
              variant="default"
              size="sm"
              onClick={() => setFullReviewsModalOpen(true)}
              className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs h-8 px-3 font-semibold cursor-pointer gap-1.5 rounded-xl active:scale-[0.98] transition-transform"
            >
              <SlidersHorizontal className="size-3.5" />
              Tìm &amp; Xem tất cả ({reviewScope === "LANDLORD" ? (stats?.totalReviews ?? 0) : systemFeedbacks.length})
            </Button>
          </div>
        </div>
      </div>

      {/* ──────────────── ROW 4: DEEP-DIVE ANALYTICS TABS (CLEAN CHARTS BELOW) ──────────────── */}
      <div className="space-y-3 pt-1">
        <div className="flex flex-wrap items-center gap-1 border-b border-border">
          {(
            [
              {
                key: "growth" as const,
                label: "Biểu đồ Tăng trưởng & Chuyển đổi",
                icon: TrendingUp,
              },
              {
                key: "tenants" as const,
                label: "Xu hướng Người thuê & Điểm uy tín",
                icon: HeartHandshake,
              },
              {
                key: "landlords" as const,
                label: "Khu vực & Cơ cấu Nguồn phòng",
                icon: Building2,
              },
            ]
          ).map((tab) => {
            const Icon = tab.icon;
            const active = analyticsTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setAnalyticsTab(tab.key)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2.5 text-sm font-semibold transition-colors cursor-pointer border-b-2 -mb-px",
                  active
                    ? "border-primary text-emerald-deep"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className={cn("size-4 shrink-0", active ? "text-primary" : "text-muted-foreground")} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* TAB 1: TĂNG TRƯỞNG & PHỄU CHUYỂN ĐỔI */}
        {analyticsTab === "growth" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            <div className="lg:col-span-7 rounded-2xl bg-card p-4 ring-1 ring-border shadow-2xs space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-foreground">
                    Biểu đồ Tăng trưởng Người dùng, Hợp đồng &amp; Doanh thu (6 tháng)
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Đối sánh lượng người dùng đăng ký mới, hợp đồng ký kết và doanh thu theo tháng
                  </p>
                </div>
                <div className="size-8 rounded-xl bg-mint/70 text-emerald-deep flex items-center justify-center shrink-0">
                  <BarChart3 className="size-4" />
                </div>
              </div>

              <div className="h-52 w-full pt-1">
                {stats?.monthlyStats && stats.monthlyStats.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={stats.monthlyStats} margin={{ top: 8, right: 12, left: -15, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                      <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                      <YAxis yAxisId="left" tick={{ fontSize: 11 }} allowDecimals={false} />
                      <YAxis
                        yAxisId="right"
                        orientation="right"
                        tick={{ fontSize: 10 }}
                        tickFormatter={(v) => (v >= 1000000 ? `${(v / 1000000).toFixed(1)}tr` : `${v}`)}
                      />
                      <Tooltip
                        formatter={(value: any, name: any) => {
                          if (name === "Doanh thu") return [formatVND(Number(value)), name];
                          return [value, name];
                        }}
                        contentStyle={{ fontSize: "12px", borderRadius: "10px" }}
                      />
                      <Legend wrapperStyle={{ fontSize: "11px" }} />
                      <Bar
                        yAxisId="left"
                        dataKey="newUsers"
                        name="Người dùng mới"
                        fill="#10b981"
                        radius={[4, 4, 0, 0]}
                        barSize={18}
                      />
                      <Bar
                        yAxisId="left"
                        dataKey="newRentals"
                        name="Hợp đồng mới"
                        fill="#3b82f6"
                        radius={[4, 4, 0, 0]}
                        barSize={18}
                      />
                      <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey="revenue"
                        name="Doanh thu"
                        stroke="#f59e0b"
                        strokeWidth={2.5}
                        dot={{ r: 3.5, fill: "#f59e0b" }}
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-xs text-muted-foreground border border-dashed rounded-xl">
                    Đang tải hoặc chưa có dữ liệu thống kê theo tháng
                  </div>
                )}
              </div>
            </div>

            <div className="lg:col-span-5 rounded-2xl bg-card p-4 ring-1 ring-border shadow-2xs space-y-2 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-foreground">
                    Hành trình Tìm phòng &amp; Ghép bạn
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Từ lúc đăng ký tài khoản đến khi ghép bạn và ký hợp đồng thuê
                  </p>
                </div>
                <div className="size-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                  <Activity className="size-4" />
                </div>
              </div>

              <div className="h-52 w-full pt-1">
                {funnelData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={funnelData}
                      layout="vertical"
                      margin={{ top: 4, right: 20, left: 5, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e5e7eb" />
                      <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
                      <YAxis
                        type="category"
                        dataKey="name"
                        width={145}
                        tick={{ fontSize: 11, fontWeight: 500 }}
                      />
                      <Tooltip
                        formatter={(value: any, _name: any, props: any) => [
                          `${value} (${props?.payload?.percentage ?? 0}%)`,
                          "Số lượng",
                        ]}
                        contentStyle={{ fontSize: "12px", borderRadius: "10px" }}
                      />
                      <Bar dataKey="count" name="Số lượng" radius={[0, 6, 6, 0]} barSize={16}>
                        {funnelData.map((_entry, index) => (
                          <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-xs text-muted-foreground">
                    Chưa có dữ liệu thống kê
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: XU HƯỚNG NGƯỜI THUÊ & UY TÍN */}
        {analyticsTab === "tenants" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            <div className="lg:col-span-5 rounded-2xl bg-card p-4 ring-1 ring-border shadow-2xs space-y-2.5 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-foreground">
                    Tiêu chí Lối sống được Người thuê quan tâm
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Tỷ lệ người thuê ưu tiên từng thói quen sinh hoạt khi ghép bạn ở ghép
                  </p>
                </div>
                <div className="size-8 rounded-xl bg-mint/70 text-emerald-deep flex items-center justify-center shrink-0">
                  <Sparkles className="size-4" />
                </div>
              </div>

              {stats?.lifestyleStats && stats.lifestyleStats.length > 0 ? (
                <div className="h-48 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="68%" data={stats.lifestyleStats}>
                      <PolarGrid stroke="#e5e7eb" />
                      <PolarAngleAxis dataKey="name" tick={{ fontSize: 10, fill: "#374151" }} />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 9 }} />
                      <Radar
                        name="Tỷ lệ ưu tiên (%)"
                        dataKey="percentage"
                        stroke="#059669"
                        fill="#10b981"
                        fillOpacity={0.35}
                      />
                      <Tooltip
                        formatter={(value: any, _name: any, props: any) => [
                          `${value}% (${props?.payload?.count ?? 0} người thuê)`,
                          "Mức độ ưu tiên",
                        ]}
                        contentStyle={{ fontSize: "12px", borderRadius: "10px" }}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="py-8 px-4 rounded-xl bg-secondary/20 text-center space-y-1.5">
                  <UserCheck className="size-6 text-emerald-brand mx-auto" />
                  <p className="text-xs font-semibold text-foreground">
                    Thống kê Hồ sơ Ghép bạn &amp; Lối sống
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Hiện có <strong>{stats?.totalTenants ?? 0}</strong> người thuê,{" "}
                    <strong>{stats?.verifiedUsersCount ?? 0}</strong> đã xác minh CCCD và{" "}
                    <strong>{stats?.totalMatches ?? 0}</strong> cặp ghép bạn thành công.
                  </p>
                </div>
              )}
            </div>

            <div className="lg:col-span-4 rounded-2xl bg-card p-4 ring-1 ring-border shadow-2xs space-y-2.5 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-foreground">Phân bổ Điểm uy tín</h3>
                  <p className="text-xs text-muted-foreground">
                    Đánh giá mức độ tin cậy của cộng đồng trên nền tảng
                  </p>
                </div>
                <div className="size-8 rounded-xl bg-mint/70 text-emerald-deep flex items-center justify-center shrink-0">
                  <ShieldCheck className="size-4" />
                </div>
              </div>

              <div className="h-48 w-full">
                {stats?.trustScoreDistribution && stats.trustScoreDistribution.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={stats.trustScoreDistribution}
                      margin={{ top: 8, right: 8, left: -18, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                      <XAxis dataKey="range" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                      <Tooltip
                        formatter={(value: any, _name: any, props: any) => [
                          `${value} người (${props?.payload?.percentage ?? 0}%)`,
                          "Số lượng",
                        ]}
                        contentStyle={{ fontSize: "12px", borderRadius: "10px" }}
                      />
                      <Bar dataKey="count" name="Số người dùng" radius={[6, 6, 0, 0]} barSize={26}>
                        {stats.trustScoreDistribution.map((_entry, idx) => (
                          <Cell key={idx} fill={TRUST_COLORS[idx % TRUST_COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-xs text-muted-foreground">
                    Chưa có dữ liệu điểm uy tín
                  </div>
                )}
              </div>
            </div>

            <div className="lg:col-span-3 rounded-2xl bg-card p-4 ring-1 ring-border shadow-2xs space-y-3 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-foreground">Xác minh CCCD</h3>
                  <p className="text-xs text-muted-foreground">
                    Tỷ lệ duyệt hồ sơ (+30đ)
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate("/admin/cccd")}
                  className="h-7 px-2.5 text-xs cursor-pointer rounded-lg"
                >
                  Duyệt <ChevronRight className="size-3" />
                </Button>
              </div>

              {stats?.kycOverview ? (
                <>
                  <div className="p-3 rounded-xl bg-mint/45 text-center">
                    <span className="text-xs text-emerald-deep font-medium block">
                      Tỷ lệ phê duyệt hồ sơ
                    </span>
                    <span className="text-2xl font-extrabold text-emerald-deep tabular-nums">
                      {stats.kycOverview.approvalRate}%
                    </span>
                  </div>

                  <div className="divide-y divide-border/60 text-xs">
                    <div className="flex items-center justify-between py-2">
                      <span className="text-muted-foreground">Đã phê duyệt</span>
                      <strong className="tabular-nums text-emerald-deep">{stats.kycOverview.approvedCount}</strong>
                    </div>
                    <div className="flex items-center justify-between py-2">
                      <span className="text-muted-foreground">Đang chờ duyệt</span>
                      <strong className="tabular-nums text-amber-700">{stats.kycOverview.pendingCount}</strong>
                    </div>
                    <div className="flex items-center justify-between py-2">
                      <span className="text-muted-foreground">Đã từ chối</span>
                      <strong className="tabular-nums text-rose-700">{stats.kycOverview.rejectedCount}</strong>
                    </div>
                  </div>
                </>
              ) : (
                <div className="py-10 text-center text-xs text-muted-foreground">
                  Chưa có dữ liệu hồ sơ CCCD
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: KHU VỰC & NGUỒN PHÒNG */}
        {analyticsTab === "landlords" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            <div className="lg:col-span-6 rounded-2xl bg-card p-4 ring-1 ring-border shadow-2xs space-y-2.5 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-foreground">
                    Nguồn cung Phòng &amp; Nhu cầu Tìm kiếm theo Khu vực
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    So sánh số phòng đang mở cho thuê với nhu cầu tìm kiếm tại từng quận/huyện
                  </p>
                </div>
                <div className="size-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <Home className="size-4" />
                </div>
              </div>

              <div className="h-52 w-full">
                {districtChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={districtChartData}
                      margin={{ top: 8, right: 12, left: -15, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                      <XAxis dataKey="district" tick={{ fontSize: 10.5 }} />
                      <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                      <Tooltip contentStyle={{ fontSize: "12px", borderRadius: "10px" }} />
                      <Legend wrapperStyle={{ fontSize: "11px" }} />
                      <Bar
                        dataKey="supply"
                        name="Nguồn cung (Phòng trọ)"
                        fill="#2563eb"
                        radius={[4, 4, 0, 0]}
                        barSize={18}
                      />
                      {hasDemandColumn && (
                        <Bar
                          dataKey="demand"
                          name="Nhu cầu tìm thuê"
                          fill="#10b981"
                          radius={[4, 4, 0, 0]}
                          barSize={18}
                        />
                      )}
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-xs text-muted-foreground border border-dashed rounded-xl">
                    Chưa có dữ liệu phân bố phòng theo Quận/Huyện
                  </div>
                )}
              </div>
            </div>

            <div className="lg:col-span-3 rounded-2xl bg-card p-4 ring-1 ring-border shadow-2xs space-y-2.5 flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-bold text-foreground">Cơ cấu loại hình phòng</h3>
                <p className="text-xs text-muted-foreground">
                  Tỷ lệ lấp đầy: <strong>{occupancyRate}%</strong> ({stats?.activeRooms ?? 0}/
                  {stats?.totalRooms ?? 0} phòng trống)
                </p>
              </div>

              {stats?.roomTypeDistribution && stats.roomTypeDistribution.length > 0 ? (
                <>
                  <div className="h-32 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={stats.roomTypeDistribution.filter((r) => r.count > 0)}
                          dataKey="count"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          innerRadius={28}
                          outerRadius={48}
                          paddingAngle={3}
                        >
                          {stats.roomTypeDistribution
                            .filter((r) => r.count > 0)
                            .map((_entry, idx) => (
                              <Cell key={idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip
                          formatter={(value: any, name: any) => [`${value} phòng`, name]}
                          contentStyle={{ fontSize: "11px", borderRadius: "8px" }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="space-y-1.5">
                    {stats.roomTypeDistribution.map((rt, idx) => (
                      <div key={idx} className="flex items-center justify-between text-xs">
                        <span className="flex items-center gap-1.5 text-foreground font-medium">
                          <span
                            className="size-2 rounded-full shrink-0"
                            style={{ backgroundColor: CHART_COLORS[idx % CHART_COLORS.length] }}
                          />
                          {rt.name}
                        </span>
                        <span className="tabular-nums text-muted-foreground">
                          {rt.count} ({rt.percentage}%)
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="py-10 text-center text-xs text-muted-foreground">
                  Chưa có dữ liệu phân loại phòng
                </div>
              )}
            </div>

            <div className="lg:col-span-3 rounded-2xl bg-card p-4 ring-1 ring-border shadow-2xs space-y-2.5 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-foreground">Trạng thái &amp; Kiểm duyệt</h3>
                  <p className="text-xs text-muted-foreground">
                    Tình trạng phòng &amp; xử lý báo cáo
                  </p>
                </div>
                <div className="size-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                  <Shield className="size-4" />
                </div>
              </div>

              <div className="divide-y divide-border/60 text-xs">
                {stats?.roomStatusDistribution?.map((st, idx) => (
                  <div key={idx} className="flex items-center justify-between py-2">
                    <span className="text-muted-foreground">{st.name}</span>
                    <span className="tabular-nums font-semibold text-foreground">
                      {st.count} ({st.percentage}%)
                    </span>
                  </div>
                ))}

                <div className="flex items-center justify-between py-2">
                  <span className="text-amber-800 font-medium flex items-center gap-1.5">
                    <AlertCircle className="size-3.5 text-amber-600" /> Báo cáo chờ xử lý
                  </span>
                  <strong className="tabular-nums text-amber-700">{stats?.pendingReportsCount ?? 0}</strong>
                </div>

                <div className="flex items-center justify-between py-2">
                  <span className="text-rose-800 font-medium flex items-center gap-1.5">
                    <AlertCircle className="size-3.5 text-rose-600" /> Khiếu nại đánh giá
                  </span>
                  <strong className="tabular-nums text-rose-700">{stats?.pendingDisputesCount ?? 0}</strong>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate("/admin/reports")}
                  className="text-xs h-8 cursor-pointer justify-between rounded-xl"
                >
                  Báo cáo <ChevronRight className="size-3" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate("/admin/users")}
                  className="text-xs h-8 cursor-pointer justify-between rounded-xl"
                >
                  Người dùng <ChevronRight className="size-3" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal Chi tiết Đánh giá từ Người thuê */}
      <Dialog open={!!selectedReview} onOpenChange={(open) => !open && setSelectedReview(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-foreground text-base">
              <Star className="size-5 text-amber-500 fill-amber-500" /> Chi tiết Đánh giá &amp; Nhận xét
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Phản hồi trực tiếp từ người thuê có hợp đồng và đã nhận phòng ở thực tế
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
                  <Badge
                    variant="outline"
                    className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[11px] gap-1"
                  >
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
                  <span className="font-semibold text-foreground line-clamp-1">
                    {selectedReview.roomTitle || "Phòng trọ"}
                  </span>
                </div>
                <div className="bg-muted/20 p-2.5 rounded-lg border">
                  <span className="text-muted-foreground text-[11px] block">Chủ trọ nhận đánh giá:</span>
                  <span className="font-semibold text-foreground line-clamp-1">
                    {selectedReview.landlordName || "Chủ nhà trọ"}
                  </span>
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
                  <p className="text-foreground leading-relaxed italic">"{selectedReview.landlordReply}"</p>
                  {selectedReview.repliedAt && (
                    <span className="text-[10px] text-muted-foreground block mt-1">
                      Ngày phản hồi: {new Date(selectedReview.repliedAt).toLocaleDateString("vi-VN")}
                    </span>
                  )}
                </div>
              )}

              <div className="flex items-center justify-between text-muted-foreground text-[11px] pt-1 border-t">
                <span>Thời gian gửi:</span>
                <span>
                  {selectedReview.createdAt
                    ? new Date(selectedReview.createdAt).toLocaleDateString("vi-VN")
                    : "Gần đây"}
                </span>
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

      {/* Modal Chi tiết Góp ý Ứng dụng */}
      <Dialog open={!!selectedSystemFeedback} onOpenChange={(open) => !open && setSelectedSystemFeedback(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-foreground text-base">
              <Layers className="size-5 text-blue-600" /> Chi tiết Góp ý Ứng dụng
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Ý kiến đóng góp xây dựng nền tảng từ người dùng thực tế
            </DialogDescription>
          </DialogHeader>

          {selectedSystemFeedback && (
            <div className="space-y-4 py-2 text-xs">
              <div className="p-3.5 rounded-xl bg-muted/30 border space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-foreground text-sm">
                      {selectedSystemFeedback.senderName}
                    </span>
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-[10px] py-0 px-2 font-bold",
                        selectedSystemFeedback.senderRole === "LANDLORD"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                          : "bg-blue-50 text-blue-700 border-blue-300"
                      )}
                    >
                      {selectedSystemFeedback.senderRole === "LANDLORD" ? "Chủ nhà trọ" : "Người thuê phòng"}
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
                  <span className="text-muted-foreground ml-1.5 font-medium">
                    ({selectedSystemFeedback.rating}/5 sao)
                  </span>
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
            </div>
          )}

          <DialogFooter className="flex items-center justify-between sm:justify-between w-full pt-2">
            <Button
              type="button"
              variant="destructive"
              size="sm"
              disabled={isDeletingFeedback}
              className="text-xs cursor-pointer gap-1.5"
              onClick={() => selectedSystemFeedback && handleDeleteSystemFeedback(selectedSystemFeedback.id)}
            >
              <Trash2 className="size-3.5" />
              {isDeletingFeedback ? "Đang xóa..." : "Xóa góp ý này"}
            </Button>
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
          <div className="p-5 border-b space-y-3 bg-muted/20">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <DialogTitle className="text-lg font-bold text-foreground flex items-center gap-2">
                  <SlidersHorizontal className="size-5 text-emerald-600" /> Trung tâm Tìm kiếm &amp; Lọc Đánh giá
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                  Tra cứu toàn bộ nhận xét về chủ trọ và góp ý cải thiện ứng dụng
                </DialogDescription>
              </div>

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
                  <span>Chủ trọ ({stats?.totalReviews ?? 0})</span>
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
                  <span>Ứng dụng ({systemFeedbacks.length})</span>
                </button>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2.5 pt-2">
              <div className="flex flex-wrap items-center gap-1.5">
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
                        systemRoleFilter === "LANDLORD"
                          ? "bg-emerald-600 text-white"
                          : "bg-muted text-muted-foreground"
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

              <div className="relative w-full sm:w-64">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                <Input
                  value={reviewSearch}
                  onChange={(e) => setReviewSearch(e.target.value)}
                  placeholder={
                    reviewScope === "LANDLORD" ? "Tìm người thuê, phòng, chủ..." : "Tìm người gửi, nội dung..."
                  }
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
                          <div
                            className="flex items-center gap-1.5 font-semibold text-foreground truncate max-w-[190px]"
                            title={rev.reviewerName}
                          >
                            <span className="size-2 rounded-full bg-emerald-500 shrink-0" />
                            <span className="truncate group-hover:text-emerald-700 transition-colors">
                              {rev.reviewerName}
                            </span>
                            <Badge
                              variant="outline"
                              className="text-[9px] px-1 py-0 bg-emerald-50 text-emerald-700 border-emerald-200"
                            >
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
                            <span className="font-semibold">Chủ trọ ({rev.landlordName || "Chủ trọ"}):</span>{" "}
                            {rev.landlordReply}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-2 border-t mt-1">
                        <span className="truncate max-w-[180px] font-medium" title={rev.roomTitle}>
                          {rev.roomTitle || "Phòng trọ"}
                        </span>
                        <span className="text-[10px] text-emerald-600 font-medium group-hover:underline">
                          Xem chi tiết &rarr;
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )
            ) : filteredSystemFeedbacks.length === 0 ? (
              <div className="py-16 text-center text-xs text-muted-foreground space-y-2">
                <Layers className="size-8 text-muted-foreground/30 mx-auto" />
                <p className="font-semibold text-sm">
                  {systemFeedbacks.length === 0
                    ? "Chưa có góp ý nào về ứng dụng"
                    : "Không tìm thấy góp ý phù hợp"}
                </p>
                <p className="text-xs">
                  {systemFeedbacks.length === 0
                    ? "Khi người dùng hoặc chủ trọ gửi góp ý, nội dung sẽ xuất hiện tại đây."
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
                        <div
                          className="flex items-center gap-1.5 font-semibold text-foreground truncate max-w-[190px]"
                          title={fb.senderName}
                        >
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
                          <span className="truncate group-hover:text-blue-700 transition-colors">
                            {fb.senderName}
                          </span>
                        </div>
                        <div className="flex items-center gap-0.5 text-amber-500 shrink-0">
                          {Array.from({ length: fb.rating }).map((_, i) => (
                            <Star key={i} className="size-3 fill-amber-500 text-amber-500" />
                          ))}
                        </div>
                      </div>

                      <p className="text-muted-foreground italic line-clamp-3 leading-relaxed">"{fb.comment}"</p>

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
            )}
          </div>

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
