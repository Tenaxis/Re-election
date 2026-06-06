"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

export type AuthState = {
  error?: string;
  fieldErrors?: {
    email?: string[];
    password?: string[];
  };
};

const authSchema = z.object({
  email: z.string().email("올바른 이메일 주소를 입력하세요."),
  password: z.string().min(6, "비밀번호는 6자 이상이어야 합니다."),
});

/** 로그인 후 이동할 경로를 안전하게 정규화 (오픈 리다이렉트 방지). */
function safeNext(next: FormDataEntryValue | null, fallback: string): string {
  if (typeof next === "string" && next.startsWith("/") && !next.startsWith("//")) {
    return next;
  }
  return fallback;
}

export async function signInWithEmail(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const parsed = authSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { fieldErrors: z.flattenError(parsed.error).fieldErrors };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    return { error: "이메일 또는 비밀번호가 올바르지 않습니다." };
  }

  redirect(safeNext(formData.get("next"), "/"));
}

export async function signUpWithEmail(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const parsed = authSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { fieldErrors: z.flattenError(parsed.error).fieldErrors };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp(parsed.data);

  if (error) {
    return { error: error.message };
  }

  // 이메일 확인 비활성 가정 — 가입 즉시 세션. 닉네임 온보딩으로.
  redirect("/onboarding");
}
