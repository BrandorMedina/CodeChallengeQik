# ---------- BUILD STAGE ----------
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY tsconfig*.json ./
COPY nest-cli.json ./

RUN npm ci

COPY . .

# Build del proyecto (incluye migraciones en dist)
RUN npm run build

# ---------- PRODUCTION STAGE ----------
FROM node:20-alpine AS production

WORKDIR /app

ENV NODE_ENV=production

COPY package*.json ./
RUN npm ci --omit=dev

# Copiamos SOLO lo necesario
COPY --from=builder /app/dist ./dist

EXPOSE 3000

# 👇 Ejecuta migraciones antes de iniciar la app
CMD ["sh", "-c", "node dist/main.js"]