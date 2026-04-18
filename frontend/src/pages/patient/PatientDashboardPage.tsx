import { isAxiosError } from 'axios'
import {
  Activity,
  Calendar,
  CalendarDays,
  ChevronRight,
  CloudSun,
  CreditCard,
  Download,
  Droplets,
  Eye,
  FileText,
  Loader2,
  Pill,
  Sparkles,
  Stethoscope,
  Video,
  Wind,
} from 'lucide-react'
import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import {
  cancelAppointment,
  fetchPatientAppointments,
  type MyAppointmentRow,
} from '../../api/appointmentApi'
import {
  fetchPatientRecords,
  resolvePatientRecordFileUrl,
  type MedicalRecordRow,
} from '../../api/patientApi'
import { DoctorApprovalChip } from '../../components/DoctorApprovalChip'
import { brandButtonClass } from '../../components/LandingNavbar'
import { dashboardCardClass } from '../../components/dashboardShell'
import { useAuth } from '../../context/AuthContext'
import { formatColomboYmd } from '../../lib/colomboDate'
import { canJoinVideoSession } from '../../lib/appointmentJoin'
import toast from 'react-hot-toast'

function describeDashboardFetchFailure(
  label: string,
  reason: unknown,
  portHint: string,
): string {
  if (isAxiosError(reason)) {
    const st = reason.response?.status
    const detail =
      typeof reason.response?.data === 'object' &&
      reason.response?.data !== null &&
      'message' in reason.response.data
        ? String(
            (reason.response.data as { message?: string }).message ?? '',
          ).slice(0, 120)
        : ''
    if (st) {
      return `${label} (HTTP ${st}${detail ? `: ${detail}` : ''})`
    }
    return `${label}: no response — is it running on ${portHint}?`
  }
  return `${label}: ${reason instanceof Error ? reason.message : 'failed'}`
}

function todayYmdColombo(): string {
  return formatColomboYmd(new Date())
}

type StatProps = {
  topClass: string
  iconWrap: string
  icon: ReactNode
  value: ReactNode
  label: string
}

function StatCard({ topClass, iconWrap, icon, value, label }: StatProps) {
  return (
    <div
      className={`${dashboardCardClass} overflow-hidden border-t-4 ${topClass} p-5 transition hover:shadow-card-lift`}
    >
      <div
        className={`mb-3 inline-flex rounded-xl p-2.5 ${iconWrap}`}
        aria-hidden
      >
        {icon}
      </div>
      <p className="text-3xl font-bold tracking-tight text-slate-900">{value}</p>
      <p className="mt-1 text-sm text-slate-500">{label}</p>
    </div>
  )
}

type ActionCardProps = {
  to: string
  iconWrap: string
  icon: ReactNode
  title: string
  description: string
}

function ActionCard({ to, iconWrap, icon, title, description }: ActionCardProps) {
  return (
    <Link
      to={to}
      className="group flex items-center gap-4 rounded-2xl border border-slate-200/70 bg-white p-5 shadow-card-soft transition hover:border-sky-200/80 hover:shadow-card-lift"
    >
      <div
        className={`flex shrink-0 rounded-xl p-3 ${iconWrap}`}
        aria-hidden
      >
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-slate-900">{title}</p>
        <p className="text-sm text-slate-500">{description}</p>
      </div>
      <ChevronRight
        className="h-5 w-5 shrink-0 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-sky-700"
        aria-hidden
      />
    </Link>
  )
}

