export interface NotificationResponse {
  id: string;
  type: "match" | "message" | "room" | "verify" | "review" | "system";
  title: string;
  message?: string;
  desc?: string;
  read: boolean;
  unread?: boolean;
  createdAt: string;
  time?: string;
  targetUrl?: string;
  data?: Record<string, any>;
}

export interface UnreadCountResponse {
  unreadCount: number;
}
