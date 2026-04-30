FROM node:20-bookworm-slim AS base

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

RUN corepack enable

WORKDIR /app

FROM base AS deps

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY apps/web/package.json apps/web/package.json
COPY apps/admin/package.json apps/admin/package.json
COPY apps/api/package.json apps/api/package.json
COPY apps/model-api/package.json apps/model-api/package.json
COPY packages/ui/package.json packages/ui/package.json
COPY packages/eslint-config/package.json packages/eslint-config/package.json
COPY packages/typescript-config/package.json packages/typescript-config/package.json

RUN pnpm install --frozen-lockfile

FROM base AS builder

ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_WEB_URL

ENV NEXT_TELEMETRY_DISABLED=1
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_WEB_URL=$NEXT_PUBLIC_WEB_URL

COPY --from=deps /app/ /app/
COPY . .

RUN test -n "$NEXT_PUBLIC_API_URL" || (echo "Missing required build arg: NEXT_PUBLIC_API_URL" && exit 1)
RUN test -n "$NEXT_PUBLIC_WEB_URL" || (echo "Missing required build arg: NEXT_PUBLIC_WEB_URL" && exit 1)
RUN pnpm --filter admin build

FROM node:20-bookworm-slim AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV HOSTNAME=0.0.0.0
ENV PORT=3000
ENV NEXT_PUBLIC_API_URL=""
ENV NEXT_PUBLIC_WEB_URL=""

COPY --from=builder /app/apps/admin/.next/standalone ./
COPY --from=builder /app/apps/admin/public ./apps/admin/public
COPY --from=builder /app/apps/admin/.next/static ./apps/admin/.next/static

EXPOSE 3000

CMD ["node", "apps/admin/server.js"]
