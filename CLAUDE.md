# CLAUDE.md

[English](./CLAUDE.md) | [한국어](./CLAUDE_ko.md)

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Lumen** — Personal Knowledge Management Portal (PKM Portal). An all-in-one productivity portal with RAG-based AI chat (NotebookLM-style) at its core, integrating tasks, calendar, bookmarks, and notes.

- **Service Name**: Lumen (◈ Lumen — Your Personal Knowledge Hub)
- **Package Manager**: pnpm@9.15.4 (Node ≥ 20)
- **Monorepo**: pnpm workspaces + Turborepo

## Development Commands

```bash
# Prerequisites: Start PostgreSQL container (port 5433)
pnpm docker:up           # docker compose up -d

# Full dev server (web :3050 + api :3051 concurrently)
pnpm dev

# After DB schema changes
pnpm db:generate         # Regenerate Prisma client
pnpm db:push             # Push schema to DB (dev only, no migration)
pnpm db:migrate          # Create and apply migration files (production)

# Per-package commands
pnpm --filter @lumen/api dev
pnpm --filter @lumen/web dev
pnpm --filter @lumen/api lint
```

## Environment Variables

**apps/api/.env** (required):
```
DATABASE_URL=postgresql://lumen:lumen_secret@localhost:5433/lumen_db
JWT_SECRET=...
JWT_REFRESH_SECRET=...
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
ANTHROPIC_API_KEY=...        # Claude AI (chat, bookmark summary, Daily Briefing)
OPENAI_API_KEY=...           # text-embedding-3-small (1536 dims)
PORT=3051
UPLOAD_DIR=./uploads
```

**apps/web/.env.local** (required):
```
NEXT_PUBLIC_API_URL=http://localhost:3051/api
NEXT_PUBLIC_DEV_BYPASS_AUTH=true       # Enable quick login button in dev environment
NEXT_PUBLIC_DEV_EMAIL=...
NEXT_PUBLIC_DEV_PASSWORD=...
```

## Architecture

### Overall Structure
```
my-notebook-lm/
├── apps/
│   ├── api/          # NestJS backend (:3051)
│   └── web/          # Next.js 15 frontend (:3050)
├── packages/
│   └── shared/       # Shared types & DTOs
└── prisma/           # Root reference schema (actual usage in apps/api/prisma/)
```

### Backend (apps/api)

NestJS module-based architecture. All routes are prefixed with `/api`.

| Module | Path | Role |
|--------|------|------|
| auth | /api/auth | JWT authentication (register/login/refresh), bcrypt hashing |
| notebooks | /api/notebooks | Notebook CRUD |
| sources | /api/notebooks/:id/sources | File/URL source upload → triggers RAG pipeline |
| embeddings | (internal) | Text chunking + OpenAI embedding generation |
| chat | /api/notebooks/:id/chat | RAG-based AI chat (SSE streaming) |
| notes | /api/notes | Note CRUD (optional notebook association) |
| tasks | /api/tasks, /api/projects | Task & Project CRUD |
| calendar | /api/events | Calendar event CRUD |
| bookmarks | /api/bookmarks | URL save + Claude Haiku AI auto-summarization |
| tags | /api/tags | Cross-model tag system |
| ai | /api/ai | Daily Briefing generation, global semantic search |
| prisma | (global) | PrismaService (globally provided) |

**RAG Pipeline Flow** (`sources.service.ts` → `embeddings.service.ts`):
1. Extract text from file (PDF → pdf-parse) or URL (cheerio + fetch)
2. Split into chunks via `EmbeddingsService.chunkText()`
3. Generate batch embeddings with OpenAI `text-embedding-3-small`
4. Store in pgvector via `$executeRaw` (bypasses Prisma's Unsupported type)

**RAG Chat Flow** (`chat.service.ts`):
1. Embed question → cosine similarity search via `$queryRaw` (`<=>` operator)
2. Pass top chunks as context to Claude claude-sonnet-4-6
3. Stream response via SSE + attach citation info

> **pgvector Note**: Prisma does not natively support the `vector` type — always use `$executeRaw`/`$queryRaw`.

### Frontend (apps/web)

Next.js 15 App Router + React Query v5 + Zustand.

**Route Groups**:
- `(auth)` — Login/Register (no auth required)
- `(portal)` — Main portal, auth guard via `useAuthStore` in `layout.tsx`

**State Management**:
- **Zustand** (`store/auth.store.ts`): Auth state + localStorage persistence. Save tokens/user via `setAuth()`.
- **React Query** (`lib/api/client.ts`): Server state caching. Uses `useQuery<any[]>` pattern; queryFn must be passed as `() => api.list()`.

**API Client** (`lib/api/client.ts`):
- Axios instance with automatic Bearer token attachment
- Auto-refresh on 401, redirects to `/login` on failure

**UI Design System**:
- Portal: Tailwind CSS + shadcn/ui (Radix UI based)
- Login/Register: Inline CSS (DM Serif Display + DM Sans fonts, gold `#caa968` dark theme)
  - 2-column card layout (max-width: 860px, centered)
  - Dev environment (`IS_DEV`) shows quick login button

### DB Schema Core Relations

```
User
 ├── Notebook → Source → Chunk (vector embedding)
 │              └── Chat → Message
 ├── Note (notebookId?: optional)
 ├── Project → Task
 ├── Event
 ├── Bookmark
 └── Tag (shared across Note, Task, Bookmark)
```

- `Chunk.embedding`: `Unsupported("vector(1536)")` — pgvector type
- `Message.citations`: `Json` — stores AI citation info
- `Source.status`: `PENDING → PROCESSING → READY | ERROR`

## Key File Locations

| File | Purpose |
|------|---------|
| `apps/api/prisma/schema.prisma` | DB schema (actual location) |
| `apps/api/src/main.ts` | NestJS bootstrap, CORS config |
| `apps/api/src/app.module.ts` | Root module registration |
| `apps/api/src/modules/sources/sources.service.ts` | RAG pipeline |
| `apps/api/src/modules/chat/chat.service.ts` | RAG chat + SSE |
| `apps/api/src/modules/ai/ai.service.ts` | Daily Briefing + global search |
| `apps/web/src/lib/api/client.ts` | API functions + Axios interceptors |
| `apps/web/src/store/auth.store.ts` | Zustand auth store |
| `apps/web/src/app/(portal)/layout.tsx` | Portal auth guard + Sidebar/TopBar |
