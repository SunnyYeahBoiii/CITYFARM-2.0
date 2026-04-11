"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeftIcon, BagIcon, CameraIcon, HomeIcon, SproutIcon, UsersIcon } from "../shared/icons";
import { cn } from "../shared/ui";

type ShellVariant = "tabs" | "detail";

type HeaderConfig = {
  title: string;
  subtitle: string;
  backHref?: string;
};

const tabItems = [
  { href: "/home", label: "Home", icon: <HomeIcon /> },
  { href: "/order", label: "Shop", icon: <BagIcon /> },
  { href: "/scan", label: "Scan", icon: <CameraIcon /> },
  { href: "/garden", label: "Garden", icon: <SproutIcon /> },
  { href: "/community", label: "Social", icon: <UsersIcon /> },
] as const;

function resolveHeader(pathname: string, variant: ShellVariant): HeaderConfig {
  if (pathname.startsWith("/garden/")) {
    return {
      title: variant === "detail" ? "Plant Detail" : "My Garden",
      subtitle: variant === "detail" ? "Track growth, care, and journal updates." : "Track care, harvest pace, and active kits.",
      backHref: "/garden",
    };
  }

  if (pathname.startsWith("/community/shared/")) {
    return {
      title: "Shared Plant",
      subtitle: "Inspect the shared plant history in a read-only view.",
      backHref: "/community",
    };
  }

  if (pathname.startsWith("/garden")) {
    return {
      title: "My Garden",
      subtitle: "Track care, harvest pace, and active kits.",
    };
  }

  if (pathname.startsWith("/community")) {
    return {
      title: "Community",
      subtitle: "Social feed and fresh market in one place.",
    };
  }

  if (pathname.startsWith("/order")) {
    return {
      title: "Shop",
      subtitle: "Starter kits, seeds, soil, and recycled pots.",
    };
  }

  if (pathname.startsWith("/scan")) {
    return {
      title: "Scan Your Space",
      subtitle: "Capture, analyze, recommend, and visualize.",
    };
  }

  return {
    title: "CITYFARM",
    subtitle: "Grow clean, live green from any urban corner.",
  };
}

function isActive(pathname: string, href: string) {
  if (href === "/home") {
    return pathname === "/home";
  }

  if (href === "/scan") {
    return pathname === "/scan";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function ShellChrome({ variant }: { variant: ShellVariant }) {
  const pathname = usePathname();
  const header = resolveHeader(pathname, variant);

  return (
    <>
      <header className="sticky top-0 z-20 border-b border-[color:rgba(31,41,22,0.08)] bg-white/95 px-5 pb-4 pt-[max(1rem,env(safe-area-inset-top))] backdrop-blur-md">
        <div className="flex items-start gap-3">
          {header.backHref ? (
            <Link
              href={header.backHref}
              className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--color-interactive-bg)] text-[var(--color-interactive-ink)] transition-colors hover:bg-[var(--color-interactive-hover)]"
              aria-label="Go back"
            >
              <ArrowLeftIcon />
            </Link>
          ) : (
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[1rem] bg-[linear-gradient(135deg,#567a3d,#2d4a24)] text-sm font-black tracking-[0.18em] text-white">
              CF
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--color-green-soft)]">
              Mobile App Shell
            </p>
            <h1 className="mt-1 truncate text-xl font-extrabold text-[var(--color-heading)]">{header.title}</h1>
            <p className="mt-1 text-sm leading-relaxed text-[var(--color-muted)]">{header.subtitle}</p>
          </div>
        </div>
      </header>

      <nav className="sticky bottom-0 z-20 border-t border-[color:rgba(31,41,22,0.08)] bg-white/95 px-3 pb-[max(0.9rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur-md">
        <div className="grid grid-cols-5 gap-2">
          {tabItems.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex min-h-14 flex-col items-center justify-center gap-1 rounded-[1.2rem] px-2 text-[11px] font-semibold transition-colors",
                  active
                    ? "bg-[var(--color-green-deep)] text-white shadow-[0_14px_30px_rgba(53,91,49,0.24)]"
                    : "bg-[var(--color-screen)] text-[var(--color-interactive-ink)]",
                )}
              >
                {item.icon}
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
