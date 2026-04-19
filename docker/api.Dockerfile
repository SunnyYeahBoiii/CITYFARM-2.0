FROM node:20-bookworm-slim

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
ENV NODE_ENV=production

RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

RUN corepack enable

WORKDIR /app

COPY . .

RUN pnpm install --frozen-lockfile \
  && pnpm --filter api prisma generate \
  && pnpm --filter api build

WORKDIR /app/apps/api

EXPOSE 3001

CMD ["sh", "-c", "pnpm prisma:migrate:deploy && node dist/main"]
