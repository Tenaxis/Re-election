"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { LiveStream } from "@/lib/types";
import { LiveCell, type LiveCellData } from "@/components/live/live-cell";
import { deleteLiveStream } from "@/app/schedule/[id]/live/actions";

/** 라이브 격자 멀티뷰. 전부 음소거 자동재생, 한 셀만 소리 ON. */
export function LiveMultiview({
  scheduleId,
  streams,
  manageableIds,
}: {
  scheduleId: string;
  streams: LiveStream[];
  /** 현재 사용자가 삭제할 수 있는 라이브 id 집합 */
  manageableIds: string[];
}) {
  const router = useRouter();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const manageable = new Set(manageableIds);

  async function onDelete(id: string) {
    if (deleting) return;
    if (!window.confirm("이 라이브를 삭제할까요?")) return;
    setDeleting(id);
    try {
      await deleteLiveStream(id, scheduleId);
      toast.success("라이브를 삭제했습니다.");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "삭제에 실패했습니다.");
    } finally {
      setDeleting(null);
    }
  }

  if (streams.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-border bg-card p-8 text-center text-sm text-text-2">
        아직 등록된 라이브가 없습니다. 유튜브 라이브 링크를 추가해보세요.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {streams.map((s) => {
        const data: LiveCellData = {
          id: s.id,
          locationLabel: s.location_label,
          title: s.title,
          source: { sourceType: s.source_type, ref: s.youtube_ref },
        };
        return (
          <LiveCell
            key={s.id}
            data={data}
            isActive={activeId === s.id}
            onActivate={setActiveId}
            canManage={manageable.has(s.id)}
            onDelete={onDelete}
          />
        );
      })}
    </div>
  );
}
