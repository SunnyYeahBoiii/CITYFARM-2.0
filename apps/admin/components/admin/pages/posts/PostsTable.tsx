import { StatusBadge } from "@/components/admin/StatusBadge";
import type { FeedPostRow } from "./types";
import { postTypeLabel, statusLabel, statusTone } from "./posts-utils";

export function PostsTable({
  rows,
  selectedIds,
  onToggleSelected,
  onOpen,
}: {
  rows: FeedPostRow[];
  selectedIds: Set<string>;
  onToggleSelected: (id: string) => void;
  onOpen: (id: string) => void;
}) {
  return (
    <div className="overflow-x-auto rounded-[1.9rem] border border-[color:rgba(31,41,22,0.08)] bg-white/86 shadow-[0_16px_30px_rgba(33,49,30,0.07)]">
      <table className="min-w-[960px] w-full border-separate border-spacing-y-3 px-4 py-4">
        <thead>
          <tr className="text-left text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--color-muted)]">
            <th className="px-3 pb-2">
              <span className="sr-only">Select</span>
            </th>
            <th className="px-3 pb-2">Author</th>
            <th className="px-3 pb-2">Type</th>
            <th className="px-3 pb-2">Caption</th>
            <th className="px-3 pb-2">District</th>
            <th className="px-3 pb-2">Signals</th>
            <th className="px-3 pb-2">Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const selected = selectedIds.has(row.id);
            return (
              <tr
                key={row.id}
                className="group rounded-[1.35rem] bg-[var(--color-screen)] text-sm text-[var(--color-heading)] transition-colors hover:bg-white"
              >
                <td className="rounded-l-[1.35rem] px-3 py-4">
                  <input
                    type="checkbox"
                    checked={selected}
                    onChange={() => onToggleSelected(row.id)}
                    aria-label={`Select post ${row.id}`}
                    className="h-4 w-4 accent-[var(--color-green-deep)]"
                  />
                </td>
                <td className="px-3 py-4">
                  <button
                    type="button"
                    onClick={() => onOpen(row.id)}
                    className="text-left"
                  >
                    <div className="font-semibold text-[var(--color-heading)]">{row.authorName}</div>
                    <div className="mt-1 text-xs text-[var(--color-muted)]">{row.createdAtLabel}</div>
                  </button>
                </td>
                <td className="px-3 py-4 text-[var(--color-muted)]">{postTypeLabel(row.postType)}</td>
                <td className="px-3 py-4">
                  <button type="button" onClick={() => onOpen(row.id)} className="text-left">
                    <div className="max-w-[420px] truncate text-[var(--color-heading)]">{row.caption}</div>
                    {row.riskNotes.length ? (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {row.riskNotes.slice(0, 2).map((note) => (
                          <span
                            key={note}
                            className="inline-flex items-center rounded-full border border-[color:rgba(31,41,22,0.08)] bg-white px-3 py-1 text-xs font-semibold text-[var(--color-muted)]"
                          >
                            {note}
                          </span>
                        ))}
                        {row.riskNotes.length > 2 ? (
                          <span className="text-xs font-semibold text-[var(--color-muted)]">+{row.riskNotes.length - 2}</span>
                        ) : null}
                      </div>
                    ) : null}
                  </button>
                </td>
                <td className="px-3 py-4 text-[var(--color-muted)]">{row.visibilityDistrict ?? "-"}</td>
                <td className="px-3 py-4 text-[var(--color-muted)]">
                  <div className="flex flex-wrap gap-2">
                    <StatusBadge tone="info">{row.signals.likes} likes</StatusBadge>
                    <StatusBadge tone="info">{row.signals.comments} cmts</StatusBadge>
                    {row.signals.reports ? <StatusBadge tone="danger">{row.signals.reports} reports</StatusBadge> : null}
                  </div>
                </td>
                <td className="rounded-r-[1.35rem] px-3 py-4">
                  <StatusBadge tone={statusTone(row.status)}>{statusLabel(row.status)}</StatusBadge>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
