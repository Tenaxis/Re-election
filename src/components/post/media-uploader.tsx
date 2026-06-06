"use client";

import { useEffect, useRef, useState } from "react";
import { ImagePlus, X, Film, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { stripImageMetadata } from "@/lib/strip-exif";
import type { MediaType } from "@/lib/types";

const VIDEO_MAX_BYTES = 50 * 1024 * 1024; // 50MB

export type LocalMedia = {
  id: string;
  file: File;
  type: MediaType;
  previewUrl: string;
};

export function makeLocalMedia(file: File): LocalMedia | null {
  const isVideo = file.type.startsWith("video/");
  const isImage = file.type.startsWith("image/");
  if (!isVideo && !isImage) {
    toast.error("이미지 또는 영상만 첨부할 수 있습니다.");
    return null;
  }
  if (isVideo && file.size > VIDEO_MAX_BYTES) {
    toast.error("영상은 50MB 이하만 업로드할 수 있습니다.");
    return null;
  }
  return {
    id: crypto.randomUUID(),
    file,
    type: isVideo ? "video" : "image",
    previewUrl: URL.createObjectURL(file),
  };
}

export function MediaUploader({
  items,
  onChange,
  disabled,
}: {
  items: LocalMedia[];
  onChange: (items: LocalMedia[]) => void;
  disabled?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [stripExif, setStripExif] = useState(true);

  // 언마운트 시 objectURL 정리
  useEffect(() => {
    return () => {
      items.forEach((m) => URL.revokeObjectURL(m.previewUrl));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function onSelect(files: FileList | null) {
    if (!files) return;
    const next: LocalMedia[] = [];
    for (const file of Array.from(files)) {
      // 이미지면서 토글 ON이면 EXIF/위치정보 제거
      const prepared =
        stripExif && file.type.startsWith("image/")
          ? await stripImageMetadata(file)
          : file;
      const m = makeLocalMedia(prepared);
      if (m) next.push(m);
    }
    if (next.length > 0) onChange([...items, ...next]);
    if (inputRef.current) inputRef.current.value = "";
  }

  function remove(id: string) {
    const target = items.find((m) => m.id === id);
    if (target) URL.revokeObjectURL(target.previewUrl);
    onChange(items.filter((m) => m.id !== id));
  }

  return (
    <div className="space-y-2">
      <Label>사진 / 영상 (선택)</Label>

      {items.length > 0 && (
        <ul className="grid grid-cols-3 gap-1.5 sm:grid-cols-4">
          {items.map((m) => (
            <li
              key={m.id}
              className="relative aspect-square overflow-hidden rounded-lg border border-border bg-muted"
            >
              {m.type === "video" ? (
                <>
                  <video
                    src={m.previewUrl}
                    className="h-full w-full object-cover"
                    muted
                    playsInline
                  />
                  <span className="absolute bottom-1 left-1 inline-flex items-center gap-0.5 rounded bg-black/60 px-1 py-0.5 text-[10px] text-white">
                    <Film className="size-3" />
                    영상
                  </span>
                </>
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={m.previewUrl}
                  alt=""
                  className="h-full w-full object-cover"
                />
              )}
              <button
                type="button"
                onClick={() => remove(m.id)}
                disabled={disabled}
                aria-label="미디어 제거"
                className="absolute right-1 top-1 flex size-6 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80"
              >
                <X className="size-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={disabled}
        className={cn(
          "flex h-11 w-full items-center justify-center gap-2 rounded-md border border-dashed border-border-strong text-sm font-medium text-text-2 transition-colors hover:bg-accent hover:text-foreground",
          "disabled:cursor-not-allowed disabled:opacity-50",
        )}
      >
        <ImagePlus className="size-4" />
        파일 추가
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*,video/*"
        multiple
        className="hidden"
        onChange={(e) => onSelect(e.target.files)}
      />
      <p className="text-xs text-muted-foreground">
        영상은 50MB 이하. 여러 장 선택 가능.
      </p>

      <label className="flex cursor-pointer items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-sm">
        <input
          type="checkbox"
          checked={stripExif}
          onChange={(e) => setStripExif(e.target.checked)}
          className="size-4 shrink-0 cursor-pointer accent-primary"
        />
        <ShieldCheck className="size-4 shrink-0 text-primary" />
        <span className="text-text-2">
          사진의 위치정보(EXIF) 제거{" "}
          <span className="text-muted-foreground">— 촬영 위치 노출 방지(권장)</span>
        </span>
      </label>
    </div>
  );
}
