# CLAUDE.md — TripFlow: Thai Tour Group Platform (Global + China-Ready)

## Project Overview

**TripFlow** is a tour management platform built for **Thai tour operators** serving **Thai travelers** going on group trips worldwide. The platform is used and configured by the operator BEFORE the trip. Travelers use the mobile app DURING the trip in whatever country they are visiting.

### The Core Challenge
- **60% of tours go to mainland China**
- When a Thai traveler is physically inside China, their phone cannot access Google Maps, Firebase, Anthropic, or most Western services — even if they are Thai users on a Thai SIM
- The app must work **without a VPN** on any phone, any SIM, while standing in Beijing, Shanghai, or Chengdu
- The other 40% of tours go to Japan, Korea, Europe, Southeast Asia, etc. — full global stack works fine

### Design Philosophy
- **Language**: Thai UI primary, English secondary (travelers are Thai)
- **Operator**: Thai tour company admin builds the trip in advance
- **Traveler**: Opens app on their phone, everything is pre-loaded and works offline
- **China trips**: All map, weather, AI, notification services switch to China-accessible APIs automatically when the tour destination is China
- **Zero VPN required**: Traveler should never need to configure anything

---

## The "Works in China" Rule

Any feature used by a traveler while on a China tour MUST use a China-accessible service.
Any feature used by the operator in Thailand to BUILD the tour can use any service (operator is not in China).

```
┌─────────────────────────────────────────────┐
│  Thai Operator (in Thailand)                │
│  Uses: Any service (not in China)           │
│  - Google Places to search China POIs ✓    │
│  - Mapbox to preview routes ✓              │
│  - DeepL to translate content ✓            │
│  - Anthropic to draft descriptions ✓       │
└─────────────────┬───────────────────────────┘
                  │ Creates tour + publishes
                  ▼
┌─────────────────────────────────────────────┐
│  Thai Traveler (phone in China)             │
│  MUST use China-accessible services only   │
│  - Amap for maps ✓ (Google Maps blocked)  │
│  - Caiyun for weather ✓ (OpenWeather slow)│
│  - Qwen for AI chat ✓ (Claude blocked)    │
│  - JPush for notifications ✓ (FCM blocked)│
│  - Offline cache for everything else ✓    │
└─────────────────────────────────────────────┘
```

---

## Tech Stack

### Frontend (Traveler PWA)
- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS + shadcn/ui
- **State**: Zustand + TanStack Query v5
- **i18n**: next-intl — Thai (primary), English, Chinese (helpful for travelers in China)
- **Dates**: date-fns-tz (all timezones, crucial for multi-country trips)
- **Currency**: dinero.js (THB base, convert to destination currency)
- **Icons**: Lucide React
- **Offline**: Workbox Service Worker (critical — travelers lose signal in China subway/rural)

### Maps — Destination-Aware
- 🇨🇳 **China destinations**: Amap JS API v2 (高德地图) — only map that works reliably in China
- 🌍 **All other destinations**: Mapbox GL JS
- The app detects tour destination country and loads the correct map library automatically
- Coordinates stored as WGS-84 in DB, converted to GCJ-02 for Amap display

### Push Notifications — Destination-Aware
- 🇨🇳 **Traveler on China tour**: JPush (极光推送) — Firebase is blocked in China
- 🌍 **Traveler on other tours**: Firebase Cloud Messaging (FCM)
- Both registered at app install; which one delivers depends on tour destination

### Backend
- **Runtime**: Node.js + Next.js API Routes
- **Database**: PostgreSQL via Supabase (operator is in Thailand, always accessible)
- **ORM**: Prisma
- **Auth**: Supabase Auth (email + Google OAuth) — operators and travelers register from Thailand
- **File Storage**: Supabase Storage with Cloudflare CDN proxy
  - Note: Supabase direct URLs may be slow in China → images proxied through Cloudflare Workers with edge caching
- **Realtime**: Socket.io self-hosted (more reliable in China than Supabase Realtime)

### AI Chat — Destination-Aware
- 🇨🇳 **China tours**: Alibaba Qwen API (通义千问) — accessible inside China, good Chinese language
- 🌍 **Other tours**: Anthropic Claude API (claude-sonnet-4-20250514)
- System prompt always in Thai — both AIs respond in Thai

### Weather — Destination-Aware
- 🇨🇳 **China cities**: Caiyun Weather (彩云天气) — best coverage for Chinese cities, accessible in CN
- 🌍 **All other cities**: OpenWeatherMap

### Flight Data
- **Global**: AviationStack API — covers all airlines including Thai Airways, Bangkok Airways
- **China domestic**: VariFlight API (航班管家) — better data for Air China, China Southern, China Eastern
- Auto-select based on flight's operating airline IATA code

### Translation (Operator side only — used in Thailand)
- DeepL API — operator translates tour content to Thai/EN/ZH

### POI Search (Operator side only — used in Thailand)
- Google Places API — operator searches for POIs when building China tour
- Results stored in DB with WGS-84 coords, served to traveler via Amap display

### SMS
- **Thai numbers**: Alibaba Cloud SMS or DTAC/AIS SMS gateway — for Thai +66 numbers
- Flight alerts sent as SMS backup when push notification may not deliver

### Email
- Resend — for registration, booking confirmation (operator in Thailand)

### CDN Strategy for China
- Supabase Storage → Cloudflare R2 + Cloudflare Workers proxy
- Cloudflare has good connectivity into China (not perfect but much better than AWS/Vercel direct)
- Critical images (maps, hotel photos) pre-cached in Service Worker before trip departs

### DevOps
- **Hosting**: Vercel (global edge) — served from Singapore edge for Thai users
- **Database**: Supabase (Singapore region `ap-southeast-1`) — fast for Thailand
- **CI/CD**: GitHub Actions
- **Monitoring**: Sentry

---

## Destination-Aware Service Selection

The tour has a `primaryCountry` field. All traveler-facing services check this field:

```typescript
// packages/utils/destination.ts

export type TourRegion = 'CHINA' | 'GLOBAL'

export function getTourRegion(countries: string[]): TourRegion {
  // If any destination is mainland China, use China-compatible services
  const chinaDestinations = ['CN'] // ISO2 code for mainland China
  // Note: HK, MO, TW use different rules (HK/MO can access some global services)
  return countries.some(c => chinaDestinations.includes(c)) ? 'CHINA' : 'GLOBAL'
}

// Usage in every service adapter:
const region = getTourRegion(tour.countries)
const weather = await weatherAdapter.get(lat, lon, region)
const aiResponse = await aiAdapter.chat(messages, systemPrompt, region)
```

---

## Service Adapter Pattern

