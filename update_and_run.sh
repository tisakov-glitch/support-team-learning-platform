#!/usr/bin/env bash
# =================================================================
# Script to pull latest code from GitHub and run app on Port 3000
# Usage:
#   ./update_and_run.sh         (Production mode: build & run)
#   ./update_and_run.sh dev     (Development mode: npm run dev)
# =================================================================

set -e

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

echo "📥 Pulling recent code from GitHub..."
git pull origin main

echo "📦 Installing dependencies..."
npm install

MODE="${1:-prod}"

if [ "$MODE" = "dev" ]; then
  echo "⚡ Running app in DEV mode on Port 3000..."
  PORT=3000 npm run dev
else
  echo "🏗️ Building application bundle..."
  npm run build

  echo "🚀 Starting app on Port 3000..."
  PORT=3000 npm start
fi
