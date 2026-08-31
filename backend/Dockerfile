FROM node:22.21-bookworm

RUN apt-get update -y && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*
ENV NODE_OPTIONS=--dns-result-order=ipv4first
RUN npm install -g pnpm@10.18.3
WORKDIR /app

COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY backend/package.json backend/
# postinstall runs `prisma generate`; schema is not in the image yet
RUN pnpm install --frozen-lockfile --ignore-scripts

COPY backend/ backend/
RUN pnpm --filter backend exec prisma generate
RUN pnpm --filter backend build

WORKDIR /app/backend
RUN mkdir -p uploads
ENV NODE_ENV=production
ENV PORT=4000
EXPOSE 4000

CMD ["node", "dist/src/main"]
