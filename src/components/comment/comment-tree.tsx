import { CommentComposer } from "@/components/comment/comment-composer";
import { CommentItem } from "@/components/comment/comment-item";
import type { CommentWithRelations } from "@/lib/types";

function countAll(comments: CommentWithRelations[]): number {
  return comments.reduce(
    (sum, c) => sum + 1 + (c.replies?.length ?? 0),
    0,
  );
}

/** 댓글 트리(1단계) + 입력. 서버 컴포넌트. */
export function CommentTree({
  postId,
  comments,
  currentUserId,
}: {
  postId: string;
  comments: CommentWithRelations[];
  currentUserId: string | null;
}) {
  const total = countAll(comments);
  const isLoggedIn = !!currentUserId;

  return (
    <section className="space-y-4">
      <h2 className="text-base font-semibold">댓글 {total > 0 && total}</h2>

      <CommentComposer postId={postId} isLoggedIn={isLoggedIn} />

      {comments.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">
          첫 댓글을 남겨보세요.
        </p>
      ) : (
        <div className="divide-y divide-border">
          {comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              postId={postId}
              currentUserId={currentUserId}
            />
          ))}
        </div>
      )}
    </section>
  );
}
