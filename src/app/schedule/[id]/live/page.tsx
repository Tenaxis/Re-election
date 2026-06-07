import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Radio } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getSessionUser } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { LiveMultiview } from "@/components/live/live-multiview";
import { AddLiveForm } from "@/components/live/add-live-form";
import type { LiveStream } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function ScheduleLivePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: schedule } = await supabase
    .from("schedules")
    .select("id, name")
    .eq("id", id)
    .maybeSingle();
  if (!schedule) notFound();

  const { data: streamRows } = await supabase
    .from("live_streams")
    .select("*")
    .eq("schedule_id", id)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });
  const streams = (streamRows ?? []) as LiveStream[];

  const { userId, profile } = await getSessionUser();
  const isAdmin = profile?.role === "admin";
  const manageableIds = streams
    .filter((s) => isAdmin || s.added_by === userId)
    .map((s) => s.id);

  return (
    <div className="space-y-5">
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link href={`/schedule/${id}`}>
          <ArrowLeft className="size-4" aria-hidden />
          집회로
        </Link>
      </Button>

      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <h1 className="flex items-center gap-2 text-2xl font-bold">
            <Radio className="size-6 text-primary" aria-hidden />
            실시간 라이브
          </h1>
          <p className="text-sm text-text-2">{schedule.name}</p>
        </div>
        {userId ? (
          <AddLiveForm scheduleId={id} />
        ) : (
          <Button asChild variant="secondary">
            <Link href={`/login?next=/schedule/${id}/live`}>로그인</Link>
          </Button>
        )}
      </div>

      {streams.length > 1 && (
        <p className="text-xs text-muted-foreground">
          모든 화면이 음소거로 동시 재생됩니다. 화면을 누르면 그 화면만 소리가 켜집니다.
          (동시 재생이 많으면 느려질 수 있습니다)
        </p>
      )}

      <LiveMultiview
        scheduleId={id}
        streams={streams}
        manageableIds={manageableIds}
      />
    </div>
  );
}
