[English](./README.md) | [한국어](./README_ko.md)

# ◈ Lumen — 개인 지식 허브

AI 기반 개인 지식관리 포털. NotebookLM 스타일의 RAG 채팅을 핵심으로 태스크, 캘린더, 북마크, 노트, Daily Briefing 대시보드를 통합.

## 기술 스택

| 영역 | 기술 |
|------|------|
| 프론트엔드 | Next.js 15 (App Router) + TypeScript |
| 백엔드 | NestJS + TypeScript |
| UI | Tailwind CSS + shadcn/ui |
| DB | PostgreSQL + pgvector (Docker) |
| ORM | Prisma |
| AI | Claude claude-sonnet-4-6 (Anthropic SDK) |
| 임베딩 | text-embedding-3-small (OpenAI) |
| 인증 | NestJS Passport + JWT |
| 모노레포 | pnpm workspaces + Turborepo |

## 빠른 시작

### 1. 환경 변수 설정

**`apps/api/.env`** (필수):
```
DATABASE_URL=postgresql://lumen:lumen_secret@localhost:5433/lumen_db
JWT_SECRET=jwt-시크릿
JWT_REFRESH_SECRET=리프레시-시크릿
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...
PORT=3051
UPLOAD_DIR=./uploads
```

**`apps/web/.env.local`** (필수):
```
NEXT_PUBLIC_API_URL=http://localhost:3051/api
NEXT_PUBLIC_DEV_BYPASS_AUTH=true
NEXT_PUBLIC_DEV_EMAIL=your@email.com
NEXT_PUBLIC_DEV_PASSWORD=yourpassword
```

### 2. 서비스 시작

```bash
# PostgreSQL 컨테이너 시작 (포트 5433)
pnpm docker:up

# 의존성 설치
pnpm install

# DB 스키마 반영
pnpm db:push

# 전체 개발 서버 실행 (web :3050 + api :3051)
pnpm dev
```

브라우저에서 [http://localhost:3050](http://localhost:3050)을 열어주세요.

## 주요 기능

- **지식 베이스** — PDF/URL 업로드 후 RAG 기반 AI 채팅 (출처 인용 포함)
- **노트** — 마크다운 에디터, 노트북 연동 가능
- **태스크** — 프로젝트별 태스크 관리 + 필터
- **캘린더** — 월별 이벤트 뷰, 인라인 일정 추가
- **북마크** — URL 저장 + Claude Haiku AI 자동 요약
- **대시보드** — Daily Briefing, 오늘 할일, 최근 노트
- **다국어(i18n)** — 영어/한국어 UI 전환
- **멀티 테마** — 5가지 컬러 테마 × 라이트/다크 모드 (localStorage 저장)

## 프로젝트 구조

```
my-notebook-lm/
├── apps/
│   ├── api/          # NestJS 백엔드 (:3051)
│   └── web/          # Next.js 15 프론트엔드 (:3050)
├── packages/
│   └── shared/       # 공유 타입 & DTO
└── prisma/           # 스키마 참조
```

## 실행 명령어

```bash
pnpm dev              # 전체 개발 서버 실행
pnpm docker:up        # PostgreSQL 컨테이너 시작
pnpm db:generate      # Prisma 클라이언트 재생성
pnpm db:push          # 스키마를 DB에 반영 (개발용)
pnpm db:migrate       # 마이그레이션 생성 및 적용 (프로덕션)
pnpm --filter @lumen/api lint
pnpm --filter @lumen/web lint
```
