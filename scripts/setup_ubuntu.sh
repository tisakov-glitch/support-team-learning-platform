#!/usr/bin/env bash
# =================================================================
# Ubuntu Deployment Script for Support Team Learning Platform
# =================================================================

set -e

echo "🚀 Starting Support Team Learning Platform Setup on Ubuntu..."

# 1. Update system packages
echo "📦 Updating APT packages..."
sudo apt-get update -y
sudo apt-get install -y curl git build-essential postgresql postgresql-contrib

# 2. Install Node.js LTS (v20)
if ! command -v node &> /dev/null; then
    echo "🟢 Installing Node.js LTS..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

echo "Node version: $(node -v)"
echo "NPM version: $(npm -v)"

# 3. Configure PostgreSQL Database
DB_NAME="onb"
DB_USER="talgat"
DB_PASS="talgat"

echo "🐘 Setting up PostgreSQL..."
sudo systemctl enable postgresql
sudo systemctl start postgresql

sudo -u postgres psql -c "DO \$\$ BEGIN IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = '${DB_USER}') THEN CREATE ROLE ${DB_USER} WITH LOGIN SUPERUSER PASSWORD '${DB_PASS}'; ELSE ALTER USER ${DB_USER} WITH PASSWORD '${DB_PASS}'; END IF; END \$\$;"
sudo -u postgres psql -c "CREATE DATABASE ${DB_NAME} OWNER ${DB_USER};" || echo "Database ${DB_NAME} already exists."

# 4. Create .env file if missing
if [ ! -f .env ]; then
    echo "📝 Creating .env configuration file..."
    cat <<EOT > .env
PORT=3000
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=${DB_NAME}
POSTGRES_USER=${DB_USER}
POSTGRES_PASSWORD=${DB_PASS}
EOT
fi

# 5. Install Node.js dependencies
echo "📦 Installing npm packages..."
npm install

# 6. Initialize PostgreSQL database and import data
echo "🗄️ Running PostgreSQL database creation & migration script..."
npm run db:init

# 7. Build application bundle
echo "🏗️ Building application..."
npm run build

# 8. Create Systemd Service for auto-start
SERVICE_FILE="/etc/systemd/system/support-platform.service"
APP_DIR=$(pwd)

echo "⚙️ Creating systemd service at ${SERVICE_FILE}..."
sudo bash -c "cat <<EOT > ${SERVICE_FILE}
[Unit]
Description=Support Team Learning Platform Node.js Service
After=network.target postgresql.service

[Service]
Type=simple
User=$(whoami)
WorkingDirectory=${APP_DIR}
ExecStart=$(which npm) start
Restart=always
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
EOT"

sudo systemctl daemon-reload
sudo systemctl enable support-platform
sudo systemctl restart support-platform

echo "✅ Deployment completed successfully!"
echo "🌐 Service status: sudo systemctl status support-platform"
