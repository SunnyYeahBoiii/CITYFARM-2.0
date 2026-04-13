"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Bot, Mic, Send, Sparkles, User } from "lucide-react";
import type { PlantHealth } from "../../lib/cityfarm-data";
import type { ChatContextPayload } from "../../lib/plant-chat-context";
import { postChat } from "../../lib/chat-api";
import { AssistantMessageBody } from "./assistant-message-body";
import { TypingIndicator } from "./typing-indicator";

type ChatRole = "user" | "assistant";

type ChatMessage = {
  id: string;
  role: ChatRole;
  content: string;
  createdAt: number;
  /** Run typewriter when assistant message first appears (API replies). */
  animateAssistant?: boolean;
};

type ChatbotScreenProps = {
  initialContext: ChatContextPayload | null;
  plantId?: string | null;
  plantName: string | null;
  plantHealth: PlantHealth | null;
  /** Shown in greeting, e.g. "Nguyễn Văn Phú". Default: "bạn". */
  userGreetingName?: string;
};

const WELCOME_MARKDOWN = `Chào bạn! Tôi là **CityFarm AI**, trợ lý ảo cho vườn thông minh của bạn.

Bạn có thể hỏi tôi về:

- **Hướng dẫn chăm sóc** theo từng loại cây
- **Tưới tiêu và dinh dưỡng** phù hợp mùa vụ
- **Nhận biết sâu bệnh** và xử lý sớm

Hãy nhập câu hỏi bên dưới hoặc chọn **gợi ý nhanh**.`;

const QUICK_REPLIES = [
  "Chăm sóc cây theo mùa",
  "Dấu hiệu cây thiếu nước",
  "Đất trồng phù hợp loại cây",
];

/** Fixed TZ avoids SSR vs browser locale default mismatch (hydration errors). */
const META_TIME_ZONE = "Asia/Ho_Chi_Minh";
const WELCOME_CREATED_AT = 0;

function formatMetaTime(ts: number): string {
  if (ts <= 0) {
    return "Bây giờ";
  }

  return new Date(ts).toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: META_TIME_ZONE,
  });
}

