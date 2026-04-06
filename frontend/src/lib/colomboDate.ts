/** Weekday long name (e.g. Monday) in Asia/Colombo for a JS Date. */
export function colomboWeekdayName(d: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Colombo',
    weekday: 'long',
  }).format(d)
}

/** YYYY-MM-DD in Asia/Colombo for a JS Date. */
export function formatColomboYmd(d: Date): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Colombo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(d)
  const y = parts.find((p) => p.type === 'year')?.value
  const m = parts.find((p) => p.type === 'month')?.value
  const day = parts.find((p) => p.type === 'day')?.value
  if (!y || !m || !day) return new Date().toISOString().slice(0, 10)
  return `${y}-${m}-${day}`
}

/** Weekday name in Asia/Colombo for YYYY-MM-DD (matches appointment-service logic). */
export function weekdayFromYmdColombo(yyyyMmDd: string): string | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(yyyyMmDd.trim())
  if (!m) return null
  const [, y, mo, d] = m
  const date = new Date(
    Date.UTC(Number(y), Number(mo) - 1, Number(d), 12, 0, 0),
  )
  return colomboWeekdayName(date)
}

/** Next calendar date (from today, inclusive) whose weekday in Colombo matches. */
export function nextCalendarDateForWeekday(weekdayFull: string): string {
  const today = new Date()
  for (let i = 0; i < 42; i++) {
    const d = new Date(today.getTime() + i * 86_400_000)
    if (colomboWeekdayName(d) === weekdayFull) {
      return formatColomboYmd(d)
    }
  }
  return formatColomboYmd(today)
}
