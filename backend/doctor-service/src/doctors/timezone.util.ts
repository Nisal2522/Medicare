import moment from 'moment-timezone';

/** All appointment times in this product are interpreted in Sri Lanka local time */
export const COLOMBO_TZ = 'Asia/Colombo';

/**
 * Attaches IANA timezone metadata for API clients (times are wall-clock in Colombo).
 */
export function withColomboZone<T extends { startTime: string; endTime: string }>(
  slot: T,
): T & { timeZone: typeof COLOMBO_TZ } {
  return {
    ...slot,
    timeZone: COLOMBO_TZ,
  };
}

/**
 * Validates that start is before end when parsed on a reference day in Asia/Colombo.
 * Used for future booking validation; keeps time math in the correct zone.
 */
export function isSlotOrderValid(startTime: string, endTime: string): boolean {
  const dayRef = moment.tz('2000-06-15', COLOMBO_TZ);
  const base = dayRef.format('YYYY-MM-DD');
  const a = moment.tz(`${base} ${startTime}`, ['h:mm A', 'HH:mm'], true, COLOMBO_TZ);
  const b = moment.tz(`${base} ${endTime}`, ['h:mm A', 'HH:mm'], true, COLOMBO_TZ);
  return a.isValid() && b.isValid() && a.isBefore(b);
}