```typescript
// packages/adapters/index.ts

// ── MAPS ──────────────────────────────────────────────────────
export interface MapsAdapter {
  renderMap(container: HTMLElement, center: LatLng, options: MapOptions): MapInstance
  searchNearby(keyword: string, lat: number, lon: number, region: TourRegion): Promise<POIResult[]>
}
// China: AmapAdapter (高德地图)
// Global: MapboxAdapter

// ── PUSH ──────────────────────────────────────────────────────
export interface PushAdapter {
  registerDevice(region: TourRegion): Promise<{ fcmToken?: string; jpushId?: string }>
  send(userId: string, title: string, body: string, region: TourRegion): Promise<void>
}
// China: JPushAdapter
// Global: FCMAdapter

// ── AI CHAT ───────────────────────────────────────────────────
export interface AIAdapter {
  streamChat(messages: Message[], systemPrompt: string, region: TourRegion): Promise<ReadableStream>
}
// China: QwenAdapter (Alibaba Qwen / DashScope)
// Global: ClaudeAdapter (Anthropic)

// ── WEATHER ───────────────────────────────────────────────────
export interface WeatherAdapter {
  getForecast(lat: number, lon: number, region: TourRegion): Promise<WeatherForecast>
}
// China: CaiyunAdapter (彩云天气)
// Global: OpenWeatherAdapter

// ── FLIGHTS ───────────────────────────────────────────────────
export interface FlightAdapter {
  getStatus(flightNo: string, date: string): Promise<FlightStatus>
}
// China airlines (MU/CA/CZ/3U etc): VariFlightAdapter
// Other airlines: AviationStackAdapter
// Auto-select by airline IATA prefix
```

---

## GCJ-02 Coordinate Conversion (Critical for China Maps)

All coordinates stored in DB as **WGS-84** (standard GPS).
When displaying on Amap (China), must convert to **GCJ-02** (China's "Mars Coordinates").
Without this, pins appear ~500m offset from real location.

```typescript
// packages/utils/coordinates.ts

export function isMainlandChina(lat: number, lon: number): boolean {
  return lon > 73.66 && lon < 135.05 && lat > 3.86 && lat < 53.55
}

// Convert WGS-84 (GPS) → GCJ-02 (Amap/China)
// Use before: placing pins on Amap, passing coords to Amap routing
export function wgs84ToGcj02(lat: number, lon: number): [number, number] {
  if (!isMainlandChina(lat, lon)) return [lat, lon]
  // ... standard conversion math
}

// Convert GCJ-02 → WGS-84
// Use after: receiving coords FROM Amap search → store in DB
export function gcj02ToWgs84(lat: number, lon: number): [number, number] {
  // ... reverse conversion
}

// Rule: ALWAYS store WGS-84 in DB. Convert at display time only.
```

---

## Database Schema (Prisma)

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL") // Supabase Singapore region
}

// ── OPERATORS (Tour Companies) ────────────────────────────────

model Operator {
  id            String   @id @default(cuid())
  name          String                           // "บริษัท ทัวร์ไทย จำกัด"
  nameEn        String?
  logoUrl       String?
  primaryColor  String   @default("#2563EB")
  phone         String?
  email         String
  lineId        String?                          // LINE OA for Thai operators
  website       String?
  plan          PlanTier @default(STARTER)
  isActive      Boolean  @default(true)
  createdAt     DateTime @default(now())

  tours         Tour[]
  staff         OperatorStaff[]
}

model OperatorStaff {
  id         String       @id @default(cuid())
  operatorId String
  userId     String
  role       StaffRole    @default(STAFF)
  operator   Operator @relation(fields: [operatorId], references: [id])
  user       User     @relation(fields: [userId], references: [id])
  @@unique([operatorId, userId])
}

// ── USERS ─────────────────────────────────────────────────────

model User {
  id              String   @id @default(cuid())
  email           String   @unique
  name            String                           // Thai name: "สมชาย ใจดี"
  nameEn          String?                          // Passport name
  phone           String?                          // Thai: +66-8X-XXX-XXXX
  avatarUrl       String?
  nationality     String   @default("TH")
  passportNo      String?                          // Encrypted AES-256
  passportExpiry  DateTime?
  locale          String   @default("th")          // th | en
  timezone        String   @default("Asia/Bangkok")
  // Push tokens — register both, use based on destination
  fcmToken        String?                          // Firebase (non-China)
  jpushId         String?                          // JPush (China)
  systemRole      SystemRole @default(TRAVELER)
  createdAt       DateTime @default(now())

  tourMembers     TourMember[]
  staffRoles      OperatorStaff[]
  expensesPaid    Expense[]
  expenseShares   ExpenseParticipant[]
  notifications   Notification[]
  checklistChecks ChecklistCheck[]
}

// ── TOURS ─────────────────────────────────────────────────────

model Tour {
  id              String     @id @default(cuid())
  operatorId      String
  title           String                           // "ทัวร์จีน ปักกิ่ง-กำแพงเมืองจีน 6 วัน"
  titleEn         String?
  description     String?
  coverImageUrl   String?
  countries       String[]                         // ["CN"] or ["JP","KR"] or ["FR","IT","CH"]
  primaryCountry  String                           // Main destination ISO2
  cities          String[]                         // ["Beijing","Shanghai"]
  startDate       DateTime
  endDate         DateTime
  timezone        String                           // Main timezone e.g. "Asia/Shanghai"
  status          TourStatus @default(DRAFT)
  maxMembers      Int?
  currency        String     @default("THB")       // Base currency always THB
  destCurrency    String?                          // Destination currency e.g. "CNY","JPY"
  isChina         Boolean    @default(false)       // Pre-computed: any(countries) == 'CN'
  tourCode        String?    @unique               // Short code e.g. "CN2026-04"
  createdAt       DateTime   @default(now())
  updatedAt       DateTime   @updatedAt

  operator        Operator   @relation(fields: [operatorId], references: [id])
  members         TourMember[]
  days            TourDay[]
  flights         FlightInfo[]
  contacts        ImportantContact[]
  checklists      Checklist[]
  expenses        Expense[]
  notifications   Notification[]
  documents       TourDocument[]
  emergencyInfo   EmergencyInfo?
  chatMessages    ChatMessage[]
  usefulPhrases   UsefulPhrase[]                   // Thai→destination language phrases
}

model TourMember {
  id        String     @id @default(cuid())
  tourId    String
  userId    String
  role      MemberRole @default(MEMBER)
  seatNo    String?                                // Flight seat
  roomNo    String?                                // Hotel room
  bedType   String?                                // "เตียงคู่" / "เตียงเดี่ยว"
  notes     String?                                // Special requests
  joinedAt  DateTime   @default(now())

  tour      Tour @relation(fields: [tourId], references: [id])
  user      User @relation(fields: [userId], references: [id])
  @@unique([tourId, userId])
}

// ── ITINERARY ─────────────────────────────────────────────────

model TourDay {
  id             String   @id @default(cuid())
  tourId         String
  dayNumber      Int
  date           DateTime
  title          String                             // "วันที่ 3 — กำแพงเมืองจีน"
  titleEn        String?
  summary        String?
  summaryEn      String?
  country        String?                            // ISO2 per day (tour may cross borders)
  city           String?
  timezone       String?                            // Per-day timezone
  isChina        Boolean  @default(false)           // Is this day in mainland China?
  passType       String?                            // "Beijing Subway Card", "JR Pass"
  passColor      String?
  weatherLat     Float?
  weatherLon     Float?
  mealBreakfast  Boolean  @default(false)
  mealLunch      Boolean  @default(false)
  mealDinner     Boolean  @default(false)

  tour           Tour @relation(fields: [tourId], references: [id])
  activities     Activity[]
  transports     Transport[]
  accommodation  Accommodation?
  dayItems       DayChecklistItem[]
}

