# syntax=docker/dockerfile:1.7
# Multi-stage Docker build for @tripflow/web (Next.js standalone)
# Build context is the monorepo root (not apps/web/).

ARG NODE_VERSION=20

# ────────────────────────────────────────────────────────────
# Stage 1 — prune the monorepo to just what @tripflow/web needs
# ────────────────────────────────────────────────────────────
FROM node:${NODE_VERSION}-bookworm-slim AS pruner
WORKDIR /repo
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/*
COPY . .
RUN npx --yes turbo@2.9.1 prune @tripflow/web --docker

# ────────────────────────────────────────────────────────────
# Stage 2 — install deps (cached on package.json + lockfile)
# ────────────────────────────────────────────────────────────
FROM node:${NODE_VERSION}-bookworm-slim AS installer
WORKDIR /repo
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/*
COPY --from=pruner /repo/out/json/ ./
COPY --from=pruner /repo/out/package-lock.json ./package-lock.json
RUN npm ci

# ────────────────────────────────────────────────────────────
# Stage 3 — build with the rest of the source
# ────────────────────────────────────────────────────────────
FROM installer AS builder
WORKDIR /repo
COPY --from=pruner /repo/out/full/ ./
# Root tsconfig is not included by `turbo prune`; copy it from build context.
COPY tsconfig.json ./tsconfig.json
# Generate Prisma client BEFORE next build (web imports @tripflow/database which uses Prisma)
RUN npx prisma generate --schema=packages/database/prisma/schema.prisma
# Skip next telemetry + build
ENV NEXT_TELEMETRY_DISABLED=1
RUN npx turbo run build --filter=@tripflow/web

# ────────────────────────────────────────────────────────────
# Stage 4 — runner (minimal image, non-root user)
# ────────────────────────────────────────────────────────────
FROM node:${NODE_VERSION}-bookworm-slim AS runner
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/* \
 && groupadd -g 1001 nodejs \
 && useradd -m -u 1001 -g nodejs nextjs

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Standalone output keeps only what's needed to run
COPY --from=builder --chown=nextjs:nodejs /repo/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /repo/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder --chown=nextjs:nodejs /repo/apps/web/public ./apps/web/public

# Prisma engine binaries live in node_modules/.prisma — standalone tracer usually catches them,
# but copy explicitly to guarantee runtime presence.
COPY --from=builder --chown=nextjs:nodejs /repo/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder --chown=nextjs:nodejs /repo/node_modules/@prisma/client ./node_modules/@prisma/client

USER nextjs
EXPOSE 3000

# Standalone entrypoint is at apps/web/server.js (Next.js generates this)
CMD ["node", "apps/web/server.js"]
