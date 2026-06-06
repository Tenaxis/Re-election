import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import type { PostMedia } from "@/lib/types";

/** storage 경로 → 공개 URL. media 버킷은 공개 읽기. */
export function publicUrl(storagePath: string): string {
  return createClient().storage.from("media").getPublicUrl(storagePath).data
    .publicUrl;
}

function MediaItem({ item, className }: { item: PostMedia; className?: string }) {
  const url = publicUrl(item.storage_path);
  if (item.type === "video") {
    return (
      <video
        src={url}
        controls
        playsInline
        preload="metadata"
        className={cn(
          "h-full w-full rounded-xl bg-black object-cover",
          className,
        )}
      />
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url}
      alt=""
      loading="lazy"
      className={cn("h-full w-full rounded-xl object-cover", className)}
    />
  );
}

/** 1장 → 16:9, 2장 이상 → 그리드. */
export function MediaGallery({ media }: { media: PostMedia[] }) {
  if (media.length === 0) return null;

  if (media.length === 1) {
    return (
      <div className="aspect-video w-full overflow-hidden rounded-xl">
        <MediaItem item={media[0]} />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "grid gap-1.5",
        media.length === 2 ? "grid-cols-2" : "grid-cols-2 sm:grid-cols-3",
      )}
    >
      {media.map((m) => (
        <div key={m.id} className="aspect-square overflow-hidden rounded-xl">
          <MediaItem item={m} />
        </div>
      ))}
    </div>
  );
}
