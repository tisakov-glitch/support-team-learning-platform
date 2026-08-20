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

echo "🗄️ Applying PostgreSQL database DDL migrations (employees normalization & rank_id FK)..."
MIGRATION_SQL="
  ALTER TABLE employees ADD COLUMN IF NOT EXISTS first_name VARCHAR(255) DEFAULT '';
  ALTER TABLE employees ADD COLUMN IF NOT EXISTS last_name VARCHAR(255) DEFAULT '';
  ALTER TABLE employees ADD COLUMN IF NOT EXISTS phone VARCHAR(64);
  ALTER TABLE employees ADD COLUMN IF NOT EXISTS department_id VARCHAR(10) REFERENCES departments(id) ON DELETE SET NULL;
  ALTER TABLE employees ADD COLUMN IF NOT EXISTS position_code VARCHAR(64) REFERENCES positions(code) ON DELETE SET NULL;
  ALTER TABLE employees ADD COLUMN IF NOT EXISTS rank_id VARCHAR(64) REFERENCES ranks(id) ON DELETE SET NULL;
  ALTER TABLE employees ADD COLUMN IF NOT EXISTS bio TEXT;
  ALTER TABLE employees ADD COLUMN IF NOT EXISTS specializations TEXT[] DEFAULT '{}';
  ALTER TABLE employees ADD COLUMN IF NOT EXISTS course_started_dates JSONB DEFAULT '{}'::jsonb;

  DO \$\$
  BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='employees' AND column_name='name') THEN
      UPDATE employees SET 
        first_name = CASE WHEN position(' ' in name) > 0 THEN split_part(name, ' ', 1) ELSE name END,
        last_name = CASE WHEN position(' ' in name) > 0 THEN substring(name from position(' ' in name)+1) ELSE '' END
      WHERE (first_name = '' OR first_name IS NULL) AND name IS NOT NULL AND name != '';
      ALTER TABLE employees DROP COLUMN IF EXISTS name CASCADE;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='employees' AND column_name='profile') THEN
      UPDATE employees SET
        phone = COALESCE(phone, profile->>'phone'),
        department_id = COALESCE(department_id, profile->>'departmentId', (SELECT id FROM departments WHERE name = profile->>'department' LIMIT 1)),
        position_code = COALESCE(position_code, profile->>'positionCode'),
        bio = COALESCE(bio, profile->>'bio'),
        course_started_dates = COALESCE(course_started_dates, profile->'courseStartedDates');
      ALTER TABLE employees DROP COLUMN IF EXISTS profile CASCADE;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='employees' AND column_name='rank_name') THEN
      UPDATE employees e SET rank_id = r.id
      FROM ranks r
      WHERE e.rank_id IS NULL AND e.rank_name IS NOT NULL AND r.position_code = e.position_code AND (r.name = e.rank_name OR r.id = e.rank_name);

      ALTER TABLE employees DROP COLUMN IF EXISTS rank_name CASCADE;
    END IF;
  END \$\$;
"

if [ -n "$DATABASE_URL" ]; then
  psql "$DATABASE_URL" -c "$MIGRATION_SQL" 2>/dev/null || psql -U postgres -d support_db -c "$MIGRATION_SQL" 2>/dev/null || true
  psql "$DATABASE_URL" -f scripts/schema.sql 2>/dev/null || psql -U postgres -d support_db -f scripts/schema.sql 2>/dev/null || true
else
  psql -U postgres -d support_db -c "$MIGRATION_SQL" 2>/dev/null || true
  psql -U postgres -d support_db -f scripts/schema.sql 2>/dev/null || true
fi

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
