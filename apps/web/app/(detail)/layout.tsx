import { DetailShell } from "@/components/cityfarm/layout/AppShell";
import { AuthGate } from "../../components/auth/AuthGate";

export default function DetailLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <AuthGate>
      <DetailShell>{children}</DetailShell>
    </AuthGate>
  );
}
