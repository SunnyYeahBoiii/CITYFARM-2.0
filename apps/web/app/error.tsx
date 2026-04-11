"use client";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[var(--color-screen)] px-6 text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-green-soft)]">
        CITYFARM
      </p>
      <h2 className="text-2xl font-extrabold text-[var(--color-heading)]">Something went wrong</h2>
      <p className="max-w-sm text-sm leading-6 text-[var(--color-muted)]">
        An unexpected error interrupted the current view. Try loading the route again.
      </p>
      <button
        type="button"
        onClick={() => reset()}
        className="inline-flex min-h-11 items-center justify-center rounded-full bg-[var(--color-green-deep)] px-5 py-3 text-sm font-bold text-white"
      >
        Try again
      </button>
    </div>
  );
}
