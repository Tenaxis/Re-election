"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Flag } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { createReport } from "@/app/reports/actions";
import type { ReportTarget } from "@/lib/types";

const TARGET_LABEL: Record<ReportTarget, string> = {
  post: "게시글",
  comment: "댓글",
  support: "지원요청",
};

/** 글/댓글/지원요청 신고 버튼. 비로그인 시 로그인 유도. */
export function ReportButton({
  targetType,
  targetId,
  isLoggedIn,
  className,
}: {
  targetType: ReportTarget;
  targetId: string;
  isLoggedIn: boolean;
  className?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [pending, startTransition] = useTransition();

  function onTrigger() {
    if (!isLoggedIn) {
      toast.error("로그인이 필요합니다.", {
        action: { label: "로그인", onClick: () => router.push("/login") },
      });
      return;
    }
    setOpen(true);
  }

  function onSubmit() {
    const trimmed = reason.trim();
    if (!trimmed) {
      toast.error("신고 사유를 입력하세요.");
      return;
    }
    startTransition(async () => {
      try {
        await createReport(targetType, targetId, trimmed);
        toast.success("신고가 접수되었습니다.");
        setReason("");
        setOpen(false);
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : "신고 접수에 실패했습니다.",
        );
      }
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={onTrigger}
        aria-label={`${TARGET_LABEL[targetType]} 신고`}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-md text-xs font-medium text-muted-foreground transition-colors hover:text-destructive",
          className,
        )}
      >
        <Flag className="size-4" aria-hidden />
        신고
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{TARGET_LABEL[targetType]} 신고</DialogTitle>
            <DialogDescription>
              신고 사유를 입력해주세요. 관리자가 검토 후 처리합니다.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-1.5">
            <Label htmlFor="report-reason">신고 사유</Label>
            <Textarea
              id="report-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              maxLength={1000}
              disabled={pending}
              placeholder="신고하려는 이유를 적어주세요."
            />
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="ghost" disabled={pending}>
                취소
              </Button>
            </DialogClose>
            <Button
              type="button"
              variant="destructive"
              onClick={onSubmit}
              disabled={pending}
            >
              {pending ? "접수 중…" : "신고하기"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
