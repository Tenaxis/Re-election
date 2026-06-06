"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  createSchedule,
  updateSchedule,
  type ScheduleFormState,
} from "@/app/schedule/actions";
import { toDatetimeLocal } from "@/lib/format";
import type { Schedule } from "@/lib/types";

const initialState: ScheduleFormState = {};

function SubmitButton({ isEdit }: { isEdit: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? "저장 중…" : isEdit ? "수정 완료" : "일정 등록"}
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

export function ScheduleForm({ initial }: { initial?: Schedule }) {
  const isEdit = Boolean(initial);
  const action = isEdit ? updateSchedule : createSchedule;
  const [state, formAction] = useActionState(action, initialState);

  const err = state.fieldErrors;

  return (
    <form action={formAction} className="space-y-5" noValidate>
      {initial ? <input type="hidden" name="id" value={initial.id} /> : null}

      <div className="space-y-1.5">
        <Label htmlFor="name">집회명</Label>
        <Input
          id="name"
          name="name"
          defaultValue={initial?.name ?? ""}
          placeholder="예) 6월 민주항쟁 기념 집회"
          maxLength={200}
          aria-invalid={err?.name ? true : undefined}
          aria-describedby={err?.name ? "name-error" : undefined}
          required
        />
        <FieldError id="name-error" message={err?.name?.[0]} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="starts_at">시작 일시</Label>
          <Input
            id="starts_at"
            name="starts_at"
            type="datetime-local"
            defaultValue={initial ? toDatetimeLocal(initial.starts_at) : ""}
            aria-invalid={err?.starts_at ? true : undefined}
            aria-describedby={err?.starts_at ? "starts_at-error" : undefined}
            required
          />
          <FieldError id="starts_at-error" message={err?.starts_at?.[0]} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="ends_at">종료 일시 (선택)</Label>
          <Input
            id="ends_at"
            name="ends_at"
            type="datetime-local"
            defaultValue={initial?.ends_at ? toDatetimeLocal(initial.ends_at) : ""}
            aria-invalid={err?.ends_at ? true : undefined}
            aria-describedby={err?.ends_at ? "ends_at-error" : undefined}
          />
          <FieldError id="ends_at-error" message={err?.ends_at?.[0]} />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="address">장소 (주소)</Label>
        <Textarea
          id="address"
          name="address"
          defaultValue={initial?.address ?? ""}
          placeholder="예) 서울특별시 중구 세종대로 110"
          className="min-h-20"
          aria-invalid={err?.address ? true : undefined}
          aria-describedby={err?.address ? "address-error" : undefined}
          required
        />
        <FieldError id="address-error" message={err?.address?.[0]} />
      </div>

      <fieldset className="grid gap-4 sm:grid-cols-2">
        <legend className="sr-only">위치 좌표 (선택)</legend>
        <div className="space-y-1.5">
          <Label htmlFor="lat">위도 (선택)</Label>
          <Input
            id="lat"
            name="lat"
            inputMode="decimal"
            defaultValue={initial?.lat?.toString() ?? ""}
            placeholder="37.5665"
            aria-invalid={err?.lat ? true : undefined}
            aria-describedby={err?.lat ? "lat-error" : undefined}
          />
          <FieldError id="lat-error" message={err?.lat?.[0]} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="lng">경도 (선택)</Label>
          <Input
            id="lng"
            name="lng"
            inputMode="decimal"
            defaultValue={initial?.lng?.toString() ?? ""}
            placeholder="126.9780"
            aria-invalid={err?.lng ? true : undefined}
            aria-describedby={err?.lng ? "lng-error" : undefined}
          />
          <FieldError id="lng-error" message={err?.lng?.[0]} />
        </div>
      </fieldset>

      <div className="flex items-center gap-3 rounded-md border border-border bg-card p-3">
        <input
          id="is_reported"
          name="is_reported"
          type="checkbox"
          defaultChecked={initial?.is_reported ?? false}
          className="size-5 shrink-0 cursor-pointer accent-primary"
        />
        <Label htmlFor="is_reported" className="cursor-pointer font-normal">
          집회 신고를 완료했습니다
        </Label>
      </div>

      {state.error ? (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      ) : null}

      <SubmitButton isEdit={isEdit} />
    </form>
  );
}
