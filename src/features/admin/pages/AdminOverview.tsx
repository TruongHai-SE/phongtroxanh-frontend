import { useState, useEffect, useMemo } from "react";
import { api } from "@/lib/api";
import {
  Users, Home, Star, AlertCircle,
  Activity, RefreshCw, ShieldCheck,
  DollarSign, Building2, UserCheck, CheckCircle2,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

const CHART_COLORS = ["#059669", "#2563eb", "#7c3aed", "#d97706", "#e11d48", "#0891b2"];
const TRUST_COLORS = ["#f43f5e", "#f59e0b", "#3b82f6", "#10b981"];

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
    | "service_package"
    | "payment_system"
    | "matching_feature"
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
  const [systemCategoryFilter, setSystemCategoryFilter] = useState<string>("ALL");
  const [selectedSystemFeedback, setSelectedSystemFeedback] = useState<SystemFeedbackItem | null>(null);
  const [isDeletingFeedback, setIsDeletingFeedback] = useState(false);

  const handleDeleteSystemFeedback = async (id: string) => {
    if (
      !window.confirm(
        "Bạn có chắc chắn muốn xóa vĩnh viễn góp ý hệ thống này không? Thao tác này sẽ gỡ bỏ hoàn toàn khỏi cơ sở dữ liệu."
      )
    ) {
      return;
    }
    setIsDeletingFeedback(true);
    try {
      await reviewsApi.deleteSystemFeedback(id);
      toast.success("Đã xóa góp ý hệ thống thành công!");
      setSelectedSystemFeedback(null);
      await fetchStats(false);
    } catch {
      toast.error("Không thể xóa góp ý này. Vui lòng kiểm tra lại quyền Admin!");
    } finally {
      setIsDeletingFeedback(false);
    }
  };

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

  // ───────────── REAL ANALYTICAL DATA TRANSFORMATIONS FOR RECHARTS ─────────────
  const totalTrafficSessions = useMemo(
    () => trafficList.reduce((acc, item) => acc + item.count, 0),
    [trafficList]
  );

  // Personalization funnel: use backend's personalizationFunnel if available, else derive from real DB counts
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
        name: "Đã xác thực CCCD",
        count: stats.verifiedUsersCount,
        percentage: Math.min(100, Math.round((stats.verifiedUsersCount * 100) / base)),
      },
      {
        name: "Ghép đôi thành công",
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

  // Supply vs Demand by District: use backend's districtSupplyDemand if available, else real districtDistribution
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
      {/* ──────────────── ROW 1: COMPACT HEADER + 4 KPI CARDS ──────────────── */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b pb-3">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <h1 className="text-xl font-bold tracking-tight text-foreground">Tổng quan Quản trị</h1>
          <span className="text-xs text-muted-foreground">
            Theo dõi hoạt động vận hành, doanh thu, nguồn khách và chất lượng dịch vụ
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-8 gap-1.5 cursor-pointer text-xs px-3"
            onClick={() => fetchStats(true)}
            disabled={loading}
          >
            <RefreshCw className={cn("size-3.5", loading && "animate-spin")} />
            Làm mới dữ liệu
          </Button>
        </div>
      </div>

      {/* 4 Compact KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* KPI 1: Người dùng */}
        <div
          onClick={() => navigate("/admin/users")}
          className="group rounded-xl bg-card p-3.5 border shadow-2xs hover:border-emerald-300 hover:shadow-xs transition-all cursor-pointer flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Người dùng hệ thống
            </span>
            <div className="size-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center">
              <Users className="size-3.5" />
            </div>
          </div>
          <div className="my-1.5 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-foreground tracking-tight">
              {stats ? stats.totalUsers.toLocaleString() : "--"}
            </span>
            <span className="text-[11px] text-emerald-600 font-medium">
              {stats?.verifiedUsersCount ?? 0} đã KYC
            </span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1.5 border-t">
            <span>
              <strong className="text-foreground">{stats?.totalTenants ?? 0}</strong> người thuê
            </span>
            <span>
              <strong className="text-foreground">{stats?.totalLandlords ?? 0}</strong> chủ trọ
            </span>
          </div>
        </div>

        {/* KPI 2: Nguồn cung phòng */}
        <div className="rounded-xl bg-card p-3.5 border shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Nguồn cung phòng trọ
            </span>
            <div className="size-7 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 flex items-center justify-center">
              <Home className="size-3.5" />
            </div>
          </div>
          <div className="my-1.5 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-foreground tracking-tight">
              {stats ? stats.totalRooms.toLocaleString() : "--"}
            </span>
            <Badge
              variant="secondary"
              className="text-[10px] px-1.5 py-0 font-semibold bg-blue-50 text-blue-700 border-blue-200"
            >
              Lấp đầy {occupancyRate}%
            </Badge>
          </div>
          <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1.5 border-t">
            <span className="text-emerald-600 font-medium">
              <strong>{stats?.activeRooms ?? 0}</strong> phòng trống
            </span>
            <span>
              <strong className="text-foreground">{stats?.totalRentals ?? 0}</strong> hợp đồng
            </span>
          </div>
        </div>

        {/* KPI 3: Ghép đôi & Cá nhân hóa */}
        <div className="rounded-xl bg-card p-3.5 border shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Ghép đôi &amp; Cá nhân hóa
            </span>
            <div className="size-7 rounded-lg bg-purple-50 dark:bg-purple-950/40 text-purple-600 flex items-center justify-center">
              <Sparkles className="size-3.5" />
            </div>
          </div>
          <div className="my-1.5 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-foreground tracking-tight">
              {stats ? stats.totalMatches.toLocaleString() : "--"}
            </span>
            <span className="text-[11px] text-purple-600 font-medium">cặp kết nối</span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1.5 border-t">
            <span>
              <strong className="text-foreground">{stats?.totalSwipes ?? 0}</strong> lượt quẹt
            </span>
            <span>
              <strong className="text-foreground">{stats?.totalSwapRequests ?? 0}</strong> pass phòng
            </span>
          </div>
        </div>

        {/* KPI 4: Cần xử lý / Kiểm duyệt */}
        <div
          onClick={() => navigate("/admin/cccd")}
          className="group rounded-xl bg-card p-3.5 border shadow-2xs hover:border-amber-300 hover:shadow-xs transition-all cursor-pointer flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Hàng đợi Kiểm duyệt
            </span>
            <div className="size-7 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 flex items-center justify-center">
              <ShieldCheck className="size-3.5" />
            </div>
          </div>
          <div className="my-1.5 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-foreground tracking-tight">
              {stats ? pendingTotalActions : "--"}
            </span>
            <span className="text-[11px] text-amber-600 font-medium">yêu cầu chờ duyệt</span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1.5 border-t">
            <span className="text-amber-600 font-medium">
              <strong>{stats?.pendingKycCount ?? 0}</strong> CCCD
            </span>
            <span>
              <strong className="text-foreground">{stats?.pendingDisputesCount ?? 0}</strong> khiếu nại &bull;{" "}
              <strong className="text-foreground">{stats?.pendingReportsCount ?? 0}</strong> báo cáo
            </span>
          </div>
        </div>
      </div>

      {/* ──────────────── ROW 2: ABOVE THE FOLD — 3 PRIORITY BENTO CARDS ──────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
        {/* COLUMN 1 (3/12): TRAFFIC SOURCES */}
        <div className="lg:col-span-3 rounded-2xl bg-card p-4 border shadow-xs flex flex-col justify-between space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="text-sm font-bold text-foreground">Nguồn truy cập (Traffic)</h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Phân bổ lượt truy cập theo kênh ({totalTrafficSessions} lượt)
              </p>
            </div>
            <div className="size-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <Compass className="size-3.5" />
            </div>
          </div>

          {/* Mini Donut Chart or Real Zero State */}
          {totalTrafficSessions > 0 ? (
            <div className="h-32 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={trafficList.filter((t) => t.count > 0)}
                    dataKey="count"
                    nameKey="shortName"
                    cx="50%"
                    cy="50%"
                    innerRadius={32}
                    outerRadius={52}
                    paddingAngle={3}
                  >
                    {trafficList
                      .filter((t) => t.count > 0)
                      .map((entry) => (
                        <Cell key={entry.key} fill={entry.hex} />
                      ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: any, name: any) => [`${value} lượt`, name]}
                    contentStyle={{
                      fontSize: "11px",
                      borderRadius: "8px",
                      border: "1px solid #e5e7eb",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="py-4 px-3 rounded-xl bg-muted/20 border border-dashed text-center space-y-1">
              <p className="text-xs font-medium text-foreground">Chưa phát sinh lượt truy cập mới</p>
              <p className="text-[10.5px] text-muted-foreground">
                Thống kê tự động theo kênh khi người dùng truy cập nền tảng
              </p>
            </div>
          )}

          {/* Compact Channel Bars */}
          <div className="space-y-2">
            {trafficList.map((src) => (
              <div key={src.key} className="space-y-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-medium text-foreground truncate max-w-[140px]" title={src.name}>
                    {src.shortName}
                  </span>
                  <span className="font-mono text-muted-foreground">
                    {src.count} ({src.percentage}%)
                  </span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                  <div
                    className={cn("h-full rounded-full transition-all duration-300", src.color)}
                    style={{ width: `${src.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* COLUMN 2 (4/12): GIAO DỊCH THANH TOÁN & DOANH THU + GÓI DỊCH VỤ */}
        <div className="lg:col-span-4 rounded-2xl bg-card p-4 border shadow-xs flex flex-col justify-between space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="text-sm font-bold text-foreground">Giao dịch Thanh toán &amp; Doanh thu</h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Tổng hợp cọc, tiền thuê &amp; các gói dịch vụ trả phí
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/admin/packages")}
              className="h-7 px-2.5 text-[11px] cursor-pointer gap-1 shrink-0"
            >
              Gói dịch vụ <ChevronRight className="size-3" />
            </Button>
          </div>

          {/* Revenue Hero Box + 3 Sub-metrics */}
          <div className="p-3 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/25 border border-emerald-200/60 flex items-center justify-between">
            <div>
              <span className="text-[11px] text-emerald-800 dark:text-emerald-300 font-medium block">
                Tổng doanh thu xác nhận
              </span>
              <span className="text-xl font-bold text-emerald-700 dark:text-emerald-400 tracking-tight">
                {stats ? formatVND(stats.totalRevenue) : "--"}
              </span>
            </div>
            <div className="text-right text-[11px] space-y-0.5">
              <div className="text-foreground font-semibold">
                {stats?.totalTransactions ?? 0} <span className="font-normal text-muted-foreground">giao dịch</span>
              </div>
              <div className="text-emerald-700 font-medium">
                {stats?.activeRentals ?? 0} <span className="font-normal text-muted-foreground">HĐ hiệu lực</span>
              </div>
            </div>
          </div>

          {/* Package Revenue Breakdown (Recharts Horizontal Bar or Compact List) */}
          <div className="flex-1 flex flex-col justify-between space-y-2">
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-semibold text-foreground flex items-center gap-1">
                <CreditCard className="size-3 text-emerald-600" /> Doanh thu theo Gói dịch vụ
              </span>
              <span className="text-muted-foreground">
                {stats?.activeBoostedRooms ?? 0} phòng đang đẩy Top
              </span>
            </div>

            {stats?.packageStats && stats.packageStats.length > 0 ? (
              <div className="space-y-2">
                {stats.packageStats.slice(0, 4).map((pkg, idx) => {
                  const maxPkgRev = Math.max(...stats.packageStats.map((p) => p.revenue), 1);
                  const pct = pkg.revenue > 0 ? Math.max(Math.round((pkg.revenue / maxPkgRev) * 100), 6) : 0;
                  return (
                    <div key={pkg.planId || idx} className="p-2 rounded-lg border bg-background/60 space-y-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-semibold text-foreground truncate max-w-[150px]" title={pkg.planName}>
                          {pkg.planName}
                        </span>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <Badge variant="secondary" className="text-[9px] px-1.5 py-0">
                            {pkg.count} lượt
                          </Badge>
                          <span className="font-mono font-bold text-emerald-600">
                            {formatVND(pkg.revenue)}
                          </span>
                        </div>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full bg-emerald-500 transition-all duration-300"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-6 text-center text-xs text-muted-foreground border border-dashed rounded-xl bg-muted/10">
                Chưa phát sinh giao dịch mua gói dịch vụ
              </div>
            )}
          </div>
        </div>

        {/* COLUMN 3 (5/12): ĐÁNH GIÁ & MỨC ĐỘ HÀI LÒNG CỦA NGƯỜI DÙNG */}
        <div className="lg:col-span-5 rounded-2xl bg-card p-4 border shadow-xs flex flex-col justify-between space-y-3">
          {/* Header + Scope Switcher */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-bold text-foreground">Đánh giá &amp; Mức độ hài lòng</h3>
              <p className="text-[11px] text-muted-foreground">
                Chạm vào mốc sao để lọc nhanh phản hồi thực tế
              </p>
            </div>

            <div className="flex items-center p-0.5 rounded-lg bg-muted/70 border gap-0.5">
              <button
                type="button"
                onClick={() => {
                  setReviewScope("LANDLORD");
                  setReviewStarFilter("ALL");
                }}
                className={cn(
                  "px-2.5 py-1 rounded-md text-[11px] font-semibold cursor-pointer transition-all flex items-center gap-1",
                  reviewScope === "LANDLORD"
                    ? "bg-background text-emerald-700 shadow-2xs"
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
                  "px-2.5 py-1 rounded-md text-[11px] font-semibold cursor-pointer transition-all flex items-center gap-1",
                  reviewScope === "SYSTEM"
                    ? "bg-background text-blue-700 shadow-2xs"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Layers className="size-3" />
                Hệ thống ({systemFeedbacks.length})
              </button>
            </div>
          </div>

          {/* Rating Summary + Interactive Star Bars */}
          <div className="grid grid-cols-12 gap-3 items-center bg-muted/20 p-2.5 rounded-xl border">
            <div className="col-span-4 text-center border-r pr-2">
              <div className="text-2xl font-extrabold text-foreground leading-none">
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
              <span className="text-[10px] text-muted-foreground block">
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
                      "w-full flex items-center gap-1.5 text-[10.5px] rounded px-1 py-0.5 transition cursor-pointer",
                      isSelected ? "bg-amber-500/15 font-bold" : "hover:bg-muted/60"
                    )}
                  >
                    <span className="w-6 text-left font-medium text-foreground flex items-center gap-0.5">
                      {r.star}
                      <Star className="size-2.5 fill-amber-400 text-amber-400" />
                    </span>
                    <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all",
                          reviewScope === "LANDLORD" ? "bg-amber-500" : "bg-blue-500"
                        )}
                        style={{ width: `${r.percentage}%` }}
                      />
                    </div>
                    <span className="w-8 text-right font-mono text-muted-foreground">{r.count}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2 Compact Highlight Review Cards */}
          {reviewScope === "LANDLORD" ? (
            filteredLandlordReviews.length === 0 ? (
              <div className="py-5 text-center text-xs text-muted-foreground border border-dashed rounded-xl bg-muted/10">
                Chưa có đánh giá chủ trọ nào khớp bộ lọc
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {filteredLandlordReviews.slice(0, 2).map((rev) => (
                  <div
                    key={rev.id}
                    onClick={() => setSelectedReview(rev)}
                    className="p-2.5 rounded-xl border bg-background text-xs space-y-1.5 hover:border-emerald-300 transition cursor-pointer group flex flex-col justify-between"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-semibold text-foreground truncate text-[11px] group-hover:text-emerald-700">
                          {rev.reviewerName}
                        </span>
                        <span className="flex items-center gap-0.5 text-amber-500 shrink-0 text-[10px] font-bold">
                          {rev.rating} <Star className="size-2.5 fill-amber-500 text-amber-500" />
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground italic line-clamp-2 leading-snug">
                        "{rev.comment || "Trải nghiệm thuê phòng tốt."}"
                      </p>
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-1 border-t">
                      <span className="truncate max-w-[115px]">{rev.roomTitle || "Phòng trọ"}</span>
                      <span className="text-emerald-600 font-medium group-hover:underline">Chi tiết &rarr;</span>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : filteredSystemFeedbacks.length === 0 ? (
            <div className="py-5 text-center text-xs text-muted-foreground border border-dashed rounded-xl bg-muted/10">
              Chưa có góp ý hệ thống nào khớp bộ lọc
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {filteredSystemFeedbacks.slice(0, 2).map((fb) => (
                <div
                  key={fb.id}
                  onClick={() => setSelectedSystemFeedback(fb)}
                  className="p-2.5 rounded-xl border bg-background text-xs space-y-1.5 hover:border-blue-300 transition cursor-pointer group flex flex-col justify-between"
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-semibold text-foreground truncate text-[11px] group-hover:text-blue-700">
                        {fb.senderName}
                      </span>
                      <span className="flex items-center gap-0.5 text-amber-500 shrink-0 text-[10px] font-bold">
                        {fb.rating} <Star className="size-2.5 fill-amber-500 text-amber-500" />
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground italic line-clamp-2 leading-snug">
                      "{fb.comment}"
                    </p>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-1 border-t">
                    <span className="truncate max-w-[115px] text-blue-700 font-medium">{fb.categoryLabel}</span>
                    <span className="text-blue-600 font-medium group-hover:underline">Chi tiết &rarr;</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Footer Action: Open Full Filter Modal */}
          <div className="flex items-center justify-between gap-2 pt-1">
            {reviewStarFilter !== "ALL" ? (
              <button
                type="button"
                onClick={() => setReviewStarFilter("ALL")}
                className="text-[11px] text-amber-700 hover:underline font-medium cursor-pointer"
              >
                Đang lọc {reviewStarFilter} sao (Bỏ lọc)
              </button>
            ) : (
              <span className="text-[11px] text-muted-foreground">
                Hiển thị 2 phản hồi mới nhất
              </span>
            )}
            <Button
              variant="default"
              size="sm"
              onClick={() => setFullReviewsModalOpen(true)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] h-7 px-3 font-semibold cursor-pointer gap-1"
            >
              <SlidersHorizontal className="size-3" />
              Xem &amp; Lọc tất cả ({reviewScope === "LANDLORD" ? (stats?.totalReviews ?? 0) : systemFeedbacks.length})
            </Button>
          </div>
        </div>
      </div>

      {/* ──────────────── ROW 3: DEEP-DIVE ANALYTICS TABS WITH RECHARTS ──────────────── */}
      <Tabs defaultValue="overview" className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <TabsList className="bg-muted/60 p-1 rounded-xl h-auto flex-wrap justify-start">
            <TabsTrigger
              value="overview"
              className="rounded-lg px-3.5 py-1.5 text-xs font-semibold data-[state=active]:bg-background data-[state=active]:text-emerald-700 data-[state=active]:shadow-2xs cursor-pointer gap-1.5"
            >
              <TrendingUp className="size-3.5" /> Tăng trưởng &amp; Chuyển đổi
            </TabsTrigger>
            <TabsTrigger
              value="tenants"
              className="rounded-lg px-3.5 py-1.5 text-xs font-semibold data-[state=active]:bg-background data-[state=active]:text-emerald-700 data-[state=active]:shadow-2xs cursor-pointer gap-1.5"
            >
              <HeartHandshake className="size-3.5" /> Cá nhân hóa Người thuê &amp; Uy tín
            </TabsTrigger>
            <TabsTrigger
              value="landlords"
              className="rounded-lg px-3.5 py-1.5 text-xs font-semibold data-[state=active]:bg-background data-[state=active]:text-emerald-700 data-[state=active]:shadow-2xs cursor-pointer gap-1.5"
            >
              <Building2 className="size-3.5" /> Cung - Cầu Khu vực &amp; Phòng trọ
            </TabsTrigger>
          </TabsList>
        </div>

        {/* ───────────── TAB 1: TĂNG TRƯỞNG & PHỄU CHUYỂN ĐỔI ───────────── */}
        <TabsContent value="overview" className="m-0">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Biểu đồ kết hợp 6 tháng: Người dùng mới, Hợp đồng mới & Doanh thu */}
            <div className="lg:col-span-7 rounded-2xl bg-card p-5 border shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-foreground">
                    Biểu đồ Tăng trưởng Người dùng, Hợp đồng &amp; Doanh thu (6 tháng)
                  </h3>
                  <p className="text-[11px] text-muted-foreground">
                    Đối sánh lượng người dùng đăng ký mới, hợp đồng ký kết và doanh thu thực tế theo tháng
                  </p>
                </div>
                <div className="size-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <BarChart3 className="size-4" />
                </div>
              </div>

              <div className="h-64 w-full pt-2">
                {stats?.monthlyStats && stats.monthlyStats.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={stats.monthlyStats} margin={{ top: 10, right: 15, left: -10, bottom: 0 }}>
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
                        barSize={20}
                      />
                      <Bar
                        yAxisId="left"
                        dataKey="newRentals"
                        name="Hợp đồng mới"
                        fill="#3b82f6"
                        radius={[4, 4, 0, 0]}
                        barSize={20}
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

            {/* Phễu chuyển đổi cá nhân hóa */}
            <div className="lg:col-span-5 rounded-2xl bg-card p-5 border shadow-xs space-y-3 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-foreground">
                    Phễu Chuyển đổi Thuê trọ &amp; Ghép bạn
                  </h3>
                  <p className="text-[11px] text-muted-foreground">
                    Hành trình từ lúc đăng ký tài khoản đến khi ghép đôi &amp; ký hợp đồng
                  </p>
                </div>
                <div className="size-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                  <Activity className="size-4" />
                </div>
              </div>

              <div className="h-52 w-full">
                {funnelData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={funnelData}
                      layout="vertical"
                      margin={{ top: 5, right: 25, left: 10, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e5e7eb" />
                      <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
                      <YAxis
                        type="category"
                        dataKey="name"
                        width={125}
                        tick={{ fontSize: 11, fontWeight: 500 }}
                      />
                      <Tooltip
                        formatter={(value: any, _name: any, props: any) => [
                          `${value} (${props?.payload?.percentage ?? 0}%)`,
                          "Số lượng",
                        ]}
                        contentStyle={{ fontSize: "12px", borderRadius: "10px" }}
                      />
                      <Bar dataKey="count" name="Số lượng" radius={[0, 6, 6, 0]} barSize={18}>
                        {funnelData.map((_entry, index) => (
                          <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-xs text-muted-foreground">
                    Chưa có dữ liệu phễu chuyển đổi
                  </div>
                )}
              </div>

              <div className="grid grid-cols-3 gap-2 pt-2 border-t text-center text-[11px]">
                <div className="p-2 rounded-lg bg-muted/30">
                  <span className="text-muted-foreground block">Lượt quẹt tìm kiếm</span>
                  <strong className="text-sm text-foreground">{stats?.totalSwipes ?? 0}</strong>
                </div>
                <div className="p-2 rounded-lg bg-muted/30">
                  <span className="text-muted-foreground block">Cặp ghép đôi</span>
                  <strong className="text-sm text-purple-600">{stats?.totalMatches ?? 0}</strong>
                </div>
                <div className="p-2 rounded-lg bg-muted/30">
                  <span className="text-muted-foreground block">Nhượng phòng</span>
                  <strong className="text-sm text-blue-600">{stats?.totalSwapRequests ?? 0}</strong>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* ───────────── TAB 2: CÁ NHÂN HÓA NGƯỜI THUÊ & UY TÍN ───────────── */}
        <TabsContent value="tenants" className="m-0">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Radar Chart: Tiêu chí lối sống cá nhân hóa */}
            <div className="lg:col-span-5 rounded-2xl bg-card p-5 border shadow-xs space-y-3 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-foreground">
                    Xu hướng Lối sống &amp; Nhu cầu Người thuê
                  </h3>
                  <p className="text-[11px] text-muted-foreground">
                    Tỷ lệ người thuê ưu tiên từng tiêu chí khi tìm phòng &amp; ghép bạn ở ghép
                  </p>
                </div>
                <div className="size-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                  <Sparkles className="size-4" />
                </div>
              </div>

              {stats?.lifestyleStats && stats.lifestyleStats.length > 0 ? (
                <>
                  <div className="h-56 w-full">
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
                  <div className="grid grid-cols-2 gap-1.5 text-[11px] pt-2 border-t">
                    {stats.lifestyleStats.map((ls, idx) => (
                      <div key={idx} className="flex items-center justify-between px-2 py-1 rounded bg-muted/30">
                        <span className="truncate text-muted-foreground" title={ls.name}>
                          {ls.name}
                        </span>
                        <strong className="font-mono text-foreground shrink-0 ml-1">
                          {ls.count} ({ls.percentage}%)
                        </strong>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="py-8 px-4 rounded-xl bg-muted/20 border border-dashed text-center space-y-2">
                  <UserCheck className="size-6 text-emerald-600 mx-auto" />
                  <p className="text-xs font-semibold text-foreground">
                    Thống kê Hồ sơ Ghép đôi &amp; Cá nhân hóa
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    Hiện có <strong>{stats?.totalTenants ?? 0}</strong> người thuê,{" "}
                    <strong>{stats?.verifiedUsersCount ?? 0}</strong> đã xác thực CCCD và{" "}
                    <strong>{stats?.totalMatches ?? 0}</strong> cặp ghép đôi thành công.
                  </p>
                </div>
              )}
            </div>

            {/* Bar Chart: Phân bố Điểm uy tín */}
            <div className="lg:col-span-4 rounded-2xl bg-card p-5 border shadow-xs space-y-3 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-foreground">Phân bố Điểm uy tín người dùng</h3>
                  <p className="text-[11px] text-muted-foreground">
                    Đánh giá mức độ tin cậy của cộng đồng trên nền tảng
                  </p>
                </div>
                <div className="size-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <ShieldCheck className="size-4" />
                </div>
              </div>

              <div className="h-52 w-full">
                {stats?.trustScoreDistribution && stats.trustScoreDistribution.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={stats.trustScoreDistribution}
                      margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
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
                      <Bar dataKey="count" name="Số người dùng" radius={[6, 6, 0, 0]} barSize={28}>
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

              <div className="grid grid-cols-2 gap-2 text-[11px] pt-2 border-t">
                {stats?.trustScoreDistribution?.map((ts, idx) => (
                  <div key={idx} className="flex items-center justify-between px-2 py-1 rounded bg-muted/30">
                    <span className="truncate text-muted-foreground">{ts.range.split(" ")[0]}</span>
                    <strong className="font-mono text-foreground">
                      {ts.count} ({ts.percentage}%)
                    </strong>
                  </div>
                ))}
              </div>
            </div>

            {/* KYC Overview Card + Donut */}
            <div className="lg:col-span-3 rounded-2xl bg-card p-5 border shadow-xs space-y-3 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-foreground">Kiểm duyệt CCCD</h3>
                  <p className="text-[11px] text-muted-foreground">
                    Tỷ lệ duyệt tích xanh (+30đ)
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate("/admin/cccd")}
                  className="h-7 px-2 text-[11px] cursor-pointer"
                >
                  Duyệt <ChevronRight className="size-3" />
                </Button>
              </div>

              {stats?.kycOverview ? (
                <>
                  <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-200/60 text-center">
                    <span className="text-[11px] text-emerald-700 font-medium block">
                      Tỷ lệ phê duyệt hồ sơ
                    </span>
                    <span className="text-2xl font-extrabold text-emerald-700">
                      {stats.kycOverview.approvalRate}%
                    </span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between p-2.5 rounded-lg border bg-emerald-50/30">
                      <span className="text-emerald-800 font-medium">Đã phê duyệt</span>
                      <strong className="font-mono text-emerald-700">{stats.kycOverview.approvedCount}</strong>
                    </div>
                    <div className="flex items-center justify-between p-2.5 rounded-lg border bg-amber-50/40">
                      <span className="text-amber-800 font-medium">Đang chờ duyệt</span>
                      <strong className="font-mono text-amber-700">{stats.kycOverview.pendingCount}</strong>
                    </div>
                    <div className="flex items-center justify-between p-2.5 rounded-lg border bg-rose-50/30">
                      <span className="text-rose-800 font-medium">Đã từ chối</span>
                      <strong className="font-mono text-rose-700">{stats.kycOverview.rejectedCount}</strong>
                    </div>
                  </div>
                </>
              ) : (
                <div className="py-12 text-center text-xs text-muted-foreground">
                  Chưa có dữ liệu hồ sơ CCCD
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        {/* ───────────── TAB 3: CUNG - CẦU KHU VỰC & PHÒNG TRỌ ───────────── */}
        <TabsContent value="landlords" className="m-0">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Grouped BarChart: Tương quan Cung - Cầu theo Quận/Huyện */}
            <div className="lg:col-span-6 rounded-2xl bg-card p-5 border shadow-xs space-y-3 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-foreground">
                    Tương quan Nguồn cung Phòng &amp; Nhu cầu Tìm kiếm theo Khu vực
                  </h3>
                  <p className="text-[11px] text-muted-foreground">
                    So sánh số phòng đang mở cho thuê với nhu cầu khu vực từ hồ sơ người thuê &amp; pass phòng
                  </p>
                </div>
                <div className="size-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Home className="size-4" />
                </div>
              </div>

              <div className="h-60 w-full">
                {districtChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={districtChartData}
                      margin={{ top: 10, right: 15, left: -15, bottom: 0 }}
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
                        barSize={20}
                      />
                      {hasDemandColumn && (
                        <Bar
                          dataKey="demand"
                          name="Nhu cầu (Hồ sơ & Pass phòng)"
                          fill="#10b981"
                          radius={[4, 4, 0, 0]}
                          barSize={20}
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

            {/* Cơ cấu Loại hình & Trạng thái phòng (Donut Chart + List) */}
            <div className="lg:col-span-3 rounded-2xl bg-card p-5 border shadow-xs space-y-3 flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-bold text-foreground">Loại hình &amp; Trạng thái phòng</h3>
                <p className="text-[11px] text-muted-foreground">
                  Tỷ lệ lấp đầy hiện tại: <strong>{occupancyRate}%</strong> ({stats?.activeRooms ?? 0}/
                  {stats?.totalRooms ?? 0} phòng trống)
                </p>
              </div>

              {stats?.roomTypeDistribution && stats.roomTypeDistribution.length > 0 ? (
                <>
                  <div className="h-36 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={stats.roomTypeDistribution.filter((r) => r.count > 0)}
                          dataKey="count"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          innerRadius={30}
                          outerRadius={54}
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
                      <div key={idx} className="flex items-center justify-between text-[11px]">
                        <span className="flex items-center gap-1.5 text-foreground font-medium">
                          <span
                            className="size-2 rounded-full shrink-0"
                            style={{ backgroundColor: CHART_COLORS[idx % CHART_COLORS.length] }}
                          />
                          {rt.name}
                        </span>
                        <span className="font-mono text-muted-foreground">
                          {rt.count} ({rt.percentage}%)
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="py-12 text-center text-xs text-muted-foreground">
                  Chưa có dữ liệu phân loại phòng
                </div>
              )}
            </div>

            {/* Kiểm soát chất lượng & Lối tắt vận hành */}
            <div className="lg:col-span-3 rounded-2xl bg-card p-5 border shadow-xs space-y-3 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-foreground">Vận hành &amp; Kiểm duyệt</h3>
                  <p className="text-[11px] text-muted-foreground">
                    Trạng thái phòng &amp; xử lý vi phạm
                  </p>
                </div>
                <div className="size-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                  <Shield className="size-4" />
                </div>
              </div>

              <div className="space-y-2 text-xs">
                {stats?.roomStatusDistribution?.map((st, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-muted/30 border">
                    <span className="text-foreground font-medium">{st.name}</span>
                    <span className="font-mono font-semibold text-foreground">
                      {st.count} ({st.percentage}%)
                    </span>
                  </div>
                ))}

                <div className="flex items-center justify-between p-2 rounded-lg bg-amber-50/50 border border-amber-200/60">
                  <span className="text-amber-800 font-medium flex items-center gap-1.5">
                    <AlertCircle className="size-3.5 text-amber-600" /> Báo cáo vi phạm chờ xử lý
                  </span>
                  <strong className="font-mono text-amber-700">{stats?.pendingReportsCount ?? 0}</strong>
                </div>

                <div className="flex items-center justify-between p-2 rounded-lg bg-rose-50/40 border border-rose-200/60">
                  <span className="text-rose-800 font-medium flex items-center gap-1.5">
                    <AlertCircle className="size-3.5 text-rose-600" /> Khiếu nại đánh giá
                  </span>
                  <strong className="font-mono text-rose-700">{stats?.pendingDisputesCount ?? 0}</strong>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate("/admin/reports")}
                  className="text-[11px] h-8 cursor-pointer justify-between"
                >
                  Báo cáo <ChevronRight className="size-3" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate("/admin/users")}
                  className="text-[11px] h-8 cursor-pointer justify-between"
                >
                  Người dùng <ChevronRight className="size-3" />
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
              <Star className="size-5 text-amber-500 fill-amber-500" /> Chi tiết Đánh giá &amp; Nhận xét
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
                    {selectedReview.landlordName || "Chủ trọ hệ thống"}
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
                  <SlidersHorizontal className="size-5 text-emerald-600" /> Trung tâm Quản lý Đánh giá &amp; Phản hồi
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                  Bộ lọc độc lập, xem xét toàn diện phản hồi từ Người thuê và Chủ trọ
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
                  <span>Hệ thống ({systemFeedbacks.length})</span>
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
                    ? "Chưa có đánh giá nào về hệ thống"
                    : "Không tìm thấy góp ý hệ thống phù hợp"}
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
