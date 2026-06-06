"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getSessionUser } from "@/lib/auth";
import type { ReportTarget } from "@/lib/types";

const reportSchema = z.object({
  targetType: z.enum(["post", "comment", "support"], {
    message: "잘못된 신고 대상입니다.",
  }),
  targetId: z.string().uuid("잘못된 신고 대상입니다."),
  reason: z
    .string()
    .trim()
    .min(1, "신고 사유를 입력하세요.")
    .max(1000, "신고 사유는 1000자 이내여야 합니다."),
});

/** 글/댓글/지원요청 신고 생성. 로그인 유저만 가능. */
export async function createReport(
  targetType: ReportTarget,
  targetId: string,
  reason: string,
): Promise<void> {
  const { userId } = await getSessionUser();
  if (!userId) throw new Error("로그인이 필요합니다.");

  const parsed = reportSchema.safeParse({ targetType, targetId, reason });
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "잘못된 요청입니다.");
  }

  const supabase = await createClient();
  const { error } = await supabase.from("reports").insert({
    reporter_id: userId,
    target_type: parsed.data.targetType,
    target_id: parsed.data.targetId,
    reason: parsed.data.reason,
  });

  if (error) throw new Error("신고 접수에 실패했습니다. 다시 시도해주세요.");
}
