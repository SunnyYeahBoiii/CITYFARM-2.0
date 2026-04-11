import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    default: "Account Access",
    template: "%s | CITYFARM 2.0",
  },
  description: "Login, registration, and password setup for CITYFARM 2.0.",
};

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
