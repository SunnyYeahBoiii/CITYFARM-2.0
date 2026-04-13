import type { ReactNode } from "react";
import { ShellBottomDock } from "./ShellBottomDock";
import { ShellTopBar } from "./ShellTopBar";
import type { ShellVariant } from "./shell-config";

function MobileFrame({
  children,
  variant,
  showBottomDock = true,
}: {
  children: ReactNode;
  variant: ShellVariant;
  showBottomDock?: boolean;
}) {
  return (
    <div className="min-h-[100dvh] bg-[radial-gradient(circle_at_top_left,rgba(111,150,84,0.14),transparent_24%),radial-gradient(circle_at_88%_16%,rgba(228,168,98,0.16),transparent_18%),linear-gradient(180deg,#eff3eb_0%,#e4ebde_100%)] px-4">
      <div className="mx-auto flex h-[100dvh] w-full max-w-[420px] flex-col overflow-hidden bg-white shadow-[var(--shadow-device)]">
        <ShellTopBar variant={variant} />
        <main
          className={`min-h-0 flex-1 bg-[var(--color-screen)] ${
            showBottomDock ? "overflow-y-auto" : "overflow-hidden"
          }`}
        >
          {children}
        </main>
        {showBottomDock ? <ShellBottomDock /> : null}
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

export function ChatbotShell({ children }: { children: ReactNode }) {
  return (
    <MobileFrame variant="chat" showBottomDock={false}>
      {children}
    </MobileFrame>
  );
}
