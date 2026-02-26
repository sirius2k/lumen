# ◈ Lumen - Your Personal Knowledge Hub

AI 기반 개인 지식관리 포털. NotebookLM의 RAG 채팅 기능을 핵심으로 태스크, 캘린더, 북마크, 대시보드까지 통합.

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

```bash
# apps/api/.env 생성 (예시에서 복사)
cp apps/api/.env.example apps/api/.env

# 필수: 실제 API 키 입력
# ANTHROPIC_API_KEY=sk-ant-...
# OPENAI_API_KEY=sk-...

# apps/web/.env.local 생성
cp apps/web/.env.local.example apps/web/.env.local
```

### 2. 의존성 설치

```bash
pnpm install
```

### 3. Docker PostgreSQL 실행

```bash
docker compose up -d
```

### 4. DB 테이블 생성

```bash
cd apps/api && npx prisma db push --schema=./prisma/schema.prisma
```

### 5. 앱 실행

```bash
pnpm dev
```

- **프론트엔드**: http://localhost:3050
- **백엔드 API**: http://localhost:3051/api

## 주요 기능

### 🧠 지식 베이스 (NotebookLM)
- PDF/TXT 파일 업로드 → 자동 청크 분할 → pgvector 임베딩
- URL 추가 → cheerio 웹 스크래핑 → 임베딩
- RAG 기반 AI 채팅 (SSE 스트리밍 + 인용 표시)

### ✅ 태스크 관리
- 프로젝트별 태스크 그룹화
- 상태 관리 (TODO / IN_PROGRESS / DONE)
- 마감일 설정 및 오늘 할일 필터

### 📅 캘린더
- 월간 달력 뷰
- 이벤트 생성/관리

### 🔖 북마크
- URL 저장 → Claude Haiku AI 자동 요약
- 읽음/미읽음 상태 관리
- 태그 분류

### 🏠 홈 대시보드
- 오늘 할일 위젯
- 최근 노트 위젯
- AI Daily Briefing (Claude Haiku)

### 📝 노트
- 마크다운 에디터
- 노트북 연결 지원
- 태그 분류

## 프로젝트 구조

```
my-notebook-lm/
├── apps/
│   ├── web/          # Next.js 15 (포트 3050)
│   └── api/          # NestJS (포트 3051)
├── packages/
│   └── shared/       # 공유 타입 & DTO
├── prisma/           # 원본 스키마 (참조용)
├── docker-compose.yml
├── turbo.json
└── pnpm-workspace.yaml
```

## API 엔드포인트

```
POST /api/auth/register|login|refresh
GET|POST|PATCH|DELETE /api/notebooks
POST /api/notebooks/:id/sources/file|url
POST /api/notebooks/:id/chat  (SSE)
GET|POST|PATCH|DELETE /api/notes
GET|POST|PATCH|DELETE /api/tasks
GET|POST|PATCH|DELETE /api/projects
GET|POST|PATCH|DELETE /api/events
GET|POST|PATCH|DELETE /api/bookmarks
GET|POST|DELETE /api/tags
POST /api/ai/briefing
GET /api/ai/search
```
