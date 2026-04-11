"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export function AuthGate({ children }: { children: React.ReactNode }) {
  const { isAuthReady, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isAuthReady && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isAuthReady, isAuthenticated, router]);

  if (!isAuthReady) {
    return null;
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(111,150,84,0.14),transparent_24%),radial-gradient(circle_at_88%_16%,rgba(228,168,98,0.16),transparent_18%),linear-gradient(180deg,#eff3eb_0%,#e4ebde_100%)]">
        <div className="flex h-screen items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#37542d] border-t-transparent" />
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
