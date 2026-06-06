"use client";

import { useCallback } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { SupportType, SupportStatus } from "@/lib/types";

export type TypeFilter = "all" | SupportType;
export type StatusFilter = "all" | SupportStatus;

const TYPES: { value: TypeFilter; label: string }[] = [
  { value: "all", label: "전체" },
  { value: "manpower", label: "위치(인력)" },
  { value: "food", label: "음식" },
  { value: "hazard", label: "분신물 신고" },
  { value: "cleanup", label: "현장 정리" },
];

const STATUSES: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "전체" },
  { value: "open", label: "요청중" },
  { value: "in_progress", label: "진행중" },
  { value: "done", label: "완료" },
];

const selectClass = cn(
  "flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-base shadow-sm transition-colors",
  "focus-visible:outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30",
);

export function SupportFilters({
  type,
  status,
}: {
  type: TypeFilter;
  status: StatusFilter;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const setParam = useCallback(
    (updates: Record<string, string>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (value && value !== "all") params.set(key, value);
        else params.delete(key);
      }
      const qs = params.toString();
      router.push(qs ? `${pathname}?${qs}` : pathname);
    },
    [router, pathname, searchParams],
  );

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <div className="space-y-1.5">
        <Label htmlFor="filter-type">유형</Label>
        <select
          id="filter-type"
          value={type}
          onChange={(e) => setParam({ type: e.target.value })}
          className={selectClass}
        >
          {TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="filter-status">상태</Label>
        <select
          id="filter-status"
          value={status}
          onChange={(e) => setParam({ status: e.target.value })}
          className={selectClass}
        >
          {STATUSES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
