import Link from "next/link";
import { Plus, Inbox } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getSessionUser } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { SupportCard } from "@/components/support/support-card";
import {
  SupportFilters,
  type TypeFilter,
  type StatusFilter,
} from "@/components/support/support-filters";
import { RealtimeBanner } from "@/components/realtime-banner";

export const dynamic = "force-dynamic";

type SearchParams = {
  type?: string;
  status?: string;
};

function normalizeType(value: string | undefined): TypeFilter {
  return value === "manpower" ||
    value === "food" ||
    value === "hazard" ||
    value === "cleanup"
    ? value
    : "all";
}

function normalizeStatus(value: string | undefined): StatusFilter {
  return value === "open" || value === "in_progress" || value === "done"
    ? value
    : "all";
}

export default async function SupportPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const type = normalizeType(sp.type);
  const status = normalizeStatus(sp.status);

  const { userId } = await getSessionUser();
  const supabase = await createClient();

  let query = supabase
    .from("support_requests")
    .select("*")
    .order("created_at", { ascending: false });

  if (type !== "all") query = query.eq("type", type);
  if (status !== "all") query = query.eq("status", status);

  const { data: supports } = await query;
  const list = supports ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold">지원요청</h1>
          <p className="text-sm text-text-2">현장에 필요한 지원을 요청하고 확인하세요.</p>
        </div>
        {userId ? (
          <Button asChild>
            <Link href="/support/new">
              <Plus className="size-4" aria-hidden />
              지원 요청하기
            </Link>
          </Button>
        ) : null}
      </div>

      <SupportFilters type={type} status={status} />

      <RealtimeBanner
        table="support_requests"
        label="지원요청"
        excludeAuthorId={userId}
      />

      {list.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border bg-card px-6 py-16 text-center">
          <Inbox className="size-8 text-muted-foreground" aria-hidden />
          <p className="text-sm text-text-2">조건에 맞는 지원요청이 없습니다.</p>
          {userId ? (
            <Button asChild variant="secondary" size="sm">
              <Link href="/support/new">첫 지원요청 등록하기</Link>
            </Button>
          ) : null}
        </div>
      ) : (
        <ul className="space-y-3">
          {list.map((support) => (
            <li key={support.id}>
              <SupportCard support={support} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
