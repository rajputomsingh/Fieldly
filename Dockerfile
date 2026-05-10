# =========================
# Builder Stage
# =========================
FROM node:20-alpine AS builder

WORKDIR /app

RUN npm install -g pnpm

# =========================
# Build arguments
# =========================
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ARG SUPABASE_SERVICE_ROLE_KEY
ARG NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
ARG CLERK_SECRET_KEY
ARG DATABASE_URL

# =========================
# Build environment
# =========================
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV SUPABASE_SERVICE_ROLE_KEY=$SUPABASE_SERVICE_ROLE_KEY
ENV NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=$NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
ENV CLERK_SECRET_KEY=$CLERK_SECRET_KEY
ENV DATABASE_URL=$DATABASE_URL

# =========================
# Dependencies
# =========================
COPY package.json pnpm-lock.yaml ./

COPY prisma ./prisma

RUN pnpm install --frozen-lockfile

# =========================
# Source Code
# =========================
COPY . .

# =========================
# Build Next.js standalone app
# =========================
RUN pnpm build

# =========================
# Production Runner
# =========================
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# =========================
# Copy standalone runtime
# =========================
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# =========================
# Prisma Runtime Files
# =========================
# Prisma
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules ./node_modules
    
EXPOSE 3000

CMD ["node", "server.js"]