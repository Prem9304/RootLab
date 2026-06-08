# Dockerfile

# ---- Base Stage ----
FROM node:18-alpine AS base
RUN apk add --no-cache libc6-compat docker-cli
WORKDIR /app
COPY package.json package-lock.json* ./

# ---- Dependencies Stage ----
FROM base AS deps
RUN npm install

# ---- Builder Stage ----
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# ---- Runner Stage ----
FROM base AS runner
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/server.js ./server.js
COPY --from=builder /app/node_modules ./node_modules

# Expose the port the app runs on
EXPOSE 3000

ENV NODE_ENV=production

# Command to start the custom server
CMD ["node", "server.js"]