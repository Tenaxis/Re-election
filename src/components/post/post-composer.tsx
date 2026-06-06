"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import { toDatetimeLocal } from "@/lib/format";
import {
  MediaUploader,
  type LocalMedia,
} from "@/components/post/media-uploader";
import { TagInput } from "@/components/post/tag-input";
import {
  LocationField,
  type LocationValue,
} from "@/components/post/location-field";
import { createPost, updatePost, type MediaInput } from "@/app/post/actions";
import type { PostWithRelations } from "@/lib/types";

const BODY_MAX = 5000;

export type ComposerInitial = {
  id: string;
  body: string;
  address: string | null;
  lat: number | null;
  lng: number | null;
  occurred_at: string | null;
  tags: string[];
};

export function postToInitial(post: PostWithRelations): ComposerInitial {
  return {
    id: post.id,
    body: post.body,
    address: post.address,
    lat: post.lat,
    lng: post.lng,
    occurred_at: post.occurred_at,
    tags: post.tags,
  };
}

function extOf(file: File): string {
  const fromName = file.name.includes(".")
    ? file.name.split(".").pop()!.toLowerCase()
    : "";
  if (fromName) return fromName;
  const sub = file.type.split("/")[1];
  return sub ? sub.toLowerCase() : "bin";
}

/** 글 작성/수정 폼. 미디어를 브라우저에서 storage 업로드 후 서버액션 호출. */
export function PostComposer({
  userId,
  initial,
}: {
  userId: string;
  initial?: ComposerInitial;
}) {
  const router = useRouter();
  const isEdit = !!initial;

  const [body, setBody] = useState(initial?.body ?? "");
  const [media, setMedia] = useState<LocalMedia[]>([]);
  const [tags, setTags] = useState<string[]>(initial?.tags ?? []);
  const [occurredAt, setOccurredAt] = useState(
    initial?.occurred_at ? toDatetimeLocal(initial.occurred_at) : "",
  );
  const [location, setLocation] = useState<LocationValue>({
    address: initial?.address ?? "",
    lat: initial?.lat != null ? String(initial.lat) : "",
    lng: initial?.lng != null ? String(initial.lng) : "",
  });
  const [submitting, setSubmitting] = useState(false);

  async function uploadMedia(): Promise<MediaInput[]> {
    if (media.length === 0) return [];
    const supabase = createClient();
    const uploaded: MediaInput[] = [];

    for (const m of media) {
      const path = `${userId}/${crypto.randomUUID()}.${extOf(m.file)}`;
      const { error } = await supabase.storage
        .from("media")
        .upload(path, m.file, {
          contentType: m.file.type || undefined,
          upsert: false,
        });
      if (error) throw new Error(`업로드 실패: ${error.message}`);
      uploaded.push({ storage_path: path, type: m.type });
    }
    return uploaded;
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (submitting) return;

    const trimmed = body.trim();
    if (!trimmed) {
      toast.error("본문을 입력하세요.");
      return;
    }
    if (trimmed.length > BODY_MAX) {
      toast.error(`본문은 ${BODY_MAX}자 이하여야 합니다.`);
      return;
    }

    setSubmitting(true);
    try {
      const uploadedMedia = await uploadMedia();
      const latNum = location.lat.trim() ? Number(location.lat) : NaN;
      const lngNum = location.lng.trim() ? Number(location.lng) : NaN;

      const payload = {
        body: trimmed,
        address: location.address.trim() || null,
        lat: Number.isFinite(latNum) ? latNum : null,
        lng: Number.isFinite(lngNum) ? lngNum : null,
        occurred_at: occurredAt ? new Date(occurredAt).toISOString() : null,
        tags,
        media: uploadedMedia,
      };

      const result = isEdit
        ? await updatePost(initial!.id, payload)
        : await createPost(payload);

      toast.success(isEdit ? "글이 수정되었습니다." : "글이 등록되었습니다.");
      router.push(`/post/${result.id}`);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "처리에 실패했습니다.");
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="body">본문</Label>
        <Textarea
          id="body"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="현장에서 있었던 일을 기록하세요."
          className="min-h-40"
          maxLength={BODY_MAX}
          required
        />
        <p className="text-right text-xs text-muted-foreground">
          {body.length} / {BODY_MAX}
        </p>
      </div>

      {!isEdit && (
        <MediaUploader items={media} onChange={setMedia} disabled={submitting} />
      )}

      <LocationField value={location} onChange={setLocation} />

      <div className="space-y-2">
        <Label htmlFor="occurred-at">발생 시간 (선택)</Label>
        <Input
          id="occurred-at"
          type="datetime-local"
          value={occurredAt}
          onChange={(e) => setOccurredAt(e.target.value)}
        />
      </div>

      <TagInput value={tags} onChange={setTags} />

      <div className="flex gap-2 pt-2">
        <Button type="submit" disabled={submitting} className="flex-1">
          {submitting && <Loader2 className="size-4 animate-spin" />}
          {isEdit ? "수정 완료" : "등록"}
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={() => router.back()}
          disabled={submitting}
        >
          취소
        </Button>
      </div>

      {isEdit && (
        <p className="text-xs text-muted-foreground">
          수정 모드에서는 본문·위치·시간·태그를 변경할 수 있습니다.
        </p>
      )}
    </form>
  );
}
