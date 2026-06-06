"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getSessionUser } from "@/lib/auth";
import type { SupportStatus } from "@/lib/types";

export type SupportFormState = {
  error?: string;
  fieldErrors?: Record<string, string[] | undefined>;
};

const optionalCoord = z
  .string()
  .trim()
  .refine((v) => v === "" || !Number.isNaN(Number(v)), "숫자를 입력하세요.")
  .transform((v) => (v === "" ? null : Number(v)));

const optionalText = z
  .string()
  .trim()
  .transform((v) => (v === "" ? null : v));

const supportSchema = z.object({
  type: z.enum(["manpower", "food", "hazard", "cleanup"], {
    message: "지원 유형을 선택하세요.",
  }),
  body: z
    .string()
    .trim()
    .min(1, "내용을 입력하세요.")
    .max(2000, "내용은 2000자 이내여야 합니다."),
  address: optionalText,
  lat: optionalCoord,
  lng: optionalCoord,
});

function parse(formData: FormData) {
  return supportSchema.safeParse({
    type: formData.get("type") ?? "",
    body: formData.get("body") ?? "",
    address: formData.get("address") ?? "",
    lat: formData.get("lat") ?? "",
    lng: formData.get("lng") ?? "",
  });
}

export async function createSupport(
  _prev: SupportFormState,
  formData: FormData,
): Promise<SupportFormState> {
  const { userId } = await getSessionUser();
  if (!userId) redirect("/login?next=/support/new");

  const parsed = parse(formData);
  if (!parsed.success) {
    return { fieldErrors: z.flattenError(parsed.error).fieldErrors };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("support_requests")
    .insert({ ...parsed.data, author_id: userId })
    .select("id")
    .single();

  if (error) return { error: "지원요청 등록에 실패했습니다. 다시 시도해주세요." };

  revalidatePath("/support");
  redirect(`/support/${data.id}`);
}

export async function updateSupport(
  _prev: SupportFormState,
  formData: FormData,
): Promise<SupportFormState> {
  const { userId } = await getSessionUser();
  if (!userId) redirect("/login?next=/support");

  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "잘못된 요청입니다." };

  const parsed = parse(formData);
  if (!parsed.success) {
    return { fieldErrors: z.flattenError(parsed.error).fieldErrors };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("support_requests")
    .update(parsed.data)
    .eq("id", id);

  if (error) return { error: "지원요청 수정에 실패했습니다. 다시 시도해주세요." };

  revalidatePath("/support");
  revalidatePath(`/support/${id}`);
  redirect(`/support/${id}`);
}

export async function updateSupportStatus(
  id: string,
  status: SupportStatus,
): Promise<void> {
  const { userId } = await getSessionUser();
  if (!userId) throw new Error("로그인이 필요합니다.");

  if (!["open", "in_progress", "done"].includes(status)) {
    throw new Error("잘못된 상태입니다.");
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("support_requests")
    .update({ status })
    .eq("id", id);

  if (error) throw new Error("상태 변경에 실패했습니다.");

  revalidatePath("/support");
  revalidatePath(`/support/${id}`);
}

export async function deleteSupport(formData: FormData): Promise<void> {
  const { userId } = await getSessionUser();
  if (!userId) redirect("/login?next=/support");

  const id = String(formData.get("id") ?? "");
  if (!id) redirect("/support");

  const supabase = await createClient();
  const { error } = await supabase.from("support_requests").delete().eq("id", id);

  if (error) redirect(`/support/${id}?error=delete`);

  revalidatePath("/support");
  redirect("/support");
}
