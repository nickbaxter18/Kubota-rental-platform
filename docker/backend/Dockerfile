# Multi-stage build for NestJS backend
FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat dumb-init
WORKDIR /app

# Generate locale for Alpine Linux
RUN apk add --no-cache tzdata && \
    echo "export LANG=en_US.UTF-8" > /etc/profile.d/locale.sh && \
    echo "export LC_ALL=en_US.UTF-8" >> /etc/profile.d/locale.sh

# Copy workspace configuration
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY backend/package.json ./backend/

# Install dependencies
RUN corepack enable && pnpm install --no-frozen-lockfile --prod=false

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app

# Install pnpm
RUN corepack enable

# Copy dependencies
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/backend/node_modules ./backend/node_modules

# Copy source code
COPY . .

# Build the application
RUN cd backend && pnpm run build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV LANG=en_US.UTF-8
ENV LC_ALL=en_US.UTF-8

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nestjs

# Copy package files for production dependencies
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/backend/node_modules ./backend/node_modules

# Copy built application
COPY --from=builder --chown=nestjs:nodejs /app/backend/dist ./backend/dist
COPY --from=builder --chown=nestjs:nodejs /app/backend/src/config ./backend/src/config

# Create non-root user and set permissions
USER nestjs

EXPOSE 3001

ENV PORT 3001
ENV HOSTNAME "0.0.0.0"

# Use dumb-init to handle signals properly
ENTRYPOINT ["/usr/bin/dumb-init", "--"]

# Start the server
CMD ["node", "backend/dist/main"]