export default function PatientDashboardPage() {
  const { user, token } = useAuth()
  const [appointments, setAppointments] = useState<MyAppointmentRow[]>([])
  const [records, setRecords] = useState<MedicalRecordRow[]>([])
  const [loading, setLoading] = useState(true)
  const [cancellingId, setCancellingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user || !token) return
    let cancelled = false
    ;(async () => {
      setLoading(true)
      setError(null)
      try {
        const aptUrl =
          import.meta.env.VITE_APPOINTMENT_API_URL ?? 'http://localhost:3003'
        const patUrl =
          import.meta.env.VITE_PATIENT_API_URL ?? 'http://localhost:3004'
        const [aptRes, recRes] = await Promise.allSettled([
          fetchPatientAppointments(user.id, token),
          fetchPatientRecords(user.id, token),
        ])
        if (!cancelled) {
          setAppointments(
            aptRes.status === 'fulfilled' ? aptRes.value : [],
          )
          setRecords(recRes.status === 'fulfilled' ? recRes.value : [])
          const parts: string[] = []
          if (aptRes.status === 'rejected') {
            parts.push(
              describeDashboardFetchFailure(
                'Appointments',
                aptRes.reason,
                aptUrl,
              ),
            )
          }
          if (recRes.status === 'rejected') {
            parts.push(
              describeDashboardFetchFailure(
                'Medical records',
                recRes.reason,
                patUrl,
              ),
            )
          }
          setError(parts.length ? parts.join(' · ') : null)
        }
      } catch (e) {
        if (!cancelled) {
          setError(
            e instanceof Error ? e.message : 'Something went wrong',
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

  const todayLabel = useMemo(() => {
    return new Intl.DateTimeFormat('en-LK', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'Asia/Colombo',
    }).format(new Date())
  }, [])

  const upcoming = useMemo(() => {
    const t = todayYmdColombo()
    return [...appointments]
      .filter((a) => a.appointmentDateKey >= t && a.status !== 'CANCELLED')
      .sort((a, b) =>
        a.appointmentDateKey === b.appointmentDateKey
          ? a.startTime.localeCompare(b.startTime)
          : a.appointmentDateKey.localeCompare(b.appointmentDateKey),
      )
  }, [appointments])

  const nextAppointment = upcoming[0] ?? null
  const canCancelAppointment = (a: MyAppointmentRow) => {
    const isApproved = (a.doctorApprovalStatus ?? 'PENDING') === 'APPROVED'
    const isPaid = a.paymentStatus.trim().toLowerCase() === 'paid'
    if (isApproved || isPaid) return false
    return (
      a.status === 'PENDING_PAYMENT' ||
      a.status === 'PENDING' ||
      a.status === 'CONFIRMED'
    )
  }

  async function handleCancelUpcoming(a: MyAppointmentRow) {
    if (!token) return
    setCancellingId(a.id)
    try {
      await cancelAppointment(a.id, a.patientEmail, token)
      setAppointments((prev) =>
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

  const totalBookings = appointments.length
  const pendingPayments = appointments.filter(
    (a) =>
      a.status === 'PENDING' ||
      a.paymentStatus.toLowerCase().includes('pending'),
  ).length
  const completedConsultations = appointments.filter(
    (a) => a.status === 'COMPLETED',
  ).length
  const reportCount = records.filter((r) => r.type === 'report').length
  const prescriptionCount = records.filter((r) => r.type === 'prescription').length
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000)
  const newPrescriptions = records.filter(
    (r) =>
      r.type === 'prescription' &&
      r.createdAt &&
      new Date(r.createdAt) >= thirtyDaysAgo,
  ).length

  const recentPrescriptions = records
    .filter((r) => r.type === 'prescription')
    .slice(0, 4)

  const displayName = user?.fullName ?? 'Patient'

  return (
    <div className="space-y-8 sm:space-y-10">
      {/* Header + glass widget */}
      <header className="flex flex-col gap-6 border-b border-slate-200/60 pb-8 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1 space-y-2">
          <p className="text-sm font-medium text-slate-500">{todayLabel}</p>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl lg:text-4xl">
            Welcome back,{' '}
            <span className="text-sky-700">{displayName}</span>
          </h1>
          <p className="max-w-xl text-slate-600">
            Your care overview, upcoming visits, and records in one calm dashboard.
          </p>
        </div>
        <div
          className="w-full shrink-0 rounded-2xl border border-white/70 bg-white/75 p-5 shadow-card-soft backdrop-blur-md sm:max-w-[17rem] lg:w-72"
          aria-label="Quick context"
        >
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Colombo
          </p>
          <div className="mt-2 flex items-center gap-4">
            <CloudSun className="h-9 w-9 text-amber-500" aria-hidden />
            <div>
              <p className="text-2xl font-bold text-slate-900">28°C</p>
              <p className="text-xs text-slate-500">Partly cloudy</p>
            </div>
          </div>
          <div className="mt-4 flex gap-5 border-t border-slate-200/80 pt-4 text-xs text-slate-600">
            <span className="inline-flex items-center gap-1.5">
              <Droplets className="h-4 w-4 text-blue-500" aria-hidden />
              72% humidity
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Wind className="h-4 w-4 text-slate-400" aria-hidden />
              16 km/h
            </span>
          </div>
        </div>
      </header>

      {error && (
        <p className="rounded-2xl border border-amber-200/80 bg-amber-50/90 px-4 py-3 text-sm text-amber-950 shadow-sm">
          {error}
        </p>
      )}

      {loading ? (
        <div className="flex items-center gap-2 text-slate-600">
          <Loader2 className="h-6 w-6 animate-spin text-sky-600" aria-hidden />
          Loading your dashboard…
        </div>
      ) : null}

      {/* Stat row — colored top borders like reference */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard
          topClass="border-t-sky-600"
          iconWrap="bg-sky-100 text-sky-700"
          icon={<CalendarDays className="h-5 w-5" strokeWidth={1.75} />}
          value={totalBookings}
          label="Total bookings"
        />
        <StatCard
          topClass="border-t-teal-500"
          iconWrap="bg-teal-100 text-teal-700"
          icon={<Activity className="h-5 w-5" strokeWidth={1.75} />}
          value={completedConsultations}
          label="Completed visits"
        />
        <StatCard
          topClass="border-t-amber-500"
          iconWrap="bg-amber-100 text-amber-800"
          icon={<CreditCard className="h-5 w-5" strokeWidth={1.75} />}
          value={pendingPayments}
          label="Pending payments"
        />
        <StatCard
          topClass="border-t-blue-500"
          iconWrap="bg-blue-100 text-blue-700"
          icon={<FileText className="h-5 w-5" strokeWidth={1.75} />}
          value={reportCount}
          label="Medical reports"
        />
        <StatCard
          topClass="border-t-sky-500"
          iconWrap="bg-sky-100 text-sky-800"
          icon={<Pill className="h-5 w-5" strokeWidth={1.75} />}
          value={newPrescriptions}
          label="New prescriptions (30d)"
        />
      </section>

      {/* Quick actions */}
      <section className="grid gap-4 md:grid-cols-3">
        <ActionCard
          to="/find-doctor"
          iconWrap="bg-teal-100 text-teal-700"
          icon={<Stethoscope className="h-6 w-6" strokeWidth={1.75} />}
          title="Find a doctor"
          description="Search verified specialists and book a slot"
        />
        <ActionCard
          to="/dashboard/patient/symptom-checker"
          iconWrap="bg-sky-100 text-sky-700"
          icon={<Sparkles className="h-6 w-6" strokeWidth={1.75} />}
          title="Symptom Checker"
          description="AI-guided triage for non-emergency symptoms"
        />
        <ActionCard
          to="/dashboard/patient/appointments"
          iconWrap="bg-sky-100 text-sky-800"
          icon={<Calendar className="h-6 w-6" strokeWidth={1.75} />}
          title="My appointments"
          description="View history, pay, and join video visits"
        />
      </section>

      {/* Hero “map-style” care card */}
      <section
        className={`relative overflow-hidden rounded-3xl border border-slate-200/60 bg-gradient-to-br from-sky-50/90 via-white to-blue-50/40 p-6 shadow-card-lift sm:p-8`}
      >
        <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-sky-400/[0.12] blur-2xl" />
        <div className="pointer-events-none absolute -bottom-12 -left-8 h-40 w-40 rounded-full bg-teal-500/[0.08] blur-2xl" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900 sm:text-xl">
                Next visit
              </h2>
              <span className="rounded-full bg-white/80 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-sky-700 ring-1 ring-sky-200/80">
                Upcoming
              </span>
            </div>
            {nextAppointment ? (
              <div className="mt-4 space-y-1">
                <p className="text-xl font-bold text-slate-900 sm:text-2xl">
                  {nextAppointment.doctorName}
                </p>
                <p className="text-sm font-medium text-sky-700">
                  {nextAppointment.doctorSpecialty || 'Specialty on file'}
                </p>
                <p className="text-sm text-slate-600">
                  {nextAppointment.appointmentDateKey} · {nextAppointment.day}{' '}
                  {nextAppointment.startTime} – {nextAppointment.endTime}
                </p>
                <p className="mt-2">
                  <DoctorApprovalChip
                    status={nextAppointment.doctorApprovalStatus ?? 'PENDING'}
                  />
                </p>
              </div>
            ) : (
              <p className="mt-4 text-sm text-slate-600">
                No upcoming visits.{' '}
                <Link
                  to="/find-doctor"
                  className="font-semibold text-sky-700 underline-offset-2 hover:underline"
                >
                  Book a doctor
                </Link>
              </p>
            )}
          </div>
          {nextAppointment ? (
            <div className="flex shrink-0 flex-col gap-2 sm:flex-row sm:items-center lg:flex-col lg:items-stretch">
              {canJoinVideoSession(nextAppointment) ? (
                <Link
                  to={`/consultation/${nextAppointment.id}`}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-teal-500 to-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-teal-500/30 transition hover:brightness-105"
                >
                  <Video className="h-4 w-4" aria-hidden />
                  Join session
                </Link>
              ) : (
                <button
                  type="button"
                  disabled
                  className="inline-flex cursor-not-allowed items-center justify-center gap-2 rounded-2xl bg-slate-200 px-6 py-3 text-sm font-semibold text-slate-500"
                >
                  <Video className="h-4 w-4" aria-hidden />
                  Join session
                </button>
              )}
              <p className="text-center text-[11px] text-slate-500 lg:text-left">
                Join unlocks after payment and doctor approval
              </p>
            </div>
          ) : null}
        </div>
        <div className="relative mt-6 grid gap-3 border-t border-slate-200/60 pt-6 sm:grid-cols-3">
          <div className="rounded-xl bg-white/70 px-4 py-3 text-sm shadow-sm ring-1 ring-slate-100/80 backdrop-blur-sm">
            <p className="text-xs text-slate-500">Prescriptions on file</p>
            <p className="text-lg font-bold text-slate-900">{prescriptionCount}</p>
          </div>
          <div className="rounded-xl bg-white/70 px-4 py-3 text-sm shadow-sm ring-1 ring-slate-100/80 backdrop-blur-sm">
            <p className="text-xs text-slate-500">Upcoming slots</p>
            <p className="text-lg font-bold text-slate-900">{upcoming.length}</p>
          </div>
          <div className="rounded-xl bg-white/70 px-4 py-3 text-sm shadow-sm ring-1 ring-slate-100/80 backdrop-blur-sm">
            <p className="text-xs text-slate-500">Total bookings</p>
            <p className="text-lg font-bold text-slate-900">{totalBookings}</p>
          </div>
        </div>
      </section>

      <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
        <section className={`${dashboardCardClass} p-6`}>
          <div className="mb-4 flex items-center justify-between gap-4">
            <h2 className="text-lg font-bold text-slate-900">Upcoming appointments</h2>
            <Link
              to="/dashboard/patient/appointments"
              className="text-sm font-semibold text-sky-700 underline-offset-2 hover:underline"
            >
              View all
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <th className="pb-3 pr-4">Doctor</th>
                  <th className="pb-3 pr-4">Specialization</th>
                  <th className="pb-3 pr-4">Date</th>
                  <th className="pb-3 pr-4">Time</th>
                  <th className="pb-3 pr-4">Approval</th>
                  <th className="pb-3 pr-4">Action</th>
                  <th className="pb-3">Session</th>
                </tr>
              </thead>
              <tbody>
                {upcoming.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-10 text-center text-slate-500">
                      No upcoming appointments.
                    </td>
                  </tr>
                ) : (
                  upcoming.slice(0, 6).map((a) => (
                    <tr key={a.id} className="border-b border-slate-100 last:border-0">
                      <td className="py-3 pr-4 font-medium text-slate-900">{a.doctorName}</td>
                      <td className="py-3 pr-4 text-slate-600">
                        {a.doctorSpecialty || '-'}
                      </td>
                      <td className="py-3 pr-4 text-slate-600">{a.appointmentDateKey}</td>
                      <td className="py-3 pr-4 text-slate-600">
                        {a.startTime} – {a.endTime}
                      </td>
                      <td className="py-3 pr-4">
                        <DoctorApprovalChip
                          status={a.doctorApprovalStatus ?? 'PENDING'}
                        />
                      </td>
                      <td className="py-3 pr-4">
                        {canCancelAppointment(a) ? (
                          <button
                            type="button"
                            onClick={() => void handleCancelUpcoming(a)}
                            disabled={cancellingId === a.id}
                            className="inline-flex items-center rounded-xl border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {cancellingId === a.id ? 'Cancelling...' : 'Cancel'}
                          </button>
                        ) : (
                          <span className="inline-flex items-center rounded-xl bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-500">
                            -
                          </span>
                        )}
                      </td>
                      <td className="py-3">
                        {canJoinVideoSession(a) ? (
                          <Link
                            to={`/consultation/${a.id}`}
                            className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-md shadow-teal-500/25"
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
        </section>

        <aside
          className={`h-fit rounded-2xl border border-sky-200/60 bg-gradient-to-b from-sky-50/80 to-white p-6 shadow-card-soft`}
        >
          <div className="flex flex-col gap-3">
            <span className="inline-flex w-fit items-center gap-1 rounded-full bg-sky-100 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-sky-800">
              <Sparkles className="h-3.5 w-3.5" aria-hidden />
              AI tools
            </span>
            <h2 className="text-lg font-bold text-slate-900">Symptom checker</h2>
            <p className="text-sm text-slate-600">
              Quick triage for non-emergency symptoms. Not a replacement for a clinician.
            </p>
            <Link
              to="/dashboard/patient/symptom-checker"
              className={`mt-1 inline-flex items-center justify-center rounded-2xl py-3 text-sm font-semibold text-white transition hover:brightness-105 ${brandButtonClass}`}
            >
              Open Symptom Checker
            </Link>
          </div>
        </aside>
      </div>

      <section className="grid gap-8 lg:grid-cols-2">
        <div className={`${dashboardCardClass} p-6`}>
          <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-slate-900">
            <Pill className="h-5 w-5 text-sky-600" aria-hidden />
            Recent digital prescriptions
          </h2>
          <ul className="space-y-3">
            {recentPrescriptions.length === 0 ? (
              <li className="text-sm text-slate-500">No prescriptions yet.</li>
            ) : (
              recentPrescriptions.map((r) => (
                <li
                  key={r.id}
                  className="flex items-start justify-between gap-3 rounded-2xl border border-slate-100 bg-slate-50/80 px-4 py-3"
                >
                  <div>
                    <p className="font-medium text-slate-900">{r.title}</p>
                    <p className="text-xs text-slate-500">
                      {r.doctorName} · {r.specialty || 'General'}
                    </p>
                  </div>
                  <a
                    href={resolvePatientRecordFileUrl(r.fileUrl)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 rounded-xl p-2 text-sky-700 hover:bg-sky-50"
                    aria-label="Download"
                  >
                    <Download className="h-4 w-4" aria-hidden />
                  </a>
                </li>
              ))
            )}
          </ul>
        </div>

        <div className={`${dashboardCardClass} p-6`}>
          <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-slate-900">
            <FileText className="h-5 w-5 text-blue-600" aria-hidden />
            Medical reports
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs font-semibold uppercase text-slate-500">
                  <th className="pb-2">Document</th>
                  <th className="pb-2">Date</th>
                  <th className="pb-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {records.filter((r) => r.type === 'report').length === 0 ? (
                  <tr>
                    <td colSpan={3} className="py-8 text-slate-500">
                      No reports uploaded yet.
                    </td>
                  </tr>
                ) : (
                  records
                    .filter((r) => r.type === 'report')
                    .slice(0, 5)
                    .map((r) => (
                      <tr key={r.id} className="border-b border-slate-100 last:border-0">
                        <td className="py-3 pr-2">
                          <div className="font-medium text-slate-900">{r.title}</div>
                          <div className="text-xs text-slate-500">{r.fileName}</div>
                        </td>
                        <td className="py-3 text-slate-600">
                          {r.createdAt
                            ? new Date(r.createdAt).toLocaleDateString('en-LK', {
                                timeZone: 'Asia/Colombo',
                              })
                            : '-'}
                        </td>
                        <td className="py-3">
                          <div className="flex gap-1">
                            <a
                              href={resolvePatientRecordFileUrl(r.fileUrl)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="rounded-xl p-2 text-sky-700 hover:bg-sky-50"
                              aria-label="View"
                            >
                              <Eye className="h-4 w-4" aria-hidden />
                            </a>
                            <a
                              href={resolvePatientRecordFileUrl(r.fileUrl)}
                              download
                              className="rounded-xl p-2 text-sky-700 hover:bg-sky-50"
                              aria-label="Download"
                            >
                              <Download className="h-4 w-4" aria-hidden />
                            </a>
                          </div>
                        </td>
                      </tr>
                    ))
                )}
              </tbody>
            </table>
          </div>
          <Link
            to="/dashboard/patient/reports"
            className="mt-4 inline-block text-sm font-semibold text-sky-700 underline-offset-2 hover:underline"
          >
            All reports &amp; files →
          </Link>
        </div>
      </section>

      <section className="flex flex-wrap items-center gap-6 rounded-2xl border border-dashed border-sky-200/80 bg-white/60 px-6 py-4 text-sm text-slate-600 shadow-sm backdrop-blur-sm">
        <span className="inline-flex items-center gap-2">
          <Activity className="h-4 w-4 text-sky-600" aria-hidden />
          Encrypted health data
        </span>
        <span className="inline-flex items-center gap-2">
          <CreditCard className="h-4 w-4 text-sky-600" aria-hidden />
          Secure payments
        </span>
      </section>
    </div>
  )
}
