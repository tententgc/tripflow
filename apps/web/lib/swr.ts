import useSWR, { SWRConfiguration } from 'swr'

export const fetcher = (url: string) => fetch(url).then(r => {
  if (!r.ok) throw new Error(`${r.status}`)
  return r.json()
})

export function useApi<T>(url: string | null, config?: SWRConfiguration) {
  return useSWR<T>(url, fetcher, {
    revalidateOnFocus: true,       // refetch when user comes back to tab
    revalidateOnReconnect: true,   // refetch when network reconnects
    dedupingInterval: 5000,        // 5s dedup (was 10s)
    refreshInterval: 0,            // no polling by default
    ...config,
  })
}
