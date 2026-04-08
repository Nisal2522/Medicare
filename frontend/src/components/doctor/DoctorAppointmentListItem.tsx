import { Calendar, Loader2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { MyAppointmentRow } from '../../api/appointmentApi'
import { DoctorApprovalChip } from '../DoctorApprovalChip'
import { dashboardCardClass } from '../dashboardShell'
import { canJoinVideoSession } from '../../lib/appointmentJoin'

function formatAppointmentWhen(dateKey: string, startTime: string, endTime: string): string {
  const parts = dateKey.split('-').map(Number)
  if (parts.length !== 3 || parts.some(Number.isNaN)) {
    return `${dateKey} · ${startTime} – ${endTime}`
  }
  const [y, m, d] = parts
  const date = new Date(y!, m! - 1, d!)
  const dateStr = date.toLocaleDateString('en-LK', {
    timeZone: 'Asia/Colombo',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
  return `${dateStr} at ${startTime}`
}

type Props = {
  a: MyAppointmentRow
  index?: number
  approvalBusyId: string | null
  onApprove: (id: string) => void
  onReject: (id: string) => void
  showConsultationCta?: boolean
}

export function DoctorAppointmentListItem({
  a,
  index = 0,
  approvalBusyId,
  onApprove,
  onReject,
  showConsultationCta = true,
}: Props) {
  const approval = a.doctorApprovalStatus ?? 'PENDING'
  const showApprovalActions = approval === 'PENDING' && a.status !== 'CANCELLED'
  const canStart = canJoinVideoSession(a)
  const busy = approvalBusyId === a.id
  const patientLabel =
    a.patientName?.trim() ||
    `Patient — Appt #${String(index + 1)}`

  const pendingLike =
    a.status === 'PENDING' || a.status === 'PENDING_PAYMENT'
  const statusChipClass = pendingLike
    ? 'bg-amber-100 text-amber-900 ring-amber-200/80'
    : a.status === 'CONFIRMED'
      ? 'bg-sky-100 text-sky-900 ring-sky-200/80'
      : a.status === 'COMPLETED'
        ? 'bg-emerald-100 text-emerald-900 ring-emerald-200/80'
        : a.status === 'CANCELLED'
          ? 'bg-rose-100 text-rose-800 ring-rose-200/80'
          : 'bg-slate-100 text-slate-800 ring-slate-200/70'

  return (
    <article
      className={`flex flex-col gap-3 ${dashboardCardClass} p-4 transition hover:border-sky-200/80 hover:shadow-card-lift sm:flex-row sm:items-start sm:justify-between sm:gap-4`}
    >
      <div className="flex min-w-0 flex-1 gap-3">
        <div
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-sky-100 to-blue-100 text-sky-600 shadow-inner"
          aria-hidden
        >
          <Calendar className="h-6 w-6" strokeWidth={1.75} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-slate-900">{patientLabel}</p>
          <p className="mt-0.5 text-sm text-slate-600">
            {formatAppointmentWhen(
              a.appointmentDateKey,
              a.startTime,
              a.endTime,
            )}
            {a.endTime ? ` – ${a.endTime}` : null}
          </p>
          <p className="mt-2 flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide ring-1 ${statusChipClass}`}
            >
              <span
                className={
                  pendingLike
                    ? 'text-amber-500'
                    : a.status === 'CONFIRMED'
                      ? 'text-sky-500'
                      : 'text-slate-400'
                }
                aria-hidden
              >
                ●
              </span>
              {a.status.replace(/_/g, ' ')}
            </span>
            <DoctorApprovalChip status={approval} />
          </p>
        </div>
      </div>

      <div className="flex shrink-0 flex-col items-stretch gap-2 sm:items-end">
        {showApprovalActions ? (
          <div className="flex flex-wrap justify-end gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={() => onApprove(a.id)}
              className="inline-flex min-w-[5rem] items-center justify-center rounded-xl bg-emerald-500 px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-600 disabled:opacity-60"
            >
              {busy ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              ) : (
                'Approve'
              )}
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => onReject(a.id)}
              className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-100 disabled:opacity-60"
            >
              Decline
            </button>
          </div>
        ) : null}
        {showConsultationCta ? (
          canStart ? (
            <Link
              to={`/dashboard/doctor/consultation/${a.id}`}
              className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 px-4 py-2 text-center text-xs font-semibold text-white shadow-md shadow-sky-500/25 transition hover:brightness-105"
            >
              Join visit
            </Link>
          ) : (
            <span
              className="inline-flex cursor-not-allowed items-center justify-center rounded-xl bg-slate-100 px-4 py-2 text-center text-xs font-semibold text-slate-400"
              title="Patient must complete payment and you must approve before video."
            >
              Join visit
            </span>
          )
        ) : null}
      </div>
    </article>
  )
}
