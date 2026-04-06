import { isAxiosError } from 'axios'
import { Calendar, Loader2, TrendingUp } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import {
  doctorSetAppointmentApproval,
  fetchDoctorDayAppointments,
  fetchDoctorStats,
  type DoctorStatsResponse,
  type MyAppointmentRow,
} from '../../api/appointmentApi'
import { DoctorAppointmentListItem } from '../../components/doctor/DoctorAppointmentListItem'
import { dashboardCardClass } from '../../components/dashboardShell'
import { useAuth } from '../../context/AuthContext'
import { formatColomboYmd } from '../../lib/colomboDate'

export default function DoctorAppointmentsPage() {
  const { token } = useAuth()
  const [dateFilter, setDateFilter] = useState(() => formatColomboYmd(new Date()))
  const [rows, setRows] = useState<MyAppointmentRow[]>([])
  const [stats, setStats] = useState<DoctorStatsResponse | null>(null)
  const [listLoading, setListLoading] = useState(true)
  const [approvalBusyId, setApprovalBusyId] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!token) return
    setListLoading(true)
    try {
      const [appts, st] = await Promise.all([
        fetchDoctorDayAppointments(token, dateFilter),
        fetchDoctorStats(token),
      ])
      setRows(appts)
      setStats(st)
    } catch {
      toast.error('Could not load appointments.')
    } finally {
      setListLoading(false)
    }
  }, [token, dateFilter])

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
          decision === 'approve' ? 'Appointment approved.' : 'Appointment declined.',
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
          Appointments
        </h1>
      </header>

      <div className="flex flex-wrap items-end justify-between gap-4">
        <p className="text-sm font-medium text-slate-600">Pick a day to load bookings</p>
        <label className="flex flex-col gap-1 text-xs font-semibold text-slate-500">
          Date
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm"
          />
        </label>
      </div>

      {stats ? (
        <div
          className={`${dashboardCardClass} flex flex-wrap items-center justify-between gap-4 border-t-4 border-t-sky-500 p-5`}
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-sky-600 shadow-sm">
              <TrendingUp className="h-5 w-5" aria-hidden />
            </div>
            <div>
              <p className="text-xs font-bold uppercase text-sky-800/80">
                Earnings ({stats.monthKey})
              </p>
              <p className="text-lg font-bold text-slate-900">
                LKR {stats.monthEarningsTotal.toLocaleString()}
              </p>
            </div>
          </div>
          <p className="text-sm text-slate-600">
            Today on calendar:{' '}
            <span className="font-semibold text-slate-900">
              {stats.todayAppointmentCount}
            </span>{' '}
            booking
            {stats.todayAppointmentCount === 1 ? '' : 's'}
          </p>
        </div>
      ) : null}

      <section className={`${dashboardCardClass} p-5`}>
        <div className="mb-4 flex items-center gap-2 text-slate-900">
          <Calendar className="h-5 w-5 text-sky-600" aria-hidden />
          <h3 className="font-semibold">
            {dateFilter} · {rows.length} slot{rows.length === 1 ? '' : 's'}
          </h3>
        </div>
        {listLoading ? (
          <div className="flex justify-center py-16 text-slate-500">
            <Loader2 className="h-8 w-8 animate-spin" aria-hidden />
          </div>
        ) : rows.length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 py-12 text-center text-sm text-slate-500">
            No bookings for this date.
          </p>
        ) : (
          <ul className="space-y-3">
            {rows.map((a, i) => (
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
      </section>
    </div>
  )
}
