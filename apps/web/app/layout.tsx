import type { Metadata, Viewport } from "next";
import { Be_Vietnam_Pro } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import { Providers } from "./providers";
import { getUser } from "@/lib/auth-server";

const beVietnamPro = Be_Vietnam_Pro({
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
  subsets: ["vietnamese", "latin"],
  display: "swap",
  variable: "--font-sans",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-mono",
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
      <body className={`${beVietnamPro.variable} ${geistMono.variable}`}>
        <Providers initialUser={user}>{children}</Providers>
      </body>
    </html>
  );
}
