"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "../shared/ui";
import { isActive, tabItems } from "./shell-config";

export function ShellBottomDock() {
  const pathname = usePathname();

  return (
    <nav className="shrink-0 border-t border-[color:rgba(31,41,22,0.08)] bg-white/95 px-2.5 pb-[max(0.65rem,env(safe-area-inset-bottom))] pt-2.5 backdrop-blur-md">
      <div className="grid grid-cols-5 gap-1.5">
        {tabItems.map((item) => {
          const active = isActive(pathname, item.href);
          const Icon = item.Icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex min-h-12 flex-col items-center justify-center gap-0.5 rounded-[1rem] px-1.5 py-1 text-[10px] font-semibold transition-colors",
                active
                  ? "bg-[var(--color-green-deep)] text-white shadow-[0_10px_22px_rgba(53,91,49,0.2)]"
                  : "bg-[var(--color-screen)] text-[var(--color-interactive-ink)]",
              )}
            >
              <Icon />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
