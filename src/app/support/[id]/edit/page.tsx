import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getSessionUser } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { SupportForm } from "@/components/support/support-form";

export const dynamic = "force-dynamic";

export default async function EditSupportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const { userId } = await getSessionUser();
  if (!userId) redirect(`/login?next=/support/${id}/edit`);

  const supabase = await createClient();
  const { data: support } = await supabase
    .from("support_requests")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!support) notFound();
  if (support.author_id !== userId) redirect(`/support/${id}`);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link href={`/support/${id}`}>
          <ArrowLeft className="size-4" aria-hidden />
          상세로
        </Link>
      </Button>

      <div className="space-y-1">
        <h1 className="text-2xl font-bold">지원요청 수정</h1>
        <p className="text-sm text-text-2">변경할 내용을 수정하세요.</p>
      </div>

      <SupportForm initial={support} />
    </div>
  );
}
