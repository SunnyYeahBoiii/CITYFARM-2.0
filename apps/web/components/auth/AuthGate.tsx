"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import styles from "@/components/cityfarm/cityfarm.module.css";

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
      <div className={styles.appBackdrop}>
        <div className="flex h-screen items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#37542d] border-t-transparent"></div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
