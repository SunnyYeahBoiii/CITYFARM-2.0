import { getWebBaseUrl } from "@/lib/api/config";

export default function AccessDeniedPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-12">
      <section className="w-full max-w-xl rounded-[2rem] border border-[color:rgba(31,41,22,0.08)] bg-white/88 p-8 text-center shadow-[0_24px_54px_rgba(33,49,30,0.09)]">
        <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--color-green-soft)]">
          CITYFARM Admin
        </div>
        <h1 className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-[var(--color-heading)]">
          Admin role required
        </h1>
        <p className="mt-4 text-sm leading-7 text-[var(--color-muted)] sm:text-base">
          Tài khoản hiện tại không có quyền `ADMIN`, nên không thể truy cập các route và endpoint quản trị.
        </p>
        <a
          href={`${getWebBaseUrl()}/`}
          className="mt-6 inline-flex min-h-11 items-center justify-center rounded-full bg-[linear-gradient(135deg,#567a3d,#2d4a24)] px-5 text-sm font-semibold text-white shadow-[0_18px_30px_rgba(53,91,49,0.18)] transition-transform hover:-translate-y-0.5"
        >
          Quay về app chính
        </a>
      </section>
    </main>
  );
}
