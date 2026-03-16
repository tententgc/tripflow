/**
 * Currency utilities for TripFlow
 * THB is always the base currency
 * Always show THB equivalent next to foreign currency
 */

export const CURRENCY_SYMBOLS: Record<string, string> = {
  THB: '฿',
  CNY: '¥',
  JPY: '¥',
  KRW: '₩',
  EUR: '€',
  USD: '$',
  GBP: '£',
  HKD: 'HK$',
  SGD: 'S$',
  AUD: 'A$',
  TWD: 'NT$',
  MYR: 'RM',
  VND: '₫',
  IDR: 'Rp',
  PHP: '₱',
  INR: '₹',
  AED: 'AED',
  CHF: 'CHF',
}

export const CURRENCY_NAMES_TH: Record<string, string> = {
  THB: 'บาทไทย',
  CNY: 'หยวนจีน',
  JPY: 'เยนญี่ปุ่น',
  KRW: 'วอนเกาหลี',
  EUR: 'ยูโร',
  USD: 'ดอลลาร์สหรัฐ',
  GBP: 'ปอนด์อังกฤษ',
  HKD: 'ดอลลาร์ฮ่องกง',
  SGD: 'ดอลลาร์สิงคโปร์',
  AUD: 'ดอลลาร์ออสเตรเลีย',
  TWD: 'ดอลลาร์ไต้หวัน',
  MYR: 'ริงกิตมาเลเซีย',
  VND: 'ดองเวียดนาม',
  IDR: 'รูเปียห์อินโดนีเซีย',
  PHP: 'เปโซฟิลิปปินส์',
}

/**
 * Format amount with currency symbol
 * "¥ 180" or "฿ 900"
 */
export function formatCurrency(amount: number, currency: string): string {
  const symbol = CURRENCY_SYMBOLS[currency] ?? currency
  const formatted = new Intl.NumberFormat('th-TH', {
    minimumFractionDigits: currency === 'JPY' || currency === 'KRW' || currency === 'VND' ? 0 : 2,
    maximumFractionDigits: currency === 'JPY' || currency === 'KRW' || currency === 'VND' ? 0 : 2,
  }).format(amount)
  return `${symbol} ${formatted}`
}

/**
 * Format with THB equivalent: "¥ 180 (≈ ฿ 900)"
 * Always shown for non-THB currencies
 */
export function formatWithTHB(
  amount: number,
  currency: string,
  thbAmount?: number
): string {
  const primary = formatCurrency(amount, currency)
  if (currency === 'THB' || thbAmount === undefined) return primary
  const thb = formatCurrency(thbAmount, 'THB')
  return `${primary} (≈ ${thb})`
}

/**
 * Convert amount to THB using exchange rates
 */
export function convertToTHB(
  amount: number,
  fromCurrency: string,
  rates: Record<string, number>
): number {
  if (fromCurrency === 'THB') return amount
  const rate = rates[fromCurrency]
  if (!rate) return amount
  // Rates are relative to USD, convert via USD if needed
  const thbPerUsd = rates['THB'] ?? 35
  const fromPerUsd = rate
  return (amount / fromPerUsd) * thbPerUsd
}

/**
 * Common destination currencies per country
 */
export const COUNTRY_CURRENCY: Record<string, string> = {
  CN: 'CNY',
  JP: 'JPY',
  KR: 'KRW',
  TH: 'THB',
  SG: 'SGD',
  MY: 'MYR',
  VN: 'VND',
  ID: 'IDR',
  PH: 'PHP',
  HK: 'HKD',
  TW: 'TWD',
  AU: 'AUD',
  NZ: 'AUD',
  US: 'USD',
  CA: 'USD',
  GB: 'GBP',
  DE: 'EUR',
  FR: 'EUR',
  IT: 'EUR',
  ES: 'EUR',
  CH: 'CHF',
  AE: 'AED',
  IN: 'INR',
}
