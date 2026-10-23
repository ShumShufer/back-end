# Stage 1: Build & Dependencies
FROM node:22-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma.config.ts ./
COPY prisma ./prisma/

# Install dependencies including devDependencies for build
RUN npm ci

# Copy source code and TypeScript config
COPY tsconfig.json ./
COPY src ./src/
COPY generated ./generated/

# Generate Prisma Client and build TypeScript
RUN npx prisma generate
RUN npm run build

# Prune dev dependencies for production
RUN npm prune --production

# Stage 2: Production Runtime
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3005

# Copy package and node_modules from builder
COPY package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/generated ./generated
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts

# Create directory for uploads
RUN mkdir -p uploads && chown -R node:node /app

USER node

EXPOSE 3005

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3005/health || exit 1

CMD ["npm", "start"]
