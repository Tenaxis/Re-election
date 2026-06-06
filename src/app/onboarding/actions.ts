"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

export type NicknameState = {
  error?: string;
  fieldErrors?: {
    nickname?: string[];
  };
};

const nicknameSchema = z.object({
  nickname: z
    .string()
    .trim()
    .min(2, "닉네임은 2자 이상이어야 합니다.")
    .max(20, "닉네임은 20자 이하여야 합니다."),
});

export async function setNickname(
  _prev: NicknameState,
  formData: FormData,
): Promise<NicknameState> {
  const parsed = nicknameSchema.safeParse({
    nickname: formData.get("nickname"),
  });

  if (!parsed.success) {
    return { fieldErrors: z.flattenError(parsed.error).fieldErrors };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { nickname } = parsed.data;

  // 중복 검사: 다른 유저가 이미 사용 중인지 확인.
  const { data: existing } = await supabase
    .from("profiles")
    .select("id")
    .eq("nickname", nickname)
    .neq("id", user.id)
    .maybeSingle();

  if (existing) {
    return { fieldErrors: { nickname: ["이미 사용 중인 닉네임입니다."] } };
  }

  const { error } = await supabase
    .from("profiles")
    .update({ nickname })
    .eq("id", user.id);

  if (error) {
    // unique 제약 위반 등
    if (error.code === "23505") {
      return { fieldErrors: { nickname: ["이미 사용 중인 닉네임입니다."] } };
    }
    return { error: "닉네임 저장에 실패했습니다. 다시 시도해주세요." };
  }

  redirect("/");
}
