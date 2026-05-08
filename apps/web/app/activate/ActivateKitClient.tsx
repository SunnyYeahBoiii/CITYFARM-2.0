"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { gardenApi } from "@/lib/api/garden.api";
import {
  getQrActivationErrorMessage,
  getQrScanFailureCopy,
} from "@/lib/activation/qr-activation";
import { QrScanFailed } from "./QrScanFailed";

export function ActivateKitClient({ code }: { code: string }) {
  const router = useRouter();
  const submittedRef = useRef(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (submittedRef.current) return;
    submittedRef.current = true;

    async function activateKit() {
      try {
        const plant = await gardenApi.activateCode(code);
        router.replace(`/garden/${encodeURIComponent(plant.id)}?activated=1`);
        router.refresh();
      } catch (err) {
        setError(getQrActivationErrorMessage(err));
      }
    }

    void activateKit();
  }, [code, router]);

  if (error) {
    return <QrScanFailed copy={getQrScanFailureCopy("activation-failed", error)} />;
  }

  return (
    <div className="flex min-h-full items-center justify-center px-4 py-10">
      <section className="w-full rounded-[1rem] border border-[rgba(31,41,22,0.08)] bg-white px-5 py-7 text-center shadow-sm">
        <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-[#dbe8d2] border-t-[var(--color-green-deep)]" />
        <p className="mt-5 text-xs font-bold uppercase tracking-[0.14em] text-[var(--color-green-soft)]">
          Activating kit
        </p>
        <h1 className="mt-2 text-xl font-extrabold text-[var(--color-heading)]">
          Adding your plant
        </h1>
        <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">
          Keep this page open while CITYFARM activates your kit.
        </p>
      </section>
    </div>
  );
}
