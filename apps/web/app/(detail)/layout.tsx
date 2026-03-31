import { DetailShell } from "../../components/cityfarm/screens";

export default function DetailLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <DetailShell>{children}</DetailShell>;
}
