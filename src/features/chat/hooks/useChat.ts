import { useState, useEffect, useCallback } from "react";
import { chatApi } from "../api/chatApi";
import type { Conversation, ConversationResponse, ChatMessageResponse } from "../types/chat.types";

export function useChat(activeConversationId?: string) {
  const [conversations, setConversations] = useState<ConversationResponse[]>([]);
  const [messages, setMessages] = useState<ChatMessageResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isError, setIsError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchConversations = useCallback(async () => {
    setIsLoading(true);
    setIsError(false);
    setErrorMessage(null);
    try {
      const data = await chatApi.getConversations();
      setConversations(data || []);
    } catch (err: any) {
      setIsError(true);
      setErrorMessage(err.message || "Không thể tải danh sách cuộc trò chuyện.");
      setConversations([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchMessages = useCallback(async (convId: string) => {
    try {
      const res = await chatApi.getMessages(convId);
      setMessages(res?.content || []);
      await chatApi.markAsRead(convId).catch(() => {});
    } catch (err: any) {
      console.error("Failed to load messages", err);
    }
  }, []);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  useEffect(() => {
    if (activeConversationId) {
      fetchMessages(activeConversationId);
    } else {
      setMessages([]);
    }
  }, [activeConversationId, fetchMessages]);

  const sendMessage = async (text: string) => {
    if (!activeConversationId || !text.trim()) return;
    setIsSending(true);
    try {
      const newMsg = await chatApi.sendMessage(activeConversationId, { content: text });
      setMessages((prev) => [...prev, newMsg]);
      return newMsg;
    } catch (err: any) {
      throw err;
    } finally {
      setIsSending(false);
    }
  };

  const createConversation = async (partnerId: string, type: "ROOM" | "ROOMMATE" | "DIRECT" | string = "ROOMMATE", roomId?: string) => {
    const newConv = await chatApi.createConversation({ partnerId, type, roomId });
    setConversations((prev) => [newConv, ...prev]);
    return newConv;
  };

  const isEmpty = !isLoading && !isError && conversations.length === 0;

  return {
    conversations,
    messages,
    isLoading,
    isSending,
    isError,
    isEmpty,
    errorMessage,
    refetch: fetchConversations,
    sendMessage,
    createConversation,
  };
}
