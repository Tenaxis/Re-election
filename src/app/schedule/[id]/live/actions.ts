"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSessionUser } from "@/lib/auth";
import { parseYoutube } from "@/lib/youtube";

export type AddLiveInput = {
  scheduleId: string;
  url: string;
  locationLabel: string;
  title: string | null;
  lat: number | null;
  lng: number | null;
};

/** 집회에 라이브 스트림 추가. 유튜브 링크를 파싱해 video/channel로 저장. */
export async function addLiveStream(
  input: AddLiveInput,
): Promise<{ id: string }> {
  const { userId } = await getSessionUser();
  if (!userId) redirect(`/login?next=/schedule/${input.scheduleId}/live`);

  const label = input.locationLabel.trim();
  if (!label) throw new Error("위치 라벨을 입력하세요.");

  const src = parseYoutube(input.url);
  if (!src) {
    throw new Error(
      "유효한 유튜브 영상 링크 또는 /channel/ 링크를 넣어주세요. (@핸들 링크는 지원하지 않습니다)",
    );
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("live_streams")
    .insert({
      schedule_id: input.scheduleId,
      location_label: label,
      source_type: src.sourceType,
      youtube_ref: src.ref,
      title: input.title?.trim() || null,
      lat: input.lat,
      lng: input.lng,
      added_by: userId,
    })
    .select("id")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "라이브 추가에 실패했습니다.");
  }

  revalidatePath(`/schedule/${input.scheduleId}/live`);
  revalidatePath(`/schedule/${input.scheduleId}`);
  revalidatePath("/map");
  return { id: data.id };
}

/** 라이브 스트림 삭제 (RLS: 추가자 또는 관리자만). */
export async function deleteLiveStream(
  id: string,
  scheduleId: string,
): Promise<void> {
  const { userId } = await getSessionUser();
  if (!userId) throw new Error("로그인이 필요합니다.");

  const supabase = await createClient();
  const { error } = await supabase.from("live_streams").delete().eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath(`/schedule/${scheduleId}/live`);
  revalidatePath(`/schedule/${scheduleId}`);
  revalidatePath("/map");
}
