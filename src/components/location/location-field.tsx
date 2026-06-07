"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import dynamic from "next/dynamic";
import { Crosshair, Loader2, MapPin, Search } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";

// 지도(leaflet)는 SSR 불가 → 클라이언트에서만 로딩.
const LocationPickerMap = dynamic(
  () => import("./location-picker-map").then((m) => m.LocationPickerMap),
  {
    ssr: false,
    loading: () => <Skeleton className="h-64 w-full rounded-lg" />,
  },
);

export type LocationValue = {
  address: string;
  lat: string; // 좌표는 사용자가 직접 입력하지 않고 검색·지도·현재위치로만 채워진다.
  lng: string;
};

type SearchResult = { display_name: string; lat: string; lon: string };

const EPS = 1e-6;

/** lat/lng → 주소 텍스트 (OSM Nominatim 역지오코딩). 실패 시 null. */
async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&accept-language=ko&zoom=18`;
    const res = await fetch(url, { headers: { Accept: "application/json" } });
    if (!res.ok) return null;
    const data: { display_name?: string } = await res.json();
    return data.display_name ?? null;
  } catch {
    return null;
  }
}

/** 주소/장소명 검색 → 후보 목록 (OSM Nominatim, 한국 우선). */
async function searchPlaces(query: string): Promise<SearchResult[]> {
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(
      query,
    )}&accept-language=ko&countrycodes=kr&limit=5`;
    const res = await fetch(url, { headers: { Accept: "application/json" } });
    if (!res.ok) return [];
    return (await res.json()) as SearchResult[];
  } catch {
    return [];
  }
}

/**
 * 위치 입력기. 위도/경도는 노출/입력하지 않는다.
 * 좌표는 (1) 주소 검색, (2) 현재 위치, (3) 지도를 움직여 중앙 핀을 맞추는 방식으로만 지정된다.
 */
