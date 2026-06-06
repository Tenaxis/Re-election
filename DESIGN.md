# 집회·시위 운영 플랫폼 — DESIGN.md

작성일: 2026-06-07 · 상태: 설계 확정 (구현 전)
포맷: [Stitch DESIGN.md](https://stitch.withgoogle.com/docs/design-md/specification/) 컨벤션 기반
([awesome-design-md](https://github.com/VoltAgent/awesome-design-md) 참고)

> 이 문서는 두 부분으로 구성된다.
> **Part A — 디자인 시스템**: AI 에이전트/개발자가 일관된 UI를 생성하기 위한 시각 규칙.
> **Part B — 제품 스펙**: 기능·아키텍처·구현 단계.

---

# Part A — 디자인 시스템

## A1. Visual Theme & Atmosphere (비주얼 테마)

**무드**: 차분한 신뢰감 + 절제된 연대의 에너지. 선동적이지 않고, 기록과 소통에 집중하는 도구다운 톤.
**밀도**: 중간 밀도. 모바일에서 한 손으로 빠르게 훑되, 카드마다 충분한 여백으로 가독성 확보.
**철학**: 모바일 퍼스트 · 콘텐츠 우선 · 다크모드 1급 지원 · 접근성 기본.
콘텐츠(사진·영상·글)가 주인공이고 UI는 배경으로 물러난다. 장식보다 명료함.

---

## A2. Color Palette & Roles (색상)

중립(슬레이트) 톤이 화면을 지배하고, 포인트 컬러는 **행동(버튼·링크)**과 **상태(지원요청·신고)**에만 절제해서 쓴다.

### 브랜드 · 액션
| 역할 | 토큰 | Light | Dark |
|---|---|---|---|
| Primary (액션·링크·브랜드) | `--color-primary` | `#0D9488` | `#14B8A6` |
| Primary Hover | `--color-primary-hover` | `#0F766E` | `#2DD4BF` |
| Primary Foreground (위 텍스트) | `--color-primary-fg` | `#FFFFFF` | `#0B1120` |

> 메인 컬러는 청록(Teal). 정치적 중립을 위해 파랑·빨강을 메인으로 쓰지 않는다.
> 빨강은 신고·긴급(Danger)에만 작게 사용한다.

### 중립 · 표면
| 역할 | 토큰 | Light | Dark |
|---|---|---|---|
| Background (앱 배경) | `--color-bg` | `#FFFFFF` | `#0B1120` |
| Surface (카드·패널) | `--color-surface` | `#F8FAFC` | `#111827` |
| Surface Elevated (모달·드롭다운) | `--color-elevated` | `#FFFFFF` | `#1E293B` |
| Border / Divider | `--color-border` | `#E2E8F0` | `#1E293B` |
| Border Strong | `--color-border-strong` | `#CBD5E1` | `#334155` |

### 텍스트
| 역할 | 토큰 | Light | Dark |
|---|---|---|---|
| Text Primary | `--color-text` | `#0F172A` | `#F1F5F9` |
| Text Secondary | `--color-text-2` | `#475569` | `#94A3B8` |
| Text Muted (메타·시간) | `--color-text-muted` | `#94A3B8` | `#64748B` |

### 시맨틱 (상태)
| 의미 | 토큰 | Light | Dark | 용례 |
|---|---|---|---|---|
| Success | `--color-success` | `#16A34A` | `#22C55E` | 지원요청 `완료`, 성공 토스트 |
| Warning | `--color-warning` | `#D97706` | `#F59E0B` | 지원요청 `요청중`, 주의 |
| Danger | `--color-danger` | `#DC2626` | `#EF4444` | 신고·삭제·긴급, 분신물 신고 강조 (작게만) |
| Info | `--color-info` | `#7C3AED` | `#A78BFA` | 지원요청 `진행중`, 안내 |

### 지원요청 상태 색 매핑
- `요청중` → Warning(amber) · `진행중` → Info(violet) · `완료` → Success(green)

---

## A3. Typography (타이포그래피)

**기본 폰트**: `Pretendard` (한글 최적화) → fallback `-apple-system, system-ui, "Segoe UI", Roboto, sans-serif`
**숫자·좌표·시간**: `"JetBrains Mono", ui-monospace, monospace` (선택적)

| 역할 | 크기 / 행간 | 굵기 | 용례 |
|---|---|---|---|
| Display | 32 / 40 | 700 | 랜딩 헤드라인 |
| H1 | 28 / 36 | 700 | 페이지 제목 |
| H2 | 24 / 32 | 600 | 섹션 제목 |
| H3 | 20 / 28 | 600 | 카드 제목·집회명 |
| Body L | 18 / 28 | 400 | 글 본문(상세) |
| Body | 16 / 24 | 400 | 기본 본문 |
| Body S | 14 / 20 | 400 | 보조 텍스트·댓글 |
| Caption | 12 / 16 | 500 | 시간·메타·태그 |

규칙: 본문 최소 16px(모바일 확대 방지) · 줄당 글자 수 데스크탑 ~70자 제한 · 한 화면에 굵기 단계 3개 이하.

---

## A4. Component Stylings (컴포넌트)

### 버튼
| 변형 | 배경 | 텍스트 | 테두리 | 용례 |
|---|---|---|---|---|
| Primary | `--color-primary` | `--color-primary-fg` | 없음 | 글쓰기·등록·로그인 |
| Secondary | `--color-surface` | `--color-text` | `--color-border-strong` | 보조 동작 |
| Ghost | 투명 | `--color-text-2` | 없음 | 아이콘 버튼·취소 |
| Danger | `--color-danger` | `#FFFFFF` | 없음 | 삭제·신고 |

상태: Hover(명도 ±, 배경 살짝) · Active(scale 0.98) · Focus(2px primary 링) · Disabled(opacity 0.5, 커서 not-allowed).
높이: 모바일 44px / 데스크탑 40px · 반경 `--radius-md` · 패딩 12×16.

### 피드 카드 (핵심)
- 배경 `--color-surface`, 테두리 `--color-border`, 반경 `--radius-lg`, 패딩 16.
- 구성(위→아래): 아바타 + 닉네임 + 시간(muted) / 본문 / 미디어(라운드 12, 16:9 또는 그리드) / 위치 칩·태그 / 액션 바(좋아요·댓글).
- Hover(데스크탑): 테두리 `--color-border-strong`, 그림자 `--shadow-sm`.

### 입력 (Input / Textarea)
- 배경 `--color-bg`, 테두리 `--color-border`, 반경 `--radius-md`, 높이 44, 패딩 12.
- Focus: 테두리 `--color-primary` + 2px 링. Error: 테두리 `--color-danger` + 하단 메시지.
- 모든 입력에 `<label>` 연결(접근성).

### 태그 / 칩 (Tag, Chip)
- 작은 알약형. 배경 `--color-surface`, 텍스트 `--color-text-2`, 반경 `--radius-full`, 패딩 4×10, Caption 크기.
- 위치 칩은 📍 아이콘 + 주소 요약.

### 상태 배지 (Badge)
- 지원요청 상태/신고여부 표시. 시맨틱 색의 10% 배경 + 해당 색 텍스트, 반경 full.

### 하단 탭바 (모바일)
- 고정 하단. 5개: 피드·일정·지도·지원요청·내정보. 아이콘 + 라벨(Caption). 활성 탭 `--color-primary`.
- 안전 영역(safe-area-inset) 패딩 적용.

### 아바타
- 원형. 닉네임 이니셜 또는 기본 이미지. 크기 32(피드)/40(상세)/24(댓글).

---

## A5. Layout Principles (레이아웃)

**Spacing scale** (4px 기준): `1=4 · 2=8 · 3=12 · 4=16 · 6=24 · 8=32 · 12=48 · 16=64`
**Radius**: `sm=6 · md=10 · lg=14 · full=9999`
**Container**: 피드 본문 최대폭 600px · 데스크탑 3분할 총 ~1200px(좌 240 / 중 600 / 우 300).

- **모바일**: 단일 컬럼 피드 + 하단 탭바. 좌우 패딩 16.
- **데스크탑(lg↑)**: 좌측 내비 + 중앙 피드 + 우측 위젯(다가오는 집회·인기 태그).
- 여백 전략: 섹션 간 24~32, 카드 내부 16, 요소 간 8~12. 빽빽함보다 호흡.

---

## A6. Depth & Elevation (깊이)

그림자는 최소한으로, 표면 위계 표현에만.

| 토큰 | 값 (Light) | 용례 |
|---|---|---|
| `--shadow-sm` | `0 1px 2px rgba(15,23,42,.06)` | 카드 hover |
| `--shadow-md` | `0 4px 12px rgba(15,23,42,.08)` | 드롭다운·팝오버 |
| `--shadow-lg` | `0 12px 32px rgba(15,23,42,.12)` | 모달·바텀시트 |

다크모드: 그림자 대신 `--color-elevated` 표면 명도 차이로 위계 표현(그림자는 거의 안 보임).

---

## A7. Do's and Don'ts

**Do**
- 중립 톤을 기본으로, 포인트 컬러는 행동·상태에만.
- 터치 영역 최소 44×44px.
- 색만으로 의미 전달하지 말고 아이콘·라벨 병행(색각 접근성).
- 다크모드를 항상 함께 디자인·검증.
- 위치·시간 같은 민감 정보는 작성자 선택으로 노출.

**Don't**
- 선동적·자극적인 강한 빨강 배경을 넓게 쓰지 않는다.
- 14px 미만 본문, 얇은 회색 텍스트로 대비 낮추지 않는다.
- 한 화면에 포인트 컬러 여러 개를 경쟁시키지 않는다.
- 모달·팝업 남용으로 흐름 끊지 않는다.
- 실명·정확한 좌표를 기본 노출하지 않는다(신원 보호).

---

## A8. Responsive Behavior (반응형)

**Breakpoints**: `sm 640 · md 768 · lg 1024 · xl 1280`

| 구간 | 내비게이션 | 레이아웃 |
|---|---|---|
| < lg (모바일/태블릿) | 하단 탭바 | 단일 컬럼 피드 |
| ≥ lg (데스크탑) | 좌측 사이드바 | 3분할(좌 메뉴 / 중 피드 / 우 위젯) |

- 터치 타깃 ≥ 44px, 클릭 간격 ≥ 8px.
- 이미지/지도는 컨테이너 폭에 맞춰 유동, 종횡비 유지.
- 모달은 모바일에서 **바텀시트**로 전환.
- `prefers-color-scheme` 존중 + 수동 다크/라이트 토글 제공.

---

## A9. Agent Prompt Guide (에이전트 프롬프트 가이드)

UI 생성 시 사용할 기준 프롬프트:

> "모던 SNS형 집회 기록 플랫폼. 모바일 퍼스트, 다크모드 기본.
> 색상은 중립 슬레이트 톤(`#0B1120`~`#F8FAFC`)에 Primary 청록(`#0D9488`/다크 `#14B8A6`)을 액션·링크에만 절제해서 사용.
> 파랑·빨강은 메인으로 쓰지 않음(정치적 중립). 빨강은 신고·긴급에만 작게.
> 상태는 amber(요청중)/violet(진행중)/green(완료)/red(신고·긴급).
> 폰트 Pretendard, 본문 16px. 카드형 피드(아바타·닉네임·시간·본문·미디어·위치칩·태그·좋아요/댓글).
> 모바일 하단 탭바(피드·일정·지도·지원요청·내정보), 데스크탑 3분할.
> 터치 타깃 44px, 그림자 최소, 여백 넉넉, 접근성·색각 대비 준수."

색상 빠른 참조: Primary `#0D9488` · BG `#FFFFFF`/`#0B1120` · Surface `#F8FAFC`/`#111827` · Text `#0F172A`/`#F1F5F9` · Success `#16A34A` · Warning `#D97706` · Info `#7C3AED` · Danger `#DC2626`.

---

# Part B — 제품 스펙

## B1. 개요

집회·시위를 기록·운영하기 위한 웹 플랫폼. SNS 형태의 피드를 중심으로
참가자들이 글·사진·영상을 공유하고, 현장 지원을 요청하며, 집회 일정을 공유한다.

- **비로그인**: 모든 콘텐츠 조회 가능
- **로그인**: 글 작성·댓글·좋아요·지원요청 등록 가능
- **표시명**: 가명(닉네임)만 — 참가자 신원 보호
- **핵심 가치**: 현장성 · 안전(신원 보호) · 신뢰(검증·모더레이션)

## B2. 확정 결정 사항

| 항목 | 결정 |
|---|---|
| 로그인 | 카카오 + 구글 + 이메일/비밀번호 |
| 표시명 | 가명(닉네임)만 |
| 대댓글 | 1단계 |
| 좋아요 대상 | 글 + 댓글 |
| 지도 | OpenStreetMap + Leaflet |
| 실시간 알림 | 사이트 내 표시만 |
| 다국어 | 한국어만 |
| 영상 업로드 | 50MB 제한 |
| UI/UX 방향 | 모던 SNS형 (Part A 참조) |

## B3. 핵심 3축

### 게시글 (Post)
SNS 타임라인의 핵심. 종류 구분 없는 단일 게시글.
- 텍스트 + 사진·영상(영상 50MB) + **선택 첨부**: 위치(좌표+주소)·시간·태그(다중)
- → "증거자료"는 위치·시간·태그를 단 글일 뿐, 별도 종류 아님
- 댓글·대댓글(1단계)·좋아요·신고

### 지원요청 (Support Request)
- 유형: `위치(인력)` / `음식` / `분신물 신고` / `현장 정리`
- 등록: 유형·위치·내용·상태 / 상태: `요청중`·`진행중`·`완료`
- 목록 + 유형·상태 필터

### 집회 일정 (Schedule)
- 이름 · 일시(시작~종료) · 장소(주소+좌표) · 집회 신고 여부
- 목록/상세/필터(날짜·지역·신고여부) · 예정/지난 구분

## B4. 공통 기능
비로그인 조회 / 로그인 등록 · 지도 뷰(글·지원요청·집회 핀) · 검색·필터(태그·위치·시간·날짜) ·
실시간 반영(Supabase Realtime, 사이트 내) · 신고/모더레이션 + 관리자 대시보드 ·
EXIF 위치정보 제거 · 반응형 · 다크모드 · 접근성 · PWA · 공유

## B5. 기술 구조

| 영역 | 기술 |
|---|---|
| 프런트엔드 | Next.js (App Router) + TypeScript + Tailwind CSS |
| UI 컴포넌트 | shadcn/ui |
| 지도 | Leaflet + OpenStreetMap |
| 백엔드 | Supabase (Auth / Postgres + PostGIS / Storage / Realtime) |
| 배포 | Vercel |
| 보안 | Supabase Row Level Security (RLS) |

**RLS 정책**: 읽기 모두 허용 · 생성 로그인만 · 수정/삭제 작성자 또는 관리자 · 모더레이션 관리자만.

## B6. 데이터 모델 (초안)

> 구현 단계에서 확정. 좌표는 PostGIS `geography(Point)`.

- **profiles** — id(=auth.users), nickname, role(`user`|`admin`), created_at
- **posts** — id, author_id, body, location, address, occurred_at, created_at
- **post_media** — id, post_id, url, type(`image`|`video`), order
- **post_tags** — post_id, tag
- **comments** — id, post_id, author_id, parent_id(nullable, 1단계), body, created_at
- **likes** — id, user_id, target_type(`post`|`comment`), target_id (유니크)
- **support_requests** — id, author_id, type, location, address, body, status, created_at
- **schedules** — id, author_id, name, starts_at, ends_at, location, address, is_reported, created_at
- **reports** — id, reporter_id, target_type, target_id, reason, status, created_at

## B7. Phase 분할

### Phase 1 — MVP
인증(카카오/구글/이메일, 닉네임) · 게시글 CRUD(사진·영상·위치·시간·태그) ·
피드/타임라인 + 검색·필터 · 댓글/대댓글(1단계) + 좋아요(글·댓글) ·
집회 일정 CRUD + 목록/필터 · 반응형 + 다크모드 · 비로그인 조회 / RLS

### Phase 2 — 현장 운영
지원요청 기능 · 지도 뷰(Leaflet) · 실시간 반영(Realtime)

### Phase 3 — 안전·확장
신고/모더레이션 + 관리자 대시보드 · EXIF 위치정보 제거 · PWA · 접근성 보강 · 공유
