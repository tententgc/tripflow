import useSWR, { SWRConfiguration, mutate } from 'swr'

export const fetcher = (url: string) => fetch(url).then(r => {
  if (!r.ok) throw new Error(`${r.status}`)
  return r.json()
})

/** Standard hook — auto-refresh every 60s, revalidate on focus for fresh data */
export function useApi<T>(url: string | null, config?: SWRConfiguration) {
  return useSWR<T>(url, fetcher, {
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
    dedupingInterval: 10_000,
    refreshInterval: 0,          // no polling — revalidate on focus only (pages can override)
    ...config,
  })
}

/** Static data hook — no auto-refresh (for data that rarely changes like exchange rates) */
export function useApiStatic<T>(url: string | null, config?: SWRConfiguration) {
  return useSWR<T>(url, fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 60_000,
    refreshInterval: 0,
    ...config,
  })
}

/** Revalidate all SWR caches matching a key pattern */
export function revalidateAll() {
  mutate(() => true, undefined, { revalidate: true })
}
