import "./globals.css";
import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque } from "next/font/google";

const font = Bricolage_Grotesque({ subsets: ["latin"], variable: "--font" });
export const metadata: Metadata = { title: "Daybook", manifest: "/manifest.json", appleWebApp: { capable: true, title: "Daybook" } };
export const viewport: Viewport = { themeColor: "#0E6B5C", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={font.variable}>
      <body>{children}</body>
    </html>
  );
}
