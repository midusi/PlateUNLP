# references
# https://pnpm.io/docker#example-2-build-multiple-docker-images-in-a-monorepo

FROM node:22-slim AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

WORKDIR /usr/src/app
COPY . .

RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile
ENV NODE_ENV=production
RUN pnpm run build

EXPOSE 3000
CMD [ "pnpm", "run", "start" ]