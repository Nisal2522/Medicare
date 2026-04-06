import { isAxiosError } from 'axios'
import { Clock3, Loader2, Plus, Trash2 } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import {
  type DayAvailabilityPayload,
  fetchDoctorById,
  fetchDoctorMe,
  patchDoctorAvailability,
} from '../../api/doctorApi'
import { dashboardCardClass } from '../../components/dashboardShell'
import { useAuth } from '../../context/AuthContext'
import { WEEKDAYS_ORDER, type Weekday } from '../../lib/weekdays'

type SlotRow = { startTime: string; endTime: string; maxPatients: number }

type DayEditor = {
  day: Weekday
  closed: boolean
  slots: SlotRow[]
}

const DURATION_OPTIONS = [
  { id: '15', label: '15 min' },
  { id: '30', label: '30 min' },
  { id: '45', label: '45 min' },
  { id: '60', label: '60 min' },
] as const

function buildDaysFromProfile(
  availability: {
    day: string
    startTime: string
    endTime: string
    maxPatients: number
    isAvailable: boolean
  }[],
): DayEditor[] {
  return WEEKDAYS_ORDER.map((day) => {
    const slots = availability.filter((s) => s.day === day && s.isAvailable)
    if (slots.length === 0) {
      return { day, closed: true, slots: [] }
    }
    return {
      day,
      closed: false,
      slots: slots.map((s) => ({
        startTime: s.startTime,
        endTime: s.endTime,
        maxPatients: s.maxPatients,
      })),
    }
  })
}

function toPayload(days: DayEditor[]): DayAvailabilityPayload[] {
  return days.map((d) => ({
    day: d.day,
    closed: d.closed,
    slots: d.closed ? [] : d.slots,
  }))
}