model Activity {
  id             String           @id @default(cuid())
  tourDayId      String
  order          Int              @default(0)
  time           String?                            // "09:00"
  title          String                             // Thai: "พระราชวังต้องห้าม"
  titleEn        String?                            // "Forbidden City"
  titleLocal     String?                            // Local: "故宫"
  description    String?
  descriptionEn  String?
  locationName   String?
  address        String?
  addressLocal   String?                            // Chinese address: "北京市东城区景山前街4号"
  country        String?
  city           String?
  latitude       Float?                             // WGS-84 always
  longitude      Float?                             // WGS-84 always
  googlePlaceId  String?
  category       ActivityCategory
  durationMins   Int?
  cost           Float?
  costCurrency   String?
  costTHB        Float?                             // Pre-converted estimate
  tips           String?                            // Thai tips: "ต้องจองล่วงหน้าออนไลน์"
  tipsEn         String?
  entryType      String?                            // "Free" / "Paid" / "Pre-book required"

  tourDay        TourDay @relation(fields: [tourDayId], references: [id])
}

model Transport {
  id             String        @id @default(cuid())
  tourDayId      String
  order          Int           @default(0)
  type           TransportType
  from           String                             // "ปักกิ่ง สถานีรถไฟ"
  fromEn         String?                            // "Beijing Railway Station"
  fromLocal      String?                            // "北京站"
  fromCode       String?                            // Station/airport code
  to             String
  toEn           String?
  toLocal        String?
  toCode         String?
  departTime     String?
  arriveTime     String?
  duration       String?                            // "2h 30m"
  lineName       String?                            // "รถไฟความเร็วสูง G1"
  lineNameLocal  String?                            // "高铁G1"
  lineColor      String?
  flightNo       String?
  airline        String?
  terminal       String?
  platform       String?
  passRequired   String?
  cost           Float?
  costCurrency   String?
  costTHB        Float?
  notes          String?
  notesEn        String?

  tourDay        TourDay @relation(fields: [tourDayId], references: [id])
}

model FlightInfo {
  id              String   @id @default(cuid())
  tourId          String
  flightNo        String                             // "TG614"
  airline         String                             // "Thai Airways"
  airlineIata     String?                            // "TG"
  fromAirport     String                             // "Suvarnabhumi"
  fromIata        String                             // "BKK"
  toAirport       String
  toIata          String
  departAt        DateTime
  arriveAt        DateTime
  departTz        String                             // "Asia/Bangkok"
  arriveTz        String                             // "Asia/Shanghai"
  terminal        String?
  gate            String?
  isConnection    Boolean  @default(false)
  connectionMinutes Int?

  tour            Tour @relation(fields: [tourId], references: [id])
}

model Accommodation {
  id              String   @id @default(cuid())
  tourDayId       String   @unique
  name            String                             // "Holiday Inn Beijing"
  nameLocal       String?                            // "北京假日酒店"
  address         String?
  addressLocal    String?                            // Full Chinese address
  country         String?
  city            String?
  latitude        Float?                             // WGS-84
  longitude       Float?                             // WGS-84
  phone           String?
  phoneLocal      String?                            // Local format: 010-XXXX-XXXX
  checkIn         String?                            // "15:00"
  checkOut        String?                            // "12:00"
  checkInDate     DateTime?
  checkOutDate    DateTime?
  confirmationNo  String?
  pin             String?
  roomType        String?                            // "Superior Double"
  roomTypeLocal   String?                            // "高级双床间"
  price           Float?
  currency        String?
  isPaid          Boolean  @default(false)
  wifiName        String?                            // Important for China travelers
  wifiPassword    String?
  breakfastInfo   String?
  notes           String?

  tourDay         TourDay @relation(fields: [tourDayId], references: [id])
}

// ── USEFUL PHRASES ────────────────────────────────────────────
// Thai travelers in China need basic Chinese phrases
// Key differentiator for China tours

model UsefulPhrase {
  id          String @id @default(cuid())
  tourId      String
  category    PhraseCategory
  thai        String                               // Thai: "ห้องน้ำอยู่ที่ไหน"
  english     String                               // "Where is the toilet?"
  local       String                               // Chinese: "厕所在哪里？"
  localPinyin String?                              // Pinyin: "Cèsuǒ zài nǎlǐ?"
  audioUrl    String?                              // TTS audio file URL
  order       Int    @default(0)

  tour        Tour @relation(fields: [tourId], references: [id])
}

// ── CHECKLISTS ────────────────────────────────────────────────

model Checklist {
  id       String        @id @default(cuid())
  tourId   String
  title    String                                   // Thai: "รายการตรวจสอบวันเดินทาง"
  titleEn  String?
  emoji    String?
  type     ChecklistType @default(GENERAL)
  order    Int           @default(0)

  tour     Tour @relation(fields: [tourId], references: [id])
  items    ChecklistItem[]
}

model ChecklistItem {
  id       String @id @default(cuid())
  checklistId String
  label    String                                   // Thai label
  labelEn  String?
  order    Int    @default(0)
  isImportant Boolean @default(false)

  checklist Checklist      @relation(fields: [checklistId], references: [id])
  checks    ChecklistCheck[]
}

model ChecklistCheck {
  id        String   @id @default(cuid())
  itemId    String
  userId    String
  checkedAt DateTime @default(now())

  item      ChecklistItem @relation(fields: [itemId], references: [id])
  user      User          @relation(fields: [userId], references: [id])
  @@unique([itemId, userId])
}

model DayChecklistItem {
  id       String @id @default(cuid())
  tourDayId String
  label    String
  labelEn  String?
  order    Int    @default(0)

  tourDay  TourDay @relation(fields: [tourDayId], references: [id])
}

// ── EXPENSES / COST SPLIT ─────────────────────────────────────

model Expense {
  id           String          @id @default(cuid())
  tourId       String
  title        String
  amount       Float
  currency     String          @default("CNY")     // Local currency
  amountTHB    Float?                               // Auto-converted to THB
  category     ExpenseCategory @default(OTHER)
  paidById     String
  receiptUrl   String?
  notes        String?
  date         DateTime        @default(now())

  tour         Tour @relation(fields: [tourId], references: [id])
  paidBy       User @relation(fields: [paidById], references: [id])
  participants ExpenseParticipant[]
}

model ExpenseParticipant {
  id        String  @id @default(cuid())
  expenseId String
  userId    String
  share     Float
  isPaid    Boolean @default(false)

  expense   Expense @relation(fields: [expenseId], references: [id])
  user      User    @relation(fields: [userId], references: [id])
  @@unique([expenseId, userId])
}

// ── CONTACTS & EMERGENCY ──────────────────────────────────────

model ImportantContact {
  id           String      @id @default(cuid())
  tourId       String
  name         String                               // "ไกด์จีน — คุณหลี่"
  nameLocal    String?                              // "李导游"
  phone        String?                              // Local number
  phoneLocal   String?                              // Formatted locally
  wechat       String?                              // WeChat ID — important for CN
  line         String?                              // LINE — Thai guides use this
  whatsapp     String?
  type         ContactType
  notes        String?

  tour         Tour @relation(fields: [tourId], references: [id])
}

