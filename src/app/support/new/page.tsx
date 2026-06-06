import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getSessionUser } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { SupportForm } from "@/components/support/support-form";

export default async function NewSupportPage() {
  const { userId } = await getSessionUser();
  if (!userId) redirect("/login?next=/support/new");

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link href="/support">
          <ArrowLeft className="size-4" aria-hidden />
          목록으로
        </Link>
      </Button>

      <div className="space-y-1">
        <h1 className="text-2xl font-bold">지원 요청하기</h1>
        <p className="text-sm text-text-2">필요한 지원 유형과 내용을 입력하세요.</p>
      </div>

      <SupportForm />
    </div>
  );
}
