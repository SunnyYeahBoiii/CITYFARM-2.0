import Link from "next/link";
import type { ReactNode } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { adminServerFetch } from "@/lib/api/server-fetch";
import { getWebBaseUrl } from "@/lib/api/config";
import {
  BellIcon,
  BrandMark,
  DashboardIcon,
  MarketplaceIcon,
  OrdersIcon,
  PostsIcon,
  SearchIcon,
  UsersIcon,
} from "./icons";

export type AdminSection = "dashboard" | "posts" | "marketplace" | "orders" | "users";

const navItems: Array<{
  id: AdminSection;
  href: string;
  label: string;
  description: string;
  icon: ReactNode;
}> = [
  {
    id: "dashboard",
    href: "/",
    label: "Dashboard",
    description: "Pulse",
    icon: <DashboardIcon />,
  },
  {
    id: "posts",
    href: "/posts",
    label: "Posts",
    description: "Moderation",
    icon: <PostsIcon />,
  },
  {
    id: "marketplace",
    href: "/marketplace",
    label: "Marketplace",
    description: "Listings",
    icon: <MarketplaceIcon />,
  },
  {
    id: "orders",
    href: "/orders",
    label: "Orders",
    description: "Fulfillment",
    icon: <OrdersIcon />,
  },
  {
    id: "users",
    href: "/users",
    label: "Users",
    description: "Roles",
    icon: <UsersIcon />,
  },
] as const;

