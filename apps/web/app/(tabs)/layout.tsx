import { redirect } from "next/navigation";
import { AppShell } from "@/components/cityfarm/layout/AppShell";
import { getUser } from "@/lib/auth-server";
import { isAuthenticated } from "@/lib/types/auth";

export default async function TabsLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getUser();

  if (!isAuthenticated(user)) {
    redirect("/login");
  }

  if (user.requiresPasswordSetup) {
    redirect("/setup-password");
  }

  return <AppShell>{children}</AppShell>;
}
