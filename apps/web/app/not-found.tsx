import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[var(--color-screen)] px-6 text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-green-soft)]">
        CITYFARM
      </p>
      <h2 className="text-2xl font-extrabold text-[var(--color-heading)]">Page not found</h2>
      <p className="max-w-sm text-sm leading-6 text-[var(--color-muted)]">
        The requested view does not exist or is no longer available.
      </p>
      <Link
        href="/"
        className="inline-flex min-h-11 items-center justify-center rounded-full bg-[var(--color-green-deep)] px-5 py-3 text-sm font-bold text-white"
      >
        Back to app
      </Link>
    </div>
  );
}
