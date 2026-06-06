"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { setNickname, type NicknameState } from "@/app/onboarding/actions";

const initialState: NicknameState = {};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? "저장 중…" : "시작하기"}
    </Button>
  );
}

export function NicknameForm({ defaultValue }: { defaultValue?: string }) {
  const [state, formAction] = useActionState(setNickname, initialState);
  const nicknameError = state.fieldErrors?.nickname?.[0] ?? state.error;

  return (
    <form action={formAction} className="space-y-4" noValidate>
      <div className="space-y-1.5">
        <Label htmlFor="nickname">닉네임</Label>
        <Input
          id="nickname"
          name="nickname"
          type="text"
          autoComplete="nickname"
          placeholder="2~20자"
          minLength={2}
          maxLength={20}
          defaultValue={defaultValue}
          aria-invalid={nicknameError ? true : undefined}
          aria-describedby={nicknameError ? "nickname-error" : undefined}
          required
        />
        {nicknameError ? (
          <p id="nickname-error" role="alert" className="text-sm text-destructive">
            {nicknameError}
          </p>
        ) : null}
      </div>
      <SubmitButton />
    </form>
  );
}
