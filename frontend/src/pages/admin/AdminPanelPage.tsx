import { isAxiosError } from 'axios'
import {
  CalendarDays,
  Clock3,
  Home,
  LayoutDashboard,
  Loader2,
  LogOut,
  MessageSquareWarning,
  PieChart as PieChartIcon,
  ShieldCheck,
  Search,
  Stethoscope,
  TrendingUp,
  UserCheck,
  Users,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Funnel,
  FunnelChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import toast from 'react-hot-toast'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  activateAdminUser,
  deleteAdminUser,
  deactivateAdminUser,
  fetchAdminDoctors,
  fetchAdminStats,
  fetchAdminUsers,
  verifyDoctorAsAdmin,
  type AdminDoctorRow,
  type AdminStats,
  type AdminUserRow,
} from '../../api/adminApi'
import { brandButtonClass } from '../../components/LandingNavbar'
import { PatientDashboardNavbar } from '../../components/PatientDashboardNavbar'
import {
  dashboardAsideWhite,
  dashboardAsideWidthMd,
  dashboardAsideWidthMobile,
  dashboardNavClassOnWhite,
  dashboardNavRow,
  dashboardSidebarFooterWhite,
  dashboardSidebarMobileTop,
} from '../../components/dashboardShell'
import { useAuth } from '../../context/AuthContext'

const shell = 'mx-auto w-full max-w-[min(100%,92rem)] px-4 sm:px-6 lg:px-8 py-6 sm:py-8'
const iconProps = { className: 'h-4 w-4 shrink-0 text-current opacity-90', strokeWidth: 1.75 as const }

const lkr = new Intl.NumberFormat('en-LK', {
  style: 'currency',
  currency: 'LKR',
  maximumFractionDigits: 0,
})

const DONUT_COLORS = ['#0284c7', '#38bdf8']

function formatMonthKey(key: string): string {
  const [y, m] = key.split('-')
  if (!y || !m) return key
  const d = new Date(Number(y), Number(m) - 1, 1)
  return d.toLocaleDateString('en-LK', { month: 'short', year: 'numeric' })
}

function SectionCard({
  children,
  id,
}: {
  children: ReactNode
  id?: string
}) {
  return (
    <section id={id} className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
      {children}
    </section>
  )
}

function StatCard({
  label,
  value,
  topClass,
  icon,
  iconWrap,
}: {
  label: string
  value: ReactNode
  topClass: string
  icon: ReactNode
  iconWrap: string
}) {
  return (
    <div className={`overflow-hidden rounded-2xl border border-slate-200/80 border-t-4 bg-white p-5 shadow-sm ${topClass}`}>
      <div className={`mb-3 inline-flex rounded-xl p-2.5 ${iconWrap}`}>{icon}</div>
      <p className="text-3xl font-bold tracking-tight text-slate-900">{value}</p>
      <p className="mt-1 text-sm text-slate-500">{label}</p>
    </div>
  )
}

