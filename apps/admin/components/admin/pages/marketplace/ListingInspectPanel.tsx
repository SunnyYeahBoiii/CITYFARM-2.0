"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { StatusBadge } from "@/components/admin/StatusBadge";
import type { MarketplaceListingAdmin } from "./types";

function QualityRow({ label, value }: { label: string; value: number }) {
  const tone = value >= 80 ? "success" : value >= 60 ? "warning" : "danger";
  return (
    <div className="flex items-center justify-between gap-3 rounded-[1.25rem] border border-[color:rgba(31,41,22,0.08)] bg-[var(--color-screen)] px-4 py-3">
      <div className="text-sm font-medium text-[var(--color-heading)]">{label}</div>
      <StatusBadge tone={tone}>{value}</StatusBadge>
    </div>
  );
}

export function ListingInspectPanel({
  open,
  onClose,
  listing,
  getScore,
  saving,
  onApproveAndPublish,
  onHide,
  onRequestNewPhoto,
}: {
  open: boolean;
  onClose: () => void;
  listing: MarketplaceListingAdmin | null;
  getScore: (row: MarketplaceListingAdmin) => number;
  saving?: boolean;
  onApproveAndPublish: (listingId: string) => void;
  onHide: (listingId: string) => void;
  onRequestNewPhoto: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose, open]);

  if (!open || !listing) return null;

  const overall = getScore(listing);
  const overallTone = overall >= 80 ? "success" : overall >= 60 ? "warning" : "danger";

  return createPortal(
    <div className="fixed inset-0 z-[90]">
      <button
        type="button"
        aria-label="Close listing inspection popup"
        className="absolute inset-0 bg-black/28 backdrop-blur-[4px]"
        onClick={onClose}
      />
      <div className="absolute inset-0 flex items-center justify-center p-3 sm:p-4">
        <aside className="flex h-full max-h-[calc(100vh-1.5rem)] w-full max-w-[980px] flex-col rounded-[1.9rem] border border-[color:rgba(31,41,22,0.08)] bg-white/95 shadow-[0_30px_80px_rgba(33,49,30,0.22)] sm:max-h-[calc(100vh-2rem)]">
          <div className="flex items-start justify-between gap-3 border-b border-[color:rgba(31,41,22,0.08)] px-5 py-4 sm:px-6">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--color-muted)]">Inspection</div>
              <div className="mt-1 text-sm text-[var(--color-muted)]">Review listing metadata, quality signals và thao tác duyệt.</div>
            </div>
            <div className="flex items-center gap-2">
              <StatusBadge tone={overallTone}>{overall}</StatusBadge>
              <button
                type="button"
                onClick={onClose}
                className="inline-flex min-h-9 items-center justify-center rounded-full border border-[color:rgba(31,41,22,0.08)] bg-white px-3 text-sm font-semibold text-[var(--color-interactive-ink)] transition-colors hover:bg-[var(--color-screen)]"
              >
                Close
              </button>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6">
            <div className="space-y-4">
              <article className="rounded-[1.9rem] border border-[color:rgba(31,41,22,0.08)] bg-white/88 p-5 shadow-[0_16px_30px_rgba(33,49,30,0.07)] sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="mt-2 text-xl font-semibold text-[var(--color-heading)]">{listing.title}</div>
            <div className="mt-2 text-sm text-[var(--color-muted)]">
              {listing.seller.name} · {listing.pickupDistrict} · created {listing.createdAtLabel}
            </div>
          </div>
          <StatusBadge tone={overallTone}>Score {overall}</StatusBadge>
        </div>

        <div className="mt-5 overflow-hidden rounded-[1.5rem] border border-[color:rgba(31,41,22,0.08)] bg-[var(--color-screen)]">
          <div className="relative h-44 w-full">
            {listing.imageUrl ? (
              <Image
                src={listing.imageUrl}
                alt={listing.title}
                fill
                sizes="(min-width: 1280px) 420px, 96vw"
                className="object-cover"
                unoptimized
              />
            ) : null}
          </div>
          <div className="p-4">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge tone={listing.verificationStatus === "VERIFIED" ? "success" : listing.verificationStatus === "PENDING" ? "warning" : listing.verificationStatus === "REVOKED" ? "danger" : "neutral"}>
                {listing.verificationStatus}
              </StatusBadge>
              <StatusBadge tone={listing.status === "ACTIVE" ? "success" : listing.status === "EXPIRED" ? "warning" : listing.status === "HIDDEN" ? "danger" : "neutral"}>
                {listing.status}
              </StatusBadge>
              {listing.seller.verifiedGrower ? <StatusBadge tone="success">Grower</StatusBadge> : <StatusBadge tone="neutral">Unverified</StatusBadge>}
              {listing.quality.flags ? <StatusBadge tone="danger">{listing.quality.flags} flags</StatusBadge> : <StatusBadge tone="success">Clean</StatusBadge>}
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-[1.25rem] bg-white px-4 py-3">
                <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--color-muted)]">Price</div>
                <div className="mt-1 text-sm font-semibold text-[var(--color-heading)]">{listing.priceText}</div>
              </div>
              <div className="rounded-[1.25rem] bg-white px-4 py-3">
                <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--color-muted)]">Quantity</div>
                <div className="mt-1 text-sm font-semibold text-[var(--color-heading)]">{listing.quantityText}</div>
              </div>
              <div className="rounded-[1.25rem] bg-white px-4 py-3">
                <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--color-muted)]">Expires</div>
                <div className="mt-1 text-sm font-semibold text-[var(--color-heading)]">{listing.expiresAtLabel}</div>
              </div>
              <div className="rounded-[1.25rem] bg-white px-4 py-3">
                <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--color-muted)]">Docs</div>
                <div className="mt-1 text-sm font-semibold text-[var(--color-heading)]">{listing.documentedDays} days</div>
              </div>
            </div>

            {listing.notes ? (
              <div className="mt-4 rounded-[1.25rem] border border-[color:rgba(31,41,22,0.08)] bg-white px-4 py-3 text-sm leading-6 text-[var(--color-muted)]">
                {listing.notes}
              </div>
            ) : null}
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <button
            type="button"
            disabled={saving}
            onClick={() => onApproveAndPublish(listing.id)}
            className="inline-flex min-h-11 flex-1 items-center justify-center rounded-full bg-[linear-gradient(135deg,#567a3d,#2d4a24)] px-4 text-sm font-semibold text-white shadow-[0_14px_26px_rgba(53,91,49,0.18)] transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Approve & publish
          </button>
          <button
            type="button"
            disabled
            onClick={() => onRequestNewPhoto()}
            className="inline-flex min-h-11 flex-1 cursor-not-allowed items-center justify-center rounded-full border border-[color:rgba(31,41,22,0.08)] bg-white/70 px-4 text-sm font-semibold text-[var(--color-muted)]"
          >
            Request new photo
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={() => onHide(listing.id)}
            className="inline-flex min-h-11 items-center justify-center rounded-full bg-rose-50 px-4 text-sm font-semibold text-rose-700 ring-1 ring-rose-100 transition-colors hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Hide listing
          </button>
        </div>
        <div className="mt-3 text-sm text-[var(--color-muted)]">
          {saving ? "Saving to API..." : "API supports status + verification updates. Notes/workflow actions are not persisted yet."}
        </div>
      </article>

              <article className="rounded-[1.9rem] border border-[color:rgba(31,41,22,0.08)] bg-white/88 p-5 shadow-[0_16px_30px_rgba(33,49,30,0.07)] sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--color-muted)]">Quality signals</div>
            <div className="mt-2 text-xl font-semibold text-[var(--color-heading)]">Listing health</div>
          </div>
          <StatusBadge tone={overallTone}>{overall}</StatusBadge>
        </div>

        <div className="mt-5 space-y-3">
          <QualityRow label="Photo quality" value={listing.quality.photoScore} />
          <QualityRow label="Description completeness" value={listing.quality.descriptionScore} />
          <QualityRow label="Documentation/logs" value={listing.quality.documentationScore} />
        </div>

        <div className="mt-5 rounded-[1.5rem] border border-[color:rgba(31,41,22,0.08)] bg-[linear-gradient(145deg,#f3f6ef,#ebe4d6)] p-4">
          <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--color-green-soft)]">Suggested action</div>
          <div className="mt-2 text-base font-semibold text-[var(--color-heading)]">
            {listing.verificationStatus === "PENDING"
              ? "Hoan tat kiem tra snapshot va xac minh seller truoc khi set VERIFIED."
              : listing.quality.photoScore < 60
                ? "Yeu cau seller upload lai anh cover (anh toi/bi nhe)."
                : "Listing on, giu monitoring theo district."}
          </div>
          <div className="mt-3 text-sm leading-6 text-[var(--color-muted)]">
            Khi noi API that, panel nay se hien thi audit log va cac thay doi verification/status theo thoi gian.
          </div>
        </div>
      </article>
            </div>
          </div>
        </aside>
      </div>
    </div>,
    document.body,
  );
}
