import { isAxiosError } from 'axios'
import { Calendar, Loader2, Stethoscope } from 'lucide-react'
import { type FormEvent, useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import {
  cancelAppointment,
  fetchMyAppointments,
  type MyAppointmentRow,
} from '../api/appointmentApi'
import { AppointmentStatusChip } from '../components/AppointmentStatusChip'
import { DoctorApprovalChip } from '../components/DoctorApprovalChip'
import { LandingNavbar } from '../components/LandingNavbar'
import {
  appCardClass,
  appEmptyStateBox,
  appLink,
  appPageHeader,
  appPageSubtitle,
  appPageTitle,
  appCtaClass,
} from '../lib/uiTheme'

const shell =
  'mx-auto w-full max-w-[min(100%,92rem)] px-4 sm:px-6 lg:px-8'

export default function MyAppointmentsPage() {
  const [email, setEmail] = useState('')
  const [input, setInput] = useState('')
  const [rows, setRows] = useState<MyAppointmentRow[]>([])
  const [loading, setLoading] = useState(false)
  const [cancellingId, setCancellingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  function canCancel(a: MyAppointmentRow): boolean {
    return (
      a.status === 'PENDING_PAYMENT' ||
      a.status === 'PENDING' ||
      a.status === 'CONFIRMED'
    )
  }

  const load = useCallback(async (patientEmail: string) => {
    setLoading(true)
    setError(null)
    try {
      const data = await fetchMyAppointments(patientEmail)
      setRows(data)
    } catch (e) {
      if (isAxiosError(e)) {
        const msg = (e.response?.data as { message?: string })?.message
        setError(typeof msg === 'string' ? msg : 'Could not load appointments')
      } else {
        setError('Could not load appointments')
      }
      setRows([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const stored =
      typeof window !== 'undefined'
        ? window.localStorage.getItem('patientEmail') ?? ''
        : ''
    setEmail(stored)
    setInput(stored)
    if (stored) void load(stored)
  }, [load])

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const v = input.trim().toLowerCase()
    if (!v) return
    window.localStorage.setItem('patientEmail', v)
    setEmail(v)
    void load(v)
  }

  async function handleCancel(a: MyAppointmentRow) {
    const activeEmail = email || input.trim().toLowerCase() || a.patientEmail
    if (!activeEmail) {
      toast.error('Email required to cancel this appointment')
      return
    }
    setCancellingId(a.id)
    try {
      await cancelAppointment(a.id, activeEmail)
      toast.success('Appointment cancelled')
      await load(activeEmail)
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
    <div className="page-futuristic min-h-screen text-slate-900">
      <LandingNavbar />

      <main className={`py-8 sm:py-10 ${shell}`}>
        <header className={appPageHeader}>
          <h1 className={appPageTitle}>My appointments</h1>
          <p className={appPageSubtitle}>
            Enter the email you used when booking to see pending and past visits.
          </p>
        </header>

        <form
          onSubmit={handleSubmit}
          className="mt-6 flex max-w-xl flex-col gap-3 sm:flex-row sm:items-end"
        >
          <div className="min-w-0 flex-1">
            <label
              htmlFor="appt-email"
              className="mb-1 block text-xs font-semibold text-slate-600"
            >
              Email
            </label>
            <input
              id="appt-email"
              type="email"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-xl border border-slate-200 bg-white/90 px-4 py-2.5 text-sm shadow-sm outline-none ring-sky-400/20 focus:border-sky-400 focus:ring-2"
              autoComplete="email"
            />
          </div>
          <button type="submit" className={`rounded-xl px-6 py-2.5 text-sm font-semibold ${appCtaClass}`}>
            Load
          </button>
        </form>

        {error && (
          <p className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            {error}
          </p>
        )}

        <div className="mt-10">
          {loading ? (
            <div className="flex items-center gap-2 text-slate-600">
              <Loader2 className="h-5 w-5 animate-spin text-sky-600" aria-hidden />
              Loading…
            </div>
          ) : !email ? (
            <p className="text-sm text-slate-500">
              Enter your email to load appointments.
            </p>
          ) : rows.length === 0 ? (
            <div className={appEmptyStateBox}>
              <Stethoscope className="h-12 w-12 text-sky-500" aria-hidden />
              <p className="mt-4 text-lg font-bold text-slate-900">
                No appointments yet
              </p>
              <p className="mt-2 max-w-md text-sm text-slate-600">
                Book a slot from Find a doctor. It will show up here as Pending payment until
                checkout is wired.
              </p>
              <Link
                to="/find-doctor"
                className={`mt-6 rounded-xl px-5 py-2.5 text-sm font-semibold ${appCtaClass}`}
              >
                Find a doctor
              </Link>
            </div>
          ) : (
            <ul className="grid gap-4 sm:grid-cols-2">
              {rows.map((a) => (
                <li key={a.id} className={`${appCardClass} p-5`}>
                  <p className="font-semibold text-slate-900">{a.doctorName}</p>
                  <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-600">
                    <Calendar className="h-4 w-4 shrink-0 text-sky-600" aria-hidden />
                    {a.appointmentDateKey} · {a.day} · {a.startTime} – {a.endTime}
                  </p>
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                    <AppointmentStatusChip status={a.status} />
                    <DoctorApprovalChip
                      status={a.doctorApprovalStatus ?? 'PENDING'}
                    />
                    <span className="rounded-full bg-amber-50 px-2.5 py-1 font-medium text-amber-900">
                      {a.paymentStatus}
                    </span>
                    <span className="rounded-full bg-sky-50 px-2.5 py-1 font-medium text-sky-900">
                      LKR {a.consultationFee.toLocaleString()}
                    </span>
                  </div>
                  {canCancel(a) ? (
                    <div className="mt-4">
                      <button
                        type="button"
                        onClick={() => void handleCancel(a)}
                        disabled={cancellingId === a.id}
                        className="inline-flex rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {cancellingId === a.id ? 'Cancelling...' : 'Cancel'}
                      </button>
                    </div>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </div>

        <p className="mt-10 text-center text-sm text-slate-500">
          Signed-in patients can use the{' '}
          <Link to="/dashboard/patient/appointments" className={appLink}>
            dashboard appointments
          </Link>{' '}
          view for a full table.
        </p>
      </main>
    </div>
  )
}
