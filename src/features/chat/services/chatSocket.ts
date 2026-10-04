import { tokenStorage } from "@/lib/api";

export interface WsChatMessage {
  messageId: string;
  conversationId: string;
  senderId: string;
  senderName?: string;
  content: string;
  attachmentUrl?: string;
  createdAt?: string;
}

type MessageCallback = (msg: WsChatMessage) => void;
type StatusCallback = (connected: boolean) => void;

class ChatSocketClient {
  private socket: WebSocket | null = null;
  private currentConversationId: string | null = null;
  private messageCallback: MessageCallback | null = null;
  private statusCallback: StatusCallback | null = null;
  private isConnected = false;
  private reconnectTimer: any = null;

  private getWsUrl(): string {
    const apiBase = (import.meta as any).env?.VITE_API_BASE_URL || "http://localhost:8080/api/v1";
    const wsBase = apiBase.replace(/^http/, "ws").replace(/\/api\/v1\/?$/, "");
    return `${wsBase}/ws/chat`;
  }

  public init(onStatus?: StatusCallback) {
    if (onStatus) this.statusCallback = onStatus;
    if (this.socket && this.socket.readyState === WebSocket.OPEN && this.isConnected) {
      this.statusCallback?.(true);
      return;
    }
    this.connect();
  }

  public subscribe(conversationId: string, onMessage: MessageCallback, onStatus?: StatusCallback) {
    this.currentConversationId = conversationId;
    this.messageCallback = onMessage;
    if (onStatus) this.statusCallback = onStatus;

    if (this.socket && this.socket.readyState === WebSocket.OPEN && this.isConnected) {
      // Send STOMP SUBSCRIBE for new conversation
      this.sendStompSubscribe(conversationId);
      this.statusCallback?.(true);
      return;
    }

    this.connect();
  }

  public unsubscribe() {
    if (this.socket && this.socket.readyState === WebSocket.OPEN && this.currentConversationId) {
      const unsubFrame = `UNSUBSCRIBE\nid:sub-${this.currentConversationId}\n\n\0`;
      try {
        this.socket.send(unsubFrame);
      } catch (e) {
        // ignore send error
      }
    }
    this.currentConversationId = null;
    this.messageCallback = null;
  }

  public disconnect() {
    this.unsubscribe();
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    if (this.socket) {
      try {
        const discFrame = `DISCONNECT\n\n\0`;
        if (this.socket.readyState === WebSocket.OPEN) {
          this.socket.send(discFrame);
        }
        this.socket.close();
      } catch (e) {
        // ignore
      }
      this.socket = null;
    }
    this.isConnected = false;
    this.statusCallback?.(false);
  }

  private connect() {
    if (this.socket && (this.socket.readyState === WebSocket.CONNECTING || this.socket.readyState === WebSocket.OPEN)) {
      return;
    }

    const token = tokenStorage.getToken();
    if (!token) {
      this.statusCallback?.(false);
      return;
    }

    try {
      const wsUrl = this.getWsUrl();
      this.socket = new WebSocket(wsUrl);

      this.socket.onopen = () => {
        // Send STOMP CONNECT frame with Bearer token
        const connectFrame = [
          "CONNECT",
          `Authorization:Bearer ${token}`,
          "accept-version:1.1,1.0",
          "heart-beat:10000,10000",
          "",
          "",
        ].join("\n") + "\0";

        this.socket?.send(connectFrame);
      };

      this.socket.onmessage = (event) => {
        this.handleStompMessage(event.data);
      };

      this.socket.onclose = () => {
        this.isConnected = false;
        this.statusCallback?.(false);
        // Retry connection after 5 seconds if still subscribed
        if (this.currentConversationId) {
          this.reconnectTimer = setTimeout(() => this.connect(), 5000);
        }
      };

      this.socket.onerror = () => {
        this.isConnected = false;
        this.statusCallback?.(false);
      };
    } catch (e) {
      this.isConnected = false;
      this.statusCallback?.(false);
    }
  }

  private sendStompSubscribe(conversationId: string) {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) return;
    const subFrame = [
      "SUBSCRIBE",
      `id:sub-${conversationId}`,
      `destination:/topic/conversations.${conversationId}`,
      "",
      "",
    ].join("\n") + "\0";

    this.socket.send(subFrame);
  }

  private handleStompMessage(data: string) {
    if (typeof data !== "string") return;

    if (data.startsWith("CONNECTED")) {
      this.isConnected = true;
      this.statusCallback?.(true);
      if (this.currentConversationId) {
        this.sendStompSubscribe(this.currentConversationId);
      }
      return;
    }

    if (data.startsWith("MESSAGE")) {
      // Find STOMP frame body (after double newline)
      const bodyIndex = data.indexOf("\n\n");
      if (bodyIndex === -1) return;

      let rawBody = data.substring(bodyIndex + 2);
      // Remove trailing null byte
      if (rawBody.endsWith("\0")) {
        rawBody = rawBody.slice(0, -1);
      }

      try {
        const payload = JSON.parse(rawBody.trim());
        if (payload && this.messageCallback) {
          this.messageCallback({
            messageId: String(payload.messageId || Date.now()),
            conversationId: String(payload.conversationId),
            senderId: String(payload.senderId),
            senderName: payload.senderName,
            content: payload.content || "",
            attachmentUrl: payload.attachmentUrl,
            createdAt: payload.createdAt || new Date().toISOString(),
          });
        }
      } catch (err) {
        console.warn("Failed to parse STOMP message payload:", err);
      }
    }
  }
}

export const chatSocket = new ChatSocketClient();
