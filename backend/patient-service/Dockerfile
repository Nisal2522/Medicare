FROM node:20-alpine3.21 AS builder
WORKDIR /app
RUN apk add --no-cache python3 make g++
COPY package*.json ./
RUN npm ci --include=dev
COPY . .
RUN npm run build && npm prune --omit=dev

FROM node:20-alpine3.21 AS production
WORKDIR /app
ENV NODE_ENV=production
RUN apk add --no-cache libc6-compat su-exec \
  && addgroup -g 1001 -S nodejs \
  && adduser -S nestjs -u 1001 \
  && mkdir -p /app/uploads/medical-reports /app/uploads/patient-reports /app/uploads/patient-avatars \
  && chown -R nestjs:nodejs /app
COPY --from=builder --chown=nestjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nestjs:nodejs /app/dist ./dist
COPY --from=builder --chown=nestjs:nodejs /app/package.json ./
EXPOSE 3004
USER root
CMD ["sh", "-c", "mkdir -p /app/uploads/medical-reports /app/uploads/patient-avatars /app/uploads/patient-reports && chown -R nestjs:nodejs /app/uploads && exec su-exec nestjs node dist/main.js"]
