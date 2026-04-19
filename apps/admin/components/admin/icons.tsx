import type { ReactNode } from "react";

function IconFrame({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      aria-hidden="true"
      className={className ?? "inline-flex h-5 w-5 items-center justify-center text-current"}
    >
      {children}
    </span>
  );
}

export function BrandMark() {
  return (
    <IconFrame className="inline-flex h-11 w-11 items-center justify-center rounded-[1rem] bg-[linear-gradient(135deg,#567a3d,#2d4a24)] text-white shadow-[0_14px_28px_rgba(53,91,49,0.22)]">
      <svg viewBox="0 0 24 24" className="h-6 w-6 fill-none stroke-current" strokeWidth="1.9">
        <path d="M12 20V9" strokeLinecap="round" />
        <path d="M12 11c-3.5 0-6-2.4-6.5-6 3.7 0 6.5 2.4 6.5 6Z" strokeLinejoin="round" />
        <path d="M12 14c3.5 0 6-2.4 6.5-6-3.7 0-6.5 2.4-6.5 6Z" strokeLinejoin="round" />
      </svg>
    </IconFrame>
  );
}

export function DashboardIcon() {
  return (
    <IconFrame>
      <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current" strokeWidth="1.8">
        <rect x="3.5" y="3.5" width="7" height="7" rx="2" />
        <rect x="13.5" y="3.5" width="7" height="4.5" rx="2" />
        <rect x="13.5" y="10.5" width="7" height="10" rx="2" />
        <rect x="3.5" y="13.5" width="7" height="7" rx="2" />
      </svg>
    </IconFrame>
  );
}

export function PostsIcon() {
  return (
    <IconFrame>
      <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current" strokeWidth="1.8">
        <rect x="4" y="4" width="16" height="16" rx="3" />
        <path d="M8 9h8M8 12h8M8 15h5" strokeLinecap="round" />
      </svg>
    </IconFrame>
  );
}

export function MarketplaceIcon() {
  return (
    <IconFrame>
      <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current" strokeWidth="1.8">
        <path d="M5 9h14l-1.2 9.1a2 2 0 0 1-2 1.7H8.2a2 2 0 0 1-2-1.7L5 9Z" />
        <path d="M7.5 9V7.8A4.5 4.5 0 0 1 12 3.5a4.5 4.5 0 0 1 4.5 4.3V9" />
      </svg>
    </IconFrame>
  );
}

export function OrdersIcon() {
  return (
    <IconFrame>
      <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current" strokeWidth="1.8">
        <path d="M7 4.5h10" strokeLinecap="round" />
        <rect x="5" y="6.5" width="14" height="13" rx="3" />
        <path d="M9 11h6M9 14h4" strokeLinecap="round" />
      </svg>
    </IconFrame>
  );
}

export function UsersIcon() {
  return (
    <IconFrame>
      <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current" strokeWidth="1.8">
        <path d="M14.5 7.8a2.8 2.8 0 1 1 5.6 0 2.8 2.8 0 0 1-5.6 0Z" />
        <path d="M3.9 8.8a3.6 3.6 0 1 1 7.2 0 3.6 3.6 0 0 1-7.2 0Z" />
        <path d="M2.8 19.2a5.8 5.8 0 0 1 9.4-3.8" strokeLinecap="round" />
        <path d="M13.9 18.6a4.7 4.7 0 0 1 7.3-2.2" strokeLinecap="round" />
      </svg>
    </IconFrame>
  );
}

export function SettingsIcon() {
  return (
    <IconFrame>
      <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current" strokeWidth="1.8">
        <path d="M12 8.1A3.9 3.9 0 1 0 12 16a3.9 3.9 0 0 0 0-7.8Z" />
        <path d="M19.1 13.6a1.1 1.1 0 0 0 .2 1.2l.1.1a1.5 1.5 0 1 1-2.1 2.1l-.1-.1a1.1 1.1 0 0 0-1.2-.2 1.1 1.1 0 0 0-.7 1V18a1.5 1.5 0 0 1-3 0v-.2a1.1 1.1 0 0 0-.7-1 1.1 1.1 0 0 0-1.2.2l-.1.1a1.5 1.5 0 0 1-2.1-2.1l.1-.1a1.1 1.1 0 0 0 .2-1.2 1.1 1.1 0 0 0-1-.7H6a1.5 1.5 0 0 1 0-3h.2a1.1 1.1 0 0 0 1-.7 1.1 1.1 0 0 0-.2-1.2l-.1-.1a1.5 1.5 0 0 1 2.1-2.1l.1.1a1.1 1.1 0 0 0 1.2.2h.1a1.1 1.1 0 0 0 .6-1V6a1.5 1.5 0 0 1 3 0v.2a1.1 1.1 0 0 0 .7 1 1.1 1.1 0 0 0 1.2-.2l.1-.1a1.5 1.5 0 0 1 2.1 2.1l-.1.1a1.1 1.1 0 0 0-.2 1.2v.1a1.1 1.1 0 0 0 1 .6h.2a1.5 1.5 0 0 1 0 3H20a1.1 1.1 0 0 0-.9.6Z" />
      </svg>
    </IconFrame>
  );
}

export function SearchIcon() {
  return (
    <IconFrame>
      <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current" strokeWidth="1.8">
        <circle cx="11" cy="11" r="6" />
        <path d="m20 20-4.2-4.2" strokeLinecap="round" />
      </svg>
    </IconFrame>
  );
}

export function BellIcon() {
  return (
    <IconFrame>
      <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current" strokeWidth="1.8">
        <path d="M6.7 15.9h10.6a1 1 0 0 0 .8-1.6l-1-1.3V10a5.1 5.1 0 0 0-10.2 0v3l-1 1.3a1 1 0 0 0 .8 1.6Z" />
        <path d="M10 18.5a2.3 2.3 0 0 0 4 0" strokeLinecap="round" />
      </svg>
    </IconFrame>
  );
}
