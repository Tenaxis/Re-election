import Link from "next/link";
import { notFound } from "next/navigation";
import { MapPin, Clock, Pencil, ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getSessionUser } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { formatDateTime, initial } from "@/lib/format";
import {
  SUPPORT_TYPE_META,
  SUPPORT_STATUS_META,
} from "@/components/support/support-card";
import { SupportStatusControl } from "@/components/support/support-status-control";
import { deleteSupport } from "@/app/support/actions";

export const dynamic = "force-dynamic";

export default async function SupportDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: support } = await supabase
    .from("support_requests")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!support) notFound();

  const { data: author } = await supabase
    .from("profiles")
    .select("id, nickname")
    .eq("id", support.author_id)
    .maybeSingle();

  const { userId, profile } = await getSessionUser();
  const isOwner = Boolean(userId && userId === support.author_id);
  const isAdmin = profile?.role === "admin";
  const canManage = isOwner || isAdmin;

  const type = SUPPORT_TYPE_META[support.type];
  const status = SUPPORT_STATUS_META[support.status];
  const TypeIcon = type.icon;

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link href="/support">
          <ArrowLeft className="size-4" aria-hidden />
          목록으로
        </Link>
      </Button>

      <Card>
        <CardContent className="space-y-5 p-6 pt-6">
          <div className="flex items-center justify-between gap-3">
            <Badge variant="outline">
              <TypeIcon className="size-3.5" aria-hidden />
              {type.label}
            </Badge>
            <Badge variant={status.variant} className="shrink-0">
              {status.label}
            </Badge>
          </div>

          <p className="whitespace-pre-wrap text-base leading-relaxed">
            {support.body}
          </p>

          <dl className="space-y-3 text-sm">
            {support.address ? (
              <div className="flex items-start gap-3">
                <MapPin className="mt-0.5 size-5 shrink-0 text-muted-foreground" aria-hidden />
                <div>
                  <dt className="font-medium text-text-2">위치</dt>
                  <dd className="mt-0.5 whitespace-pre-wrap">{support.address}</dd>
                </div>
              </div>
            ) : null}

            <div className="flex items-start gap-3">
              <Clock className="mt-0.5 size-5 shrink-0 text-muted-foreground" aria-hidden />
              <div>
                <dt className="font-medium text-text-2">등록 시간</dt>
                <dd className="mt-0.5">{formatDateTime(support.created_at)}</dd>
              </div>
            </div>
          </dl>

          <div className="flex items-center gap-2 border-t border-border pt-4">
            <Avatar className="size-8">
              <AvatarFallback>{initial(author?.nickname)}</AvatarFallback>
            </Avatar>
            <span className="text-sm text-text-2">{author?.nickname ?? "익명"}</span>
          </div>
        </CardContent>
      </Card>

      {canManage ? (
        <Card>
          <CardContent className="space-y-4 p-6 pt-6">
            <SupportStatusControl id={support.id} status={support.status} />

            <div className="flex items-center gap-2 border-t border-border pt-4">
              {isOwner ? (
                <Button asChild variant="secondary">
                  <Link href={`/support/${support.id}/edit`}>
                    <Pencil className="size-4" aria-hidden />
                    수정
                  </Link>
                </Button>
              ) : null}
              <form action={deleteSupport}>
                <input type="hidden" name="id" value={support.id} />
                <Button type="submit" variant="destructive">
                  삭제
                </Button>
              </form>
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
