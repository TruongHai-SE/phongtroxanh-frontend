import { useState, useEffect } from "react";
import { Send, Image as ImageIcon, Home, CheckCheck, MessageCircle, Users, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { Conversation } from "../types/chat.types";
import { cn, getInitials } from "@/lib/utils";
import { api } from "@/lib/api";

import { useAuth } from "@/app/context/AuthContext";

type TabType = "group" | "direct";

const quickReplies: Record<TabType, string[]> = {
  group: ["Mình sẽ xử lý sớm", "Bạn mô tả rõ hơn được không?", "Để cô báo thợ qua nhé"],
  direct: ["Phòng còn trống nhé bạn", "Bạn qua xem phòng lúc nào?", "Tiền thuê chưa nhận được nhé"],
};

export default function LandlordChat() {
  const { user } = useAuth();
  const [tab, setTab] = useState<TabType>("group");
  const [allConvos, setAllConvos] = useState<{ group: Conversation[]; direct: Conversation[] }>({
    group: [],
    direct: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const convos = tab === "group" ? allConvos.group : allConvos.direct;
  const [activeId, setActiveId] = useState<string>("");
  const [draft, setDraft] = useState("");

  useEffect(() => {
    async function loadLandlordConversations() {
      setIsLoading(true);
      try {
        const data = await api.get<any[]>("/chat/conversations");
        if (Array.isArray(data)) {
          const groupMapped: Conversation[] = [];
          const directMapped: Conversation[] = [];

          data.forEach((cv: any, idx: number) => {
            const item: Conversation = {
              id: String(cv.id),
              name: cv.partnerName || cv.roomTitle || "Khách thuê",
              avatar: cv.partnerAvatar || "",
              type: cv.type === "ROOM" ? "room" : "roommate",
              last: cv.lastMessageContent || "Bắt đầu cuộc trò chuyện...",
              time: cv.lastMessageAt
                ? new Date(cv.lastMessageAt).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })
                : "Mới",
              unread: Number(cv.unreadCount || 0),
              online: true,
              messages: [],
            };
            if (cv.type === "ROOM") {
              groupMapped.push(item);
            } else {
              directMapped.push(item);
            }
          });

          setAllConvos({
            group: groupMapped,
            direct: directMapped,
          });

          // Set default active
          const initialList = tab === "group" ? groupMapped : directMapped;
          if (initialList.length > 0 && !activeId) {
            setActiveId(initialList[0].id);
          } else if (groupMapped.length > 0 && !activeId) {
            setActiveId(groupMapped[0].id);
          }
        }
      } catch (err) {
        console.warn("Could not load /chat/conversations for landlord:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadLandlordConversations();
  }, []);

  // Fetch messages for active conversation
  useEffect(() => {
    if (!activeId) return;
    async function loadMessages() {
      try {
        const res = await api.get<any>(`/chat/conversations/${activeId}/messages?limit=50`);
        const list = Array.isArray(res) ? res : res?.content;
        if (Array.isArray(list)) {
          const mappedMessages = list.map((m: any) => ({
            id: String(m.id),
            me: m.senderId === user?.id,
            text: m.content || "",
            time: m.createdAt
              ? new Date(m.createdAt).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })
              : "Vừa xong",
          }));
          setAllConvos((prev) => ({
            ...prev,
            group: prev.group.map((c) => (c.id === activeId ? { ...c, messages: mappedMessages, unread: 0 } : c)),
            direct: prev.direct.map((c) => (c.id === activeId ? { ...c, messages: mappedMessages, unread: 0 } : c)),
          }));
        }
        api.put(`/chat/conversations/${activeId}/read`).catch(() => {});
      } catch (err) {
        console.warn("Could not fetch messages:", err);
      }
    }
    loadMessages();
  }, [activeId, user?.id]);

  const currentList = allConvos[tab];
  const active = currentList.find((c) => c.id === activeId) || currentList[0];

  const switchTab = (t: TabType) => {
    setTab(t);
    const list = t === "group" ? allConvos.group : allConvos.direct;
    setActiveId(list[0]?.id ?? "");
    setDraft("");
  };

  const send = async (text: string) => {
    if (!text.trim() || !active) return;
    const newMsg = { id: Date.now() + "", me: true, text, time: "Bây giờ" };
    setAllConvos((prev) => ({
      ...prev,
      [tab]: prev[tab].map((c) =>
        c.id === active.id
          ? { ...c, messages: [...c.messages, newMsg], last: text }
          : c,
      ),
    }));
    setDraft("");

    if (active.id && !active.id.startsWith("g") && !active.id.startsWith("d")) {
      try {
        await api.post(`/chat/conversations/${active.id}/messages`, { content: text });
      } catch (err) {
        console.warn("Could not send landlord message:", err);
      }
    }
  };

  return (
    <div
      className="grid grid-cols-1 md:grid-cols-[300px_1fr] -m-6 lg:-m-8"
      style={{ height: "calc(100vh - 4rem)" }}
    >
      {/* ── Conversation list panel ── */}
      <div className="flex flex-col border-r border-border overflow-hidden">
        {/* Header + tab switcher */}
        <div className="border-b border-border px-4 pt-4 pb-0 shrink-0">
          <p className="text-sm font-semibold text-charcoal mb-3">Tin nhắn</p>
          <div className="flex gap-1">
            <button
              onClick={() => switchTab("group")}
              className={cn(
                "flex flex-1 items-center justify-center gap-1.5 rounded-t-lg px-3 py-2 text-xs font-medium border-b-2 transition-colors",
                tab === "group"
                  ? "border-primary text-primary bg-mint/60"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              <Users className="size-3.5" /> Nhóm phòng
            </button>
            <button
              onClick={() => switchTab("direct")}
              className={cn(
                "flex flex-1 items-center justify-center gap-1.5 rounded-t-lg px-3 py-2 text-xs font-medium border-b-2 transition-colors",
                tab === "direct"
                  ? "border-primary text-primary bg-mint/60"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              <UserRound className="size-3.5" /> Trực tiếp
            </button>
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {currentList.map((c) => (
            <button
              key={c.id}
              onClick={() => setActiveId(c.id)}
              className={cn(
                "flex w-full items-center gap-3 px-4 py-3.5 text-left transition hover:bg-secondary/50",
                activeId === c.id && "bg-mint/40 border-r-2 border-primary",
              )}
            >
              <div className="relative shrink-0">
                <Avatar className="size-10">
                  {c.avatar ? <AvatarImage src={c.avatar} /> : null}
                  <AvatarFallback className="bg-mint text-primary text-xs">
                    {tab === "group" ? <Home className="size-4" /> : getInitials(c.name)}
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
                <p className="truncate text-xs text-muted-foreground">{c.last}</p>
              </div>
              {c.unread > 0 && (
                <span className="grid size-5 shrink-0 place-items-center rounded-full bg-primary text-xs text-primary-foreground">
                  {c.unread}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ── Active chat panel ── */}
      {active ? (
        <div className="flex flex-col overflow-hidden">
          {/* Chat header */}
          <div className="flex items-center gap-3 border-b border-border px-5 py-3 shrink-0">
            <div className="grid size-9 place-items-center rounded-full bg-mint">
              {tab === "group" ? (
                <Home className="size-4 text-primary" />
              ) : (
                <UserRound className="size-4 text-primary" />
              )}
            </div>
            <div>
              <p className="text-sm font-medium text-charcoal">{active.name}</p>
              <p className="text-xs text-muted-foreground">
                {tab === "group" ? "Nhóm phòng" : "Chat trực tiếp"}
                {active.online && " · Đang hoạt động"}
              </p>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 space-y-3 overflow-y-auto bg-secondary/20 p-5">
            {active.messages.map((m) => (
              <div key={m.id} className={cn("flex", m.me ? "justify-end" : "justify-start")}>
                <div
                  className={cn(
                    "max-w-[68%] rounded-2xl px-4 py-2.5 text-sm",
                    m.me
                      ? "bg-mint text-foreground rounded-br-sm"
                      : "bg-card ring-1 ring-border rounded-bl-sm",
                  )}
                >
                  <p>{m.text}</p>
                  <p
                    className={cn(
                      "mt-1 flex items-center justify-end gap-1 text-[10px]",
                      m.me ? "text-primary/70" : "text-muted-foreground",
                    )}
                  >
                    {m.time} {m.me && <CheckCheck className="size-3" />}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Input area */}
          <div className="border-t border-border p-4 shrink-0">
            <div className="mb-2.5 flex flex-wrap gap-1.5">
              {quickReplies[tab].map((q) => (
                <button
                  key={q}
                  onClick={() => send(q)}
                  className="rounded-full bg-mint px-3 py-1 text-xs text-primary transition hover:bg-accent press-active"
                >
                  {q}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="shrink-0">
                <ImageIcon className="size-5" />
              </Button>
              <Input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && send(draft)}
                placeholder="Nhập tin nhắn..."
                className="flex-1"
              />
              <Button size="icon" className="shrink-0" onClick={() => send(draft)}>
                <Send className="size-4" />
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="hidden place-items-center md:grid">
          <div className="text-center">
            <div className="mx-auto grid size-16 place-items-center rounded-full bg-mint text-primary">
              <MessageCircle className="size-8" />
            </div>
            <h3 className="mt-3 text-lg">Chọn cuộc trò chuyện</h3>
            <p className="mt-1 text-sm text-muted-foreground">Chọn một cuộc trò chuyện để trả lời</p>
          </div>
        </div>
      )}
    </div>
  );
}
