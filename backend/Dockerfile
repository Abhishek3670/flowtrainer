# backend/Dockerfile

# Stage 1: Build
FROM node:18-alpine AS builder
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all deps (including dev) for build
RUN npm install

# Copy source and config
COPY tsconfig*.json ./
COPY src ./src

# Compile TypeScript
RUN npm run build

# Stage 2: Production
FROM node:18-alpine
WORKDIR /app
ENV NODE_ENV=production

# Copy only runtime artifacts
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/dist ./dist

# Install only production deps
RUN npm install --omit=dev

EXPOSE 4000
CMD ["node", "dist/server.js"]
