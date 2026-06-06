import { Skeleton } from "@/components/ui/skeleton";

// 임시 피드 플레이스홀더 — 게시글 기능 구현 시 실제 피드로 교체됩니다.
export default function HomePage() {
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">피드</h1>
      <p className="text-sm text-muted-foreground">
        집회 현장의 기록이 이곳에 모입니다.
      </p>
      <div className="space-y-3 pt-2">
        {[0, 1, 2].map((i) => (
          <div key={i} className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-center gap-3">
              <Skeleton className="size-9 rounded-full" />
              <div className="space-y-1.5">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
            <Skeleton className="mt-3 h-4 w-full" />
            <Skeleton className="mt-2 h-4 w-3/4" />
          </div>
        ))}
      </div>
    </div>
  );
}
