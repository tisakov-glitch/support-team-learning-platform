#!/usr/bin/env bash
set -e

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

echo "🛑 Stopping process on port 3000..."
if command -v fuser &> /dev/null; then
  fuser -k 3000/tcp 2>/dev/null || true
elif command -v lsof &> /dev/null; then
  PIDS=$(lsof -ti:3000 2>/dev/null || true)
  if [ -n "$PIDS" ]; then
    kill -9 $PIDS 2>/dev/null || true
  fi
fi

echo "📥 Pulling latest code from GitHub..."
git pull origin main

MODE="${1:-prod}"

if [ "$MODE" = "dev" ]; then
  echo "⚡ Starting app in DEV mode..."
  nohup env PORT=3000 npm run dev > app.log 2>&1 &
else
  echo "🏗️ Building application..."
  npm run build

  echo "🚀 Starting server..."
  nohup env PORT=3000 NODE_ENV=production npm start > app.log 2>&1 &
fi

echo "✅ Deployment complete! View logs with: tail -f app.log"