export function AdminShell({
  active,
  title,
  description,
  children,
  actions,
}: {
  active: AdminSection;
  title: string;
  description: string;
  children: ReactNode;
  actions?: ReactNode;
}) {
  async function logoutAction() {
    "use server";

    try {
      await adminServerFetch("/auth/logout", { method: "POST" });
    } catch {
      // Best effort: continue clearing local session cookies.
    }

    const cookieStore = await cookies();
    cookieStore.delete("access_token");
    cookieStore.delete("refresh_token");

    redirect(`${getWebBaseUrl()}/login`);
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      <div className="flex min-h-screen w-full gap-0">
        <aside className="fixed inset-y-0 left-0 z-30 hidden w-[290px] shrink-0 lg:flex">
          <div className="flex min-h-full w-full flex-col rounded-none border-r border-[color:rgba(31,41,22,0.08)] bg-white/76 p-5 shadow-none backdrop-blur-xl">
            <div className="flex items-center gap-4 rounded-[1.5rem] bg-[var(--color-screen)] px-4 py-4">
              <BrandMark />
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--color-green-soft)]">
                  CITYFARM
                </div>
                <div className="mt-1 text-lg font-semibold text-[var(--color-heading)]">Admin Control</div>
              </div>
            </div>

            <nav className="mt-6 space-y-2">
              {navItems.map((item) => {
                const isActive = item.id === active;
                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    aria-current={isActive ? "page" : undefined}
                    className={`group flex items-center gap-3 rounded-[1.35rem] px-3 py-3 transition-all ${isActive
                      ? "bg-[var(--color-green-deep)] text-white shadow-[0_18px_30px_rgba(53,91,49,0.2)]"
                      : "text-[var(--color-interactive-ink)] hover:bg-[var(--color-screen)]"
                      }`}
                  >
                    <span
                      className={`inline-flex h-11 w-11 items-center justify-center rounded-[1rem] ${isActive
                        ? "bg-white/12 text-white"
                        : "bg-[var(--color-interactive-bg)] text-[var(--color-green-deep)]"
                        }`}
                    >
                      {item.icon}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold">{item.label}</span>
                      <span className={`mt-1 block text-xs ${isActive ? "text-white/70" : "text-[var(--color-muted)]"}`}>
                        {item.description}
                      </span>
                    </span>
                  </Link>
                );
              })}
            </nav>

            <div className="mt-auto rounded-[1.6rem] border border-[color:rgba(31,41,22,0.08)] bg-[linear-gradient(145deg,#f3f6ef,#ebe4d6)] p-4">
              <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--color-green-soft)]">
                Session
              </div>
              <div className="mt-2 text-sm leading-6 text-[var(--color-muted)]">
                Kết thúc phiên làm việc của tài khoản admin hiện tại.
              </div>
              <form action={logoutAction} className="mt-4">
                <button
                  type="submit"
                  className="inline-flex min-h-11 w-full items-center justify-center rounded-full border border-[rgba(163,69,45,0.28)] bg-[rgba(253,244,241,0.7)] px-4 text-sm font-semibold text-[var(--color-danger)] transition-colors hover:bg-[rgba(253,244,241,0.95)]"
                >
                  Đăng xuất
                </button>
              </form>
            </div>
          </div>
        </aside>

        <div className="flex min-h-screen min-w-0 flex-1 flex-col border-y border-r border-[color:rgba(31,41,22,0.08)] bg-[rgba(248,250,247,0.74)] shadow-none backdrop-blur-xl lg:ml-[290px]">
          <header className="sticky top-0 z-20 border-b border-[color:rgba(31,41,22,0.08)] bg-white/76 px-4 py-4 backdrop-blur-xl sm:px-6 lg:px-8">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between xl:flex-1">
                <div className="flex items-center gap-3 lg:hidden">
                  <BrandMark />
                  <div>
                    <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--color-green-soft)]">
                      CITYFARM Admin
                    </div>
                    <div className="text-sm text-[var(--color-muted)]">Operations console</div>
                  </div>
                </div>
                <div className="flex min-h-12 w-full items-center gap-3 rounded-full border border-[color:rgba(31,41,22,0.08)] bg-[var(--color-screen)] px-4 sm:max-w-[420px]">
                  <span className="text-[var(--color-muted)]">
                    <SearchIcon />
                  </span>
                  <input
                    type="search"
                    aria-label="Search across admin modules"
                    placeholder="Search posts, listings, orders, users..."
                    className="w-full bg-transparent text-sm text-[var(--color-heading)] outline-none placeholder:text-[var(--color-muted)]"
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="inline-flex min-h-11 items-center rounded-full border border-[color:rgba(31,41,22,0.08)] bg-[var(--color-screen)] px-4 text-sm font-medium text-[var(--color-muted)]">
                  Wed, 15 Apr 2026
                </div>
                <button
                  type="button"
                  className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[color:rgba(31,41,22,0.08)] bg-[var(--color-screen)] text-[var(--color-interactive-ink)] transition-colors hover:bg-white"
                  aria-label="Notifications"
                >
                  <BellIcon />
                </button>
                <div className="flex min-h-11 items-center gap-3 rounded-full border border-[color:rgba(31,41,22,0.08)] bg-white px-3 py-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--color-interactive-bg)] font-semibold text-[var(--color-green-deep)]">
                    LA
                  </div>
                  <div className="pr-1">
                    <div className="text-sm font-semibold text-[var(--color-heading)]">Lan Anh</div>
                    <div className="text-xs text-[var(--color-muted)]">Ops admin</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 flex gap-2 overflow-x-auto pb-1 lg:hidden">
              {navItems.map((item) => {
                const isActive = item.id === active;
                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    aria-current={isActive ? "page" : undefined}
                    className={`inline-flex min-h-10 shrink-0 items-center gap-2 rounded-full px-4 text-sm font-semibold ${isActive
                      ? "bg-[var(--color-green-deep)] text-white"
                      : "border border-[color:rgba(31,41,22,0.08)] bg-white text-[var(--color-interactive-ink)]"
                      }`}
                  >
                    {item.icon}
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </header>

          <main className="flex-1 px-4 py-5 sm:px-6 lg:px-8 lg:py-7">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
              <div className="max-w-3xl">
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--color-green-soft)]">
                  Admin workspace
                </div>
                <h1 className="mt-2 text-3xl font-semibold tracking-[-0.03em] text-[var(--color-heading)] sm:text-[2.6rem]">
                  {title}
                </h1>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--color-muted)] sm:text-base">
                  {description}
                </p>
              </div>
              {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
            </div>

            <div className="mt-6">{children}</div>
          </main>
        </div>
      </div>
    </div>
  );
}
