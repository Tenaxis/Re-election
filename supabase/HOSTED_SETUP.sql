-- 호스팅 Supabase 적용용 통합 마이그레이션 (대시보드 SQL Editor에 붙여넣기)
-- 또는: supabase db push (DB 비밀번호 필요)

-- ===== 20260607000001_init.sql =====
-- Phase 1 초기 스키마
create extension if not exists "pgcrypto";

-- profiles : auth.users 1:1, 닉네임(가명)만 노출
create table public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  nickname    text unique,
  role        text not null default 'user' check (role in ('user','admin')),
  created_at  timestamptz not null default now()
);

-- posts : 단일 게시글(증거자료 = 위치/시간/태그 단 글)
create table public.posts (
  id          uuid primary key default gen_random_uuid(),
  author_id   uuid not null references public.profiles(id) on delete cascade,
  body        text not null check (char_length(body) <= 5000),
  lat         double precision,
  lng         double precision,
  address     text,
  occurred_at timestamptz,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index posts_created_idx on public.posts (created_at desc);
create index posts_author_idx  on public.posts (author_id);

-- post_media : 글당 사진/영상
create table public.post_media (
  id           uuid primary key default gen_random_uuid(),
  post_id      uuid not null references public.posts(id) on delete cascade,
  storage_path text not null,
  type         text not null check (type in ('image','video')),
  sort_order   int  not null default 0,
  created_at   timestamptz not null default now()
);
create index post_media_post_idx on public.post_media (post_id);

-- post_tags
create table public.post_tags (
  post_id uuid not null references public.posts(id) on delete cascade,
  tag     text not null check (char_length(tag) <= 30),
  primary key (post_id, tag)
);
create index post_tags_tag_idx on public.post_tags (tag);

-- comments : 1단계 대댓글
create table public.comments (
  id         uuid primary key default gen_random_uuid(),
  post_id    uuid not null references public.posts(id) on delete cascade,
  author_id  uuid not null references public.profiles(id) on delete cascade,
  parent_id  uuid references public.comments(id) on delete cascade,
  body       text not null check (char_length(body) between 1 and 2000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index comments_post_idx on public.comments (post_id, created_at);

create or replace function public.enforce_single_depth() returns trigger as $$
begin
  if new.parent_id is not null then
    if exists (select 1 from public.comments c where c.id = new.parent_id and c.parent_id is not null) then
      raise exception 'replies can only be one level deep';
    end if;
  end if;
  return new;
end; $$ language plpgsql;
create trigger comments_single_depth before insert or update on public.comments
  for each row execute function public.enforce_single_depth();

-- likes : 글/댓글 공용, 1인 1대상 1회
create table public.likes (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  target_type text not null check (target_type in ('post','comment')),
  target_id   uuid not null,
  created_at  timestamptz not null default now(),
  unique (user_id, target_type, target_id)
);
create index likes_target_idx on public.likes (target_type, target_id);

-- schedules : 집회 일정
create table public.schedules (
  id          uuid primary key default gen_random_uuid(),
  author_id   uuid not null references public.profiles(id) on delete cascade,
  name        text not null check (char_length(name) <= 200),
  starts_at   timestamptz not null,
  ends_at     timestamptz,
  lat         double precision,
  lng         double precision,
  address     text not null,
  is_reported boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index schedules_starts_idx on public.schedules (starts_at);

-- updated_at 자동 갱신
create or replace function public.touch_updated_at() returns trigger as $$
begin new.updated_at = now(); return new; end; $$ language plpgsql;
create trigger posts_touch     before update on public.posts     for each row execute function public.touch_updated_at();
create trigger comments_touch  before update on public.comments  for each row execute function public.touch_updated_at();
create trigger schedules_touch before update on public.schedules for each row execute function public.touch_updated_at();

-- 신규 가입 시 profiles 자동 생성(닉네임 null → 앱에서 온보딩 강제)
create or replace function public.handle_new_user() returns trigger as $$
begin
  insert into public.profiles (id) values (new.id) on conflict do nothing;
  return new;
end; $$ language plpgsql security definer;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- 관리자 판별 헬퍼
create or replace function public.is_admin() returns boolean as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$ language sql security definer stable;

-- 피드 집계 뷰 (security_invoker: 호출자 RLS 적용)
create view public.post_feed with (security_invoker = true) as
select p.*,
  (select count(*) from public.likes l where l.target_type='post' and l.target_id=p.id) as like_count,
  (select count(*) from public.comments c where c.post_id=p.id) as comment_count
from public.posts p;

-- ===== 20260607000002_rls.sql =====
-- Phase 1 RLS: 읽기 모두 허용 · 생성 로그인+본인 · 수정/삭제 본인 또는 admin
alter table public.profiles    enable row level security;
alter table public.posts       enable row level security;
alter table public.post_media  enable row level security;
alter table public.post_tags   enable row level security;
alter table public.comments    enable row level security;
alter table public.likes       enable row level security;
alter table public.schedules   enable row level security;

-- profiles
create policy profiles_read   on public.profiles for select using (true);
create policy profiles_insert on public.profiles for insert with check (auth.uid() = id);
create policy profiles_update on public.profiles for update using (auth.uid() = id);

-- posts
create policy posts_read   on public.posts for select using (true);
create policy posts_insert on public.posts for insert with check (auth.uid() = author_id);
create policy posts_update on public.posts for update using (auth.uid() = author_id or public.is_admin());
create policy posts_delete on public.posts for delete using (auth.uid() = author_id or public.is_admin());

-- post_media : 부모 글 소유 기준
create policy media_read  on public.post_media for select using (true);
create policy media_write on public.post_media for all
  using (exists (select 1 from public.posts p where p.id=post_id and (p.author_id=auth.uid() or public.is_admin())))
  with check (exists (select 1 from public.posts p where p.id=post_id and p.author_id=auth.uid()));

-- post_tags
create policy tags_read  on public.post_tags for select using (true);
create policy tags_write on public.post_tags for all
  using (exists (select 1 from public.posts p where p.id=post_id and (p.author_id=auth.uid() or public.is_admin())))
  with check (exists (select 1 from public.posts p where p.id=post_id and p.author_id=auth.uid()));

-- comments
create policy comments_read   on public.comments for select using (true);
create policy comments_insert on public.comments for insert with check (auth.uid() = author_id);
create policy comments_update on public.comments for update using (auth.uid() = author_id or public.is_admin());
create policy comments_delete on public.comments for delete using (auth.uid() = author_id or public.is_admin());

-- likes
create policy likes_read   on public.likes for select using (true);
create policy likes_insert on public.likes for insert with check (auth.uid() = user_id);
create policy likes_delete on public.likes for delete using (auth.uid() = user_id);

-- schedules
create policy schedules_read   on public.schedules for select using (true);
create policy schedules_insert on public.schedules for insert with check (auth.uid() = author_id);
create policy schedules_update on public.schedules for update using (auth.uid() = author_id or public.is_admin());
create policy schedules_delete on public.schedules for delete using (auth.uid() = author_id or public.is_admin());

-- ===== 20260607000003_storage.sql =====
-- Phase 1 Storage: media 버킷(공개 읽기, 본인 폴더 쓰기)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('media','media', true, 52428800,
        array['image/jpeg','image/png','image/webp','image/gif','video/mp4','video/quicktime','video/webm'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

create policy media_public_read on storage.objects for select using (bucket_id='media');
create policy media_user_write  on storage.objects for insert to authenticated
  with check (bucket_id='media' and (storage.foldername(name))[1] = auth.uid()::text);
create policy media_user_delete on storage.objects for delete to authenticated
  using (bucket_id='media' and (storage.foldername(name))[1] = auth.uid()::text);

-- ===== 20260607000004_support_requests.sql =====
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

-- ===== 20260607000005_realtime.sql =====
-- Phase 2: 실시간 반영 — posts / support_requests 를 realtime publication에 추가
alter publication supabase_realtime add table public.posts;
alter publication supabase_realtime add table public.support_requests;

-- ===== 20260607000006_reports.sql =====
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

-- ===== 20260607000007_attendance.sql =====
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

