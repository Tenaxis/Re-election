import Link from "next/link";
import { CalendarClock, Hash } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { formatDateTime } from "@/lib/format";

/** 데스크탑(xl+) 우측 위젯: 다가오는 집회 + 인기 태그. */
export async function RightRail() {
  const supabase = await createClient();
  const nowIso = new Date().toISOString();

  const [{ data: schedules }, { data: tagRows }] = await Promise.all([
    supabase
      .from("schedules")
      .select("id, name, starts_at, address")
      .gte("starts_at", nowIso)
      .order("starts_at", { ascending: true })
      .limit(4),
    supabase.from("post_tags").select("tag").limit(300),
  ]);

  const tagCounts = new Map<string, number>();
  for (const r of tagRows ?? []) {
    tagCounts.set(r.tag, (tagCounts.get(r.tag) ?? 0) + 1);
  }
  const topTags = [...tagCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([tag]) => tag);

  return (
    <div className="space-y-5">
      <section className="rounded-lg border border-border bg-card p-4">
        <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold">
          <CalendarClock className="size-4 text-primary" />
          다가오는 집회
        </h2>
        {schedules && schedules.length > 0 ? (
          <ul className="space-y-3">
            {schedules.map((s) => (
              <li key={s.id}>
                <Link
                  href={`/schedule/${s.id}`}
                  className="block rounded-md p-2 -mx-2 transition-colors hover:bg-accent"
                >
                  <p className="truncate text-sm font-medium">{s.name}</p>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">
                    {formatDateTime(s.starts_at)}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">예정된 집회가 없습니다.</p>
        )}
        <Link
          href="/schedule"
          className="mt-3 inline-block text-xs font-medium text-primary hover:underline"
        >
          전체 일정 보기 →
        </Link>
      </section>

      {topTags.length > 0 && (
        <section className="rounded-lg border border-border bg-card p-4">
          <h2 className="mb-3 text-sm font-semibold">인기 태그</h2>
          <ul className="flex flex-wrap gap-1.5">
            {topTags.map((tag) => (
              <li key={tag}>
                <Link
                  href={`/?tag=${encodeURIComponent(tag)}`}
                  className="inline-flex items-center gap-0.5 rounded-full bg-secondary px-2.5 py-1 text-xs text-text-2 transition-colors hover:bg-accent"
                >
                  <Hash className="size-3" />
                  {tag}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
