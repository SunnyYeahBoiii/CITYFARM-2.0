import { AdminShell, type AdminSection } from "./AdminShell";
import { StatusBadge } from "./StatusBadge";

type ModulePageProps = {
  active: AdminSection;
  title: string;
  description: string;
  summary: Array<{ label: string; value: string }>;
  pillars: string[];
  nextSteps: string[];
};

export function ModulePage({
  active,
  title,
  description,
  summary,
  pillars,
  nextSteps,
}: ModulePageProps) {
  return (
    <AdminShell
      active={active}
      title={title}
      description={description}
      actions={
        <button
          type="button"
          className="inline-flex min-h-10 items-center justify-center rounded-full border border-[color:rgba(31,41,22,0.08)] bg-white px-4 text-sm font-semibold text-[var(--color-interactive-ink)] transition-colors hover:bg-[var(--color-screen)]"
        >
          Coming next
        </button>
      }
    >
      <section className="rounded-[1.2rem] border border-[color:rgba(31,41,22,0.08)] bg-white/88 px-4 py-3 shadow-[0_12px_22px_rgba(33,49,30,0.06)]">
        <div className="flex flex-wrap items-center gap-2">
          {summary.map((item) => (
            <StatusBadge key={item.label} tone="neutral">
              {item.label}: {item.value}
            </StatusBadge>
          ))}
        </div>
      </section>

      <section className="mt-4 grid gap-4 xl:grid-cols-2">
        <article className="rounded-[1.2rem] border border-[color:rgba(31,41,22,0.08)] bg-white/88 p-4 shadow-[0_12px_22px_rgba(33,49,30,0.06)]">
          <div className="flex items-center justify-between gap-3">
            <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--color-muted)]">Scope</div>
            <StatusBadge tone="info">Phase 1</StatusBadge>
          </div>
          <ul className="mt-3 space-y-2">
            {pillars.map((item) => (
              <li
                key={item}
                className="rounded-lg border border-[color:rgba(31,41,22,0.08)] bg-[var(--color-screen)] px-3 py-2 text-sm leading-6 text-[var(--color-muted)]"
              >
                {item}
              </li>
            ))}
          </ul>
        </article>

        <article className="rounded-[1.2rem] border border-[color:rgba(31,41,22,0.08)] bg-white/88 p-4 shadow-[0_12px_22px_rgba(33,49,30,0.06)]">
          <div className="flex items-center justify-between gap-3">
            <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--color-muted)]">Next actions</div>
            <StatusBadge tone="warning">Needs API</StatusBadge>
          </div>
          <ol className="mt-3 space-y-2">
            {nextSteps.map((item, index) => (
              <li
                key={item}
                className="flex gap-3 rounded-lg border border-[color:rgba(31,41,22,0.08)] bg-[var(--color-screen)] px-3 py-2"
              >
                <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white text-xs font-semibold text-[var(--color-green-deep)]">
                  {index + 1}
                </span>
                <span className="text-sm leading-6 text-[var(--color-muted)]">{item}</span>
              </li>
            ))}
          </ol>
        </article>
      </section>
    </AdminShell>
  );
}
