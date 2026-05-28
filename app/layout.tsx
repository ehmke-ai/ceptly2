import type { Metadata } from "next";
import { Geist, Geist_Mono, Montserrat } from "next/font/google";
import { cookies, headers } from "next/headers";
import { AccountHeader } from "@/components/account-header";
import { Providers } from "@/components/providers";
import { getCurrentUser } from "@/lib/auth/server";
import { THEME_COOKIE_NAME, resolveTheme } from "@/lib/theme";
import { THEME_COOKIE_SEED_SCRIPT } from "@/lib/theme-cookie-script";
import { cn } from "@/lib/utils";
import { createSiteMetadata } from "@/lib/site-metadata";
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

export const metadata: Metadata = createSiteMetadata();

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getCurrentUser();
  const headersList = await headers();
  const pathname = headersList.get("x-pathname") ?? "";
  const hideHeader =
    pathname.startsWith("/auth") || pathname.startsWith("/onboarding");
  const cookieStore = await cookies();
  const initialTheme = resolveTheme(cookieStore.get(THEME_COOKIE_NAME)?.value);

  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn("h-full", initialTheme === "dark" && "dark")}
    >
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${montserrat.variable} min-h-full flex flex-col antialiased bg-background text-foreground selection:bg-primary/20 selection:text-primary`}
      >
        <script
          dangerouslySetInnerHTML={{ __html: THEME_COOKIE_SEED_SCRIPT }}
        />
        <MyStatsig authUser={user}>
          <Analytics />
          <Providers initialTheme={initialTheme}>
            {user && !hideHeader ? <AccountHeader user={user} /> : null}
            <main className="flex flex-1 flex-col">{children}</main>
          </Providers>
        </MyStatsig>
      </body>
    </html>
  );
}
