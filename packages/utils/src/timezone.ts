import { format } from 'date-fns'
import { toZonedTime } from 'date-fns-tz'
import { th } from 'date-fns/locale'

/**
 * Get current local time in a specific timezone
 */
export function getLocalTime(timezone: string): Date {
  return toZonedTime(new Date(), timezone)
}

/**
 * Format a UTC date in a specific timezone
 */
export function formatInTimezone(
  date: Date | string,
  timezone: string,
  pattern = 'HH:mm'
): string {
  const zonedDate = toZonedTime(new Date(date), timezone)
  return format(zonedDate, pattern, { locale: th })
}

/**
 * Get timezone offset label: "UTC+7", "UTC+8"
 */
export function getTimezoneLabel(timezone: string): string {
  const offset = new Intl.DateTimeFormat('en', {
    timeZone: timezone,
    timeZoneName: 'shortOffset',
  })
    .formatToParts(new Date())
    .find((p) => p.type === 'timeZoneName')?.value
  return offset ?? timezone
}

/**
 * Common timezones for TripFlow destinations
 */
export const DESTINATION_TIMEZONES: Record<string, string> = {
  Bangkok: 'Asia/Bangkok',
  Beijing: 'Asia/Shanghai',
  Shanghai: 'Asia/Shanghai',
  Shenzhen: 'Asia/Shanghai',
  Guangzhou: 'Asia/Shanghai',
  Chengdu: 'Asia/Shanghai',
  Xian: 'Asia/Shanghai',
  Guilin: 'Asia/Shanghai',
  Kunming: 'Asia/Shanghai',
  Chongqing: 'Asia/Shanghai',
  Tokyo: 'Asia/Tokyo',
  Osaka: 'Asia/Tokyo',
  Kyoto: 'Asia/Tokyo',
  Seoul: 'Asia/Seoul',
  Busan: 'Asia/Seoul',
  Paris: 'Europe/Paris',
  London: 'Europe/London',
  Rome: 'Europe/Rome',
  Barcelona: 'Europe/Madrid',
  Singapore: 'Asia/Singapore',
  'Kuala Lumpur': 'Asia/Kuala_Lumpur',
  'Hong Kong': 'Asia/Hong_Kong',
  Taipei: 'Asia/Taipei',
}
