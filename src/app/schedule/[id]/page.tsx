import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarClock, MapPin, Pencil, ArrowLeft, Users, ShieldCheck, KeyRound, Radio } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getSessionUser } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { formatDateTime, initial } from "@/lib/format";
import { ShareButton } from "@/components/share-button";
import { deleteSchedule } from "@/app/schedule/actions";

export const dynamic = "force-dynamic";

export default async function ScheduleDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: schedule } = await supabase
    .from("schedules")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!schedule) notFound();

  const { data: author } = await supabase
    .from("profiles")
    .select("id, nickname")
    .eq("id", schedule.author_id)
    .maybeSingle();

  const { userId } = await getSessionUser();
  const isOwner = Boolean(userId && userId === schedule.author_id);

  const { data: todayRow } = await supabase
    .from("attendance_today")
    .select("cnt")
    .eq("schedule_id", id)
    .maybeSingle();
  const attendanceCount = todayRow?.cnt ?? 0;

  const canVerify =
    schedule.lat != null && schedule.lng != null && Boolean(schedule.verify_code);

  const { count: liveCount } = await supabase
    .from("live_streams")
    .select("id", { count: "exact", head: true })
    .eq("schedule_id", id);

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link href="/schedule">
          <ArrowLeft className="size-4" aria-hidden />
          목록으로
        </Link>
      </Button>

      <Card>
        <CardContent className="space-y-5 p-6 pt-6">
          <div className="flex items-start justify-between gap-3">
            <h1 className="text-2xl font-bold leading-snug">{schedule.name}</h1>
            {schedule.is_reported ? (
              <Badge variant="success" className="shrink-0">
                신고 완료
              </Badge>
            ) : (
              <Badge variant="warning" className="shrink-0">
                미신고
              </Badge>
            )}
          </div>

          <dl className="space-y-3 text-sm">
            <div className="flex items-start gap-3">
              <CalendarClock className="mt-0.5 size-5 shrink-0 text-muted-foreground" aria-hidden />
              <div>
                <dt className="font-medium text-text-2">일시</dt>
                <dd className="mt-0.5">
                  {formatDateTime(schedule.starts_at)}
                  {schedule.ends_at ? ` ~ ${formatDateTime(schedule.ends_at)}` : ""}
                </dd>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <MapPin className="mt-0.5 size-5 shrink-0 text-muted-foreground" aria-hidden />
              <div>
                <dt className="font-medium text-text-2">장소</dt>
                <dd className="mt-0.5 whitespace-pre-wrap">{schedule.address}</dd>
              </div>
            </div>
          </dl>

          <div className="flex items-center gap-2 border-t border-border pt-4">
            <Users className="size-4 shrink-0 text-success" aria-hidden />
            <span className="text-sm font-medium">
              오늘 인증 {attendanceCount}명
            </span>
          </div>

          <div className="flex items-center gap-2 border-t border-border pt-4">
            <Avatar className="size-8">
              <AvatarFallback>{initial(author?.nickname)}</AvatarFallback>
            </Avatar>
            <span className="text-sm text-text-2">
              {author?.nickname ?? "익명"}
            </span>
            <div className="ml-auto">
              <ShareButton title={schedule.name} text={`${formatDateTime(schedule.starts_at)} · ${schedule.address}`} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Button asChild variant="secondary" className="w-full">
        <Link href={`/schedule/${schedule.id}/live`}>
          <Radio className="size-4" aria-hidden />
          실시간 라이브{liveCount ? ` (${liveCount})` : ""}
        </Link>
      </Button>

      {userId ? (
        canVerify ? (
          <Button asChild className="w-full">
            <Link href={`/schedule/${schedule.id}/verify`}>
              <ShieldCheck className="size-4" aria-hidden />
              참여 인증하기
            </Link>
          </Button>
        ) : (
          <p className="rounded-md border border-border bg-card p-3 text-sm text-text-2">
            아직 주최자가 참여 인증을 설정하지 않았습니다.
          </p>
        )
      ) : (
        <Button asChild className="w-full">
          <Link href={`/login?next=/schedule/${schedule.id}/verify`}>
            <ShieldCheck className="size-4" aria-hidden />
            로그인하고 참여 인증하기
          </Link>
        </Button>
      )}

      {isOwner ? (
        <Card>
          <CardContent className="space-y-2 p-4">
            <div className="flex items-center gap-2 text-sm font-medium">
              <KeyRound className="size-4 shrink-0 text-primary" aria-hidden />
              현장 인증 코드 (참가자에게 불러줄 코드)
            </div>
            {schedule.verify_code ? (
              <p className="font-mono text-lg font-semibold tracking-wider">
                {schedule.verify_code}
              </p>
            ) : (
              <p className="text-sm text-text-2">
                인증 코드가 설정되지 않았습니다. 일정 수정에서 코드와 좌표를
                입력하면 참여 인증을 받을 수 있습니다.
              </p>
            )}
          </CardContent>
        </Card>
      ) : null}

      {isOwner ? (
        <div className="flex items-center gap-2">
          <Button asChild variant="secondary">
            <Link href={`/schedule/${schedule.id}/edit`}>
              <Pencil className="size-4" aria-hidden />
              수정
            </Link>
          </Button>
          <form action={deleteSchedule}>
            <input type="hidden" name="id" value={schedule.id} />
            <Button type="submit" variant="destructive">
              삭제
            </Button>
          </form>
        </div>
      ) : null}
    </div>
  );
}
