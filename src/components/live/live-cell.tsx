"use client";

import { useEffect, useRef, useState } from "react";
import { Trash2, Volume2, VolumeX, Play } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  youtubeEmbedUrl,
  youtubeThumbnail,
  type YoutubeSource,
} from "@/lib/youtube";

/** YouTube IFrame API에 mute/unMute/playVideo 명령 전송. */
function ytCommand(iframe: HTMLIFrameElement | null, func: string) {
  iframe?.contentWindow?.postMessage(
    JSON.stringify({ event: "command", func, args: [] }),
    "*",
  );
}

export type LiveCellData = {
  id: string;
  locationLabel: string;
  title: string | null;
  source: YoutubeSource;
};

/** 멀티뷰 단일 셀: 음소거 자동재생 iframe, 탭하면 소리 ON. 뷰포트 진입 시 지연 마운트. */
export function LiveCell({
  data,
  isActive,
  onActivate,
  canManage,
  onDelete,
}: {
  data: LiveCellData;
  isActive: boolean;
  onActivate: (id: string) => void;
  canManage: boolean;
  onDelete: (id: string) => void;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [mounted, setMounted] = useState(false);
  const thumb = youtubeThumbnail(data.source);

  // 뷰포트 근처에 오면 iframe 마운트 (성능)
  useEffect(() => {
    const el = wrapRef.current;
    if (!el || mounted) return;
    const ob = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setMounted(true);
          ob.disconnect();
        }
      },
      { rootMargin: "200px" },
    );
    ob.observe(el);
    return () => ob.disconnect();
  }, [mounted]);

  // 활성 셀만 소리 ON
  useEffect(() => {
    if (!mounted) return;
    const f = iframeRef.current;
    if (isActive) {
      ytCommand(f, "unMute");
      ytCommand(f, "playVideo");
    } else {
      ytCommand(f, "mute");
    }
  }, [isActive, mounted]);

  return (
    <div
      ref={wrapRef}
      className={cn(
        "group relative aspect-video overflow-hidden rounded-lg border bg-black",
        isActive ? "border-primary ring-2 ring-primary" : "border-border",
      )}
    >
      {mounted ? (
        <iframe
          ref={iframeRef}
          src={youtubeEmbedUrl(data.source, { autoplay: true, mute: true })}
          title={data.locationLabel}
          className="size-full"
          allow="autoplay; encrypted-media; picture-in-picture"
          allowFullScreen
        />
      ) : (
        <button
          type="button"
          onClick={() => {
            setMounted(true);
            onActivate(data.id);
          }}
          className="relative flex size-full items-center justify-center"
          aria-label={`${data.locationLabel} 라이브 재생`}
        >
          {thumb ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={thumb}
              alt=""
              className="size-full object-cover opacity-80"
            />
          ) : (
            <div className="size-full bg-slate-800" />
          )}
          <Play className="absolute size-10 text-white/90" />
        </button>
      )}

      {/* 클릭 레이어: iframe 위에서 탭하면 소리 전환 (iframe 자체 클릭과 분리) */}
      {mounted && (
        <button
          type="button"
          onClick={() => onActivate(data.id)}
          aria-label={`${data.locationLabel} 소리 ${isActive ? "끄기" : "켜기"}`}
          className="absolute right-2 top-2 z-10 flex size-8 items-center justify-center rounded-full bg-black/60 text-white transition-colors hover:bg-black/80"
        >
          {isActive ? (
            <Volume2 className="size-4" />
          ) : (
            <VolumeX className="size-4" />
          )}
        </button>
      )}

      {/* 위치 라벨 + LIVE 배지 (빨강 미사용 — DESIGN.md) */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 bg-gradient-to-t from-black/70 to-transparent p-2">
        <span className="truncate text-sm font-semibold text-white drop-shadow">
          {data.locationLabel}
        </span>
        <span className="flex shrink-0 items-center gap-1 rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-bold text-primary-foreground">
          <span className="size-1.5 animate-pulse rounded-full bg-primary-foreground" />
          LIVE
        </span>
      </div>

      {canManage && (
        <button
          type="button"
          onClick={() => onDelete(data.id)}
          aria-label="라이브 삭제"
          className="absolute left-2 top-2 z-10 flex size-8 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-opacity hover:bg-destructive group-hover:opacity-100 focus-visible:opacity-100"
        >
          <Trash2 className="size-4" />
        </button>
      )}
    </div>
  );
}
