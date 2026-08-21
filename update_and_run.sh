#!/usr/bin/env bash
# =================================================================
# Script to pull latest code from GitHub and run app on Port 3000
# Usage:
#   ./update_and_run.sh         (Production mode: build & run in background)
#   ./update_and_run.sh dev     (Development mode: npm run dev in background)
# =================================================================

set -e

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

echo "🛑 Stopping process on port 3000 if active..."
if command -v lsof &> /dev/null; then
  PIDS=$(lsof -ti:3000 2>/dev/null || true)
  if [ -n "$PIDS" ]; then
    echo "Killing process(es) on port 3000 (PID: $PIDS)..."
    kill -9 $PIDS 2>/dev/null || true
  else
    echo "No active process found on port 3000."
  fi
elif command -v fuser &> /dev/null; then
  fuser -k 3000/tcp 2>/dev/null || true
fi

echo "📥 Pulling recent code from GitHub..."
git pull origin main

echo "📦 Installing dependencies..."
npm install

MODE="${1:-prod}"

if [ "$MODE" = "dev" ]; then
  echo "⚡ Starting app in DEV mode on Port 3000 in background..."
  nohup env PORT=3000 npm run dev > app.log 2>&1 &
  echo "✅ App running in background (PID: $!). View logs with: tail -f app.log"
else
  echo "🏗️ Building application bundle..."
  npm run build

  echo "🚀 Starting app on Port 3000 in background..."
  nohup env PORT=3000 NODE_ENV=production npm start > app.log 2>&1 &
  echo "✅ App running in background (PID: $!). View logs with: tail -f app.log"
fi
