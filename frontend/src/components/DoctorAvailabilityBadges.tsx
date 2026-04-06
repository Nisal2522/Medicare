import { CalendarDays, Clock } from 'lucide-react'
import type { AvailabilitySlotDto } from '../api/doctorApi'

const DAY_SHORT: Record<string, string> = {
  Sunday: 'Sun',
  Monday: 'Mon',
  Tuesday: 'Tue',
  Wednesday: 'Wed',
  Thursday: 'Thu',
  Friday: 'Fri',
  Saturday: 'Sat',
}

function shortDay(day: string): string {
  return DAY_SHORT[day] ?? day.slice(0, 3)
}

type Props = {
  availability: AvailabilitySlotDto[]
  timeZone: string
  onSlotSelect: (slot: AvailabilitySlotDto) => void
}

export function DoctorAvailabilityBadges({
  availability,
  timeZone,
  onSlotSelect,
}: Props) {
  const openSlots = availability.filter((s) => s.isAvailable)

  if (openSlots.length === 0) {
    return (
      <p className="text-xs font-medium text-slate-500">
        No slots available this week
      </p>
    )
  }

  const uniqueDays = [...new Set(openSlots.map((s) => s.day))]

  return (
    <div className="mt-3 space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {uniqueDays.map((day) => (
          <span
            key={day}
            className="inline-flex items-center rounded-md bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-600 ring-1 ring-blue-100"
          >
            {shortDay(day)}
          </span>
        ))}
      </div>
      <p className="flex items-center gap-1 text-[11px] font-semibold text-slate-600">
        <Clock className="h-3.5 w-3.5 text-sky-600" aria-hidden />
        Available slots
        <span className="font-normal text-slate-400">({timeZone})</span>
      </p>
      <ul className="flex flex-col gap-1.5">
        {openSlots.map((s, i) => (
          <li key={`${s.day}-${s.startTime}-${i}`}>
            <button
              type="button"
              onClick={() => onSlotSelect(s)}
              className="flex w-full items-center justify-between gap-2 rounded-lg border border-sky-100 bg-sky-50/80 px-3 py-2 text-left text-xs font-medium text-slate-800 transition hover:border-sky-200 hover:bg-sky-50"
            >
              <span className="inline-flex items-center gap-1.5">
                <CalendarDays className="h-3.5 w-3.5 shrink-0 text-sky-600" aria-hidden />
                {s.day}
              </span>
              <span className="text-sky-800">
                {s.startTime} – {s.endTime}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
