import { AppShell } from "../../components/cityfarm/screens";
import { AuthGate } from "../../components/cityfarm/auth-gate";

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
