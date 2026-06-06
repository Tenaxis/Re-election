# CLAUDE.md

이 저장소에서 작업할 때 Claude Code가 따라야 할 가이드.

## 프로젝트

집회·시위 운영 플랫폼. SNS 형태의 피드를 중심으로 참가자들이 글·사진·영상을
공유하고, 현장 지원을 요청하며, 집회 일정을 공유한다. 비로그인은 조회만,
로그인 시 등록 가능. 참가자 신원 보호를 위해 **가명(닉네임)만** 사용한다.

- 레포: https://github.com/Tenaxis/Re-election
- 현재 상태: 설계 완료, 코드 스캐폴딩 전. **현재 구현 대상은 Phase 1 (MVP)**.

## 필독 문서 (작업 전 반드시 참조)

- **`DESIGN.md`** — 디자인 시스템(색상·타이포·컴포넌트·레이아웃) + 확정 제품 스펙.
  UI를 만들 땐 Part A 디자인 시스템 토큰을 그대로 따른다.
- **`docs/ROADMAP.md`** — Phase 분할(1~4)과 향후 기능. 단계 범위를 벗어나지 않는다.

## 기술 스택

| 영역 | 기술 |
|---|---|
| 프런트엔드 | Next.js (App Router) + TypeScript + Tailwind CSS |
| UI 컴포넌트 | shadcn/ui |
| 지도 | Leaflet + OpenStreetMap |
| 백엔드 | Supabase (Auth / Postgres + PostGIS / Storage / Realtime) |
| 배포 | Vercel |

## 핵심 규칙

### 디자인
- 메인 컬러는 **청록(Teal `#0D9488`)**. **파랑·빨강을 메인으로 쓰지 않는다**(정치적 중립).
  빨강은 신고·긴급(Danger)에만 작게. 색상·토큰은 `DESIGN.md` Part A 기준.
- 모바일 퍼스트 · 다크모드 기본 지원 · 접근성(터치 타깃 ≥44px, 색각 대비) 준수.
- 폰트 Pretendard, 본문 16px.

### 보안 / 데이터
- Supabase **RLS 필수**: 읽기 모두 허용 · 생성 로그인만 · 수정/삭제 작성자 또는 관리자.
- 좌표는 PostGIS `geography(Point)`. 위치·실명 등 민감 정보는 기본 노출하지 않는다.
- 비밀키/환경변수는 `.env*.local`에만. 커밋 금지(`.gitignore` 적용됨).

### 코드
- 종류 구분 없는 단일 **게시글(Post)** 모델 — "증거자료"는 위치·시간·태그를 단 글일 뿐 별도 종류 아님.
- 파일은 한 가지 책임으로 작게 유지. 기존 패턴·구조를 먼저 확인하고 따른다.

## Git

- 기본 브랜치는 `main`. 커밋 메시지는 한국어로 명확하게.
- 사용자가 요청할 때만 커밋·푸시한다.

## 로컬 개발

로컬은 **Supabase 로컬 스택**(Docker)으로 개발/테스트한다. `.env.local`은 로컬을 가리킨다.
프로덕션 값은 Vercel 환경변수에 있다(호스팅 ref `eenzsrxfkabdjqnnngnh`).

```bash
npm run db:start    # 로컬 Supabase 기동(마이그레이션 자동 적용)
npm run dev         # 개발 서버 (localhost:3000)
npm run test:e2e    # Playwright E2E (dev 서버 필요)
npm run build       # 프로덕션 빌드 (이후 dev 재개 시 .next 삭제 권장)
npm run db:reset    # 로컬 DB 초기화 후 마이그레이션 재적용
```

- 마이그레이션은 `supabase/migrations/`. 로컬 적용은 `db:start`/`db:reset`이 처리.
- `supabase` CLI가 macOS 키체인에서 멈추면 `SUPABASE_ACCESS_TOKEN`을 더미로 설정해 우회.
- `next build` 직후 `next dev`를 돌리면 `.next` 캐시 충돌이 날 수 있다 → `rm -rf .next` 후 dev.

## 상태
Phase 1~4 구현·E2E 완료(로컬). 프로덕션 배포는 호스팅 DB에 마이그레이션 적용 + OAuth 자격증명 설정 필요.
