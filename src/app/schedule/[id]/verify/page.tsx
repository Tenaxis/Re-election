import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, CheckCircle2, ShieldAlert } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getSessionUser } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatDateTime } from "@/lib/format";
import { VerifyForm } from "@/components/attendance/verify-form";

export const dynamic = "force-dynamic";

export default async function VerifyAttendancePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const { userId } = await getSessionUser();
  if (!userId) redirect(`/login?next=/schedule/${id}/verify`);

  const supabase = await createClient();
  const { data: schedule } = await supabase
    .from("schedules")
    .select("id, name, starts_at, address, lat, lng, verify_code, verify_radius_m")
    .eq("id", id)
    .maybeSingle();

  if (!schedule) notFound();

  const today = new Date().toISOString().slice(0, 10);
  const { data: existing } = await supabase
    .from("attendance_verifications")
    .select("id")
    .eq("schedule_id", id)
    .eq("user_id", userId)
    .eq("verified_date", today)
    .maybeSingle();

  const canVerify =
    schedule.lat != null && schedule.lng != null && Boolean(schedule.verify_code);

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link href={`/schedule/${id}`}>
          <ArrowLeft className="size-4" aria-hidden />
          일정으로
        </Link>
      </Button>

      <div className="space-y-1">
        <h1 className="text-2xl font-bold">참여 인증</h1>
        <p className="text-sm text-text-2">
          {schedule.name} · {formatDateTime(schedule.starts_at)}
        </p>
      </div>

      {existing ? (
        <Card>
          <CardContent className="flex items-center gap-3 p-6">
            <CheckCircle2 className="size-6 shrink-0 text-success" aria-hidden />
            <div>
              <p className="font-semibold">오늘 인증 완료</p>
              <p className="text-sm text-text-2">
                이 집회에 오늘 참여 인증을 마쳤습니다. (하루 1회)
              </p>
            </div>
          </CardContent>
        </Card>
      ) : !canVerify ? (
        <Card>
          <CardContent className="flex items-start gap-3 p-6">
            <ShieldAlert className="mt-0.5 size-6 shrink-0 text-warning" aria-hidden />
            <div className="space-y-1">
              <p className="font-semibold">주최자가 인증을 설정하지 않았습니다.</p>
              <p className="text-sm text-text-2">
                참여 인증에는 집회 좌표와 현장 코드가 필요합니다. 주최자에게
                인증 설정을 요청해주세요.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-6">
            <VerifyForm scheduleId={id} userId={userId} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
