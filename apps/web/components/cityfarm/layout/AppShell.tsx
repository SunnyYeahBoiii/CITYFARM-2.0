import type { ReactNode } from "react";
import { ShellChrome } from "./ShellChrome";

function MobileFrame({
  children,
  variant,
}: {
  children: ReactNode;
  variant: "tabs" | "detail";
}) {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(111,150,84,0.14),transparent_24%),radial-gradient(circle_at_88%_16%,rgba(228,168,98,0.16),transparent_18%),linear-gradient(180deg,#eff3eb_0%,#e4ebde_100%)] px-4">
      <div className="mx-auto flex min-h-screen w-full max-w-[420px] flex-col bg-white shadow-[var(--shadow-device)]">
        <ShellChrome variant={variant} />
        <main className="min-h-0 flex-1 bg-[var(--color-screen)]">{children}</main>
      </div>
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  return <MobileFrame variant="tabs">{children}</MobileFrame>;
}

export function DetailShell({ children }: { children: ReactNode }) {
  return <MobileFrame variant="detail">{children}</MobileFrame>;
}
