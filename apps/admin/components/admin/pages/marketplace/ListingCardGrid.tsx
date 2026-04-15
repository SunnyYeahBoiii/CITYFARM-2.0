"use client";

import Image from "next/image";
import type { MarketplaceListingAdmin } from "./types";
import { StatusBadge } from "@/components/admin/StatusBadge";

function toneForScore(score: number) {
  if (score >= 80) return "success";
  if (score >= 60) return "warning";
  return "danger";
}

export function ListingCardGrid({
  rows,
  selectedId,
  onSelect,
  getScore,
}: {
  rows: MarketplaceListingAdmin[];
  selectedId: string;
  onSelect: (id: string) => void;
  getScore: (row: MarketplaceListingAdmin) => number;
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {rows.map((row) => {
        const active = row.id === selectedId;
        const score = getScore(row);
        return (
          <button
            key={row.id}
            type="button"
            onClick={() => onSelect(row.id)}
            className={`overflow-hidden rounded-[1.65rem] border text-left shadow-[0_16px_30px_rgba(33,49,30,0.07)] transition-transform hover:-translate-y-0.5 ${
              active
                ? "border-[rgba(53,91,49,0.28)] bg-white ring-2 ring-[rgba(53,91,49,0.18)]"
                : "border-[color:rgba(31,41,22,0.08)] bg-white/88"
            }`}
          >
            <div className="relative h-36 w-full bg-[var(--color-screen)]">
              {row.imageUrl ? (
                <Image
                  src={row.imageUrl}
                  alt={row.title}
                  fill
                  sizes="(min-width: 1280px) 330px, (min-width: 768px) 46vw, 92vw"
                  className="object-cover"
                  unoptimized
                />
              ) : null}
              <div className="absolute left-3 top-3 flex gap-2">
                <StatusBadge tone={toneForScore(score)}>{score}</StatusBadge>
                {row.verificationStatus === "PENDING" ? <StatusBadge tone="warning">Pending</StatusBadge> : null}
                {row.quality.flags ? <StatusBadge tone="danger">{row.quality.flags} flags</StatusBadge> : null}
              </div>
            </div>
            <div className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="truncate text-base font-semibold text-[var(--color-heading)]">{row.title}</div>
                  <div className="mt-1 text-sm text-[var(--color-muted)]">
                    {row.seller.name} · {row.pickupDistrict}
                  </div>
                </div>
                <div className="text-right text-sm font-semibold text-[var(--color-heading)]">{row.priceText}</div>
              </div>
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-sm text-[var(--color-muted)]">
                <span className="inline-flex items-center rounded-full bg-[var(--color-screen)] px-3 py-1 text-xs font-semibold">
                  {row.productLabel}
                </span>
                <span className="text-xs uppercase tracking-[0.14em]">{row.expiresAtLabel}</span>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
