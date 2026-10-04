import { api, type PageResponse } from "@/lib/api";
import type { NotificationResponse, UnreadCountResponse } from "../types/notification.types";

export const notificationsApi = {
  // #73 GET /notifications
  getNotifications: (page = 0, size = 20): Promise<PageResponse<NotificationResponse>> => {
    return api.get<PageResponse<NotificationResponse>>("/notifications", { page, size });
  },

  // #74 PUT /notifications/{id}/read
  markAsRead: (id: string): Promise<void> => {
    return api.put<void>(`/notifications/${id}/read`);
  },

  // #75 PUT /notifications/read-all
  markAllAsRead: (): Promise<void> => {
    return api.put<void>("/notifications/read-all");
  },

  // #76 POST /notifications/device-token
  registerDeviceToken: (deviceToken: string, deviceType = "WEB"): Promise<void> => {
    return api.post<void>("/notifications/device-token", { token: deviceToken, deviceType });
  },

  // Unread count computed from active notifications
  getUnreadCount: async (): Promise<UnreadCountResponse> => {
    try {
      const res = await api.get<PageResponse<NotificationResponse>>("/notifications", { page: 0, size: 20 });
      const list = Array.isArray(res) ? res : (res?.content || []);
      const unread = list.filter((n: any) => !n.isRead && !n.read).length;
      return { unreadCount: unread };
    } catch {
      return { unreadCount: 0 };
    }
  },
};

