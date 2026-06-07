"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { LocationFormField } from "@/components/location/location-form-field";
import {
  createSupport,
  updateSupport,
  type SupportFormState,
} from "@/app/support/actions";
import type { SupportRequest, SupportType } from "@/lib/types";

const initialState: SupportFormState = {};

const TYPES: { value: SupportType; label: string }[] = [
  { value: "manpower", label: "위치(인력)" },
  { value: "food", label: "음식" },
  { value: "hazard", label: "분신물 신고" },
  { value: "cleanup", label: "현장 정리" },
];

function SubmitButton({ isEdit }: { isEdit: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? "저장 중…" : isEdit ? "수정 완료" : "지원 요청하기"}
    </Button>
  );
}

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} className="text-sm text-destructive">
      {message}
    </p>
  );
}

export function SupportForm({ initial }: { initial?: SupportRequest }) {
  const isEdit = Boolean(initial);
  const action = isEdit ? updateSupport : createSupport;
  const [state, formAction] = useActionState(action, initialState);

  const err = state.fieldErrors;

  return (
    <form action={formAction} className="space-y-5" noValidate>
      {initial ? <input type="hidden" name="id" value={initial.id} /> : null}

      <div className="space-y-1.5">
        <Label htmlFor="type">지원 유형</Label>
        <select
          id="type"
          name="type"
          defaultValue={initial?.type ?? "manpower"}
          aria-invalid={err?.type ? true : undefined}
          aria-describedby={err?.type ? "type-error" : undefined}
          className={cn(
            "flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-base shadow-sm transition-colors",
            "focus-visible:outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30",
          )}
        >
          {TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
        <FieldError id="type-error" message={err?.type?.[0]} />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="body">내용</Label>
        <Textarea
          id="body"
          name="body"
          defaultValue={initial?.body ?? ""}
          placeholder="필요한 지원 내용을 구체적으로 적어주세요."
          className="min-h-32"
          maxLength={2000}
          aria-invalid={err?.body ? true : undefined}
          aria-describedby={err?.body ? "body-error" : undefined}
          required
        />
        <FieldError id="body-error" message={err?.body?.[0]} />
      </div>

      <LocationFormField
        initial={
          initial
            ? { address: initial.address, lat: initial.lat, lng: initial.lng }
            : undefined
        }
        label="위치 (선택)"
        addressError={err?.address?.[0]}
        autoLocate={!isEdit}
      />

      {state.error ? (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      ) : null}

      <SubmitButton isEdit={isEdit} />
    </form>
  );
}
