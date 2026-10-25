import { useEffect } from "react";
import { Outlet, NavLink, Link, useNavigate, useLocation } from "react-router";
import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard, Home, PlusCircle, ArrowLeftRight,
  ShieldCheck, Users, Flag, Bell, ChevronLeft, Star, MessageCircle, Zap,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { cn, getInitials } from "@/lib/utils";
import { useNotifications } from "@/features/notifications/hooks/useNotifications";
import { useAuth } from "@/app/context/AuthContext";
import { AnimatePresence } from "motion/react";
import { PageTransition } from "./PageTransition";

type Item = { to: string; label: string; icon: LucideIcon; end?: boolean; tab?: string };

const landlordNav: Item[] = [
  { to: "/landlord?tab=overview", label: "Tổng quan", icon: LayoutDashboard, tab: "overview" },
  { to: "/landlord?tab=rooms", label: "Phòng của tôi", icon: Home, tab: "rooms" },
  { to: "/landlord?tab=post", label: "Đăng phòng", icon: PlusCircle, tab: "post" },
  { to: "/landlord?tab=tenants", label: "Người thuê", icon: Users, tab: "tenants" },
  { to: "/landlord?tab=chat", label: "Tin nhắn", icon: MessageCircle, tab: "chat" },
  { to: "/landlord?tab=swaps", label: "Chuyển nhượng", icon: ArrowLeftRight, tab: "swaps" },
  { to: "/landlord?tab=reviews", label: "Đánh giá", icon: Star, tab: "reviews" },
  { to: "/landlord?tab=packages", label: "Gói dịch vụ", icon: Zap, tab: "packages" },
];

const adminNav: Item[] = [
  { to: "/admin", label: "Tổng quan", icon: LayoutDashboard, end: true },
  { to: "/admin/cccd", label: "Duyệt CCCD", icon: ShieldCheck },
  { to: "/admin/users", label: "Người dùng", icon: Users },
  { to: "/admin/reports", label: "Báo cáo vi phạm", icon: Flag },
  { to: "/admin/packages", label: "Gói dịch vụ", icon: Zap },
];

