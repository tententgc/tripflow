# TripFlow

> Thai Tour Group Management Platform - แพลตฟอร์มบริหารทัวร์กลุ่มสำหรับนักเดินทางชาวไทย

A full-stack tour management platform built for **Thai tour operators** serving **Thai travelers** on group trips worldwide, with special support for **China destinations** where Western services are blocked.

## Overview

TripFlow solves the unique challenge of Thai tour groups traveling to mainland China, where Google Maps, Firebase, and most Western services don't work. The platform automatically switches to China-accessible alternatives (Amap, Qwen AI, JPush) based on tour destination.

### The Problem

- **60% of Thai tours go to mainland China**
- Inside China: Google Maps, Firebase, Anthropic, most Western APIs are **blocked**
- Thai travelers need the app to work **without VPN** on any phone, any SIM
- The other 40% go to Japan, Korea, Europe — full global stack works fine

### The Solution

```
┌─────────────────────────────────────────────┐
│  Thai Operator (in Thailand)                │
│  Uses: Any service (not blocked)            │
│  - Google Places, Mapbox, Claude, Firebase  │
└─────────────────┬───────────────────────────┘
                  │ Creates tour + publishes
                  ▼
┌─────────────────────────────────────────────┐
│  Thai Traveler (phone in China)             │
│  Auto-switches to China-accessible only     │
│  - Amap 高德地图   (replaces Google Maps)    │
│  - Qwen 通义千问   (replaces Claude)         │
│  - JPush 极光推送  (replaces Firebase)       │
│  - Caiyun 彩云天气  (replaces OpenWeather)   │
└─────────────────────────────────────────────┘
```

## Key Features

### Admin Portal

| Feature | Description |
|---------|-------------|
| **Tour Management** | Create tours with itinerary builder, flights, accommodation, contacts |
| **Flight Lookup** | Auto-fill flight data from AviationStack API |
| **Document System** | Group docs + per-member tickets (PDF/image upload) |
| **Checklist Builder** | Preparation checklists visible to travelers |
| **Member Management** | Add travelers, track passports, assign to tours |
| **Activity Log** | Full audit trail — who did what, where, when |
| **Multi-Admin** | Add admin staff by email with role-based access |
| **Status Control** | Draft → Published → Active → Completed flow |

### Traveler PWA

| Feature | Description |
|---------|-------------|
| **Pre-Trip** | Animated countdown, preparation checklist, flight cards |
| **Itinerary** | Daily schedule with activities, meals, accommodation |
| **Documents** | PDF viewer, personal ticket upload, QR codes |
| **Expenses** | Multi-currency splitting, group fund, settlement |
| **Contacts** | Guide phone/LINE/WeChat with one-tap actions |
| **Offline** | Core features work without internet (critical in China) |

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | Next.js 14 (App Router) |
| **Language** | TypeScript (strict mode) |
| **Styling** | Tailwind CSS |
| **Database** | PostgreSQL via Supabase (Singapore `ap-southeast-1`) |
| **ORM** | Prisma |
| **Auth** | Supabase Auth (Email + Google OAuth) |
| **Storage** | Supabase Storage + Cloudflare R2 CDN |
| **Monorepo** | Turborepo + pnpm workspaces |

### Destination-Aware Service Adapters

| Service | Global | China (CN) |
|---------|--------|------------|
| Maps | Mapbox GL JS | Amap JS API v2 (高德地图) |
| AI Chat | Anthropic Claude | Alibaba Qwen (通义千问) |
| Push Notifications | Firebase FCM | JPush (极光推送) |
| Weather | OpenWeatherMap | Caiyun Weather (彩云天气) |
| Flights | AviationStack | VariFlight (航班管家) |

## Project Structure

```
tripflow/
├── apps/
│   ├── web/              # Traveler PWA (Thai UI primary)
│   │   ├── app/(app)/    # Authenticated pages (home, tour, today, etc.)
│   │   ├── components/   # Shared UI components
│   │   └── app/api/      # API routes (tours, splits, fund, documents)
│   │
│   ├── admin/            # Operator admin portal
│   │   ├── app/(protected)/  # Auth-protected pages
│   │   │   ├── dashboard/    # Stats, upcoming tours, insights
│   │   │   ├── tours/        # Tour CRUD + tabbed detail view
│   │   │   ├── travelers/    # Member management
│   │   │   ├── notifications/ # Activity log viewer
│   │   │   └── settings/     # Company info, staff, system
│   │   └── app/api/          # Admin API routes
│   │
│   └── superadmin/       # (planned)
│
├── packages/
│   ├── database/         # Prisma schema, client, activity log utility
│   ├── adapters/         # Service adapters (maps, push, AI, weather, flights)
│   ├── types/            # Shared TypeScript types
│   └── utils/            # Coordinates, currency, timezone, destination helpers
│
└── docs/
```

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm 8+
- PostgreSQL database (or Supabase account)

