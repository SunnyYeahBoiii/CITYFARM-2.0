import { SearchIcon } from "@/components/admin/icons";
import { StyledSelect } from "@/components/admin/StyledSelect";
import type { ModerationStatus, PostFilterState, PostType } from "./types";
import { postTypeLabel, statusLabel } from "./posts-utils";

const statuses: Array<ModerationStatus | "ALL"> = ["ALL", "NEEDS_REVIEW", "FLAGGED", "PUBLISHED", "HIDDEN"];
const types: Array<PostType | "ALL"> = ["ALL", "SHOWCASE", "QUESTION", "PLANT_SHARE", "MARKETPLACE_SHARE", "HARVEST_UPDATE"];

export function PostsFilters({
  filters,
  districts,
  onChange,
}: {
  filters: PostFilterState;
  districts: readonly string[];
  onChange: (next: PostFilterState) => void;
}) {
  return (
    <div className="rounded-[1.9rem] border border-[color:rgba(31,41,22,0.08)] bg-white/86 p-5 shadow-[0_16px_30px_rgba(33,49,30,0.07)]">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex min-h-12 w-full items-center gap-3 rounded-full border border-[color:rgba(31,41,22,0.08)] bg-[var(--color-screen)] px-4 xl:max-w-[420px]">
          <span className="text-[var(--color-muted)]">
            <SearchIcon />
          </span>
          <input
            type="search"
            value={filters.q}
            onChange={(event) => onChange({ ...filters, q: event.target.value })}
            placeholder="Search author, caption, id, signals..."
            className="w-full bg-transparent text-sm text-[var(--color-heading)] outline-none placeholder:text-[var(--color-muted)]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <label className="inline-flex items-center gap-2 rounded-full border border-[color:rgba(31,41,22,0.08)] bg-[var(--color-screen)] px-4 py-2.5 text-sm font-semibold text-[var(--color-interactive-ink)]">
            <input
              type="checkbox"
              checked={filters.reportedOnly}
              onChange={(event) => onChange({ ...filters, reportedOnly: event.target.checked })}
              className="h-4 w-4 accent-[var(--color-green-deep)]"
            />
            Reported only
          </label>
          <label className="inline-flex items-center gap-2 rounded-full border border-[color:rgba(31,41,22,0.08)] bg-[var(--color-screen)] px-4 py-2.5 text-sm font-semibold text-[var(--color-interactive-ink)]">
            <input
              type="checkbox"
              checked={filters.hasImage}
              onChange={(event) => onChange({ ...filters, hasImage: event.target.checked })}
              className="h-4 w-4 accent-[var(--color-green-deep)]"
            />
            Has image
          </label>
          <StyledSelect
            value={filters.district}
            onChange={(event) => onChange({ ...filters, district: event.target.value })}
            aria-label="Filter by district"
            className="min-w-[180px]"
            options={[
              { value: "ALL", label: "All districts" },
              ...districts.map((district) => ({ value: district, label: district })),
            ]}
          />
        </div>
      </div>

      <div className="mt-5 grid gap-3 lg:grid-cols-2">
        <div className="rounded-[1.35rem] bg-[var(--color-screen)] px-4 py-3">
          <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--color-muted)]">Status</div>
          <div className="mt-2 flex flex-wrap gap-2">
            {statuses.map((status) => {
              const active = filters.status === status;
              const inactiveTone =
                status === "NEEDS_REVIEW"
                  ? "text-amber-700 bg-amber-50/70 border-amber-100"
                  : status === "FLAGGED"
                    ? "text-rose-700 bg-rose-50/70 border-rose-100"
                    : status === "PUBLISHED"
                      ? "text-emerald-700 bg-emerald-50/80 border-emerald-100"
                      : status === "HIDDEN"
                        ? "text-stone-700 bg-stone-100/85 border-stone-200"
                        : "text-stone-700 bg-stone-100/85 border-stone-200";
              const activeTone =
                status === "ALL"
                  ? "bg-[var(--color-green-deep)] text-white border-[var(--color-green-deep)] shadow-[0_10px_20px_rgba(53,91,49,0.2)]"
                  : "bg-white text-[var(--color-heading)] border-[color:rgba(31,41,22,0.16)] shadow-sm";
              return (
                <button
                  key={status}
                  type="button"
                  onClick={() => onChange({ ...filters, status })}
                  className={`inline-flex min-h-9 items-center rounded-full border px-4 text-sm font-semibold transition-colors ${
                    active ? activeTone : inactiveTone
                  }`}
                >
                  {status === "ALL" ? "All" : statusLabel(status)}
                </button>
              );
            })}
          </div>
        </div>

        <div className="rounded-[1.35rem] bg-[var(--color-screen)] px-4 py-3">
          <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--color-muted)]">Type</div>
          <div className="mt-2 flex flex-wrap gap-2">
            {types.map((type) => {
              const active = filters.type === type;
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => onChange({ ...filters, type })}
                  className={`inline-flex min-h-9 items-center rounded-full px-4 text-xs font-semibold transition-colors ${
                    active
                      ? "bg-[linear-gradient(135deg,#567a3d,#2d4a24)] text-white shadow-[0_14px_28px_rgba(53,91,49,0.22)]"
                      : "border border-[color:rgba(31,41,22,0.08)] bg-white text-[var(--color-interactive-ink)] hover:bg-[rgba(255,255,255,0.9)]"
                  }`}
                >
                  {type === "ALL" ? "All" : postTypeLabel(type)}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
