import type { Metadata } from "next";
import { Be_Vietnam_Pro } from "next/font/google";
import { AmbientBackdrop } from "./ambient-backdrop";
import { CustomCursor } from "./custom-cursor";
import "./globals.css";

const beVietnamPro = Be_Vietnam_Pro({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "CITYFARM 2.0 | Làm Vườn Đô Thị Bằng AI",
  description:
    "CITYFARM giúp cư dân đô thị quét không gian nhỏ, trồng thực phẩm sạch, theo dõi chăm sóc cây và trao đổi nông sản đã xác thực tại địa phương.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" className="h-full scroll-smooth antialiased">
      <body className={`${beVietnamPro.className} min-h-full`}>
        <AmbientBackdrop />
        <CustomCursor />
        <div className="relative z-[1]">{children}</div>
      </body>
    </html>
  );
}
