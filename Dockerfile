# Lean production image for MiBidón (Next.js + Prisma)
# Avoid recursive chown -R /app (OOMs 2GB VPS); use COPY --chown instead.
FROM node:20-alpine AS deps
WORKDIR /app
RUN apk add --no-cache libc6-compat openssl
COPY package.json package-lock.json ./
COPY prisma ./prisma
RUN npm ci

FROM node:20-alpine AS builder
WORKDIR /app
RUN apk add --no-cache libc6-compat openssl
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
RUN npx prisma generate && npm run build \
  && npm prune --omit=dev

FROM node:20-alpine AS runner
WORKDIR /app
RUN apk add --no-cache libc6-compat openssl \
  && addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

COPY --chown=nextjs:nodejs --from=builder /app/package.json ./package.json
COPY --chown=nextjs:nodejs --from=builder /app/package-lock.json ./package-lock.json
COPY --chown=nextjs:nodejs --from=builder /app/node_modules ./node_modules
COPY --chown=nextjs:nodejs --from=builder /app/.next ./.next
COPY --chown=nextjs:nodejs --from=builder /app/public ./public
COPY --chown=nextjs:nodejs --from=builder /app/prisma ./prisma
COPY --chown=nextjs:nodejs --from=builder /app/scripts ./scripts
COPY --chown=nextjs:nodejs --from=builder /app/src ./src
COPY --chown=nextjs:nodejs --from=builder /app/next.config.ts ./next.config.ts
COPY --chown=nextjs:nodejs --from=builder /app/tsconfig.json ./tsconfig.json
COPY --chown=nextjs:nodejs docker/entrypoint.sh ./docker/entrypoint.sh

RUN chmod +x ./docker/entrypoint.sh \
  && mkdir -p /app/public/uploads \
  && chown nextjs:nodejs /app/public/uploads

USER nextjs
EXPOSE 3000
ENTRYPOINT ["./docker/entrypoint.sh"]
