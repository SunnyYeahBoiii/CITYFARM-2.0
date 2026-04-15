"use client";

import { useMemo, useState } from "react";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { adminClientPatch } from "@/lib/api/client-fetch";
import type { FeedPostRow, ModerationStatus, PostFilterState } from "./types";
import { applyPostFilters, summarizeQueue } from "./posts-utils";
import { PostsFilters } from "./PostsFilters";
import { PostsTable } from "./PostsTable";
import { ModerationDrawer } from "./ModerationDrawer";

const DEFAULT_FILTERS: PostFilterState = {
  q: "",
  status: "ALL",
  type: "ALL",
  district: "ALL",
  hasImage: false,
  reportedOnly: false,
};

function uniqueDistricts(rows: FeedPostRow[]): string[] {
  const set = new Set<string>();
  for (const row of rows) {
    if (row.visibilityDistrict) set.add(row.visibilityDistrict);
    if (row.authorDistrict) set.add(row.authorDistrict);
  }
  return Array.from(set).sort((a, b) => a.localeCompare(b));
}

const PERSISTED_STATUSES: ModerationStatus[] = ["PUBLISHED", "HIDDEN"];

type BannerState =
  | { tone: "warning" | "danger" | "success"; title: string; detail?: string }
  | null;

async function patchAdminPost(
  postId: string,
  payload: { status: ModerationStatus },
): Promise<FeedPostRow> {
  return adminClientPatch<FeedPostRow>(`/admin/posts/${postId}`, payload);
}

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
    <section className={`mb-4 rounded-[1.2rem] border px-4 py-3 shadow-[0_12px_22px_rgba(33,49,30,0.06)] ${styles}`}>
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

