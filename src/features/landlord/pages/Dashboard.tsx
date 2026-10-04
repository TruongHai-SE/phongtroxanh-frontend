import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { Eye, MessageCircle, Home, TrendingUp, PlusCircle, Rocket, Award } from "lucide-react";
import {
  AreaChart, Area, XAxis, ResponsiveContainer, Tooltip,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ImageWithFallback } from "@/components/shared/ImageWithFallback";
import { formatVND } from "@/lib/utils";
import { roomImages } from "@/lib/constants";
import { api } from "@/lib/api";
import { useAuth } from "@/app/context/AuthContext";

// Import subpages as tab components
import LandlordRooms from "./LandlordRooms";
import PostRoom from "./PostRoom";
import LandlordTenants from "./LandlordTenants";
import Swaps from "./Swaps";
import LandlordReviews from "./LandlordReviews";
import LandlordChat from "@/features/chat/pages/LandlordChat";
import LandlordPackages from "./LandlordPackages";

const getLast7DaysDefault = () => {
  const list = [];
  const now = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(now.getDate() - i);
    list.push({ d: `${d.getDate()}/${d.getMonth() + 1}`, v: 0 });
  }
  return list;
};

const defaultStats = [
  { label: "Lượt xem", value: "0", delta: "7 ngày qua", icon: Eye },
  { label: "Lượt liên hệ", value: "0", delta: "Quan tâm", icon: MessageCircle },
  { label: "Phòng đang đăng", value: "0", delta: "0 trống", icon: Home },
  { label: "Tỉ lệ lấp đầy", value: "0%", delta: "0 đã thuê", icon: TrendingUp },
];

