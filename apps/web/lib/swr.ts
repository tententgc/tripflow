import useSWR, { SWRConfiguration, mutate } from 'swr'

export const fetcher = (url: string) => fetch(url).then(r => {
  if (!r.ok) throw new Error(`${r.status}`)
  return r.json()
})

/** Standard hook — auto-refresh every 15s for near real-time updates */
export function useApi<T>(url: string | null, config?: SWRConfiguration) {
  return useSWR<T>(url, fetcher, {
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
    dedupingInterval: 5000,
    refreshInterval: 15_000,     // poll every 15s for real-time feel
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
