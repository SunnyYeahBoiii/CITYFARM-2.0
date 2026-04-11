"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Components } from "react-markdown";

const mdComponents: Components = {
  p: ({ children }) => (
    <p className="mb-2 text-sm leading-relaxed text-[var(--color-ink)] last:mb-0">{children}</p>
  ),
  ul: ({ children }) => (
    <ul className="mb-2 list-disc space-y-1 pl-4 text-sm text-[var(--color-ink)] last:mb-0">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="mb-2 list-decimal space-y-1 pl-4 text-sm text-[var(--color-ink)] last:mb-0">{children}</ol>
  ),
  li: ({ children }) => <li className="leading-relaxed">{children}</li>,
  strong: ({ children }) => (
    <strong className="font-semibold text-[var(--color-green-deep)]">{children}</strong>
  ),
  em: ({ children }) => <em className="italic text-[var(--color-ink)]">{children}</em>,
  a: ({ href, children }) => (
    <a
      href={href}
      target="_blank"
      rel="noreferrer noopener"
      className="font-medium text-[var(--color-green-deep)] underline decoration-[var(--color-line)] underline-offset-2 hover:decoration-[var(--color-green-deep)]"
    >
      {children}
    </a>
  ),
  code: ({ children, className }) => {
    const isBlock = Boolean(className);
    if (isBlock) {
      return (
        <code className="my-2 block overflow-x-auto rounded-lg bg-[var(--color-interactive-bg)] px-2 py-1.5 font-mono text-xs text-[var(--color-ink)]">
          {children}
        </code>
      );
    }
    return (
      <code className="rounded bg-[var(--color-interactive-bg)] px-1 py-px font-mono text-xs text-[var(--color-ink)]">
        {children}
      </code>
    );
  },
  h1: ({ children }) => (
    <h3 className="mb-2 text-base font-bold text-[var(--color-heading)]">{children}</h3>
  ),
  h2: ({ children }) => (
    <h4 className="mb-2 text-sm font-bold text-[var(--color-green-deep)]">{children}</h4>
  ),
  h3: ({ children }) => (
    <h4 className="mb-1 text-sm font-semibold text-[var(--color-green-deep)]">{children}</h4>
  ),
  blockquote: ({ children }) => (
    <blockquote className="mb-2 border-l-2 border-[var(--color-line)] pl-3 text-sm text-[var(--color-muted)]">
      {children}
    </blockquote>
  ),
  hr: () => <hr className="my-3 border-[var(--color-border-subtle)]" />,
};

export function ChatMarkdown({ children }: { children: string }) {
  return (
    <div className="chat-md text-left">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>
        {children}
      </ReactMarkdown>
    </div>
  );
}
