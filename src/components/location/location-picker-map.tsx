"use client";

import { useEffect, useRef } from "react";
import { MapContainer, TileLayer, useMap, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";

const SEOUL_CITY_HALL: [number, number] = [37.5665, 126.978];
const PICKED_ZOOM = 16;
const DEFAULT_ZOOM = 12;
const EPS = 1e-6;

/** 외부(검색·현재위치)에서 좌표가 바뀌면 지도를 그 위치로 이동. */
function Recenter({
  lat,
  lng,
  selfMovedRef,
}: {
  lat: number | null;
  lng: number | null;
  selfMovedRef: React.RefObject<boolean>;
}) {
  const map = useMap();
  useEffect(() => {
    if (lat == null || lng == null) return;
    const c = map.getCenter();
    // 지도 드래그로 생긴 변경이면(이미 그 위치) 다시 이동하지 않는다.
    if (Math.abs(c.lat - lat) < EPS && Math.abs(c.lng - lng) < EPS) return;
    selfMovedRef.current = true; // 프로그램 이동 → moveend는 무시
    map.setView([lat, lng], Math.max(map.getZoom(), PICKED_ZOOM));
  }, [lat, lng, map, selfMovedRef]);
  return null;
}

/** 지도 이동이 멈추면 중앙 좌표를 부모로 전달. */
function MoveEmitter({
  onMove,
  selfMovedRef,
}: {
  onMove: (lat: number, lng: number) => void;
  selfMovedRef: React.RefObject<boolean>;
}) {
  const map = useMapEvents({
    moveend() {
      if (selfMovedRef.current) {
        selfMovedRef.current = false; // 프로그램 이동의 echo는 한 번 무시
        return;
      }
      const c = map.getCenter();
      onMove(c.lat, c.lng);
    },
  });
  return null;
}

/**
 * 지도가 처음 표시될 때 좌표가 아직 없으면 중앙(핀) 좌표를 1회 커밋.
 * "보이는 핀 위치 = 등록 위치"를 보장한다. (좌표가 이미 있으면 건드리지 않음)
 */
function InitialCommit({
  lat,
  lng,
  onMove,
}: {
  lat: number | null;
  lng: number | null;
  onMove: (lat: number, lng: number) => void;
}) {
  const map = useMap();
  const done = useRef(false);
  useEffect(() => {
    if (done.current) return;
    done.current = true;
    if (lat == null || lng == null) {
      const c = map.getCenter();
      onMove(c.lat, c.lng);
    }
    // 최초 1회만 실행 (done 가드)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}

/**
 * 중앙 고정 핀 방식의 위치 선택 지도.
 * 사용자가 지도를 움직이면 화면 중앙(핀 위치)의 좌표가 선택된다.
 */
export function LocationPickerMap({
  lat,
  lng,
  onChange,
}: {
  lat: number | null;
  lng: number | null;
  onChange: (lat: number, lng: number) => void;
}) {
  const selfMovedRef = useRef(false);
  const hasCoords = lat != null && lng != null;
  const center: [number, number] = hasCoords ? [lat, lng] : SEOUL_CITY_HALL;

  return (
    <div className="relative h-64 w-full overflow-hidden rounded-lg border border-border">
      <MapContainer
        center={center}
        zoom={hasCoords ? PICKED_ZOOM : DEFAULT_ZOOM}
        scrollWheelZoom
        className="size-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Recenter lat={lat} lng={lng} selfMovedRef={selfMovedRef} />
        <MoveEmitter onMove={onChange} selfMovedRef={selfMovedRef} />
        <InitialCommit lat={lat} lng={lng} onMove={onChange} />
      </MapContainer>

      {/* 중앙 고정 핀 (지도를 움직여 끝을 맞춘다) */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 z-[1000] -translate-x-1/2 -translate-y-full"
      >
        <svg
          width="32"
          height="32"
          viewBox="0 0 24 24"
          fill="#0d9488"
          stroke="#fff"
          strokeWidth="1.5"
          style={{ filter: "drop-shadow(0 2px 3px rgba(15,23,42,.4))" }}
        >
          <path d="M12 2c-3.87 0-7 3.13-7 7 0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
          <circle cx="12" cy="9" r="2.5" fill="#fff" stroke="none" />
        </svg>
      </div>
    </div>
  );
}
