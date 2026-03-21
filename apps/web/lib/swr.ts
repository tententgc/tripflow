import useSWR, { SWRConfiguration } from 'swr'

export const fetcher = (url: string) => fetch(url).then(r => {
  if (!r.ok) throw new Error(`${r.status}`)
  return r.json()
})

export function useApi<T>(url: string | null, config?: SWRConfiguration) {
  return useSWR<T>(url, fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 10000,
    ...config,
  })
}
