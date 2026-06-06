"use server";

import { createHash } from "node:crypto";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getSessionUser } from "@/lib/auth";
import { haversineMeters } from "@/lib/geo";

// ⚠️ 위조방지 한계: 실제 SMS OTP는 외부 공급자(Twilio 등) 연동이 필요하다.
// 현재 구현은 번호 형식 검증 + 해시 저장 + 1일1회 중복차단까지만 수행한다.
// (브라우저 GPS·사진은 조작 가능 → 완벽 차단 불가. 목표는 "부정 비용 상승".)

// 휴대폰 번호 해시용 상수 pepper. 평문 번호를 DB에 저장하지 않기 위함.
// (운영 시 환경변수로 분리 권장)
const PHONE_PEPPER = process.env.ATTENDANCE_PHONE_PEPPER ?? "re-election:attendance:v1";

export type VerifyAttendanceInput = {
  scheduleId: string;
  lat: number;
  lng: number;
  code: string;
  phone: string;
  photoPath: string;
};

function normalizePhone(raw: string): string {
  return raw.replace(/\D/g, "");
}

function hashPhone(normalized: string): string {
  return createHash("sha256")
    .update(`${PHONE_PEPPER}:${normalized}`)
    .digest("hex");
}

/** 참여 인증 등록. 코드·지오펜스 검증 후 insert. 1인/1폰 1일1회. */
export async function verifyAttendance(
  input: VerifyAttendanceInput,
): Promise<{ ok: true }> {
  const { userId } = await getSessionUser();
  if (!userId) throw new Error("로그인이 필요합니다.");

  const supabase = await createClient();

  const { data: schedule } = await supabase
    .from("schedules")
    .select("id, lat, lng, verify_code, verify_radius_m")
    .eq("id", input.scheduleId)
    .maybeSingle();

  if (!schedule) throw new Error("집회를 찾을 수 없습니다.");
  if (schedule.lat == null || schedule.lng == null || !schedule.verify_code) {
    throw new Error("주최자가 인증을 설정하지 않았습니다.");
  }

  // 현장 코드 검증 (대소문자 무시 / trim)
  const expected = schedule.verify_code.trim().toLowerCase();
  const provided = input.code.trim().toLowerCase();
  if (!provided) throw new Error("현장 코드를 입력하세요.");
  if (provided !== expected) throw new Error("현장 코드가 일치하지 않습니다.");

  // 지오펜스 검증 (서버에서 거리 계산)
  if (!Number.isFinite(input.lat) || !Number.isFinite(input.lng)) {
    throw new Error("현재 위치를 확인해주세요.");
  }
  const distance = haversineMeters(input.lat, input.lng, schedule.lat, schedule.lng);
  if (distance > schedule.verify_radius_m) {
    throw new Error("현장 범위를 벗어났습니다.");
  }

  // 휴대폰 정규화 + 형식 검증 + 해시 (SMS 미연동: 번호 형식만 확인)
  const phone = normalizePhone(input.phone);
  if (phone.length < 10 || phone.length > 11) {
    throw new Error("올바른 휴대폰 번호를 입력하세요.");
  }
  if (!input.photoPath) throw new Error("인증 사진이 필요합니다.");

  const phoneHash = hashPhone(phone);

  const { error } = await supabase.from("attendance_verifications").insert({
    schedule_id: input.scheduleId,
    user_id: userId,
    phone_hash: phoneHash,
    lat: input.lat,
    lng: input.lng,
    photo_path: input.photoPath,
  });

  if (error) {
    // unique 위반 → 본인 또는 동일 번호가 오늘 이미 인증함
    if (error.code === "23505") throw new Error("오늘 이미 인증했습니다.");
    throw new Error("인증에 실패했습니다. 다시 시도해주세요.");
  }

  revalidatePath(`/schedule/${input.scheduleId}`);
  revalidatePath(`/schedule/${input.scheduleId}/verify`);
  return { ok: true };
}
