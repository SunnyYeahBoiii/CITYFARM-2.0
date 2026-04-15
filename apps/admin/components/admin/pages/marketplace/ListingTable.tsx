"use client";

import Image from "next/image";
import type { MarketplaceListingAdmin } from "./types";
import { StatusBadge } from "@/components/admin/StatusBadge";

function BadgeVerification({ value }: { value: MarketplaceListingAdmin["verificationStatus"] }) {
  if (value === "VERIFIED") return <StatusBadge tone="success">Verified</StatusBadge>;
  if (value === "PENDING") return <StatusBadge tone="warning">Pending</StatusBadge>;
  if (value === "REVOKED") return <StatusBadge tone="danger">Revoked</StatusBadge>;
  return <StatusBadge tone="neutral">None</StatusBadge>;
}

function BadgeStatus({ value }: { value: MarketplaceListingAdmin["status"] }) {
  if (value === "ACTIVE") return <StatusBadge tone="success">Active</StatusBadge>;
  if (value === "DRAFT") return <StatusBadge tone="neutral">Draft</StatusBadge>;
  if (value === "SOLD") return <StatusBadge tone="info">Sold</StatusBadge>;
  if (value === "EXPIRED") return <StatusBadge tone="warning">Expired</StatusBadge>;
  return <StatusBadge tone="danger">Hidden</StatusBadge>;
}

export function ListingTable({
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
    <div className="overflow-x-auto">
      <table className="min-w-full border-separate border-spacing-y-3">
        <thead>
          <tr className="text-left text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--color-muted)]">
            <th className="px-4">Listing</th>
            <th className="px-4">Seller</th>
            <th className="px-4">District</th>
            <th className="px-4">Price</th>
            <th className="px-4">Qty</th>
            <th className="px-4">Verification</th>
            <th className="px-4">Status</th>
            <th className="px-4">Quality</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const active = row.id === selectedId;
            const score = getScore(row);
            const scoreTone = score >= 80 ? "success" : score >= 60 ? "warning" : "danger";
            return (
              <tr
                key={row.id}
                className={`rounded-[1.25rem] bg-[var(--color-screen)] text-sm text-[var(--color-heading)] ${
                  active ? "ring-2 ring-[rgba(53,91,49,0.18)]" : ""
                }`}
              >
                <td className="rounded-l-[1.25rem] px-4 py-4">
                  <button type="button" className="flex w-full items-center gap-3 text-left" onClick={() => onSelect(row.id)}>
                    <span className="h-12 w-16 overflow-hidden rounded-[1rem] border border-[color:rgba(31,41,22,0.08)] bg-white">
                      {row.imageUrl ? (
                        <span className="relative block h-12 w-16">
                          <Image
                            src={row.imageUrl}
                            alt={row.title}
                            fill
                            sizes="64px"
                            className="object-cover"
                            unoptimized
                          />
                        </span>
                      ) : null}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate font-semibold text-[var(--color-heading)]">{row.title}</span>
                      <span className="mt-1 block text-xs text-[var(--color-muted)]">
                        {row.productLabel} · {row.expiresAtLabel}
                      </span>
                    </span>
                  </button>
                </td>
                <td className="px-4 py-4">
                  <div className="font-semibold text-[var(--color-heading)]">{row.seller.name}</div>
                  <div className="mt-1 text-xs text-[var(--color-muted)]">
                    {row.seller.verifiedGrower ? "Verified grower" : "Unverified"} · {row.seller.district}
                  </div>
                </td>
                <td className="px-4 py-4 text-[var(--color-muted)]">{row.pickupDistrict}</td>
                <td className="px-4 py-4 font-semibold text-[var(--color-heading)]">{row.priceText}</td>
                <td className="px-4 py-4 text-[var(--color-muted)]">{row.quantityText}</td>
                <td className="px-4 py-4">
                  <BadgeVerification value={row.verificationStatus} />
                </td>
                <td className="px-4 py-4">
                  <BadgeStatus value={row.status} />
                </td>
                <td className="rounded-r-[1.25rem] px-4 py-4">
                  <div className="flex items-center justify-between gap-2">
                    <StatusBadge tone={scoreTone}>{score}</StatusBadge>
                    <span className="text-xs text-[var(--color-muted)]">{row.quality.flags ? `${row.quality.flags} flags` : "clean"}</span>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
