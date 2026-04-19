"use client";

import type { ReactNode } from "react";
import { StyledSelect } from "@/components/admin/StyledSelect";
import type { PaymentMethod, OrderStatus } from "./types";

export type OrdersFilterState = {
  status: OrderStatus | "ALL";
  district: string | "ALL";
  payment: PaymentMethod | "ALL";
  query: string;
  compact: boolean;
  showSlaOnly: boolean;
};

export function OrdersFilters({
  value,
  onChange,
  districts,
  topRight,
}: {
  value: OrdersFilterState;
  onChange: (next: OrdersFilterState) => void;
  districts: string[];
  topRight?: ReactNode;
}) {
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--color-muted)]">Filters</div>
          <div className="mt-1 text-sm text-[var(--color-muted)]">Search và filter để giảm ma sát khi xử lý fulfillment.</div>
        </div>
        {topRight ? <div className="flex justify-start sm:justify-end">{topRight}</div> : null}
      </div>

      <div className="grid gap-3 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.9fr)_minmax(0,0.9fr)_minmax(0,0.8fr)]">
        <label className="rounded-[1.35rem] border border-[color:rgba(31,41,22,0.08)] bg-[var(--color-screen)] px-4 py-3">
          <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--color-muted)]">Query</div>
          <input
            value={value.query}
            onChange={(e) => onChange({ ...value, query: e.target.value })}
            placeholder="order code, buyer, phone, address, item..."
            className="mt-2 w-full bg-transparent text-sm text-[var(--color-heading)] outline-none placeholder:text-[var(--color-muted)]"
          />
        </label>

        <label className="rounded-[1.35rem] border border-[color:rgba(31,41,22,0.08)] bg-[var(--color-screen)] px-4 py-3">
          <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--color-muted)]">District</div>
          <div className="mt-2">
            <StyledSelect
              value={value.district}
              onChange={(e) => onChange({ ...value, district: e.target.value })}
              aria-label="Filter orders by district"
              options={[{ value: "ALL", label: "All" }, ...districts.map((d) => ({ value: d, label: d }))]}
            />
          </div>
        </label>

        <label className="rounded-[1.35rem] border border-[color:rgba(31,41,22,0.08)] bg-[var(--color-screen)] px-4 py-3">
          <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--color-muted)]">Payment</div>
          <div className="mt-2">
            <StyledSelect
              value={value.payment}
              onChange={(e) => onChange({ ...value, payment: e.target.value as OrdersFilterState["payment"] })}
              aria-label="Filter orders by payment method"
              options={[
                { value: "ALL", label: "All" },
                { value: "CASH_ON_PICKUP", label: "Cash on pickup" },
                { value: "CASH_ON_DELIVERY", label: "Cash on delivery" },
                { value: "UNPAID", label: "Unpaid" },
              ]}
            />
          </div>
        </label>

        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
          <button
            type="button"
            onClick={() => onChange({ ...value, compact: !value.compact })}
            className="inline-flex min-h-11 items-center justify-center rounded-full border border-[color:rgba(31,41,22,0.08)] bg-white px-4 text-sm font-semibold text-[var(--color-interactive-ink)] transition-colors hover:bg-[var(--color-screen)]"
          >
            {value.compact ? "Comfortable rows" : "Compact rows"}
          </button>
          <button
            type="button"
            onClick={() => onChange({ ...value, showSlaOnly: !value.showSlaOnly })}
            className={`inline-flex min-h-11 items-center justify-center rounded-full px-4 text-sm font-semibold transition-colors ${
              value.showSlaOnly
                ? "bg-[linear-gradient(135deg,#cd924a,#9c6a2f)] text-white shadow-[0_16px_26px_rgba(205,146,74,0.22)]"
                : "border border-[color:rgba(31,41,22,0.08)] bg-white text-[var(--color-interactive-ink)] hover:bg-[var(--color-screen)]"
            }`}
          >
            {value.showSlaOnly ? "Showing SLA only" : "Show SLA only"}
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {[
          { id: "ALL", label: "All statuses" },
          { id: "PENDING_CONFIRMATION", label: "Pending confirmation" },
          { id: "CONFIRMED", label: "Confirmed" },
          { id: "READY_FOR_PICKUP", label: "Ready for pickup" },
          { id: "COMPLETED", label: "Completed" },
          { id: "CANCELLED", label: "Cancelled" },
        ].map((chip) => {
          const active = value.status === chip.id;
          return (
            <button
              key={chip.id}
              type="button"
              onClick={() => onChange({ ...value, status: chip.id as OrdersFilterState["status"] })}
              className={`inline-flex min-h-10 items-center justify-center rounded-full px-4 text-sm font-semibold transition-all ${
                active
                  ? "bg-[var(--color-green-deep)] text-white shadow-[0_14px_26px_rgba(53,91,49,0.18)]"
                  : "border border-[color:rgba(31,41,22,0.08)] bg-white text-[var(--color-interactive-ink)] hover:bg-[var(--color-screen)]"
              }`}
            >
              {chip.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

