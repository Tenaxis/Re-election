"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { addComment } from "@/app/post/actions";

const COMMENT_MAX = 2000;

/** 댓글/대댓글 입력. parentId가 있으면 대댓글. */
export function CommentComposer({
  postId,
  parentId = null,
  isLoggedIn,
  onDone,
  autoFocus,
  placeholder = "댓글을 입력하세요.",
}: {
  postId: string;
  parentId?: string | null;
  isLoggedIn: boolean;
  onDone?: () => void;
  autoFocus?: boolean;
  placeholder?: string;
}) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!isLoggedIn) {
    return (
      <p className="rounded-md border border-border bg-secondary px-3 py-2.5 text-sm text-muted-foreground">
        댓글을 작성하려면{" "}
        <button
          type="button"
          onClick={() => router.push("/login")}
          className="font-medium text-primary hover:underline"
        >
          로그인
        </button>
        하세요.
      </p>
    );
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = body.trim();
    if (!trimmed) return;
    setSubmitting(true);
    try {
      await addComment(postId, parentId, trimmed);
      setBody("");
      toast.success("댓글이 등록되었습니다.");
      onDone?.();
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "댓글 등록에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-2">
      <Textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder={placeholder}
        className="min-h-20"
        maxLength={COMMENT_MAX}
        autoFocus={autoFocus}
        required
      />
      <div className="flex justify-end gap-2">
        {onDone && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onDone}
            disabled={submitting}
          >
            취소
          </Button>
        )}
        <Button type="submit" size="sm" disabled={submitting || !body.trim()}>
          {submitting && <Loader2 className="size-4 animate-spin" />}
          등록
        </Button>
      </div>
    </form>
  );
}
