import Link from "next/link";
import { MapPin, MessageCircle, Hash } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { formatRelativeTime, initial } from "@/lib/format";
import { MediaGallery } from "@/components/post/media-gallery";
import { LikeButton } from "@/components/post/like-button";
import type { PostWithRelations } from "@/lib/types";

/** 피드 카드. 본문 말줄임 + 미디어 + 메타. 클릭 시 상세로 이동. */
export function PostCard({
  post,
  isLoggedIn,
}: {
  post: PostWithRelations;
  isLoggedIn: boolean;
}) {
  const nickname = post.author.nickname ?? "익명";

  return (
    <article className="rounded-lg border border-border bg-card p-4 transition-colors hover:border-border-strong">
      <div className="flex items-center gap-2.5">
        <Avatar className="size-9">
          <AvatarFallback>{initial(nickname)}</AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{nickname}</p>
          <p className="text-xs text-muted-foreground">
            {formatRelativeTime(post.created_at)}
          </p>
        </div>
      </div>

      <Link href={`/post/${post.id}`} className="mt-3 block">
        <p className="line-clamp-4 whitespace-pre-wrap break-words text-[15px] leading-relaxed">
          {post.body}
        </p>
      </Link>

      {post.media.length > 0 && (
        <Link href={`/post/${post.id}`} className="mt-3 block">
          <MediaGallery media={post.media} />
        </Link>
      )}

      {(post.address || post.tags.length > 0) && (
        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          {post.address && (
            <span className="inline-flex max-w-full items-center gap-1 rounded-full bg-secondary px-2.5 py-1 text-xs text-text-2">
              <MapPin className="size-3 shrink-0 text-primary" />
              <span className="truncate">{post.address}</span>
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

      <div className="mt-3 flex items-center gap-4 border-t border-border pt-3">
        <LikeButton
          targetType="post"
          targetId={post.id}
          initialCount={post.like_count}
          initialLiked={post.liked_by_me ?? false}
          isLoggedIn={isLoggedIn}
        />
        <Link
          href={`/post/${post.id}`}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          <MessageCircle className="size-5" />
          {post.comment_count > 0 && <span>{post.comment_count}</span>}
        </Link>
      </div>
    </article>
  );
}
