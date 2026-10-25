import { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams } from "react-router";
import { Send, Image as ImageIcon, Home, CheckCheck, MessageCircle, Users, UserRound, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { Conversation } from "../types/chat.types";
import { chatApi } from "../api/chatApi";
import { chatSocket } from "../services/chatSocket";
import { cn, getInitials } from "@/lib/utils";
import { useAuth } from "@/app/context/AuthContext";
import { toast } from "sonner";

type TabType = "all" | "group" | "direct";

const quickReplies: Record<TabType, string[]> = {
  all: [
    "Mình đã xem hồ sơ của bạn, ngày vào ở hợp lý nhé!",
    "Phòng hiện vẫn còn trống, bạn qua xem phòng lúc nào?",
    "Mình đã duyệt yêu cầu thuê, bạn vào mục Phòng của tôi kiểm tra nhé!",
  ],
  group: [
    "Mình đã xem hồ sơ của bạn, ngày vào ở hợp lý nhé!",
    "Phòng hiện vẫn còn trống, bạn qua xem phòng lúc nào?",
    "Mình đã duyệt yêu cầu thuê, bạn vào mục Phòng của tôi kiểm tra nhé!",
  ],
  direct: [
    "Chào bạn, bạn cần hỏi thêm thông tin gì về hợp đồng không?",
    "Bạn kiểm tra thông báo duyệt phòng trên hệ thống nhé",
    "Cảm ơn bạn đã phản hồi!",
  ],
};

export default function LandlordChat() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const cidParam = searchParams.get("cid");
  const partnerIdParam = searchParams.get("partnerId");
  const roomParam = searchParams.get("room");

  const [tab, setTab] = useState<TabType>("all");
  const [convos, setConvos] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeId, setActiveId] = useState<string>(cidParam || "");
  const [draft, setDraft] = useState("");
  const [wsConnected, setWsConnected] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    chatSocket.init((connected) => setWsConnected(connected));
  }, []);

  const loadLandlordConversations = useCallback(
    async (silent = false) => {
      if (!silent) setIsLoading(true);
      try {
        const data = await chatApi.getConversations();
        if (Array.isArray(data)) {
          let mapped: Conversation[] = data.map((cv: any) => ({
            id: String(cv.id),
            name: cv.partnerName || cv.name || cv.roomTitle || "Khách thuê",
            avatar: cv.partnerAvatar || cv.avatar || "",
            type: cv.type === "ROOM" ? "room" : "roommate",
            last: cv.lastMessageContent || cv.lastMessage || "Bắt đầu cuộc trò chuyện...",
            time: cv.lastMessageAt
              ? new Date(cv.lastMessageAt).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })
              : "Mới",
            unread: Number(cv.unreadCount || 0),
            online: true,
            messages: [],
            partnerId: cv.partnerId ? String(cv.partnerId) : undefined,
            roomId: cv.roomId ? String(cv.roomId) : undefined,
            roomTitle: cv.roomTitle,
          }));

          // If navigated with ?partnerId=... from LandlordTenants, find or create conversation
          if (!silent && partnerIdParam) {
            const existing = mapped.find((c) => c.partnerId === partnerIdParam);
            if (existing) {
              setActiveId(existing.id);
            } else {
              try {
                const created = await chatApi.createConversation({
                  partnerId: partnerIdParam,
                  roomId: roomParam || undefined,
                  type: "ROOM",
                });
                if (created?.id) {
                  const newConv: Conversation = {
                    id: String(created.id),
                    name: created.partnerName || created.name || "Khách thuê",
                    avatar: created.partnerAvatar || created.avatar || "",
                    type: "room",
                    last: "Bắt đầu cuộc trò chuyện...",
                    time: "Mới",
                    unread: 0,
                    online: true,
                    messages: [],
                    partnerId: partnerIdParam,
                  };
                  mapped = [newConv, ...mapped];
                  setActiveId(String(created.id));
                }
              } catch {
                // Ignore auto-create failure
              }
            }
          }

          setConvos((prev) =>
            mapped.map((m) => {
              const existing = prev.find((p) => p.id === m.id);
              return existing ? { ...m, messages: existing.messages } : m;
            })
          );

          if (!silent) {
            if (cidParam && mapped.some((c) => c.id === cidParam)) {
              setActiveId(cidParam);
            } else if (!activeId && mapped.length > 0) {
              setActiveId(mapped[0].id);
            }
          }
        }
      } catch (err) {
        if (!silent) console.warn("Could not load /chat/conversations for landlord:", err);
      } finally {
        if (!silent) setIsLoading(false);
      }
    },
    [cidParam, partnerIdParam, roomParam, activeId]
  );

  useEffect(() => {
    loadLandlordConversations(false);
    const interval = setInterval(() => loadLandlordConversations(true), 8000);
    return () => clearInterval(interval);
  }, [loadLandlordConversations]);

  const loadMessages = useCallback(
    async (conversationId: string) => {
      if (!conversationId) return;
      try {
        const res = await chatApi.getMessages(conversationId, 0, 50);
        const list = Array.isArray(res) ? res : res?.content || [];
        if (Array.isArray(list)) {
          const mappedMessages = list.map((m: any) => ({
            id: String(m.id),
            me: m.senderId === user?.id,
            text: m.content || "",
            attachmentUrl: m.attachmentUrl,
            time: m.createdAt
              ? new Date(m.createdAt).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })
              : "Vừa xong",
          }));
          setConvos((prev) =>
            prev.map((c) => (c.id === conversationId ? { ...c, messages: mappedMessages, unread: 0 } : c))
          );
        }
        chatApi.markAsRead(conversationId).catch(() => {});
      } catch (err) {
        console.warn("Could not fetch landlord messages:", err);
      }
    },
    [user?.id]
  );

  // Fetch messages for active conversation + 4s polling
  useEffect(() => {
    if (!activeId) return;
    loadMessages(activeId);
    const interval = setInterval(() => loadMessages(activeId), 4000);
    return () => clearInterval(interval);
  }, [activeId, loadMessages]);

  // Subscribe STOMP WebSocket for active conversation
  useEffect(() => {
    if (!activeId) return;
    chatSocket.subscribe(
      activeId,
      (incomingMsg) => {
        if (incomingMsg.conversationId !== activeId) return;
        const isMe = incomingMsg.senderId === user?.id;
        const mappedMsg = {
          id: incomingMsg.messageId,
          me: isMe,
          text: incomingMsg.content,
          time: new Date(incomingMsg.createdAt || Date.now()).toLocaleTimeString("vi-VN", {
            hour: "2-digit",
            minute: "2-digit",
          }),
        };
        setConvos((prev) =>
          prev.map((c) => {
            if (c.id !== activeId) return c;
            if (c.messages.some((m) => m.id === mappedMsg.id)) return c;
            return {
              ...c,
              messages: [...c.messages, mappedMsg],
              last: mappedMsg.text,
              time: mappedMsg.time,
            };
          })
        );
      },
      (connected) => setWsConnected(connected)
    );
    return () => chatSocket.unsubscribe();
  }, [activeId, user?.id]);

  const filteredList = convos.filter((c) => {
    if (tab === "group") return c.type === "room" || c.type === "ROOM";
    if (tab === "direct") return c.type !== "room" && c.type !== "ROOM";
    return true;
  });

  const active = convos.find((c) => c.id === activeId) || filteredList[0] || null;

  const switchTab = (t: TabType) => {
    setTab(t);
    const nextList = convos.filter((c) => {
      if (t === "group") return c.type === "room" || c.type === "ROOM";
      if (t === "direct") return c.type !== "room" && c.type !== "ROOM";
      return true;
    });
    if (nextList.length > 0 && !nextList.some((c) => c.id === activeId)) {
      setActiveId(nextList[0].id);
    }
    setDraft("");
  };

  const send = async (text: string, attachmentUrl?: string) => {
    if ((!text.trim() && !attachmentUrl) || !active) return;
    const contentText = text.trim() || "📷 Đã gửi một hình ảnh";
    const tempId = "temp-" + Date.now();
    const newMsg = {
      id: tempId,
      me: true,
      text: contentText,
      attachmentUrl,
      time: "Vừa xong",
    };

    setConvos((prev) =>
      prev.map((c) =>
        c.id === active.id
          ? { ...c, messages: [...c.messages, newMsg], last: contentText, time: "Vừa xong" }
          : c
      )
    );
    setDraft("");

    try {
      const sent = await chatApi.sendMessage(active.id, {
        content: contentText,
        attachmentUrl,
      });
      if (sent?.id) {
        setConvos((prev) =>
          prev.map((c) =>
            c.id === active.id
              ? {
                  ...c,
                  messages: c.messages.map((m) => (m.id === tempId ? { ...m, id: String(sent.id) } : m)),
                }
              : c
          )
        );
      }
    } catch (err) {
      toast.error("Không thể gửi tin nhắn, vui lòng thử lại.");
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !active) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Ảnh đính kèm không được vượt quá 5MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = typeof reader.result === "string" ? reader.result : undefined;
      send(`📷 [Hình ảnh: ${file.name}]`, dataUrl);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-[320px_1fr] -m-4 lg:-m-5 h-[calc(100dvh-3.5rem)]">
      {/* ── Conversation list panel ── */}
      <div className="flex flex-col border-r border-border overflow-hidden bg-card">
        {/* Header + tab switcher */}
        <div className="border-b border-border px-4 pt-4 pb-0 shrink-0">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-charcoal">Tin nhắn khách thuê</p>
            <span className="inline-flex items-center gap-1.5 text-[11px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
              {wsConnected ? "Trực tuyến" : "Tự động cập nhật"}
            </span>
          </div>
          <div className="flex gap-1">
            <button
              type="button"
              onClick={() => switchTab("all")}
              className={cn(
                "flex flex-1 items-center justify-center gap-1 rounded-t-lg px-2 py-2 text-xs font-medium border-b-2 transition-colors cursor-pointer",
                tab === "all"
                  ? "border-primary text-primary bg-mint/60"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              Tất cả ({convos.length})
            </button>
            <button
              type="button"
              onClick={() => switchTab("group")}
              className={cn(
                "flex flex-1 items-center justify-center gap-1 rounded-t-lg px-2 py-2 text-xs font-medium border-b-2 transition-colors cursor-pointer",
                tab === "group"
                  ? "border-primary text-primary bg-mint/60"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              <Home className="size-3.5" /> Hỏi thuê phòng
            </button>
            <button
              type="button"
              onClick={() => switchTab("direct")}
              className={cn(
                "flex flex-1 items-center justify-center gap-1 rounded-t-lg px-2 py-2 text-xs font-medium border-b-2 transition-colors cursor-pointer",
                tab === "direct"
                  ? "border-primary text-primary bg-mint/60"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              <UserRound className="size-3.5" /> Trực tiếp
            </button>
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="p-6 text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
              <RefreshCw className="size-3.5 animate-spin" /> Đang tải cuộc trò chuyện...
            </div>
          ) : filteredList.length === 0 ? (
            <div className="p-8 text-center">
              <MessageCircle className="mx-auto size-8 text-muted-foreground/40 mb-2" />
              <p className="text-sm font-medium text-foreground">Chưa có tin nhắn nào</p>
              <p className="text-xs text-muted-foreground mt-1">
                Khi khách thuê liên hệ hỏi phòng hoặc gửi yêu cầu thuê, tin nhắn sẽ xuất hiện tại đây.
              </p>
            </div>
          ) : (
            filteredList.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setActiveId(c.id)}
                className={cn(
                  "flex w-full items-center gap-3 px-4 py-3.5 text-left transition hover:bg-secondary/50 border-b border-border/30 cursor-pointer",
                  active?.id === c.id && "bg-mint/40 border-r-2 border-r-primary"
                )}
              >
                <div className="relative shrink-0">
                  <Avatar className="size-10">
                    {c.avatar ? <AvatarImage src={c.avatar} /> : null}
                    <AvatarFallback className="bg-mint text-primary text-xs font-semibold">
                      {getInitials(c.name)}
                    </AvatarFallback>
                  </Avatar>
                  {c.online && (
                    <span className="absolute bottom-0 right-0 size-2.5 rounded-full border-2 border-card bg-primary" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-medium text-charcoal">{c.name}</p>
                    <span className="shrink-0 text-xs text-muted-foreground">{c.time}</span>
                  </div>
                  {c.roomTitle && (
                    <p className="truncate text-[11px] font-medium text-emerald-700">
                      Phòng: {c.roomTitle}
                    </p>
                  )}
                  <p className="truncate text-xs text-muted-foreground">{c.last}</p>
                </div>
                {c.unread > 0 && (
                  <span className="grid size-5 shrink-0 place-items-center rounded-full bg-primary text-xs text-primary-foreground">
                    {c.unread}
                  </span>
                )}
              </button>
            ))
          )}
        </div>
      </div>

      {/* ── Active chat panel ── */}
      {active ? (
        <div className="flex flex-col overflow-hidden bg-background">
          {/* Chat header */}
          <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-3 shrink-0 bg-card">
            <div className="flex items-center gap-3 min-w-0">
              <Avatar className="size-9">
                {active.avatar ? <AvatarImage src={active.avatar} /> : null}
                <AvatarFallback className="bg-mint text-primary text-xs font-semibold">
                  {getInitials(active.name)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-charcoal truncate">{active.name}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {active.roomTitle ? `Quan tâm: ${active.roomTitle}` : "Trao đổi trực tiếp với khách thuê"}
                  {" · Đang hoạt động"}
                </p>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 space-y-3 overflow-y-auto bg-secondary/20 p-5">
            {active.messages.length === 0 ? (
              <div className="flex h-full items-center justify-center text-center p-8 text-muted-foreground text-sm">
                Hãy gửi tin nhắn đầu tiên để trao đổi với {active.name} về ngày vào ở và hợp đồng thuê!
              </div>
            ) : (
              active.messages.map((m) => (
                <div key={m.id} className={cn("flex", m.me ? "justify-end" : "justify-start")}>
                  <div
                    className={cn(
                      "max-w-[68%] rounded-2xl px-4 py-2.5 text-sm",
                      m.me
                        ? "bg-mint text-foreground rounded-br-sm"
                        : "bg-card ring-1 ring-border rounded-bl-sm"
                    )}
                  >
                    {m.attachmentUrl && (
                      <img
                        src={m.attachmentUrl}
                        alt="Đính kèm"
                        className="mb-2 max-h-56 rounded-xl object-cover border border-border"
                      />
                    )}
                    <p className="break-words">{m.text}</p>
                    <p
                      className={cn(
                        "mt-1 flex items-center justify-end gap-1 text-[10px]",
                        m.me ? "text-primary/70" : "text-muted-foreground"
                      )}
                    >
                      {m.time} {m.me && <CheckCheck className="size-3" />}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Input area */}
          <div className="border-t border-border p-4 shrink-0 bg-card">
            <div className="mb-2.5 flex flex-wrap gap-1.5">
              {quickReplies[tab].map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => send(q)}
                  className="rounded-full bg-mint px-3 py-1 text-xs text-primary transition hover:bg-accent press-active cursor-pointer"
                >
                  {q}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageSelect}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="shrink-0 cursor-pointer"
                title="Đính kèm hình ảnh phòng / hợp đồng"
                onClick={() => fileInputRef.current?.click()}
              >
                <ImageIcon className="size-5" />
              </Button>
              <Input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && send(draft)}
                placeholder="Nhập tin nhắn trao đổi với người thuê..."
                className="flex-1"
              />
              <Button
                type="button"
                size="icon"
                className="shrink-0 cursor-pointer"
                disabled={!draft.trim()}
                onClick={() => send(draft)}
              >
                <Send className="size-4" />
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="hidden place-items-center md:grid bg-background">
          <div className="text-center">
            <div className="mx-auto grid size-16 place-items-center rounded-full bg-mint text-primary">
              <MessageCircle className="size-8" />
            </div>
            <h3 className="mt-3 text-lg font-medium">Chọn cuộc trò chuyện</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Chọn một cuộc trò chuyện bên trái hoặc bấm "Nhắn tin" từ mục Người thuê
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
