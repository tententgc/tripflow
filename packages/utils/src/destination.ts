import type { TourRegion } from '@tripflow/types'

/**
 * Determine if a tour requires China-compatible services.
 * If any destination is mainland China (CN), all traveler-facing services
 * must use China-accessible APIs.
 *
 * Note: HK (Hong Kong) and MO (Macau) follow different rules and are NOT
 * treated as mainland China for service selection.
 */
export function getTourRegion(countries: string[]): TourRegion {
  const chinaDestinations = ['CN']
  return countries.some((c) => chinaDestinations.includes(c.toUpperCase()))
    ? 'CHINA'
    : 'GLOBAL'
}

export function isChinaTour(countries: string[]): boolean {
  return getTourRegion(countries) === 'CHINA'
}

/**
 * China airline IATA codes — use VariFlight for these
 */
export const CHINA_AIRLINE_IATA = new Set([
  'CA', // Air China
  'MU', // China Eastern
  'CZ', // China Southern
  '3U', // Sichuan Airlines
  'HU', // Hainan Airlines
  'ZH', // Shenzhen Airlines
  'MF', // Xiamen Airlines
  'SC', // Shandong Airlines
  'GS', // Tianjin Airlines
  'EU', // Chengdu Airlines
  'CN', // Grand China Air
  'KY', // Kunming Airlines
  'NS', // Hebei Airlines
  'PN', // West Air (China)
  'GJ', // Loong Air
  'DR', // Ruili Airlines
  'NU', // Lucky Air
  'TV', // Tibet Airlines
  '9C', // Spring Airlines
  'BK', // Okay Airways
  'DZ', // Donghai Airlines
])

export function isChineseAirline(iataCode: string): boolean {
  return CHINA_AIRLINE_IATA.has(iataCode.toUpperCase())
}
