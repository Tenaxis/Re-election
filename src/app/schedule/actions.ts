"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getSessionUser } from "@/lib/auth";

export type ScheduleFormState = {
  error?: string;
  fieldErrors?: Record<string, string[] | undefined>;
};

// datetime-local 문자열("2026-06-07T14:30") → ISO. 빈 값은 null/에러로 처리.
const datetimeLocal = z
  .string()
  .trim()
  .min(1)
  .refine((v) => !Number.isNaN(new Date(v).getTime()), "올바른 일시를 입력하세요.")
  .transform((v) => new Date(v).toISOString());

const optionalDatetimeLocal = z
  .string()
  .trim()
  .refine((v) => v === "" || !Number.isNaN(new Date(v).getTime()), "올바른 일시를 입력하세요.")
  .transform((v) => (v === "" ? null : new Date(v).toISOString()));

const optionalCoord = z
  .string()
  .trim()
  .refine((v) => v === "" || !Number.isNaN(Number(v)), "숫자를 입력하세요.")
  .transform((v) => (v === "" ? null : Number(v)));

const scheduleSchema = z
  .object({
    name: z.string().trim().min(1, "집회명을 입력하세요.").max(200, "집회명은 200자 이내여야 합니다."),
    starts_at: datetimeLocal,
    ends_at: optionalDatetimeLocal,
    address: z.string().trim().min(1, "장소(주소)를 입력하세요."),
    lat: optionalCoord,
    lng: optionalCoord,
    is_reported: z.boolean(),
    verify_code: z
      .string()
      .trim()
      .max(64, "인증 코드는 64자 이내여야 합니다.")
      .transform((v) => (v === "" ? null : v)),
    verify_radius_m: z
      .string()
      .trim()
      .refine((v) => v === "" || (!Number.isNaN(Number(v)) && Number(v) > 0), "양수를 입력하세요.")
      .transform((v) => (v === "" ? 500 : Math.round(Number(v)))),
  })
  .refine(
    (v) => v.ends_at === null || new Date(v.ends_at) >= new Date(v.starts_at),
    { message: "종료 일시는 시작 일시 이후여야 합니다.", path: ["ends_at"] },
  );

function parse(formData: FormData) {
  return scheduleSchema.safeParse({
    name: formData.get("name") ?? "",
    starts_at: formData.get("starts_at") ?? "",
    ends_at: formData.get("ends_at") ?? "",
    address: formData.get("address") ?? "",
    lat: formData.get("lat") ?? "",
    lng: formData.get("lng") ?? "",
    is_reported: formData.get("is_reported") === "on" || formData.get("is_reported") === "true",
    verify_code: formData.get("verify_code") ?? "",
    verify_radius_m: formData.get("verify_radius_m") ?? "",
  });
}

export async function createSchedule(
  _prev: ScheduleFormState,
  formData: FormData,
): Promise<ScheduleFormState> {
  const { userId } = await getSessionUser();
  if (!userId) redirect("/login?next=/schedule/new");

  const parsed = parse(formData);
  if (!parsed.success) {
    return { fieldErrors: z.flattenError(parsed.error).fieldErrors };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("schedules")
    .insert({ ...parsed.data, author_id: userId })
    .select("id")
    .single();

  if (error) return { error: "일정 등록에 실패했습니다. 다시 시도해주세요." };

  revalidatePath("/schedule");
  redirect(`/schedule/${data.id}`);
}

export async function updateSchedule(
  _prev: ScheduleFormState,
  formData: FormData,
): Promise<ScheduleFormState> {
  const { userId } = await getSessionUser();
  if (!userId) redirect("/login?next=/schedule");

  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "잘못된 요청입니다." };

  const parsed = parse(formData);
  if (!parsed.success) {
    return { fieldErrors: z.flattenError(parsed.error).fieldErrors };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("schedules")
    .update(parsed.data)
    .eq("id", id);

  if (error) return { error: "일정 수정에 실패했습니다. 다시 시도해주세요." };

  revalidatePath("/schedule");
  revalidatePath(`/schedule/${id}`);
  redirect(`/schedule/${id}`);
}

export async function deleteSchedule(formData: FormData): Promise<void> {
  const { userId } = await getSessionUser();
  if (!userId) redirect("/login?next=/schedule");

  const id = String(formData.get("id") ?? "");
  if (!id) redirect("/schedule");

  const supabase = await createClient();
  const { error } = await supabase.from("schedules").delete().eq("id", id);

  if (error) redirect(`/schedule/${id}?error=delete`);

  revalidatePath("/schedule");
  redirect("/schedule");
}
