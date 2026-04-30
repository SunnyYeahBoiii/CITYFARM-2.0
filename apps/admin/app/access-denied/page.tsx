import { getWebBaseUrl } from "@/lib/api/config";

export default function AccessDeniedPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-12">
      <section className="w-full max-w-xl rounded-[2rem] border border-[color:rgba(31,41,22,0.08)] bg-white/88 p-8 text-center shadow-[0_24px_54px_rgba(33,49,30,0.09)]">
        <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--color-green-soft)]">
          CITYFARM Admin
        </div>
        <h1 className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-[var(--color-heading)]">
          Access denied
        </h1>
        <p className="mt-4 text-sm leading-7 text-[var(--color-muted)] sm:text-base">
          This page is only available to admin accounts. Your current account does not have permission to access the admin area.
        </p>
        <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <a
            href={`${getWebBaseUrl()}/`}
            className="inline-flex min-h-11 items-center justify-center rounded-full bg-[linear-gradient(135deg,#567a3d,#2d4a24)] px-5 text-sm font-semibold text-white shadow-[0_18px_30px_rgba(53,91,49,0.18)] transition-transform hover:-translate-y-0.5"
          >
            Back to main app
          </a>
          <a
            href={`${getWebBaseUrl()}/login`}
            className="inline-flex min-h-11 items-center justify-center rounded-full border border-[color:rgba(31,41,22,0.16)] bg-white px-5 text-sm font-semibold text-[var(--color-heading)] transition-colors hover:bg-[var(--color-screen)]"
          >
            Sign in with another account
          </a>
        </div>
      </section>
    </main>
  );
}
