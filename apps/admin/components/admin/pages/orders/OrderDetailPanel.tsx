import { useEffect } from "react";
import { createPortal } from "react-dom";
import { StatusBadge } from "@/components/admin/StatusBadge";
import {
  ORDER_STATUS_LABEL,
  PAYMENT_METHOD_LABEL,
  type AdminOrder,
} from "./types";

function formatDateTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
  });
}

function toneForStatus(status: AdminOrder["status"]): "success" | "warning" | "danger" | "neutral" | "info" {
  if (status === "CONFIRMED") return "success";
  if (status === "PENDING_CONFIRMATION") return "warning";
  if (status === "READY_FOR_PICKUP") return "info";
  if (status === "CANCELLED") return "danger";
  if (status === "COMPLETED") return "neutral";
  return "neutral";
}

export function OrderDetailPanel({
  open,
  order,
  nowMs,
  formatAmount,
  disabled,
  onClose,
  onAction,
}: {
  open: boolean;
  order: AdminOrder | null;
  nowMs: number;
  formatAmount: (amount: number) => string;
  disabled?: boolean;
  onClose: () => void;
  onAction: (action: "confirm" | "ready" | "complete" | "cancel") => void;
}) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose, open]);

  if (!open || !order) return null;

  const minutesOld = order ? Math.max(0, Math.round((nowMs - new Date(order.createdAt).getTime()) / 60000)) : 0;
  const isLocked = Boolean(disabled);

  return createPortal(
    (
    <div className="fixed inset-0 z-[90]">
      <button
        type="button"
        aria-label="Close order detail popup"
        className="absolute inset-0 bg-black/28 backdrop-blur-[4px]"
        onClick={onClose}
      />

      <div className="absolute inset-0 flex items-center justify-center p-3 sm:p-4">
        <aside className="flex h-full max-h-[calc(100vh-1.5rem)] w-full max-w-[920px] flex-col rounded-[1.9rem] border border-[color:rgba(31,41,22,0.08)] bg-white/95 shadow-[0_30px_80px_rgba(33,49,30,0.22)] sm:max-h-[calc(100vh-2rem)]">
        <div className="border-b border-[color:rgba(31,41,22,0.08)] px-5 py-4 sm:px-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--color-muted)]">Order detail</div>
            <div className="mt-1 text-sm text-[var(--color-muted)]">Cập nhật trạng thái và xem chi tiết order đã chọn.</div>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge tone={toneForStatus(order.status)}>{ORDER_STATUS_LABEL[order.status]}</StatusBadge>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex min-h-9 items-center justify-center rounded-full border border-[color:rgba(31,41,22,0.08)] bg-white px-3 text-sm font-semibold text-[var(--color-interactive-ink)] transition-colors hover:bg-[var(--color-screen)]"
            >
              Close
            </button>
          </div>
        </div>
      </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6">
          <div className="flex flex-col gap-3 rounded-[1.6rem] border border-[color:rgba(31,41,22,0.08)] bg-[var(--color-screen)] px-4 py-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-lg font-semibold text-[var(--color-heading)]">{order.code}</div>
                <div className="mt-1 text-sm text-[var(--color-muted)]">
                  Created {minutesOld}m ago • {formatDateTime(order.createdAt)}
                </div>
              </div>
              <div className="text-right">
                <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--color-muted)]">Total</div>
                <div className="mt-1 text-xl font-semibold text-[var(--color-heading)]">{formatAmount(order.totalAmount)}</div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <StatusBadge tone="neutral">{PAYMENT_METHOD_LABEL[order.paymentMethod]}</StatusBadge>
              {(order.flags ?? []).map((flag) => (
                <StatusBadge key={flag.id} tone={flag.tone}>
                  {flag.label}
                </StatusBadge>
              ))}
            </div>
          </div>

          <div className="mt-4 grid gap-3">
            <div className="rounded-[1.6rem] border border-[color:rgba(31,41,22,0.08)] bg-white px-4 py-4">
              <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--color-muted)]">Buyer</div>
              <div className="mt-2 text-sm font-semibold text-[var(--color-heading)]">{order.buyer.name}</div>
              <div className="mt-1 text-sm text-[var(--color-muted)]">{order.buyer.phone}</div>
            </div>

            <div className="rounded-[1.6rem] border border-[color:rgba(31,41,22,0.08)] bg-white px-4 py-4">
              <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--color-muted)]">Delivery</div>
              <div className="mt-2 text-sm font-semibold text-[var(--color-heading)]">{order.delivery.district ?? "Unknown"}</div>
              <div className="mt-1 text-sm leading-6 text-[var(--color-muted)]">{order.delivery.address ?? "No address"}</div>
              {order.delivery.note ? <div className="mt-2 text-sm text-[var(--color-muted)]">Note: {order.delivery.note}</div> : null}
            </div>
          </div>

          <div className="mt-4 rounded-[1.9rem] border border-[color:rgba(31,41,22,0.08)] bg-white px-4 py-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--color-muted)]">Line items</div>
                <div className="mt-1 text-sm text-[var(--color-muted)]">{order.lines.length} items</div>
              </div>
              <StatusBadge tone="neutral">{order.currency}</StatusBadge>
            </div>

            <div className="mt-3 space-y-2">
              {order.lines.map((line) => (
                <div key={line.sku} className="flex items-start justify-between gap-3 rounded-[1.2rem] bg-[var(--color-screen)] px-3 py-3">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-[var(--color-heading)]">{line.name}</div>
                    <div className="mt-1 text-xs text-[var(--color-muted)]">
                      {line.sku} • Qty {line.quantity}
                    </div>
                  </div>
                  <div className="text-right text-sm font-semibold text-[var(--color-heading)]">{formatAmount(line.totalPriceAmount)}</div>
                </div>
              ))}
            </div>

            <div className="mt-3 rounded-[1.2rem] bg-[var(--color-screen)] px-3 py-3 text-sm text-[var(--color-muted)]">
              <div className="flex items-center justify-between gap-3">
                <span>Subtotal</span>
                <span className="font-semibold text-[var(--color-heading)]">{formatAmount(order.subtotalAmount)}</span>
              </div>
              <div className="mt-2 flex items-center justify-between gap-3">
                <span>Discount</span>
                <span className="font-semibold text-[var(--color-heading)]">{formatAmount(order.discountAmount)}</span>
              </div>
              <div className="mt-2 flex items-center justify-between gap-3">
                <span>Total</span>
                <span className="font-semibold text-[var(--color-heading)]">{formatAmount(order.totalAmount)}</span>
              </div>
            </div>
          </div>

          <div className="mt-4 rounded-[1.9rem] border border-[color:rgba(31,41,22,0.08)] bg-white px-4 py-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--color-muted)]">Timeline</div>
                <div className="mt-1 text-sm text-[var(--color-muted)]">Event log trong lifecycle của order.</div>
              </div>
              <StatusBadge tone="info">{order.timeline.length} events</StatusBadge>
            </div>

            <div className="mt-4 space-y-4">
              {order.timeline.map((event) => (
                <div key={event.id} className="flex gap-3">
                  <div className="flex w-9 flex-col items-center">
                    <div className="mt-1 h-3 w-3 rounded-full bg-[var(--color-green-deep)]" />
                    <div className="mt-2 h-full w-px bg-[var(--color-line)]" />
                  </div>
                  <div className="pb-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="text-sm font-semibold text-[var(--color-heading)]">{event.title}</div>
                      <StatusBadge tone={event.tone}>{formatDateTime(event.at)}</StatusBadge>
                    </div>
                    <div className="mt-1 text-sm leading-6 text-[var(--color-muted)]">{event.description}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            <button
              type="button"
              disabled={isLocked}
              onClick={() => onAction("confirm")}
              className={`inline-flex min-h-11 items-center justify-center rounded-full bg-[linear-gradient(135deg,#79965e,#355b31)] px-4 text-sm font-semibold text-white shadow-[0_16px_26px_rgba(53,91,49,0.18)] transition-transform hover:-translate-y-0.5 ${
                isLocked ? "cursor-not-allowed opacity-70 hover:translate-y-0" : ""
              }`}
            >
              Confirm
            </button>
            <button
              type="button"
              disabled={isLocked}
              onClick={() => onAction("ready")}
              className={`inline-flex min-h-11 items-center justify-center rounded-full border border-[color:rgba(31,41,22,0.08)] bg-white px-4 text-sm font-semibold text-[var(--color-interactive-ink)] transition-colors hover:bg-[var(--color-screen)] ${
                isLocked ? "cursor-not-allowed opacity-70 hover:bg-white" : ""
              }`}
            >
              Mark ready
            </button>
            <button
              type="button"
              disabled={isLocked}
              onClick={() => onAction("complete")}
              className={`inline-flex min-h-11 items-center justify-center rounded-full border border-[color:rgba(31,41,22,0.08)] bg-[var(--color-screen)] px-4 text-sm font-semibold text-[var(--color-interactive-ink)] transition-colors hover:bg-white ${
                isLocked ? "cursor-not-allowed opacity-70 hover:bg-[var(--color-screen)]" : ""
              }`}
            >
              Complete
            </button>
            <button
              type="button"
              disabled={isLocked}
              onClick={() => onAction("cancel")}
              className={`inline-flex min-h-11 items-center justify-center rounded-full border border-[rgba(163,69,45,0.28)] bg-[rgba(253,244,241,0.7)] px-4 text-sm font-semibold text-[var(--color-danger)] transition-colors hover:bg-[rgba(253,244,241,0.95)] ${
                isLocked ? "cursor-not-allowed opacity-70 hover:bg-[rgba(253,244,241,0.7)]" : ""
              }`}
            >
              Cancel
            </button>
          </div>

          {(order.customerNote || order.internalNote) ? (
            <div className="mt-4 grid gap-3">
              {order.customerNote ? (
                <div className="rounded-[1.6rem] border border-[color:rgba(31,41,22,0.08)] bg-[var(--color-screen)] px-4 py-4">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--color-muted)]">
                    Customer note
                  </div>
                  <div className="mt-2 text-sm leading-6 text-[var(--color-muted)]">{order.customerNote}</div>
                </div>
              ) : null}
              {order.internalNote ? (
                <div className="rounded-[1.6rem] border border-[color:rgba(31,41,22,0.08)] bg-[linear-gradient(145deg,#f3f6ef,#ece4d6)] px-4 py-4">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--color-muted)]">
                    Internal note
                  </div>
                  <div className="mt-2 text-sm leading-6 text-[var(--color-muted)]">{order.internalNote}</div>
                </div>
              ) : null}
            </div>
          ) : null}
          </div>
        </aside>
      </div>
    </div>
    ),
    document.body,
  );
}
