# =========================
# Fieldly Development Image
# =========================

FROM node:20-alpine

WORKDIR /app

# =========================
# Development Environment
# =========================
ENV NODE_ENV=development
ENV CHOKIDAR_USEPOLLING=true
ENV WATCHPACK_POLLING=true

# =========================
# Install pnpm
# =========================
RUN npm install -g pnpm

# =========================
# Copy Dependencies
# =========================
COPY package.json pnpm-lock.yaml ./

# =========================
# Copy Prisma BEFORE install
# =========================
COPY prisma ./prisma

# =========================
# Install Dependencies
# =========================
RUN pnpm install

# =========================
# Copy Remaining Source Code
# =========================
COPY . .

# =========================
# Expose Development Port
# =========================
EXPOSE 3000

# =========================
# Start Dev Server
# =========================
CMD ["pnpm", "dev", "--no-turbopack"]