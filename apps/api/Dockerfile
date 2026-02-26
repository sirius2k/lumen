# ── Stage 1: Base ──
FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@9.15.4 --activate
WORKDIR /app

# ── Stage 2: Install dependencies ──
FROM base AS deps
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/api/package.json apps/api/
COPY packages/shared/package.json packages/shared/
RUN pnpm install --frozen-lockfile --prod=false

# ── Stage 3: Build ──
FROM deps AS build
COPY packages/shared/ packages/shared/
COPY apps/api/ apps/api/
RUN pnpm --filter @lumen/api run db:generate
RUN pnpm --filter @lumen/api run build

# ── Stage 4: Production ──
FROM node:20-alpine AS runner
RUN corepack enable && corepack prepare pnpm@9.15.4 --activate
WORKDIR /app

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nestjs

COPY --from=build /app/pnpm-lock.yaml /app/pnpm-workspace.yaml /app/package.json ./
COPY --from=build /app/packages/shared/package.json packages/shared/
COPY --from=build /app/apps/api/package.json apps/api/
RUN pnpm install --frozen-lockfile --prod

COPY --from=build /app/packages/shared/ packages/shared/
COPY --from=build /app/apps/api/dist/ apps/api/dist/
COPY --from=build /app/apps/api/prisma/ apps/api/prisma/
COPY --from=build /app/apps/api/node_modules/.prisma/ apps/api/node_modules/.prisma/

RUN mkdir -p apps/api/uploads && chown nestjs:nodejs apps/api/uploads

USER nestjs
EXPOSE 3051

WORKDIR /app/apps/api
CMD ["node", "dist/main"]
