import type { Metadata } from "next";
import { Geist, Geist_Mono, Montserrat } from "next/font/google";
import { AccountHeader } from "@/components/account-header";
import { Providers } from "@/components/providers";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next";
import MyStatsig from "./my-statsig";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Ceptly - Visual Ideation Platform",
  description:
    "Create and visualize algorithms with collaborative visual tools",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="h-full">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${montserrat.variable} min-h-full flex flex-col antialiased bg-background text-foreground selection:bg-primary/20 selection:text-primary`}
      >
        <MyStatsig>
          <Analytics />
          <Providers>
            <AccountHeader />
            <main className="flex flex-1 flex-col">{children}</main>
          </Providers>
        </MyStatsig>
      </body>
    </html>
  );
}
