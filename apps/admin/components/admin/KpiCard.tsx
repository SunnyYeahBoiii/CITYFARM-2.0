import { Sparkline } from "./Sparkline";
import { StatusBadge } from "./StatusBadge";

type KpiCardProps = {
  label: string;
  value: string;
  delta: string;
  footnote: string;
  tone: "success" | "warning" | "danger" | "neutral" | "info";
  stroke: string;
  fill: string;
  points: readonly number[];
};

export function KpiCard({
  label,
  value,
  delta,
  footnote,
  tone,
  stroke,
  fill,
  points,
}: KpiCardProps) {
  return (
    <article className="rounded-[1.75rem] border border-[color:rgba(31,41,22,0.08)] bg-white/88 p-5 shadow-[0_16px_30px_rgba(33,49,30,0.07)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--color-muted)]">
            {label}
          </div>
          <div className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-[var(--color-heading)]">{value}</div>
        </div>
        <StatusBadge tone={tone}>{delta}</StatusBadge>
      </div>
      <div className="mt-5">
        <Sparkline points={points} stroke={stroke} fill={fill} />
      </div>
      <div className="mt-3 text-sm text-[var(--color-muted)]">{footnote}</div>
    </article>
  );
}
