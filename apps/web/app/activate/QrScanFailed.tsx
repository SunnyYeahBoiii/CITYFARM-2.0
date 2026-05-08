import Link from "next/link";
import type { QrScanFailureCopy } from "@/lib/activation/qr-activation";

export function QrScanFailed({ copy }: { copy: QrScanFailureCopy }) {
  return (
    <div className="flex min-h-full items-center justify-center px-4 py-10">
      <section className="w-full rounded-[1rem] border border-[rgba(163,69,45,0.24)] bg-white px-5 py-7 text-center shadow-sm">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#fff1ed] text-2xl font-black text-[#a3452d]">
          !
        </div>
        <p className="mt-5 text-xs font-bold uppercase tracking-[0.14em] text-[#a3452d]">
          {copy.eyebrow}
        </p>
        <h1 className="mt-3 text-xl font-extrabold text-[var(--color-heading)]">
          {copy.title}
        </h1>
        <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">
          {copy.description}
        </p>
        <Link
          href={copy.actionHref}
          className="mt-5 inline-flex min-h-11 items-center justify-center rounded-full bg-[var(--color-green-deep)] px-5 text-sm font-bold text-white"
        >
          {copy.actionLabel}
        </Link>
      </section>
    </div>
  );
}
