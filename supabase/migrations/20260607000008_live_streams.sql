-- 집회 실시간 라이브 멀티뷰: 집회당 위치별 유튜브 라이브 N개
create table public.live_streams (
  id             uuid primary key default gen_random_uuid(),
  schedule_id    uuid not null references public.schedules(id) on delete cascade,
  location_label text not null check (char_length(location_label) between 1 and 100),
  source_type    text not null check (source_type in ('video','channel')),
  youtube_ref    text not null check (char_length(youtube_ref) between 1 and 64),
  title          text check (char_length(title) <= 200),
  lat            double precision,
  lng            double precision,
  added_by       uuid not null references public.profiles(id) on delete cascade,
  sort_order     int not null default 0,
  created_at     timestamptz not null default now()
);
create index live_streams_schedule_idx on public.live_streams (schedule_id, sort_order, created_at);

alter table public.live_streams enable row level security;
create policy live_streams_read   on public.live_streams for select using (true);
create policy live_streams_insert on public.live_streams for insert with check (auth.uid() = added_by);
create policy live_streams_update on public.live_streams for update using (auth.uid() = added_by or public.is_admin());
create policy live_streams_delete on public.live_streams for delete using (auth.uid() = added_by or public.is_admin());
