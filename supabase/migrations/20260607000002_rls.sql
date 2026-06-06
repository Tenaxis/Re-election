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