export function DashboardLayout({ variant = "landlord" }: { variant?: "landlord" | "admin" }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, user, role } = useAuth();
  const nav = variant === "landlord" ? landlordNav : adminNav;
  const { notifications, unreadCount: unread, markAsRead, markAllAsRead } = useNotifications();

  const handleNotificationClick = (n: any) => {
    if (n.unread) {
      markAsRead(n.id);
    }
    const d = n.data || {};
    if (variant === "landlord") {
      if (d.rentalId || n.title?.toLowerCase().includes("thuê") || n.title?.toLowerCase().includes("hợp đồng")) {
        navigate("/landlord?tab=tenants");
      } else if (d.swapId || n.title?.toLowerCase().includes("chuyển nhượng") || n.title?.toLowerCase().includes("hoán đổi")) {
        navigate("/landlord?tab=swaps");
      } else if (d.conversationId || n.title?.toLowerCase().includes("tin nhắn")) {
        navigate(`/landlord?tab=chat${d.conversationId ? `&cid=${d.conversationId}` : ""}`);
      } else {
        navigate("/notifications");
      }
    } else {
      navigate("/notifications");
    }
  };

  useEffect(() => {
    if (variant === "landlord" && user && role !== "admin" && user.isOnboarded === false) {
      navigate("/onboarding/landlord", { replace: true });
    }
  }, [variant, user, role, navigate]);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <div className="flex min-h-screen bg-secondary/30">
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-border bg-card lg:flex">
        <div className="flex h-14 items-center px-5">
          <Link to={variant === "landlord" ? "/landlord" : "/admin"} className="brand text-lg text-primary">
            Phòng Trọ Xanh
          </Link>
        </div>
        <p className="px-5 pb-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          {variant === "landlord" ? "Chủ trọ" : "Quản trị viên"}
        </p>
        <nav className="flex-1 space-y-1 px-3">
          {nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => {
                const currentTab = new URLSearchParams(location.search).get("tab") || "overview";
                const isItemActive = variant === "landlord"
                  ? item.tab === currentTab
                  : isActive;
                return cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                  isItemActive
                    ? "bg-mint text-primary font-medium"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                );
              }}
            >
              <item.icon className="size-[18px]" />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-border p-3">
          <Button variant="ghost" className="w-full justify-start gap-2 text-destructive hover:text-destructive" onClick={handleLogout}>
            <ChevronLeft className="size-4" /> Đăng xuất
          </Button>
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b border-border bg-card/85 px-5 backdrop-blur">
          <Link to={variant === "landlord" ? "/landlord" : "/admin"} className="brand text-lg text-primary lg:hidden">
            PTX
          </Link>
          <div className="ml-auto flex items-center gap-2">
            <DropdownMenu modal={false}>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="relative inline-flex size-9 cursor-pointer items-center justify-center rounded-full text-sm text-muted-foreground transition-all duration-150 hover:bg-mint hover:text-primary active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  aria-label="Thông báo"
                >
                  <Bell className="size-5" />
                  {unread > 0 && (
                    <span className="absolute right-2 top-2 size-2 rounded-full bg-primary ring-2 ring-white" />
                  )}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80">
                <DropdownMenuLabel className="flex items-center justify-between">
                  <span>Thông báo</span>
                  <div className="flex items-center gap-2">
                    {unread > 0 && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          markAllAsRead();
                        }}
                        className="text-[11px] font-medium text-primary hover:underline cursor-pointer"
                      >
                        Đánh dấu đã đọc
                      </button>
                    )}
                    <Badge variant="secondary">{unread} mới</Badge>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {notifications.length === 0 ? (
                  <div className="py-4 px-3 text-center text-xs text-muted-foreground">
                    Chưa có thông báo mới
                  </div>
                ) : (
                  notifications.slice(0, 5).map((n) => (
                    <DropdownMenuItem
                      key={n.id}
                      onClick={() => handleNotificationClick(n)}
                      className="flex flex-col items-start gap-0.5 py-2 cursor-pointer transition-colors duration-150 hover:bg-mint/40"
                    >
                      <span className="flex w-full items-center gap-2">
                        {n.unread && <span className="size-1.5 rounded-full bg-primary shrink-0" />}
                        <span className="text-sm font-medium line-clamp-1">{n.title}</span>
                      </span>
                      <span className="text-xs text-muted-foreground line-clamp-2">{n.desc}</span>
                    </DropdownMenuItem>
                  ))
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate("/notifications")} className="justify-center text-primary font-semibold cursor-pointer transition-colors hover:bg-mint/60">
                  Xem tất cả
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu modal={false}>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="ml-1 cursor-pointer rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 transition-all duration-150 hover:opacity-85 hover:ring-2 hover:ring-primary/30 active:scale-95"
                >
                  <Avatar className="size-8 ring-1 ring-border">
                    <AvatarImage src={user?.avatarUrl || undefined} />
                    <AvatarFallback className="bg-emerald-100 text-emerald-800 font-semibold text-xs">
                      {getInitials(user?.fullName || (variant === "admin" ? "AD" : "CT"))}
                    </AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuLabel className="font-semibold text-charcoal">
                  {user?.fullName || (variant === "admin" ? "Quản trị viên" : "Chủ trọ")}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate(variant === "landlord" ? "/landlord" : "/admin")} className="cursor-pointer hover:bg-mint/40">Tổng quan</DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/profile")} className="cursor-pointer hover:bg-mint/40">Hồ sơ của tôi</DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/trustscore")} className="cursor-pointer hover:bg-mint/40">Điểm uy tín</DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/settings")} className="cursor-pointer hover:bg-mint/40">Cài đặt</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-destructive font-medium cursor-pointer hover:bg-destructive/5">
                  Đăng xuất
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
        <main className="flex-1 p-4 lg:p-5 flex flex-col min-h-[70vh]">
          <AnimatePresence mode="wait">
            <PageTransition key={location.pathname + location.search}>
              <Outlet />
            </PageTransition>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
