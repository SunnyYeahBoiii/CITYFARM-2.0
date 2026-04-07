"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { isUserLoggedIn } from "../components/cityfarm/auth-client";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    router.replace(isUserLoggedIn() ? "/home" : "/login");
  }, [router]);

  return null;
}
