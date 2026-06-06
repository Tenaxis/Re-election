import Link from "next/link";
import { Inbox } from "lucide-react";
import { getSessionUser } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { PostCard } from "@/components/post/post-card";
import { FeedFilters } from "@/components/post/feed-filters";
import { RealtimeBanner } from "@/components/realtime-banner";
import { getFeed, type FeedQuery } from "@/components/post/queries";

export const dynamic = "force-dynamic";

type Period = "day" | "week" | "month";

function periodToFrom(period: string | undefined): string | undefined {
  const now = Date.now();
  const days: Record<Period, number> = { day: 1, week: 7, month: 30 };
  const d = days[period as Period];
  if (!d) return undefined;
  return new Date(now - d * 24 * 60 * 60 * 1000).toISOString();
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ tag?: string; period?: string }>;
}) {
  const { tag, period } = await searchParams;
  const { userId } = await getSessionUser();

  const query: FeedQuery = {
    tag: tag?.trim() || undefined,
    from: periodToFrom(period),
    userId,
  };

  const posts = await getFeed(query);
  const filtered = !!query.tag || !!query.from;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">피드</h1>
        {userId && (
          <Button asChild size="sm" className="hidden lg:inline-flex">
            <Link href="/post/new">글쓰기</Link>
          </Button>
        )}
      </div>

      <FeedFilters />

      <RealtimeBanner table="posts" label="글" excludeAuthorId={userId} />

      {posts.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border-strong bg-card py-16 text-center">
          <Inbox className="size-10 text-muted-foreground" />
          <div className="space-y-1">
            <p className="font-medium">
              {filtered ? "조건에 맞는 글이 없습니다." : "아직 글이 없습니다."}
            </p>
            <p className="text-sm text-muted-foreground">
              {filtered
                ? "필터를 바꿔보세요."
                : "현장의 첫 기록을 남겨보세요."}
            </p>
          </div>
          {!filtered && userId && (
            <Button asChild size="sm">
              <Link href="/post/new">글쓰기</Link>
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} isLoggedIn={!!userId} />
          ))}
        </div>
      )}
    </div>
  );
}