export function LocationField({
  value,
  onChange,
  autoLocate = false,
  label = "위치 (선택)",
  addressRequired = false,
  addressError,
}: {
  value: LocationValue;
  onChange: (v: LocationValue) => void;
  /** 마운트 시 현재 위치를 1회 자동으로 가져온다 (새 글 작성용). */
  autoLocate?: boolean;
  /** fieldset 제목. 기본 "위치 (선택)". */
  label?: string;
  /** 주소가 필수임을 안내 (검증은 서버에서 수행). */
  addressRequired?: boolean;
  /** 주소 입력 아래에 표시할 서버 검증 에러. */
  addressError?: string;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [locating, setLocating] = useState(false);
  const [reverseLoading, setReverseLoading] = useState(false);
  const autoDone = useRef(false);
  const revTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // 사용자가 주소를 직접 입력하면 자동 역지오코딩이 덮어쓰지 않도록 표시.
  const addressDirty = useRef(false);

  const latNum = value.lat ? Number(value.lat) : null;
  const lngNum = value.lng ? Number(value.lng) : null;
  const hasCoords = latNum != null && lngNum != null;

  // 좌표 세팅 + (옵션) 역지오코딩으로 주소 채우기
  function applyCoords(
    lat: number,
    lng: number,
    opts: { address?: string | null; reverse?: boolean } = {},
  ) {
    const next: LocationValue = {
      address: opts.address != null ? opts.address : value.address,
      lat: String(lat),
      lng: String(lng),
    };
    onChange(next);
    if (opts.reverse) {
      setReverseLoading(true);
      reverseGeocode(lat, lng).then((addr) => {
        setReverseLoading(false);
        // 사용자가 그 사이 주소를 직접 고쳤으면 덮어쓰지 않는다.
        if (addr && !addressDirty.current) {
          onChange({ address: addr, lat: String(lat), lng: String(lng) });
        }
      });
    }
  }

  // 지도 이동 → 중앙 좌표 반영 + 디바운스 역지오코딩
  function handleMapMove(lat: number, lng: number) {
    if (latNum != null && lngNum != null) {
      if (Math.abs(latNum - lat) < EPS && Math.abs(lngNum - lng) < EPS) return;
    }
    onChange({ address: value.address, lat: String(lat), lng: String(lng) });
    if (revTimer.current) clearTimeout(revTimer.current);
    setReverseLoading(true);
    revTimer.current = setTimeout(async () => {
      const addr = await reverseGeocode(lat, lng);
      setReverseLoading(false);
      // 사용자가 직접 주소를 고쳤다면 자동 갱신으로 덮어쓰지 않는다.
      if (addr && !addressDirty.current) {
        onChange({ address: addr, lat: String(lat), lng: String(lng) });
      }
    }, 600);
  }

  async function onSearch(e?: FormEvent) {
    e?.preventDefault();
    const q = query.trim();
    if (!q) return;
    setSearching(true);
    const found = await searchPlaces(q);
    setSearching(false);
    setResults(found);
    if (found.length === 0) toast.error("검색 결과가 없습니다. 다른 키워드로 시도해보세요.");
  }

  function pickResult(r: SearchResult) {
    addressDirty.current = false; // 검색 선택은 명시적 → 주소 갱신 허용
    applyCoords(Number(r.lat), Number(r.lon), { address: r.display_name });
    setResults([]);
    setQuery("");
  }

  function requestLocation(opts: { silent?: boolean } = {}) {
    const { silent = false } = opts;
    if (!("geolocation" in navigator)) {
      if (!silent) toast.error("이 브라우저는 위치 기능을 지원하지 않습니다.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        addressDirty.current = false; // 현재 위치는 명시적 → 주소 갱신 허용
        applyCoords(pos.coords.latitude, pos.coords.longitude, { reverse: true });
        if (!silent) toast.success("현재 위치를 불러왔습니다.");
      },
      (err) => {
        setLocating(false);
        if (silent) return;
        toast.error(
          err.code === err.PERMISSION_DENIED
            ? "위치 권한이 거부되었습니다. 검색하거나 지도를 움직여 지정해주세요."
            : "위치를 확인할 수 없습니다. 검색하거나 지도를 움직여 지정해주세요.",
        );
      },
      { enableHighAccuracy: true, timeout: 10_000, maximumAge: 0 },
    );
  }

  // 새 글 작성 시 현재 위치 자동 채움 (좌표/주소가 비어 있을 때 1회만)
  useEffect(() => {
    if (!autoLocate || autoDone.current) return;
    if (value.address || value.lat || value.lng) return;
    autoDone.current = true;
    queueMicrotask(() => requestLocation({ silent: true }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoLocate]);

  useEffect(() => {
    return () => {
      if (revTimer.current) clearTimeout(revTimer.current);
    };
  }, []);

  return (
    <fieldset className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <Label htmlFor="loc-address" className="flex items-center gap-1.5">
          <MapPin className="size-4 text-primary" />
          {label}
        </Label>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => requestLocation()}
          disabled={locating}
          className="h-8"
        >
          {locating ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Crosshair className="size-4" />
          )}
          현재 위치
        </Button>
      </div>

      {/* 주소·장소 검색 */}
      <div className="relative">
        <div className="flex gap-2">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                onSearch();
              }
            }}
            placeholder="주소·장소 검색 (예: 서울시청, 종로구 세종대로)"
            aria-label="위치 검색"
          />
          <Button
            type="button"
            variant="secondary"
            onClick={() => onSearch()}
            disabled={searching || !query.trim()}
          >
            {searching ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Search className="size-4" />
            )}
            검색
          </Button>
        </div>

        {results.length > 0 && (
          <ul className="absolute z-[1100] mt-1 w-full overflow-hidden rounded-lg border border-border bg-card shadow-md">
            {results.map((r, i) => (
              <li key={`${r.lat}-${r.lon}-${i}`}>
                <button
                  type="button"
                  onClick={() => pickResult(r)}
                  className="block w-full px-3 py-2 text-left text-sm hover:bg-muted"
                >
                  {r.display_name}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* 지도: 움직여서 중앙 핀을 정확한 위치에 맞춘다 */}
      <LocationPickerMap lat={latNum} lng={lngNum} onChange={handleMapMove} />

      {/* 선택된 주소 (수정 가능) */}
      <Input
        id="loc-address"
        value={value.address}
        onChange={(e) => {
          addressDirty.current = true;
          onChange({ ...value, address: e.target.value });
        }}
        placeholder={
          addressRequired ? "선택된 주소 (필수)" : "선택된 주소 (직접 수정 가능)"
        }
        aria-label="선택된 주소"
        aria-invalid={addressError ? true : undefined}
      />
      {addressError ? (
        <p className="text-sm text-destructive">{addressError}</p>
      ) : null}

      <p className="text-xs text-muted-foreground">
        {reverseLoading
          ? "주소를 확인하는 중…"
          : hasCoords
            ? "지도를 움직여 핀을 정확한 위치에 맞추세요. 주소는 자동으로 갱신됩니다."
            : "검색하거나 ‘현재 위치’를 누른 뒤, 지도를 움직여 위치를 맞추세요."}
      </p>
    </fieldset>
  );
}
