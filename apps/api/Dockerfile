# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy root configurations
COPY package*.json ./

# Copy workspace packages
COPY packages/shared ./packages/shared
COPY apps/api ./apps/api

# Install dependencies
RUN npm install

# Build shared package and api
RUN npm run build -w packages/shared
RUN cd apps/api && npx prisma generate && npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/shared ./packages/shared
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/package.json ./apps/api/package.json
COPY --from=builder /app/apps/api/prisma ./apps/api/prisma

ENV NODE_ENV=production

# Create non-root user
RUN addgroup -S snipgroup && adduser -S snipuser -G snipgroup
USER snipuser

EXPOSE 3000

# Start script handles vibrations and app
CMD ["sh", "-c", "npx prisma migrate deploy && node apps/api/dist/server.js"]
