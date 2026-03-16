# TripFlow Architecture

## Service Selection by Tour Region

```
Tour destination CN (Mainland China)?
  YES → China-accessible services:
        Maps:    Amap (webapi.amap.com / restapi.amap.com)
        AI:      Qwen (dashscope.aliyuncs.com)
        Weather: Caiyun (api.caiyunapp.com)
        Push:    JPush (api.jpush.cn)
        Flights: VariFlight (Chinese airlines only)
  NO  → Global services:
        Maps:    Mapbox
        AI:      Anthropic Claude (claude-sonnet-4-20250514)
        Weather: OpenWeatherMap
        Push:    Firebase Cloud Messaging
        Flights: AviationStack
```

## Coordinate System

- **Storage**: Always WGS-84 (standard GPS) in PostgreSQL
- **Amap display**: Convert WGS-84 to GCJ-02 via `wgs84ToGcj02()` before pinning
- **Amap search results**: Convert GCJ-02 to WGS-84 via `gcj02ToWgs84()` before storing

## Offline Strategy

```
Pre-cache on tour open (before departure):
  /api/tours/[id]           → cache-first
  /api/tours/[id]/days      → cache-first
  /api/tours/[id]/checklist → cache-first
  /api/tours/[id]/contacts  → cache-first
  /api/tours/[id]/emergency → cache-first
  /api/tours/[id]/phrases   → cache-first (China tours)
  /api/tours/[id]/documents → cache-first

Runtime:
  Weather: network-first, fallback to cached (2h expiry)
  AI Chat: network-only (show offline message)
  Maps: cached tiles + network for new areas
```

## Data Flow

```
Thai Operator (Thailand) → Supabase PostgreSQL (Singapore)
                                    ↓
                         Cloudflare CDN (media.tripflow.app)
                                    ↓
Thai Traveler (anywhere) → Next.js API → Service Adapters
                                              ↓
                                    China: Amap/Qwen/Caiyun/JPush
                                    Global: Mapbox/Claude/OWM/FCM
```
