import { isAxiosError } from 'axios'
import { Loader2, Video } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  cancelAppointment,
  fetchPatientAppointments,
  type MyAppointmentRow,
} from '../../api/appointmentApi'
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
                    <td className="px-4 py-3">
                      {canCancel(a) ? (
                        <button
                          type="button"
                          onClick={() => void handleCancel(a)}
                          disabled={cancellingId === a.id}
                          className="inline-flex items-center rounded-xl border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {cancellingId === a.id ? 'Cancelling...' : 'Cancel'}
                        </button>
                      ) : (
                        <span className="inline-flex items-center rounded-xl bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-500">
                          -
                        </span>
                      )}
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
    </div>
  )
}
