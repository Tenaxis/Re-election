"use client";

import { useCallback } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export type ScheduleTab = "upcoming" | "past";
export type ReportedFilter = "all" | "reported" | "unreported";

const TABS: { value: ScheduleTab; label: string }[] = [
  { value: "upcoming", label: "예정" },
  { value: "past", label: "지난" },
];

const REPORTED: { value: ReportedFilter; label: string }[] = [
  { value: "all", label: "전체" },
  { value: "reported", label: "신고 완료" },
  { value: "unreported", label: "미신고" },
];

export function ScheduleFilters({
  tab,
  region,
  from,
  to,
  reported,
}: {
  tab: ScheduleTab;
  region: string;
  from: string;
  to: string;
  reported: ReportedFilter;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const setParam = useCallback(
    (updates: Record<string, string>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (value) params.set(key, value);
        else params.delete(key);
      }
      const qs = params.toString();
      router.push(qs ? `${pathname}?${qs}` : pathname);
    },
    [router, pathname, searchParams],
  );

  return (
    <div className="space-y-4">
      {/* 예정/지난 탭 */}
      <div
        role="tablist"
        aria-label="일정 구분"
        className="inline-flex rounded-md border border-border bg-card p-1"
      >
        {TABS.map((t) => (
          <button
            key={t.value}
            type="button"
            role="tab"
            aria-selected={tab === t.value}
            onClick={() => setParam({ tab: t.value })}
            className={cn(
              "rounded-sm px-4 py-1.5 text-sm font-medium transition-colors",
              "outline-none focus-visible:ring-2 focus-visible:ring-ring",
              tab === t.value
                ? "bg-primary text-primary-foreground"
                : "text-text-2 hover:text-foreground",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* 필터: 기간 · 지역 · 신고여부 */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-1.5">
          <Label htmlFor="filter-from">시작일 이후</Label>
          <Input
            id="filter-from"
            type="date"
            defaultValue={from}
            onChange={(e) => setParam({ from: e.target.value })}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="filter-to">종료일 이전</Label>
          <Input
            id="filter-to"
            type="date"
            defaultValue={to}
            onChange={(e) => setParam({ to: e.target.value })}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="filter-region">지역</Label>
          <Input
            id="filter-region"
            type="search"
            defaultValue={region}
            placeholder="예) 서울, 광화문"
            onChange={(e) => setParam({ region: e.target.value })}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="filter-reported">신고 여부</Label>
          <select
            id="filter-reported"
            value={reported}
            onChange={(e) => setParam({ reported: e.target.value })}
            className={cn(
              "flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-base shadow-sm transition-colors",
              "focus-visible:outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30",
            )}
          >
            {REPORTED.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
