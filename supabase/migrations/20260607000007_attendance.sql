-- Phase 4: 참여 인증
alter table public.schedules
  add column if not exists verify_code text,
  add column if not exists verify_radius_m int not null default 500;

create table public.attendance_verifications (
  id            uuid primary key default gen_random_uuid(),
  schedule_id   uuid not null references public.schedules(id) on delete cascade,
  user_id       uuid not null references public.profiles(id) on delete cascade,
  phone_hash    text not null,
  lat           double precision not null,
  lng           double precision not null,
  photo_path    text not null,
  verified_date date not null default current_date,
  created_at    timestamptz not null default now(),
  unique (user_id, schedule_id, verified_date),     -- 1인 1일 1회(집회별)
  unique (phone_hash, schedule_id, verified_date)    -- 1휴대폰 1일 1회(집회별)
);
create index attendance_sched_date_idx on public.attendance_verifications (schedule_id, verified_date);

alter table public.attendance_verifications enable row level security;
-- 행 자체는 본인/admin만 조회(프라이버시). 카운트는 아래 뷰로 공개.
create policy attendance_insert    on public.attendance_verifications for insert with check (auth.uid() = user_id);
create policy attendance_read_own  on public.attendance_verifications for select using (auth.uid() = user_id or public.is_admin());

-- 오늘 인증 인원 집계(정의자 권한으로 RLS 우회 → 카운트만 공개)
create view public.attendance_today
with (security_invoker = false) as
select schedule_id, count(*)::int as cnt
from public.attendance_verifications
where verified_date = current_date
group by schedule_id;

grant select on public.attendance_today to anon, authenticated;
