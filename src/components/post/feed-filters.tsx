"use client";

import { useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Period = "" | "day" | "week" | "month";

const PERIODS: { value: Period; label: string }[] = [
  { value: "", label: "전체" },
  { value: "day", label: "오늘" },
  { value: "week", label: "이번 주" },
  { value: "month", label: "이번 달" },
];

/** 태그 검색 + 기간 필터. URL searchParams를 갱신해 서버에서 재조회. */
export function FeedFilters() {
  const router = useRouter();
  const params = useSearchParams();

  const [tag, setTag] = useState(params.get("tag") ?? "");
  const period = (params.get("period") ?? "") as Period;

  function pushParams(next: { tag?: string; period?: Period }) {
    const sp = new URLSearchParams(params.toString());
    const t = next.tag ?? tag;
    const p = next.period ?? period;
    if (t.trim()) sp.set("tag", t.trim());
    else sp.delete("tag");
    if (p) sp.set("period", p);
    else sp.delete("period");
    const qs = sp.toString();
    router.push(qs ? `/?${qs}` : "/");
  }

  function onSearch(e: FormEvent) {
    e.preventDefault();
    pushParams({});
  }

  const hasFilter = !!tag.trim() || !!period;

  return (
    <div className="space-y-3">
      <form onSubmit={onSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={tag}
            onChange={(e) => setTag(e.target.value)}
            placeholder="태그 검색"
            className="pl-9"
            aria-label="태그 검색"
          />
        </div>
        <Button type="submit" variant="secondary">
          검색
        </Button>
      </form>

      <div className="flex flex-wrap items-center gap-1.5">
        {PERIODS.map((p) => (
          <button
            key={p.value || "all"}
            type="button"
            onClick={() => pushParams({ period: p.value })}
            className={cn(
              "rounded-full px-3 py-1 text-xs font-medium transition-colors",
              period === p.value
                ? "bg-primary/10 text-primary"
                : "bg-secondary text-text-2 hover:text-foreground",
            )}
          >
            {p.label}
          </button>
        ))}
        {hasFilter && (
          <button
            type="button"
            onClick={() => {
              setTag("");
              router.push("/");
            }}
            className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs text-muted-foreground hover:text-foreground"
          >
            <X className="size-3" />
            초기화
          </button>
        )}
      </div>
    </div>
  );
}
