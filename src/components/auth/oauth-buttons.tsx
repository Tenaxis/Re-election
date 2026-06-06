"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type Provider = "kakao" | "google";

const PROVIDERS: { provider: Provider; label: string }[] = [
  { provider: "kakao", label: "카카오로 계속하기" },
  { provider: "google", label: "구글로 계속하기" },
];

export function OAuthButtons({ next }: { next?: string }) {
  const [loading, setLoading] = useState<Provider | null>(null);

  async function handleOAuth(provider: Provider) {
    setLoading(provider);
    const supabase = createClient();
    const nextParam = next ? `?next=${encodeURIComponent(next)}` : "";
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${location.origin}/auth/callback${nextParam}`,
        // 카카오는 닉네임만 요청(이메일 요구로 인한 KOE205 회피). 우리 앱은 가명만 사용.
        ...(provider === "kakao" ? { scopes: "profile_nickname" } : {}),
      },
    });
    if (error) {
      toast.error(error.message);
      setLoading(null);
    }
  }

  return (
    <div className="space-y-2">
      {PROVIDERS.map(({ provider, label }) => (
        <Button
          key={provider}
          type="button"
          variant="secondary"
          className="w-full"
          disabled={loading !== null}
          onClick={() => handleOAuth(provider)}
        >
          {loading === provider ? "이동 중…" : label}
        </Button>
      ))}
    </div>
  );
}
