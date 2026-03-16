import { format } from 'date-fns'
import { th } from 'date-fns/locale'

const BUDDHIST_ERA_OFFSET = 543

/**
 * Format date in Thai locale
 * @param date - Date to format
 * @param useBuddhistEra - If true, year shown as Buddhist Era (พ.ศ.) +543
 */
export function formatThaiDate(
  date: Date | string | number,
  pattern = 'EEEE dd MMMM yyyy',
  useBuddhistEra = false
): string {
  const d = new Date(date)
  const formatted = format(d, pattern, { locale: th })

  if (useBuddhistEra) {
    const ceYear = d.getFullYear()
    const beYear = ceYear + BUDDHIST_ERA_OFFSET
    return formatted.replace(ceYear.toString(), beYear.toString())
  }

  return formatted
}

/**
 * Short Thai date: "จ. 16 มี.ค."
 */
export function formatThaiShort(date: Date | string | number): string {
  return format(new Date(date), 'E dd MMM', { locale: th })
}

/**
 * Thai day name only: "จันทร์", "อังคาร" etc.
 */
export function formatThaiDayName(date: Date | string | number): string {
  return format(new Date(date), 'EEEE', { locale: th })
}

/**
 * Thai month name only: "มีนาคม", "เมษายน" etc.
 */
export function formatThaiMonthName(date: Date | string | number): string {
  return format(new Date(date), 'MMMM', { locale: th })
}

/**
 * Get CE and BE year for a date
 */
export function getThaiYear(date: Date | string | number): { ce: number; be: number } {
  const ce = new Date(date).getFullYear()
  return { ce, be: ce + BUDDHIST_ERA_OFFSET }
}

/**
 * Format for display: "วันที่ 16 มีนาคม 2569 (พ.ศ.)"
 */
export function formatThaiFull(date: Date | string | number): string {
  const d = new Date(date)
  const day = format(d, 'dd', { locale: th })
  const month = format(d, 'MMMM', { locale: th })
  const beYear = d.getFullYear() + BUDDHIST_ERA_OFFSET
  return `วันที่ ${day} ${month} ${beYear}`
}

/**
 * Time range in Thai: "09:00 - 11:30 น."
 */
export function formatThaiTimeRange(start: string, end?: string): string {
  if (!end) return `${start} น.`
  return `${start} - ${end} น.`
}

/**
 * Days until departure (or relative status)
 */
export function getTripCountdown(
  startDate: Date,
  endDate: Date
): {
  status: 'upcoming' | 'active' | 'completed'
  daysUntilDeparture?: number
  currentDayNumber?: number
  totalDays?: number
  label: string
} {
  const now = new Date()
  const start = new Date(startDate)
  const end = new Date(endDate)

  const totalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1

  if (now < start) {
    const daysUntilDeparture = Math.ceil(
      (start.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    )
    return {
      status: 'upcoming',
      daysUntilDeparture,
      totalDays,
      label: `ออกเดินทางใน ${daysUntilDeparture} วัน`,
    }
  }

  if (now >= start && now <= end) {
    const currentDayNumber =
      Math.ceil((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
    return {
      status: 'active',
      currentDayNumber,
      totalDays,
      label: `วันที่ ${currentDayNumber} ของทริป`,
    }
  }

  return {
    status: 'completed',
    totalDays,
    label: 'เดินทางกลับแล้ว',
  }
}
