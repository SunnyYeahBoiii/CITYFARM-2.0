import { Suspense } from "react";
import { AuthShell } from "@/components/auth/AuthShell";
import { SetupPasswordClient } from "@/components/auth/SetupPasswordClient";

function SetupPasswordFallback() {
  return (
    <AuthShell>
      <div className="flex min-h-[260px] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#37542d] border-t-transparent" />
      </div>
    </AuthShell>
  );
}

export default function SetupPasswordPage() {
  return (
    <Suspense fallback={<SetupPasswordFallback />}>
      <SetupPasswordClient />
    </Suspense>
  );
}
