# 집회 실시간 라이브 멀티뷰 — 설계 (2026-06-07)

## 1. 개요 / 범위
한 집회(`schedule`) 아래에 **위치별 유튜브 라이브 링크 N개**를 등록하고, 전용 페이지에서
**균등 격자 멀티뷰**로 동시에 시청한다. 각 라이브는 지도에도 핀으로 표시된다.

- ROADMAP Phase 1~4 밖의 **신규 기능**. 본 문서로 별도 기록.
- **YouTube Data API 미사용** — 라이브 여부/시청자 수 자동표시·자동정렬 없음. 수동 정렬(`sort_order`).
- 멀티뷰 재생 방식: **전부 음소거 자동재생**(한눈에 동시 시청). 탭한 셀만 소리 ON.

## 2. 데이터 모델 — 새 테이블 `live_streams`

| 컬럼 | 타입 | 비고 |
|---|---|---|
| id | uuid PK (`gen_random_uuid()`) | |
| schedule_id | uuid NOT NULL FK→schedules(id) | `ON DELETE CASCADE` |
| location_label | text NOT NULL | 예: "본회장", "세종대로" (최대 100자) |
| source_type | text NOT NULL | `'video'` 또는 `'channel'` (CHECK 제약) |
| youtube_ref | text NOT NULL | video_id(11자) 또는 channel_id(`UC...`) |
| title | text NULL | 방송 설명(선택, 최대 200자) |
| lat | double precision NULL | 지도 핀용 |
| lng | double precision NULL | 지도 핀용 |
| added_by | uuid NOT NULL FK→profiles(id) | `ON DELETE CASCADE` |
| sort_order | int NOT NULL default 0 | 수동 정렬 |
| created_at | timestamptz NOT NULL default now() | |

인덱스: `(schedule_id, sort_order)`.

**RLS (기존 패턴과 동일):**
- `SELECT`: `using (true)` — 모두 읽기
- `INSERT`: `with check (auth.uid() = added_by)` — 로그인만
- `UPDATE`/`DELETE`: `using (auth.uid() = added_by OR is_admin())` — 추가자 또는 관리자

마이그레이션 파일: `supabase/migrations/2026XXXXXXXXXX_live_streams.sql`
(로컬은 `db:reset`/`db:start`로 적용, 프로덕션은 별도 적용 필요.)

## 3. 유튜브 링크 처리 (API 없이)

붙여넣은 링크에서 `source_type` + `youtube_ref`를 파싱한다.

| 입력 형태 | source_type | youtube_ref | 임베드 URL |
|---|---|---|---|
| `watch?v=ID`, `youtu.be/ID`, `/live/ID`, `/embed/ID` | `video` | ID(11자) | `https://www.youtube.com/embed/{ID}` |
| `/channel/UCxxxx`, `/channel/UCxxxx/live` | `channel` | `UCxxxx` | `https://www.youtube.com/embed/live_stream?channel={UCxxxx}` |
| `@handle`, `@handle/live` | (미지원) | — | 핸들→채널ID 변환은 API 필요 → 거부 + 안내 |

- `channel` 임베드(`live_stream?channel=`)는 **그 채널의 현재 라이브를 자동 추종** → 집회 스트리머 채널에 유용.
- 파서는 순수 함수로 분리(`src/lib/youtube.ts`)하고 유닛 테스트 대상.
- 임베드 공통 파라미터: `autoplay=1&mute=1&playsinline=1&enablejsapi=1`.

## 4. UI / 라우트

- **`/schedule/[id]/live`** — 멀티뷰 페이지.
  - 균등 반응형 격자: 모바일 1~2열 / 태블릿 2열 / 데스크탑 3열.
  - 각 셀: 유튜브 iframe(16:9) + 좌하단 위치 라벨 오버레이 + (추가자/관리자) 삭제 버튼.
  - 상단: "라이브 추가" 버튼(로그인 시), 라이브 없으면 빈 상태 안내.
