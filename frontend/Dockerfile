# ---- deps: installed node_modules, reused by both the dev override (via a
# named volume, see docker-compose.override.yml) and the builder stage below ----
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# ---- builder: production build with output: "standalone" ----
FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# NEXT_PUBLIC_* vars are baked into the client bundle at build time, not read
# at runtime — must be passed as a build arg, not a compose `environment:` var.
ARG NEXT_PUBLIC_YANDEX_MAPS_API_KEY
ENV NEXT_PUBLIC_YANDEX_MAPS_API_KEY=$NEXT_PUBLIC_YANDEX_MAPS_API_KEY
ENV NEXT_TELEMETRY_DISABLED=1

# `next.config.ts`'s `rewrites()` also reads BACKEND_API_URL, and `next build`
# evaluates it once and bakes the result into .next/routes-manifest.json —
# the standalone server reads that manifest at runtime, it does not call
# `rewrites()` again. Without this, the fallback in next.config.ts
# ("http://localhost:8000") gets baked in instead, and the frontend
# container's image optimizer can't reach the backend container at all.
# `http://backend:8000` is the one true value: every place this image is
# actually built and run puts the two containers on the same Compose network
# under that service name (docker-compose.prod.yml sets it identically as a
# runtime var too, which only matters for code that reads it per-request).
ARG BACKEND_API_URL=http://backend:8000
ENV BACKEND_API_URL=$BACKEND_API_URL

RUN npm run build

# ---- runner: minimal production image (default build target) ----
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3031 \
    HOSTNAME=0.0.0.0

RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Pre-created so the named volume Compose mounts here inherits nextjs's
# ownership. A volume mounted onto a path that doesn't exist in the image
# is created root-owned, and the optimizer then silently fails to cache.
RUN mkdir -p .next/cache/images && chown -R nextjs:nodejs .next

USER nextjs

EXPOSE 3031

CMD ["node", "server.js"]
