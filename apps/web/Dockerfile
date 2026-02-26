# ── Stage 1: Base ──
FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@9.15.4 --activate
WORKDIR /app

# ── Stage 2: Install dependencies ──
FROM base AS deps
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/web/package.json apps/web/
COPY packages/shared/package.json packages/shared/
RUN pnpm install --frozen-lockfile --prod=false

# ── Stage 3: Build ──
FROM deps AS build
ARG NEXT_PUBLIC_API_URL=http://localhost:3051/api
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}

COPY packages/shared/ packages/shared/
COPY apps/web/ apps/web/
RUN pnpm --filter @lumen/web run build

# ── Stage 4: Production ──
FROM node:20-alpine AS runner
WORKDIR /app

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

COPY --from=build /app/apps/web/public apps/web/public

RUN mkdir -p apps/web/.next && chown nextjs:nodejs apps/web/.next

COPY --from=build --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=build --chown=nextjs:nodejs /app/apps/web/.next/static apps/web/.next/static

USER nextjs
EXPOSE 3050

ENV PORT=3050
ENV HOSTNAME="0.0.0.0"

WORKDIR /app/apps/web
CMD ["node", "server.js"]
