import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getSessionUser } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { ScheduleForm } from "@/components/schedule/schedule-form";

export const dynamic = "force-dynamic";

export default async function EditSchedulePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const { userId } = await getSessionUser();
  if (!userId) redirect(`/login?next=/schedule/${id}/edit`);

  const supabase = await createClient();
  const { data: schedule } = await supabase
    .from("schedules")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!schedule) notFound();
  if (schedule.author_id !== userId) redirect(`/schedule/${id}`);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link href={`/schedule/${id}`}>
          <ArrowLeft className="size-4" aria-hidden />
          상세로
        </Link>
      </Button>

      <div className="space-y-1">
        <h1 className="text-2xl font-bold">집회 일정 수정</h1>
        <p className="text-sm text-text-2">변경할 내용을 수정하세요.</p>
      </div>

      <ScheduleForm initial={schedule} />
    </div>
  );
}
