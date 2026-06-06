import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, MapPin, Hash, Clock } from "lucide-react";
import { getSessionUser } from "@/lib/auth";
import { formatRelativeTime, formatDateTime, initial } from "@/lib/format";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MediaGallery } from "@/components/post/media-gallery";
import { LikeButton } from "@/components/post/like-button";
import { PostOwnerActions } from "@/components/post/post-owner-actions";
import { CommentTree } from "@/components/comment/comment-tree";
import { ShareButton } from "@/components/share-button";
import { ReportButton } from "@/components/report/report-button";
import { getPost, getComments } from "@/components/post/queries";

export const dynamic = "force-dynamic";

export default async function PostDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { userId } = await getSessionUser();

  const post = await getPost(id, userId);
  if (!post) notFound();

  const comments = await getComments(id, userId);
  const nickname = post.author.nickname ?? "익명";
  const isAuthor = userId === post.author_id;

  return (
    <div className="space-y-5">
      <Link
        href="/"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        피드
      </Link>

      <article className="space-y-4">
        <header className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3">
            <Avatar className="size-10">
              <AvatarFallback>{initial(nickname)}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold">{nickname}</p>
              <p className="text-xs text-muted-foreground">
                {formatRelativeTime(post.created_at)}
              </p>
            </div>
          </div>
          {isAuthor && <PostOwnerActions postId={post.id} />}
        </header>

        <p className="whitespace-pre-wrap break-words text-[17px] leading-relaxed">
          {post.body}
        </p>

        {post.media.length > 0 && <MediaGallery media={post.media} />}

        {(post.address || post.occurred_at || post.tags.length > 0) && (
          <div className="flex flex-wrap items-center gap-1.5">
            {post.address && (
              <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-1 text-xs text-text-2">
                <MapPin className="size-3 text-primary" />
                {post.address}
              </span>
            )}
            {post.occurred_at && (
              <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-1 text-xs text-text-2">
                <Clock className="size-3 text-primary" />
                {formatDateTime(post.occurred_at)}
              </span>
            )}
            {post.tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-0.5 rounded-full bg-secondary px-2.5 py-1 text-xs text-text-2"
              >
                <Hash className="size-3" />
                {tag}
              </span>
            ))}
          </div>
        )}

        <div className="flex items-center gap-4 border-y border-border py-3">
          <LikeButton
            targetType="post"
            targetId={post.id}
            initialCount={post.like_count}
            initialLiked={post.liked_by_me ?? false}
            isLoggedIn={!!userId}
          />
          <span className="text-sm text-muted-foreground">
            댓글 {post.comment_count}
          </span>
          <div className="ml-auto flex items-center gap-1">
            <ShareButton title={`${nickname}님의 글`} text={post.body.slice(0, 80)} />
            {!isAuthor && (
              <ReportButton
                targetType="post"
                targetId={post.id}
                isLoggedIn={!!userId}
              />
            )}
          </div>
        </div>
      </article>

      <CommentTree postId={post.id} comments={comments} currentUserId={userId} />
    </div>
  );
}
