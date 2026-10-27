import { useState, useEffect } from "react";
import { Bell, Heart, MessageCircle, Menu, X, LogIn, Crown, Star, CircleHelp, Users } from "lucide-react";
import { Link, NavLink, useNavigate, useLocation } from "react-router";
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
import { useAuth } from "@/app/context/AuthContext";
import { useMonetization } from "@/app/context/MonetizationContext";
import { useNotifications } from "@/features/notifications/hooks/useNotifications";
import { AppFeedbackModal } from "@/components/shared/AppFeedbackModal";
import { TourGuide } from "@/components/shared/TourGuide";

export function TopNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, role, logout } = useAuth();
  const { openPricing, isPricingOpen, tier } = useMonetization();
  const { notifications, unreadCount: unread, markAsRead, markAllAsRead } = useNotifications();
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isTourOpen, setIsTourOpen] = useState(false);
  const [hasSeenTour, setHasSeenTour] = useState(() => {
    try {
      return Boolean(localStorage.getItem("ptx_tour_seen_v1_tenant"));
    } catch {
      return true;
    }
  });

  useEffect(() => {
    setIsMobileMenuOpen(false);
    const params = new URLSearchParams(location.search);
    if (params.get("tour") === "1" && user) {
      setIsTourOpen(true);
    }
  }, [location.pathname, location.search, user]);

  const handleOpenTour = () => {
    setIsMobileMenuOpen(false);
    setIsTourOpen(true);
    try {
      localStorage.setItem("ptx_tour_seen_v1_tenant", "1");
      setHasSeenTour(true);
    } catch {
      // ignore
    }
  };

  const handleCloseTour = () => {
    setIsTourOpen(false);
    try {
      localStorage.setItem("ptx_tour_seen_v1_tenant", "1");
      setHasSeenTour(true);
    } catch {
      // ignore
    }
  };

  const isSavedActive = location.pathname === "/saved";
  const isMatchesActive = location.pathname === "/matches";
  const isBellActive = isNotifOpen || location.pathname === "/notifications";
  const isChatActive = location.pathname.startsWith("/chat");
  const isCrownActive =
    isPricingOpen ||
    (role === "landlord" &&
      location.pathname === "/landlord" &&
      location.search.includes("tab=packages"));
  const isProfileActive =
    isUserMenuOpen ||
    ["/profile", "/edit-profile", "/settings", "/trustscore"].some((p) =>
      location.pathname.startsWith(p)
    );

  const handleNotificationClick = (n: any) => {
    if (n.unread) {
      markAsRead(n.id);
    }
    const d = n.data || {};
    if (role === "landlord") {
      if (d.rentalId || n.title?.toLowerCase().includes("thuê") || n.title?.toLowerCase().includes("hợp đồng")) {
        navigate("/landlord?tab=tenants");
      } else {
        navigate("/notifications");
      }
      return;
    }
    if (d.roomId) {
      navigate(`/rooms/${d.roomId}`);
    } else if (d.rentalId || n.title?.toLowerCase().includes("thuê") || n.title?.toLowerCase().includes("hợp đồng") || n.title?.toLowerCase().includes("nhận phòng")) {
      navigate("/rentals/me");
    } else if (d.conversationId || n.title?.toLowerCase().includes("tin nhắn")) {
      navigate(`/chat${d.conversationId ? `?cid=${d.conversationId}` : ""}`);
    } else if (n.type === "match" || n.title?.toLowerCase().includes("ghép")) {
      navigate("/matches");
    } else {
      navigate("/notifications");
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  // Determine nav links based on role
  let navLinks = [
    { to: "/discover", label: "Tìm phòng" },
    { to: "/roommates", label: "Ghép bạn" },
  ];

  if (role === "tenant") {
    navLinks = [
      { to: "/discover", label: "Tìm phòng" },
      { to: "/roommates", label: "Ghép bạn" },
      { to: "/rentals/me", label: "Phòng của tôi" },
      { to: "/chat", label: "Tin nhắn" },
    ];
  } else if (role === "landlord") {
    navLinks = [
      { to: "/landlord?tab=overview", label: "Bảng quản lý" },
      { to: "/landlord?tab=rooms", label: "Phòng trọ" },
      { to: "/landlord?tab=post", label: "Đăng phòng" },
      { to: "/landlord?tab=tenants", label: "Khách thuê" },
      { to: "/landlord?tab=chat", label: "Tin nhắn" },
    ];
  } else if (role === "admin") {
    navLinks = [
      { to: "/admin", label: "Bảng quản trị" },
      { to: "/admin/cccd", label: "Duyệt CCCD" },
      { to: "/admin/users", label: "Người dùng" },
      { to: "/admin/reports", label: "Báo cáo" },
    ];
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-white/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <Link to={role === "landlord" ? "/landlord" : role === "admin" ? "/admin" : "/discover"} className="flex items-center gap-2 transition-opacity duration-200 hover:opacity-85 w-52 shrink-0">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-mint shadow-[0_8px_20px_-8px_rgba(5,150,105,0.7)]">
            <svg width="18" height="18" viewBox="0 0 32 32" fill="currentColor">
              <path d="M16 6l8 6v12h-5v-7h-6v7H8V12l8-6z" />
            </svg>
          </span>
          <span className="font-display text-xl font-semibold text-emerald-deep">
            Phòng Trọ Xanh
          </span>
        </Link>
        <nav data-tour="tenant-nav-tabs" className="hidden items-center gap-1 md:flex">
          {navLinks.map((l) => {
            const slug = l.to.replace(/[^a-zA-Z0-9]/g, "-").replace(/^-+|-+$/g, "");
            return (
              <NavLink
                key={l.to}
                to={l.to}
                data-tour={`nav-tab-${slug}`}
                className={({ isActive }) => {
                  const isLinkActive = isActive || (role === "landlord" && location.pathname === "/landlord" && (
                    (l.to.includes("tab=overview") && (!location.search || location.search.includes("tab=overview"))) ||
                    (location.search && l.to.includes(location.search))
                  ));
                  return cn(
                    "rounded-full px-4 py-2 text-sm font-medium transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 active:scale-95",
                    isLinkActive ? "bg-mint text-emerald-deep font-semibold shadow-2xs" : "text-charcoal/70 hover:text-emerald-brand hover:bg-mint/50",
                  );
                }}
              >
                {l.label}
              </NavLink>
            );
          })}
        </nav>
        <div data-tour="tenant-nav-actions" className="flex items-center gap-1.5 justify-end shrink-0">
          {user ? (
            <>
              {role !== "admin" && (
                <button
                  type="button"
                  onClick={handleOpenTour}
                  title="Hướng dẫn sử dụng & Bản đồ chức năng"
                  aria-label="Hướng dẫn sử dụng"
                  className={cn(
                    "relative inline-flex h-9 items-center justify-center gap-1.5 rounded-full px-3 text-xs font-semibold transition-all duration-150 active:scale-95 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    isTourOpen
                      ? "bg-primary text-primary-foreground shadow-2xs"
                      : "bg-mint/80 text-emerald-deep hover:bg-mint ring-1 ring-primary/25 shadow-2xs"
                  )}
                >
                  <CircleHelp className={cn("size-4 shrink-0", isTourOpen ? "text-primary-foreground" : "text-primary")} />
                  <span className="hidden sm:inline">Hướng dẫn</span>
                  {!hasSeenTour && !isTourOpen && (
                    <span className="absolute -right-0.5 -top-0.5 size-2.5 rounded-full bg-emerald-500 ring-2 ring-white animate-pulse" />
                  )}
                </button>
              )}

              {(role === "tenant" || role === "landlord") && (
                <button
                  type="button"
                  data-tour="nav-icon-crown"
                  onClick={() =>
                    role === "landlord" ? navigate("/landlord?tab=packages") : openPricing()
                  }
                  title={
                    role === "landlord"
                      ? "Gói dịch vụ VIP"
                      : tier !== "free"
                      ? "Đặc quyền Premium"
                      : "Nâng cấp Premium"
                  }
                  aria-label="Gói dịch vụ"
                  aria-pressed={isCrownActive}
                  className={cn(
                    "relative inline-flex size-9 items-center justify-center rounded-full transition-all duration-150 active:scale-95 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    isCrownActive
                      ? "bg-amber-50 text-amber-600 ring-1 ring-amber-300 shadow-2xs"
                      : tier !== "free"
                      ? "text-amber-500 hover:bg-amber-50/80 hover:text-amber-600"
                      : "text-muted-foreground hover:bg-amber-50/80 hover:text-amber-600"
                  )}
                >
                  <Crown
                    className={cn(
                      "size-[19px] transition-transform duration-150",
                      (isCrownActive || tier !== "free") && "fill-amber-500 text-amber-500",
                      isCrownActive && "scale-105"
                    )}
                  />
                  {isCrownActive && (
                    <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 h-1 w-3.5 rounded-full bg-amber-500" />
                  )}
                </button>
              )}

              {role !== "admin" && (
                <button
                  type="button"
                  data-tour="nav-icon-saved"
                  onClick={() => navigate("/saved")}
                  title="Phòng đã lưu"
                  aria-label="Phòng đã lưu"
                  aria-current={isSavedActive ? "page" : undefined}
                  className={cn(
                    "relative inline-flex size-9 items-center justify-center rounded-full transition-all duration-150 active:scale-95 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    isSavedActive
                      ? "bg-rose-50 text-rose-600 ring-1 ring-rose-200/90 shadow-2xs"
                      : "text-muted-foreground hover:bg-rose-50/70 hover:text-rose-500"
                  )}
                >
                  <Heart
                    className={cn(
                      "size-[19px] transition-transform duration-150",
                      isSavedActive && "fill-rose-500 text-rose-500 scale-105"
                    )}
                  />
                  {isSavedActive && (
                    <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 h-1 w-3.5 rounded-full bg-rose-500" />
                  )}
                </button>
              )}

              {role === "tenant" && (
                <button
                  type="button"
                  data-tour="nav-icon-matches"
                  onClick={() => navigate("/matches")}
                  title="Lượt ghép bạn ở"
                  aria-label="Lượt ghép bạn ở"
                  aria-current={isMatchesActive ? "page" : undefined}
                  className={cn(
                    "relative inline-flex size-9 items-center justify-center rounded-full transition-all duration-150 active:scale-95 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    isMatchesActive
                      ? "bg-mint text-emerald-deep ring-1 ring-primary/30 shadow-2xs"
                      : "text-muted-foreground hover:bg-mint/70 hover:text-primary"
                  )}
                >
                  <Users
                    className={cn(
                      "size-[19px] transition-transform duration-150",
                      isMatchesActive && "fill-primary/20 text-primary scale-105"
                    )}
                  />
                  {isMatchesActive && (
                    <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 h-1 w-3.5 rounded-full bg-primary" />
                  )}
                </button>
              )}

              <button
                type="button"
                onClick={() => navigate("/chat")}
                aria-label="Tin nhắn"
                className={cn(
                  "relative md:hidden inline-flex size-9 items-center justify-center rounded-full transition-all duration-150 active:scale-95 cursor-pointer",
                  isChatActive
                    ? "bg-mint text-emerald-deep ring-1 ring-primary/30 shadow-2xs"
                    : "text-muted-foreground hover:bg-mint/70 hover:text-primary"
                )}
              >
                <MessageCircle
                  className={cn(
                    "size-[19px] transition-transform duration-150",
                    isChatActive && "fill-primary/20 text-primary scale-105"
                  )}
                />
                {isChatActive && (
                  <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 h-1 w-3.5 rounded-full bg-primary" />
                )}
              </button>

              <DropdownMenu open={isNotifOpen} onOpenChange={setIsNotifOpen} modal={false}>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    data-tour="nav-icon-bell"
                    title="Thông báo"
                    aria-label="Thông báo"
                    aria-expanded={isNotifOpen}
                    className={cn(
                      "relative inline-flex size-9 items-center justify-center rounded-full text-sm transition-all duration-150 active:scale-95 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
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
                    data-tour="nav-icon-avatar"
                    aria-label="Menu tài khoản"
                    aria-expanded={isUserMenuOpen}
                    className={cn(
                      "rounded-full cursor-pointer transition-all duration-150 active:scale-95 focus:outline-hidden",
                      isProfileActive
                        ? "ring-2 ring-primary ring-offset-2 shadow-2xs"
                        : "hover:ring-2 hover:ring-primary/30"
                    )}
                  >
                    <Avatar className="size-9 ring-1 ring-border">
                      <AvatarImage src={user?.avatarUrl || undefined} />
                      <AvatarFallback className="bg-emerald-100 text-emerald-800 font-semibold text-xs">
                        {getInitials(user?.fullName || user?.name || "U")}
                      </AvatarFallback>
                    </Avatar>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-2 py-1.5">
                    <p className="text-sm font-semibold text-charcoal leading-none">
                      {user?.fullName || user?.name || (role === "landlord" ? "Chủ trọ" : role === "admin" ? "Admin Hệ Thống" : "Khách thuê")}
                    </p>
                    {user?.email && (
                      <p className="text-xs text-muted-foreground mt-1 truncate">{user.email}</p>
                    )}
                  </div>
                  <DropdownMenuSeparator />
                  
                  {role === "tenant" && (
                    <>
                      <DropdownMenuItem onClick={() => navigate("/profile")} className="cursor-pointer hover:bg-mint/40">Hồ sơ của tôi</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => navigate("/trustscore")} className="cursor-pointer hover:bg-mint/40">Điểm uy tín</DropdownMenuItem>
                    </>
                  )}

                  {role === "landlord" && (
                    <>
                      <DropdownMenuItem onClick={() => navigate("/landlord")} className="cursor-pointer hover:bg-mint/40">Bảng quản lý</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => navigate("/profile")} className="cursor-pointer hover:bg-mint/40">Hồ sơ của tôi</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => navigate("/trustscore")} className="cursor-pointer hover:bg-mint/40">Điểm uy tín</DropdownMenuItem>
                    </>
                  )}

                  {role === "admin" && (
                    <>
                      <DropdownMenuItem onClick={() => navigate("/admin")} className="cursor-pointer hover:bg-mint/40">Bảng điều khiển</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => navigate("/admin/cccd")} className="cursor-pointer hover:bg-mint/40">Duyệt CCCD</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => navigate("/admin/users")} className="cursor-pointer hover:bg-mint/40">Người dùng</DropdownMenuItem>
                    </>
                  )}

                  <DropdownMenuItem onClick={() => navigate("/settings")} className="cursor-pointer hover:bg-mint/40">Cài đặt</DropdownMenuItem>
                  {role !== "admin" && (
                    <DropdownMenuItem onClick={handleOpenTour} className="cursor-pointer hover:bg-mint/40 text-emerald-700 font-medium">
                      <CircleHelp className="size-4 mr-1.5 text-emerald-600 inline" /> Hướng dẫn sử dụng
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={() => setIsFeedbackOpen(true)} className="cursor-pointer hover:bg-amber-50 text-amber-600 font-medium">
                    <Star className="size-4 mr-1.5 fill-amber-400 text-amber-400 inline" /> Đánh giá ứng dụng
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-destructive font-medium cursor-pointer hover:bg-destructive/5">
                    Đăng xuất
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <button
                type="button"
                onClick={() => setIsMobileMenuOpen((prev) => !prev)}
                aria-label="Mở menu điều hướng"
                aria-expanded={isMobileMenuOpen}
                className="md:hidden inline-flex size-9 items-center justify-center rounded-full text-charcoal/80 hover:bg-mint/60 hover:text-emerald-deep transition-all active:scale-95 cursor-pointer"
              >
                {isMobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
              </button>
            </>
          ) : (
            <Button onClick={() => navigate("/login")} className="gap-2 bg-emerald-brand hover:bg-emerald-deep text-white font-medium rounded-full px-5">
              <LogIn className="size-4" /> Đăng nhập
            </Button>
          )}
        </div>
      </div>

      {/* Mobile Navigation Drawer (< 768px) */}
      {user && isMobileMenuOpen && (
        <div className="md:hidden border-t border-border bg-white/98 backdrop-blur px-6 py-3 shadow-lg space-y-1.5 animate-fade-in">
          <div className="grid grid-cols-2 gap-1.5">
            {navLinks.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                onClick={() => setIsMobileMenuOpen(false)}
                className={({ isActive }) =>
                  cn(
                    "rounded-xl px-3.5 py-2 text-xs font-semibold transition-colors",
                    isActive
                      ? "bg-mint text-emerald-deep ring-1 ring-primary/20"
                      : "bg-slate-50 text-charcoal/80 hover:bg-mint/40"
                  )
                }
              >
                {l.label}
              </NavLink>
            ))}
          </div>
          {role !== "admin" && (
            <div className="pt-1.5 border-t border-border/60 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={handleOpenTour}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline cursor-pointer py-1"
              >
                <CircleHelp className="size-4" /> Mở cẩm nang hướng dẫn sử dụng
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  navigate("/saved");
                }}
                className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground cursor-pointer py-1"
              >
                <Heart className="size-3.5 text-rose-500" /> Phòng đã lưu
              </button>
            </div>
          )}
        </div>
      )}

      {/* Interactive Spotlight & Step-by-Step Tour Guide */}
      <TourGuide
        active={Boolean(user) && isTourOpen}
        onClose={handleCloseTour}
        role={role === "landlord" ? "landlord" : "tenant"}
      />

      {/* App & Platform Feedback Modal */}
      <AppFeedbackModal open={isFeedbackOpen} onOpenChange={setIsFeedbackOpen} />
    </header>
  );
}
