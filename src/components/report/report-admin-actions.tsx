"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { resolveReport, deleteReportedContent } from "@/app/admin/actions";
import type { ReportTarget } from "@/lib/types";

/** 관리자 신고 처리 액션(콘텐츠 삭제 / 신고 해결). */
export function ReportAdminActions({
  reportId,
  targetType,
  targetId,
  contentExists,
}: {
  reportId: string;
  targetType: ReportTarget;
  targetId: string;
  contentExists: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function onResolve() {
    startTransition(async () => {
      try {
        await resolveReport(reportId);
        toast.success("신고를 해결 처리했습니다.");
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "처리에 실패했습니다.");
      }
    });
  }

  function onDelete() {
    if (!confirm("신고된 콘텐츠를 삭제하시겠습니까? 되돌릴 수 없습니다.")) return;
    startTransition(async () => {
      try {
        await deleteReportedContent(targetType, targetId, reportId);
        toast.success("콘텐츠를 삭제하고 신고를 해결했습니다.");
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "삭제에 실패했습니다.");
      }
    });
  }

  return (
    <div className="flex flex-wrap gap-2">
      {contentExists ? (
        <Button
          type="button"
          variant="destructive"
          size="sm"
          onClick={onDelete}
          disabled={pending}
        >
          <Trash2 className="size-4" aria-hidden />
          콘텐츠 삭제
        </Button>
      ) : null}
      <Button
        type="button"
        variant="secondary"
        size="sm"
        onClick={onResolve}
        disabled={pending}
      >
        <Check className="size-4" aria-hidden />
        신고 해결
      </Button>
    </div>
  );
}
