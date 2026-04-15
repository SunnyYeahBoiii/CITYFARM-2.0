import type { ReactNode } from "react";

const toneClasses = {
  success: "bg-emerald-50 text-emerald-700 ring-emerald-100",
  warning: "bg-amber-50 text-amber-700 ring-amber-100",
  danger: "bg-rose-50 text-rose-700 ring-rose-100",
  neutral: "bg-stone-100 text-stone-700 ring-stone-200",
  info: "bg-sky-50 text-sky-700 ring-sky-100",
} as const;

export function StatusBadge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: keyof typeof toneClasses;
}) {
  return (
    <span
      className={`inline-flex min-h-8 items-center rounded-full px-3 py-1 text-xs font-semibold ring-1 ${toneClasses[tone]}`}
    >
      {children}
    </span>
  );
}
