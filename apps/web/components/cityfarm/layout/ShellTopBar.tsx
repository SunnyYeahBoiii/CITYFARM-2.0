"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { ArrowLeftIcon } from "../shared/icons";
import { resolveHeader, type ShellVariant } from "./shell-config";

export function ShellTopBar({ variant }: { variant: ShellVariant }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const header = resolveHeader(pathname, variant, {
    chatPlantId: searchParams.get("plantId"),
  });
  const variantLabel = variant === "detail" ? "Detail" : variant === "chat" ? "Chat" : "Tabs";
  const isChatbot = pathname.startsWith("/chatbot");

  const backButton = header.backHref ? (
    <Link
      href={header.backHref}
      className={`inline-flex shrink-0 items-center justify-center rounded-full bg-[var(--color-interactive-bg)] text-[var(--color-interactive-ink)] transition-colors hover:bg-[var(--color-interactive-hover)] ${
        isChatbot ? "h-8 w-8" : "h-9 w-9"
      }`}
      aria-label="Go back"
    >
      <ArrowLeftIcon />
    </Link>
  ) : (
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[0.9rem] bg-[linear-gradient(135deg,#567a3d,#2d4a24)] text-[11px] font-black tracking-[0.16em] text-white">
      CF
    </div>
  );

  if (isChatbot) {
    return (
      <header className="shrink-0 border-b border-[color:rgba(31,41,22,0.08)] bg-white/95 px-3 pb-2 pt-[max(0.5rem,env(safe-area-inset-top))] backdrop-blur-md">
        <div className="flex items-center gap-2">
          {backButton}
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-[15px] font-bold leading-tight text-[var(--color-heading)]">{header.title}</h1>
            <p className="mt-0.5 line-clamp-2 text-[11px] leading-snug text-[var(--color-muted)]">{header.subtitle}</p>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="shrink-0 border-b border-[color:rgba(31,41,22,0.08)] bg-white/95 px-4 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))] backdrop-blur-md">
      <div className="flex items-start gap-2.5">
        {backButton}
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-3">
            <p className="truncate text-[9px] font-semibold uppercase tracking-[0.14em] text-[var(--color-green-soft)]">
              CITYFARM
            </p>
            <span className="shrink-0 rounded-full bg-[var(--color-screen)] px-2 py-0.5 text-[10px] font-semibold text-[var(--color-muted)]">
              {variantLabel}
            </span>
          </div>
          <h1 className="mt-0.5 truncate text-lg font-extrabold leading-tight text-[var(--color-heading)]">{header.title}</h1>
          <p className="mt-0.5 line-clamp-1 text-xs leading-5 text-[var(--color-muted)]">
            {header.subtitle}
          </p>
        </div>
      </div>
    </header>
  );
}
