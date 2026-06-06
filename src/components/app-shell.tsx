"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Calendar,
  User,
  PenLine,
  Megaphone,
  Map as MapIcon,
  HeartHandshake,
  ShieldAlert,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";

type NavItem = { href: string; label: string; icon: typeof Home };

// 데스크탑 사이드바: 전체
const NAV: NavItem[] = [
  { href: "/", label: "피드", icon: Home },
  { href: "/schedule", label: "일정", icon: Calendar },
  { href: "/map", label: "지도", icon: MapIcon },
  { href: "/support", label: "지원요청", icon: HeartHandshake },
  { href: "/me", label: "내정보", icon: User },
];

// 모바일 하단탭: 피드·일정 / [작성] / 지도·지원요청
const TAB_LEFT: NavItem[] = [NAV[0], NAV[1]];
const TAB_RIGHT: NavItem[] = [NAV[2], NAV[3]];

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(href + "/");
}

export function AppShell({
  children,
  nickname,
  isLoggedIn,
  isAdmin = false,
  rightRail,
}: {
  children: React.ReactNode;
  nickname: string | null;
  isLoggedIn: boolean;
  isAdmin?: boolean;
  rightRail?: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="min-h-dvh">
      {/* ── 데스크탑 사이드바 ── */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-border bg-background px-3 py-5 lg:flex">
        <Link href="/" className="mb-6 flex items-center gap-2 px-2">
          <span className="flex size-9 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Megaphone className="size-5" />
          </span>
          <span className="text-lg font-bold tracking-tight">광장</span>
        </Link>

        <nav className="flex flex-1 flex-col gap-1">
          {NAV.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                isActive(pathname, href)
                  ? "bg-primary/10 text-primary"
                  : "text-text-2 hover:bg-accent hover:text-foreground",
              )}
            >
              <Icon className="size-5" />
              {label}
            </Link>
          ))}
          {isAdmin && (
            <Link
              href="/admin"
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                isActive(pathname, "/admin")
                  ? "bg-primary/10 text-primary"
                  : "text-text-2 hover:bg-accent hover:text-foreground",
              )}
            >
              <ShieldAlert className="size-5" />
              관리자
            </Link>
          )}
          <Button asChild className="mt-2 justify-start gap-3" size="lg">
            <Link href="/post/new">
              <PenLine className="size-5" />
              글쓰기
            </Link>
          </Button>
        </nav>

        <div className="flex items-center justify-between border-t border-border pt-3">
          {isLoggedIn ? (
            <Link
              href="/me"
              className="truncate text-sm font-medium text-text-2 hover:text-foreground"
            >
              @{nickname ?? "..."}
            </Link>
          ) : (
            <Button asChild variant="secondary" size="sm">
              <Link href="/login">로그인</Link>
            </Button>
          )}
          <ThemeToggle />
        </div>
      </aside>

      {/* ── 모바일 상단 헤더 ── */}
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-background/90 px-4 backdrop-blur lg:hidden">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Megaphone className="size-4" />
          </span>
          <span className="text-base font-bold tracking-tight">광장</span>
        </Link>
        <div className="flex items-center gap-1">
          <ThemeToggle />
          {isLoggedIn ? (
            <Link
              href="/me"
              aria-label="내정보"
              className={cn(
                "rounded-md p-2 transition-colors",
                isActive(pathname, "/me")
                  ? "text-primary"
                  : "text-text-2 hover:text-foreground",
              )}
            >
              <User className="size-5" />
            </Link>
          ) : (
            <Button asChild variant="secondary" size="sm">
              <Link href="/login">로그인</Link>
            </Button>
          )}
        </div>
      </header>

      {/* ── 본문 ── */}
      <main
        id="main"
        tabIndex={-1}
        className="px-4 pb-24 pt-4 outline-none lg:pb-10 lg:pl-64 xl:pr-80"
      >
        <div className="mx-auto max-w-2xl">{children}</div>
      </main>

      {/* ── 데스크탑 우측 위젯 레일 ── */}
      {rightRail ? (
        <aside className="fixed inset-y-0 right-0 z-20 hidden w-80 overflow-y-auto border-l border-border bg-background px-4 py-6 xl:block">
          {rightRail}
        </aside>
      ) : null}

      {/* ── 모바일 하단 탭 ── */}
      <nav className="fixed inset-x-0 bottom-0 z-30 flex h-16 items-stretch border-t border-border bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden">
        {TAB_LEFT.map((item) => (
          <TabLink key={item.href} {...item} pathname={pathname} />
        ))}
        <ComposeTab />
        {TAB_RIGHT.map((item) => (
          <TabLink key={item.href} {...item} pathname={pathname} />
        ))}
      </nav>
    </div>
  );
}

function TabLink({
  href,
  label,
  icon: Icon,
  pathname,
}: NavItem & { pathname: string }) {
  const active = isActive(pathname, href);
  return (
    <Link
      href={href}
      className={cn(
        "flex flex-1 flex-col items-center justify-center gap-0.5 text-[11px] font-medium transition-colors",
        active ? "text-primary" : "text-muted-foreground hover:text-foreground",
      )}
    >
      <Icon className="size-5" />
      {label}
    </Link>
  );
}

function ComposeTab() {
  return (
    <div className="flex flex-1 items-center justify-center">
      <Link
        href="/post/new"
        aria-label="글쓰기"
        className="flex size-12 -translate-y-3 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 transition-transform active:scale-95"
      >
        <PenLine className="size-5" />
      </Link>
    </div>
  );
}
