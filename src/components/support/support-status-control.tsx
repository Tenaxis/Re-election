"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { updateSupportStatus } from "@/app/support/actions";
import type { SupportStatus } from "@/lib/types";

const STATUSES: { value: SupportStatus; label: string }[] = [
  { value: "open", label: "요청중" },
  { value: "in_progress", label: "진행중" },
  { value: "done", label: "완료" },
];

export function SupportStatusControl({
  id,
  status,
}: {
  id: string;
  status: SupportStatus;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function onChange(next: SupportStatus) {
    if (next === status) return;
    startTransition(async () => {
      try {
        await updateSupportStatus(id, next);
        toast.success("상태를 변경했습니다.");
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "상태 변경에 실패했습니다.");
      }
    });
  }

  return (
    <div className="space-y-1.5">
      <Label htmlFor="support-status">상태 변경</Label>
      <select
        id="support-status"
        value={status}
        disabled={pending}
        onChange={(e) => onChange(e.target.value as SupportStatus)}
        className={cn(
          "flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-base shadow-sm transition-colors",
          "focus-visible:outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30",
          "disabled:cursor-not-allowed disabled:opacity-50",
        )}
      >
        {STATUSES.map((s) => (
          <option key={s.value} value={s.value}>
            {s.label}
          </option>
        ))}
      </select>
    </div>
  );
}
