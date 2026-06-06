"use client";

import { useState } from "react";
import { Share2, Check } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

/** Web Share API 지원 시 네이티브 공유, 미지원 시 링크 복사. */
export function ShareButton({
  title,
  text,
  size = "sm",
}: {
  title: string;
  text?: string;
  size?: "sm" | "default";
}) {
  const [copied, setCopied] = useState(false);

  async function onShare() {
    const url = typeof window !== "undefined" ? window.location.href : "";
    if (navigator.share) {
      try {
        await navigator.share({ title, text, url });
        return;
      } catch {
        return; // 사용자 취소 등 — 무시
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("링크가 복사되었습니다.");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("링크 복사에 실패했습니다.");
    }
  }

  return (
    <Button variant="ghost" size={size} onClick={onShare} aria-label="공유">
      {copied ? <Check className="size-4" /> : <Share2 className="size-4" />}
      공유
    </Button>
  );
}
