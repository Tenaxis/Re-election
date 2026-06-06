import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types";

/** 현재 로그인 유저 + 프로필. 비로그인 시 둘 다 null. */
export async function getSessionUser(): Promise<{
  userId: string | null;
  profile: Profile | null;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { userId: null, profile: null };

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  return { userId: user.id, profile: profile ?? null };
}