- **집회 상세(`/schedule/[id]`)**: 진입 버튼 "실시간 라이브 (N)" (N=등록 수). 0이어도 로그인 시 추가 유도.
- **추가 폼**: 기존 `src/components/ui/dialog.tsx` 기반 **다이얼로그**. 유튜브 링크 입력 + 위치 라벨 + (선택) 지도에서 위치 지정 — **기존 위치 picker(`LocationField`) 재사용**. 잘못된 링크는 인라인 에러.
- **라이브 표시 배지**: DESIGN.md상 빨강은 신고·긴급 전용이므로, "LIVE" 배지는 **primary(청록) 알약 + 점멸 점**으로 표기(빨강 미사용).
- **지도 연동**: `MapPoint`에 `live` 종류 추가. `map/page.tsx`에서 `live_streams`(좌표 있는 것) 조회 → 핀. 핀 색은 기존(post=teal, support=amber, schedule=purple)과 구분되는 **fuchsia `#db2777`**(빨강·파랑 아님). 팝업 "상세 보기" → `/schedule/{schedule_id}/live`.

## 5. 오디오 / 성능 (확정: 전부 음소거 자동재생)

- 모든 셀을 `autoplay=1&mute=1`로 렌더 → 동시 라이브(무음). 브라우저 정책상 무음 자동재생만 허용되므로 안전.
- 셀 탭 → 그 셀만 소리 ON, 나머지 음소거. **YouTube IFrame API(`enablejsapi=1`) postMessage**(`mute`/`unMute`)로 새로고침 없이 전환. 활성 셀 시각 표시(테두리).
- 부하 완화: **뷰포트 진입 시 지연 마운트(`IntersectionObserver`)**. 셀이 많을 때 "동시 재생이 많아 느릴 수 있습니다" 안내.

## 6. 범위 밖 (YAGNI)
시청자 수/라이브 자동판별·자동정렬, 채팅 통합, 녹화/다시보기, `@handle` 자동해석,
멀티뷰 화면 동기화, 독립(집회 무관) 라이브 목록.

## 7. 컴포넌트 분해
- `src/lib/youtube.ts` — URL 파서(순수 함수) + 임베드 URL 빌더.
- `src/app/schedule/[id]/live/page.tsx` — 서버: 라이브 목록 조회.
- `src/components/live/live-multiview.tsx` — 클라이언트: 격자 + 오디오 포커스 + lazy.
- `src/components/live/live-cell.tsx` — 단일 셀(iframe + 라벨 + 삭제).
- `src/components/live/add-live-form.tsx` — 클라이언트: 링크+라벨+위치 picker.
- `src/app/schedule/[id]/live/actions.ts` — `addLiveStream`, `deleteLiveStream` 서버 액션.
- `map-view.tsx`/`map/page.tsx` — `live` 종류 핀 추가.

## 8. 테스트
- **유닛**: `youtube.ts` 파서 — watch/youtu.be/live/embed/channel/잘못된 링크 케이스.
- **E2E**(`e2e/live.spec.ts`): 로그인 → 집회 생성 → 라이브 추가(영상 링크) → `/schedule/[id]/live`에 iframe 노출 → 삭제 → 사라짐. 좌표 있으면 `/map`에 live 핀.
- 검증: `tsc`/`eslint`/`next build` 통과.

## 9. 데이터 흐름 요약
```
[추가 폼] 링크+라벨+위치
   → addLiveStream(서버액션): URL 파싱 → live_streams INSERT (RLS: added_by=auth.uid())
   → /schedule/[id]/live 재검증
[멀티뷰 페이지] live_streams(schedule_id) 조회 → 격자 렌더(전부 muted autoplay)
   → 셀 탭 → postMessage unMute(해당) / mute(나머지)
[지도] live_streams(좌표 有) 조회 → live 핀 → 클릭 → 라이브 페이지
```
