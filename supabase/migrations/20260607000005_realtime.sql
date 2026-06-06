-- Phase 2: 실시간 반영 — posts / support_requests 를 realtime publication에 추가
alter publication supabase_realtime add table public.posts;
alter publication supabase_realtime add table public.support_requests;
