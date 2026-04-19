"use client";

import { useEffect, useMemo, useState } from "react";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { updateAdminOrder } from "@/lib/api/admin-client";
import { OrdersFilters, type OrdersFilterState } from "./OrdersFilters";
import { OrdersTable } from "./OrdersTable";
import { OrderDetailPanel } from "./OrderDetailPanel";
import type { AdminOrder, OrderStatus } from "./types";

function formatVnd(amount: number) {
  return new Intl.NumberFormat("vi-VN").format(amount);
}

function minutesBetween(fromIso: string, to: number) {
  const from = new Date(fromIso).getTime();
  return Math.max(0, Math.round((to - from) / 60000));
}

function matchesQuery(order: AdminOrder, q: string) {
  const query = q.trim().toLowerCase();
  if (!query) return true;
  const hay = [
    order.code,
    order.buyer.name,
    order.buyer.phone,
    order.delivery.district ?? "",
    order.delivery.address ?? "",
    order.lines.map((l) => l.name).join(" "),
  ]
    .join(" ")
    .toLowerCase();
  return hay.includes(query);
}

function isSlaOverdue(order: AdminOrder, nowMs: number) {
  if (order.status !== "PENDING_CONFIRMATION") return false;
  const mins = minutesBetween(order.createdAt, nowMs);
  return mins > 45;
}

function getStatusCounts(orders: AdminOrder[]) {
  const counts: Record<OrderStatus, number> = {
    DRAFT: 0,
    PENDING_CONFIRMATION: 0,
    CONFIRMED: 0,
    READY_FOR_PICKUP: 0,
    COMPLETED: 0,
    CANCELLED: 0,
  };
  for (const order of orders) counts[order.status] += 1;
  return counts;
}

function mapActionToStatus(action: "confirm" | "ready" | "complete" | "cancel"): OrderStatus {
  if (action === "confirm") return "CONFIRMED";
  if (action === "ready") return "READY_FOR_PICKUP";
  if (action === "complete") return "COMPLETED";
  return "CANCELLED";
}

