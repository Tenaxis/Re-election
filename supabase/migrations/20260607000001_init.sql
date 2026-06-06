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
