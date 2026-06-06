-- Phase 2: 지원요청
create table public.support_requests (
  id          uuid primary key default gen_random_uuid(),
  author_id   uuid not null references public.profiles(id) on delete cascade,
  type        text not null check (type in ('manpower','food','hazard','cleanup')),
  body        text not null check (char_length(body) between 1 and 2000),
  lat         double precision,
  lng         double precision,
  address     text,
  status      text not null default 'open' check (status in ('open','in_progress','done')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index support_status_idx on public.support_requests (status, created_at desc);
create trigger support_touch before update on public.support_requests
  for each row execute function public.touch_updated_at();

alter table public.support_requests enable row level security;
create policy support_read   on public.support_requests for select using (true);
create policy support_insert on public.support_requests for insert with check (auth.uid() = author_id);
create policy support_update on public.support_requests for update using (auth.uid() = author_id or public.is_admin());
create policy support_delete on public.support_requests for delete using (auth.uid() = author_id or public.is_admin());
