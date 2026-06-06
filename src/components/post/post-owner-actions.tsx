"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { deletePost } from "@/app/post/actions";

/** 작성자 전용: 글 수정/삭제. */
export function PostOwnerActions({ postId }: { postId: string }) {
  const router = useRouter();
  const [deleting, startDelete] = useTransition();

  function onDelete() {
    if (!confirm("이 글을 삭제할까요? 되돌릴 수 없습니다.")) return;
    startDelete(async () => {
      try {
        await deletePost(postId);
        // deletePost가 / 로 redirect하지만, 안전하게 새로고침
        router.push("/");
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "삭제에 실패했습니다.");
      }
    });
  }

  return (
    <div className="flex items-center gap-1">
      <Button asChild variant="ghost" size="sm">
        <Link href={`/post/${postId}/edit`}>
          <Pencil className="size-4" />
          수정
        </Link>
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={onDelete}
        disabled={deleting}
        className="text-muted-foreground hover:text-destructive"
      >
        <Trash2 className="size-4" />
        삭제
      </Button>
    </div>
  );
}
