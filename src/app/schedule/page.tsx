import Link from "next/link";
import { Plus, CalendarX2 } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getSessionUser } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { ScheduleCard } from "@/components/schedule/schedule-card";
import {
  ScheduleFilters,
  type ScheduleTab,
  type ReportedFilter,
} from "@/components/schedule/schedule-filters";

export const dynamic = "force-dynamic";

type SearchParams = {
  tab?: string;
  region?: string;
  from?: string;
  to?: string;
  reported?: string;
};

function normalizeTab(value: string | undefined): ScheduleTab {
  return value === "past" ? "past" : "upcoming";
}

function normalizeReported(value: string | undefined): ReportedFilter {
  return value === "reported" || value === "unreported" ? value : "all";
}

export default async function SchedulePage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const tab = normalizeTab(sp.tab);
  const reported = normalizeReported(sp.reported);
  const region = sp.region?.trim() ?? "";
  const from = sp.from?.trim() ?? "";
  const to = sp.to?.trim() ?? "";

  const { userId } = await getSessionUser();
  const supabase = await createClient();

  const nowIso = new Date().toISOString();

  let query = supabase.from("schedules").select("*");

  // 예정/지난 (starts_at 기준)
  if (tab === "upcoming") {
    query = query.gte("starts_at", nowIso).order("starts_at", { ascending: true });
  } else {
    query = query.lt("starts_at", nowIso).order("starts_at", { ascending: false });
  }

  // 기간 필터
  if (from) query = query.gte("starts_at", new Date(from).toISOString());
  if (to) {
    const toEnd = new Date(to);
    toEnd.setHours(23, 59, 59, 999);
    query = query.lte("starts_at", toEnd.toISOString());
  }

  // 지역 (address ilike)
  if (region) query = query.ilike("address", `%${region}%`);

  // 신고여부
  if (reported === "reported") query = query.eq("is_reported", true);
  else if (reported === "unreported") query = query.eq("is_reported", false);

  const { data: schedules } = await query;
  const list = schedules ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold">집회 일정</h1>
          <p className="text-sm text-text-2">예정된 집회와 지난 기록을 확인하세요.</p>
        </div>
        {userId ? (
          <Button asChild>
            <Link href="/schedule/new">
              <Plus className="size-4" aria-hidden />
              일정 등록
            </Link>
          </Button>
        ) : null}
      </div>

      <ScheduleFilters
        tab={tab}
        region={region}
        from={from}
        to={to}
        reported={reported}
      />

      {list.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border bg-card px-6 py-16 text-center">
          <CalendarX2 className="size-8 text-muted-foreground" aria-hidden />
          <p className="text-sm text-text-2">
            {tab === "upcoming"
              ? "조건에 맞는 예정된 일정이 없습니다."
              : "조건에 맞는 지난 일정이 없습니다."}
          </p>
          {userId ? (
            <Button asChild variant="secondary" size="sm">
              <Link href="/schedule/new">첫 일정 등록하기</Link>
            </Button>
          ) : null}
        </div>
      ) : (
        <ul className="space-y-3">
          {list.map((schedule) => (
            <li key={schedule.id}>
              <ScheduleCard schedule={schedule} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
