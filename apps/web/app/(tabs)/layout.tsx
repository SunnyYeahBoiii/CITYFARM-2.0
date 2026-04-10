import { AppShell } from "@/components/cityfarm/screens";
import { AuthGate } from "@/components/auth/AuthGate";

export default function TabsLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <AuthGate>
      <AppShell>{children}</AppShell>
    </AuthGate>
  );
}