model EmergencyInfo {
  id                String @id @default(cuid())
  tourId            String @unique
  // Per-country emergency numbers
  // e.g. {"CN": {"police":"110","ambulance":"120","fire":"119","tourist":"12301"}}
  emergencyNumbers  Json
  embassyContacts   Json
  // Thai Embassy contacts for destination country
  thaiEmbassyPhone  String?
  thaiEmbassyAddress String?
  insuranceCompany  String?
  insurancePolicyNo String?
  insurancePhone    String?                         // 24hr international line
  // China-specific
  chinaVisaHotline  String?                         // 12301 — China tourism hotline
  nearestHospital   String?
  notes             String?

  tour              Tour @relation(fields: [tourId], references: [id])
}

// ── DOCUMENTS ─────────────────────────────────────────────────

model TourDocument {
  id          String       @id @default(cuid())
  tourId      String
  title       String
  titleEn     String?
  type        DocumentType
  fileUrl     String?
  qrData      String?
  description String?
  isPersonal  Boolean      @default(false)
  userId      String?

  tour        Tour @relation(fields: [tourId], references: [id])
}

// ── NOTIFICATIONS ─────────────────────────────────────────────

model Notification {
  id          String           @id @default(cuid())
  tourId      String?
  userId      String
  title       String
  body        String
  type        NotificationType
  data        Json?
  isRead      Boolean          @default(false)
  scheduledAt DateTime?
  sentAt      DateTime?
  createdAt   DateTime         @default(now())

  tour        Tour? @relation(fields: [tourId], references: [id])
  user        User  @relation(fields: [userId], references: [id])
}

// ── CHAT ──────────────────────────────────────────────────────

model ChatMessage {
  id        String   @id @default(cuid())
  tourId    String
  userId    String?
  role      ChatRole
  content   String
  createdAt DateTime @default(now())

  tour      Tour @relation(fields: [tourId], references: [id])
}

// ── ENUMS ─────────────────────────────────────────────────────

enum SystemRole    { SUPER_ADMIN TRAVELER }
enum StaffRole     { OWNER MANAGER STAFF }
enum MemberRole    { LEADER MEMBER }
enum PlanTier      { STARTER PROFESSIONAL ENTERPRISE }
enum TourStatus    { DRAFT PUBLISHED ACTIVE COMPLETED CANCELLED }

enum ActivityCategory {
  SIGHTSEEING FOOD TRANSPORT ACCOMMODATION
  SHOPPING TEMPLE NATURE NIGHTLIFE PHOTOGRAPHY OTHER
}

enum TransportType {
  FLIGHT TRAIN HIGHSPEED_TRAIN SUBWAY BUS
  TAXI FERRY CABLE_CAR WALK TUKTUK OTHER
}

enum ChecklistType  { ARRIVAL DEPARTURE PACKING DAILY GENERAL }

enum ContactType {
  THAI_GUIDE    // Thai-speaking guide (important!)
  LOCAL_GUIDE   // Local (Chinese/Japanese etc.) guide
  HOTEL EMERGENCY AIRLINE BUS_OPERATOR
  RESTAURANT INSURANCE OTHER
}

enum DocumentType {
  FLIGHT_TICKET HOTEL_VOUCHER TOUR_VOUCHER VISA
  QR_CODE INSURANCE PASSPORT MAP
  VISIT_JAPAN_WEB   // Japan-specific
  CHINA_HEALTH_KIT  // China health declaration
  OTHER
}

enum ExpenseCategory {
  ACCOMMODATION FOOD TRANSPORT ACTIVITY
  SHOPPING TIPS EMERGENCY ENTRANCE_FEE OTHER
}

enum PhraseCategory {
  GREETING DIRECTIONS FOOD SHOPPING TRANSPORT
  HOTEL EMERGENCY NUMBERS COURTESY
}

enum NotificationType {
  FLIGHT_REMINDER FLIGHT_DEPARTURE FLIGHT_DELAY
  HOTEL_CHECKIN HOTEL_CHECKOUT
  DAY_START ACTIVITY_REMINDER ARRIVAL
  EXPENSE_ADDED GENERAL
}

enum ChatRole { USER ASSISTANT }
```

---

## China Travel — Thai Traveler Specific Features

### 1. Useful Phrases (Thai → Chinese)
The #1 pain point for Thai travelers in China is language. Build a phrasebook:

```typescript
// Auto-populated when operator creates a China tour
const chinaDefaultPhrases = [
  { category: 'EMERGENCY', thai: 'ช่วยด้วย!', local: '救命!', pinyin: 'Jiùmìng!' },
  { category: 'DIRECTIONS', thai: 'ห้องน้ำอยู่ที่ไหน', local: '厕所在哪里？', pinyin: 'Cèsuǒ zài nǎlǐ?' },
  { category: 'FOOD', thai: 'ฉันกินเผ็ดไม่ได้', local: '我不能吃辣', pinyin: 'Wǒ bù néng chī là' },
  { category: 'FOOD', thai: 'ฉันไม่กินหมู', local: '我不吃猪肉', pinyin: 'Wǒ bù chī zhūròu' },
  { category: 'FOOD', thai: 'อร่อยมาก!', local: '非常好吃！', pinyin: 'Fēicháng hǎochī!' },
  { category: 'SHOPPING', thai: 'ลดราคาได้ไหม', local: '可以便宜一点吗？', pinyin: 'Kěyǐ piányí yīdiǎn ma?' },
  { category: 'TRANSPORT', thai: 'ไปที่นี่', local: '去这里', pinyin: 'Qù zhèlǐ' },
  { category: 'HOTEL', thai: 'เช็คอินที่นี่', local: '我要办理入住', pinyin: 'Wǒ yào bànlǐ rùzhù' },
  { category: 'NUMBERS', thai: 'เท่าไร', local: '多少钱？', pinyin: 'Duōshǎo qián?' },
]
// Operator can add/edit. TTS audio generated from text-to-speech API.
```

### 2. WeChat Pay / Alipay QR Tips
Thai travelers CANNOT use WeChat Pay or Alipay in China without a Chinese bank account.
The app should warn about this and suggest workarounds:

```typescript
// Show this warning card on Day 1 of any China tour
const chinaPaymentWarning = {
  title: 'การชำระเงินในจีน ⚠️',
  content: `WeChat Pay และ Alipay ต้องใช้บัญชีธนาคารจีน
  ท่านอาจชำระได้ด้วย:
  • บัตรเครดิต Visa/Mastercard (ร้านใหญ่รับ)
  • เงินสด CNY (แนะนำสำหรับตลาด)
  • UnionPay card (ธนาคารไทยบางแห่งออกได้)
  • บัตรท่องเที่ยว WeChat Pay (ลงทะเบียนด้วยพาสปอร์ตได้แล้ว!)`,
  tip: 'แนะนำถือเงินสดหยวน 2,000-3,000 หยวนต่อวัน'
}
```

### 3. China Emergency Numbers (Different from Global)
```typescript
export const CHINA_EMERGENCY = {
  police:     '110',
  ambulance:  '120',
  fire:       '119',
  tourist:    '12301',  // National tourism hotline — has English/Thai support
  roadside:   '122',
  thaiEmbassyBeijing: '+86-10-6532-4985',
  thaiConsulateShanghai: '+86-21-6288-2088',
  thaiConsulateGuangzhou: '+86-20-8385-8988',
  thaiConsulateChengdu: '+86-28-6618-0109',
  thaiConsulateKunming: '+86-871-6316-8916',
  thaiConsulateXiamen: '+86-592-5112-313',
  thaiConsulateQingdao: '+86-532-8389-7000',
}
```

### 4. WiFi Situation in China
Hotel WiFi in China is the only reliable internet for most Thai travelers.
The app stores WiFi credentials per hotel and shows them prominently:

```typescript
// Accommodation card shows WiFi prominently for China hotels
<WifiCard
  name={hotel.wifiName}          // "HolidayInn_Guest"
  password={hotel.wifiPassword}  // "12345678"
  note="WiFi โรงแรมใช้งานได้ดี แต่บางแอปอาจโหลดช้า"
