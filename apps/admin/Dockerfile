# syntax=docker/dockerfile:1.7
# Multi-stage Docker build for @tripflow/admin (Next.js standalone)
# Build context is the monorepo root (not apps/admin/).

ARG NODE_VERSION=20

# ────────────────────────────────────────────────────────────
# Stage 1 — prune the monorepo to just what @tripflow/admin needs
# ────────────────────────────────────────────────────────────
FROM node:${NODE_VERSION}-bookworm-slim AS pruner
WORKDIR /repo
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/*
COPY . .
RUN npx --yes turbo@2.9.1 prune @tripflow/admin --docker

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
RUN npx prisma generate --schema=packages/database/prisma/schema.prisma
ENV NEXT_TELEMETRY_DISABLED=1
RUN npx turbo run build --filter=@tripflow/admin

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
ENV PORT=3001
ENV HOSTNAME=0.0.0.0

COPY --from=builder --chown=nextjs:nodejs /repo/apps/admin/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /repo/apps/admin/.next/static ./apps/admin/.next/static
COPY --from=builder --chown=nextjs:nodejs /repo/apps/admin/public ./apps/admin/public

COPY --from=builder --chown=nextjs:nodejs /repo/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder --chown=nextjs:nodejs /repo/node_modules/@prisma/client ./node_modules/@prisma/client

USER nextjs
EXPOSE 3001

CMD ["node", "apps/admin/server.js"]
