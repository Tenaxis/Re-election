"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Calendar, User, PenLine, Megaphone } from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";

type NavItem = { href: string; label: string; icon: typeof Home };

const NAV: NavItem[] = [
  { href: "/", label: "피드", icon: Home },
  { href: "/schedule", label: "일정", icon: Calendar },
  { href: "/me", label: "내정보", icon: User },
];

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(href + "/");
}

export function AppShell({
  children,
  nickname,
  isLoggedIn,
}: {
  children: React.ReactNode;
  nickname: string | null;
  isLoggedIn: boolean;
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
          {!isLoggedIn && (
            <Button asChild variant="secondary" size="sm">
              <Link href="/login">로그인</Link>
            </Button>
          )}
        </div>
      </header>

      {/* ── 본문 ── */}
      <main className="mx-auto w-full max-w-2xl px-4 pb-24 pt-4 lg:pl-64 lg:pb-10 lg:pr-8">
        <div className="lg:mx-auto lg:max-w-2xl">{children}</div>
      </main>

      {/* ── 모바일 하단 탭 ── */}
      <nav className="fixed inset-x-0 bottom-0 z-30 flex h-16 items-stretch border-t border-border bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden">
        {NAV.slice(0, 1).map((item) => (
          <TabLink key={item.href} {...item} pathname={pathname} />
        ))}
        <TabLink {...NAV[1]} pathname={pathname} />
        <ComposeTab />
        <TabLink {...NAV[2]} pathname={pathname} />
        <div className="flex flex-1 items-center justify-center">
          <ThemeToggle />
        </div>
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
