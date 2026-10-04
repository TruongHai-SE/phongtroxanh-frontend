import { useState, useEffect, useCallback } from "react";
import { notificationsApi } from "../api/notificationsApi";
import type { NotificationResponse } from "../types/notification.types";

export function useNotifications() {
  const [notifications, setNotifications] = useState<NotificationResponse[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchNotifications = useCallback(async () => {
    setIsLoading(true);
    setIsError(false);
    setErrorMessage(null);
    try {
      const res = await notificationsApi.getNotifications();
      const list = Array.isArray(res) ? res : (res?.content || []);
      const items = list.map((n: any) => {
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
      });
      setNotifications(items);
      setUnreadCount(items.filter((n) => n.unread).length);
    } catch (err: any) {
      setIsError(true);
      setErrorMessage(err.message || "Không thể tải danh sách thông báo.");
      setNotifications([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const markAsRead = async (id: string) => {
    await notificationsApi.markAsRead(id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true, unread: false } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
  };

  const markAllAsRead = async () => {
    await notificationsApi.markAllAsRead();
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
    refetch: fetchNotifications,
    markAsRead,
    markAllAsRead,
  };
}
