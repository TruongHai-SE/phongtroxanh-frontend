export interface ChatMessageItem {
  id: string;
  me: boolean;
  text: string;
  time: string;
  senderId?: string;
  senderName?: string;
  senderAvatar?: string;
  attachmentUrl?: string;
  isRead?: boolean;
  createdAt?: string;
}

export interface Conversation {
  id: string;
  name: string;
  avatar: string;
  type: "ROOM" | "ROOMMATE" | "DIRECT" | "room" | "roommate" | "direct";
  last: string;
  time: string;
  unread: number;
  online: boolean;
  messages: ChatMessageItem[];
  partnerId?: string;
  roomId?: string;
  roomTitle?: string;
  partnerTrustScore?: number;
}

export interface ConversationResponse {
  id: string;
  partnerId?: string;
  partnerName?: string;
  partnerAvatar?: string;
  partnerTrustScore?: number;
  type?: "ROOM" | "ROOMMATE" | "DIRECT" | string;
  roomId?: string;
  roomTitle?: string;
  lastMessageContent?: string;
  lastMessageAt?: string;
  unreadCount?: number;
  // UI fallback aliases
  name?: string;
  avatar?: string;
  lastMessage?: string;
  lastMessageTime?: string;
  online?: boolean;
  createdAt?: string;
}

export interface CreateConversationRequest {
  partnerId: string;
  roomId?: string;
  type: "ROOM" | "ROOMMATE" | "DIRECT" | string;
  initialMessage?: string;
}

export interface ChatMessageResponse {
  id: string;
  conversationId: string;
  senderId: string;
  senderName?: string;
  senderAvatar?: string;
  content: string;
  attachmentUrl?: string;
  isRead?: boolean;
  createdAt: string;
}

export interface SendMessageRequest {
  content: string;
  attachmentUrl?: string;
}

