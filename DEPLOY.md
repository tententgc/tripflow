# TripFlow Deployment Guide

## Architecture

```
                    Vercel (Singapore sin1)
                    ┌──────────────────────┐
 Users ──────────── │  app.tripflow.app    │ ── Web (Traveler PWA)
                    │  admin.tripflow.app  │ ── Admin Portal
                    └──────────┬───────────┘
                               │
                    Supabase (Singapore ap-southeast-1)
                    ┌──────────┴───────────┐
                    │  PostgreSQL Database  │
                    │  Auth (Google OAuth)  │
                    │  Storage (Files)      │
                    └──────────────────────┘
```

## Prerequisites

- GitHub account (code is already pushed)
- Vercel account (free tier works for start)
- Supabase account (free tier: 500MB DB, 1GB storage)
- Domain names (optional): `app.tripflow.app`, `admin.tripflow.app`

---

## Step 1: Setup Supabase

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Choose **Singapore (ap-southeast-1)** region for lowest latency to Thailand
3. Save your database password
4. After project is created, go to **Settings > API** and copy:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY`
5. Go to **Settings > Database** and copy:
   - `Connection string (URI)` → `DATABASE_URL`
   - Add `?connection_limit=20&pool_timeout=30` at the end

### Enable Google OAuth
1. Go to **Authentication > Providers > Google**
2. Enable it and add your Google OAuth credentials
3. Set redirect URL: `https://app.tripflow.app/auth/callback`

### Create Storage Bucket
1. Go to **Storage** and create a bucket named `uploads`
2. Set it to **Public** (or configure RLS policies)

---

## Step 2: Run Database Migration

```bash
# From project root
cp .env.example .env

# Edit .env with your Supabase credentials
# Then run:
npm run db:generate
npm run db:push

# Seed initial data (creates admin user + operator)
npm run db:seed
```

---

## Step 3: Deploy Web App to Vercel

1. Go to [vercel.com](https://vercel.com) and click **Add New Project**
2. Import your GitHub repository
3. Configure:
   - **Framework Preset**: Next.js
   - **Root Directory**: `apps/web`
   - **Build Command**: `cd ../.. && npx turbo run build --filter=@tripflow/web`
   - **Install Command**: `cd ../.. && npm ci`
   - **Output Directory**: `.next`

4. Add **Environment Variables** (all from .env.example):

**Required (minimum to run):**
```
DATABASE_URL=postgresql://...?connection_limit=20&pool_timeout=30
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
NEXT_PUBLIC_APP_URL=https://app.tripflow.app
NEXT_PUBLIC_ADMIN_URL=https://admin.tripflow.app
NODE_ENV=production
```

**Optional (enable features as needed):**
```
ANTHROPIC_API_KEY=          # AI Chat (global tours)
DASHSCOPE_API_KEY=          # AI Chat (China tours)
OPENWEATHER_API_KEY=        # Weather
EXCHANGE_RATE_API_KEY=      # Currency conversion
NEXT_PUBLIC_MAPBOX_TOKEN=   # Maps (global)
NEXT_PUBLIC_AMAP_JS_KEY=    # Maps (China)
RESEND_API_KEY=             # Email
```

5. Click **Deploy**
6. After deploy, add custom domain: `app.tripflow.app`

---

## Step 4: Deploy Admin App to Vercel

1. Create another Vercel project (same repo, different root)
2. Configure:
   - **Root Directory**: `apps/admin`
   - **Build Command**: `cd ../.. && npx turbo run build --filter=@tripflow/admin`
   - **Install Command**: `cd ../.. && npm ci`
   - **Output Directory**: `.next`

3. Add the **same environment variables** as web app
4. Click **Deploy**
5. Add custom domain: `admin.tripflow.app`

---

## Step 5: Configure Domains

### On Vercel:
- Web project: Settings > Domains > Add `app.tripflow.app`
- Admin project: Settings > Domains > Add `admin.tripflow.app`

### On Supabase:
- Go to Authentication > URL Configuration
- Set Site URL: `https://app.tripflow.app`
- Add Redirect URLs:
  - `https://app.tripflow.app/auth/callback`
  - `https://admin.tripflow.app/auth/callback`

---

## Step 6: Post-Deploy Verification

```bash
# Check web app
curl -I https://app.tripflow.app

# Check admin
curl -I https://admin.tripflow.app

# Check API
curl https://app.tripflow.app/api/tours
```

---

## Environment Variables Reference

| Variable | Required | Used By | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | Yes | Both | Supabase PostgreSQL connection string |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Both | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Both | Supabase public API key |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Both | Supabase admin key (server only) |
| `NEXT_PUBLIC_APP_URL` | Yes | Both | Web app URL |
| `NEXT_PUBLIC_ADMIN_URL` | Yes | Both | Admin URL |
| `ANTHROPIC_API_KEY` | No | Web | Claude AI for non-China tours |
| `DASHSCOPE_API_KEY` | No | Web | Qwen AI for China tours |
| `OPENWEATHER_API_KEY` | No | Web | Weather data |
| `EXCHANGE_RATE_API_KEY` | No | Web | Currency rates |
| `NEXT_PUBLIC_MAPBOX_TOKEN` | No | Web | Maps (non-China) |
| `NEXT_PUBLIC_AMAP_JS_KEY` | No | Web | Maps (China) |
| `RESEND_API_KEY` | No | Both | Email sending |

---

## CI/CD (Automatic)

GitHub Actions runs on every push to `main`:
1. Type Check
2. Lint
3. Build

Vercel auto-deploys on push to `main` (if connected).

---

## Troubleshooting

### Build fails with Prisma error
```bash
# Make sure db:generate runs before build
npx prisma generate --schema=packages/database/prisma/schema.prisma
```

### Database connection timeout
- Add `?connection_limit=20&pool_timeout=30` to DATABASE_URL
- Use Supabase connection pooler (Settings > Database > Connection pooling)

### Slow in Singapore region
- Verify Vercel region is `sin1` (check vercel.json)
- Verify Supabase is `ap-southeast-1`

### Google OAuth not working
- Check redirect URLs in Supabase Auth settings
- Make sure domain is added to Google OAuth consent screen
