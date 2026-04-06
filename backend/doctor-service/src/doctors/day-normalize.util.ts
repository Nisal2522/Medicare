/** Normalize user input (e.g. Mon, monday, MONDAY) to canonical English day name for DB queries */
const FULL_DAYS = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
] as const;

const SHORT_TO_FULL: Record<string, (typeof FULL_DAYS)[number]> = {
  sun: 'Sunday',
  mon: 'Monday',
  tue: 'Tuesday',
  wed: 'Wednesday',
  thu: 'Thursday',
  fri: 'Friday',
  sat: 'Saturday',
};

export function normalizeDayFilter(input: string): string | null {
  const raw = input.trim().toLowerCase();
  if (!raw) return null;

  const short = raw.slice(0, 3);
  if (SHORT_TO_FULL[short] !== undefined) {
    return SHORT_TO_FULL[short];
  }

  for (const d of FULL_DAYS) {
    if (d.toLowerCase() === raw) return d;
  }

  return null;
}
