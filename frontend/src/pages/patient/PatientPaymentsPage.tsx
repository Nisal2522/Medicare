import { isAxiosError } from 'axios'
import {
  ArrowRight,
  Calendar,
  CreditCard,
  Loader2,
  Stethoscope,
  Video,
  Wallet,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  fetchPatientAppointments,
  type MyAppointmentRow,
} from '../../api/appointmentApi'
import { reconcilePaymentIntentByAppointment } from '../../api/paymentApi'
import { dashboardCardClass } from '../../components/dashboardShell'
import {
  PaymentPopupModal,
  type PaymentContext,
} from '../../components/PaymentPopupModal'
import { useAuth } from '../../context/AuthContext'
import { canJoinVideoSession } from '../../lib/appointmentJoin'
import {
  appPageHeader,
  appPageTitle,
  appPageWrap,
  appSectionEyebrow,
} from '../../lib/uiTheme'

function formatMoneyMajor(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: currency.length === 3 ? currency : 'LKR',
      minimumFractionDigits: 2,
    }).format(amount)
  } catch {
    return `${currency} ${amount.toFixed(2)}`
  }
}

function formatAppointmentDateKey(key: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(key.trim())
  if (!m) return key
  const y = Number(m[1])
  const mo = Number(m[2]) - 1
  const d = Number(m[3])
  return new Date(y, mo, d).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function mapPaymentStatus(a: MyAppointmentRow): 'pending' | 'paid' | 'refunded' | 'failed' {
  const raw = (a.paymentStatus || '').trim().toLowerCase()
  if (raw.includes('paid')) return 'paid'
  if (raw.includes('refund')) return 'refunded'
  if (raw.includes('fail')) return 'failed'
  return 'pending'
}

function paymentStatusMeta(
  status: 'pending' | 'paid' | 'refunded' | 'failed',
): { label: string; className: string } {
  switch (status) {
    case 'paid':
      return {
        label: 'Paid',
        className:
          'bg-emerald-50 text-emerald-800 ring-1 ring-inset ring-emerald-200/80',
      }
    case 'pending':
      return {
        label: 'Pending',
        className:
          'bg-amber-50 text-amber-900 ring-1 ring-inset ring-amber-200/80',
      }
    case 'failed':
      return {
        label: 'Failed',
        className: 'bg-rose-50 text-rose-800 ring-1 ring-inset ring-rose-200/80',
      }
    case 'refunded':
      return {
        label: 'Refunded',
        className: 'bg-slate-100 text-slate-700 ring-1 ring-inset ring-slate-200/80',
      }
    default:
      return {
        label: status,
        className: 'bg-slate-100 text-slate-700 ring-1 ring-inset ring-slate-200/80',
      }
  }
}

function doctorInitials(name: string): string {
  const parts = name.replace(/^Dr\.?\s*/i, '').trim().split(/\s+/)
  if (parts.length >= 2) {
    return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase()
  }
  return (parts[0]?.slice(0, 2) ?? '?').toUpperCase()
}

export default function PatientPaymentsPage() {
  const { user, token } = useAuth()
  const [appointments, setAppointments] = useState<MyAppointmentRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [paymentPopup, setPaymentPopup] = useState<PaymentContext | null>(null)

  useEffect(() => {
    if (!user?.id || !token) {
      setLoading(false)
      return
    }
    let cancelled = false
    ;(async () => {
      setLoading(true)
      setError(null)
      try {
        const data = await fetchPatientAppointments(user.id, token)

        const pending = data.filter((a) => mapPaymentStatus(a) === 'pending')
        if (pending.length > 0) {
          await Promise.allSettled(
            pending.slice(0, 12).map((a) =>
              reconcilePaymentIntentByAppointment({
                appointmentId: a.id,
                patientEmail: a.patientEmail,
              }),
            ),
          )
        }

        const refreshed =
          pending.length > 0
            ? await fetchPatientAppointments(user.id, token)
            : data

        const sorted = [...refreshed].sort((a, b) => {
          const da = a.createdAt ? new Date(a.createdAt).getTime() : 0
          const db = b.createdAt ? new Date(b.createdAt).getTime() : 0
          return db - da
        })
        if (!cancelled) setAppointments(sorted)
      } catch (e) {
        if (!cancelled) {
          setError(
            isAxiosError(e) ? 'Could not load payments.' : 'Something went wrong.',
          )
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [user?.id, token])

  const stats = useMemo(() => {
    let pendingCount = 0
    let paidCount = 0
    let paidTotal = 0
    for (const a of appointments) {
      const ps = mapPaymentStatus(a)
      const fee = Number(a.consultationFee) || 0
      if (ps === 'pending') pendingCount += 1
      if (ps === 'paid') {
        paidCount += 1
        paidTotal += fee
      }
    }
    return { pendingCount, paidCount, paidTotal, total: appointments.length }
  }, [appointments])

  return (
    <div className={appPageWrap}>
      <header className={appPageHeader}>
        <p className={appSectionEyebrow}>Billing</p>
        <h1 className={`mt-2 flex items-center gap-3 ${appPageTitle}`}>
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-blue-600 text-white shadow-lg shadow-sky-500/25">
            <Wallet className="h-6 w-6" aria-hidden strokeWidth={1.75} />
          </span>
          Payments & visits
        </h1>
      </header>

      {!loading && !error && appointments.length > 0 ? (
        <div className="mb-8 grid gap-4 sm:grid-cols-3">
          <div
            className={`${dashboardCardClass} border-t-4 border-t-sky-500 p-5 shadow-card-soft`}
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Total visits
            </p>
            <p className="mt-2 text-3xl font-bold tabular-nums text-slate-900">
              {stats.total}
            </p>
          </div>
          <div
            className={`${dashboardCardClass} border-t-4 border-t-amber-400 p-5 shadow-card-soft`}
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Awaiting payment
            </p>
            <p className="mt-2 text-3xl font-bold tabular-nums text-amber-900">
              {stats.pendingCount}
            </p>
          </div>
          <div
            className={`${dashboardCardClass} border-t-4 border-t-emerald-500 p-5 shadow-card-soft`}
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Paid (fees total)
            </p>
            <p className="mt-2 text-2xl font-bold tabular-nums text-emerald-800 sm:text-3xl">
              {formatMoneyMajor(stats.paidTotal, 'LKR')}
            </p>
            <p className="mt-1 text-xs text-slate-500">{stats.paidCount} settled</p>
          </div>
        </div>
      ) : null}

      <div className={`${dashboardCardClass} overflow-hidden shadow-card-soft`}>
        {loading ? (
          <div className="flex flex-col items-center justify-center gap-3 py-20 text-slate-600">
            <Loader2 className="h-8 w-8 animate-spin text-sky-600" aria-hidden />
            <p className="text-sm font-medium">Loading your billing history…</p>
          </div>
        ) : error ? (
          <p className="py-16 text-center text-sm text-rose-600">{error}</p>
        ) : appointments.length === 0 ? (
          <div className="py-16 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
              <Wallet className="h-7 w-7" aria-hidden />
            </div>
            <p className="mt-4 text-sm font-semibold text-slate-800">No payments yet</p>
            <p className="mx-auto mt-2 max-w-sm text-sm text-slate-500">
              When you book a consultation, it will appear here with payment status and quick
              actions.
            </p>
            <Link
              to="/find-doctor"
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-sky-500/20 transition hover:bg-sky-500"
            >
              Find a doctor
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>
        ) : (
          <ul className="divide-y divide-slate-100/90">
            {appointments.map((a) => {
              const pay = mapPaymentStatus(a)
              const meta = paymentStatusMeta(pay)
              const fee = Number(a.consultationFee) || 0
              const refShort = `APT-${a.id.slice(-8).toUpperCase()}`
              const canJoin = canJoinVideoSession(a)
              const needsPay =
                a.status !== 'CANCELLED' &&
                (a.status === 'PENDING_PAYMENT' || pay === 'pending')

              return (
                <li
                  key={a.id}
                  className="transition-colors hover:bg-slate-50/80"
                >
                  <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:gap-6 sm:p-5">
                    <div className="flex min-w-0 flex-1 gap-4">
                      <div
                        className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-100 to-indigo-100 text-base font-bold text-sky-800 ring-2 ring-white shadow-sm"
                        aria-hidden
                      >
                        {doctorInitials(a.doctorName)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="text-base font-semibold leading-snug text-slate-900 sm:text-lg">
                            Consultation · {a.doctorName}
                          </h2>
                          {a.doctorSpecialty ? (
                            <span className="hidden rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600 sm:inline">
                              {a.doctorSpecialty}
                            </span>
                          ) : null}
                        </div>
                        {a.doctorSpecialty ? (
                          <p className="mt-0.5 text-sm text-slate-500 sm:hidden">
                            {a.doctorSpecialty}
                          </p>
                        ) : null}
                        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-600">
                          <span className="inline-flex items-center gap-1.5">
                            <Calendar
                              className="h-4 w-4 shrink-0 text-sky-600"
                              strokeWidth={1.75}
                              aria-hidden
                            />
                            {formatAppointmentDateKey(a.appointmentDateKey)}
                            <span className="text-slate-400">·</span>
                            {a.startTime} – {a.endTime}
                          </span>
                          <span className="inline-flex items-center gap-1.5 text-slate-400">
                            <Stethoscope
                              className="h-3.5 w-3.5 shrink-0 opacity-70"
                              aria-hidden
                            />
                            <span className="font-mono text-xs tracking-tight text-slate-500">
                              {refShort}
                            </span>
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-3 border-t border-slate-100 pt-4 sm:w-56 sm:shrink-0 sm:border-l sm:border-t-0 sm:pl-6 sm:pt-0">
                      <div className="flex items-center justify-between gap-3 sm:flex-col sm:items-stretch">
                        <span
                          className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-semibold ${meta.className}`}
                        >
                          {meta.label}
                        </span>
                        <p className="text-right text-lg font-bold tabular-nums tracking-tight text-slate-900 sm:text-left sm:text-xl">
                          {formatMoneyMajor(fee, 'LKR')}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {needsPay && user ? (
                          <button
                            type="button"
                            onClick={() =>
                              setPaymentPopup({
                                appointmentId: a.id,
                                patientEmail: a.patientEmail,
                                doctorName: a.doctorName,
                                amount: fee,
                              })
                            }
                            className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-center text-sm font-semibold text-white shadow-md transition hover:bg-slate-800 sm:flex-none"
                          >
                            <CreditCard className="h-4 w-4 shrink-0" aria-hidden />
                            Pay now
                          </button>
                        ) : null}
                        {canJoin ? (
                          <Link
                            to={`/consultation/${a.id}`}
                            className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-sky-200 bg-sky-50 px-4 py-2.5 text-sm font-semibold text-sky-800 transition hover:bg-sky-100 sm:flex-none"
                          >
                            <Video className="h-4 w-4 shrink-0" aria-hidden />
                            Join visit
                          </Link>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      <PaymentPopupModal
        open={paymentPopup !== null}
        payment={paymentPopup}
        onClose={() => {
          setPaymentPopup(null)
          if (!user?.id || !token) return
          void fetchPatientAppointments(user.id, token)
            .then((data) => setAppointments(data))
            .catch(() => {
              /* keep current list if refresh fails */
            })
        }}
      />
    </div>
  )
}
