import type { SelectHTMLAttributes } from "react";

export type StyledSelectOption = {
  value: string;
  label: string;
};

export type StyledSelectProps = Omit<SelectHTMLAttributes<HTMLSelectElement>, "children"> & {
  options: StyledSelectOption[];
  className?: string;
};

export function StyledSelect({ options, className = "", ...props }: StyledSelectProps) {
  return (
    <div className={`relative ${className}`}>
      <select
        {...props}
        className="min-h-10 w-full appearance-none rounded-full border border-[color:rgba(31,41,22,0.12)] bg-white px-4 pr-10 text-sm font-semibold text-[var(--color-heading)] outline-none transition-colors hover:border-[rgba(53,91,49,0.35)] focus:border-[rgba(53,91,49,0.5)] focus:ring-2 focus:ring-[rgba(53,91,49,0.12)] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <span className="pointer-events-none absolute inset-y-0 right-3 inline-flex items-center text-[var(--color-muted)]" aria-hidden>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <path
            d="M7 10l5 5 5-5"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
    </div>
  );
}
