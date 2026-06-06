"use client";

import { MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export type LocationValue = {
  address: string;
  lat: string; // 입력 그대로 보관(빈 문자열 허용)
  lng: string;
};

/** 주소 텍스트 + 선택적 위도/경도. 좌표는 선택 사항. */
export function LocationField({
  value,
  onChange,
}: {
  value: LocationValue;
  onChange: (v: LocationValue) => void;
}) {
  function set(patch: Partial<LocationValue>) {
    onChange({ ...value, ...patch });
  }

  return (
    <fieldset className="space-y-2">
      <Label htmlFor="loc-address" className="flex items-center gap-1.5">
        <MapPin className="size-4 text-primary" />
        위치 (선택)
      </Label>
      <Input
        id="loc-address"
        value={value.address}
        onChange={(e) => set({ address: e.target.value })}
        placeholder="주소 또는 장소명 (예: 서울 종로구 세종대로)"
      />
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label htmlFor="loc-lat" className="text-xs text-muted-foreground">
            위도
          </Label>
          <Input
            id="loc-lat"
            type="number"
            step="any"
            inputMode="decimal"
            value={value.lat}
            onChange={(e) => set({ lat: e.target.value })}
            placeholder="37.5759"
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="loc-lng" className="text-xs text-muted-foreground">
            경도
          </Label>
          <Input
            id="loc-lng"
            type="number"
            step="any"
            inputMode="decimal"
            value={value.lng}
            onChange={(e) => set({ lng: e.target.value })}
            placeholder="126.9769"
          />
        </div>
      </div>
    </fieldset>
  );
}
