FROM node:20-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
RUN npm install -g turbo

# Step 1: Prune the monorepo
FROM base AS pruner
WORKDIR /app
COPY . .
ARG APP_NAME
RUN turbo prune $APP_NAME --docker

# Step 2: Install dependencies
FROM base AS installer
WORKDIR /app
COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/out/pnpm-lock.yaml ./pnpm-lock.yaml
RUN pnpm install

# Step 3: Build & Run - WEB
FROM base AS web-runner
WORKDIR /app
COPY --from=pruner /app/out/full/ .
COPY --from=installer /app/ .
COPY turbo.json turbo.json

# Build the app
RUN turbo run build --filter=@healthguard/web

# Next.js standalone optimization
# Copy static files to the standalone directory so they can be served by the custom server
RUN cp -r apps/web/public apps/web/.next/standalone/apps/web/public
RUN cp -r apps/web/.next/static apps/web/.next/standalone/apps/web/.next/static

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
USER nextjs

EXPOSE 3000
ENV PORT 3000
ENV NODE_ENV=production

# The server.js is located within the standalone folder
CMD ["node", "apps/web/.next/standalone/apps/web/server.js"]

# Step 4: Build & Run - MOBILE (Dev/Preview mode)
FROM base AS mobile-runner
WORKDIR /app/apps/mobile
COPY --from=pruner /app/out/full/ .
COPY --from=installer /app/ .

# Install ngrok globally to avoid interactive prompts if tunnel is used
RUN npm install -g @expo/ngrok


# Expo development server ports
EXPOSE 8081
EXPOSE 19000
EXPOSE 19001
EXPOSE 19002

# Default command for mobile (dev server)
CMD ["npx", "expo", "start", "--web", "--port", "8081"]
