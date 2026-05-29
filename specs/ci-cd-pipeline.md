# CI/CD Pipeline

## Infrastructure

| Component | Service |
|---|---|
| Git hosting | GitHub |
| CI runner | GitHub Actions (ubuntu-latest) |
| Container registry | Docker Hub or GitHub Container Registry (ghcr.io) |
| Deployment target | VPS with Docker Compose, or Railway/Render |
| Secrets | GitHub Actions Secrets |

---

## Workflow: CI

**File:** `.github/workflows/ci.yml`

```yaml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

env:
  NODE_VERSION: 22
  PNPM_VERSION: 10

jobs:
  lint-typecheck:
    name: Lint & Typecheck
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '${{ env.NODE_VERSION }}' }
      - name: Install pnpm
        run: corepack enable && corepack prepare pnpm@${{ env.PNPM_VERSION }} --activate
      - name: Install dependencies
        run: pnpm install --frozen-lockfile
      - name: Generate Prisma client
        run: cd backend && npx prisma generate
      - name: Lint
        run: pnpm -r lint
      - name: Typecheck
        run: pnpm -r typecheck

  test:
    name: Test
    needs: lint-typecheck
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '${{ env.NODE_VERSION }}' }
      - name: Install pnpm
        run: corepack enable && corepack prepare pnpm@${{ env.PNPM_VERSION }} --activate
      - name: Install dependencies
        run: pnpm install --frozen-lockfile
      - name: Generate Prisma client
        run: cd backend && npx prisma generate
      - name: Backend unit tests
        run: cd backend && pnpm test:cov
      - name: Frontend unit tests
        run: cd frontend && pnpm test:cov
      - name: Upload coverage
        uses: actions/upload-artifact@v4
        with:
          name: coverage
          path: |
            backend/coverage/
            frontend/coverage/

  build:
    name: Build
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '${{ env.NODE_VERSION }}' }
      - name: Install pnpm
        run: corepack enable && corepack prepare pnpm@${{ env.PNPM_VERSION }} --activate
      - name: Install dependencies
        run: pnpm install --frozen-lockfile
      - name: Generate Prisma client
        run: cd backend && npx prisma generate
      - name: Build backend
        run: cd backend && pnpm build
      - name: Build frontend
        run: cd frontend && pnpm build
      - name: Upload build artifacts
        uses: actions/upload-artifact@v4
        with:
          name: build
          path: |
            backend/dist/
            frontend/.next/
```

---

## Workflow: CD

**File:** `.github/workflows/cd.yml`

```yaml
name: CD

on:
  push:
    branches: [main]
  workflow_dispatch:

env:
  REGISTRY: ghcr.io
  OWNER: ${{ github.repository_owner }}
  BACKEND_IMAGE: gladmin-backend
  FRONTEND_IMAGE: gladmin-frontend

jobs:
  docker:
    name: Build & Push Docker Images
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write

    steps:
      - uses: actions/checkout@v4
      - name: Log in to GitHub Container Registry
        uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Build & push backend
        uses: docker/build-push-action@v5
        with:
          context: ./backend
          push: true
          tags: |
            ${{ env.REGISTRY }}/${{ env.OWNER }}/${{ env.BACKEND_IMAGE }}:latest
            ${{ env.REGISTRY }}/${{ env.OWNER }}/${{ env.BACKEND_IMAGE }}:${{ github.sha }}

      - name: Build & push frontend
        uses: docker/build-push-action@v5
        with:
          context: ./frontend
          push: true
          tags: |
            ${{ env.REGISTRY }}/${{ env.OWNER }}/${{ env.FRONTEND_IMAGE }}:latest
            ${{ env.REGISTRY }}/${{ env.OWNER }}/${{ env.FRONTEND_IMAGE }}:${{ github.sha }}

  deploy:
    name: Deploy to VPS
    needs: docker
    runs-on: ubuntu-latest
    steps:
      - name: Deploy via SSH
        uses: appleboy/ssh-action@v1.0.3
        with:
          host: ${{ secrets.VPS_HOST }}
          username: ${{ secrets.VPS_USER }}
          key: ${{ secrets.VPS_SSH_KEY }}
          script: |
            cd /opt/gladmin
            docker compose pull
            docker compose up -d --remove-orphans
            docker image prune -f
            echo "=== Health check ==="
            sleep 5
            curl -sf http://localhost:4000/api/health || echo "HEALTH CHECK FAILED"
```

