"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LocationFormField } from "@/components/location/location-form-field";
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

      <LocationFormField
        initial={
          initial
            ? { address: initial.address, lat: initial.lat, lng: initial.lng }
            : undefined
        }
        label="장소 (필수)"
        addressRequired
        addressError={err?.address?.[0]}
      />

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

      <fieldset className="space-y-4 rounded-md border border-border bg-card p-4">
        <legend className="px-1 text-sm font-medium">참여 인증 설정 (선택)</legend>
        <div className="space-y-1.5">
          <Label htmlFor="verify_code">현장 인증 코드</Label>
          <Input
            id="verify_code"
            name="verify_code"
            defaultValue={initial?.verify_code ?? ""}
            placeholder="예) JUNE0607"
            maxLength={64}
            autoComplete="off"
            aria-invalid={err?.verify_code ? true : undefined}
            aria-describedby={err?.verify_code ? "verify_code-error" : undefined}
          />
          <FieldError id="verify_code-error" message={err?.verify_code?.[0]} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="verify_radius_m">인증 허용 반경 (m)</Label>
          <Input
            id="verify_radius_m"
            name="verify_radius_m"
            inputMode="numeric"
            defaultValue={initial?.verify_radius_m?.toString() ?? "500"}
            placeholder="500"
            aria-invalid={err?.verify_radius_m ? true : undefined}
            aria-describedby={err?.verify_radius_m ? "verify_radius_m-error" : undefined}
          />
          <FieldError id="verify_radius_m-error" message={err?.verify_radius_m?.[0]} />
        </div>

        <p className="text-xs text-muted-foreground">
          참여 인증에는 위 ‘장소’의 지도 위치가 필요합니다. 지도에서 위치를 지정하지
          않고 코드만 저장하면 인증을 받을 수 없습니다.
        </p>
      </fieldset>

      {state.error ? (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      ) : null}

      <SubmitButton isEdit={isEdit} />
    </form>
  );
}
