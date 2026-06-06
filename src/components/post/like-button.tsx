"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Heart } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { toggleLike } from "@/app/post/actions";
import type { LikeTarget } from "@/lib/types";

/** 낙관적 좋아요 토글. 비로그인 시 로그인 유도. */
export function LikeButton({
  targetType,
  targetId,
  initialCount,
  initialLiked,
  isLoggedIn,
  size = "md",
}: {
  targetType: LikeTarget;
  targetId: string;
  initialCount: number;
  initialLiked: boolean;
  isLoggedIn: boolean;
  size?: "sm" | "md";
}) {
  const router = useRouter();
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const [pending, startTransition] = useTransition();

  function onClick() {
    if (!isLoggedIn) {
      toast.error("로그인이 필요합니다.", {
        action: { label: "로그인", onClick: () => router.push("/login") },
      });
      return;
    }

    const nextLiked = !liked;
    setLiked(nextLiked);
    setCount((c) => c + (nextLiked ? 1 : -1));

    startTransition(async () => {
      try {
        await toggleLike(targetType, targetId);
      } catch {
        // 롤백
        setLiked(!nextLiked);
        setCount((c) => c + (nextLiked ? -1 : 1));
        toast.error("좋아요 처리에 실패했습니다.");
      }
    });
  }

  const iconSize = size === "sm" ? "size-4" : "size-5";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      aria-pressed={liked}
      aria-label={liked ? "좋아요 취소" : "좋아요"}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md font-medium transition-colors disabled:opacity-60",
        size === "sm" ? "text-xs" : "text-sm",
        liked ? "text-destructive" : "text-muted-foreground hover:text-foreground",
      )}
    >
      <Heart className={cn(iconSize, liked && "fill-current")} />
      {count > 0 && <span>{count}</span>}
    </button>
  );
}
