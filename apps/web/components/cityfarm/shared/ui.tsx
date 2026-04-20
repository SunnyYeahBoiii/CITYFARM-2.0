import Image from "next/image";
import type { ReactNode } from "react";
import type { PlantHealth } from "../../../lib/cityfarm";

export function cn(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

export function CityImage({
  src,
  alt,
  sizes,
  className,
  priority = false,
  unoptimized = false,
  fit = "cover",
}: {
  src: string;
  alt: string;
  sizes: string;
  className?: string;
  priority?: boolean;
  unoptimized?: boolean;
  fit?: "cover" | "contain";
}) {
  const shouldSkipOptimization = unoptimized || /^(https?:|blob:|data:|\/\/)/.test(src);

  return (
    <div className={cn("relative overflow-hidden", className)}>
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        priority={priority}
        unoptimized={shouldSkipOptimization}
        className={fit === "contain" ? "object-contain" : "object-cover"}
      />
    </div>
  );
}

export function HealthBadge({ health }: { health: PlantHealth }) {
  const label = health === "healthy" ? "Healthy" : health === "warning" ? "Warning" : "Critical";
  const tone =
    health === "healthy"
      ? "bg-emerald-50 text-emerald-700"
      : health === "warning"
        ? "bg-amber-50 text-amber-700"
        : "bg-rose-50 text-rose-700";

  return <span className={cn("inline-flex rounded-full px-3 py-1 text-xs font-bold", tone)}>{label}</span>;
}

export function MetricBox({
  label,
  value,
  accent = "default",
}: {
  label: string;
  value: string;
  accent?: "green" | "default";
}) {
  return (
    <div className="rounded-3xl border border-[rgba(31,41,22,0.08)] bg-white px-4 py-3 shadow-[0_10px_28px_rgba(33,49,30,0.06)]">
      <div className={cn("text-xl font-extrabold", accent === "green" ? "text-(--color-green-deep)" : "text-(--color-heading)")}>
        {value}
      </div>
      <div className="mt-1 text-xs font-medium text-(--color-muted)">{label}</div>
    </div>
  );
}

export function AnalysisMetric({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: ReactNode;
}) {
  return (
    <div className="rounded-[1.35rem] border border-[rgba(31,41,22,0.08)] bg-white p-4 shadow-[0_10px_28px_rgba(33,49,30,0.06)]">
      <div className="flex items-center gap-2 text-(--color-muted)">
        <span className="text-(--color-green-deep)">{icon}</span>
        <span className="text-xs font-semibold uppercase tracking-[0.08em]">{label}</span>
      </div>
      <div className="mt-3 text-sm font-bold text-(--color-heading)">{value}</div>
    </div>
  );
}

export function Avatar({ name, size, className }: { name: string; size?: number; className?: string }) {
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  const sizeStyle = size ? { width: `${size}px`, height: `${size}px`, minWidth: `${size}px`, minHeight: `${size}px`, fontSize: `${size * 0.4}px` } : {};

  return (
    <div 
      className={cn("flex h-11 w-11 items-center justify-center rounded-full bg-(--color-interactive-bg) font-bold text-(--color-green-deep)", className)}
      style={sizeStyle}
    >
      {initials}
    </div>
  );
}

export function OrderTab({
  label,
  icon,
  active,
  onClick,
}: {
  label: string;
  icon: ReactNode;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold transition-colors",
        active
          ? "bg-(--color-green-deep) text-white shadow-[0_12px_28px_rgba(53,91,49,0.24)]"
          : "bg-white text-(--color-interactive-ink) ring-1 ring-[rgba(31,41,22,0.08)]",
      )}
    >
      {icon}
      {label}
    </button>
  );
}
