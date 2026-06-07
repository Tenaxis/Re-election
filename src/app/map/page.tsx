import { createClient } from "@/lib/supabase/server";
import { MapClient } from "@/components/map/map-client";
import type { MapPoint } from "@/components/map/map-view";

export const dynamic = "force-dynamic";

const SUPPORT_TYPE_LABEL: Record<string, string> = {
  manpower: "인력",
  food: "음식",
  hazard: "분신물 신고",
  cleanup: "현장 정리",
};

export default async function MapPage() {
  const supabase = await createClient();

  const [postsRes, supportRes, schedulesRes, liveRes] = await Promise.all([
    supabase
      .from("posts")
      .select("id, body, lat, lng")
      .not("lat", "is", null)
      .not("lng", "is", null),
    supabase
      .from("support_requests")
      .select("id, type, body, lat, lng")
      .not("lat", "is", null)
      .not("lng", "is", null),
    supabase
      .from("schedules")
      .select("id, name, lat, lng")
      .not("lat", "is", null)
      .not("lng", "is", null),
    supabase
      .from("live_streams")
      .select("id, location_label, schedule_id, lat, lng")
      .not("lat", "is", null)
      .not("lng", "is", null),
  ]);

  const points: MapPoint[] = [];

  for (const p of postsRes.data ?? []) {
    if (p.lat == null || p.lng == null) continue;
    const summary = p.body.trim().split("\n")[0];
    points.push({
      id: p.id,
      lat: p.lat,
      lng: p.lng,
      title: summary.length > 40 ? `${summary.slice(0, 40)}…` : summary || "글",
      kind: "post",
    });
  }

  for (const s of supportRes.data ?? []) {
    if (s.lat == null || s.lng == null) continue;
    points.push({
      id: s.id,
      lat: s.lat,
      lng: s.lng,
      title: SUPPORT_TYPE_LABEL[s.type] ?? "지원요청",
      kind: "support",
    });
  }

  for (const sc of schedulesRes.data ?? []) {
    if (sc.lat == null || sc.lng == null) continue;
    points.push({
      id: sc.id,
      lat: sc.lat,
      lng: sc.lng,
      title: sc.name,
      kind: "schedule",
    });
  }

  for (const lv of liveRes.data ?? []) {
    if (lv.lat == null || lv.lng == null) continue;
    points.push({
      id: lv.id,
      lat: lv.lat,
      lng: lv.lng,
      title: lv.location_label,
      kind: "live",
      href: `/schedule/${lv.schedule_id}/live`,
    });
  }

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold">지도</h1>
        <p className="text-sm text-text-2">
          좌표가 있는 글·지원요청·집회·라이브를 지도에서 확인하세요.
        </p>
      </div>

      <MapClient points={points} />
    </div>
  );
}
