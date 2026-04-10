"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/context/AuthContext";

export default function Home() {
  const router = useRouter();
  const { isAuthReady, isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthReady) {
      return;
    }

    router.replace(isAuthenticated ? "/home" : "/login");
  }, [router, isAuthReady, isAuthenticated]);

  return null;
}
