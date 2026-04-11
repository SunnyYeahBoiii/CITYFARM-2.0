"use client";

import { AuthProvider } from "@/context/AuthContext";
import type { CurrentUser } from "@/lib/types/auth";

export function Providers({ children, initialUser }: { children: React.ReactNode, initialUser: CurrentUser }) {
  return <AuthProvider initialUser={initialUser}>{children}</AuthProvider>;
}
