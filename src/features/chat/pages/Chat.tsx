import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router";
import { Send, Image as ImageIcon, CheckCheck, MessageCircle, Wifi, WifiOff, AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Conversation } from "../types/chat.types";
import { chatApi } from "../api/chatApi";
import { chatSocket } from "../services/chatSocket";
import { cn, getInitials } from "@/lib/utils";
import { useAuth } from "@/app/context/AuthContext";
import { tokenStorage } from "@/lib/api";

const quickReplies = ["Phòng còn trống không ạ?", "Cho mình xem thêm ảnh nhé", "Khi nào xem phòng được?"];

export default function Chat() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const cidParam = searchParams.get("cid");
  const roomParam = searchParams.get("room");
  const partnerIdParam = searchParams.get("partnerId");
  const [convos, setConvos] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(cidParam || null);
  const [draft, setDraft] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "room" | "mate">("all");
  const [wsConnected, setWsConnected] = useState(false);
  const [isLoadingConvos, setIsLoadingConvos] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Khởi tạo kết nối WebSocket Real-time ngay khi vào màn hình Tin nhắn
  useEffect(() => {
    chatSocket.init((connected) => setWsConnected(connected));
  }, []);

  const active = convos.find((c) => c.id === activeId);

  // Load conversations on mount
  useEffect(() => {
    async function loadConversations() {
      setIsLoadingConvos(true);
      setErrorMsg(null);
      try {
        const data = await chatApi.getConversations();
        let mapped: Conversation[] = [];
        if (Array.isArray(data) && data.length > 0) {
          mapped = data.map((cv: any) => ({
            id: String(cv.id),
            name: cv.name || cv.partnerName || cv.roomTitle || "Người dùng",
            avatar: cv.avatar || cv.partnerAvatar || "",
            type: cv.type === "ROOM" ? "room" : "roommate",
            last: cv.lastMessage || cv.lastMessageContent || "Bắt đầu cuộc trò chuyện...",
            time: cv.lastMessageTime || (cv.lastMessageAt
              ? new Date(cv.lastMessageAt).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })
              : "Mới"),
            unread: Number(cv.unreadCount || 0),
            online: true,
            messages: [],
            partnerId: cv.partnerId,
            roomId: cv.roomId,
          } as any));
        }

        // Handle auto-connecting to landlord when clicked from RoomDetail (?room=...&partnerId=...)
        if (partnerIdParam) {
          const existing = mapped.find(
            (c: any) =>
              (c.roomId && String(c.roomId) === roomParam) ||
              (c.partnerId && String(c.partnerId) === partnerIdParam)
          );
          if (existing) {
            setConvos(mapped);
            setActiveId(existing.id);
            return;
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
                  name: created.name || created.partnerName || "Chủ trọ",
                  avatar: created.avatar || created.partnerAvatar || "",
                  type: "room",
                  last: "Bắt đầu cuộc trò chuyện...",
                  time: "Mới",
                  unread: 0,
                  online: true,
                  messages: [],
                };
                mapped = [newConv, ...mapped];
                setConvos(mapped);
                setActiveId(String(created.id));
                return;
              }
            } catch (createErr) {
              console.warn("Could not auto-create conversation for landlord:", createErr);
            }
          }
        }

        setConvos(mapped);
        if (cidParam) {
          setActiveId(cidParam);
        } else if (mapped.length > 0 && !activeId) {
          setActiveId(mapped[0].id);
        }
      } catch (err: any) {
        if (err?.status === 401 || err?.message?.includes("xác thực") || err?.message?.includes("đăng nhập")) {
          tokenStorage.clear();
        }
        setErrorMsg(err.message || "Không thể tải danh sách cuộc trò chuyện.");
      } finally {
        setIsLoadingConvos(false);
      }
    }
    loadConversations();
  }, [cidParam, roomParam, partnerIdParam]);

  // Load initial messages for active conversation
  const loadMessages = useCallback(async (conversationId: string) => {
    try {
      const res = await chatApi.getMessages(conversationId);
      const list = Array.isArray(res) ? res : (res?.content || []);
      if (Array.isArray(list)) {
        const mappedMessages = list.map((m: any) => ({
          id: String(m.id),
          me: m.senderId === user?.id || m.senderId === "me" || m.isMe || false,
          text: m.content || "",
          time: m.createdAt
            ? new Date(m.createdAt).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })
            : "Vừa xong",
        }));
        setConvos((cs) =>
          cs.map((c) => (c.id === conversationId ? { ...c, messages: mappedMessages, unread: 0 } : c))
        );
      }
      chatApi.markAsRead(conversationId).catch(() => {});
    } catch (err) {
      console.warn("Could not fetch messages:", err);
    }
  }, [user?.id]);

  useEffect(() => {
    if (!activeId) return;
    loadMessages(activeId);
  }, [activeId, loadMessages]);

  // Subscribe to real-time STOMP WebSocket for active conversation
  useEffect(() => {
    if (!activeId || activeId.startsWith("conv-")) return;

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

        setConvos((cs) =>
          cs.map((c) => {
            if (c.id === activeId) {
              if (c.messages.some((m) => m.id === mappedMsg.id)) return c;
              return {
                ...c,
                messages: [...c.messages, mappedMsg],
                last: mappedMsg.text,
                time: mappedMsg.time,
              };
            }
            return c;
          })
        );
      },
      (connected) => setWsConnected(connected)
    );

    return () => {
      chatSocket.unsubscribe();
    };
  }, [activeId, user?.id]);

  // Polling fallback every 4 seconds when conversation is open
  useEffect(() => {
    if (!activeId || activeId.startsWith("conv-")) return;

    const interval = setInterval(() => {
      loadMessages(activeId);
    }, 4000);

    return () => clearInterval(interval);
  }, [activeId, loadMessages]);

  const send = async (text: string) => {
    if (!text.trim() || !active) return;
    const tempId = "temp-" + Date.now();
    const newMsg = { id: tempId, me: true, text: text.trim(), time: "Vừa xong" };

    setConvos((cs) =>
      cs.map((c) =>
        c.id === active.id
          ? { ...c, messages: [...c.messages, newMsg], last: text.trim() }
          : c
      )
    );
    setDraft("");

    // Send to backend via REST (automatically broadcasts to STOMP WebSocket and Redis)
    if (active.id && !active.id.startsWith("conv-")) {
      try {
        const sent = await chatApi.sendMessage(active.id, { content: text.trim() });
        if (sent && sent.id) {
          // Replace temp ID with real ID
          setConvos((cs) =>
            cs.map((c) =>
              c.id === active.id
                ? {
                    ...c,
                    messages: c.messages.map((m) =>
                      m.id === tempId ? { ...m, id: String(sent.id) } : m
                    ),
                  }
                : c
            )
          );
        }
      } catch (err: any) {
        console.warn("Error sending message via API:", err);
      }
    }
  };

  const filteredConvos = convos.filter((c) => {
    if (activeTab === "room") return c.type === "room";
    if (activeTab === "mate") return c.type === "roommate";
    return true;
  });

  return (
    <div className="grid h-[calc(100vh-4rem)] grid-cols-1 md:grid-cols-[340px_1fr]">
      {/* Conversation list */}
      <div className="flex flex-col border-r border-border bg-card">
        <div className="p-4 border-b border-border/50">
          <div className="flex items-center justify-between">
            <h1 className="brand text-xl text-foreground">Tin nhắn</h1>
            <span
              className={cn(
                "inline-flex items-center gap-1.5 text-[11px] px-2.5 py-0.5 rounded-full font-medium transition-colors",
                wsConnected
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200/60 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800/40"
                  : "bg-muted text-muted-foreground border border-border/60"
              )}
              title={
                wsConnected
                  ? "Đang kết nối Real-time WebSocket (Thời gian thực)"
                  : "Đang duy trì kết nối tự động cập nhật (Polling)"
              }
            >
              {wsConnected ? (
                <>
                  <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Trực tuyến</span>
                </>
              ) : (
                <>
                  <RefreshCw className="size-2.5 animate-spin text-muted-foreground" />
                  <span>Tự động cập nhật</span>
                </>
              )}
            </span>
          </div>
          <Tabs value={activeTab} onValueChange={(v: any) => setActiveTab(v)} className="mt-3">
            <TabsList className="w-full">
              <TabsTrigger value="all" className="flex-1 text-xs">Tất cả</TabsTrigger>
              <TabsTrigger value="room" className="flex-1 text-xs">Phòng</TabsTrigger>
              <TabsTrigger value="mate" className="flex-1 text-xs">Bạn ở</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="flex-1 overflow-y-auto">
          {isLoadingConvos ? (
            <div className="p-6 text-center text-xs text-muted-foreground">
              Đang tải danh sách tin nhắn...
            </div>
          ) : errorMsg ? (
            <div className="p-6 text-center space-y-3">
              <div className="mx-auto grid size-10 place-items-center rounded-full bg-amber-50 text-amber-600">
                <AlertCircle className="size-5" />
              </div>
              <p className="text-xs text-muted-foreground">{errorMsg}</p>
              <Button
                size="sm"
                onClick={() => navigate("/login")}
                className="w-full text-xs font-semibold cursor-pointer"
              >
                Đăng nhập lại
              </Button>
            </div>
          ) : filteredConvos.length === 0 ? (
            <div className="p-8 text-center">
              <MessageCircle className="mx-auto size-8 text-muted-foreground/40 mb-2" />
              <p className="text-sm font-medium text-foreground">Chưa có cuộc trò chuyện nào</p>
              <p className="text-xs text-muted-foreground mt-1">
                Khi bạn liên hệ chủ trọ hoặc match với bạn ở ghép, cuộc trò chuyện sẽ hiện ở đây.
              </p>
            </div>
          ) : (
            filteredConvos.map((c) => (
              <button
                key={c.id}
                onClick={() => setActiveId(c.id)}
                className={cn(
                  "flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-secondary/50 border-b border-border/30",
                  activeId === c.id && "bg-mint/40"
                )}
              >
                <div className="relative shrink-0">
                  <Avatar className="size-11">
                    <AvatarImage src={c.avatar || undefined} />
                    <AvatarFallback className="bg-emerald-100 text-emerald-800 text-xs font-semibold">
                      {getInitials(c.name)}
                    </AvatarFallback>
                  </Avatar>
                  {c.online && (
                    <span className="absolute bottom-0 right-0 size-3 rounded-full border-2 border-card bg-primary" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <p className="truncate text-sm font-medium">{c.name}</p>
                    <span className="text-[11px] text-muted-foreground">{c.time}</span>
                  </div>
                  <p className="truncate text-xs text-muted-foreground mt-0.5">{c.last}</p>
                </div>
                {c.unread > 0 && (
                  <span className="grid size-5 place-items-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                    {c.unread}
                  </span>
                )}
              </button>
            ))
          )}
        </div>
      </div>

      {/* Active chat window */}
      {active ? (
        <div className="flex flex-col h-full bg-background">
          <div className="flex items-center gap-3 border-b border-border p-4 bg-card">
            <Avatar className="size-10">
              <AvatarImage src={active.avatar || undefined} />
              <AvatarFallback className="bg-emerald-100 text-emerald-800 text-xs font-semibold">
                {getInitials(active.name)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold truncate">{active.name}</p>
              <p className="text-xs text-primary flex items-center gap-1.5">
                <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                {wsConnected ? "Trực tuyến (Real-time)" : "Trực tuyến"}
              </p>
            </div>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto bg-secondary/15 p-6">
            {active.messages.length === 0 ? (
              <div className="flex h-full items-center justify-center text-center p-8 text-muted-foreground text-sm">
                Chưa có tin nhắn trong cuộc trò chuyện này. Hãy gửi lời chào đầu tiên!
              </div>
            ) : (
              active.messages.map((m) => (
                <div key={m.id} className={cn("flex", m.me ? "justify-end" : "justify-start")}>
                  <div
                    className={cn(
                      "max-w-[70%] rounded-2xl px-4 py-2 text-sm shadow-xs",
                      m.me ? "bg-mint text-foreground" : "bg-card ring-1 ring-border"
                    )}
                  >
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

          <div className="border-t border-border p-3 bg-card">
            <div className="mb-2 flex flex-wrap gap-2">
              {quickReplies.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => send(q)}
                  className="rounded-full bg-mint px-3 py-1 text-xs text-primary transition hover:bg-accent cursor-pointer"
                >
                  {q}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="shrink-0 text-muted-foreground">
                <ImageIcon className="size-5" />
              </Button>
              <Input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && send(draft)}
                placeholder="Nhập tin nhắn..."
                className="text-sm"
              />
              <Button size="icon" onClick={() => send(draft)} disabled={!draft.trim()} className="shrink-0 cursor-pointer">
                <Send className="size-4" />
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="hidden place-items-center md:grid bg-background">
          <div className="text-center p-8">
            <div className="mx-auto grid size-16 place-items-center rounded-full bg-mint text-primary">
              <MessageCircle className="size-8" />
            </div>
            <h3 className="mt-3 text-lg font-medium text-foreground">Chọn cuộc trò chuyện</h3>
            <p className="mt-1 text-sm text-muted-foreground max-w-sm">
              Chọn một cuộc trò chuyện từ danh sách bên trái hoặc liên hệ với chủ trọ từ trang chi tiết phòng.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
