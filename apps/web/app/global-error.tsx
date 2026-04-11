"use client";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="vi">
      <body>
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[var(--color-screen)] px-6 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-green-soft)]">
            CITYFARM
          </p>
          <h2 className="text-2xl font-extrabold text-[var(--color-heading)]">Application error</h2>
          <p className="max-w-sm text-sm leading-6 text-[var(--color-muted)]">
            The application failed to render. Reload the current route and continue.
          </p>
          <button
            type="button"
            onClick={() => reset()}
            className="inline-flex min-h-11 items-center justify-center rounded-full bg-[var(--color-green-deep)] px-5 py-3 text-sm font-bold text-white"
          >
            Reload
          </button>
        </div>
      </body>
    </html>
  );
}