/>
// Note: TripFlow app itself is fully cached offline so WiFi speed doesn't matter for the app
```

### 5. Offline-First for China (Critical)
Chinese subway, rural areas, and some tourist sites have poor data connectivity.
The entire tour must be accessible offline:

```typescript
// Service Worker caches on install / tour selection
const CACHE_STRATEGY = {
  tourData: 'cache-first',         // All itinerary, checklists, contacts
  maps: 'cache-first',             // Pre-cache Amap tiles for tour cities
  hotelPhotos: 'cache-first',      // Downloaded before trip
  documentFiles: 'cache-first',    // Tickets, vouchers
  weather: 'network-first-fallback-cache', // Try fresh, show cached if offline
  aiChat: 'network-only',          // Requires internet (show friendly offline message)
}
```

---

## Thai-Specific UI Design

### Language
- **Primary**: Thai (ภาษาไทย) — all traveler UI
- **Secondary labels**: English (for place names, hotel names, codes)
- **Third layer**: Local language inline (Chinese characters, Japanese kanji) for addresses and signs
- Noto Sans Thai font throughout

### Thai Date Format
```typescript
// Thai users prefer Buddhist Era (พ.ศ.) option
// เช่น "วันจันทร์ที่ 16 มีนาคม 2569" (BE) or "2026" (CE)
// Use date-fns/locale/th for Thai locale formatting
import { th } from 'date-fns/locale'
format(date, 'EEEE dd MMMM yyyy', { locale: th })
// → "จันทร์ 16 มีนาคม 2026"
```

### Currency Display for Thai Travelers
```typescript
// Always show THB equivalent next to foreign currency
// "¥ 180 (≈ ฿ 900)"
// "€ 25 (≈ ฿ 950)"
// Exchange rates cached daily from ExchangeRate-API
```

### Meal Indicators (Very Important for Thai Tours)
Thai group tours always specify which meals are included. Show prominently on every day card:
```typescript
<MealBadges
  breakfast={day.mealBreakfast}  // 🍳 อาหารเช้า
  lunch={day.mealLunch}          // 🍱 อาหารกลางวัน
  dinner={day.mealDinner}        // 🍽️ อาหารเย็น
/>
```

### Tour Guide Contact — Always Visible
Thai travelers rely heavily on the tour guide. The guide's LINE/phone should be accessible from every screen via a floating action button or sticky bottom bar.

---

## AI Chat — Thai Travel Assistant

```typescript
// The AI responds in Thai for ALL destinations
// For China tours: uses Qwen (accessible in China)
// For other tours: uses Claude (better Thai quality)

const systemPrompt = (tour: Tour, day: TourDay, user: User) => `
คุณคือผู้ช่วยการท่องเที่ยวส่วนตัวของ TripFlow ที่ตอบเป็นภาษาไทยเสมอ

ทริป: ${tour.title}
วันนี้: วันที่ ${day.dayNumber} — ${day.city}, ${day.country}
เวลาท้องถิ่น: ${localTime} (${day.timezone})
กำหนดการวันนี้: ${JSON.stringify(todayActivities)}
ที่พัก: ${accommodation?.name}
สภาพอากาศ: ${weatherSummary}
กลุ่ม: ${members.length} คน

คำแนะนำ:
- ตอบเป็นภาษาไทยเสมอ
- ถ้าถามเรื่องอาหาร ให้แนะนำร้านใกล้ ${day.city}
- ถ้าถามเรื่องการเดินทาง ดูจากแผนเส้นทางด้านบน
- ถ้าอยู่ในจีน และถามคำศัพท์จีน ให้บอกทั้งอักษรจีน พินอิน และความหมาย
- อัตราแลกเปลี่ยนวันนี้: 1 THB = ${rate} ${destCurrency}
- เบอร์ฉุกเฉิน: ${JSON.stringify(emergency)}
`
```

---

## Transport Pass — China & Global

```typescript
// China passes for Thai travelers
const CHINA_PASSES = [
  { name: 'รถไฟความเร็วสูงจีน', nameEn: 'China High-Speed Rail', color: '#E53935' },
  { name: 'บัตร IC รถไฟใต้ดินปักกิ่ง', nameEn: 'Beijing Subway IC Card', color: '#1565C0' },
  { name: 'บัตร Metro เซี่ยงไฮ้', nameEn: 'Shanghai Metro Card', color: '#7B1FA2' },
]

