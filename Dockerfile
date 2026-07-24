FROM node:24-bookworm-slim AS base

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates git openssl \
  && rm -rf /var/lib/apt/lists/*

RUN corepack enable

WORKDIR /app

FROM base AS deps

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

FROM deps AS builder

ENV DATABASE_URL="file:/tmp/plateunlp-build.sqlite"
ENV DATABASE_TLS="false"
ENV UPLOADS_DIR="/tmp/plateunlp-uploads"

COPY . .
RUN mkdir -p "$UPLOADS_DIR" && pnpm build

FROM node:24-bookworm-slim AS runner

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000

WORKDIR /app

COPY --from=builder /app/.output ./.output
COPY --from=builder /app/app/models ./app/models

EXPOSE 3000

CMD ["node", ".output/server/index.mjs"]
