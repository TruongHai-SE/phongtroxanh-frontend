import { Bell, Heart, MessageCircle, Menu, LogIn, Crown } from "lucide-react";
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

export function TopNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, role, logout } = useAuth();
  const { openPricing, tier } = useMonetization();
  const { notifications, unreadCount: unread } = useNotifications();

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
      { to: "/swap", label: "Đổi phòng" },
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
        <nav className="hidden items-center gap-1 md:flex">
          {navLinks.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              className={({ isActive }) => {
                const isLinkActive = isActive || (role === "landlord" && location.pathname === "/landlord" && (
                  (l.to.includes("tab=overview") && (!location.search || location.search.includes("tab=overview"))) ||
                  (location.search && l.to.includes(location.search))
                ));
                return cn(
                  "rounded-full px-4 py-2 text-sm font-medium transition-colors duration-200",
                  isLinkActive ? "bg-mint text-emerald-deep font-semibold" : "text-charcoal/70 hover:text-emerald-brand hover:bg-slate-100/50",
                );
              }}
            >
              {l.label}
            </NavLink>
          ))}
        </nav>
        <div className="flex items-center gap-1 w-52 justify-end shrink-0">
          {user ? (
            <>
              {role === "tenant" && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={openPricing}
                  title={tier !== "free" ? "Đặc quyền Premium" : "Nâng cấp Premium"}
                  className={cn(
                    "transition-all duration-200 press-active cursor-pointer",
                    tier !== "free" 
                      ? "text-amber-500 hover:text-amber-600 hover:bg-amber-50/50"
                      : "text-muted-foreground hover:text-amber-500 hover:bg-amber-50/50"
                  )}
                >
                  <Crown className={cn("size-5", tier !== "free" && "fill-amber-500")} />
                </Button>
              )}
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => navigate("/saved")} 
                title="Đã lưu"
                className="hover:text-destructive text-muted-foreground transition-colors"
              >
                <Heart className="size-5" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => navigate("/chat")} 
                className="md:hidden text-muted-foreground transition-colors"
              >
                <MessageCircle className="size-5" />
              </Button>
              <DropdownMenu modal={false}>
                <DropdownMenuTrigger asChild>
                  <button
                    className="relative inline-flex size-9 items-center justify-center rounded-full text-sm text-muted-foreground transition-colors duration-200 hover:bg-mint hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
                    Thông báo <Badge variant="secondary">{unread} mới</Badge>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {notifications.slice(0, 4).map((n) => (
                    <DropdownMenuItem key={n.id} className="flex flex-col items-start gap-0.5 py-2 cursor-pointer transition-colors duration-150 hover:bg-mint/40">
                      <span className="flex w-full items-center gap-2">
                        {n.unread && <span className="size-1.5 rounded-full bg-primary" />}
                        <span className="text-sm font-medium">{n.title}</span>
                      </span>
                      <span className="text-xs text-muted-foreground">{n.desc}</span>
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate("/notifications")} className="justify-center text-primary font-semibold cursor-pointer transition-colors hover:bg-mint/60">
                    Xem tất cả
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <DropdownMenu modal={false}>
                <DropdownMenuTrigger asChild>
                  <button className="rounded-full cursor-pointer focus:outline-hidden">
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
                      <DropdownMenuItem onClick={() => navigate("/matches")} className="cursor-pointer hover:bg-mint/40">Lượt ghép</DropdownMenuItem>
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
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-destructive font-medium cursor-pointer hover:bg-destructive/5">
                    Đăng xuất
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <Button onClick={() => navigate("/login")} className="gap-2 bg-emerald-brand hover:bg-emerald-deep text-white font-medium rounded-full px-5">
              <LogIn className="size-4" /> Đăng nhập
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
