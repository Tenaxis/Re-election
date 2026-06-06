-- Phase 3: 신고/모더레이션
create table public.reports (
  id          uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  target_type text not null check (target_type in ('post','comment','support')),
  target_id   uuid not null,
  reason      text not null check (char_length(reason) between 1 and 1000),
  status      text not null default 'open' check (status in ('open','resolved')),
  created_at  timestamptz not null default now()
);
create index reports_status_idx on public.reports (status, created_at desc);

alter table public.reports enable row level security;
create policy reports_insert       on public.reports for insert with check (auth.uid() = reporter_id);
create policy reports_admin_read   on public.reports for select using (public.is_admin());
create policy reports_admin_update on public.reports for update using (public.is_admin());
create policy reports_admin_delete on public.reports for delete using (public.is_admin());