export function OrdersDesk({
  initialOrders,
  initialError,
}: {
  initialOrders: AdminOrder[];
  initialError?: string | null;
}) {
  const [orders, setOrders] = useState<AdminOrder[]>(() => initialOrders);
  const [filters, setFilters] = useState<OrdersFilterState>({
    status: "ALL",
    district: "ALL",
    payment: "ALL",
    query: "",
    compact: true,
    showSlaOnly: false,
  });
  const [selectedOrderId, setSelectedOrderId] = useState<string>(initialOrders[0]?.id ?? "");
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [nowMs, setNowMs] = useState<number>(() => {
    const createdTimes = initialOrders
      .map((o) => new Date(o.createdAt).getTime())
      .filter((t) => Number.isFinite(t));
    return createdTimes.length > 0 ? Math.max(...createdTimes) : 0;
  });
  const [error, setError] = useState<string | null>(initialError ?? null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const timeout = window.setTimeout(() => setNowMs(Date.now()), 0);
    const interval = window.setInterval(() => setNowMs(Date.now()), 60_000);
    return () => {
      window.clearTimeout(timeout);
      window.clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    setOrders(initialOrders);
    setSelectedOrderId((prev) => prev || initialOrders[0]?.id || "");
    setError(initialError ?? null);
  }, [initialError, initialOrders]);

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      if (filters.status !== "ALL" && order.status !== filters.status) return false;
      if (filters.district !== "ALL" && (order.delivery.district ?? "Unknown") !== filters.district) return false;
      if (filters.payment !== "ALL" && order.paymentMethod !== filters.payment) return false;
      if (filters.showSlaOnly && !isSlaOverdue(order, nowMs)) return false;
      return matchesQuery(order, filters.query);
    });
  }, [filters, nowMs, orders]);

  const selectedOrder = filteredOrders.find((o) => o.id === selectedOrderId) ?? filteredOrders[0] ?? null;
  const statusCounts = useMemo(() => getStatusCounts(orders), [orders]);
  const districts = useMemo(() => {
    const unique = new Set<string>();
    for (const order of orders) unique.add(order.delivery.district ?? "Unknown");
    return Array.from(unique).sort((a, b) => a.localeCompare(b));
  }, [orders]);
  const slaOverdueCount = useMemo(() => orders.filter((o) => isSlaOverdue(o, nowMs)).length, [nowMs, orders]);

  return (
    <div className="space-y-4">
      {error ? (
        <section className="rounded-[1.2rem] border border-[rgba(163,69,45,0.18)] bg-[rgba(253,244,241,0.92)] px-4 py-3 text-sm text-[var(--color-danger)] shadow-[0_12px_22px_rgba(163,69,45,0.08)]">
          {error}
        </section>
      ) : null}
      <section className="rounded-[1.2rem] border border-[color:rgba(31,41,22,0.08)] bg-white/88 p-4 shadow-[0_12px_22px_rgba(33,49,30,0.06)]">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge tone="warning">{statusCounts.PENDING_CONFIRMATION} pending</StatusBadge>
          <StatusBadge tone="success">{statusCounts.CONFIRMED} confirmed</StatusBadge>
          <StatusBadge tone="info">{statusCounts.READY_FOR_PICKUP} ready</StatusBadge>
          <StatusBadge tone="neutral">{statusCounts.COMPLETED} completed</StatusBadge>
          <StatusBadge tone="danger">{statusCounts.CANCELLED} cancelled</StatusBadge>
          <span className="ml-auto">
            <StatusBadge tone={slaOverdueCount > 0 ? "warning" : "success"}>
              {slaOverdueCount > 0 ? `${slaOverdueCount} overdue` : "SLA healthy"}
            </StatusBadge>
          </span>
        </div>
      </section>

      <article className="rounded-[1.2rem] border border-[color:rgba(31,41,22,0.08)] bg-white/88 p-4 shadow-[0_12px_22px_rgba(33,49,30,0.06)]">
        <OrdersFilters
          districts={districts}
          value={filters}
          onChange={setFilters}
          topRight={
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className="inline-flex min-h-9 items-center justify-center rounded-full border border-[color:rgba(31,41,22,0.08)] bg-[var(--color-screen)] px-3 text-sm font-semibold text-[var(--color-interactive-ink)]"
              >
                Bulk
              </button>
              <button
                type="button"
                className="inline-flex min-h-9 items-center justify-center rounded-full bg-[linear-gradient(135deg,#79965e,#355b31)] px-3 text-sm font-semibold text-white shadow-[0_12px_20px_rgba(53,91,49,0.18)]"
              >
                Assign
              </button>
            </div>
          }
        />
      </article>

      <section>
        <article className="rounded-[1.2rem] border border-[color:rgba(31,41,22,0.08)] bg-white/88 p-0 shadow-[0_12px_22px_rgba(33,49,30,0.06)]">
          <div className="flex items-center justify-between border-b border-[color:rgba(31,41,22,0.08)] px-4 py-3">
            <div className="text-sm text-[var(--color-muted)]">
              Showing <span className="font-semibold text-[var(--color-heading)]">{filteredOrders.length}</span> orders
            </div>
            <div className="flex items-center gap-2 text-sm">
              <StatusBadge tone={filters.compact ? "info" : "neutral"}>{filters.compact ? "Compact" : "Comfort"}</StatusBadge>
              <StatusBadge tone={filters.showSlaOnly ? "warning" : "neutral"}>{filters.showSlaOnly ? "SLA only" : "All"}</StatusBadge>
            </div>
          </div>
          <OrdersTable
            orders={filteredOrders}
            selectedOrderId={selectedOrder?.id ?? ""}
            compact={filters.compact}
            nowMs={nowMs}
            isSlaOverdue={(order) => isSlaOverdue(order, nowMs)}
            onSelect={(id) => {
              setSelectedOrderId(id);
              setIsDetailOpen(true);
            }}
            formatAmount={(amount) => `₫${formatVnd(amount)}`}
          />
        </article>
      </section>

      <OrderDetailPanel
        open={isDetailOpen}
        order={selectedOrder}
        nowMs={nowMs}
        formatAmount={(amount) => `₫${formatVnd(amount)}`}
        disabled={isSaving}
        onClose={() => setIsDetailOpen(false)}
        onAction={async (action) => {
          if (!selectedOrder) return;
          if (isSaving) return;
          setError(null);
          setIsSaving(true);

          const prev = selectedOrder;
          const nextStatus = mapActionToStatus(action);

          setOrders((cur) => cur.map((o) => (o.id === prev.id ? { ...o, status: nextStatus } : o)));

          try {
            const updated = await updateAdminOrder(prev.id, { status: nextStatus });
            setOrders((cur) => cur.map((o) => (o.id === updated.id ? updated : o)));
          } catch (err) {
            setOrders((cur) => cur.map((o) => (o.id === prev.id ? prev : o)));
            setError(err instanceof Error ? err.message : "Failed to update order.");
          } finally {
            setIsSaving(false);
          }
        }}
      />
    </div>
  );
}
