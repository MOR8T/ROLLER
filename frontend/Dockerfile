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

USER nextjs

EXPOSE 3031

CMD ["node", "server.js"]
