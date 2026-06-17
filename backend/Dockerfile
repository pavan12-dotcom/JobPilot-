# Backend Dockerfile
FROM node:20-slim

# Install system dependencies for Playwright + Prisma
RUN apt-get update && apt-get install -y \
  chromium \
  libnss3 \
  libatk-bridge2.0-0 \
  libdrm2 \
  libxkbcommon0 \
  libgtk-3-0 \
  libgbm1 \
  libasound2 \
  libxss1 \
  curl \
  openssl \
  && rm -rf /var/lib/apt/lists/*

ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1
ENV PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium
ENV NODE_ENV=production

WORKDIR /app

COPY package*.json ./
# Install all deps (including devDeps) so prisma CLI is available
RUN npm install --legacy-peer-deps

COPY . .

# Generate Prisma client
RUN npx prisma generate --schema=src/db/prisma/schema.prisma

EXPOSE 3000

CMD ["node", "src/app.js"]