### Installation

```bash
# Clone
git clone <repo-url>
cd tripflow

# Install dependencies
pnpm install

# Setup environment
cp .env.example .env
# Edit .env with your keys (see Environment Variables below)

# Push database schema
DATABASE_URL="your-url" npx prisma db push --schema packages/database/prisma/schema.prisma

# Generate Prisma client
cd packages/database && npx prisma generate && cd ../..

# Seed demo data (optional)
cd packages/database && npx tsx prisma/seed.ts && cd ../..

# Start development
pnpm dev
```

### Default Ports

| App | URL |
|-----|-----|
| Traveler Web | http://localhost:3000 |
| Admin Portal | http://localhost:3001 |

### First-Time Admin Setup

1. Set `ADMIN_EMAIL=your@email.com` in `.env`
2. Run the seed script
3. Login at http://localhost:3001 with Google OAuth or email
4. Add more admins from **Settings > Team**

## Environment Variables

```env
# ── Database ──
DATABASE_URL=                          # Supabase PostgreSQL connection string

# ── Supabase ──
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# ── Maps ──
NEXT_PUBLIC_MAPBOX_TOKEN=              # Global maps
NEXT_PUBLIC_AMAP_JS_KEY=               # China maps (高德地图)

# ── AI Chat ──
ANTHROPIC_API_KEY=                     # Global tours (Claude)
DASHSCOPE_API_KEY=                     # China tours (Qwen)

# ── Flights ──
AVIATIONSTACK_API_KEY=                 # Flight data lookup

# ── Weather ──
OPENWEATHER_API_KEY=                   # Global weather
CAIYUN_WEATHER_TOKEN=                  # China weather (彩云天气)

# ── Push Notifications ──
NEXT_PUBLIC_FIREBASE_API_KEY=          # Global push
JPUSH_APP_KEY=                         # China push (极光推送)

# ── Storage CDN ──
CLOUDFLARE_R2_ACCESS_KEY=
CLOUDFLARE_R2_SECRET_KEY=

# ── Admin ──
ADMIN_EMAIL=                           # Auto-grant admin access on seed
```

See `.env.example` for the complete list.

## Architecture Highlights

### Tour Status & Visibility

```
DRAFT ──→ PUBLISHED ──→ ACTIVE ──→ COMPLETED
               ↘ CANCELLED
```

| Status | Admin | Traveler |
|--------|-------|----------|
| Draft | Visible | Hidden |
| Published | Visible | Visible |
| Active | Visible | Visible |
| Completed | Visible | Visible (dimmed) |
| Cancelled | Visible | Hidden |

### GCJ-02 Coordinate Conversion

All coordinates stored as **WGS-84** (GPS standard). Converted to **GCJ-02** (China's coordinate system) at display time for Amap only. Without this, pins appear ~500m offset in China.

### Activity Logging

Every mutation logs to `ActivityLog` with:
- **Who** — Admin name or user name
- **What** — Action type + Thai description
- **Where** — Tour reference (auto-fetched title)

37+ action types across tours, flights, documents, members, checklists, expenses, and more.

### Thai-First Design

- **Language**: Thai primary, English secondary
- **Font**: Noto Sans Thai
- **Currency**: THB base with foreign conversion display
- **Dates**: Thai locale with Buddhist Era option
- **Meals**: Breakfast/Lunch/Dinner badges on every day (Thai tour essential)
- **Contact**: LINE for Thai guides, WeChat for China, WhatsApp for others

## Scripts

```bash
pnpm dev              # Run all apps in development
pnpm build            # Build all apps for production
pnpm lint             # Lint all packages
```

## Database

```bash
# Push schema changes
DATABASE_URL="..." npx prisma db push --schema packages/database/prisma/schema.prisma

# Regenerate client
cd packages/database && npx prisma generate

# Seed demo data
cd packages/database && npx tsx prisma/seed.ts

# Open Prisma Studio
DATABASE_URL="..." npx prisma studio --schema packages/database/prisma/schema.prisma
```

## Demo Data

The seed script creates:
- **China Tour**: Beijing-Great Wall 6D5N with flights, hotels, activities, phrases
- **Japan Tour**: Tokyo-Fuji-Kyoto-Osaka 7D5N with JR Pass, USJ tickets, and more
- **14 documents** per tour (flight tickets, hotel vouchers, visas, QR codes)
- **Preparation checklists** per destination
- **Emergency contacts** and useful phrases

## License

Private - All rights reserved.

---

Built with Next.js, Tailwind CSS, Prisma, and Supabase.
