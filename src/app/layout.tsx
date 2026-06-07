import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { AppShell } from "@/components/app-shell";
import { RightRail } from "@/components/right-rail";
import { ServiceWorkerRegister } from "@/components/sw-register";
import { getSessionUser } from "@/lib/auth";

export const metadata: Metadata = {
  title: "재선거 — 집회·시위 운영 플랫폼",
  description:
    "집회·시위를 기록하고 운영하는 공간. 글·사진·영상 공유, 현장 지원, 집회 일정.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0b1120" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const { userId, profile } = await getSessionUser();

  return (
    <html lang="ko" suppressHydrationWarning className="h-full">
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.css"
        />
      </head>
      <body className="min-h-full">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground focus:shadow-lg"
        >
          본문 바로가기
        </a>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AppShell
            nickname={profile?.nickname ?? null}
            isLoggedIn={!!userId}
            isAdmin={profile?.role === "admin"}
            rightRail={<RightRail />}
          >
            {children}
          </AppShell>
          <Toaster />
          <ServiceWorkerRegister />
        </ThemeProvider>
      </body>
    </html>
  );
}
