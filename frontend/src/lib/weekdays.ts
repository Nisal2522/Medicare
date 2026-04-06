/** Canonical weekday names (matches doctor-service / booking). */
export const WEEKDAYS_ORDER = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
] as const

export type Weekday = (typeof WEEKDAYS_ORDER)[number]
