import { isAxiosError } from 'axios'
import { CalendarClock, Loader2, Video, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  cancelAppointment,
  fetchPatientAppointments,
  rescheduleAppointment,
  type MyAppointmentRow,
} from '../../api/appointmentApi'
import { fetchDoctorById, type AvailabilitySlotDto } from '../../api/doctorApi'
import { AppointmentStatusChip } from '../../components/AppointmentStatusChip'
import { DoctorApprovalChip } from '../../components/DoctorApprovalChip'
import { useAuth } from '../../context/AuthContext'
import { canJoinVideoSession } from '../../lib/appointmentJoin'
import toast from 'react-hot-toast'
import {
  appErrorBanner,
  appLink,
  appPageHeader,
  appPageTitle,
  appPageWrap,
  appTableHeadRow,
  appTableWrap,
} from '../../lib/uiTheme'

export default function PatientAppointmentsPage() {
  const { user, token } = useAuth()
  const [rows, setRows] = useState<MyAppointmentRow[]>([])
  const [loading, setLoading] = useState(true)
  const [cancellingId, setCancellingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const [rescheduleTarget, setRescheduleTarget] = useState<MyAppointmentRow | null>(null)
  const [doctorSlots, setDoctorSlots] = useState<AvailabilitySlotDto[]>([])
  const [rescheduleDate, setRescheduleDate] = useState('')
  const [selectedSlot, setSelectedSlot] = useState<AvailabilitySlotDto | null>(null)
  const [rescheduling, setRescheduling] = useState(false)
  const [loadingSlots, setLoadingSlots] = useState(false)

  const canReschedule = (a: MyAppointmentRow) => {
    return (
      a.status === 'PENDING_PAYMENT' ||
      a.status === 'PENDING' ||
      a.status === 'CONFIRMED'
    )
  }

  async function openRescheduleModal(a: MyAppointmentRow) {
    setRescheduleTarget(a)
    setRescheduleDate('')
    setSelectedSlot(null)
    setLoadingSlots(true)
    try {
      const doctor = await fetchDoctorById(a.doctorId)
      setDoctorSlots(doctor.availability.filter((s) => s.isAvailable))
    } catch {
      toast.error('Could not load doctor availability')
      setRescheduleTarget(null)
    } finally {
      setLoadingSlots(false)
    }
  }

  function getWeekday(dateStr: string): string {
    const d = new Date(dateStr + 'T00:00:00')
    return d.toLocaleDateString('en-US', { weekday: 'long' })
  }

  const filteredSlots = rescheduleDate
    ? doctorSlots.filter((s) => s.day === getWeekday(rescheduleDate))
    : []

  async function handleReschedule() {
    if (!rescheduleTarget || !selectedSlot || !rescheduleDate || !token) return
    setRescheduling(true)
    try {
      const { appointment } = await rescheduleAppointment(
        rescheduleTarget.id,
        {
          patientEmail: rescheduleTarget.patientEmail,
          appointmentDate: rescheduleDate,
          day: selectedSlot.day,
          startTime: selectedSlot.startTime,
          endTime: selectedSlot.endTime,
        },
        token,
      )
      setRows((prev) =>
        prev.map((row) =>
          row.id === rescheduleTarget.id
            ? {
                ...row,
                appointmentDateKey: appointment.appointmentDateKey,
                day: appointment.day,
                startTime: appointment.startTime,
                endTime: appointment.endTime,
                doctorApprovalStatus: appointment.doctorApprovalStatus,
              }
            : row,
        ),
      )
      toast.success('Appointment rescheduled')
      setRescheduleTarget(null)
    } catch (e) {
      const msg =
        e && typeof e === 'object' && 'response' in e
          ? (e as { response?: { data?: { message?: string | string[] } } })
              .response?.data?.message
          : undefined
      toast.error(
        typeof msg === 'string'
          ? msg
          : Array.isArray(msg)
            ? msg[0] ?? 'Could not reschedule'
            : 'Could not reschedule',
      )
    } finally {
      setRescheduling(false)
    }
  }

  const canCancel = (a: MyAppointmentRow) => {
    const isApproved = (a.doctorApprovalStatus ?? 'PENDING') === 'APPROVED'
    const isPaid = a.paymentStatus.trim().toLowerCase() === 'paid'
    if (isApproved || isPaid) return false
    return (
      a.status === 'PENDING_PAYMENT' ||
      a.status === 'PENDING' ||
      a.status === 'CONFIRMED'
    )
  }

  useEffect(() => {
    if (!user || !token) return
    let cancelled = false
    ;(async () => {
      setLoading(true)
      setError(null)
      try {
        const data = await fetchPatientAppointments(user.id, token)
        if (!cancelled) setRows(data)
      } catch (e) {
        if (!cancelled) {
          setError(
            isAxiosError(e)
              ? 'Could not load appointments.'
              : 'Something went wrong',
          )
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [user, token])

  const sorted = useMemo(
    () =>
      [...rows].sort((a, b) =>
        b.appointmentDateKey.localeCompare(a.appointmentDateKey),
      ),
    [rows],
  )

  async function handleCancel(a: MyAppointmentRow) {
    if (!token) return
    setCancellingId(a.id)
    try {
      await cancelAppointment(a.id, a.patientEmail, token)
      setRows((prev) =>
        prev.map((row) =>
          row.id === a.id
            ? {
                ...row,
                status: 'CANCELLED',
                paymentStatus:
                  row.paymentStatus === 'Paid'
                    ? 'Cancelled (refund pending)'
                    : 'Cancelled',
              }
            : row,
        ),
      )
      toast.success('Appointment cancelled')
    } catch (e) {
      const msg =
        e && typeof e === 'object' && 'response' in e
          ? (e as { response?: { data?: { message?: string | string[] } } })
              .response?.data?.message
          : undefined
      toast.error(
        typeof msg === 'string'
          ? msg
          : Array.isArray(msg)
            ? msg[0] ?? 'Could not cancel appointment'
            : 'Could not cancel appointment',
      )
    } finally {
      setCancellingId(null)
    }
  }

  return (
    <div className={appPageWrap}>
      <header className={appPageHeader}>
        <h1 className={appPageTitle}>My appointments</h1>
      </header>

      {error && <p className={appErrorBanner}>{error}</p>}

      {loading ? (
        <div className="flex items-center gap-2 text-slate-600">
          <Loader2 className="h-5 w-5 animate-spin text-sky-600" aria-hidden />
          Loading…
        </div>
      ) : (
        <div className={appTableWrap}>
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-slate-200 bg-sky-50/50">
              <tr className={appTableHeadRow}>
                <th className="px-4 py-3">Doctor</th>
                <th className="px-4 py-3">Specialization</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Time</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Doctor approval</th>
                <th className="px-4 py-3">Action</th>
                <th className="px-4 py-3">Session</th>
              </tr>
            </thead>
            <tbody>
              {sorted.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-slate-500">
                    No appointments yet.{' '}
                    <Link to="/find-doctor" className={appLink}>
                      Book a doctor
                    </Link>
                  </td>
                </tr>
              ) : (
                sorted.map((a) => (
                  <tr
                    key={a.id}
                    className="border-b border-slate-100 last:border-0"
                  >
                    <td className="px-4 py-3 font-medium text-slate-900">
                      {a.doctorName}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {a.doctorSpecialty || '—'}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {a.appointmentDateKey}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {a.startTime} – {a.endTime}
                    </td>
                    <td className="px-4 py-3">
                      <AppointmentStatusChip status={a.status} />
                    </td>
                    <td className="px-4 py-3">
                      <DoctorApprovalChip
                        status={a.doctorApprovalStatus ?? 'PENDING'}
                      />
                    </td>
                    <td className="px-4 py-3 space-x-2">
                      {canReschedule(a) && (
                        <button
                          type="button"
                          onClick={() => void openRescheduleModal(a)}
                          className="inline-flex items-center gap-1 rounded-xl border border-sky-200 bg-sky-50 px-3 py-1.5 text-xs font-semibold text-sky-700 hover:bg-sky-100"
                        >
                          <CalendarClock className="h-3.5 w-3.5" aria-hidden />
                          Reschedule
                        </button>
                      )}
                      {canCancel(a) ? (
                        <button
                          type="button"
                          onClick={() => void handleCancel(a)}
                          disabled={cancellingId === a.id}
                          className="inline-flex items-center rounded-xl border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {cancellingId === a.id ? 'Cancelling...' : 'Cancel'}
                        </button>
                      ) : !canReschedule(a) ? (
                        <span className="inline-flex items-center rounded-xl bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-500">
                          -
                        </span>
                      ) : null}
                    </td>
                    <td className="px-4 py-3">
                      {canJoinVideoSession(a) ? (
                        <Link
                          to={`/consultation/${a.id}`}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-sky-600 to-blue-600 px-3 py-1.5 text-xs font-semibold text-white shadow-md shadow-sky-500/30 transition hover:brightness-110"
                        >
                          <Video className="h-3.5 w-3.5" aria-hidden />
                          Join
                        </Link>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-xl bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-400">
                          <Video className="h-3.5 w-3.5" aria-hidden />
                          Join
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {rescheduleTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="reschedule-title"
        >
          <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <button
              type="button"
              onClick={() => setRescheduleTarget(null)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-700"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>

            <h2 id="reschedule-title" className="text-lg font-bold text-slate-900 mb-1">
              Reschedule appointment
            </h2>
            <p className="text-sm text-slate-500 mb-4">
              Dr. {rescheduleTarget.doctorName} &middot; currently{' '}
              {rescheduleTarget.appointmentDateKey} {rescheduleTarget.startTime}–{rescheduleTarget.endTime}
            </p>

            {loadingSlots ? (
              <div className="flex items-center gap-2 text-slate-600 py-8">
                <Loader2 className="h-5 w-5 animate-spin text-sky-600" aria-hidden />
                Loading availability…
              </div>
            ) : (
              <>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  New date
                </label>
                <input
                  type="date"
                  value={rescheduleDate}
                  onChange={(e) => {
                    setRescheduleDate(e.target.value)
                    setSelectedSlot(null)
                  }}
                  min={new Date().toISOString().slice(0, 10)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm mb-4 focus:border-sky-500 focus:ring-sky-500"
                />

                {rescheduleDate && filteredSlots.length === 0 && (
                  <p className="text-sm text-amber-600 mb-4">
                    No available slots for {getWeekday(rescheduleDate)}. Try another date.
                  </p>
                )}

                {filteredSlots.length > 0 && (
                  <>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Select a slot
                    </label>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {filteredSlots.map((s) => (
                        <button
                          key={`${s.day}-${s.startTime}-${s.endTime}`}
                          type="button"
                          onClick={() => setSelectedSlot(s)}
                          className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                            selectedSlot?.startTime === s.startTime &&
                            selectedSlot?.endTime === s.endTime
                              ? 'border-sky-500 bg-sky-50 text-sky-700'
                              : 'border-slate-200 bg-white text-slate-700 hover:border-sky-300'
                          }`}
                        >
                          {s.startTime} – {s.endTime}
                        </button>
                      ))}
                    </div>
                  </>
                )}

                <button
                  type="button"
                  onClick={() => void handleReschedule()}
                  disabled={!selectedSlot || !rescheduleDate || rescheduling}
                  className="w-full rounded-xl bg-gradient-to-r from-sky-600 to-blue-600 py-2.5 text-sm font-semibold text-white shadow-md shadow-sky-500/30 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {rescheduling ? 'Rescheduling…' : 'Confirm reschedule'}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
