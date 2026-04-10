"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Bot, Leaf, Mic, Send, Settings, Sparkles, User } from "lucide-react";
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
  backHref: string;
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

function formatMetaTime(ts: number): string {
  return new Date(ts).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
}

function makeId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function ChatbotScreen({
  initialContext,
  backHref,
  plantName,
  plantHealth: _plantHealth,
  userGreetingName = "bạn",
}: ChatbotScreenProps) {
  void _plantHealth;
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: makeId(),
      role: "assistant",
      content: WELCOME_MARKDOWN,
      createdAt: Date.now(),
      animateAssistant: false,
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const listEndRef = useRef<HTMLDivElement | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

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
    [initialContext, loading],
  );

  const onSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      void sendText(input);
    },
    [input, sendText],
  );

  return (
    <main className="flex min-h-screen flex-col bg-transparent px-4 text-[var(--color-ink)] sm:px-5">
      <div className="mx-auto flex h-[100dvh] max-h-[100dvh] w-full max-w-[420px] flex-col overflow-hidden border border-[var(--color-border-subtle)] bg-white shadow-[var(--shadow-device)] sm:my-3 sm:max-h-[calc(100dvh-1.5rem)] sm:rounded-2xl">
        {/* Top bar — khớp .screenHeader cityfarm */}
        <header className="shrink-0 border-b border-[var(--color-border-subtle)] bg-white/95 px-4 pb-4 pt-[max(1rem,env(safe-area-inset-top))] backdrop-blur-md sm:px-5 sm:pb-5 sm:pt-[max(1.25rem,env(safe-area-inset-top))]">
          <div className="flex items-center gap-2">
            <Link
              href={backHref}
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--color-interactive-bg)] text-[var(--color-interactive-ink)] transition-colors hover:bg-[var(--color-interactive-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)]"
              aria-label="Quay lại"
            >
              <ArrowLeft className="h-5 w-5" strokeWidth={2} />
            </Link>
            <div className="flex min-w-0 flex-1 items-center gap-2.5">
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-[var(--color-line)] bg-[var(--color-interactive-bg)] text-[var(--color-green-deep)]"
                aria-hidden
              >
                <Leaf className="h-5 w-5" strokeWidth={2} />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-bold tracking-tight text-[var(--color-green-deep)]">
                  CityFarm AI
                </p>
                <p className="truncate text-xs text-[var(--color-muted)]">Trợ lý vườn thông minh</p>
              </div>
            </div>
            <button
              type="button"
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--color-interactive-bg)] text-[var(--color-interactive-ink)] transition-colors hover:bg-[var(--color-interactive-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)]"
              aria-label="Cài đặt"
              title="Cài đặt (sắp có)"
            >
              <Settings className="h-5 w-5" strokeWidth={2} />
            </button>
          </div>

          <div className="mt-4">
            <p className="text-[10px] font-semibold uppercase leading-snug tracking-[0.12em] text-[var(--color-green-soft)]">
              Trợ lý ảo thông minh
            </p>
            <h1 className="mt-1 text-xl font-bold leading-snug text-[var(--color-heading)]">
              Xin chào, {userGreetingName}
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-[var(--color-muted)]">
              {plantName ? (
                <>
                  Đang hỗ trợ bạn với cây{" "}
                  <span className="font-semibold text-[var(--color-green-deep)]">{plantName}</span> trong vườn.
                </>
              ) : (
                "Hỏi về chăm sóc cây, sâu bệnh, đất và nước — tôi sẽ gợi ý theo ngữ cảnh vườn của bạn."
              )}
            </p>
          </div>
        </header>

        {/* Messages */}
        <div
          ref={scrollRef}
          className="min-h-0 flex-1 overflow-y-auto bg-[var(--color-screen)] px-4 py-5 sm:px-5"
        >
          <div className="flex flex-col gap-5">
            {messages.map((m) =>
              m.role === "assistant" ? (
                <div key={m.id} className="flex items-end gap-2">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--color-green-deep)]">
                    <Bot className="h-4 w-4 text-white" strokeWidth={2} />
                  </div>
                  <div className="max-w-[85%]">
                    <div className="rounded-2xl rounded-bl-md border border-[var(--color-border-subtle)] bg-white px-4 py-3.5 shadow-sm">
                      <AssistantMessageBody content={m.content} animate={m.animateAssistant ?? false} />
                    </div>
                    <p className="mt-2 text-[11px] leading-normal text-[var(--color-muted)]">
                      {formatMetaTime(m.createdAt)} • CityFarm AI
                    </p>
                  </div>
                </div>
              ) : (
                <div key={m.id} className="flex flex-row-reverse items-end gap-2">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--color-green-deep)]">
                    <User className="h-4 w-4 text-white" strokeWidth={2} />
                  </div>
                  <div className="max-w-[85%]">
                    <div className="rounded-2xl rounded-br-md bg-[var(--color-green-deep)] px-4 py-3.5 text-white shadow-sm">
                      <p className="whitespace-pre-wrap text-sm leading-relaxed">{m.content}</p>
                    </div>
                    <p className="mt-2 text-right text-[11px] leading-normal text-[var(--color-muted)]">
                      {formatMetaTime(m.createdAt)} • {userGreetingName}
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
        <div className="shrink-0 border-t border-[var(--color-border-subtle)] bg-[var(--color-screen)] px-4 py-3 backdrop-blur-sm sm:px-5">
          <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-0.5 pt-0.5 scrollbar-none sm:-mx-5 sm:px-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {QUICK_REPLIES.map((label) => (
              <button
                key={label}
                type="button"
                disabled={loading}
                onClick={() => void sendText(label)}
                className="shrink-0 rounded-full border border-[var(--color-border-subtle)] bg-white px-3.5 py-2 text-xs font-medium text-[var(--color-interactive-ink)] shadow-sm transition-colors hover:bg-[var(--color-interactive-bg)] disabled:opacity-50"
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Input dock */}
        <div className="shrink-0 border-t border-[var(--color-border-subtle)] bg-white px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-5">
          <form
            onSubmit={onSubmit}
            className="flex items-center gap-2 rounded-2xl border border-[var(--color-border-subtle)] bg-white px-3 py-2 shadow-[var(--shadow-soft)]"
          >
            <button
              type="button"
              className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-[var(--color-green-deep)] transition-colors hover:bg-[var(--color-interactive-bg)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)]"
              aria-label="Đọc bằng giọng nói"
              title="Giọng nói (sắp có)"
            >
              <Mic className="h-5 w-5" strokeWidth={2} />
            </button>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Nhập câu hỏi của bạn..."
              disabled={loading}
              className="min-w-0 flex-1 border-0 bg-transparent px-2 py-2 text-sm text-[var(--color-ink)] outline-none placeholder:text-[var(--color-muted)] disabled:opacity-60"
              autoComplete="off"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--color-green-deep)] text-white shadow-sm transition-[filter] hover:brightness-110 disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)]"
              aria-label="Gửi"
            >
              {loading ? (
                <Sparkles className="h-5 w-5 animate-pulse text-[var(--color-soil)]" strokeWidth={2} />
              ) : (
                <Send className="h-5 w-5" strokeWidth={2} />
              )}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
