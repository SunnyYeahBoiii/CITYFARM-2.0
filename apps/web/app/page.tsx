"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "../components/cityfarm/auth-context";

export default function Home() {
  const router = useRouter();
  const { ready, loggedIn } = useAuth();

  useEffect(() => {
    if (!ready) {
      return;
    }

    router.replace(loggedIn ? "/home" : "/login");
  }, [router, ready, loggedIn]);

  return null;
}
