"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Reply, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { formatRelativeTime, initial } from "@/lib/format";
import { LikeButton } from "@/components/post/like-button";
import { CommentComposer } from "@/components/comment/comment-composer";
import { deleteComment } from "@/app/post/actions";
import type { CommentWithRelations } from "@/lib/types";
import { cn } from "@/lib/utils";

export function CommentItem({
  comment,
  postId,
  currentUserId,
  isReply = false,
}: {
  comment: CommentWithRelations;
  postId: string;
  currentUserId: string | null;
  isReply?: boolean;
}) {
  const router = useRouter();
  const [replying, setReplying] = useState(false);
  const [deleting, startDelete] = useTransition();

  const isLoggedIn = !!currentUserId;
  const isAuthor = currentUserId === comment.author_id;
  const nickname = comment.author.nickname ?? "익명";

  function onDelete() {
    if (!confirm("댓글을 삭제할까요?")) return;
    startDelete(async () => {
      try {
        await deleteComment(comment.id);
        toast.success("댓글이 삭제되었습니다.");
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "삭제에 실패했습니다.");
      }
    });
  }

  return (
    <div className={cn(isReply && "ml-8 border-l border-border pl-3")}>
      <div className="flex gap-2.5 py-2">
        <Avatar className="size-7 shrink-0">
          <AvatarFallback className="text-xs">{initial(nickname)}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold">{nickname}</span>
            <span className="text-xs text-muted-foreground">
              {formatRelativeTime(comment.created_at)}
            </span>
          </div>
          <p className="mt-0.5 whitespace-pre-wrap break-words text-sm leading-relaxed">
            {comment.body}
          </p>

          <div className="mt-1.5 flex items-center gap-3">
            <LikeButton
              targetType="comment"
              targetId={comment.id}
              initialCount={comment.like_count}
              initialLiked={comment.liked_by_me ?? false}
              isLoggedIn={isLoggedIn}
              size="sm"
            />
            {!isReply && (
              <button
                type="button"
                onClick={() => setReplying((v) => !v)}
                className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
              >
                <Reply className="size-4" />
                답글
              </button>
            )}
            {isAuthor && (
              <button
                type="button"
                onClick={onDelete}
                disabled={deleting}
                className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-destructive disabled:opacity-50"
              >
                <Trash2 className="size-4" />
                삭제
              </button>
            )}
          </div>

          {replying && (
            <div className="mt-2">
              <CommentComposer
                postId={postId}
                parentId={comment.id}
                isLoggedIn={isLoggedIn}
                autoFocus
                placeholder="답글을 입력하세요."
                onDone={() => setReplying(false)}
              />
            </div>
          )}
        </div>
      </div>

      {comment.replies && comment.replies.length > 0 && (
        <div className="space-y-0">
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              postId={postId}
              currentUserId={currentUserId}
              isReply
            />
          ))}
        </div>
      )}
    </div>
  );
}
