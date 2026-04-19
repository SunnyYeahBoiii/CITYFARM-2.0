"use client";

import { useMemo, useState, useTransition } from "react";
import { StyledSelect } from "@/components/admin/StyledSelect";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { adminClientPatch } from "@/lib/api/client-fetch";
import type { MarketplaceListingAdmin, ListingStatus, ListingVerificationStatus } from "./types";
import { countByDistrict, matchesFilter, scoreOverall, uniqueDistricts, type MarketplaceFilter } from "./utils";
import { ListingTable } from "./ListingTable";
import { ListingCardGrid } from "./ListingCardGrid";
import { ListingInspectPanel } from "./ListingInspectPanel";

type ViewMode = "table" | "visual";

type BannerState =
  | { tone: "warning" | "danger" | "success"; title: string; detail?: string }
  | null;

function Banner({ value, onDismiss }: { value: Exclude<BannerState, null>; onDismiss: () => void }) {
  const styles =
    value.tone === "danger"
      ? "border-rose-200 bg-rose-50 text-rose-900"
      : value.tone === "success"
        ? "border-emerald-200 bg-emerald-50 text-emerald-900"
        : "border-amber-200 bg-amber-50 text-amber-900";
  const detailTone =
    value.tone === "danger" ? "text-rose-800/80" : value.tone === "success" ? "text-emerald-800/80" : "text-amber-800/80";

  return (
    <section className={`rounded-[1.2rem] border px-4 py-3 shadow-[0_12px_22px_rgba(33,49,30,0.06)] ${styles}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="text-sm font-semibold">{value.title}</div>
          {value.detail ? <div className={`mt-1 text-sm ${detailTone}`}>{value.detail}</div> : null}
        </div>
        <button
          type="button"
          onClick={onDismiss}
          className="inline-flex min-h-9 shrink-0 items-center justify-center rounded-full bg-white/60 px-3 text-xs font-semibold text-[var(--color-interactive-ink)] ring-1 ring-[rgba(31,41,22,0.10)] transition-colors hover:bg-white"
        >
          Dismiss
        </button>
      </div>
    </section>
  );
}

async function patchAdminListing(
  listingId: string,
  patch: { status?: ListingStatus; verificationStatus?: ListingVerificationStatus },
): Promise<MarketplaceListingAdmin> {
  return adminClientPatch<MarketplaceListingAdmin>(`/admin/marketplace/${listingId}`, patch);
}

function Segmented({
  value,
  options,
  onChange,
}: {
  value: string;
  options: Array<{ id: string; label: string; count?: number }>;
  onChange: (next: string) => void;
}) {
  return (
    <div className="inline-flex flex-wrap gap-2">
      {options.map((option) => {
        const active = option.id === value;
        return (
          <button
            key={option.id}
            type="button"
            onClick={() => onChange(option.id)}
            className={`inline-flex min-h-9 items-center gap-2 rounded-full px-3 text-sm font-semibold transition-colors ${
              active
                ? "bg-[var(--color-green-deep)] text-white shadow-[0_10px_20px_rgba(53,91,49,0.18)]"
                : "border border-[color:rgba(31,41,22,0.08)] bg-white text-[var(--color-interactive-ink)] hover:bg-[var(--color-screen)]"
            }`}
          >
            <span>{option.label}</span>
            {typeof option.count === "number" ? (
              <span className={`inline-flex min-h-6 items-center rounded-full px-2 text-xs ${active ? "bg-white/16 text-white" : "bg-[var(--color-screen)] text-[var(--color-muted)]"}`}>
                {option.count}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

function CompactSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (next: string) => void;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <label className="inline-flex items-center gap-2 text-sm">
      <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--color-muted)]">{label}</span>
      <StyledSelect
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="min-w-[132px]"
        options={options}
      />
    </label>
  );
}

export function MarketplaceClient({
  initialListings,
  initialError,
}: {
  initialListings: MarketplaceListingAdmin[];
  initialError?: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const [listings, setListings] = useState<MarketplaceListingAdmin[]>(() => [...initialListings]);
  const [selectedId, setSelectedId] = useState<string>(initialListings[0]?.id ?? "");
  const [isInspectOpen, setIsInspectOpen] = useState(false);
  const [banner, setBanner] = useState<BannerState>(
    initialError
      ? { tone: "danger", title: "Cannot load listings from API.", detail: initialError }
      : null,
  );
  const [savingListingId, setSavingListingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<MarketplaceFilter>({
    q: "",
    status: "ALL",
    verification: "ALL",
    district: "ALL",
    flaggedOnly: false,
    expiringOnly: false,
  });

  const districts = useMemo(() => uniqueDistricts(listings), [listings]);

  const filtered = useMemo(
    () => listings.filter((listing) => matchesFilter(listing, filter)),
    [filter, listings],
  );

  const selected = useMemo(
    () => filtered.find((listing) => listing.id === selectedId) ?? filtered[0] ?? listings[0] ?? null,
    [filtered, listings, selectedId],
  );

  const counts = useMemo(() => {
    const active = listings.filter((l) => l.status === "ACTIVE").length;
    const pending = listings.filter((l) => l.verificationStatus === "PENDING").length;
    const expiring = listings.filter((l) => /today|in 1 day|in 2 days/i.test(l.expiresAtLabel)).length;
    const flagged = listings.filter((l) => l.quality.flags > 0).length;
    return { active, pending, expiring, flagged };
  }, [listings]);

  const statusStrip = useMemo(
    () => [
      { id: "ALL", label: "All", count: listings.length },
      { id: "ACTIVE", label: "Active", count: listings.filter((l) => l.status === "ACTIVE").length },
      { id: "DRAFT", label: "Draft", count: listings.filter((l) => l.status === "DRAFT").length },
      { id: "EXPIRED", label: "Expired", count: listings.filter((l) => l.status === "EXPIRED").length },
      { id: "HIDDEN", label: "Hidden", count: listings.filter((l) => l.status === "HIDDEN").length },
    ],
    [listings],
  );

  const districtBreakdown = useMemo(() => countByDistrict(filtered), [filtered]);

  const setStatus = (status: string) => {
    startTransition(() => {
      setFilter((prev) => ({ ...prev, status: status as ListingStatus | "ALL" }));
    });
  };

  const patchListing = async (
    listingId: string,
    patch: { status?: ListingStatus; verificationStatus?: ListingVerificationStatus },
  ) => {
    if (!patch.status && !patch.verificationStatus) return;

    const before = listings.find((l) => l.id === listingId) ?? null;
    if (!before) return;

    setBanner(null);
    setSavingListingId(listingId);
    setListings((prev) => prev.map((l) => (l.id === listingId ? { ...l, ...patch } : l)));

    try {
      const updated = await patchAdminListing(listingId, patch);
      setListings((prev) => prev.map((l) => (l.id === listingId ? updated : l)));
      setBanner({ tone: "success", title: "Listing updated.", detail: "Changes were persisted to backend." });
    } catch (error) {
      setListings((prev) => prev.map((l) => (l.id === listingId ? before : l)));
      const message = error instanceof Error ? error.message : "Failed to update listing.";
      setBanner({ tone: "danger", title: "Update failed.", detail: message });
    } finally {
      setSavingListingId((current) => (current === listingId ? null : current));
    }
  };

  return (
    <div className="space-y-4">
      {banner ? <Banner value={banner} onDismiss={() => setBanner(null)} /> : null}
      <section className="rounded-[1.2rem] border border-[color:rgba(31,41,22,0.08)] bg-white/88 p-4 shadow-[0_12px_22px_rgba(33,49,30,0.06)]">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge tone="success">{counts.active} active</StatusBadge>
          <StatusBadge tone="warning">{counts.pending} pending verify</StatusBadge>
          <StatusBadge tone="info">{counts.expiring} expiring soon</StatusBadge>
          <StatusBadge tone="danger">{counts.flagged} flagged</StatusBadge>
          <span className="ml-auto text-xs uppercase tracking-[0.12em] text-[var(--color-muted)]">{filtered.length} visible rows</span>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Segmented value={filter.status} options={statusStrip} onChange={setStatus} />
          <div className="inline-flex rounded-full bg-[var(--color-screen)] p-1 text-sm">
            <button
              type="button"
              onClick={() => setViewMode("table")}
              className={`rounded-full px-3 py-1.5 font-semibold transition-colors ${viewMode === "table" ? "bg-white text-[var(--color-heading)] shadow-sm" : "text-[var(--color-muted)]"}`}
            >
              Table
            </button>
            <button
              type="button"
              onClick={() => setViewMode("visual")}
              className={`rounded-full px-3 py-1.5 font-semibold transition-colors ${viewMode === "visual" ? "bg-white text-[var(--color-heading)] shadow-sm" : "text-[var(--color-muted)]"}`}
            >
              Visual
            </button>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <div className="flex min-h-10 w-full items-center gap-3 rounded-full border border-[color:rgba(31,41,22,0.08)] bg-[var(--color-screen)] px-4 md:w-[280px]">
            <input
              value={filter.q}
              onChange={(e) => setFilter((prev) => ({ ...prev, q: e.target.value }))}
              placeholder="Search title, seller, district..."
              aria-label="Search marketplace listings"
              className="w-full bg-transparent text-sm text-[var(--color-heading)] outline-none placeholder:text-[var(--color-muted)]"
            />
          </div>
          <CompactSelect
            label="Verification"
            value={filter.verification}
            onChange={(next) => setFilter((prev) => ({ ...prev, verification: next as ListingVerificationStatus | "ALL" }))}
            options={[
              { value: "ALL", label: "All" },
              { value: "PENDING", label: "Pending" },
              { value: "VERIFIED", label: "Verified" },
              { value: "NONE", label: "None" },
              { value: "REVOKED", label: "Revoked" },
            ]}
          />
          <CompactSelect
            label="District"
            value={filter.district}
            onChange={(next) => setFilter((prev) => ({ ...prev, district: next }))}
            options={[{ value: "ALL", label: "All" }, ...districts.map((d) => ({ value: d, label: d }))]}
          />
          <button
            type="button"
            onClick={() => setFilter((prev) => ({ ...prev, flaggedOnly: !prev.flaggedOnly }))}
            className={`inline-flex min-h-10 items-center rounded-full px-3 text-sm font-semibold ${
              filter.flaggedOnly
                ? "bg-rose-50 text-rose-700 ring-1 ring-rose-100"
                : "border border-[color:rgba(31,41,22,0.08)] bg-white text-[var(--color-interactive-ink)]"
            }`}
          >
            Flagged
          </button>
          <button
            type="button"
            onClick={() => setFilter((prev) => ({ ...prev, expiringOnly: !prev.expiringOnly }))}
            className={`inline-flex min-h-10 items-center rounded-full px-3 text-sm font-semibold ${
              filter.expiringOnly
                ? "bg-amber-50 text-amber-700 ring-1 ring-amber-100"
                : "border border-[color:rgba(31,41,22,0.08)] bg-white text-[var(--color-interactive-ink)]"
            }`}
          >
            Expiring
          </button>
          {isPending ? <span className="text-sm text-[var(--color-muted)]">Updating...</span> : null}
        </div>
      </section>

      <section>
        <article className="rounded-[1.2rem] border border-[color:rgba(31,41,22,0.08)] bg-white/88 p-4 shadow-[0_12px_22px_rgba(33,49,30,0.06)]">
          {viewMode === "table" ? (
            <ListingTable
              rows={filtered}
              selectedId={selected?.id ?? ""}
              onSelect={(id) => {
                setSelectedId(id);
                setIsInspectOpen(true);
              }}
              getScore={scoreOverall}
            />
          ) : (
            <ListingCardGrid
              rows={filtered}
              selectedId={selected?.id ?? ""}
              onSelect={(id) => {
                setSelectedId(id);
                setIsInspectOpen(true);
              }}
              getScore={scoreOverall}
            />
          )}
        </article>
      </section>

      <ListingInspectPanel
        open={isInspectOpen}
        onClose={() => setIsInspectOpen(false)}
        listing={selected}
        getScore={scoreOverall}
        saving={Boolean(selected?.id && savingListingId === selected.id)}
        onApproveAndPublish={(listingId) => patchListing(listingId, { status: "ACTIVE", verificationStatus: "VERIFIED" })}
        onHide={(listingId) => patchListing(listingId, { status: "HIDDEN" })}
        onRequestNewPhoto={() =>
          setBanner({
            tone: "warning",
            title: "Not supported yet.",
            detail: "Request new photo requires a messaging/workflow endpoint. Currently disabled to avoid fake persistence.",
          })
        }
      />

      <section className="rounded-[1.2rem] border border-[color:rgba(31,41,22,0.08)] bg-white/88 p-4 shadow-[0_12px_22px_rgba(33,49,30,0.06)]">
        <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--color-muted)]">District density</div>
        <div className="mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-3">
          {districtBreakdown.slice(0, 6).map((row) => (
            <div key={row.district} className="rounded-lg border border-[color:rgba(31,41,22,0.08)] bg-[var(--color-screen)] px-3 py-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-[var(--color-heading)]">{row.district}</span>
                <span className="text-[var(--color-muted)]">{row.active}/{row.total}</span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
