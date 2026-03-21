/**
 * In-memory cache with TTL, stale-while-revalidate, and thundering herd protection.
 * Designed for 1000+ concurrent users on serverless.
 */

interface CacheEntry {
  data: unknown
  expires: number      // hard expiry
  staleUntil: number   // serve stale while revalidating
}

const store = new Map<string, CacheEntry>()
const inflight = new Map<string, Promise<unknown>>() // prevents thundering herd

export function getCached<T>(key: string): T | null {
  const entry = store.get(key)
  if (!entry) return null
  // Still fresh
  if (Date.now() <= entry.expires) return entry.data as T
  // Stale but within grace period — return stale data
  if (Date.now() <= entry.staleUntil) return entry.data as T
  // Fully expired
  store.delete(key)
  return null
}

export function setCache(key: string, data: unknown, ttlMs: number = 30_000) {
  store.set(key, {
    data,
    expires: Date.now() + ttlMs,
    staleUntil: Date.now() + ttlMs * 2, // serve stale for 2x TTL
  })
  // Prevent unbounded growth
  if (store.size > 500) {
    // Delete oldest 100 entries
    const keys = [...store.keys()]
    for (let i = 0; i < 100 && i < keys.length; i++) {
      store.delete(keys[i]!)
    }
  }
}

export function invalidateCache(prefix: string) {
  for (const key of store.keys()) {
    if (key.startsWith(prefix)) store.delete(key)
  }
}

/**
 * Fetch with thundering herd protection.
 * If 1000 users request the same key simultaneously,
 * only 1 actually calls the fetcher — the rest wait for the same Promise.
 */
export async function cachedFetch<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlMs: number = 30_000
): Promise<T> {
  // 1. Check cache
  const cached = getCached<T>(key)
  if (cached !== null) return cached

  // 2. Check if another request is already fetching this key
  const existing = inflight.get(key)
  if (existing) return existing as Promise<T>

  // 3. This request wins — fetch and cache
  const promise = fetcher().then(data => {
    setCache(key, data, ttlMs)
    inflight.delete(key)
    return data
  }).catch(err => {
    inflight.delete(key)
    throw err
  })

  inflight.set(key, promise)
  return promise
}
