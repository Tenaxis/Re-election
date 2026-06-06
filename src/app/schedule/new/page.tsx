import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getSessionUser } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { ScheduleForm } from "@/components/schedule/schedule-form";

export default async function NewSchedulePage() {
  const { userId } = await getSessionUser();
  if (!userId) redirect("/login?next=/schedule/new");

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link href="/schedule">
          <ArrowLeft className="size-4" aria-hidden />
          목록으로
        </Link>
      </Button>

      <div className="space-y-1">
        <h1 className="text-2xl font-bold">집회 일정 등록</h1>
        <p className="text-sm text-text-2">집회의 이름·일시·장소를 입력하세요.</p>
      </div>

      <ScheduleForm />
    </div>
  );
}
