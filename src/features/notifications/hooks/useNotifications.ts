import { useState, useEffect, useCallback, useRef } from "react";
import { toast } from "sonner";
import { notificationsApi } from "../api/notificationsApi";
import { tokenStorage } from "@/lib/api";
import type { NotificationResponse } from "../types/notification.types";

export function useNotifications() {
  const [notifications, setNotifications] = useState<NotificationResponse[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const seenNotificationIdsRef = useRef<Set<string> | null>(null);

  const fetchNotifications = useCallback(async (silent = false) => {
    if (!tokenStorage.getToken()) {
      setNotifications([]);
      setUnreadCount(0);
      setIsLoading(false);
      return;
    }
    if (!silent) {
      setIsLoading(true);
      setIsError(false);
      setErrorMessage(null);
    }
    try {
      const res = await notificationsApi.getNotifications();
      const list = Array.isArray(res) ? res : (res?.content || []);
      let prefs: Record<string, boolean> | null = null;
      try {
        const tenantPrefs = localStorage.getItem("ptx_notification_prefs_tenant");
        const landlordPrefs = localStorage.getItem("ptx_notification_prefs_landlord");
        const raw = tenantPrefs || landlordPrefs;
        if (raw) prefs = JSON.parse(raw);
      } catch {
        // ignore
      }

      const items = list
        .map((n: any) => {
          const isRead = Boolean(n.isRead ?? n.read);
          return {
            id: String(n.id),
            type: (n.type || "system").toLowerCase(),
            title: n.title || "Thông báo",
            message: n.body || n.message || n.desc || "",
            desc: n.body || n.desc || n.message || "",
            read: isRead,
            unread: !isRead,
            createdAt: n.createdAt,
            time: n.createdAt ? new Date(n.createdAt).toLocaleDateString("vi-VN") : "Gần đây",
            data: n.data,
          };
        })
        .filter((item: any) => {
          if (!prefs) return true;
          const d = item.data || {};
          const titleLower = (item.title || "").toLowerCase();
          if (item.type === "match" || titleLower.includes("ghép")) {
            return prefs.match_new !== false;
          }
          if (item.type === "message" || d.conversationId || titleLower.includes("tin nhắn")) {
            return prefs.chat_msg !== false;
          }
          if (d.category === "matching_room" || titleLower.includes("phòng phù hợp") || titleLower.includes("phòng nổi bật")) {
            return prefs.room_recommend !== false;
          }
          if (d.rentalId || titleLower.includes("thuê") || titleLower.includes("hợp đồng") || titleLower.includes("nhận phòng")) {
            return prefs.rental_status !== false && prefs.rental_request !== false;
          }
          if (item.type === "review" || titleLower.includes("đánh giá")) {
            return prefs.review_new !== false;
          }
          return true;
        });

      // Detect newly arrived unread notifications after initial snapshot
      if (seenNotificationIdsRef.current === null) {
        seenNotificationIdsRef.current = new Set(items.map((n: any) => String(n.id)));
      } else {
        for (const item of items) {
          const itemId = String(item.id);
          if (!seenNotificationIdsRef.current.has(itemId)) {
            seenNotificationIdsRef.current.add(itemId);
            if (item.unread) {
              const isMatchingRoom =
                item.data?.category === "matching_room" ||
                String(item.title || "").toLowerCase().includes("phòng phù hợp");

              if (isMatchingRoom) {
                toast.success(item.title || "Có phòng mới phù hợp với yêu cầu của bạn!", {
                  description: item.message,
                  action: item.data?.roomId
                    ? {
                        label: "Xem phòng",
                        onClick: () => {
                          window.location.href = `/rooms/${item.data.roomId}`;
                        },
                      }
                    : undefined,
                });
              }

              if (
                typeof window !== "undefined" &&
                "Notification" in window &&
                window.Notification.permission === "granted"
              ) {
                try {
                  const browserNotif = new window.Notification(
                    item.title || "Phòng Trọ Xanh",
                    {
                      body: item.message || "Bạn có thông báo mới từ hệ thống.",
                      icon: "/favicon.ico",
                      tag: `ptx-notif-${itemId}`,
                    }
                  );
                  browserNotif.onclick = () => {
                    window.focus();
                    if (item.data?.roomId) {
                      window.location.href = `/rooms/${item.data.roomId}`;
                    }
                    browserNotif.close();
                  };
                } catch {
                  // ignore browser notification restrictions
                }
              }
            }
          }
        }
      }

      setNotifications(items);
      setUnreadCount(items.filter((n: any) => n.unread).length);
    } catch (err: any) {
      if (!silent) {
        setIsError(true);
        setErrorMessage(err.message || "Không thể tải danh sách thông báo.");
        setNotifications([]);
      }
    } finally {
      if (!silent) {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    if (!tokenStorage.getToken()) {
      return;
    }
    fetchNotifications(false);
    // Poll every 10 seconds while tab is visible + refresh on window focus
    const timer = setInterval(() => {
      if (typeof document !== "undefined" && document.hidden) return;
      if (!tokenStorage.getToken()) return;
      fetchNotifications(true);
    }, 10000);
    const onFocus = () => {
      if (tokenStorage.getToken()) fetchNotifications(true);
    };
    window.addEventListener("focus", onFocus);
    return () => {
      clearInterval(timer);
      window.removeEventListener("focus", onFocus);
    };
  }, [fetchNotifications]);

  const markAsRead = async (id: string) => {
    try {
      await notificationsApi.markAsRead(id);
    } catch {
      // optimistic UI fallback
    }
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true, unread: false } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
  };

  const markAllAsRead = async () => {
    try {
      await notificationsApi.markAllAsRead();
    } catch {
      // optimistic UI fallback
    }
    setNotifications((prev) =>
      prev.map((n) => ({ ...n, read: true, unread: false }))
    );
    setUnreadCount(0);
  };

  const isEmpty = !isLoading && !isError && notifications.length === 0;

  return {
    notifications,
    unreadCount,
    isLoading,
    isError,
    isEmpty,
    errorMessage,
    refetch: () => fetchNotifications(false),
    markAsRead,
    markAllAsRead,
  };
}
