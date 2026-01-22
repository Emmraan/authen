# Multi-stage Dockerfile for auth-microservice

# Build stage
FROM node:18-alpine AS builder
WORKDIR /app

# Enable pnpm via corepack
RUN corepack enable && corepack prepare pnpm@latest --activate

COPY package.json pnpm-lock.yaml* ./
COPY .npmrc* ./

# Install deps and build
RUN pnpm install --frozen-lockfile || pnpm install
COPY . .
RUN pnpm build

# Production image
FROM node:18-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# Copy built files and production node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY package.json ./package.json

EXPOSE 3000
CMD ["node", "dist/main.js"]
