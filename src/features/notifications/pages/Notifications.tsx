import { Heart, MessageCircle, Home, ShieldCheck, Star, Bell, AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useNotifications } from "../hooks/useNotifications";

const iconMap: Record<string, any> = {
  match: Heart,
  message: MessageCircle,
  room: Home,
  verify: ShieldCheck,
  review: Star,
  KYC_APPROVED: ShieldCheck,
  NEW_MATCH: Heart,
  NEW_MESSAGE: MessageCircle,
  NEW_REVIEW: Star,
};

export default function Notifications() {
  const {
    notifications,
    isLoading,
    isError,
    errorMessage,
    markAsRead,
    markAllAsRead,
    refetch,
  } = useNotifications();

  const groups = {
    "Mới": notifications.filter((n) => !n.read),
    "Đã đọc": notifications.filter((n) => n.read),
  };

  return (
    <div className="mx-auto max-w-2xl px-6 py-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="brand text-2xl text-foreground">Thông báo</h1>
        <Button variant="ghost" className="text-primary hover-lift" onClick={() => markAllAsRead()}>
          Đánh dấu đã đọc
        </Button>
      </div>

      {isLoading ? (
        <div className="mt-6 space-y-3">
          {[1, 2, 3, 4].map((k) => (
            <div key={k} className="flex items-start gap-3 rounded-xl p-4 ring-1 ring-border bg-card animate-pulse">
              <div className="size-10 shrink-0 rounded-full bg-slate-200" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-32 rounded bg-slate-200" />
                <div className="h-3 w-48 rounded bg-slate-200" />
              </div>
            </div>
          ))}
        </div>
      ) : isError ? (
        <div className="mt-12 text-center">
          <div className="mx-auto grid size-16 place-items-center rounded-full bg-red-50 text-red-500">
            <AlertCircle className="size-8" />
          </div>
          <h3 className="mt-3 text-lg font-semibold text-slate-800">Không thể tải thông báo</h3>
          <p className="mt-1 text-sm text-muted-foreground">{errorMessage}</p>
          <Button className="mt-4 gap-2" onClick={() => refetch()}>
            <RefreshCw className="size-4" /> Thử lại
          </Button>
        </div>
      ) : notifications.length === 0 ? (
        <div className="mt-12 text-center">
          <div className="mx-auto grid size-16 place-items-center rounded-full bg-mint text-primary">
            <Bell className="size-8" />
          </div>
          <h3 className="mt-3 text-lg font-semibold">Chưa có thông báo nào</h3>
          <p className="mt-1 text-sm text-muted-foreground">Bạn sẽ nhận được cập nhật về tin nhắn, ghép bạn và phòng trọ tại đây.</p>
        </div>
      ) : (
        Object.entries(groups).map(([label, groupItems]) =>
          groupItems.length === 0 ? null : (
            <div key={label} className="mt-6">
              <p className="mb-2 text-sm text-muted-foreground font-medium">{label}</p>
              <div className="space-y-2">
                {groupItems.map((n: any) => {
                  const Icon = iconMap[n.type] ?? Bell;
                  return (
                    <div
                      key={n.id}
                      onClick={() => markAsRead(n.id)}
                      className={cn(
                        "flex items-start gap-3 rounded-xl p-4 ring-1 ring-border cursor-pointer transition-all hover-lift",
                        !n.read ? "bg-mint/40" : "bg-card"
                      )}
                    >
                      <div className="grid size-10 shrink-0 place-items-center rounded-full bg-mint text-primary">
                        <Icon className="size-5" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-foreground">{n.title}</p>
                        <p className="text-sm text-muted-foreground">{n.desc || n.message}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {n.createdAt ? new Date(n.createdAt).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }) : "Vừa xong"}
                        </p>
                      </div>
                      {!n.read && <span className="mt-1 size-2 shrink-0 rounded-full bg-primary" />}
                    </div>
                  );
                })}
              </div>
            </div>
          )
        )
      )}
    </div>
  );
}
