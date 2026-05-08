import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/cityfarm/layout/AppShell";
import { getUser } from "@/lib/auth-server";
import { getQrScanFailureCopy } from "@/lib/activation/qr-activation";
import { buildActivationReturnPath } from "@/lib/auth/redirects";
import { isAuthenticated } from "@/lib/types/auth";
import { ActivateKitClient } from "./ActivateKitClient";
import { QrScanFailed } from "./QrScanFailed";

export const metadata: Metadata = {
  title: "Activate Kit",
};

type ActivatePageProps = {
  searchParams: Promise<{
    code?: string | string[];
  }>;
};

function readActivationCode(value: string | string[] | undefined): string {
  const rawCode = Array.isArray(value) ? value[0] : value;
  return rawCode?.trim() ?? "";
}

function MissingCodeMessage() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-[#eff3eb] px-5">
      <div className="w-full max-w-[420px]">
        <QrScanFailed copy={getQrScanFailureCopy("missing-code")} />
      </div>
    </div>
  );
}

export default async function ActivatePage({ searchParams }: ActivatePageProps) {
  const params = await searchParams;
  const code = readActivationCode(params.code);

  if (!code) {
    return <MissingCodeMessage />;
  }

  const user = await getUser();

  if (!isAuthenticated(user)) {
    redirect(`/login?returnTo=${encodeURIComponent(buildActivationReturnPath(code))}`);
  }

  if (user.requiresPasswordSetup) {
    redirect("/setup-password");
  }

  return (
    <AppShell>
      <ActivateKitClient code={code} />
    </AppShell>
  );
}
