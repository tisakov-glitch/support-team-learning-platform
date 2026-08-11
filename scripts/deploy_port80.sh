#!/usr/bin/env bash
# =================================================================
# Script to pull latest code from GitHub and run app on Port 80
# Usage:
#   ./scripts/deploy_port80.sh         (Production mode: build & run)
#   ./scripts/deploy_port80.sh dev     (Development mode: npm run dev)
# =================================================================

set -e

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR/.."

echo "📥 Pulling recent code from GitHub..."
git pull origin main

echo "📦 Installing dependencies..."
npm install

MODE="${1:-prod}"

if [ "$MODE" = "dev" ]; then
  echo "⚡ Running app in DEV mode on Port 80..."
  if [ "$EUID" -ne 0 ]; then
    echo "🔑 Superuser privileges (sudo) required for port 80..."
    sudo PORT=80 npm run dev
  else
    PORT=80 npm run dev
  fi
else
  echo "🏗️ Building application bundle..."
  npm run build

  echo "🚀 Starting app on Port 80..."
  if [ "$EUID" -ne 0 ]; then
    echo "🔑 Superuser privileges (sudo) required for port 80..."
    sudo PORT=80 npm start
  else
    PORT=80 npm start
  fi
fi