---

## Server Setup

### docker-compose.yml (deployed on VPS)

```yaml
services:
  postgres:
    image: postgres:16-alpine
    restart: always
    volumes:
      - pgdata:/var/lib/postgresql/data
    environment:
      POSTGRES_DB: gladmin
      POSTGRES_USER: gladmin
      POSTGRES_PASSWORD: ${DB_PASSWORD}

  backend:
    image: ghcr.io/${OWNER}/gladmin-backend:latest
    restart: always
    environment:
      DATABASE_URL: postgresql://gladmin:${DB_PASSWORD}@postgres:5432/gladmin?schema=public
      JWT_SECRET: ${JWT_SECRET}
      JWT_REFRESH_SECRET: ${JWT_REFRESH_SECRET}
    depends_on:
      - postgres

  frontend:
    image: ghcr.io/${OWNER}/gladmin-frontend:latest
    restart: always
    environment:
      NODE_ENV: production
    depends_on:
      - backend

  nginx:
    image: nginx:alpine
    restart: always
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/conf.d/default.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
    depends_on:
      - frontend
      - backend

volumes:
  pgdata:
```

### nginx.conf (on VPS)

```nginx
upstream backend { server backend:4000; }
upstream frontend { server frontend:3000; }

server {
    listen 80;
    server_name gladmin.example.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name gladmin.example.com;

    ssl_certificate /etc/nginx/ssl/fullchain.pem;
    ssl_certificate_key /etc/nginx/ssl/privkey.pem;

    client_max_body_size 10M;

    location /api/ {
        proxy_pass http://backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /_next/ {
        proxy_pass http://frontend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }

    location / {
        proxy_pass http://frontend;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

---

## First-time server bootstrap

```bash
# SSH into VPS
mkdir -p /opt/gladmin/{ssl,nginx}
cd /opt/gladmin

# Clone docker-compose.yml
curl -O https://raw.githubusercontent.com/owner/gladmin/main/docker-compose.yml
curl -O https://raw.githubusercontent.com/owner/gladmin/main/nginx.conf

# Create .env
cat > .env << EOF
DB_PASSWORD=$(openssl rand -base64 24)
JWT_SECRET=$(openssl rand -hex 32)
JWT_REFRESH_SECRET=$(openssl rand -hex 32)
OWNER=your-github-username
EOF

# SSL via Let's Encrypt
docker run -it --rm -p 80:80 -v ./ssl:/etc/letsencrypt \
  certbot/certbot certonly --standalone -d gladmin.example.com

# Deploy
docker compose pull
docker compose up -d
```

---

## Branch strategy

```
main         → production (auto-deploy on push)
develop      → staging (build-only, no deploy)
feature/*    → PR into develop
hotfix/*     → PR directly into main
```

---

## Rollback

```bash
# Roll back to a specific commit
docker compose down
docker compose pull backend:$GIT_SHA frontend:$GIT_SHA
sed -i 's/:latest/:'$GIT_SHA'/' docker-compose.yml
docker compose up -d
```

---

## Secrets required in GitHub

| Secret | Source |
|---|---|
| `VPS_HOST` | Server IP |
| `VPS_USER` | SSH user |
| `VPS_SSH_KEY` | Private SSH key |
| `DB_PASSWORD` | `openssl rand -base64 24` |
| `JWT_SECRET` | `openssl rand -hex 32` |
| `JWT_REFRESH_SECRET` | `openssl rand -hex 32` |
