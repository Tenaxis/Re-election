"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signInWithEmail, signUpWithEmail, type AuthState } from "@/app/(auth)/actions";

type Mode = "login" | "signup";

const initialState: AuthState = {};

function SubmitButton({ mode }: { mode: Mode }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? "처리 중…" : mode === "login" ? "로그인" : "회원가입"}
    </Button>
  );
}

export function AuthForm({ mode, next }: { mode: Mode; next?: string }) {
  const action = mode === "login" ? signInWithEmail : signUpWithEmail;
  const [state, formAction] = useActionState(action, initialState);

  const emailError = state.fieldErrors?.email?.[0];
  const passwordError = state.fieldErrors?.password?.[0];

  return (
    <form action={formAction} className="space-y-4" noValidate>
      {next ? <input type="hidden" name="next" value={next} /> : null}

      <div className="space-y-1.5">
        <Label htmlFor="email">이메일</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          aria-invalid={emailError ? true : undefined}
          aria-describedby={emailError ? "email-error" : undefined}
          required
        />
        {emailError ? (
          <p id="email-error" className="text-sm text-destructive">
            {emailError}
          </p>
        ) : null}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="password">비밀번호</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete={mode === "login" ? "current-password" : "new-password"}
          placeholder="••••••••"
          aria-invalid={passwordError ? true : undefined}
          aria-describedby={passwordError ? "password-error" : undefined}
          required
        />
        {passwordError ? (
          <p id="password-error" className="text-sm text-destructive">
            {passwordError}
          </p>
        ) : null}
      </div>

      {state.error ? (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      ) : null}

      <SubmitButton mode={mode} />
    </form>
  );
}
