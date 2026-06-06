# Phase 1 (MVP) 구현 스펙

상위 문서: [`../../DESIGN.md`](../../DESIGN.md) · [`../ROADMAP.md`](../ROADMAP.md)
대상 범위: 인증 · 게시글 · 피드 · 댓글/좋아요 · 집회 일정 · 비로그인 조회 · 반응형/다크모드

---

## 1. 기술 결정 (Phase 1 한정)

- **Next.js 16 (App Router) + React 19 + TypeScript + Tailwind v4**
- **Supabase**: Auth / Postgres / Storage. `@supabase/ssr`로 SSR 세션 처리.
- **위치 저장**: Phase 1은 `lat double precision` / `lng double precision` + `address text`로 저장
  (PostGIS는 지도·공간쿼리가 들어가는 Phase 2에서 도입). PostgREST로 다루기 쉬움.
- **좋아요/댓글 수**: DB 뷰 `post_feed`로 집계해 피드 조회 단순화.
- **UI**: shadcn/ui + DESIGN.md 토큰. 폰트 Pretendard. next-themes 다크모드.

---

## 2. 데이터베이스 스키마 (마이그레이션 SQL)

```sql
-- 0001_init.sql
create extension if not exists "pgcrypto";

-- profiles : auth.users 1:1, 닉네임만 노출
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
  id         uuid primary key default gen_random_uuid(),
  post_id    uuid not null references public.posts(id) on delete cascade,
  storage_path text not null,
  type       text not null check (type in ('image','video')),
  sort_order int  not null default 0,
  created_at timestamptz not null default now()
);
create index post_media_post_idx on public.post_media (post_id);

-- post_tags
create table public.post_tags (
  post_id uuid not null references public.posts(id) on delete cascade,
  tag     text not null check (char_length(tag) <= 30),
  primary key (post_id, tag)
);
create index post_tags_tag_idx on public.post_tags (tag);

-- comments : 1단계 대댓글(parent_id 가 또 부모를 갖지 못하도록 트리거로 강제)
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

-- 피드 집계 뷰
create view public.post_feed as
select p.*,
  (select count(*) from public.likes l where l.target_type='post' and l.target_id=p.id) as like_count,
  (select count(*) from public.comments c where c.post_id=p.id) as comment_count
from public.posts p;
```

### RLS 정책 (0002_rls.sql)
원칙: **읽기 모두 허용 · 생성 로그인+본인 · 수정/삭제 본인 또는 admin**

```sql
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

-- post_media / post_tags : 부모 글 소유 기준
create policy media_read   on public.post_media for select using (true);
create policy media_write  on public.post_media for all
  using (exists (select 1 from public.posts p where p.id=post_id and (p.author_id=auth.uid() or public.is_admin())))
  with check (exists (select 1 from public.posts p where p.id=post_id and p.author_id=auth.uid()));
create policy tags_read    on public.post_tags for select using (true);
create policy tags_write   on public.post_tags for all
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
```

### Storage (0003_storage.sql)
```sql
insert into storage.buckets (id, name, public) values ('media','media', true)
  on conflict (id) do nothing;
-- 읽기 공개, 쓰기는 본인 폴더(<uid>/...)만, 50MB 제한은 앱에서 검증 + 버킷 설정
create policy media_public_read on storage.objects for select using (bucket_id='media');
create policy media_user_write  on storage.objects for insert to authenticated
  with check (bucket_id='media' and (storage.foldername(name))[1] = auth.uid()::text);
create policy media_user_delete on storage.objects for delete to authenticated
  using (bucket_id='media' and (storage.foldername(name))[1] = auth.uid()::text);
```

---

## 3. 인증 흐름

- **클라이언트**: `@supabase/ssr` — `lib/supabase/client.ts`(브라우저), `server.ts`(서버 컴포넌트/액션), `middleware.ts`(세션 갱신).
- **이메일/비밀번호**: `signUp` / `signInWithPassword`. (대시보드에서 이메일 확인 OFF 권장 — MVP UX. E2E는 service_role로 confirmed 유저 생성.)
- **OAuth(카카오·구글)**: `signInWithOAuth({provider, redirectTo:/auth/callback})`. ⚠️ **provider 자격증명(클라이언트 ID/시크릿)은 Supabase 대시보드 + 각 개발자콘솔 등록 필요** — 코드는 완성, 자격증명은 외부 설정.
- **닉네임 온보딩**: 로그인 상태 + `profiles.nickname is null` → `/onboarding` 강제(미들웨어/레이아웃 가드). 닉네임 유니크 검증.
- **세션 가드**: 작성/수정/삭제 라우트는 비로그인 시 `/login?next=...`로.

