# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 프로젝트 개요

**Lumen** — 개인 지식관리 포털(PKM Portal). NotebookLM 스타일의 RAG 기반 AI 채팅을 핵심으로, 태스크·캘린더·북마크·노트를 통합한 올인원 업무 포털.

- **서비스명**: Lumen (◈ Lumen — Your Personal Knowledge Hub)
- **패키지 매니저**: pnpm@9.15.4 (Node ≥ 20)
- **모노레포**: pnpm workspaces + Turborepo

## 개발 실행 명령어

```bash
# 사전 조건: PostgreSQL 컨테이너 실행 (포트 5433)
pnpm docker:up           # docker compose up -d

# 전체 개발 서버 (web :3050 + api :3051 동시 실행)
pnpm dev

# DB 스키마 변경 후
pnpm db:generate         # Prisma 클라이언트 재생성
pnpm db:push             # 스키마를 DB에 반영 (개발용, 마이그레이션 없음)
pnpm db:migrate          # 마이그레이션 파일 생성 및 적용 (프로덕션용)

# 개별 패키지 명령
pnpm --filter @lumen/api dev
pnpm --filter @lumen/web dev
pnpm --filter @lumen/api lint
```

## 환경 변수

**apps/api/.env** (필수):
```
DATABASE_URL=postgresql://lumen:lumen_secret@localhost:5433/lumen_db
JWT_SECRET=...
JWT_REFRESH_SECRET=...
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
ANTHROPIC_API_KEY=...        # Claude AI (채팅, 북마크 요약, Daily Briefing)
OPENAI_API_KEY=...           # text-embedding-3-small (1536 dims)
PORT=3051
UPLOAD_DIR=./uploads
```

**apps/web/.env.local** (필수):
```
NEXT_PUBLIC_API_URL=http://localhost:3051/api
NEXT_PUBLIC_DEV_BYPASS_AUTH=true       # 개발 환경 빠른 로그인 버튼 활성화
NEXT_PUBLIC_DEV_EMAIL=...
NEXT_PUBLIC_DEV_PASSWORD=...
```

## 아키텍처

### 전체 구조
```
my-notebook-lm/
├── apps/
│   ├── api/          # NestJS 백엔드 (:3051)
│   └── web/          # Next.js 15 프론트엔드 (:3050)
├── packages/
│   └── shared/       # 공유 타입 & DTO
└── prisma/           # 루트 참조용 스키마 (실제 사용은 apps/api/prisma/)
```

### 백엔드 (apps/api)

NestJS 모듈 기반 구조. 모든 라우트는 `/api` prefix.

| 모듈 | 경로 | 역할 |
|------|------|------|
| auth | /api/auth | JWT 인증 (register/login/refresh), bcrypt 해싱 |
| notebooks | /api/notebooks | 노트북 CRUD |
| sources | /api/notebooks/:id/sources | 파일/URL 소스 업로드 → RAG 파이프라인 트리거 |
| embeddings | (내부) | 텍스트 청킹 + OpenAI 임베딩 생성 |
| chat | /api/notebooks/:id/chat | RAG 기반 AI 채팅 (SSE 스트리밍) |
| notes | /api/notes | 노트 CRUD (노트북 연동 가능) |
| tasks | /api/tasks, /api/projects | 태스크 & 프로젝트 CRUD |
| calendar | /api/events | 캘린더 이벤트 CRUD |
| bookmarks | /api/bookmarks | URL 저장 + Claude Haiku AI 자동 요약 |
| tags | /api/tags | 크로스 모델 태그 시스템 |
| ai | /api/ai | Daily Briefing 생성, 글로벌 의미 검색 |
| prisma | (전역) | PrismaService (전역 제공) |

**RAG 파이프라인 흐름** (`sources.service.ts` → `embeddings.service.ts`):
1. 파일(PDF → pdf-parse) 또는 URL(cheerio + fetch)에서 텍스트 추출
2. `EmbeddingsService.chunkText()`로 청크 분할
3. OpenAI `text-embedding-3-small`으로 배치 임베딩 생성
4. `$executeRaw`로 pgvector에 저장 (Prisma Unsupported 타입 우회)

**RAG 채팅 흐름** (`chat.service.ts`):
1. 질문 임베딩 → `$queryRaw`로 코사인 유사도 검색 (`<=>` 연산자)
2. 상위 청크를 컨텍스트로 Claude claude-sonnet-4-6에 전달
3. SSE 스트리밍으로 응답 전송 + 인용 정보(citations) 첨부

> **pgvector 주의**: Prisma가 `vector` 타입을 네이티브 지원하지 않으므로 `$executeRaw`/`$queryRaw`를 반드시 사용.

### 프론트엔드 (apps/web)

Next.js 15 App Router + React Query v5 + Zustand.

**라우트 그룹**:
- `(auth)` — 로그인/회원가입 (인증 불필요)
- `(portal)` — 메인 포털, `layout.tsx`에서 `useAuthStore`로 인증 가드

**상태 관리**:
- **Zustand** (`store/auth.store.ts`): 인증 상태 + localStorage 퍼시스턴스. `setAuth()`로 토큰/유저 저장.
- **React Query** (`lib/api/client.ts`): 서버 상태 캐싱. `useQuery<any[]>` 패턴 사용, queryFn은 반드시 `() => api.list()` 형태로 전달.

**API 클라이언트** (`lib/api/client.ts`):
- Axios 인스턴스, Bearer 토큰 자동 첨부
- 401 시 refresh 토큰으로 자동 재발급, 실패 시 `/login` 리다이렉트

**UI 디자인 시스템**:
- 포털: Tailwind CSS + shadcn/ui (Radix UI 기반)
- 로그인/회원가입: 인라인 CSS (DM Serif Display + DM Sans 폰트, 골드 `#caa968` 어두운 테마)
  - 2컬럼 카드 레이아웃 (max-width: 860px, 화면 중앙 배치)
  - 개발 환경(`IS_DEV`)에서 "⚡ 개발 계정으로 바로 로그인" 버튼 표시

### DB 스키마 핵심 관계

```
User
 ├── Notebook → Source → Chunk (vector embedding)
 │              └── Chat → Message
 ├── Note (notebookId?: optional)
 ├── Project → Task
 ├── Event
 ├── Bookmark
 └── Tag (Note, Task, Bookmark에서 공유)
```

- `Chunk.embedding`: `Unsupported("vector(1536)")` — pgvector 타입
- `Message.citations`: `Json` — AI 인용 정보 저장
- `Source.status`: `PENDING → PROCESSING → READY | ERROR`

## 주요 파일 위치

| 파일 | 용도 |
|------|------|
| `apps/api/prisma/schema.prisma` | DB 스키마 (실제 사용 위치) |
| `apps/api/src/main.ts` | NestJS 부트스트랩, CORS 설정 |
| `apps/api/src/app.module.ts` | 전체 모듈 등록 |
| `apps/api/src/modules/sources/sources.service.ts` | RAG 파이프라인 |
| `apps/api/src/modules/chat/chat.service.ts` | RAG 채팅 + SSE |
| `apps/api/src/modules/ai/ai.service.ts` | Daily Briefing + 글로벌 검색 |
| `apps/web/src/lib/api/client.ts` | API 함수 모음 + Axios 인터셉터 |
| `apps/web/src/store/auth.store.ts` | Zustand 인증 스토어 |
| `apps/web/src/app/(portal)/layout.tsx` | 포털 인증 가드 + Sidebar/TopBar |
