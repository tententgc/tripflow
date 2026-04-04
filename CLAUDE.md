# CLAUDE.md — TripFlow

## What is TripFlow?

Tour management platform for **Thai tour operators** serving **Thai travelers** on group trips worldwide. Operators build trips in advance (admin portal). Travelers use the PWA during the trip.

**Core constraint**: ~60% of tours go to mainland China where Google/Firebase/Anthropic are blocked. The app must work without VPN inside China.

## Monorepo Structure

```
tripflow/                          # Turborepo + npm workspaces
├── apps/
│   ├── web/                       # Traveler PWA (Next.js 16, port 3000)
│   ├── admin/                     # Operator portal (Next.js 16, port 3001)
│   └── superadmin/                # Platform admin (Next.js 16, port 3002) — placeholder only
├── packages/
│   ├── database/                  # Prisma schema + client + seed + activity log
│   ├── types/                     # Re-exports Prisma types + custom interfaces
│   ├── adapters/                  # Region-aware service adapters (AI, maps, weather, etc.)
│   └── utils/                     # Coordinates, currency, dates, countries, China defaults
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router, Server Components) |
| Styling | Tailwind CSS 3.4 + Radix UI primitives |
| State | Zustand + TanStack Query v5 + SWR |
| Database | PostgreSQL via Supabase (Singapore `ap-southeast-1`) |
| ORM | Prisma 5.13 |
| Auth | Supabase Auth (email + Google OAuth) |
| Realtime | Socket.io |
| Icons | Lucide React |
| Dates | date-fns + date-fns-tz (Thai locale, Buddhist Era) |
| Currency | dinero.js (THB base) |
| PWA/Offline | Workbox |
| Email | Resend (admin only) |
| Monorepo | Turborepo |
| TypeScript | Strict mode, ES2022 target |

## Destination-Aware Services

Tours have `isChina` flag. All traveler-facing services switch based on this:

| Service | Global | China (CN) |
|---------|--------|-----------|
| Maps | Mapbox GL JS | Amap (高德地图) JS API v2 |
| AI Chat | Claude (Anthropic) + GPT-4o-mini | Qwen (Alibaba DashScope) |
| Weather | OpenWeatherMap | Caiyun (彩云天气) |
| Push | Firebase FCM | JPush (极光推送) |
| Flights | AviationStack | VariFlight (航班管家) for CN airlines |
| Storage/CDN | Cloudflare R2 + Workers proxy (works in both) |
| SMS | Aliyun SMS (Thai +66 numbers, works in both) |
| Translation | DeepL (admin side only, operator is in Thailand) |

Region detection: `getTourRegion(countries[])` in `packages/utils/src/destination.ts`

## Coordinate System

- **DB storage**: Always WGS-84 (standard GPS)
- **Amap display**: Must convert to GCJ-02 (China's "Mars Coordinates") — ~500m offset without conversion
- Conversion functions in `packages/utils/src/coordinates.ts`: `wgs84ToGcj02()`, `gcj02ToWgs84()`

## Apps Detail

### apps/web (Traveler PWA)

**Routes:**
- `/` — Landing
- `/login` — Google OAuth login
- `/home` — Tour list dashboard
- `/profile` — User profile
- `/tour/[id]/today` — Today's activities, weather, meals, flight status
- `/tour/[id]/itinerary` — Day list overview
- `/tour/[id]/day/[n]` — Single day detail (timeline, transport, accommodation)
- `/tour/[id]/chat` — AI assistant (Claude/Qwen based on destination)
- `/tour/[id]/checklist` — Checklists with real-time sync
- `/tour/[id]/documents` — Tickets, visas, QR codes (offline)
- `/tour/[id]/emergency` — Emergency numbers, embassy contacts
- `/tour/[id]/phrases` — Thai-Chinese phrasebook (China tours only)
- `/tour/[id]/split` — Expense splitting
- `/tour/[id]/fund` — Group fund (กองกลาง)
- `/tour/[id]/calculator` — Expense calculator

**API routes:** auth, tours CRUD, chat, weather, currency, flights, maps search, documents, checklist, splits, fund management, upload, announcements

**Layout components:** TopBar, BottomNav, PageTransition

**Libraries:** `lib/supabase/client.ts`, `lib/supabase/server.ts`, `lib/auth.ts`, `lib/cache.ts`, `lib/swr.ts`

### apps/admin (Operator Portal)

**Routes:**
- `/login` — Admin login
- `/dashboard` — Active tours overview
- `/tours` — Tour list
- `/tours/new` — Tour creation wizard (NewTourForm)
- `/tours/[id]` — Tour detail with tabbed interface (TourTabs)
  - Sub-managers: TourInfoEditor, CoverImageEditor, AnnouncementsManager, ChecklistsManager, ContactsManager, DocumentsManager, FlightsManager, HotelsManager
- `/tours/[id]/itinerary` — ItineraryBuilder (days, activities, transport, accommodation)
- `/tours/[id]/members` — Member management
- `/travelers` — All travelers list
- `/settings` — Operator settings + StaffManager
- `/notifications` — Notification management

**API routes:** 34 endpoints covering full CRUD for tours, days, activities, accommodation, flights, hotels, checklists, contacts, documents, announcements, members, travelers, settings, activity log, upload

**Components:** AdminSidebar + 17 page-specific client components

### apps/superadmin

Placeholder only — single page with title "TripFlow Super Admin".

## Packages Detail

### packages/database

- `prisma/schema.prisma` — 693 lines, 27 models, 21 enums
- Key models: Operator, User, Tour, TourDay, Activity, Transport, FlightInfo, Accommodation, UsefulPhrase, Checklist, Expense, GroupFund, ImportantContact, EmergencyInfo, TourDocument, Notification, ChatMessage, TourAnnouncement, ActivityLog
- `src/activity-log.ts` — `logActivity()` for audit trail
- `prisma/seed.ts` — Dev seed data

### packages/adapters

8 adapter modules with factory pattern, each selects implementation by `TourRegion`:
- `ai.ts` — Claude + GPT-4o-mini (Global) / Qwen via DashScope (China)
- `maps.ts` — Mapbox (Global) / Amap (China)
- `weather.ts` — OpenWeatherMap (Global) / Caiyun (China)
- `flights.ts` — AviationStack (Global) / VariFlight (CN airlines, auto-detect by IATA)
- `push.ts` — FCM (Global) / JPush (China)
- `storage.ts` — Cloudflare R2 + Workers proxy
- `translate.ts` — DeepL
- `sms.ts` — Aliyun SMS

### packages/types

Re-exports all 24 Prisma types/enums + custom interfaces: TourRegion, LatLng, MapOptions, POIResult, WeatherForecast, FlightStatus, Message, ExchangeRate, etc.

### packages/utils

- `coordinates.ts` — WGS-84 ↔ GCJ-02 conversion
- `destination.ts` — `getTourRegion()`, `isChinaTour()`, `isChineseAirline()` (21 CN carriers)
- `currency.ts` — `formatCurrency()`, `formatWithTHB()` (always show THB equivalent)
- `countries.ts` — 16 countries with Thai names, emergency numbers, Thai embassy contacts
- `thai-dates.ts` — Thai locale formatting, Buddhist Era, `getTripCountdown()`
- `timezone.ts` — Multi-timezone helpers
- `china-defaults.ts` — 43 pre-translated Thai-Chinese phrases, payment warning, China checklist items

## Engineering Rules

1. **China test required** — traveler features must work without Google/Firebase/Anthropic
2. **WGS-84 in DB always** — convert to GCJ-02 at Amap render time only
3. **Thai first** — all UI strings start in Thai, English is secondary
4. **THB as base** — always show local currency + THB equivalent (e.g. "¥ 180 (≈ ฿ 900)")
5. **Offline must work** — itinerary, checklist, emergency contacts, phrases fully accessible offline
6. **TypeScript strict** — zero `any`
7. **44px touch targets** — WCAG minimum
8. **Noto Sans Thai** — primary font
9. **Meal badges on every day** — Thai travelers check meals first
10. **Guide contact always visible** — LINE (non-China) / WeChat (China)
11. **Supabase Singapore region** — lowest latency for Thai users

## Commands

```bash
npm run dev          # Start all apps (Turborepo)
npm run build        # Build all
npm run db:generate  # Prisma generate
npm run db:migrate   # Run migrations
npm run db:push      # Push schema to DB
npm run db:seed      # Seed dev data
npm run start:all    # bash start.sh
```

## Dev Ports

- web: 3000
- admin: 3001
- superadmin: 3002

## Design Context

**Brand**: Premium, Elegant, Polished — like a luxury travel concierge, not a budget tool.

**Emotional Goals**: Confident & calm, excited & delighted, safe & supported, empowered & independent.

**References**: Apple Maps (clean hierarchy), Airbnb (warm cards), Grab/LINE (mobile-first density).

**Anti-references**: Cluttered travel agencies, corporate dashboards, overly playful/cartoon, dark/techy.

**Design Principles**:
1. **Calm Confidence** — No visual noise. Information hierarchy does the heavy lifting.
2. **Warm Premium** — Soft shadows, warm neutrals (`#faf8f5`, `#2c1810`), generous whitespace.
3. **Glanceable First** — Key info scannable in 3 seconds. Icons, color coding, spatial hierarchy.
4. **Touch-Friendly Always** — 44px min targets, generous spacing, forgiving hit areas.
5. **Photography Forward** — Let destination images breathe with proper aspect ratios.

**Key Tokens**: Background `#faf8f5`, text `#2c1810`, accent `#f97316`, glass `rgba(255,255,255,0.78) + blur(28px)`, card radius 18-22px, fonts Inter + Noto Sans Thai.

See `.impeccable.md` for full design tokens, typography scale, and component patterns.