// Global passes
const GLOBAL_PASSES = [
  { name: 'JR Pass ญี่ปุ่น', color: '#6366F1' },
  { name: 'Suica', color: '#22C55E' },
  { name: 'T-money เกาหลี', color: '#F59E0B' },
  { name: 'Navigo ปารีส', color: '#8B5CF6' },
  { name: 'Oyster ลอนดอน', color: '#EF4444' },
  { name: 'Opal ออสเตรเลีย', color: '#F97316' },
]
```

---

## Project Structure

```
tripflow/
├── apps/
│   ├── web/                              # Traveler PWA (Thai UI)
│   │   ├── app/
│   │   │   ├── [locale]/                 # /th (default) /en
│   │   │   │   ├── (auth)/
│   │   │   │   │   ├── login/
│   │   │   │   │   └── register/
│   │   │   │   └── (app)/
│   │   │   │       ├── home/             # My tours list
│   │   │   │       └── tour/[id]/
│   │   │   │           ├── today/        # วันนี้
│   │   │   │           ├── itinerary/    # แผนเที่ยว
│   │   │   │           ├── day/[n]/      # รายละเอียดวัน
│   │   │   │           ├── transport/    # การเดินทาง
│   │   │   │           ├── checklist/    # เช็คลิสต์
│   │   │   │           ├── members/      # สมาชิกกลุ่ม
│   │   │   │           ├── map/          # แผนที่ (Amap/Mapbox)
│   │   │   │           ├── expenses/     # ค่าใช้จ่าย
│   │   │   │           ├── phrases/      # ✨ คำศัพท์ (China tours)
│   │   │   │           ├── documents/    # เอกสาร
│   │   │   │           ├── emergency/    # ฉุกเฉิน
│   │   │   │           └── chat/         # AI ช่วยเหลือ
│   │   │   └── api/
│   │   │       ├── auth/
│   │   │       ├── tours/
│   │   │       ├── chat/                 # Switches Claude↔Qwen by tour.isChina
│   │   │       ├── weather/              # Switches OpenWeather↔Caiyun by isChina
│   │   │       ├── maps/                 # Switches Mapbox↔Amap by isChina
│   │   │       ├── flights/              # Switches AviationStack↔VariFlight
│   │   │       ├── currency/
│   │   │       ├── phrases/tts/          # Text-to-speech for phrases
│   │   │       └── notifications/
│   │   ├── components/
│   │   │   ├── ui/
│   │   │   ├── tour/
│   │   │   │   ├── DayCard.tsx
│   │   │   │   ├── TimelineItem.tsx
│   │   │   │   ├── TransportCard.tsx
│   │   │   │   ├── AccommodationCard.tsx
│   │   │   │   ├── MealBadges.tsx        # ✨ Thai tour must-have
│   │   │   │   ├── ChinaPaymentWarning.tsx # ✨ China specific
│   │   │   │   └── WifiCard.tsx          # ✨ China hotel WiFi
│   │   │   ├── map/
│   │   │   │   ├── AmapView.tsx          # China map
│   │   │   │   └── MapboxView.tsx        # Global map
│   │   │   ├── phrases/
│   │   │   │   └── PhraseCard.tsx        # ✨ Thai→Chinese phrases
│   │   │   ├── checklist/
│   │   │   ├── expense/
│   │   │   ├── chat/
│   │   │   └── layout/
│   │   │       └── BottomNav.tsx         # วันนี้/แผนเที่ยว/การเดินทาง/เช็คลิสต์/ช่วยเหลือ
│   │   └── public/
│   │       ├── manifest.json
│   │       └── sw.js                     # Offline cache — critical for China
│   │
│   ├── admin/                            # Operator portal (Thai company admin)
│   │   ├── app/
│   │   │   ├── dashboard/
│   │   │   ├── tours/
│   │   │   │   ├── new/                  # Tour wizard
│   │   │   │   └── [id]/
│   │   │   │       ├── itinerary/        # Day builder
│   │   │   │       ├── members/
│   │   │   │       ├── checklists/
│   │   │   │       ├── phrases/          # ✨ Phrasebook editor
│   │   │   │       ├── documents/
│   │   │   │       └── notifications/
│   │   │   ├── travelers/
│   │   │   └── settings/
│   │   └── components/
│   │
│   └── superadmin/
│
├── packages/
│   ├── adapters/                         # Service adapter layer
│   │   ├── maps.ts                       # Amap (CN) vs Mapbox (Global)
│   │   ├── push.ts                       # JPush (CN) vs FCM (Global)
│   │   ├── ai.ts                         # Qwen (CN) vs Claude (Global)
│   │   ├── weather.ts                    # Caiyun (CN) vs OpenWeather (Global)
│   │   ├── flights.ts                    # VariFlight (CN airlines) vs AviationStack
│   │   └── translate.ts                  # Baidu (admin in CN) vs DeepL
│   ├── database/
│   ├── types/
│   └── utils/
│       ├── coordinates.ts                # WGS-84 ↔ GCJ-02 conversion
│       ├── currency.ts                   # Multi-currency, THB base
│       ├── timezone.ts                   # date-fns-tz helpers
│       ├── countries.ts                  # All countries + emergency numbers
│       ├── destination.ts                # getTourRegion() helper
│       └── thai-dates.ts                 # Thai Buddhist Era date formatting
│
└── docs/
```

---

## Environment Variables

```env
# ── DATABASE ────────────────────────────────────────────
DATABASE_URL=                          # Supabase Singapore ap-southeast-1
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# ── AUTH ────────────────────────────────────────────────
JWT_SECRET=
ENCRYPTION_KEY=                        # For passport number encryption

# ── MAPS ────────────────────────────────────────────────
# Global
NEXT_PUBLIC_MAPBOX_TOKEN=
# China — Amap (高德地图)
NEXT_PUBLIC_AMAP_JS_KEY=              # Web JS API Key (client, safe to expose with domain whitelist)
AMAP_SERVER_KEY=                      # REST API Key (server only, never expose)

# ── PUSH NOTIFICATIONS ──────────────────────────────────
# Global — Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_APP_ID=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_VAPID_KEY=
FIREBASE_ADMIN_PROJECT_ID=
FIREBASE_ADMIN_CLIENT_EMAIL=
FIREBASE_ADMIN_PRIVATE_KEY=
# China — JPush (极光推送)
JPUSH_APP_KEY=
JPUSH_MASTER_SECRET=
NEXT_PUBLIC_JPUSH_APP_KEY=

# ── AI CHAT ─────────────────────────────────────────────
ANTHROPIC_API_KEY=                     # Global tours (Claude)
DASHSCOPE_API_KEY=                     # China tours (Alibaba Qwen)

# ── WEATHER ─────────────────────────────────────────────
OPENWEATHER_API_KEY=                   # Global tours
CAIYUN_WEATHER_TOKEN=                  # China tours (彩云天气)

# ── FLIGHTS ─────────────────────────────────────────────
AVIATIONSTACK_API_KEY=                 # International flights (TG, QR, EK etc.)
VARIFLIGHT_API_KEY=                    # Chinese carriers (CA, MU, CZ, 3U etc.)

# ── CURRENCY ────────────────────────────────────────────
EXCHANGE_RATE_API_KEY=                 # ExchangeRate-API (accessible from CN)

# ── TRANSLATION (admin side, operator in Thailand) ──────
DEEPL_API_KEY=                         # Content translation

# ── SMS ─────────────────────────────────────────────────
ALIYUN_SMS_ACCESS_KEY=                 # Thai +66 numbers via Aliyun
ALIYUN_SMS_ACCESS_SECRET=
ALIYUN_SMS_SIGN_NAME=                  # "TripFlow"
ALIYUN_SMS_TEMPLATE_OTP=               # Approved template code

# ── EMAIL ───────────────────────────────────────────────
RESEND_API_KEY=
EMAIL_FROM=noreply@tripflow.app

# ── STORAGE ─────────────────────────────────────────────
# Supabase Storage + Cloudflare R2 proxy for China performance
CLOUDFLARE_ACCOUNT_ID=
CLOUDFLARE_R2_ACCESS_KEY=
CLOUDFLARE_R2_SECRET_KEY=
CLOUDFLARE_R2_BUCKET=tripflow-media
NEXT_PUBLIC_MEDIA_CDN=https://media.tripflow.app   # Cloudflare Worker proxy URL

# ── APP ─────────────────────────────────────────────────
NEXT_PUBLIC_APP_URL=https://app.tripflow.app
NEXT_PUBLIC_ADMIN_URL=https://admin.tripflow.app
NODE_ENV=production
```

---

## Offline Cache Strategy (Critical for China)

```typescript
// public/sw.js — Workbox Service Worker

// Pre-cache on tour selection (before traveler leaves Thailand)
async function preCacheTour(tourId: string) {
  const cache = await caches.open(`tour-${tourId}`)

  // 1. All tour data (itinerary, contacts, checklists, documents)
  await cache.add(`/api/tours/${tourId}/full`)

  // 2. Hotel photos (shown offline when checking in)
  const hotelImages = await getTourHotelImages(tourId)
  await cache.addAll(hotelImages)

  // 3. Map tiles for tour cities (Amap static tiles for CN, Mapbox for global)
  await preCacheMapTiles(tour.cities, tour.isChina)

  // 4. Phrase audio files (for China tours)
  if (tour.isChina) {
    const phraseAudios = await getTourPhraseAudios(tourId)
    await cache.addAll(phraseAudios)
  }

  // Show "พร้อมใช้งานออฟไลน์แล้ว ✓" notification
}

