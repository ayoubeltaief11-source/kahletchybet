import "./globals.css";
import type { Metadata, Viewport } from "next";
import Shell from "@/components/Shell";

export const metadata: Metadata = {
  title: "kahlatchybet - Sports & Casino Demo Platform",
  description: "Premium educational demonstration of a sportsbook and casino platform. Virtual credits only, no real-money gambling.",
  keywords: ["kahlatchybet", "sportsbook demo", "casino platform", "educational simulation"],
  openGraph: { title: "kahlatchybet", description: "Sports & Casino demo platform - virtual credits only.", type: "website" },
  robots: { index: true, follow: true },
};
export const viewport: Viewport = { themeColor: "#06080B", width: "device-width", initialScale: 1, viewportFit: "cover" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" dir="ltr" suppressHydrationWarning>
      <head><meta charSet="utf-8" /></head>
      <body><div className="fx" aria-hidden /><Shell>{children}</Shell></body>
    </html>
  );
}