"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  LocationField,
  type LocationValue,
} from "@/components/location/location-field";
import { addLiveStream } from "@/app/schedule/[id]/live/actions";

/** 집회에 유튜브 라이브를 추가하는 다이얼로그 폼. */
export function AddLiveForm({ scheduleId }: { scheduleId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [label, setLabel] = useState("");
  const [title, setTitle] = useState("");
  const [location, setLocation] = useState<LocationValue>({
    address: "",
    lat: "",
    lng: "",
  });
  const [submitting, setSubmitting] = useState(false);

  function reset() {
    setUrl("");
    setLabel("");
    setTitle("");
    setLocation({ address: "", lat: "", lng: "" });
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (submitting) return;
    if (!url.trim()) {
      toast.error("유튜브 링크를 입력하세요.");
      return;
    }
    if (!label.trim()) {
      toast.error("위치 이름을 입력하세요.");
      return;
    }
    setSubmitting(true);
    try {
      const latNum = location.lat.trim() ? Number(location.lat) : NaN;
      const lngNum = location.lng.trim() ? Number(location.lng) : NaN;
      await addLiveStream({
        scheduleId,
        url: url.trim(),
        locationLabel: label.trim(),
        title: title.trim() || null,
        lat: Number.isFinite(latNum) ? latNum : null,
        lng: Number.isFinite(lngNum) ? lngNum : null,
      });
      toast.success("라이브를 추가했습니다.");
      reset();
      setOpen(false);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "추가에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="size-4" />
          라이브 추가
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>유튜브 라이브 추가</DialogTitle>
          <DialogDescription>
            유튜브 라이브 링크와 위치 이름을 입력하면 멀티뷰에 추가됩니다.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="live-url">유튜브 링크</Label>
            <Input
              id="live-url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://youtube.com/watch?v=… 또는 /channel/UC…"
              required
            />
            <p className="text-xs text-muted-foreground">
              영상 링크 또는 채널(/channel/UC…) 링크. @핸들 링크는 지원하지 않습니다.
            </p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="live-label">위치 이름</Label>
            <Input
              id="live-label"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="예) 본회장, 세종대로 사거리"
              maxLength={100}
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="live-title">설명 (선택)</Label>
            <Input
              id="live-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="방송 설명"
              maxLength={200}
            />
          </div>

          <LocationField
            value={location}
            onChange={setLocation}
            label="지도 표시 위치 (선택)"
          />

          <div className="flex gap-2 pt-1">
            <Button type="submit" disabled={submitting} className="flex-1">
              {submitting && <Loader2 className="size-4 animate-spin" />}
              추가
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setOpen(false)}
              disabled={submitting}
            >
              취소
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