function makeId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function ChatbotScreen({
  initialContext,
  plantId = null,
  plantName,
  plantHealth: _plantHealth,
  userGreetingName = "bạn",
}: ChatbotScreenProps) {
  void _plantHealth;
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome-assistant-message",
      role: "assistant",
      content: WELCOME_MARKDOWN,
      createdAt: WELCOME_CREATED_AT,
      animateAssistant: false,
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const listEndRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = useCallback(() => {
    listEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading, scrollToBottom]);

  const sendText = useCallback(
    async (raw: string) => {
      const text = raw.trim();
      if (!text || loading) return;

      const userMsg: ChatMessage = {
        id: makeId(),
        role: "user",
        content: text,
        createdAt: Date.now(),
      };

      setMessages((prev) => [...prev, userMsg]);
      setInput("");
      setLoading(true);

      try {
        const res = await postChat({
          message: text,
          plantId: plantId ?? undefined,
          context: initialContext ?? undefined,
        });

        const replyContent = res.success
          ? (res.reply?.trim() || "Tôi chưa có nội dung trả lời. Bạn thử hỏi lại nhé.")
          : `**Lỗi:** ${res.error ?? "Không gửi được tin nhắn."}${res.details ? `\n\n${res.details}` : ""}`;

        setMessages((prev) => [
          ...prev,
          {
            id: makeId(),
            role: "assistant",
            content: replyContent,
            createdAt: Date.now(),
            animateAssistant: true,
          },
        ]);
      } catch {
        setMessages((prev) => [
          ...prev,
          {
            id: makeId(),
            role: "assistant",
            content: "**Lỗi:** Không kết nối được tới máy chủ. Kiểm tra mạng hoặc API.",
            createdAt: Date.now(),
            animateAssistant: false,
          },
        ]);
      } finally {
        setLoading(false);
      }
    },
    [initialContext, loading, plantId],
  );

  const onSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      void sendText(input);
    },
    [input, sendText],
  );

  return (
    <div className="flex h-full min-h-0 flex-col bg-[var(--color-screen)] text-[var(--color-ink)]">
      <section className="shrink-0 border-b border-[var(--color-border-subtle)] bg-white/90 px-3 py-2 backdrop-blur-md sm:px-4">
        <div className="flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5 text-[12px] leading-snug">
          <span className="font-semibold text-[var(--color-heading)]">Xin chào, {userGreetingName}</span>
          <span className="text-[var(--color-muted)]">·</span>
          {plantName ? (
            <span className="text-[var(--color-muted)]">
              Ngữ cảnh:{" "}
              <span className="font-medium text-[var(--color-green-deep)]">{plantName}</span>
            </span>
          ) : (
            <span className="text-[var(--color-muted)]">Chọn gợi ý hoặc hỏi tự do bên dưới</span>
          )}
        </div>
      </section>

      <div className="min-h-0 flex-1 overflow-y-auto bg-[var(--color-screen)] px-3 py-3 sm:px-4">
        <div className="flex flex-col gap-3">
          {messages.map((m) =>
            m.role === "assistant" ? (
              <div key={m.id} className="flex items-end gap-1.5">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-[var(--color-green-deep)]">
                  <Bot className="h-3.5 w-3.5 text-white" strokeWidth={2} />
                </div>
                <div className="max-w-[88%]">
                  <div className="rounded-xl rounded-bl-sm border border-[var(--color-border-subtle)] bg-white px-3 py-2 shadow-sm">
                    <AssistantMessageBody content={m.content} animate={m.animateAssistant ?? false} />
                  </div>
                  <p className="mt-1 pl-0.5 text-[10px] leading-tight text-[var(--color-muted)]">
                    {formatMetaTime(m.createdAt)} · AI
                  </p>
                </div>
              </div>
            ) : (
              <div key={m.id} className="flex flex-row-reverse items-end gap-1.5">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-[var(--color-green-deep)]">
                  <User className="h-3.5 w-3.5 text-white" strokeWidth={2} />
                </div>
                <div className="max-w-[88%]">
                  <div className="rounded-xl rounded-br-sm bg-[var(--color-green-deep)] px-3 py-2 text-white shadow-sm">
                    <p className="whitespace-pre-wrap text-[13px] leading-snug">{m.content}</p>
                  </div>
                  <p className="mt-1 pr-0.5 text-right text-[10px] leading-tight text-[var(--color-muted)]">
                    {formatMetaTime(m.createdAt)}
                  </p>
                </div>
              </div>
            ),
          )}

          {loading ? <TypingIndicator /> : null}
          <div ref={listEndRef} />
        </div>
      </div>

      {/* Quick replies */}
      <div className="shrink-0 border-t border-[var(--color-border-subtle)] bg-[var(--color-screen)] px-3 py-2 backdrop-blur-sm sm:px-4">
        <p className="mb-1.5 text-[10px] font-medium uppercase tracking-wide text-[var(--color-green-soft)]">Gợi ý nhanh</p>
        <div className="-mx-3 flex gap-1.5 overflow-x-auto px-3 pb-0.5 pt-0.5 scrollbar-none sm:-mx-4 sm:px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {QUICK_REPLIES.map((label) => (
            <button
              key={label}
              type="button"
              disabled={loading}
              onClick={() => void sendText(label)}
              className="shrink-0 rounded-full border border-[var(--color-border-subtle)] bg-white px-2.5 py-1.5 text-[11px] font-medium leading-tight text-[var(--color-interactive-ink)] shadow-sm transition-colors hover:bg-[var(--color-interactive-bg)] disabled:opacity-50"
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Input dock */}
      <div className="shrink-0 border-t border-[var(--color-border-subtle)] bg-white px-3 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] sm:px-4">
        <form
          onSubmit={onSubmit}
          className="flex items-center gap-1.5 rounded-xl border border-[var(--color-border-subtle)] bg-white px-2 py-1.5 shadow-[var(--shadow-soft)]"
        >
          <button
            type="button"
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[var(--color-green-deep)] transition-colors hover:bg-[var(--color-interactive-bg)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)]"
            aria-label="Đọc bằng giọng nói"
            title="Giọng nói (sắp có)"
          >
            <Mic className="h-4 w-4" strokeWidth={2} />
          </button>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Nhập câu hỏi..."
            disabled={loading}
            className="min-w-0 flex-1 border-0 bg-transparent px-1 py-1 text-[13px] leading-snug text-[var(--color-ink)] outline-none placeholder:text-[var(--color-muted)] disabled:opacity-60"
            autoComplete="off"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--color-green-deep)] text-white shadow-sm transition-[filter] hover:brightness-110 disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)]"
            aria-label="Gửi"
          >
            {loading ? (
              <Sparkles className="h-4 w-4 animate-pulse text-[var(--color-soil)]" strokeWidth={2} />
            ) : (
              <Send className="h-4 w-4" strokeWidth={2} />
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
