import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Providers } from "./providers";
import { getUser } from "@/lib/auth-server";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
});

export const metadata: Metadata = {
  title: {
    default: "CITYFARM 2.0",
    template: "%s | CITYFARM 2.0",
  },
  description:
    "CITYFARM 2.0 frontend trên Next.js với các screen legacy được tách thành route thật: home, scan, garden, community, shared plant và order.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#355b31",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getUser();

  return (
    <html suppressHydrationWarning lang="vi">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <Providers initialUser={user}>{children}</Providers>
      </body>
    </html>
  );
}
