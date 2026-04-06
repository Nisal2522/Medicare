import { isAxiosError } from 'axios'
import {
  Activity,
  Calendar,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock,
  CloudSun,
  Droplets,
  Loader2,
  Stethoscope,
  TrendingUp,
  Users,
  Wind,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import {
  doctorSetAppointmentApproval,
  fetchDoctorStats,
  fetchDoctorUpcomingAppointments,
  type DoctorStatsResponse,
  type MyAppointmentRow,
} from '../../api/appointmentApi'
import { DoctorAppointmentListItem } from '../../components/doctor/DoctorAppointmentListItem'
import { dashboardCardClass } from '../../components/dashboardShell'
import { useAuth } from '../../context/AuthContext'
import { formatColomboYmd } from '../../lib/colomboDate'

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

export default function DoctorDashboardHomePage() {
  const { user, token } = useAuth()
  const [stats, setStats] = useState<DoctorStatsResponse | null>(null)
  const [upcoming, setUpcoming] = useState<MyAppointmentRow[]>([])
  const [loading, setLoading] = useState(true)
  const [approvalBusyId, setApprovalBusyId] = useState<string | null>(null)

  const todayLabel = useMemo(() => {
    return new Intl.DateTimeFormat('en-LK', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'Asia/Colombo',
    }).format(new Date())
  }, [])

  const displayName = user?.fullName?.trim() || 'Doctor'
  const welcomeName = displayName.toLowerCase().startsWith('dr.')
    ? displayName
    : `Dr. ${displayName}`

  const load = useCallback(async () => {
    if (!token) return
    setLoading(true)
    try {
      const from = formatColomboYmd(new Date())
      const [st, rows] = await Promise.all([
        fetchDoctorStats(token),
        fetchDoctorUpcomingAppointments(token, from, 8),
      ])
      setStats(st)
      setUpcoming(rows)
    } catch {
      toast.error('Could not load dashboard. Is appointment-service running?')
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    void load()
  }, [load])

  const handleDoctorApproval = useCallback(
    async (appointmentId: string, decision: 'approve' | 'reject') => {
      if (!token) return
      setApprovalBusyId(appointmentId)
      try {
        await doctorSetAppointmentApproval(appointmentId, decision, token)
        toast.success(
          decision === 'approve'
            ? 'Appointment approved.'
            : 'Appointment declined.',
        )
        await load()
      } catch (e) {
        if (isAxiosError(e)) {
          const msg = (e.response?.data as { message?: string })?.message
          toast.error(
            typeof msg === 'string' ? msg : 'Could not update approval',
          )
        } else {
          toast.error('Could not update approval')
        }
      } finally {
        setApprovalBusyId(null)
      }
    },
    [token, load],
  )

  const pending = stats?.pendingAppointmentCount ?? 0
  const confirmed = stats?.confirmedAppointmentCount ?? 0
  const completed = stats?.completedAppointmentCount ?? 0
  const total = stats?.totalActiveAppointmentCount ?? 0
  const todayCount = stats?.todayAppointmentCount ?? 0

  return (
    <div className="space-y-8 sm:space-y-10">
      <header className="flex flex-col gap-6 border-b border-slate-200/60 pb-8 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1 space-y-2">
          <p className="text-sm font-medium text-slate-500">{todayLabel}</p>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl lg:text-4xl">
            Welcome back,{' '}
            <span className="text-sky-700">{welcomeName}</span>
          </h1>
          <p className="max-w-xl text-slate-600">
            Your practice overview, approvals, and upcoming consultations in one
            dashboard.
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

      {loading ? (
        <div className="flex items-center gap-2 text-slate-600">
          <Loader2 className="h-6 w-6 animate-spin text-sky-600" aria-hidden />
          Loading your dashboard…
        </div>
      ) : null}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard
          topClass="border-t-amber-500"
          iconWrap="bg-amber-100 text-amber-800"
          icon={<Clock className="h-5 w-5" strokeWidth={1.75} />}
          value={pending}
          label="Pending"
        />
        <StatCard
          topClass="border-t-sky-600"
          iconWrap="bg-sky-100 text-sky-700"
          icon={<CheckCircle2 className="h-5 w-5" strokeWidth={1.75} />}
          value={confirmed}
          label="Confirmed"
        />
        <StatCard
          topClass="border-t-teal-500"
          iconWrap="bg-teal-100 text-teal-700"
          icon={<Users className="h-5 w-5" strokeWidth={1.75} />}
          value={completed}
          label="Completed"
        />
        <StatCard
          topClass="border-t-violet-500"
          iconWrap="bg-violet-100 text-violet-700"
          icon={<Calendar className="h-5 w-5" strokeWidth={1.75} />}
          value={total}
          label="Total active"
        />
        <StatCard
          topClass="border-t-blue-500"
          iconWrap="bg-blue-100 text-blue-700"
          icon={<CalendarDays className="h-5 w-5" strokeWidth={1.75} />}
          value={todayCount}
          label="Today’s schedule"
        />
      </section>

      {stats ? (
        <div
          className={`${dashboardCardClass} flex flex-wrap items-center justify-between gap-4 border-t-4 border-t-sky-500 p-5`}
        >
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-sky-100 text-sky-700">
              <TrendingUp className="h-5 w-5" strokeWidth={1.75} aria-hidden />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                This month ({stats.monthKey})
              </p>
              <p className="text-lg font-bold text-slate-900">
                LKR {stats.monthEarningsTotal.toLocaleString()}
              </p>
              <p className="text-xs text-slate-600">
                {stats.monthCompletedCount} completed visit
                {stats.monthCompletedCount === 1 ? '' : 's'}
              </p>
            </div>
          </div>
        </div>
      ) : null}

      <section className="grid gap-4 md:grid-cols-3">
        <ActionCard
          to="/dashboard/doctor/appointments"
          iconWrap="bg-sky-100 text-sky-800"
          icon={<CalendarDays className="h-6 w-6" strokeWidth={1.75} />}
          title="Appointments"
          description="Review by date, approve visits, start video"
        />
        <ActionCard
          to="/dashboard/doctor/availability"
          iconWrap="bg-teal-100 text-teal-700"
          icon={<Activity className="h-6 w-6" strokeWidth={1.75} />}
          title="Manage availability"
          description="Set weekly slots your patients can book"
        />
        <ActionCard
          to="/dashboard/doctor/profile"
          iconWrap="bg-violet-100 text-violet-700"
          icon={<Stethoscope className="h-6 w-6" strokeWidth={1.75} />}
          title="Profile & records"
          description="Your directory profile and patient file lookup"
        />
      </section>

      <section
        className={`relative overflow-hidden rounded-3xl border border-slate-200/60 bg-gradient-to-br from-sky-50/90 via-white to-blue-50/40 p-6 shadow-card-lift sm:p-8`}
      >
        <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-sky-400/[0.12] blur-2xl" />
        <div className="pointer-events-none absolute -bottom-12 -left-8 h-40 w-40 rounded-full bg-teal-500/[0.08] blur-2xl" />
        <div className="relative space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900 sm:text-xl">
                Upcoming appointments
              </h2>
              <span className="rounded-full bg-white/80 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-sky-700 ring-1 ring-sky-200/80">
                From today
              </span>
            </div>
            <Link
              to="/dashboard/doctor/appointments"
              className="text-sm font-semibold text-sky-700 hover:underline"
            >
              View all →
            </Link>
          </div>

          {upcoming.length === 0 ? (
            <p className="text-sm text-slate-600">
              No upcoming visits. Open{' '}
              <Link
                to="/dashboard/doctor/availability"
                className="font-semibold text-sky-700 underline-offset-2 hover:underline"
              >
                Availability
              </Link>{' '}
              to add bookable slots.
            </p>
          ) : (
            <ul className="space-y-3">
              {upcoming.map((a, i) => (
                <li key={a.id}>
                  <DoctorAppointmentListItem
                    a={a}
                    index={i}
                    approvalBusyId={approvalBusyId}
                    onApprove={(id) => void handleDoctorApproval(id, 'approve')}
                    onReject={(id) => void handleDoctorApproval(id, 'reject')}
                  />
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  )
}