export default function DoctorAvailabilityPage() {
  const { token, user } = useAuth()
  const [dayEditors, setDayEditors] = useState<DayEditor[]>(() =>
    WEEKDAYS_ORDER.map((day) => ({
      day,
      closed: true,
      slots: [],
    })),
  )
  const [availLoading, setAvailLoading] = useState(true)
  const [availSaving, setAvailSaving] = useState(false)
  const [newDay, setNewDay] = useState<Weekday>('Monday')
  const [newStartTime, setNewStartTime] = useState('')
  const [newEndTime, setNewEndTime] = useState('')
  const [newDuration, setNewDuration] = useState<(typeof DURATION_OPTIONS)[number]['id']>('30')
  const [newMaxPatients, setNewMaxPatients] = useState(1)

  const loadAvailability = useCallback(async () => {
    if (!token) return
    setAvailLoading(true)
    try {
      const doc = await fetchDoctorMe(token)
      setDayEditors(buildDaysFromProfile(doc.availability))
    } catch (e) {
      // Fallback for legacy sessions where JWT sub and stored doctor profile id differ.
      if (user?.id) {
        try {
          const doc = await fetchDoctorById(user.id)
          setDayEditors(buildDaysFromProfile(doc.availability))
          return
        } catch {
          /* fallthrough to main error */
        }
      }
      const msg = isAxiosError(e)
        ? (e.response?.data as { message?: string | string[] })?.message
        : undefined
      toast.error(
        typeof msg === 'string'
          ? msg
          : Array.isArray(msg)
            ? msg.join(', ')
            : 'Could not load your doctor profile from current session.',
      )
    } finally {
      setAvailLoading(false)
    }
  }, [token, user?.id])

  useEffect(() => {
    void loadAvailability()
  }, [loadAvailability])

  function removeSlot(day: Weekday, index: number) {
    setDayEditors((prev) =>
      prev.map((d) =>
        d.day === day
          ? {
              ...d,
              slots: d.slots.filter((_, i) => i !== index),
              closed: d.slots.length - 1 <= 0,
            }
          : d,
      ),
    )
  }

  function addSlotFromEditor() {
    if (!newStartTime.trim() || !newEndTime.trim()) {
      toast.error('Select start time and end time')
      return
    }

    const normalizedStart = newStartTime
    const normalizedEnd = newEndTime
    const max = Math.max(1, Number(newMaxPatients) || 1)

    setDayEditors((prev) =>
      prev.map((d) =>
        d.day === newDay
          ? {
              ...d,
              closed: false,
              slots: [
                ...d.slots,
                {
                  startTime: normalizedStart,
                  endTime: normalizedEnd,
                  maxPatients: max,
                },
              ],
            }
          : d,
      ),
    )
    setNewStartTime('')
    setNewEndTime('')
    toast.success(`Slot added for ${newDay}`)
  }

  async function saveAvailability() {
    if (!token) return
    for (const d of dayEditors) {
      if (!d.closed && d.slots.length === 0) {
        toast.error(`Add at least one slot for ${d.day} or mark the day closed.`)
        return
      }
    }
    setAvailSaving(true)
    try {
      await patchDoctorAvailability(token, toPayload(dayEditors))
      toast.success('Availability saved')
      void loadAvailability()
    } catch (e) {
      if (isAxiosError(e) && e.response?.status === 403) {
        toast.error('JWT must be a DOCTOR and match your doctor profile id.')
      } else if (isAxiosError(e)) {
        const msg = (e.response?.data as { message?: string | string[] })?.message
        toast.error(
          typeof msg === 'string'
            ? msg
            : Array.isArray(msg)
              ? msg.join(', ')
              : 'Save failed. Check doctor-service and auth.',
        )
      } else {
        toast.error('Save failed. Check doctor-service and auth.')
      }
    } finally {
      setAvailSaving(false)
    }
  }

  const groupedSlots = useMemo(
    () =>
      dayEditors
        .filter((d) => d.slots.length > 0)
        .map((d) => ({
          day: d.day,
          slots: d.slots,
        })),
    [dayEditors],
  )

  return (
    <div className="space-y-8">
      <header className="border-b border-slate-200/60 pb-6">
        <p className="text-sm font-medium text-slate-500">
          {new Intl.DateTimeFormat('en-LK', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            timeZone: 'Asia/Colombo',
          }).format(new Date())}
        </p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          Availability
        </h1>
      </header>

      {availLoading ? (
        <div className="flex justify-center py-20 text-slate-500">
          <Loader2 className="h-10 w-10 animate-spin" aria-hidden />
        </div>
      ) : (
        <>
          <section className={`${dashboardCardClass} p-5 sm:p-6`}>
            <h2 className="text-lg font-bold text-slate-900">Add New Slot</h2>
            <div className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-5">
              <label className="flex flex-col gap-1 text-xs font-semibold text-slate-500">
                Date
                <select
                  value={newDay}
                  onChange={(e) => setNewDay(e.target.value as Weekday)}
                  className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900"
                >
                  {WEEKDAYS_ORDER.map((day) => (
                    <option key={day} value={day}>
                      {day}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1 text-xs font-semibold text-slate-500">
                Start Time
                <input
                  type="time"
                  value={newStartTime}
                  onChange={(e) => setNewStartTime(e.target.value)}
                  className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900"
                />
              </label>
              <label className="flex flex-col gap-1 text-xs font-semibold text-slate-500">
                End Time
                <input
                  type="time"
                  value={newEndTime}
                  onChange={(e) => setNewEndTime(e.target.value)}
                  className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900"
                />
              </label>
              <label className="flex flex-col gap-1 text-xs font-semibold text-slate-500">
                Duration
                <select
                  value={newDuration}
                  onChange={(e) =>
                    setNewDuration(
                      e.target.value as (typeof DURATION_OPTIONS)[number]['id'],
                    )
                  }
                  className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900"
                >
                  {DURATION_OPTIONS.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1 text-xs font-semibold text-slate-500">
                Max Patients Per Slot
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={newMaxPatients}
                  onChange={(e) => setNewMaxPatients(Number(e.target.value) || 1)}
                  className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900"
                />
              </label>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={addSlotFromEditor}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md transition hover:brightness-105"
              >
                <Plus className="h-4 w-4" aria-hidden />
                Add Slot
              </button>
              <button
                type="button"
                disabled={availSaving}
                onClick={() => void saveAvailability()}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
              >
                {availSaving ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                ) : null}
                Save availability
              </button>
            </div>
          </section>

          <section className={`${dashboardCardClass} p-5 sm:p-6`}>
            <h2 className="text-lg font-bold text-slate-900">Current Slots</h2>
            {groupedSlots.length === 0 ? (
              <p className="mt-4 rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
                No slots added yet.
              </p>
            ) : (
              <div className="mt-4 space-y-6">
                {groupedSlots.map((g) => (
                  <div key={g.day} className="space-y-2">
                    <p className="text-sm font-semibold text-slate-700">{g.day}</p>
                    <ul className="space-y-2">
                      {g.slots.map((slot, i) => (
                        <li
                          key={`${g.day}-${slot.startTime}-${slot.endTime}-${i}`}
                          className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2.5"
                        >
                          <div className="flex items-center gap-3">
                            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-sky-100 text-sky-700">
                              <Clock3 className="h-4 w-4" aria-hidden />
                            </span>
                            <div>
                              <p className="text-sm font-semibold text-slate-900">
                                {slot.startTime} - {slot.endTime}
                              </p>
                              <p className="text-xs text-slate-500">
                                Max {slot.maxPatients} patient
                                {slot.maxPatients === 1 ? '' : 's'}
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeSlot(g.day, i)}
                            className="rounded-lg p-2 text-rose-500 transition hover:bg-rose-50 hover:text-rose-700"
                            aria-label={`Remove slot ${slot.startTime}`}
                          >
                            <Trash2 className="h-4 w-4" aria-hidden />
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  )
}
