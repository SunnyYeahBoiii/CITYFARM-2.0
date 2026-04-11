import Link from "next/link";
import type { ReactNode } from "react";

export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <main
      className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(111,150,84,0.16),transparent_28%),radial-gradient(circle_at_84%_12%,rgba(228,168,98,0.18),transparent_20%),linear-gradient(180deg,#eff3eb_0%,#e4ebde_100%)] px-4 py-8"
      suppressHydrationWarning
    >
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-[420px] items-center">
        <section className="w-full rounded-[2rem] border border-[color:rgba(31,41,22,0.08)] bg-white p-6 shadow-[0_20px_46px_rgba(31,41,22,0.14)] sm:p-7">
          {children}
        </section>
      </div>
    </main>
  );
}

export function AuthBrand({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  return (
    <div className="mb-6 text-left">
      <div className="mb-4 flex items-center gap-3">
        <Link
          href="/login"
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[linear-gradient(135deg,#567a3d,#2d4a24)] text-sm font-extrabold tracking-[0.1em] text-[#f8faf6]"
          aria-label="CITYFARM home"
        >
          CF
        </Link>
        <div>
          <p className="text-lg font-extrabold tracking-wide text-[#3a4d28]">CITYFARM</p>
          <p className="text-xs font-medium uppercase tracking-[0.08em] text-[#6f7f63]">Grow clean, live green</p>
        </div>
      </div>
      <h1 className="text-[1.4rem] font-extrabold leading-tight text-[#24301c]">{title}</h1>
      <p className="mt-1 text-sm leading-7 text-[#677562]">{subtitle}</p>
    </div>
  );
}

export function AuthDivider() {
  return (
    <div className="relative my-1 flex items-center py-0.5">
      <div className="flex-1 border-t border-[#1f291612]" />
      <span className="mx-3 text-[10px] font-bold uppercase tracking-widest text-[#677562ad]">OR</span>
      <div className="flex-1 border-t border-[#1f291612]" />
    </div>
  );
}
