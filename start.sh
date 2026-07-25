#!/usr/bin/env bash
set -e

echo "🚀 Starting Cuadra..."
echo ""

# Start backend
echo "[Backend] Starting NestJS on port 4000..."
pnpm --filter backend dev &
BACKEND_PID=$!

# Start frontend
echo "[Frontend] Starting Next.js on port 3000..."
pnpm --filter frontend dev &
FRONTEND_PID=$!

echo ""
echo "📡 Backend:  http://localhost:4000"
echo "🌐 Frontend: http://localhost:3000"
echo ""

trap "echo ''; echo 'Stopping...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT TERM

wait