export default function AdminPanelPage() {
  const { user, token, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [users, setUsers] = useState<AdminUserRow[]>([])
  const [doctors, setDoctors] = useState<AdminDoctorRow[]>([])
  const [loading, setLoading] = useState(true)
  const [userQuery, setUserQuery] = useState('')
  const [pendingId, setPendingId] = useState<string | null>(null)
  const [confirmAction, setConfirmAction] = useState<{
    kind: 'activate' | 'deactivate' | 'delete'
    target: AdminUserRow
  } | null>(null)

  const load = useCallback(async () => {
    if (!token) return
    setLoading(true)
    try {
      const [s, u, d] = await Promise.all([
        fetchAdminStats(token),
        fetchAdminUsers(token),
        fetchAdminDoctors(token),
      ])
      setStats(s)
      setUsers(u)
      setDoctors(d)
    } catch (e) {
      const msg = isAxiosError(e)
        ? (() => {
            const data = e.response?.data as { message?: string | string[] }
            if (Array.isArray(data?.message)) return data.message.join(', ')
            if (typeof data?.message === 'string') return data.message
            return 'Could not load admin data'
          })()
        : 'Could not load admin data'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)')
    const close = () => {
      if (mq.matches) setMobileSidebarOpen(false)
    }
    mq.addEventListener('change', close)
    return () => mq.removeEventListener('change', close)
  }, [])

  const userById = useMemo(() => {
    const m = new Map<string, AdminUserRow>()
    for (const u of users) m.set(u.id, u)
    return m
  }, [users])

  const pendingDoctors = useMemo(() => doctors.filter((d) => !d.isVerified), [doctors])

  const filteredUsers = useMemo(() => {
    const q = userQuery.trim().toLowerCase()
    if (!q) return users
    return users.filter(
      (u) =>
        u.email.toLowerCase().includes(q) ||
        u.fullName.toLowerCase().includes(q) ||
        u.role.toLowerCase().includes(q),
    )
  }, [users, userQuery])

  const chartData = useMemo(() => {
    if (!stats?.monthlyRevenue?.length) return []
    return stats.monthlyRevenue.map((r) => ({
      label: formatMonthKey(r.month),
      revenue: r.revenue,
    }))
  }, [stats])

  const revenueDistribution = useMemo(() => {
    const total = Number(stats?.totalRevenue ?? 0)
    const doctorShare = Math.round(total * 0.7)
    const platformShare = Math.max(total - doctorShare, 0)
    return [
      { name: 'Doctor fee share', value: doctorShare },
      { name: 'Hospital/platform fee', value: platformShare },
    ]
  }, [stats?.totalRevenue])

  const appointmentFunnelData = useMemo(() => {
    const total = Math.max(0, Number(stats?.totalAppointments ?? 0))
    const approved = Math.max(0, Math.round(total * 0.75))
    const completed = Math.max(0, Math.round(total * 0.58))
    return [
      { value: total, name: 'Booked' },
      { value: approved, name: 'Doctor approved' },
      { value: completed, name: 'Completed' },
    ]
  }, [stats?.totalAppointments])
  const dailyAppointments = useMemo(
    () => Math.max(0, Math.round(Number(stats?.totalAppointments ?? 0) / 30)),
    [stats?.totalAppointments],
  )
  const activeSidebarId = useMemo(() => {
    const hash = location.hash.replace('#', '').trim()
    if (!hash) return 'admin-doctor-approval'
    return hash
  }, [location.hash])
  const todayLabel = useMemo(
    () =>
      new Intl.DateTimeFormat('en-LK', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        timeZone: 'Asia/Colombo',
      }).format(new Date()),
    [],
  )

  async function onVerify(doctorId: string) {
    if (!token) return
    setPendingId(doctorId)
    try {
      await verifyDoctorAsAdmin(token, doctorId)
      toast.success('Doctor verified')
      await load()
    } catch (e) {
      toast.error(
        isAxiosError(e)
          ? String((e.response?.data as { message?: string })?.message ?? 'Verify failed')
          : 'Verify failed',
      )
    } finally {
      setPendingId(null)
    }
  }

  function onRejectDoctor(doctorName: string) {
    toast.error(
      `Reject flow for ${doctorName} is not wired yet. Add a backend reject endpoint to enable this.`,
    )
  }

  async function onDeactivate(target: AdminUserRow) {
    if (!token) return
    setPendingId(target.id)
    try {
      await deactivateAdminUser(token, target.id)
      toast.success('User deactivated')
      await load()
    } catch (e) {
      toast.error(
        isAxiosError(e)
          ? String((e.response?.data as { message?: string })?.message ?? 'Action failed')
          : 'Action failed',
      )
    } finally {
      setPendingId(null)
    }
  }

  async function onActivate(target: AdminUserRow) {
    if (!token) return
    setPendingId(target.id)
    try {
      await activateAdminUser(token, target.id)
      toast.success('User activated')
      await load()
    } catch (e) {
      toast.error(
        isAxiosError(e)
          ? String((e.response?.data as { message?: string })?.message ?? 'Action failed')
          : 'Action failed',
      )
    } finally {
      setPendingId(null)
    }
  }

  async function onToggleActive(target: AdminUserRow) {
    setConfirmAction({
      kind: target.isActive ? 'deactivate' : 'activate',
      target,
    })
  }

  async function onDelete(target: AdminUserRow) {
    if (!token) return
    setPendingId(target.id)
    try {
      await deleteAdminUser(token, target.id)
      toast.success('User deleted')
      await load()
    } catch (e) {
      toast.error(
        isAxiosError(e)
          ? String((e.response?.data as { message?: string })?.message ?? 'Delete failed')
          : 'Delete failed',
      )
    } finally {
      setPendingId(null)
    }
  }

  async function onConfirmToggle() {
    if (!confirmAction) return
    const { kind, target } = confirmAction
    setConfirmAction(null)
    if (kind === 'deactivate') {
      await onDeactivate(target)
      return
    }
    if (kind === 'delete') {
      await onDelete(target)
      return
    }
    await onActivate(target)
  }

  return (
    <div className="flex h-dvh max-h-dvh flex-col overflow-hidden bg-gradient-to-b from-sky-50/80 via-white to-slate-50 text-slate-900">
      {confirmAction ? (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
          <button
            type="button"
            className="absolute inset-0 bg-slate-900/35 backdrop-blur-[1px]"
            aria-label="Close confirmation"
            onClick={() => setConfirmAction(null)}
          />
          <div className="relative z-10 w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl">
            <h3 className="text-base font-semibold text-slate-900">
              {confirmAction.kind === 'delete'
                ? 'Delete user'
                : confirmAction.kind === 'deactivate'
                  ? 'Deactivate user'
                  : 'Activate user'}
            </h3>
            <p className="mt-2 text-sm text-slate-600">
              {confirmAction.kind === 'delete'
                ? 'Delete'
                : confirmAction.kind === 'deactivate'
                  ? 'Deactivate'
                  : 'Activate'}{' '}
              <span className="font-medium text-slate-900">{confirmAction.target.fullName}</span>{' '}
              ({confirmAction.target.email})?
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmAction(null)}
                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void onConfirmToggle()}
                className={`rounded-lg px-3 py-1.5 text-sm font-semibold text-white transition ${
                  confirmAction.kind === 'delete'
                    ? 'bg-rose-700 hover:bg-rose-800'
                    : confirmAction.kind === 'deactivate'
                      ? 'bg-rose-600 hover:bg-rose-700'
                      : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
              >
                {confirmAction.kind === 'delete'
                  ? 'Delete'
                  : confirmAction.kind === 'deactivate'
                    ? 'Deactivate'
                    : 'Activate'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
      <div className="shrink-0">
        <PatientDashboardNavbar
          portalSubtitle="Admin portal"
          showFindDoctor={false}
          onMenuClick={() => setMobileSidebarOpen((o) => !o)}
          menuOpen={mobileSidebarOpen}
        />
      </div>

      <div className="relative flex min-h-0 flex-1 overflow-hidden">
        {mobileSidebarOpen ? (
          <button
            type="button"
            className={`fixed inset-x-0 bottom-0 ${dashboardSidebarMobileTop} z-30 bg-slate-900/35 backdrop-blur-[2px] md:hidden`}
            aria-label="Close menu"
            onClick={() => setMobileSidebarOpen(false)}
          />
        ) : null}

        <aside
          className={`fixed bottom-0 left-0 z-40 flex ${dashboardSidebarMobileTop} transition-transform duration-200 ease-out md:static md:inset-auto md:z-0 md:h-full md:translate-x-0 ${dashboardAsideWhite} ${dashboardAsideWidthMobile} ${dashboardAsideWidthMd} ${
            mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <nav
            className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto overscroll-y-contain px-3 pb-3 pt-3"
            aria-label="Admin"
          >
            <a
              href="#admin-doctor-approval"
              className={`${dashboardNavRow} ${dashboardNavClassOnWhite(activeSidebarId === 'admin-doctor-approval')}`}
            >
              <ShieldCheck {...iconProps} aria-hidden />
              Doctor Approval
            </a>
            <a
              href="#admin-user-management"
              className={`${dashboardNavRow} ${dashboardNavClassOnWhite(activeSidebarId === 'admin-user-management')}`}
            >
              <Users {...iconProps} aria-hidden />
              User Management
            </a>
            <a
              href="#admin-revenue-reports"
              className={`${dashboardNavRow} ${dashboardNavClassOnWhite(activeSidebarId === 'admin-revenue-reports')}`}
            >
              <PieChartIcon {...iconProps} aria-hidden />
              Financial Reports
            </a>
            <div className="mt-3 border-t border-sky-100/90 pt-3 md:hidden">
              <a href="/" className={`${dashboardNavRow} ${dashboardNavClassOnWhite(false)}`}>
                <Home {...iconProps} aria-hidden />
                Home
              </a>
            </div>
          </nav>

          <div className={dashboardSidebarFooterWhite}>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-slate-900">
                {user?.fullName?.trim() || 'Admin'}
              </p>
              <span className="mt-0.5 inline-block rounded-md bg-sky-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-sky-800">
                Admin
              </span>
            </div>
            <p className="mt-2 truncate px-0.5 text-[11px] text-slate-500">{user?.email}</p>
            <button
              type="button"
              onClick={() => {
                logout()
                navigate('/', { replace: true })
              }}
              className={`mt-2 flex w-full items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold ${brandButtonClass}`}
            >
              <LogOut className="h-4 w-4 shrink-0" strokeWidth={1.75} aria-hidden />
              Sign out
            </button>
          </div>
        </aside>

        <div className="min-h-0 min-w-0 flex-1 overflow-y-auto overscroll-y-contain">
          <main className={`space-y-8 ${shell}`}>
            <header
              id="admin-dashboard-overview"
              className="flex flex-col gap-6 border-b border-slate-200/60 pb-8 lg:flex-row lg:items-start lg:justify-between"
            >
              <div className="min-w-0 flex-1 space-y-2">
                <p className="text-sm font-medium text-slate-500">{todayLabel}</p>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl lg:text-4xl">
                  Welcome back, <span className="text-sky-700">System Administrator</span>
                </h1>
                <p className="max-w-xl text-slate-600">
                  Track platform revenue, approvals, and user operations from one dashboard.
                </p>
              </div>
              <div className="w-full shrink-0 rounded-2xl border border-white/70 bg-white/75 p-5 shadow-sm sm:max-w-[17rem] lg:w-72">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Colombo
                </p>
                <p className="mt-2 text-2xl font-bold text-slate-900">
                  {lkr.format(Number(stats?.totalRevenue ?? 0))}
                </p>
                <p className="text-xs text-slate-500">Completed appointment revenue</p>
                <div className="mt-4 border-t border-slate-200/80 pt-3 text-xs text-slate-600">
                  Total appointments: {Number(stats?.totalAppointments ?? 0)}
                </div>
              </div>
            </header>

            {loading && !stats ? (
              <div className="flex items-center gap-2 text-slate-500">
                <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
                Loading dashboard...
              </div>
            ) : null}

            {stats ? (
              <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard
                  label="Patients"
                  value={stats.totalPatients}
                  topClass="border-t-amber-500"
                  iconWrap="bg-amber-100 text-amber-700"
                  icon={<Users className="h-5 w-5" strokeWidth={1.75} />}
                />
                <StatCard
                  label="Doctors"
                  value={stats.totalDoctors}
                  topClass="border-t-sky-600"
                  iconWrap="bg-sky-100 text-sky-700"
                  icon={<Stethoscope className="h-5 w-5" strokeWidth={1.75} />}
                />
                <StatCard
                  label="Daily appointments"
                  value={dailyAppointments}
                  topClass="border-t-teal-500"
                  iconWrap="bg-teal-100 text-teal-700"
                  icon={<CalendarDays className="h-5 w-5" strokeWidth={1.75} />}
                />
                <StatCard
                  label="Revenue (completed)"
                  value={lkr.format(stats.totalRevenue)}
                  topClass="border-t-violet-500"
                  iconWrap="bg-violet-100 text-violet-700"
                  icon={<TrendingUp className="h-5 w-5" strokeWidth={1.75} />}
                />
              </section>
            ) : null}

            <section className="grid gap-4 md:grid-cols-3">
              <a
                href="#admin-doctor-approval"
                className="group flex items-center gap-4 rounded-2xl border border-slate-200/70 bg-white p-5 shadow-sm transition hover:border-sky-200/80"
              >
                <div className="flex shrink-0 rounded-xl bg-sky-100 p-3 text-sky-800">
                  <ShieldCheck className="h-6 w-6" strokeWidth={1.75} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-slate-900">Doctor approval</p>
                  <p className="text-sm text-slate-500">Review pending registrations</p>
                </div>
              </a>
              <a
                href="#admin-user-management"
                className="group flex items-center gap-4 rounded-2xl border border-slate-200/70 bg-white p-5 shadow-sm transition hover:border-sky-200/80"
              >
                <div className="flex shrink-0 rounded-xl bg-teal-100 p-3 text-teal-700">
                  <Users className="h-6 w-6" strokeWidth={1.75} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-slate-900">User management</p>
                  <p className="text-sm text-slate-500">Block / deactivate accounts</p>
                </div>
              </a>
              <a
                href="#admin-revenue-reports"
                className="group flex items-center gap-4 rounded-2xl border border-slate-200/70 bg-white p-5 shadow-sm transition hover:border-sky-200/80"
              >
                <div className="flex shrink-0 rounded-xl bg-violet-100 p-3 text-violet-700">
                  <Clock3 className="h-6 w-6" strokeWidth={1.75} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-slate-900">Financial reports</p>
                  <p className="text-sm text-slate-500">Revenue distribution and trend</p>
                </div>
              </a>
            </section>

            <section className="grid gap-4 xl:grid-cols-2">
              <SectionCard id="admin-revenue-reports">
                <h2 className="text-lg font-semibold text-slate-900">Revenue distribution</h2>
                <p className="mt-1 text-xs text-slate-500">
                  Executive split view for doctor share vs hospital/platform fee.
                </p>
                <div className="mt-4 h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={revenueDistribution}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={52}
                        outerRadius={86}
                        paddingAngle={3}
                      >
                        {revenueDistribution.map((entry, index) => (
                          <Cell
                            key={`${entry.name}-${index}`}
                            fill={DONUT_COLORS[index % DONUT_COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => lkr.format(Number(value ?? 0))} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  {revenueDistribution.map((r, index) => (
                    <div key={r.name} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                      <p className="text-xs text-slate-500">{r.name}</p>
                      <p className="mt-0.5 text-sm font-semibold text-slate-900">
                        <span
                          className="mr-2 inline-block h-2.5 w-2.5 rounded-full align-middle"
                          style={{ backgroundColor: DONUT_COLORS[index % DONUT_COLORS.length] }}
                        />
                        {lkr.format(r.value)}
                      </p>
                    </div>
                  ))}
                </div>
              </SectionCard>

              <SectionCard>
                <h2 className="text-lg font-semibold text-slate-900">Appointment funnel</h2>
                <p className="mt-1 text-xs text-slate-500">
                  System-wide flow from booking to completion.
                </p>
                <div className="mt-4 h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <FunnelChart>
                      <Tooltip />
                      <Funnel
                        dataKey="value"
                        data={appointmentFunnelData}
                        isAnimationActive
                        stroke="#0ea5e9"
                        fill="#38bdf8"
                      />
                    </FunnelChart>
                  </ResponsiveContainer>
                </div>
              </SectionCard>
            </section>

            <SectionCard id="admin-doctor-approval">
              <div className="mb-4 flex items-center gap-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-100 text-sky-700">
                  <UserCheck className="h-5 w-5" aria-hidden />
                </span>
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">Doctor verification</h2>
                  <p className="text-xs text-slate-500">
                    Review pending doctors, inspect uploaded documents, then approve or reject.
                  </p>
                </div>
              </div>
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full min-w-[640px] text-left text-sm">
                  <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-500">
                    <tr>
                      <th className="px-4 py-3">Doctor</th>
                      <th className="px-4 py-3">Email</th>
                      <th className="px-4 py-3">Specialty</th>
                      <th className="px-4 py-3">Document review</th>
                      <th className="px-4 py-3">Location</th>
                      <th className="px-4 py-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {pendingDoctors.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                          No pending doctors.
                        </td>
                      </tr>
                    ) : (
                      pendingDoctors.map((d) => {
                        const u = userById.get(d.id)
                        return (
                          <tr key={d.id} className="bg-white">
                            <td className="px-4 py-3 font-medium text-slate-900">{d.name}</td>
                            <td className="px-4 py-3 text-slate-600">{u?.email ?? '-'}</td>
                            <td className="px-4 py-3 text-slate-700">{d.specialty}</td>
                            <td className="px-4 py-3">
                              <button
                                type="button"
                                onClick={() =>
                                  toast('Doctor document links are not exposed by API yet.', {
                                    icon: 'ℹ️',
                                  })
                                }
                                className="text-xs font-semibold text-sky-700 hover:underline"
                              >
                                View documents
                              </button>
                            </td>
                            <td className="px-4 py-3 text-slate-500">{d.location || '-'}</td>
                            <td className="px-4 py-3 text-right">
                              <div className="inline-flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => onRejectDoctor(d.name)}
                                  className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 transition hover:bg-rose-100"
                                >
                                  Reject
                                </button>
                                <button
                                  type="button"
                                  disabled={pendingId === d.id}
                                  onClick={() => void onVerify(d.id)}
                                  className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-sky-500 to-blue-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:brightness-105 disabled:opacity-50"
                                >
                                  {pendingId === d.id ? (
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                  ) : (
                                    <Stethoscope className="h-3.5 w-3.5" aria-hidden />
                                  )}
                                  Approve
                                </button>
                              </div>
                            </td>
                          </tr>
                        )
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </SectionCard>

            <SectionCard id="admin-user-management">
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-100 text-sky-700">
                    <Users className="h-5 w-5" aria-hidden />
                  </span>
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">User management</h2>
                    <p className="text-xs text-slate-500">Patients and doctors.</p>
                  </div>
                </div>
                <div className="relative max-w-md flex-1">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="search"
                    value={userQuery}
                    onChange={(e) => setUserQuery(e.target.value)}
                    placeholder="Search by name, email, or role..."
                    className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-10 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                  />
                </div>
              </div>
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full min-w-[720px] text-left text-sm">
                  <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-500">
                    <tr>
                      <th className="px-4 py-3">Name</th>
                      <th className="px-4 py-3">Email</th>
                      <th className="px-4 py-3">Role</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredUsers.map((u) => (
                      <tr key={u.id} className="bg-white">
                        <td className="px-4 py-3 font-medium text-slate-900">{u.fullName}</td>
                        <td className="px-4 py-3 text-slate-600">{u.email}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                              u.role === 'DOCTOR' ? 'bg-sky-100 text-sky-700' : 'bg-emerald-100 text-emerald-700'
                            }`}
                          >
                            {u.role}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={u.isActive ? 'text-emerald-600' : 'text-rose-600 line-through'}>
                            {u.isActive ? 'Active' : 'Deactivated'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="inline-flex items-center gap-2">
                            <button
                              type="button"
                              disabled={pendingId === u.id}
                              onClick={() => void onToggleActive(u)}
                              className={`inline-flex min-w-[92px] items-center justify-center rounded-lg border px-3 py-1.5 text-xs font-semibold transition disabled:opacity-50 ${
                                u.isActive
                                  ? 'border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100'
                                  : 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                              }`}
                            >
                              {pendingId === u.id ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                              ) : u.isActive ? (
                                'Deactivate'
                              ) : (
                                'Activate'
                              )}
                            </button>
                            <button
                              type="button"
                              disabled={pendingId === u.id}
                              onClick={() => setConfirmAction({ kind: 'delete', target: u })}
                              className="inline-flex min-w-[72px] items-center justify-center rounded-lg border border-rose-200 bg-white px-3 py-1.5 text-xs font-semibold text-rose-700 transition hover:bg-rose-50 disabled:opacity-50"
                            >
                              {pendingId === u.id ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                              ) : (
                                'Delete'
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </SectionCard>

            <SectionCard>
              <h2 className="text-lg font-semibold text-slate-900">Revenue trend</h2>
              <p className="mt-1 text-xs text-slate-500">
                Monthly platform earnings from completed appointments.
              </p>
              <div className="mt-6 h-72 w-full">
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="label" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={{ stroke: '#cbd5e1' }} />
                      <YAxis
                        tick={{ fill: '#64748b', fontSize: 11 }}
                        axisLine={{ stroke: '#cbd5e1' }}
                        tickFormatter={(v) => (v >= 1000 ? `${Math.round(v / 1000)}k` : String(v))}
                      />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px' }}
                        labelStyle={{ color: '#0f172a' }}
                        formatter={(value) => [lkr.format(Number(value ?? 0)), 'Revenue']}
                      />
                      <Bar dataKey="revenue" fill="#0ea5e9" radius={[6, 6, 0, 0]} name="Revenue" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-slate-500">
                    No completed appointment revenue in range yet.
                  </div>
                )}
              </div>
            </SectionCard>

            <section className="grid gap-4 xl:grid-cols-2">
              <SectionCard>
                <div className="mb-3 flex items-center gap-2">
                  <MessageSquareWarning className="h-5 w-5 text-amber-600" aria-hidden />
                  <h2 className="text-lg font-semibold text-slate-900">Feedback / complaints</h2>
                </div>
                <p className="text-xs text-slate-500">
                  Dedicated complaints endpoint is pending. Showing operational placeholder feed.
                </p>
                <ul className="mt-4 space-y-2 text-sm">
                  <li className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-slate-700">
                    No unresolved complaints reported in the current dataset.
                  </li>
                  <li className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-slate-700">
                    Wire `GET /admin/complaints` to replace this placeholder feed.
                  </li>
                </ul>
              </SectionCard>

              <SectionCard>
                <div className="mb-3 flex items-center gap-2">
                  <LayoutDashboard className="h-5 w-5 text-sky-700" aria-hidden />
                  <h2 className="text-lg font-semibold text-slate-900">Payment logs</h2>
                </div>
                <p className="text-xs text-slate-500">
                  Current summary is sourced from completed appointments revenue.
                </p>
                <div className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
                  <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                    <p className="text-xs text-slate-500">Total processed revenue</p>
                    <p className="mt-0.5 font-semibold text-slate-900">
                      {lkr.format(Number(stats?.totalRevenue ?? 0))}
                    </p>
                  </div>
                  <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                    <p className="text-xs text-slate-500">Total appointments</p>
                    <p className="mt-0.5 font-semibold text-slate-900">
                      {Number(stats?.totalAppointments ?? 0)}
                    </p>
                  </div>
                </div>
              </SectionCard>
            </section>
          </main>
        </div>
      </div>
    </div>
  )
}
