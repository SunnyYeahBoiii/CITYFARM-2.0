"use client";

import type { OrderStatus } from "./types";

export function OrdersStatusPipeline({
  counts,
  onPickStatus,
}: {
  counts: Array<{
    status: OrderStatus;
    label: string;
    count: number;
    tone: "success" | "warning" | "danger" | "neutral" | "info";
  }>;
  onPickStatus: (status: OrderStatus) => void;
}) {
  const max = Math.max(1, ...counts.map((c) => c.count));

  return (
    <div className="rounded-[1.6rem] border border-[color:rgba(31,41,22,0.08)] bg-[linear-gradient(145deg,#f3f6ef,#ece4d6)] p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--color-muted)]">Pipeline</div>
          <div className="mt-1 text-sm font-semibold text-[var(--color-heading)]">Queue health theo trạng thái</div>
        </div>
        <div className="text-sm text-[var(--color-muted)]">Nhấn để lọc nhanh</div>
      </div>

      <div className="mt-4 space-y-3">
        {counts.map((item) => {
          const width = `${Math.round((item.count / max) * 100)}%`;
          return (
            <button
              key={item.status}
              type="button"
              onClick={() => onPickStatus(item.status)}
              className="w-full rounded-[1.25rem] bg-white/70 px-4 py-3 text-left transition-colors hover:bg-white"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm font-semibold text-[var(--color-heading)]">{item.label}</div>
                <div className="text-sm font-semibold text-[var(--color-heading)]">{item.count}</div>
              </div>
              <div className="mt-2 h-2.5 rounded-full bg-[var(--color-screen)]">
                <div
                  className="h-2.5 rounded-full bg-[linear-gradient(135deg,#79965e,#355b31)]"
                  style={{ width }}
                />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