// Runtime strategy
registerRoute(
  ({ url }) => url.pathname.startsWith('/api/tours/'),
  new CacheFirst({ cacheName: 'tour-data', plugins: [expiration(7 days)] })
)
registerRoute(
  ({ url }) => url.pathname.startsWith('/api/weather/'),
  new NetworkFirst({ cacheName: 'weather', plugins: [expiration(2 hours)] })
)
```

---

## Contact Actions — China vs Global

```typescript
// In China: LINE does not work, WhatsApp does not work
// Thai guides in China use WeChat to communicate with Thai tourists
// Show appropriate contact options based on tour destination

const ContactActions = ({ contact, tourIsChina }) => {
  if (tourIsChina) {
    return (
      <>
        {contact.phone && (
          <Button icon="phone" href={`tel:${contact.phone}`}>
            โทร {contact.phone}
          </Button>
        )}
        {contact.wechat && (
          <Button icon="copy" onClick={() => copyToClipboard(contact.wechat)}>
            คัดลอก WeChat: {contact.wechat}
          </Button>
        )}
        {/* No WhatsApp, no LINE — they don't work in China */}
      </>
    )
  }
  return (
    <>
      {contact.phone && <Button href={`tel:${contact.phone}`}>โทร</Button>}
      {contact.line && <Button href={`line://ti/p/~${contact.line}`}>LINE</Button>}
      {contact.whatsapp && <Button href={`https://wa.me/${contact.whatsapp}`}>WhatsApp</Button>}
    </>
  )
}
```

---

## Claude Code — Execution Order (24 Steps)

### Phase 1 — Foundation
**Step 1** `"Create Turborepo monorepo named tripflow. Create apps: web, admin, superadmin. Create packages: database, types, utils, adapters. Set up shared tsconfig, root package.json workspaces, and .env.example."`

**Step 2** `"Set up packages/database with full Prisma schema from CLAUDE.md including: UsefulPhrase model, isChina boolean on Tour and TourDay, Chinese-specific fields (nameLocal, addressLocal, wechat on contacts, wifiName/wifiPassword on Accommodation, chinaVisaHotline on EmergencyInfo). Run migration init."`

**Step 3** `"Build packages/utils: coordinates.ts (WGS-84↔GCJ-02 with isMainlandChina check), destination.ts (getTourRegion returns CHINA if any country is CN), thai-dates.ts (date-fns Thai locale helpers, Buddhist Era toggle), currency.ts (all currencies with THB as base, formatWithTHB shows '¥180 (≈ ฿900)'), countries.ts (all countries with Thai names, emergency numbers, Thai embassy contacts). Build packages/types."`

**Step 4** `"Build ALL service adapters in packages/adapters. Each adapter takes a region parameter (CHINA|GLOBAL). Maps: AmapAdapter (高德地图 JS API v2) + MapboxAdapter. Push: JPushAdapter (极光推送 REST) + FCMAdapter (Firebase Admin). AI: QwenAdapter (DashScope dashscope.aliyuncs.com/compatible-mode/v1, model qwen-turbo) + ClaudeAdapter (Anthropic). Weather: CaiyunAdapter (api.caiyunapp.com) + OpenWeatherAdapter. Flights: VariFlightAdapter + AviationStackAdapter (auto-select by airline IATA: CN/MU/CZ/3U/HU/ZH use VariFlight, all others use AviationStack). Translate: DeepLAdapter (operator side only)."`

**Step 5** `"Initialize apps/web Next.js 14. Install all dependencies including: Noto Sans Thai font (next/font), flag-icons, date-fns/locale/th, workbox-webpack-plugin. Apply TripFlow design system with Thai font priority. Build bottom navigation with Thai labels: วันนี้/แผนเที่ยว/การเดินทาง/เช็คลิสต์/ช่วยเหลือ. Safe-area inset for iPhone."`

### Phase 2 — Auth
**Step 6** `"Build auth pages. /login: email+password and Google OAuth. /register: full Thai name (ชื่อ-นามสกุล), English name for passport, email, Thai phone number (+66 format), profile photo upload. Language defaults to Thai. /profile/edit: add passport number (encrypted), passport expiry, nationality. Wire to Supabase Auth. Register both FCM token and JPush ID on login — both stored on user, used based on tour destination."`

### Phase 3 — Traveler App
**Step 7** `"Build /home showing my assigned tours. Tour card: cover photo, tour title in Thai, destination country flags (flag-icons), city names, date range in Thai locale, member count, smart countdown (ออกเดินทางใน X วัน / วันที่ X ของทริป / เดินทางกลับแล้ว). For China tours show a small '🇨🇳 ออฟไลน์พร้อม' badge if tour data is cached. Click tour → /tour/[id]/today."`

**Step 8** `"Build /tour/[id]/today. Shows: (1) Hero with today's city + country flag + date in Thai, (2) Meal badges for today (🍳 อาหารเช้า ✓ / 🍱 กลางวัน ✗ / 🍽️ เย็น ✓) — prominent, Thai tourists check this first, (3) Weather card using weatherAdapter — switches Caiyun↔OpenWeather based on tour.isChina, (4) Today's timeline as scrollable vertical list, (5) Flight banner if flying today with live status from flightsAdapter, (6) Guide contact sticky card showing primary guide's phone + WeChat (if China) or LINE (if other)."`

**Step 9** `"Build /tour/[id]/itinerary (day list) and /tour/[id]/day/[n] (day detail). Day list: each card shows day number, Thai date, city + country flag, pass badge, meal badges row. Day detail: city hero banner, 2-day weather, summary text in Thai, meal badges, timeline (activities with Thai names + local names in smaller text e.g. 'พระราชวังต้องห้าม 故宫'), transport segments, accommodation card with WiFi credentials shown if tour.isChina."`

**Step 10** `"Build /tour/[id]/transport. Top: pass cards for this tour with Thai names and validity. Route list by day: transport cards showing Thai departure/arrival names + local script below in smaller text + duration. For China high-speed train: show 'ต้องนั่งที่จองเท่านั้น' warning. For China subway: show which card to tap. For flights: airline logo + flight number + Thai/local airport names."`

**Step 11** `"Build /tour/[id]/checklist. Grouped checklists with Thai labels, emoji, progress bars. Toggle with optimistic update + Socket.io sync across group members. For China tours, auto-include a 'เตรียมเดินทางจีน' checklist with items: วีซ่าจีน, ประกันเดินทาง, แลกเงินหยวน, ดาวน์โหลดแผนที่ออฟไลน์, แจ้งธนาคารก่อนเดินทาง, ซื้อซิมการ์ดจีนหรือพ็อกเก็ตไวไฟ, เตรียมยา."`

**Step 12** `"Build /tour/[id]/map. Detect tour.isChina: if true load Amap JS API from webapi.amap.com CDN (accessible in China), convert all stored WGS-84 coordinates to GCJ-02 using wgs84ToGcj02() before placing pins. If false load Mapbox. Both use same UI: activity pins colored by category, day filter tabs, tap pin = slide-up detail card with Thai name + local name. 'ใกล้ฉัน' tab: Amap POI search (CN) or Mapbox Places (Global). Show restaurant/ATM/pharmacy/convenience store."`

**Step 13** `"Build /tour/[id]/phrases (NEW — China tours only, hide tab for non-China tours). Phrase categories: คำทักทาย/ทิศทาง/อาหาร/ช้อปปิ้ง/ขนส่ง/โรงแรม/ฉุกเฉิน/ตัวเลข. Each phrase card: Thai text (large, primary), Chinese characters (medium), Pinyin in italics, play button for TTS audio. Large touch target. 'คัดลอก' button copies Chinese text for typing/showing. Search bar to find phrases. Entire phrase list cached offline."`

**Step 14** `"Build /tour/[id]/expenses. Add expense: Thai title, amount in local currency (CNY/JPY/EUR etc.) with currency picker, auto-show THB equivalent (≈ ฿XXX) using cached exchange rate, paid-by member avatar picker, split-with checkboxes. Expense list shows local currency + THB equivalent. Settlement tab: 'เจ๊ต้องจ่ายแดง ฿500' style Thai settlement statements. For China tours add note: 'ในจีนแนะนำใช้เงินสดหยวนหรือบัตรเครดิต'. Export PDF summary."`

**Step 15** `"Build /tour/[id]/members (สมาชิกกลุ่ม). Avatar grid. Each card: photo, Thai name, room number. Tap → action sheet with: โทร (tel: link), LINE (if non-China tour), WeChat คัดลอก (if China tour), คัดลอกเบอร์. Build /tour/[id]/emergency (ฉุกเฉิน). For China: large tap-to-call 110/120/119, 12301 tourism hotline, Thai Embassy numbers per Chinese city (Beijing/Shanghai/Guangzhou/Chengdu/Kunming/Xiamen), insurance hotline, nearest hospital. For global: country-specific numbers + Thai embassy. All numbers tap-to-call. Full offline access."`

**Step 16** `"Build /tour/[id]/chat (AI ช่วยเหลือ). Chat UI with Thai bubble style. AI responds in Thai always. For tour.isChina: POST to /api/tours/[id]/chat which calls QwenAdapter (dashscope.aliyuncs.com — accessible inside China). For other tours: ClaudeAdapter. System prompt from CLAUDE.md Thai template injecting full tour context. Suggested quick-reply chips: 'วันนี้ทำอะไรบ้าง', 'ร้านอาหารใกล้ๆ', 'ไปโรงแรมยังไง', 'เบอร์ฉุกเฉิน', 'แปลภาษาช่วย'. Stream response via SSE. Show offline message if no internet."`

**Step 17** `"Build /tour/[id]/documents. Grid of document type cards: ตั๋วเครื่องบิน, เวาเชอร์โรงแรม, วีซ่า, QR Code, ประกันภัย, แผนที่. Tap to view full screen with pinch-zoom. QR codes display large and work offline. For China: pre-populate with 'Health Declaration QR' field. All documents cached offline before trip departs."`

### Phase 4 — Admin Portal
**Step 18** `"Build apps/admin with Thai/English UI toggle. Dashboard: active tours by destination (group by country with flags), today's departures, total travelers per tour. Build tour creation wizard: Step 1 = title in Thai + English, country/cities selector (selecting CN auto-sets isChina=true and adds China defaults), dates, cover image. Step 2 = flights (search airports by IATA or Thai name, auto-detect airline for VariFlight vs AviationStack). Step 3 = day builder: activity search via Google Places (operator is in Thailand, can use Google), drag-and-drop reorder, transport segments, accommodation fields including wifiName/wifiPassword for China hotels. Step 4 = checklists (pre-populate with China travel checklist if isChina). Step 5 = phrases (if China tour: pre-populate with default Thai→Chinese phrases, operator can edit/add audio). Step 6 = publish + send invites."`

**Step 19** `"Build admin member management. Invite by email (Resend). Member table: name, phone, passport expiry warning (red if < 6 months), room/bed assignment, checklist completion %, flight seat. Bulk assign rooms. Send individual message (LINE for Thai contacts). Export PDF manifest for airline check-in. For China tours: add field for Travel Insurance policy number per member."`

**Step 20** `"Build admin notification center. Compose push in Thai (primary) + English. For China tours: send via JPush. For other tours: FCM. Schedule: flight reminders 3hr before departure in Bangkok time (travelers still in Thailand), morning day-start 7am local city time (traveler now in destination). SMS backup for critical alerts (flight delay) via Aliyun SMS to Thai +66 numbers."`

### Phase 5 — Offline & Performance
**Step 21** `"Build Service Worker with Workbox. Implement preCacheTour() function called when traveler opens a tour for first time: caches full tour JSON, hotel images, map tiles for tour cities (Amap static tiles for China, Mapbox tiles for global), phrase audio files for China tours, all document files. Show 'กำลังดาวน์โหลดข้อมูลทริป...' progress bar then 'พร้อมใช้งานออฟไลน์แล้ว ✓'. Background sync queue for checklist toggles when offline."`

**Step 22** `"Set up Cloudflare R2 + Workers proxy for media CDN. All user-uploaded images (hotel photos, tour cover, avatars) stored in Cloudflare R2 and served from media.tripflow.app via Cloudflare Worker. This gives much better China connectivity than serving direct from Supabase Storage (which runs on AWS us-east). Implement in storage adapter."`

**Step 23** `"Set up push notifications end-to-end. FCM: service worker background handler for non-China tours. JPush: JPush Web SDK for China tours. On user login: register device with both FCM and JPush, store tokens on user record. Notification scheduling via Supabase pg_cron: flight reminder (T-3hr Bangkok time), day start (7am destination time), hotel check-in (T-2hr), hotel check-out reminder (day of checkout, 8am). All notification content in Thai."`

**Step 24** `"Final: Make full PWA (manifest.json, icons, screenshots). Full i18n: Thai strings for every UI element in messages/th.json, English in messages/en.json. Thai Buddhist Era date toggle in profile settings. Test all China-specific flows with AMAP key, Qwen API, JPush, VariFlight. Sentry error tracking. Lighthouse audit targeting 90+ PWA + Performance. Verify GCJ-02 conversion on Amap pins. Verify Qwen responds in Thai. Verify JPush delivers when FCM would be blocked."`

---

## Engineering Rules

- **China test required** — before deploying any feature, test with VPN off to simulate being inside China
- **Never call blocked services for traveler features** — Google Maps/Firebase/Anthropic are only for admin/operator (in Thailand). All traveler-facing calls go through adapters
- **WGS-84 in DB always** — convert to GCJ-02 at Amap render time only, never store GCJ-02
- **Thai first** — all UI strings start in Thai, English is secondary
- **THB as base** — all expenses have a THB equivalent, always show both
- **Offline must work** — traveler losing internet in China subway should not break the app. Core features (itinerary, checklist, emergency contacts, phrases) must be fully accessible offline
- **LINE for Thai guides** — Thai tour guides use LINE. WhatsApp for foreign contacts. WeChat for China contacts. Show the right one based on tour destination
- **Meal badges on every day** — Thai group tour travelers check meals first, always show breakfast/lunch/dinner prominently
- **Noto Sans Thai** — primary font, every screen
- **Supabase Singapore region** — `ap-southeast-1` closest to Thailand, lowest latency for Thai users
- **TypeScript strict** — zero `any`
- **44px touch targets** — WCAG minimum, critical for elderly travelers