"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Loader2, MapPin, CheckCircle2, ImagePlus, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { verifyAttendance } from "@/app/schedule/[id]/verify/actions";

type Coords = { lat: number; lng: number };

function extOf(file: File): string {
  const fromName = file.name.includes(".")
    ? file.name.split(".").pop()!.toLowerCase()
    : "";
  if (fromName) return fromName;
  const sub = file.type.split("/")[1];
  return sub ? sub.toLowerCase() : "jpg";
}

export function VerifyForm({
  scheduleId,
  userId,
}: {
  scheduleId: string;
  userId: string;
}) {
  const router = useRouter();
  const [coords, setCoords] = useState<Coords | null>(null);
  const [locating, setLocating] = useState(false);
  const [code, setCode] = useState("");
  const [phone, setPhone] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function requestLocation() {
    if (!("geolocation" in navigator)) {
      toast.error("이 브라우저는 위치 기능을 지원하지 않습니다.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocating(false);
        toast.success("현재 위치를 확인했습니다.");
      },
      (err) => {
        setLocating(false);
        toast.error(
          err.code === err.PERMISSION_DENIED
            ? "위치 권한이 거부되었습니다. 권한을 허용해주세요."
            : "위치를 확인할 수 없습니다. 다시 시도해주세요.",
        );
      },
      { enableHighAccuracy: true, timeout: 10_000, maximumAge: 0 },
    );
  }

  function onPickPhoto(file: File | null) {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    if (!file) {
      setPhoto(null);
      setPreviewUrl(null);
      return;
    }
    if (!file.type.startsWith("image/")) {
      toast.error("이미지만 첨부할 수 있습니다.");
      return;
    }
    setPhoto(file);
    setPreviewUrl(URL.createObjectURL(file));
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (submitting) return;

    if (!coords) {
      toast.error("먼저 현재 위치를 확인해주세요.");
      return;
    }
    if (!code.trim()) {
      toast.error("현장 코드를 입력하세요.");
      return;
    }
    if (phone.replace(/\D/g, "").length < 10) {
      toast.error("올바른 휴대폰 번호를 입력하세요.");
      return;
    }
    if (!photo) {
      toast.error("인증 사진을 첨부하세요.");
      return;
    }

    setSubmitting(true);
    try {
      const supabase = createClient();
      const photoPath = `${userId}/attend-${crypto.randomUUID()}.${extOf(photo)}`;
      const { error: uploadError } = await supabase.storage
        .from("media")
        .upload(photoPath, photo, {
          contentType: photo.type || undefined,
          upsert: false,
        });
      if (uploadError) throw new Error(`사진 업로드 실패: ${uploadError.message}`);

      await verifyAttendance({
        scheduleId,
        lat: coords.lat,
        lng: coords.lng,
        code,
        phone,
        photoPath,
      });

      toast.success("참여 인증이 완료되었습니다.");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "인증에 실패했습니다.");
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      {/* 위치 */}
      <div className="space-y-2">
        <Label>① 현재 위치</Label>
        <Button
          type="button"
          variant={coords ? "secondary" : "default"}
          onClick={requestLocation}
          disabled={locating || submitting}
          className="w-full"
        >
          {locating ? (
            <Loader2 className="size-4 animate-spin" aria-hidden />
          ) : coords ? (
            <CheckCircle2 className="size-4" aria-hidden />
          ) : (
            <MapPin className="size-4" aria-hidden />
          )}
          {coords ? "위치 확인됨 · 다시 확인" : "현재 위치 확인"}
        </Button>
        {coords ? (
          <p className="text-xs text-muted-foreground">
            확인된 좌표: {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
          </p>
        ) : (
          <p className="text-xs text-muted-foreground">
            집회 현장 범위 내에서만 인증할 수 있습니다.
          </p>
        )}
      </div>

      {/* 현장 코드 */}
      <div className="space-y-1.5">
        <Label htmlFor="verify-code">② 현장 코드</Label>
        <Input
          id="verify-code"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="주최자가 현장에서 알려준 코드"
          autoComplete="off"
          required
        />
      </div>

      {/* 사진 */}
      <div className="space-y-2">
        <Label htmlFor="verify-photo">③ 인증 사진</Label>
        {previewUrl ? (
          <div className="relative aspect-video w-full overflow-hidden rounded-lg border border-border bg-muted">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={previewUrl} alt="" className="h-full w-full object-cover" />
            <button
              type="button"
              onClick={() => onPickPhoto(null)}
              disabled={submitting}
              aria-label="사진 제거"
              className="absolute right-2 top-2 flex size-7 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80"
            >
              <X className="size-4" aria-hidden />
            </button>
          </div>
        ) : (
          <label
            className={cn(
              "flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed border-border-strong text-sm font-medium text-text-2 transition-colors hover:bg-accent hover:text-foreground",
              submitting && "cursor-not-allowed opacity-50",
            )}
          >
            <ImagePlus className="size-4" aria-hidden />
            사진 선택
            <input
              id="verify-photo"
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              disabled={submitting}
              onChange={(e) => onPickPhoto(e.target.files?.[0] ?? null)}
            />
          </label>
        )}
      </div>

      {/* 휴대폰 */}
      <div className="space-y-1.5">
        <Label htmlFor="verify-phone">④ 휴대폰 번호</Label>
        <Input
          id="verify-phone"
          type="tel"
          inputMode="numeric"
          value={phone}
          onChange={(e) => setPhone(e.target.value.replace(/[^\d-]/g, ""))}
          placeholder="010-1234-5678"
          autoComplete="tel"
          required
        />
        <p className="text-xs text-muted-foreground">
          번호는 해시 처리되어 저장됩니다(원문 미저장). 1인·1번호당 하루 1회만 인증됩니다.
        </p>
      </div>

      <Button type="submit" disabled={submitting} className="w-full">
        {submitting && <Loader2 className="size-4 animate-spin" aria-hidden />}
        참여 인증 완료
      </Button>

      <p className="text-xs text-muted-foreground">
        ⚠️ 웹 기반 인증은 GPS·사진 조작을 완벽히 막을 수 없습니다. 현장 코드와
        지오펜스로 부정 인증을 어렵게 할 뿐이며, SMS 본인확인은 연동되어 있지 않습니다.
      </p>
    </form>
  );
}
