# Phase 3 구현 스펙 — 안전·확장

상위: [`../../DESIGN.md`](../../DESIGN.md) · 선행: phase-1, phase-2
범위: **신고/모더레이션 + 관리자 대시보드** · **EXIF 위치정보 제거** · **PWA** · **공유** · **접근성 보강**

---

## 1. 신고 / 모더레이션 / 관리자 대시보드

### 스키마 (0006)
```sql
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
create policy reports_insert on public.reports for insert with check (auth.uid() = reporter_id);
create policy reports_admin_read   on public.reports for select using (public.is_admin());
create policy reports_admin_update on public.reports for update using (public.is_admin());
create policy reports_admin_delete on public.reports for delete using (public.is_admin());
```
- 신고는 로그인 유저가 생성, **조회/처리는 admin만**(목록 비공개).
- 콘텐츠 삭제는 기존 RLS(`is_admin()` 허용)로 가능.

### 기능
- **신고 버튼**: 글/댓글/지원요청에 신고(사유 입력 다이얼로그). `ReportButton`(client) + 서버액션 `createReport`.
- **관리자 대시보드 `/admin`**: admin 아닌 경우 redirect. open 신고 목록(대상 미리보기 링크), 액션: **콘텐츠 삭제** / **신고 해결(resolve)**.
- admin 지정: `profiles.role='admin'` (DB에서 수동 또는 시드). 헬퍼 `is_admin()` 기존 존재.

---

## 2. EXIF 위치정보 제거
- 이미지 업로드 전 **canvas 재인코딩**으로 모든 메타데이터(EXIF/GPS) 제거.
- `media-uploader`에 "위치정보(EXIF) 제거" 토글(기본 ON). 이미지에만 적용, 영상은 제외.
- 구현: `createImageBitmap(file)` → `<canvas>` draw → `canvas.toBlob('image/jpeg'|'image/webp')` → 새 File.

## 3. PWA
- `app/manifest.ts`(name, short_name, theme/background color, icons, display standalone).
- 아이콘: `/public/icon-192.png`, `/public/icon-512.png`(간단한 청록 로고).
- 서비스워커 `public/sw.js`(앱 셸 캐시, 오프라인 fallback) + 등록 컴포넌트(`ServiceWorkerRegister`, client, useEffect).
- 설치 가능(installable) 충족.

## 4. 공유
- 글/일정/지원요청 상세에 **공유 버튼**: `navigator.share` 지원 시 네이티브 공유, 미지원 시 링크 복사(clipboard) + toast.
- `ShareButton`(client).

## 5. 접근성 보강
- `Skip to content` 링크(키보드 첫 탭).
- 페이지 제목 heading 레벨 정리(로그인/가입 등 CardTitle → 적절한 h1 또는 aria).
- 폼 라벨·aria-invalid 점검, 포커스 링 유지(전역 :focus-visible 적용됨).

## 6. 완료 기준
1. 로그인 유저가 글/댓글/지원요청을 신고할 수 있고, admin이 /admin에서 목록·삭제·해결 가능. 비admin은 /admin 접근 차단.
2. 이미지 업로드 시 EXIF 제거 토글 동작(기본 제거).
3. manifest·서비스워커로 설치 가능, 공유 버튼 동작.
4. skip-link 등 접근성 보강.
5. Phase 3 E2E 통과.
