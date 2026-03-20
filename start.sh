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

# ── Start ────────────────────────────────────────────────
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Ready! Starting all services..."
echo ""
echo "  🌐 Web (Traveler):  http://localhost:3000"
echo "  🛠️  Admin:          http://localhost:3001"
echo "  👑 Superadmin:      http://localhost:3002"
echo ""
echo "  Press Ctrl+C to stop"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

npm run dev
