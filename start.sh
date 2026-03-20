#!/bin/bash
set -e

echo ""
echo "🚀 TripFlow"
echo "==========="

# ── Node.js check ───────────────────────────────────────
if ! command -v node &> /dev/null; then
  echo "❌ Node.js not found. Install from https://nodejs.org (>= 18)"
  exit 1
fi
NODE_VER=$(node -v | sed 's/v//' | cut -d. -f1)
if [ "$NODE_VER" -lt 18 ]; then
  echo "❌ Node.js >= 18 required (found $(node -v))"
  exit 1
fi
echo "✓ Node.js $(node -v)"

# ── .env check ──────────────────────────────────────────
if [ ! -f ".env" ]; then
  cp .env.example .env
  echo ""
  echo "⚠️  สร้าง .env แล้ว — กรุณาใส่ค่าต่อไปนี้ก่อน:"
  echo ""
  echo "   DATABASE_URL=postgresql://..."
  echo "   NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co"
  echo "   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ..."
  echo ""
  echo "จากนั้นรัน ./start.sh อีกครั้ง"
  exit 1
fi

# ── Check required env vars ─────────────────────────────
check_env() {
  if ! grep -q "^$1=.\+" .env 2>/dev/null; then
    echo "❌ $1 ยังไม่ได้ตั้งค่าใน .env"
    MISSING=1
  fi
}
MISSING=0
check_env "DATABASE_URL"
check_env "NEXT_PUBLIC_SUPABASE_URL"
check_env "NEXT_PUBLIC_SUPABASE_ANON_KEY"
if [ "$MISSING" = "1" ]; then
  echo ""
  echo "กรุณาแก้ไข .env แล้วรัน ./start.sh อีกครั้ง"
  exit 1
fi
echo "✓ .env OK"

# ── Install dependencies (skip if node_modules exists) ──
if [ ! -d "node_modules" ]; then
  echo ""
  echo "📦 Installing dependencies..."
  npm install --silent
  echo "✓ Dependencies installed"
else
  echo "✓ Dependencies already installed"
fi

# ── Prisma generate (skip if client exists) ─────────────
if [ ! -d "node_modules/@prisma/client" ] || [ "packages/database/prisma/schema.prisma" -nt "node_modules/@prisma/client/index.js" ]; then
  echo ""
  echo "🔧 Generating Prisma client..."
  cd packages/database && npx dotenv -e ../../.env -- npx prisma generate --silent 2>&1 | grep -E "Generated|Error" || true && cd ../..
  echo "✓ Prisma client ready"
else
  echo "✓ Prisma client already generated"
fi

# ── DB push ─────────────────────────────────────────────
echo ""
echo "🗄️  Syncing database schema..."
cd packages/database && npx dotenv -e ../../.env -- npx prisma db push --skip-generate 2>&1 | grep -E "Your|been|error|Error|✓|🚀" | head -5 || true && cd ../..
echo "✓ Database schema synced"

# ── Seed (skip if data exists) ──────────────────────────
echo ""
echo "🌱 Checking demo data..."
TOUR_COUNT=$(cd packages/database && npx dotenv -e ../../.env -- node -e "
const {PrismaClient}=require('../../node_modules/@prisma/client');
const p=new PrismaClient();
p.tour.count().then(c=>{console.log(c);p.\$disconnect();}).catch(()=>{console.log(0);});
" 2>/dev/null || echo "0")

if [ "$TOUR_COUNT" = "0" ]; then
  echo "   Seeding demo tours..."
  cd packages/database && npx dotenv -e ../../.env -- npx tsx prisma/seed.ts 2>&1 | grep -E "✓|✅|Error" || true && cd ../..
  echo "✓ Demo data seeded"
else
  echo "✓ Demo data already exists ($TOUR_COUNT tours)"
fi

# ── Helpers ──────────────────────────────────────────────
file_hash() {
  if command -v md5 &>/dev/null; then
    md5 -q "$1" 2>/dev/null
  else
    md5sum "$1" 2>/dev/null | cut -d' ' -f1
  fi
}

run_prisma() {
  echo ""
  echo "🔧 schema.prisma เปลี่ยน — regenerating Prisma client..."
  cd packages/database && npx dotenv -e ../../.env -- npx prisma generate --silent 2>&1 | grep -E "Generated|Error" || true
  npx dotenv -e ../../.env -- npx prisma db push --skip-generate 2>&1 | grep -E "Your|been|error|Error|✓|🚀" | head -5 || true
  cd ../..
  echo "✓ Prisma client updated"
}

run_install() {
  echo ""
  echo "📦 package.json เปลี่ยน — installing dependencies..."
  npm install --silent
  echo "✓ Dependencies updated"
}

start_dev() {
  npm run dev &
  DEV_PID=$!
}

stop_dev() {
  if [ -n "$DEV_PID" ] && kill -0 "$DEV_PID" 2>/dev/null; then
    kill "$DEV_PID" 2>/dev/null
    wait "$DEV_PID" 2>/dev/null || true
  fi
}

# ── Cleanup on exit ──────────────────────────────────────
cleanup() {
  echo ""
  echo "👋 Stopping TripFlow..."
  stop_dev
  exit 0
}
trap cleanup INT TERM

# ── Start ────────────────────────────────────────────────
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Ready! Starting all services..."
echo ""
echo "  🌐 Web (Traveler):  http://localhost:3000"
echo "  🛠️  Admin:          http://localhost:3001"
echo "  👑 Superadmin:      http://localhost:3002"
echo ""
echo "  Auto-reload เปิดอยู่ (schema / .env / package.json)"
echo "  Press Ctrl+C to stop"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

start_dev

# ── Watch loop ───────────────────────────────────────────
SCHEMA="packages/database/prisma/schema.prisma"
ENVFILE=".env"
PKG_WEB="apps/web/package.json"
PKG_ADMIN="apps/admin/package.json"
PKG_ROOT="package.json"

HASH_SCHEMA=$(file_hash "$SCHEMA")
HASH_ENV=$(file_hash "$ENVFILE")
HASH_PKG="$(file_hash "$PKG_WEB")-$(file_hash "$PKG_ADMIN")-$(file_hash "$PKG_ROOT")"

while true; do
  sleep 2

  NEW_SCHEMA=$(file_hash "$SCHEMA")
  NEW_ENV=$(file_hash "$ENVFILE")
  NEW_PKG="$(file_hash "$PKG_WEB")-$(file_hash "$PKG_ADMIN")-$(file_hash "$PKG_ROOT")"

  NEEDS_RESTART=0

  if [ "$HASH_SCHEMA" != "$NEW_SCHEMA" ]; then
    HASH_SCHEMA="$NEW_SCHEMA"
    stop_dev
    run_prisma
    NEEDS_RESTART=1
  fi

  if [ "$HASH_PKG" != "$NEW_PKG" ]; then
    HASH_PKG="$NEW_PKG"
    stop_dev
    run_install
    NEEDS_RESTART=1
  fi

  if [ "$HASH_ENV" != "$NEW_ENV" ]; then
    HASH_ENV="$NEW_ENV"
    echo ""
    echo "⚙️  .env เปลี่ยน — restarting..."
    stop_dev
    NEEDS_RESTART=1
  fi

  if [ "$NEEDS_RESTART" = "1" ]; then
    echo ""
    echo "🔄 Restarting dev servers..."
    start_dev
  fi
done