export default function LandlordDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const tab = searchParams.get("tab") || "overview";
  const [stats, setStats] = useState(defaultStats);
  const [chartData, setChartData] = useState(getLast7DaysDefault());
  const [myRooms, setMyRooms] = useState<any[]>([]);

  const landlordName = user?.fullName || user?.name || "Chủ trọ";

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [tab]);

  useEffect(() => {
    if (tab !== "overview") return;
    async function loadAnalytics() {
      try {
        const data = await api.get<any>("/landlord/analytics");
        if (data) {
          const recent7DaysViews: number = data.viewsChart7Days && typeof data.viewsChart7Days === "object"
            ? (Object.values(data.viewsChart7Days).reduce((a: any, b: any) => Number(a) + Number(b), 0) as number)
            : 0;

          setStats([
            {
              label: "Lượt xem",
              value: data.totalViews !== undefined ? data.totalViews.toLocaleString("vi-VN") : "0",
              delta: Number(recent7DaysViews) > 0 ? `+${recent7DaysViews} trong 7 ngày` : "7 ngày qua",
              icon: Eye,
            },
            {
              label: "Lượt liên hệ",
              value: data.totalContacts !== undefined ? data.totalContacts.toLocaleString("vi-VN") : "0",
              delta: "Quan tâm & Lưu",
              icon: MessageCircle,
            },
            {
              label: "Phòng đang đăng",
              value: String(data.totalRooms !== undefined ? data.totalRooms : 0),
              delta: `${data.activeRooms || 0} phòng trống`,
              icon: Home,
            },
            {
              label: "Tỉ lệ lấp đầy",
              value: typeof data.occupancyRate === "number" ? `${Math.round(data.occupancyRate)}%` : "0%",
              delta: data.rentedRooms ? `${data.rentedRooms} đã thuê` : "0 đã thuê",
              icon: TrendingUp,
            },
          ]);
          if (data.viewsChart7Days && typeof data.viewsChart7Days === "object") {
            const mapped = Object.entries(data.viewsChart7Days).map(([dateStr, v]) => {
              const parts = dateStr.split("-");
              const label = parts.length === 3 ? `${parts[2]}/${parts[1]}` : dateStr;
              return { d: label, v: Number(v) };
            });
            if (mapped.length > 0) setChartData(mapped);
          }
        }
      } catch (err) {
        console.warn("Could not load /landlord/analytics, using default stats:", err);
      }

      try {
        const roomData = await api.get<any[]>("/rooms/landlord/me");
        if (Array.isArray(roomData)) {
          const mapped = roomData.map((r: any) => ({
            id: String(r.id),
            title: r.title || "Phòng trọ",
            price: r.price ? Number(r.price) : 0,
            district: r.district || "TP.HCM",
            images:
              r.images && r.images.length > 0
                ? r.images
                : r.primaryImageUrl
                ? [r.primaryImageUrl]
                : [roomImages[0]],
            isRented: r.status === "RENTED",
            status: r.status,
          }));
          setMyRooms(mapped.slice(0, 3));
        } else {
          setMyRooms([]);
        }
      } catch (err) {
        setMyRooms([]);
      }
    }
    loadAnalytics();
  }, [tab]);

  if (tab === "rooms") return <LandlordRooms />;
  if (tab === "post") return <PostRoom />;
  if (tab === "tenants") return <LandlordTenants />;
  if (tab === "swaps") return <Swaps />;
  if (tab === "reviews") return <LandlordReviews />;
  if (tab === "chat") return <LandlordChat />;
  if (tab === "packages") return <LandlordPackages />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="brand text-2xl text-foreground">Xin chào, {landlordName} 👋</h1>
          <p className="text-sm text-muted-foreground">Đây là tổng quan hoạt động của bạn</p>
        </div>
        <Button className="gap-2" onClick={() => navigate("/landlord?tab=post")}><PlusCircle className="size-4" /> Đăng phòng mới</Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-2xl bg-card p-5 ring-1 ring-border">
            <div className="flex items-center justify-between">
              <div className="grid size-10 place-items-center rounded-xl bg-mint text-primary"><s.icon className="size-5" /></div>
              <Badge variant="secondary">{s.delta}</Badge>
            </div>
            <p className="mt-3 text-2xl">{s.value}</p>
            <p className="text-sm text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="rounded-2xl bg-card p-5 ring-1 ring-border">
          <h2 className="text-lg">Lượt xem 7 ngày qua</h2>
          <div className="mt-4 h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#15803d" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#15803d" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="d" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: "#64746c" }} />
                <Tooltip />
                <Area type="monotone" dataKey="v" stroke="#15803d" strokeWidth={2} fill="url(#g)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl bg-primary p-5 text-primary-foreground">
          <Award className="size-7 text-amber-300 animate-pulse" />
          <h3 className="mt-2 text-lg text-primary-foreground">Nâng cấp hội viên</h3>
          <p className="mt-1 text-sm text-primary-foreground/85">Đăng phòng không giới hạn, mở khóa thống kê chi tiết và nhận huy hiệu xác minh.</p>
          <Button variant="secondary" className="mt-4 w-full font-medium" onClick={() => navigate("/landlord?tab=packages")}>Nâng cấp ngay</Button>
        </div>
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg">Phòng của tôi</h2>
          <Button variant="ghost" className="text-primary" onClick={() => navigate("/landlord?tab=rooms")}>Xem tất cả</Button>
        </div>
        {myRooms.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl bg-card p-8 text-center ring-1 ring-border">
            <Home className="size-10 text-muted-foreground/50 mb-2" />
            <p className="text-sm font-medium text-foreground">Bạn chưa có phòng trọ nào</p>
            <p className="text-xs text-muted-foreground mt-0.5 max-w-sm">Đăng tin ngay để phòng trọ của bạn tiếp cận hàng nghìn khách thuê tiềm năng.</p>
            <Button size="sm" className="mt-4 gap-1.5" onClick={() => navigate("/landlord?tab=post")}>
              <PlusCircle className="size-4" /> Đăng phòng ngay
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {myRooms.map((r, i) => (
              <div key={r.id} className="overflow-hidden rounded-2xl bg-card ring-1 ring-border">
                <div className="relative">
                  <ImageWithFallback src={r.images[0]} alt={r.title} className="aspect-[4/3] w-full object-cover" />
                  <Badge className={`absolute left-3 top-3 ${r.status === "AVAILABLE" ? "bg-emerald-600 text-white" : "bg-warning text-white"}`}>{r.status === "AVAILABLE" ? "Còn trống" : "Đã thuê"}</Badge>
                </div>
                <div className="space-y-1 p-4">
                  <h3 className="line-clamp-1 text-sm">{r.title}</h3>
                  <p className="text-primary">{formatVND(r.price)}<span className="text-xs text-muted-foreground">/tháng</span></p>
                  <div className="flex gap-2 pt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={() => {
                        sessionStorage.setItem("edit_room_id", r.id);
                        navigate("/landlord?tab=rooms");
                      }}
                    >
                      Sửa
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1" onClick={() => navigate(`/rooms/${r.id}`)}>Xem trang</Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
