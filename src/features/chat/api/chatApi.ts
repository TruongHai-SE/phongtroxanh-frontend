import { api, type PageResponse } from "@/lib/api";
import type {
  ConversationResponse,
  CreateConversationRequest,
  ChatMessageResponse,
  SendMessageRequest,
} from "../types/chat.types";

export const chatApi = {
  // #68 GET /api/v1/chat/conversations
  getConversations: (): Promise<ConversationResponse[]> => {
    return api.get<ConversationResponse[]>("/chat/conversations");
  },

  // #72 POST /api/v1/chat/conversations
  createConversation: (body: CreateConversationRequest): Promise<ConversationResponse> => {
    return api.post<ConversationResponse>("/chat/conversations", body);
  },

  // #69 GET /api/v1/chat/conversations/{id}/messages
  getMessages: (conversationId: string, page = 0, limit = 50): Promise<PageResponse<ChatMessageResponse>> => {
    return api.get<PageResponse<ChatMessageResponse>>(`/chat/conversations/${conversationId}/messages`, { page, limit });
  },

  // #70 POST /api/v1/chat/conversations/{id}/messages
  sendMessage: (conversationId: string, body: SendMessageRequest): Promise<ChatMessageResponse> => {
    return api.post<ChatMessageResponse>(`/chat/conversations/${conversationId}/messages`, body);
  },

  // #71 PUT /api/v1/chat/conversations/{id}/read
  markAsRead: (conversationId: string): Promise<void> => {
    return api.put<void>(`/chat/conversations/${conversationId}/read`);
  },
};

