"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getSessionUser } from "@/lib/auth";
import type { ReportTarget } from "@/lib/types";

const TARGET_TABLE: Record<ReportTarget, "posts" | "comments" | "support_requests"> = {
  post: "posts",
  comment: "comments",
  support: "support_requests",
};

async function requireAdmin() {
  const { profile } = await getSessionUser();
  if (profile?.role !== "admin") throw new Error("권한이 없습니다.");
}

/** 신고 해결 처리. admin만 가능. */
export async function resolveReport(id: string): Promise<void> {
  await requireAdmin();

  const supabase = await createClient();
  const { error } = await supabase
    .from("reports")
    .update({ status: "resolved" })
    .eq("id", id);

  if (error) throw new Error("신고 처리에 실패했습니다.");

  revalidatePath("/admin");
}

/** 신고된 콘텐츠 삭제 + 해당 대상의 open 신고들을 resolved 처리. admin만 가능. */
export async function deleteReportedContent(
  targetType: ReportTarget,
  targetId: string,
  reportId: string,
): Promise<void> {
  await requireAdmin();

  const table = TARGET_TABLE[targetType];
  if (!table) throw new Error("잘못된 신고 대상입니다.");

  const supabase = await createClient();

  const { error: deleteError } = await supabase
    .from(table)
    .delete()
    .eq("id", targetId);

  if (deleteError) throw new Error("콘텐츠 삭제에 실패했습니다.");

  // 동일 대상에 대한 모든 open 신고를 해결 처리 (개별 reportId 포함)
  const { error: resolveError } = await supabase
    .from("reports")
    .update({ status: "resolved" })
    .eq("target_type", targetType)
    .eq("target_id", targetId)
    .eq("status", "open");

  if (resolveError) {
    // 콘텐츠는 삭제됐으니 해당 신고만이라도 처리 시도
    await supabase.from("reports").update({ status: "resolved" }).eq("id", reportId);
  }

  revalidatePath("/admin");
}
