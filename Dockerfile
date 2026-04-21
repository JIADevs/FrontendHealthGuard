FROM node:20-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
RUN npm install -g turbo

# Step 1: Prune the monorepo
FROM base AS pruner
WORKDIR /app
COPY . .
ARG APP_NAME
# `turbo prune --docker` requires a parsed pnpm lockfile. Repos without `pnpm-lock.yaml`
# (never committed or fresh clone) can still build: generate the lockfile here — no host install.
RUN if [ ! -f pnpm-lock.yaml ]; then \
      echo "pnpm-lock.yaml not in build context; generating with pnpm install --lockfile-only..."; \
      pnpm install --lockfile-only; \
    fi
RUN turbo prune "$APP_NAME" --docker

# Step 2: Install dependencies
FROM base AS installer
WORKDIR /app
COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/out/pnpm-lock.yaml ./pnpm-lock.yaml
# .npmrc must be present so pnpm respects shamefully-hoist=true during install.
# HOISTED_LINKER switches pnpm to node-linker=hoisted for the mobile build only:
# Metro cannot compute SHA-1 for files that live behind .pnpm symlinks, so mobile
# needs real directories. Web uses the default (isolated) linker which works fine
# with Next.js/webpack symlink resolution.
ARG HOISTED_LINKER=false
COPY --from=pruner /app/.npmrc ./.npmrc
RUN if [ "$HOISTED_LINKER" = "true" ]; then echo "node-linker=hoisted" >> .npmrc; fi \
    && pnpm install

# Step 3: WEB (Production-ready stage)
FROM base AS web-runner
WORKDIR /app
COPY --from=pruner /app/out/full/ .
COPY --from=installer /app/ .
COPY turbo.json turbo.json

# Build the app
RUN turbo run build --filter=@helu/web

# Next.js standalone optimization
RUN cp -r apps/web/public apps/web/.next/standalone/apps/web/public
RUN cp -r apps/web/.next/static apps/web/.next/standalone/apps/web/.next/static

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
USER nextjs

EXPOSE 3000
ENV PORT 3000
ENV NODE_ENV=production

# Paths are relative to /app
CMD ["node", "apps/web/.next/standalone/apps/web/server.js"]

# Step 4: WEB (Development stage with hot-reloading)
FROM base AS web-dev
WORKDIR /app
COPY --from=pruner /app/out/full/ .
COPY --from=installer /app/ .

EXPOSE 3000
ENV PORT 3000
ENV NODE_ENV=development

CMD ["pnpm", "dev:web"]

# Step 5: Build & Run - MOBILE (Dev/Preview mode)
FROM base AS mobile-runner
WORKDIR /app
COPY --from=pruner /app/out/full/ .
COPY --from=installer /app/ .

# Install ngrok globally to avoid interactive prompts if tunnel is used
RUN npm install -g @expo/ngrok

# Expo development server ports
EXPOSE 8081
EXPOSE 19000
EXPOSE 19001
EXPOSE 19002

# Switch to the app directory for runtime
WORKDIR /app/apps/mobile

# Default command for mobile
CMD ["npx", "expo", "start", "--port", "8081"]
