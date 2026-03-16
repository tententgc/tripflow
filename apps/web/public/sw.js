// TripFlow Service Worker — Workbox-based offline caching
// Critical for China: travelers lose internet in subway/rural areas

const CACHE_VERSION = 'v1'
const TOUR_DATA_CACHE = `tour-data-${CACHE_VERSION}`
const STATIC_CACHE = `static-${CACHE_VERSION}`

// Install — cache critical static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll([
        '/',
        '/home',
        '/manifest.json',
      ])
    })
  )
  self.skipWaiting()
})

// Activate — clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== TOUR_DATA_CACHE && k !== STATIC_CACHE)
          .map((k) => caches.delete(k))
      )
    )
  )
  self.clients.claim()
})

// Fetch — cache strategy by route
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url)

  // Tour data: cache-first (works offline)
  if (url.pathname.startsWith('/api/tours/')) {
    event.respondWith(cacheFirst(event.request, TOUR_DATA_CACHE))
    return
  }

  // Weather: network-first with cache fallback (show stale data offline)
  if (url.pathname.startsWith('/api/weather/')) {
    event.respondWith(networkFirstWithFallback(event.request, TOUR_DATA_CACHE))
    return
  }

  // AI chat: network only (show friendly offline message if no internet)
  if (url.pathname.startsWith('/api/tours/') && url.pathname.includes('/chat')) {
    event.respondWith(fetch(event.request).catch(() =>
      new Response(
        JSON.stringify({ error: 'ไม่มีอินเทอร์เน็ต กรุณาเชื่อมต่อและลองใหม่' }),
        { headers: { 'Content-Type': 'application/json' } }
      )
    ))
    return
  }

  // Static assets: cache-first
  if (
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.endsWith('.png') ||
    url.pathname.endsWith('.jpg') ||
    url.pathname.endsWith('.webp') ||
    url.pathname.endsWith('.svg')
  ) {
    event.respondWith(cacheFirst(event.request, STATIC_CACHE))
    return
  }
})

async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request)
  if (cached) return cached
  try {
    const response = await fetch(request)
    if (response.ok) {
      const cache = await caches.open(cacheName)
      cache.put(request, response.clone())
    }
    return response
  } catch {
    return new Response('Offline', { status: 503 })
  }
}

async function networkFirstWithFallback(request, cacheName) {
  try {
    const response = await fetch(request)
    if (response.ok) {
      const cache = await caches.open(cacheName)
      cache.put(request, response.clone())
    }
    return response
  } catch {
    const cached = await caches.match(request)
    return cached ?? new Response('Offline', { status: 503 })
  }
}

// Pre-cache tour data (called from main app when tour is opened)
self.addEventListener('message', async (event) => {
  if (event.data?.type === 'PRECACHE_TOUR') {
    const tourId = event.data.tourId
    const cache = await caches.open(TOUR_DATA_CACHE)

    // Cache tour endpoints
    const endpoints = [
      `/api/tours/${tourId}`,
      `/api/tours/${tourId}/days`,
      `/api/tours/${tourId}/members`,
      `/api/tours/${tourId}/checklists`,
      `/api/tours/${tourId}/contacts`,
      `/api/tours/${tourId}/emergency`,
      `/api/tours/${tourId}/phrases`,
      `/api/tours/${tourId}/documents`,
    ]

    await Promise.allSettled(
      endpoints.map(async (url) => {
        try {
          const response = await fetch(url)
          if (response.ok) await cache.put(url, response)
        } catch {
          // Ignore individual failures
        }
      })
    )

    // Notify client when done
    event.source?.postMessage({ type: 'TOUR_CACHED', tourId })
  }
})
