import { StatusBadge } from "@/components/admin/StatusBadge";

export function OrdersKpiRow({
  kpis,
}: {
  kpis: Array<{
    label: string;
    value: string;
    footnote: string;
    tone: "success" | "warning" | "danger" | "neutral" | "info";
  }>;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {kpis.map((kpi) => (
        <div
          key={kpi.label}
          className="rounded-[1.5rem] border border-[color:rgba(31,41,22,0.08)] bg-[var(--color-screen)] px-4 py-4"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--color-muted)]">
                {kpi.label}
              </div>
              <div className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-[var(--color-heading)]">{kpi.value}</div>
            </div>
            <StatusBadge tone={kpi.tone}>{kpi.footnote}</StatusBadge>
          </div>
        </div>
      ))}
    </div>
  );
}