export function PostsModerationPageClient({
  initialPosts,
  initialError,
}: {
  initialPosts: FeedPostRow[];
  initialError?: string;
}) {
  const [filters, setFilters] = useState<PostFilterState>(DEFAULT_FILTERS);
  const [rows, setRows] = useState<FeedPostRow[]>(() => [...initialPosts]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
  const [activePostId, setActivePostId] = useState<string | null>(null);
  const [banner, setBanner] = useState<BannerState>(
    initialError
      ? { tone: "danger", title: "Cannot load posts from API.", detail: initialError }
      : null,
  );
  const [savingPostId, setSavingPostId] = useState<string | null>(null);

  const filteredRows = useMemo(() => applyPostFilters(rows, filters), [filters, rows]);
  const queue = useMemo(() => summarizeQueue(filteredRows), [filteredRows]);
  const activePost = useMemo(
    () => rows.find((p) => p.id === activePostId) ?? null,
    [activePostId, rows],
  );
  const districts = useMemo(() => uniqueDistricts(rows), [rows]);

  const toggleSelected = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const setRowStatus = (postId: string, status: ModerationStatus) => {
    setRows((prev) => prev.map((row) => (row.id === postId ? { ...row, status } : row)));
  };

  const persistStatus = async (postId: string, status: ModerationStatus) => {
    if (!PERSISTED_STATUSES.includes(status)) {
      setRowStatus(postId, status);
      setBanner({
        tone: "warning",
        title: "Local tag only.",
        detail: "NEEDS_REVIEW / FLAGGED currently do not persist to backend. Publish/Hide will persist.",
      });
      return;
    }

    const before = rows.find((row) => row.id === postId)?.status ?? null;
    setRowStatus(postId, status);
    setSavingPostId(postId);
    setBanner(null);

    try {
      const updated = await patchAdminPost(postId, { status });
      setRows((prev) => prev.map((row) => (row.id === postId ? updated : row)));
    } catch (error) {
      if (before) {
        setRowStatus(postId, before);
      }
      const message = error instanceof Error ? error.message : "Failed to update post.";
      setBanner({ tone: "danger", title: "Update failed.", detail: message });
    } finally {
      setSavingPostId((current) => (current === postId ? null : current));
    }
  };

  const bulkUpdate = (status: ModerationStatus) => {
    if (selectedIds.size === 0) return;

    if (!PERSISTED_STATUSES.includes(status)) {
      setRows((prev) => prev.map((row) => (selectedIds.has(row.id) ? { ...row, status } : row)));
      setSelectedIds(new Set());
      setBanner({
        tone: "warning",
        title: "Bulk update applied locally.",
        detail: "This status is not persisted yet. Use Publish/Hide for server-backed actions.",
      });
      return;
    }

    const ids = Array.from(selectedIds);
    setSelectedIds(new Set());
    setBanner(null);

    void (async () => {
      setSavingPostId("bulk");
      const failures: string[] = [];
      for (const id of ids) {
        const before = rows.find((row) => row.id === id)?.status ?? null;
        setRowStatus(id, status);
        try {
          const updated = await patchAdminPost(id, { status });
          setRows((prev) => prev.map((row) => (row.id === id ? updated : row)));
        } catch (error) {
          if (before) setRowStatus(id, before);
          const message = error instanceof Error ? error.message : "Failed to update.";
          failures.push(`${id}: ${message}`);
        }
      }
      if (failures.length) {
        setBanner({
          tone: "danger",
          title: "Some bulk updates failed.",
          detail: failures.slice(0, 3).join(" | "),
        });
      } else {
        setBanner({ tone: "success", title: "Bulk update saved.", detail: "Changes were persisted to backend." });
      }
      setSavingPostId(null);
    })();
  };

  return (
    <>
      <section className="rounded-[1.2rem] border border-[color:rgba(31,41,22,0.08)] bg-white/88 p-4 shadow-[0_12px_22px_rgba(33,49,30,0.06)]">
        <div className="flex flex-wrap items-center justify-end gap-2">
          <button
            type="button"
            className="inline-flex min-h-10 items-center justify-center rounded-full border border-[color:rgba(31,41,22,0.08)] bg-white px-4 text-sm font-semibold text-[var(--color-interactive-ink)] transition-colors hover:bg-[var(--color-screen)]"
            onClick={() => {
              setFilters(DEFAULT_FILTERS);
              setSelectedIds(new Set());
              setBanner(null);
            }}
          >
            Reset
          </button>
          <button
            type="button"
            className="inline-flex min-h-10 items-center justify-center rounded-full bg-[linear-gradient(135deg,#567a3d,#2d4a24)] px-4 text-sm font-semibold text-white shadow-[0_14px_24px_rgba(53,91,49,0.18)] transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
            onClick={() => setActivePostId(filteredRows[0]?.id ?? null)}
            disabled={!filteredRows.length}
          >
            Open next
          </button>
        </div>
      </section>
      {banner ? <Banner value={banner} onDismiss={() => setBanner(null)} /> : null}
      <section className="rounded-[1.2rem] border border-[color:rgba(31,41,22,0.08)] bg-white/88 px-4 py-3 shadow-[0_12px_22px_rgba(33,49,30,0.06)]">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge tone="neutral">{queue.total} visible</StatusBadge>
          <StatusBadge tone="warning">{queue.needsReview} needs review</StatusBadge>
          <StatusBadge tone="danger">{queue.flagged} flagged</StatusBadge>
          <StatusBadge tone="info">{queue.reported} reported</StatusBadge>
          <StatusBadge tone="success">{queue.published} published</StatusBadge>
          <span className="ml-auto text-xs uppercase tracking-[0.12em] text-[var(--color-muted)]">
            {filteredRows.filter((r) => r.authorVerifiedGrower).length} verified authors
          </span>
        </div>
      </section>

      <section className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(0,0.65fr)]">
        <PostsFilters filters={filters} districts={districts} onChange={setFilters} />

        <article className="rounded-[1.2rem] border border-[color:rgba(31,41,22,0.08)] bg-white/88 p-4 shadow-[0_12px_22px_rgba(33,49,30,0.06)]">
          <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--color-muted)]">Bulk actions</div>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              disabled={selectedIds.size === 0}
              onClick={() => bulkUpdate("PUBLISHED")}
              className="inline-flex min-h-10 items-center justify-center rounded-full bg-[linear-gradient(135deg,#567a3d,#2d4a24)] px-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              Publish selected
            </button>
            <button
              type="button"
              disabled={selectedIds.size === 0}
              onClick={() => bulkUpdate("HIDDEN")}
              className="inline-flex min-h-10 items-center justify-center rounded-full border border-[rgba(163,69,45,0.24)] bg-[rgba(253,244,241,0.92)] px-4 text-sm font-semibold text-[var(--color-danger)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Hide selected
            </button>
            <button
              type="button"
              onClick={() => setSelectedIds(new Set())}
              className="inline-flex min-h-10 items-center justify-center rounded-full border border-[color:rgba(31,41,22,0.08)] bg-[var(--color-screen)] px-4 text-sm font-semibold text-[var(--color-interactive-ink)]"
            >
              Clear selection
            </button>
          </div>
          <p className="mt-3 text-sm text-[var(--color-muted)]">
            {selectedIds.size > 0 ? `${selectedIds.size} items selected.` : "Chọn row trong bảng để thao tác nhanh."}
          </p>
        </article>
      </section>

      <section className="mt-4">
        <PostsTable
          rows={filteredRows}
          selectedIds={selectedIds}
          onToggleSelected={toggleSelected}
          onOpen={(id) => setActivePostId(id)}
        />
      </section>

      <ModerationDrawer
        post={activePost}
        open={Boolean(activePostId)}
        onClose={() => setActivePostId(null)}
        saving={Boolean(activePost?.id && savingPostId === activePost.id)}
        onUpdateStatus={persistStatus}
      />
    </>
  );
}
