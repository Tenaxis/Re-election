"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";
import type { MapPoint } from "@/components/map/map-view";

// react-leaflet은 window에 의존 → SSR 불가. 클라이언트에서만 로딩한다.
const MapView = dynamic(
  () => import("@/components/map/map-view").then((m) => m.MapView),
  {
    ssr: false,
    loading: () => (
      <Skeleton className="h-[70vh] w-full rounded-lg lg:h-[calc(100dvh-8rem)]" />
    ),
  },
);

export function MapClient({ points }: { points: MapPoint[] }) {
  return <MapView points={points} />;
}
