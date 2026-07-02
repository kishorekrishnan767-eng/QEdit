import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Qedit — Question Paper Editor",
  description: "Create and format exam question papers with ease",
  icons: {
    icon: "/logohead.png",
    shortcut: "/logohead.png",
    apple: "/logohead.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/logohead.png" type="image/png" />
        <link rel="shortcut icon" href="/logohead.png" type="image/png" />
        <link rel="apple-touch-icon" href="/logohead.png" />
      </head>
      <body className={`${dmSans.variable} antialiased`}>
        {children}
        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  );
}
