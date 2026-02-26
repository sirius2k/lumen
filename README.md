[English](./README.md) | [한국어](./README_ko.md)

# ◈ Lumen — Your Personal Knowledge Hub

AI-powered personal knowledge management portal. RAG-based AI chat (NotebookLM-style) at its core, integrated with tasks, calendar, bookmarks, notes, and a daily briefing dashboard.

## Tech Stack

| Area | Technology |
|------|-----------|
| Frontend | Next.js 15 (App Router) + TypeScript |
| Backend | NestJS + TypeScript |
| UI | Tailwind CSS + shadcn/ui |
| DB | PostgreSQL + pgvector (Docker) |
| ORM | Prisma |
| AI | Claude claude-sonnet-4-6 (Anthropic SDK) |
| Embeddings | text-embedding-3-small (OpenAI) |
| Auth | NestJS Passport + JWT |
| Monorepo | pnpm workspaces + Turborepo |

## Quick Start

### 1. Set Up Environment Variables

**`apps/api/.env`** (required):
```
DATABASE_URL=postgresql://lumen:lumen_secret@localhost:5433/lumen_db
JWT_SECRET=your-jwt-secret
JWT_REFRESH_SECRET=your-refresh-secret
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...
PORT=3051
UPLOAD_DIR=./uploads
```

**`apps/web/.env.local`** (required):
```
NEXT_PUBLIC_API_URL=http://localhost:3051/api
NEXT_PUBLIC_DEV_BYPASS_AUTH=true
NEXT_PUBLIC_DEV_EMAIL=your@email.com
NEXT_PUBLIC_DEV_PASSWORD=yourpassword
```

### 2. Start Services

```bash
# Start PostgreSQL container (port 5433)
pnpm docker:up

# Install dependencies
pnpm install

# Push DB schema
pnpm db:push

# Start all dev servers (web :3050 + api :3051)
pnpm dev
```

Open [http://localhost:3050](http://localhost:3050) in your browser.

## Features

- **Knowledge Base** — Upload PDFs/URLs, ask questions via RAG-powered AI chat with citations
- **Notes** — Markdown note editor, linked to notebooks
- **Tasks** — Project-based task management with filters
- **Calendar** — Monthly event view with inline creation
- **Bookmarks** — Save URLs with automatic AI summaries (Claude Haiku)
- **Dashboard** — Daily briefing, today's tasks, recent notes
- **i18n** — English / Korean UI toggle
- **Themes** — 5 color themes × light/dark mode (persisted in localStorage)

## Project Structure

```
my-notebook-lm/
├── apps/
│   ├── api/          # NestJS backend (:3051)
│   └── web/          # Next.js 15 frontend (:3050)
├── packages/
│   └── shared/       # Shared types & DTOs
└── prisma/           # Schema reference
```

## Available Scripts

```bash
pnpm dev              # Start all dev servers
pnpm docker:up        # Start PostgreSQL container
pnpm db:generate      # Regenerate Prisma client
pnpm db:push          # Push schema to DB (dev)
pnpm db:migrate       # Create and apply migration (prod)
pnpm --filter @lumen/api lint
pnpm --filter @lumen/web lint
```
