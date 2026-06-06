"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowUp } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

/**
 * Supabase Realtime로 특정 테이블의 새 INSERT를 감지해
 * "새 N개 — 보기" 배너를 표시. 클릭 시 목록 새로고침.
 */
export function RealtimeBanner({
  table,
  label,
  excludeAuthorId,
}: {
  table: "posts" | "support_requests";
  label: string;
  excludeAuthorId?: string | null;
}) {
  const router = useRouter();
  const [count, setCount] = useState(0);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`realtime:${table}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table },
        (payload) => {
          const authorId = (payload.new as { author_id?: string })?.author_id;
          if (excludeAuthorId && authorId === excludeAuthorId) return;
          setCount((c) => c + 1);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [table, excludeAuthorId]);

  if (count === 0) return null;

  return (
    <div className="sticky top-2 z-20 flex justify-center">
      <button
        type="button"
        onClick={() => {
          setCount(0);
          router.refresh();
        }}
        className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-lg shadow-primary/30 transition-transform active:scale-95"
      >
        <ArrowUp className="size-4" />
        새 {label} {count}개 — 보기
      </button>
    </div>
  );
}
