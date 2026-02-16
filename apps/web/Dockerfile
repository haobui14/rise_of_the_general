# Build stage
FROM node:20-alpine AS builder

# Install pnpm
RUN corepack enable && corepack prepare pnpm@10.6.2 --activate

WORKDIR /app

# Copy workspace files
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml .npmrc ./
COPY apps/web/package.json ./apps/web/
COPY packages/shared-types/package.json ./packages/shared-types/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY tsconfig.base.json ./
COPY packages/shared-types ./packages/shared-types
COPY apps/web ./apps/web

# Build shared types first
RUN pnpm --filter @rotg/shared-types build

# Build web app
RUN pnpm --filter @rotg/web build

# Production stage - serve with nginx
FROM nginx:alpine

# Copy built files
COPY --from=builder /app/apps/web/dist /usr/share/nginx/html

# Copy nginx configuration template
COPY apps/web/nginx.conf /etc/nginx/templates/default.conf.template

# Set default port (Railway overrides this with its PORT env var)
ENV PORT=80
ENV NGINX_ENVSUBST_OUTPUT_DIR=/etc/nginx/conf.d
