import { StatusBadge } from "@/components/admin/StatusBadge";
import type { AdminOrder } from "./types";

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
}

export function SlaWatchPanel({
  overdue,
  onJump,
  formatAmount,
}: {
  overdue: AdminOrder[];
  onJump: (id: string) => void;
  formatAmount: (amount: number) => string;
}) {
  return (
    <article className="rounded-[1.9rem] border border-[color:rgba(31,41,22,0.08)] bg-white/88 p-5 shadow-[0_16px_30px_rgba(33,49,30,0.07)] sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--color-muted)]">SLA watch</div>
          <h2 className="mt-2 text-xl font-semibold text-[var(--color-heading)]">Các đơn cần xử lý ngay</h2>
        </div>
        <StatusBadge tone={overdue.length > 0 ? "warning" : "success"}>{overdue.length > 0 ? `${overdue.length} items` : "Clear"}</StatusBadge>
      </div>

      <div className="mt-4 space-y-3">
        {overdue.length === 0 ? (
          <div className="rounded-[1.4rem] border border-[color:rgba(31,41,22,0.08)] bg-[var(--color-screen)] px-4 py-4 text-sm text-[var(--color-muted)]">
            Không có đơn overdue trong nhóm pending confirmation. Bạn đang ở trạng thái tốt để xử lý pickup và đóng đơn.
          </div>
        ) : null}

        {overdue.map((order) => (
          <button
            key={order.id}
            type="button"
            onClick={() => onJump(order.id)}
            className="w-full rounded-[1.4rem] border border-[color:rgba(31,41,22,0.08)] bg-[var(--color-screen)] px-4 py-4 text-left transition-colors hover:bg-white"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold text-[var(--color-heading)]">{order.code}</div>
                <div className="mt-1 text-sm text-[var(--color-muted)]">{order.buyer.name}</div>
                <div className="mt-2 text-xs text-[var(--color-muted)]">{formatTime(order.createdAt)} • {order.delivery.district ?? "Unknown"}</div>
              </div>
              <div className="shrink-0 text-right">
                <StatusBadge tone="warning">Overdue</StatusBadge>
                <div className="mt-2 text-sm font-semibold text-[var(--color-heading)]">{formatAmount(order.totalAmount)}</div>
              </div>
            </div>
          </button>
        ))}
      </div>

      <div className="mt-5 rounded-[1.4rem] border border-[color:rgba(31,41,22,0.08)] bg-[linear-gradient(145deg,#f3f6ef,#ece4d6)] px-4 py-4">
        <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--color-muted)]">Ops note</div>
        <div className="mt-2 text-sm leading-6 text-[var(--color-muted)]">
          Khi nối API thật, panel này nên lấy từ query “orders pending confirmation vượt SLA” và cho phép bulk assign.
        </div>
      </div>
    </article>
  );
}

