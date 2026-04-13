"use client";

import { Bot } from "lucide-react";

export function TypingIndicator() {
  return (
    <div className="flex items-end gap-1.5">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-[var(--color-green-deep)]">
        <Bot className="h-3.5 w-3.5 text-white" strokeWidth={2} />
      </div>
      <div className="rounded-xl rounded-bl-sm border border-[var(--color-border-subtle)] bg-white px-3 py-2 shadow-sm">
        <div className="flex items-center gap-1">
          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[var(--color-muted)] [animation-delay:0ms]" />
          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[var(--color-muted)] [animation-delay:120ms]" />
          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[var(--color-muted)] [animation-delay:240ms]" />
        </div>
      </div>
    </div>
  );
}
