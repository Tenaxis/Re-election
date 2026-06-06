# Phase 2 구현 스펙 — 현장 운영

상위: [`../../DESIGN.md`](../../DESIGN.md) · [`../ROADMAP.md`](../ROADMAP.md) · 선행: [`phase-1-mvp.md`](./phase-1-mvp.md)
범위: **지원요청** · **지도 뷰(Leaflet)** · **실시간 반영(Realtime)**

---

## 1. 지원요청 (Support Request)

### 스키마 (마이그레이션 0004)
```sql
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
```
- 유형 매핑: `manpower`=위치(인력) · `food`=음식 · `hazard`=분신물 신고 · `cleanup`=현장 정리
- 상태 매핑: `open`=요청중 · `in_progress`=진행중 · `done`=완료

### RLS
읽기 모두 · 생성 로그인+본인 · 수정/삭제 본인/admin (상태 변경 = update).

### 화면/라우트
| 경로 | 접근 | 설명 |
|---|---|---|
| `/support` | 공개 | 목록 + 유형·상태 필터 |
| `/support/[id]` | 공개 | 상세 + (작성자) 상태 변경 |
| `/support/new` | 로그인 | 등록 |

- 카드: 유형 배지(아이콘) · 상태 배지(요청중=warning/진행중=info/완료=success) · 내용 · 위치 · 시간.
- 상태 변경: 작성자/admin이 상세에서 select로 변경(서버액션).
- 컴포넌트: `SupportCard`, `SupportForm`, `SupportFilters`, `SupportStatusControl`.

---

## 2. 지도 뷰 (Leaflet + OpenStreetMap)

- 라이브러리: `leaflet` + `react-leaflet`. **클라이언트 전용**(`next/dynamic`, `ssr:false`).
- 라우트 `/map`. 좌표(lat/lng)가 있는 **글·지원요청·집회**를 핀으로.
- 레이어 토글(글/지원요청/집회 on-off). 핀 색: 글=primary, 지원요청=warning, 집회=info.
- 핀 클릭 → 팝업 미리보기(제목/유형 + 상세 링크).
- 기본 중심: 서울 시청(37.5665, 126.9780), zoom 12. 데이터는 서버에서 좌표 있는 행만 조회해 클라이언트로.
- Leaflet CSS는 `leaflet/dist/leaflet.css` import. 마커 아이콘 깨짐 방지(아이콘 경로 수동 설정 또는 divIcon).
- 컴포넌트: `MapView`(client), `MapClient`(dynamic wrapper), 데이터 fetch는 `/map/page.tsx`(server).

---

## 3. 실시간 반영 (Supabase Realtime)

- `posts`, `support_requests` 테이블을 realtime publication에 추가.
- 피드(`/`)와 지원요청 목록(`/support`)에 클라이언트 구독 컴포넌트:
  - 새 INSERT 감지 → 상단에 "새 글 N개 — 보기" 배너. 클릭 시 `router.refresh()`.
  - 과한 자동 삽입 대신 **배너 알림** 방식(사용자 흐름 방해 최소화).
- 컴포넌트: `RealtimeFeedBanner`(client, channel 구독), `RealtimeSupportBanner`.
- 마이그레이션 0005: `alter publication supabase_realtime add table public.posts, public.support_requests;`

---

## 4. 내비게이션 갱신
- 하단탭/사이드바에 **지도**(`/map`), **지원요청**(`/support`) 추가 → 피드·일정·지도·지원요청·내정보(모바일은 핵심 4 + compose).
- 모바일 하단탭이 5개를 넘으면: 피드·일정·지도·지원요청 + compose(FAB), 내정보는 상단/더보기.

## 5. 완료 기준
1. 지원요청 등록·목록·필터·상세·상태변경 동작(RLS 강제).
2. 지도에서 좌표 있는 글/지원요청/집회가 핀으로 보이고 팝업·링크 동작.
3. 다른 세션에서 새 글/지원요청 작성 시 목록에 실시간 배너 표시.
4. 반응형·다크모드·접근성 유지.
5. Phase 2 E2E 통과.

## 6. 작업 순서
1. 마이그레이션(support_requests, realtime publication) + 로컬 적용 + 타입 갱신
2. 지원요청 기능
3. 지도 뷰
4. 실시간 배너
5. 내비 갱신 + E2E + 스크린샷