---

## 4. 라우트 맵

| 경로 | 접근 | 설명 |
|---|---|---|
| `/` | 공개 | 피드(타임라인) |
| `/post/[id]` | 공개 | 글 상세 + 댓글 |
| `/post/new` | 로그인 | 글 작성 |
| `/post/[id]/edit` | 작성자 | 글 수정 |
| `/schedule` | 공개 | 집회 일정 목록 |
| `/schedule/[id]` | 공개 | 일정 상세 |
| `/schedule/new` | 로그인 | 일정 등록 |
| `/login`, `/signup` | 공개 | 인증 |
| `/onboarding` | 로그인 | 닉네임 등록 |
| `/auth/callback` | - | OAuth 콜백 |
| `/me` | 로그인 | 내 프로필·내 글 |

> 하단탭/사이드바: **피드 · 일정 · 내정보** (지도·지원요청은 Phase 2에서 추가).

---

## 5. 화면별 스펙 (요약)

- **피드 `/`**: 글 카드 리스트(최신순), 무한스크롤 또는 페이지네이션, 상단 검색바 + 태그/날짜 필터. 비로그인도 조회. 우상단/하단 "글쓰기" FAB(로그인 시).
- **글 카드**: 아바타·닉네임·상대시간 · 본문(말줄임) · 미디어(1장 16:9 / 다장 그리드) · 위치 칩·태그 · 좋아요/댓글 수. 클릭 시 상세.
- **글 작성 `/post/new`**: 본문 textarea · 미디어 업로드(이미지/영상, 영상 50MB 검증) · 위치(주소 입력 + 선택적 좌표) · 발생시간 · 태그 입력(엔터로 칩 추가).
- **글 상세**: 전체 본문·미디어 캐러셀·메타 · 좋아요 · 댓글/대댓글 트리(1단계) · 댓글 입력.
- **일정 목록 `/schedule`**: 예정/지난 탭, 카드(이름·일시·장소·신고여부 배지), 필터(날짜·지역·신고여부).
- **일정 등록**: 이름·시작/종료 일시·주소(+좌표)·신고여부 토글.
- **로그인/회원가입**: 이메일·비번 폼 + 카카오/구글 버튼.
- **온보딩**: 닉네임 입력(중복 체크) → 저장 → `/`.
- **내정보 `/me`**: 닉네임·내 글 목록·로그아웃.

---

## 6. 컴포넌트 인벤토리 (DESIGN.md 매핑)

`AppShell`(하단탭/사이드바) · `PostCard` · `PostComposer` · `MediaUploader` · `MediaGallery` · `TagInput` · `TagChip` · `LocationField` · `CommentTree`/`CommentItem`/`CommentComposer` · `LikeButton` · `ScheduleCard` · `ScheduleForm` · `AuthForm` · `OAuthButtons` · `NicknameForm` · `ThemeToggle` · shadcn 기본(Button/Input/Textarea/Card/Avatar/Badge/Dialog/Sheet/Tabs/DropdownMenu/Skeleton/Toast).

---

## 7. 완료 기준 (Acceptance Criteria)

1. 비로그인 사용자가 피드·글상세·일정을 조회할 수 있다.
2. 이메일로 가입→닉네임 온보딩→로그인 상태가 된다.
3. 로그인 사용자가 사진/영상(≤50MB)·위치·시간·태그를 단 글을 작성하고, 피드·상세에서 보인다.
4. 글/댓글에 좋아요 토글, 댓글·대댓글(1단계) 작성이 동작한다.
5. 집회 일정을 등록하고 목록/필터(예정·지난·신고여부)가 동작한다.
6. 본인 글/댓글/일정만 수정·삭제 가능(RLS로 강제).
7. 데스크탑/모바일 반응형 + 다크모드 정상.
8. 위 플로우가 Playwright E2E로 통과한다.

---

## 8. 작업 순서 (태스크 분할)

1. Supabase 스키마·RLS·Storage 마이그레이션 + 타입 생성
2. 디자인 파운데이션(토큰·Pretendard·shadcn·다크모드·AppShell)
3. 인증(클라이언트·로그인/가입·OAuth·온보딩·가드)
4. 게시글(피드·작성·상세·미디어·태그·필터)
5. 댓글/대댓글 + 좋아요
6. 집회 일정 CRUD·필터
7. E2E 테스트 + 수정
