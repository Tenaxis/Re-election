"use client";

import { useEffect, useMemo, useState } from "react";
import L from "leaflet";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { cn } from "@/lib/utils";

export type MapPoint = {
  id: string;
  lat: number;
  lng: number;
  title: string;
  kind: "post" | "support" | "schedule";
};

const SEOUL_CITY_HALL: [number, number] = [37.5665, 126.978];
const DEFAULT_ZOOM = 12;

const KIND_META: Record<
  MapPoint["kind"],
  { label: string; color: string; href: (id: string) => string }
> = {
  post: { label: "글", color: "#0d9488", href: (id) => `/post/${id}` },
  support: { label: "지원요청", color: "#d97706", href: (id) => `/support/${id}` },
  schedule: { label: "집회", color: "#7c3aed", href: (id) => `/schedule/${id}` },
};

const KINDS: MapPoint["kind"][] = ["post", "support", "schedule"];

/** 색상 원형 마커 (기본 마커 아이콘 깨짐 방지) */
function createIcon(color: string) {
  return L.divIcon({
    className: "",
    html: `<span style="display:block;width:18px;height:18px;border-radius:9999px;background:${color};border:2px solid #fff;box-shadow:0 1px 3px rgba(15,23,42,.4)"></span>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
    popupAnchor: [0, -9],
  });
}

/** 데이터가 있으면 모든 핀이 보이도록 지도 범위를 맞춘다. */
function FitBounds({ points }: { points: MapPoint[] }) {
  const map = useMap();
  useEffect(() => {
    if (points.length === 0) return;
    if (points.length === 1) {
      map.setView([points[0].lat, points[0].lng], DEFAULT_ZOOM);
      return;
    }
    const bounds = L.latLngBounds(points.map((p) => [p.lat, p.lng]));
    map.fitBounds(bounds, { padding: [40, 40] });
  }, [map, points]);
  return null;
}

export function MapView({ points }: { points: MapPoint[] }) {
  const [visible, setVisible] = useState<Record<MapPoint["kind"], boolean>>({
    post: true,
    support: true,
    schedule: true,
  });

  const icons = useMemo(
    () => ({
      post: createIcon(KIND_META.post.color),
      support: createIcon(KIND_META.support.color),
      schedule: createIcon(KIND_META.schedule.color),
    }),
    [],
  );

  const shownPoints = useMemo(
    () => points.filter((p) => visible[p.kind]),
    [points, visible],
  );

  function toggle(kind: MapPoint["kind"]) {
    setVisible((prev) => ({ ...prev, [kind]: !prev[kind] }));
  }

  return (
    <div className="relative h-[70vh] w-full overflow-hidden rounded-lg border border-border lg:h-[calc(100dvh-8rem)]">
      {/* 레이어 토글 컨트롤 */}
      <div className="absolute right-3 top-3 z-[1000] space-y-1.5 rounded-lg border border-border bg-card/95 p-3 shadow-md backdrop-blur">
        {KINDS.map((kind) => {
          const meta = KIND_META[kind];
          return (
            <label
              key={kind}
              className="flex cursor-pointer items-center gap-2 text-sm font-medium text-foreground"
            >
              <input
                type="checkbox"
                checked={visible[kind]}
                onChange={() => toggle(kind)}
                className="size-4 accent-primary"
                aria-label={`${meta.label} 레이어 표시`}
              />
              <span
                aria-hidden
                className="inline-block size-3 rounded-full border border-white"
                style={{ backgroundColor: meta.color }}
              />
              {meta.label}
            </label>
          );
        })}
      </div>

      <MapContainer
        center={SEOUL_CITY_HALL}
        zoom={DEFAULT_ZOOM}
        scrollWheelZoom
        className="size-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitBounds points={points} />

        {shownPoints.map((point) => {
          const meta = KIND_META[point.kind];
          return (
            <Marker
              key={`${point.kind}-${point.id}`}
              position={[point.lat, point.lng]}
              icon={icons[point.kind]}
            >
              <Popup>
                <div className="space-y-1">
                  <span
                    className={cn(
                      "inline-block rounded-full px-2 py-0.5 text-[11px] font-medium text-white",
                    )}
                    style={{ backgroundColor: meta.color }}
                  >
                    {meta.label}
                  </span>
                  <p className="text-sm font-medium text-slate-900">
                    {point.title}
                  </p>
                  <a
                    href={meta.href(point.id)}
                    className="text-xs font-medium text-primary underline"
                  >
                    상세 보기
                  </a>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
