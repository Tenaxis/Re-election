import Link from "next/link";
import { redirect } from "next/navigation";
import { ShieldCheck, Inbox, ExternalLink } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getSessionUser } from "@/lib/auth";
import { formatRelativeTime } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ReportAdminActions } from "@/components/report/report-admin-actions";
import type { Report, ReportTarget } from "@/lib/types";

export const dynamic = "force-dynamic";

const TARGET_LABEL: Record<ReportTarget, string> = {
  post: "게시글",
  comment: "댓글",
  support: "지원요청",
};

type Preview = { body: string; href: string | null };

function truncate(text: string, max = 160): string {
  const trimmed = text.trim();
  return trimmed.length > max ? `${trimmed.slice(0, max)}…` : trimmed;
}

/** target_type별로 콘텐츠 미리보기/링크를 일괄 조회한다. */
async function loadPreviews(
  supabase: Awaited<ReturnType<typeof createClient>>,
  reports: Report[],
): Promise<Map<string, Preview>> {
  const byType: Record<ReportTarget, string[]> = {
    post: [],
    comment: [],
    support: [],
  };
  for (const r of reports) byType[r.target_type].push(r.target_id);

  const previews = new Map<string, Preview>();

  if (byType.post.length) {
    const { data } = await supabase
      .from("posts")
      .select("id, body")
      .in("id", byType.post);
    for (const row of data ?? []) {
      previews.set(`post:${row.id}`, {
        body: truncate(row.body),
        href: `/post/${row.id}`,
      });
    }
  }

  if (byType.comment.length) {
    const { data } = await supabase
      .from("comments")
      .select("id, body, post_id")
      .in("id", byType.comment);
    for (const row of data ?? []) {
      previews.set(`comment:${row.id}`, {
        body: truncate(row.body),
        href: `/post/${row.post_id}#comment-${row.id}`,
      });
    }
  }

  if (byType.support.length) {
    const { data } = await supabase
      .from("support_requests")
      .select("id, body")
      .in("id", byType.support);
    for (const row of data ?? []) {
      previews.set(`support:${row.id}`, {
        body: truncate(row.body),
        href: `/support/${row.id}`,
      });
    }
  }

  return previews;
}

export default async function AdminPage() {
  const { profile } = await getSessionUser();
  if (profile?.role !== "admin") redirect("/");

  const supabase = await createClient();
  const { data: reports } = await supabase
    .from("reports")
    .select("*")
    .eq("status", "open")
    .order("created_at", { ascending: false });

  const list = reports ?? [];
  const previews = await loadPreviews(supabase, list);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <ShieldCheck className="size-7 text-primary" aria-hidden />
        <div className="space-y-1">
          <h1 className="text-2xl font-bold">관리자 대시보드</h1>
          <p className="text-sm text-text-2">
            접수된 신고를 검토하고 처리하세요.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-3">
        <span className="text-sm text-text-2">미처리 신고</span>
        <Badge variant={list.length > 0 ? "danger" : "success"}>
          {list.length}건
        </Badge>
      </div>

      {list.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border bg-card px-6 py-16 text-center">
          <Inbox className="size-8 text-muted-foreground" aria-hidden />
          <p className="text-sm text-text-2">처리할 신고가 없습니다.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {list.map((report) => {
            const preview = previews.get(
              `${report.target_type}:${report.target_id}`,
            );
            const contentExists = Boolean(preview);
            return (
              <li key={report.id}>
                <Card>
                  <CardHeader className="flex-row items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">
                        {TARGET_LABEL[report.target_type]}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {formatRelativeTime(report.created_at)}
                      </span>
                    </div>
                    {preview?.href ? (
                      <Link
                        href={preview.href}
                        className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                      >
                        대상 보기
                        <ExternalLink className="size-3.5" aria-hidden />
                      </Link>
                    ) : null}
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-text-2">신고 사유</p>
                      <p className="text-sm whitespace-pre-wrap break-words">
                        {report.reason}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-text-2">
                        대상 콘텐츠
                      </p>
                      <p className="text-sm whitespace-pre-wrap break-words text-text-2">
                        {preview ? preview.body : "삭제되었거나 찾을 수 없는 콘텐츠입니다."}
                      </p>
                    </div>
                    <ReportAdminActions
                      reportId={report.id}
                      targetType={report.target_type}
                      targetId={report.target_id}
                      contentExists={contentExists}
                    />
                  </CardContent>
                </Card>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
