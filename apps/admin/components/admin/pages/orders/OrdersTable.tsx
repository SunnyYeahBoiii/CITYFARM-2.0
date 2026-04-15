"use client";

import { StatusBadge } from "@/components/admin/StatusBadge";
import {
  ORDER_STATUS_LABEL,
  PAYMENT_METHOD_LABEL,
  type AdminOrder,
} from "./types";

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
}

function minutesBetween(fromIso: string, to: number) {
  const from = new Date(fromIso).getTime();
  return Math.max(0, Math.round((to - from) / 60000));
}

function toneForStatus(status: AdminOrder["status"]): "success" | "warning" | "danger" | "neutral" | "info" {
  if (status === "CONFIRMED") return "success";
  if (status === "PENDING_CONFIRMATION") return "warning";
  if (status === "READY_FOR_PICKUP") return "info";
  if (status === "CANCELLED") return "danger";
  if (status === "COMPLETED") return "neutral";
  return "neutral";
}

export function OrdersTable({
  orders,
  selectedOrderId,
  compact,
  nowMs,
  isSlaOverdue,
  onSelect,
  formatAmount,
}: {
  orders: AdminOrder[];
  selectedOrderId: string;
  compact: boolean;
  nowMs: number;
  isSlaOverdue: (order: AdminOrder) => boolean;
  onSelect: (id: string) => void;
  formatAmount: (amount: number) => string;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border-separate border-spacing-y-2.5">
        <thead>
          <tr className="text-left text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--color-muted)]">
            <th className="px-5 py-2 sm:px-6">Order</th>
            <th className="px-5 py-2 sm:px-6">Buyer</th>
            <th className="px-5 py-2 sm:px-6">Delivery</th>
            <th className="px-5 py-2 sm:px-6">Items</th>
            <th className="px-5 py-2 sm:px-6">Payment</th>
            <th className="px-5 py-2 sm:px-6">Amount</th>
            <th className="px-5 py-2 sm:px-6">Status</th>
            <th className="px-5 py-2 sm:px-6">SLA</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => {
            const selected = order.id === selectedOrderId;
            const rowTone = selected ? "bg-white" : "bg-[var(--color-screen)]";
            const paddingY = compact ? "py-3" : "py-4";
            const overdue = isSlaOverdue(order);
            const ageMin = minutesBetween(order.createdAt, nowMs);
            return (
              <tr key={order.id} className={`${rowTone} text-sm text-[var(--color-heading)]`}>
                <td className={`rounded-l-[1.25rem] px-5 ${paddingY} sm:px-6`}>
                  <button
                    type="button"
                    onClick={() => onSelect(order.id)}
                    className="group block w-full text-left"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border ${
                          overdue
                            ? "border-amber-200 bg-amber-50 text-amber-700"
                            : "border-[color:rgba(31,41,22,0.08)] bg-white text-[var(--color-green-deep)]"
                        }`}
                        aria-hidden="true"
                      >
                        #
                      </span>
                      <div className="min-w-0">
                        <div className="truncate font-semibold text-[var(--color-heading)] group-hover:underline">{order.code}</div>
                        <div className="mt-1 text-xs text-[var(--color-muted)]">
                          {formatTime(order.createdAt)} • {ageMin}m ago
                        </div>
                      </div>
                    </div>
                  </button>
                </td>
                <td className={`px-5 ${paddingY} text-[var(--color-muted)] sm:px-6`}>
                  <div className="font-semibold text-[var(--color-heading)]">{order.buyer.name}</div>
                  <div className="mt-1 text-xs text-[var(--color-muted)]">{order.buyer.phone}</div>
                </td>
                <td className={`px-5 ${paddingY} text-[var(--color-muted)] sm:px-6`}>
                  <div className="font-semibold text-[var(--color-heading)]">{order.delivery.district ?? "Unknown"}</div>
                  <div className="mt-1 line-clamp-2 text-xs text-[var(--color-muted)]">{order.delivery.address ?? "No address"}</div>
                </td>
                <td className={`px-5 ${paddingY} text-[var(--color-muted)] sm:px-6`}>
                  <div className="font-semibold text-[var(--color-heading)]">{order.lines.length} line(s)</div>
                  <div className="mt-1 line-clamp-2 text-xs text-[var(--color-muted)]">{order.lines.map((l) => l.name).join(" • ")}</div>
                </td>
                <td className={`px-5 ${paddingY} text-[var(--color-muted)] sm:px-6`}>
                  <div className="font-semibold text-[var(--color-heading)]">{PAYMENT_METHOD_LABEL[order.paymentMethod]}</div>
                  <div className="mt-1 text-xs text-[var(--color-muted)]">{order.currency}</div>
                </td>
                <td className={`px-5 ${paddingY} font-semibold text-[var(--color-heading)] sm:px-6`}>
                  {formatAmount(order.totalAmount)}
                </td>
                <td className={`px-5 ${paddingY} sm:px-6`}>
                  <StatusBadge tone={toneForStatus(order.status)}>{ORDER_STATUS_LABEL[order.status]}</StatusBadge>
                </td>
                <td className={`rounded-r-[1.25rem] px-5 ${paddingY} sm:px-6`}>
                  {overdue ? <StatusBadge tone="warning">Overdue</StatusBadge> : <StatusBadge tone="neutral">OK</StatusBadge>}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {orders.length === 0 ? (
        <div className="px-6 pb-8 pt-6 text-sm text-[var(--color-muted)]">
          No orders match the current filters.
        </div>
      ) : null}
    </div>
  );
}

