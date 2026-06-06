import Link from "next/link";
import { redirect } from "next/navigation";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getSessionUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatRelativeTime, initial } from "@/lib/format";

export default async function MePage() {
  const { userId, profile } = await getSessionUser();

  if (!userId) {
    redirect("/login?next=/me");
  }

  const supabase = await createClient();
  const { data: posts } = await supabase
    .from("posts")
    .select("id, body, created_at")
    .eq("author_id", userId)
    .order("created_at", { ascending: false });

  const myPosts = posts ?? [];

  return (
    <div className="space-y-6">
      <header className="flex items-center gap-4">
        <Avatar className="size-14">
          <AvatarFallback className="text-lg">
            {initial(profile?.nickname)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <h1 className="truncate text-xl font-bold">
            {profile?.nickname ?? "닉네임 없음"}
          </h1>
          <p className="text-sm text-muted-foreground">내 정보</p>
        </div>
      </header>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground">
          내가 쓴 글
        </h2>

        {myPosts.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-sm text-muted-foreground">
              아직 작성한 글이 없습니다.
            </CardContent>
          </Card>
        ) : (
          <ul className="space-y-2">
            {myPosts.map((post) => (
              <li key={post.id}>
                <Link href={`/post/${post.id}`} className="block">
                  <Card className="transition-colors hover:border-border-strong">
                    <CardContent className="space-y-1 py-3">
                      <p className="line-clamp-2 text-sm">{post.body}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatRelativeTime(post.created_at)}
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <form action="/auth/signout" method="post">
        <Button type="submit" variant="secondary" className="w-full">
          로그아웃
        </Button>
      </form>
    </div>
  );
}
