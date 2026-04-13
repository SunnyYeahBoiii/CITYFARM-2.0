"use client";

import { ChatMarkdown } from "./chat-markdown";
import { useTypewriter } from "./use-typewriter";

export function AssistantMessageBody({
  content,
  animate,
}: {
  content: string;
  animate: boolean;
}) {
  const { visible, complete } = useTypewriter(content, { active: animate });

  if (!animate || complete) {
    return <ChatMarkdown>{content}</ChatMarkdown>;
  }

  return (
    <div className="text-[13px] leading-snug text-[var(--color-ink)]">
      <span className="whitespace-pre-wrap">{visible}</span>
      <span
        className="ml-0.5 inline-block h-4 w-px translate-y-0.5 animate-pulse bg-[var(--color-green-deep)]"
        aria-hidden
      />
    </div>
  );
}
