# TripFlow

แพลตฟอร์มบริหารทัวร์กลุ่มสำหรับนักเดินทางชาวไทย รองรับทุกประเทศ พร้อมโหมดจีนที่ใช้งานได้โดยไม่ต้องใช้ VPN

## Apps

| App | Port | คำอธิบาย |
|-----|------|-----------|
| `apps/web` | 3000 | PWA สำหรับนักเดินทาง (Thai UI) |
| `apps/admin` | 3001 | Portal สำหรับบริษัททัวร์ |
| `apps/superadmin` | 3002 | จัดการระบบ |

## Tech Stack

- **Framework**: Next.js 16 (App Router) + Turborepo
- **Database**: PostgreSQL via Supabase (Singapore)
- **ORM**: Prisma
- **Auth**: Supabase Auth (Email + Google OAuth)
- **Styling**: Tailwind CSS

## China Mode

ทัวร์ที่มีปลายทางจีน (`isChina: true`) จะสลับ service อัตโนมัติ:

| Feature | Global | China |
|---------|--------|-------|
| Maps | Mapbox | Amap (高德地图) |
| AI Chat | Claude | Qwen (通义千问) |
| Weather | OpenWeather | Caiyun (彩云天气) |
| Push | Firebase FCM | JPush (极光推送) |

## Getting Started

```bash
# 1. Clone repo
git clone https://github.com/tententgc/tripflow.git
cd tripflow

# 2. คำสั่งเดียวจบ — setup + start ทุก services
./start.sh
```

> ครั้งแรกที่รัน script จะสร้าง `.env` ให้อัตโนมัติ
> กรอก `DATABASE_URL` และ Supabase keys แล้วรัน `./start.sh` อีกครั้ง

## Demo Tours

หลัง seed แล้ว login และกด **"⚡ Dev: เพิ่มตัวเองเข้าทริปตัวอย่าง"** ที่หน้า Home จะได้:

- 🇨🇳 **ทัวร์จีน** — ปักกิ่ง-กำแพงเมืองจีน 6 วัน
- 🇯🇵 **ทัวร์ญี่ปุ่น** — โตเกียว-ฟูจิ-เกียวโต-โอซาก้า 7 วัน

## Project Structure

```
tripflow/
├── apps/
│   ├── web/          # Traveler PWA
│   ├── admin/        # Operator portal
│   └── superadmin/
└── packages/
    ├── database/     # Prisma schema + migrations
    ├── adapters/     # Service adapters (Maps/AI/Weather/Push)
    ├── utils/        # Shared utilities
    └── types/        # Shared TypeScript types
```

## Environment Variables

ดู `.env.example` สำหรับ keys ที่ต้องใช้ทั้งหมด

Required สำหรับ dev:
- `DATABASE_URL` — Supabase connection string
- `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY`
