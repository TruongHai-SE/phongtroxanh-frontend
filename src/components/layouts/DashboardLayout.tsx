import { useEffect, useState } from "react";
import { Outlet, NavLink, Link, useNavigate, useLocation } from "react-router";
import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard, Home, PlusCircle, ArrowLeftRight,
  ShieldCheck, Users, Flag, Bell, ChevronLeft, Star, MessageCircle, Zap, Crown, CircleHelp, Menu, X,
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
import { TourGuide } from "@/components/shared/TourGuide";
import { AppFeedbackModal } from "@/components/shared/AppFeedbackModal";

type Item = { to: string; label: string; icon: LucideIcon; end?: boolean; tab?: string };

const landlordNav: Item[] = [
  { to: "/landlord?tab=overview", label: "Tổng quan", icon: LayoutDashboard, tab: "overview" },
  { to: "/landlord?tab=rooms", label: "Phòng của tôi", icon: Home, tab: "rooms" },
  { to: "/landlord?tab=post", label: "Đăng phòng", icon: PlusCircle, tab: "post" },
  { to: "/landlord?tab=tenants", label: "Người thuê", icon: Users, tab: "tenants" },
  { to: "/landlord?tab=chat", label: "Tin nhắn", icon: MessageCircle, tab: "chat" },
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
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [isTourOpen, setIsTourOpen] = useState(false);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [hasSeenTour, setHasSeenTour] = useState(() => {
    try {
      return Boolean(localStorage.getItem("ptx_tour_seen_v1_landlord"));
    } catch {
      return true;
    }
  });

  useEffect(() => {
    setIsMobileNavOpen(false);
    const params = new URLSearchParams(location.search);
    if (params.get("tour") === "1" && variant === "landlord") {
      setIsTourOpen(true);
    }
  }, [location.pathname, location.search, variant]);

  const handleOpenTour = () => {
    setIsMobileNavOpen(false);
    setIsTourOpen(true);
    try {
      localStorage.setItem("ptx_tour_seen_v1_landlord", "1");
      setHasSeenTour(true);
    } catch {
      // ignore
    }
  };

  const handleCloseTour = () => {
    setIsTourOpen(false);
    try {
      localStorage.setItem("ptx_tour_seen_v1_landlord", "1");
      setHasSeenTour(true);
    } catch {
      // ignore
    }
  };

  const currentTab = new URLSearchParams(location.search).get("tab") || "overview";
  const isPackagesActive =
    variant === "landlord"
      ? location.pathname === "/landlord" && currentTab === "packages"
      : location.pathname.startsWith("/admin/packages");
  const isBellActive = isNotifOpen || location.pathname === "/notifications";

  const handleNotificationClick = (n: any) => {
    if (n.unread) {
      markAsRead(n.id);
    }
    const d = n.data || {};
    if (variant === "landlord") {
      if (d.rentalId || n.title?.toLowerCase().includes("thuê") || n.title?.toLowerCase().includes("hợp đồng")) {
        navigate("/landlord?tab=tenants");
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
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-border bg-card lg:flex">
        <div className="flex h-16 items-center px-5 border-b border-border/60">
          <Link
            to={variant === "landlord" ? "/landlord" : "/admin"}
            className="flex items-center gap-2.5 transition-opacity duration-200 hover:opacity-85"
          >
            <span className="grid size-9 place-items-center rounded-xl bg-primary text-mint shadow-[0_8px_20px_-8px_rgba(5,150,105,0.7)] shrink-0">
              <svg width="18" height="18" viewBox="0 0 32 32" fill="currentColor">
                <path d="M16 6l8 6v12h-5v-7h-6v7H8V12l8-6z" />
              </svg>
            </span>
            <span className="font-display text-xl font-semibold text-emerald-deep">
              Phòng Trọ Xanh
            </span>
          </Link>
        </div>
        <div className="px-5 pt-4 pb-2 flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {variant === "landlord" ? "Không gian Chủ trọ" : "Bảng Quản trị"}
          </p>
        </div>
        <nav data-tour="landlord-sidebar-nav" className="flex-1 space-y-1.5 px-3.5 pt-1">
          {nav.map((item) => {
            const isItemActive =
              variant === "landlord"
                ? item.tab === currentTab
                : item.end
                ? location.pathname === item.to
                : location.pathname.startsWith(item.to);
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                data-tour={item.tab ? `landlord-tab-${item.tab}` : undefined}
                className={() =>
                  cn(
                    "flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-[15px] transition-all duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] active:scale-[0.98]",
                    isItemActive
                      ? "bg-mint text-emerald-deep font-semibold ring-1 ring-primary/25 shadow-2xs"
                      : "font-medium text-charcoal/75 hover:bg-mint/50 hover:text-emerald-brand",
                  )
                }
              >
                <item.icon
                  className={cn(
                    "size-5 shrink-0 transition-transform duration-150",
                    isItemActive ? "text-primary scale-105" : "text-muted-foreground"
                  )}
                  strokeWidth={isItemActive ? 2.25 : 1.9}
                />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
        <div className="border-t border-border p-3.5 space-y-1">
          {variant === "landlord" && (
            <Button
              variant="ghost"
              className="w-full justify-start gap-2.5 text-sm text-emerald-700 hover:bg-mint/60 hover:text-emerald-800 font-medium cursor-pointer"
              onClick={handleOpenTour}
            >
              <CircleHelp className="size-4.5 text-primary" /> Hướng dẫn sử dụng
            </Button>
          )}
          <Button
            variant="ghost"
            className="w-full justify-start gap-2.5 text-sm text-destructive hover:text-destructive hover:bg-rose-50/70 font-medium cursor-pointer"
            onClick={handleLogout}
          >
            <ChevronLeft className="size-4.5" /> Đăng xuất
          </Button>
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-card/90 px-4 sm:px-6 backdrop-blur">
          <button
            type="button"
            onClick={() => setIsMobileNavOpen((prev) => !prev)}
            aria-label="Mở menu quản lý"
            aria-expanded={isMobileNavOpen}
            className="lg:hidden inline-flex size-9 items-center justify-center rounded-xl text-foreground hover:bg-secondary transition-colors cursor-pointer"
          >
            {isMobileNavOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
          <Link to={variant === "landlord" ? "/landlord" : "/admin"} className="brand text-lg text-primary lg:hidden">
            Phòng Trọ Xanh
          </Link>
          <div data-tour="landlord-header-actions" className="ml-auto flex items-center gap-1.5">
            {variant === "landlord" && (
              <button
                type="button"
                onClick={handleOpenTour}
                title="Hướng dẫn sử dụng dành cho Chủ trọ"
                aria-label="Hướng dẫn sử dụng"
                className={cn(
                  "relative inline-flex h-9 items-center justify-center gap-1.5 rounded-full px-3 text-xs font-semibold transition-all duration-150 active:scale-95 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  isTourOpen
                    ? "bg-primary text-primary-foreground shadow-2xs"
                    : "bg-mint/70 text-emerald-deep hover:bg-mint ring-1 ring-primary/20"
                )}
              >
                <CircleHelp className="size-4 shrink-0 text-primary" />
                <span className="hidden sm:inline">Hướng dẫn</span>
                {!hasSeenTour && !isTourOpen && (
                  <span className="absolute -right-0.5 -top-0.5 size-2.5 rounded-full bg-emerald-500 ring-2 ring-white animate-pulse" />
                )}
              </button>
            )}
            {variant === "landlord" && (
              <button
                type="button"
                onClick={() => navigate("/landlord?tab=packages")}
                title="Gói dịch vụ VIP & Đẩy tin"
                aria-label="Gói dịch vụ VIP"
                aria-pressed={isPackagesActive}
                className={cn(
                  "relative inline-flex size-9 cursor-pointer items-center justify-center rounded-full transition-all duration-150 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  isPackagesActive
                    ? "bg-amber-50 text-amber-600 ring-1 ring-amber-300 shadow-2xs"
                    : "text-muted-foreground hover:bg-amber-50/80 hover:text-amber-600"
                )}
              >
                <Crown
                  className={cn(
                    "size-[19px] transition-transform duration-150",
                    isPackagesActive && "fill-amber-500 text-amber-500 scale-105"
                  )}
                />
                {isPackagesActive && (
                  <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 h-1 w-3.5 rounded-full bg-amber-500" />
                )}
              </button>
            )}

            <DropdownMenu open={isNotifOpen} onOpenChange={setIsNotifOpen} modal={false}>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  title="Thông báo"
                  aria-label="Thông báo"
                  aria-expanded={isNotifOpen}
                  className={cn(
                    "relative inline-flex size-9 cursor-pointer items-center justify-center rounded-full text-sm transition-all duration-150 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    isBellActive
                      ? "bg-mint text-emerald-deep ring-1 ring-primary/30 shadow-2xs"
                      : "text-muted-foreground hover:bg-mint hover:text-primary"
                  )}
                >
                  <Bell
                    className={cn(
                      "size-[19px] transition-transform duration-150",
                      isBellActive && "fill-primary/20 text-primary scale-105"
                    )}
                  />
                  {unread > 0 && (
                    <span className="absolute right-2 top-2 size-2 rounded-full bg-primary ring-2 ring-white" />
                  )}
                  {isBellActive && (
                    <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 h-1 w-3.5 rounded-full bg-primary" />
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

            <DropdownMenu open={isUserMenuOpen} onOpenChange={setIsUserMenuOpen} modal={false}>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  aria-label="Menu tài khoản"
                  aria-expanded={isUserMenuOpen}
                  className={cn(
                    "ml-1 cursor-pointer rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 transition-all duration-150 active:scale-95",
                    isUserMenuOpen
                      ? "ring-2 ring-primary ring-offset-2 shadow-2xs"
                      : "hover:opacity-85 hover:ring-2 hover:ring-primary/30"
                  )}
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
                {variant === "landlord" && (
                  <>
                    <DropdownMenuItem onClick={handleOpenTour} className="cursor-pointer hover:bg-mint/40 text-emerald-700 font-medium">
                      <CircleHelp className="size-4 mr-1.5 text-emerald-600 inline" /> Hướng dẫn sử dụng
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setIsFeedbackOpen(true)} className="cursor-pointer hover:bg-amber-50 text-amber-600 font-medium">
                      <Star className="size-4 mr-1.5 fill-amber-400 text-amber-400 inline" /> Đánh giá ứng dụng
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-destructive font-medium cursor-pointer hover:bg-destructive/5">
                  Đăng xuất
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Mobile & Tablet Navigation Drawer (< 1024px) */}
        {isMobileNavOpen && (
          <div className="lg:hidden border-b border-border bg-card px-4 py-3 shadow-md space-y-2 animate-fade-in">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              {nav.map((item) => {
                const isItemActive =
                  variant === "landlord"
                    ? item.tab === currentTab
                    : item.end
                    ? location.pathname === item.to
                    : location.pathname.startsWith(item.to);
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    onClick={() => setIsMobileNavOpen(false)}
                    className={() =>
                      cn(
                        "flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold transition-colors",
                        isItemActive
                          ? "bg-mint text-primary ring-1 ring-primary/20"
                          : "bg-secondary/60 text-muted-foreground hover:text-foreground"
                      )
                    }
                  >
                    <item.icon className="size-4 shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </NavLink>
                );
              })}
            </div>
            {variant === "landlord" && (
              <div className="pt-1.5 border-t border-border/60 flex items-center justify-between">
                <button
                  type="button"
                  onClick={handleOpenTour}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline cursor-pointer"
                >
                  <CircleHelp className="size-4" /> Mở cẩm nang hướng dẫn Chủ trọ
                </button>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="text-xs font-medium text-destructive hover:underline cursor-pointer"
                >
                  Đăng xuất
                </button>
              </div>
            )}
          </div>
        )}

        <main className="flex-1 px-4 py-3.5 lg:px-6 lg:py-4 flex flex-col min-h-[calc(100dvh-3.5rem)]">
          <AnimatePresence mode="wait">
            <PageTransition key={location.pathname + location.search}>
              <Outlet />
            </PageTransition>
          </AnimatePresence>
        </main>
      </div>

      {variant === "landlord" && (
        <TourGuide active={Boolean(user) && isTourOpen} onClose={handleCloseTour} role="landlord" />
      )}
      <AppFeedbackModal open={isFeedbackOpen} onOpenChange={setIsFeedbackOpen} />
    </div>
  );
}
